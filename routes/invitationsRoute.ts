import { Router } from "express";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import type { Context } from ".keystone/types";
import { inviteEmail } from "../controllers/sendInviteController";
import express from "express";
import type { Request } from "express";

export function createInvitationsRouter(commonContext: Context) {
  const router = express.Router();
  router.use(express.json()); 

  // Health check
  router.get("/api/_invites/health", (_req, res) => res.send("ok-invites"));

  // Create raw token
  router.post("/:projectId/invitationTokens", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    const session = (context.session as any)?.data;
    const body = (context.req as Request).body;


    if (!session?.isAdmin) return res.status(403).send("Not authorized");
    //console.log("Session:", session);
    //console.log("Raw body:", body);

    const { roleToGrant = "Student", expiresAt, maxUses = 1, notes = "" } = body ?? {};
    console.log("Raw expiresAt:", body.expiresAt);
    if (!expiresAt || isNaN(Date.parse(expiresAt))) {
      //console.log("Missing expiresAt. Full body:", body);
      return res.status(400).send("expiresAt (ISO) is required and must be valid");
    }

    try {
      const rawToken = crypto.randomBytes(32).toString("base64url");
      const tokenHash = await bcrypt.hash(rawToken, 10);
      //console.log("Raw expiresAt:", body.expiresAt);

      const created = await context.db.InvitationToken.createOne({
        data: {
          tokenHash,
          project: { connect: { id: req.params.projectId } },
          roleToGrant,
          expiresAt: new Date(expiresAt).toISOString(),
          maxUses: Number(maxUses),
          createdBy: { connect: { id: session.id } },
          notes,
        },
      });

      res.json({ id: created.id, token: rawToken });
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err?.message || "Failed to create invitation");
    }
  });

  // Create or update invitation and send email
 router.post("/api/projects/:projectId/invitation", async (req, res) => {
  const context = await commonContext.withRequest(req, res);
  const session = (context.session as any)?.data;

const body = ((context.req as Request)?.body ?? {}) as {
    roleToGrant?: string;
    expiresAt?: string;
    maxUses?: number;
    notes?: string;
    studentId?: string;
    token?: string;
  };

  if (!session?.isAdmin) return res.status(403).send("Not authorized");

  const {
    roleToGrant = "Student",
    expiresAt,
    maxUses = 1,
    notes = "",
    studentId = "",
    token,
  } = body;

  console.log("expiresAt received:", expiresAt);
  if (!expiresAt || isNaN(Date.parse(expiresAt))) {
    return res.status(400).send("expiresAt is required and must be valid");
  }
    const expirationDate = new Date(expiresAt);
    const currentDate = new Date();

    const [student] = await context.db.User.findMany({ where: { id: { equals: studentId } } });
    const [sender] = await context.db.User.findMany({ where: { id: { equals: session.id } } });

    const studentName = student?.name ?? "Student";
    const studentEmail = student?.email ?? "";
    const senderName = sender?.name ?? "Sender";
    const senderEmail = sender?.email ?? "";

    try {
      const [existingToken] = await context.db.InvitationToken.findMany({
        where: { project: { id: { equals: req.params.projectId } } },
        orderBy: { expiresAt: "desc" },
        take: 1,
      });

      const canUpdate =
        existingToken &&
        new Date(existingToken.expiresAt) > currentDate &&
        (existingToken.usedCount ?? 0) < (existingToken.maxUses ?? 1);

      let tokenId: string;
      let tokenHash: string;

      if (canUpdate) {
        await context.db.InvitationToken.updateOne({
          where: { id: existingToken.id },
          data: { usedCount: (existingToken.usedCount ?? 0) + 1 },
        });
        tokenId = existingToken.id;
        tokenHash = existingToken.tokenHash;
      } else {
        const rawToken = crypto.randomBytes(32).toString("base64url");
        tokenHash = await bcrypt.hash(rawToken, 10);

        const created = await context.db.InvitationToken.createOne({
          data: {
            tokenHash,
            project: { connect: { id: req.params.projectId } },
            roleToGrant,
            expiresAt: expirationDate.toISOString(),
            maxUses: Number(maxUses),
            createdBy: { connect: { id: session.id } },
            notes,
          },
        });

        tokenId = created.id;
      }

      await context.db.ProjectInvitation.createOne({
        data: {
          email: studentEmail,
          user: { connect: { id: studentId } },
          project: { connect: { id: req.params.projectId } },
        },
      });

      if (studentEmail && senderEmail && tokenHash) {
        await inviteEmail(studentName, studentEmail, senderName, senderEmail, tokenHash);
      }

      res.json({ message: canUpdate ? "Invitation token updated" : "New invitation token created", tokenId });
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err?.message || "Failed to process invitation");
    }
  });

 // Accept invitation
router.post("/accept", async (req, res) => {
  const context = await commonContext.withRequest(req, res);
  const session = (context.session as any)?.data;
  const { token } = (context.req as Request)?.body ?? {};

  //console.log("Session:", session);
  //console.log("Token received:", token);

  if (!session?.id) return res.status(401).send("Not authenticated");
  if (!token) return res.status(400).send("Missing token");

  try {
    // Fetch all non-expired tokens
    const tokens = await context.db.InvitationToken.findMany({
      where: {
        expiresAt: { gt: new Date().toISOString() },
        revoked: { equals: false },
      },
    });

    //console.log("Fetched tokens:", tokens.length);

    // Find matching token
    const match = tokens.find((t) => {
      const isMatch = bcrypt.compareSync(token, t.tokenHash);
      //console.log("Token ID:", t.id);
      //console.log("Hash:", t.tokenHash);
      //console.log("Match:", isMatch);
      return isMatch;
    });

    //console.log("Match found:", !!match);
    if (!match) return res.status(404).send("Invalid or expired token");
    if ((match.usedCount ?? 0) >= (match.maxUses ?? 1)) {
      return res.status(400).send("Token usage exceeded");
    }

    const invitationId = match.projectId;
    if (!invitationId) return res.status(404).send("Invitation not linked to a project");

    // Fetch the ProjectInvitation
    const invitation = await context.sudo().db.ProjectInvitation.findOne({
      where: { id: invitationId },
    });

    //console.log("Resolved invitation:", invitation);
    const projectId = invitation?.projectId;
    if (!projectId) return res.status(404).send("Project not found");

    // Add user to the project
    await context.sudo().db.Project.updateOne({
      where: { id: projectId },
      data: { members: { connect: { id: session.id } } },
    });

    // Increment usedCount
    await context.sudo().db.InvitationToken.updateOne({
      where: { id: match.id },
      data: { usedCount: (match.usedCount ?? 0) + 1 },
    });

    res.json({ message: "Invitation accepted", projectId });
  } catch (err: any) {
    console.error("Error accepting invitation:", err);
    res.status(500).send(err?.message || "Failed to accept invitation");
  }
});

return router;
}