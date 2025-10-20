import { Router } from "express";
import crypto, { randomUUID } from "crypto";
import * as bcrypt from "bcryptjs";
import type { Context } from ".keystone/types";
import { inviteEmail } from "../controllers/sendInviteController";

export function createInvitationsRouter(commonContext: Context) {
  console.log("[invites] mounting invitations router");
  const router = Router();

  router.get("/api/_invites/health", (_req, res) => res.send("ok-invites"));

  router.post("/api/projects/:projectId/invitationTokens", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    if (!context) return res.status(500).send("Failed to get context");

    const session = (context.session as any)?.data as { id: string; isAdmin?: boolean } | undefined;
    if (!session?.isAdmin) return res.status(403).send("Not authorized");

    const { roleToGrant = "Student", expiresAt, maxUses = 1, notes = "" } = req.body ?? {};
    if (!expiresAt) return res.status(400).send("expiresAt (ISO) is required");

    try {
      const rawToken = crypto.randomBytes(32).toString("base64url");
      const tokenHash = await bcrypt.hash(rawToken, 10);

      const created = await context.db.InvitationToken.createOne({
        data: {
          tokenHash,
          project: { connect: { id: req.params.projectId } },
          roleToGrant,
          expiresAt: new Date(expiresAt).toISOString(),
          maxUses: Number(maxUses) || 1,
          createdBy: { connect: { id: session!.id } },
          notes,
        },
      });

      res.json({ id: created.id, token: rawToken });
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err?.message || "Failed to create invitation");
    }
  });

  router.post("/api/projects/:projectId/invitation", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    if (!context) return res.status(500).send("Failed to get context");

    const session = (context.session as any)?.data as { id: string; isAdmin?: boolean } | undefined;
    if (!session?.isAdmin) return res.status(403).send("Not authorized");

    const {
      roleToGrant = "Student",
      expiresAt,
      maxUses = 1,
      createdBy,
      notes = "",
      studentId = "",
    } = req.body ?? {};
    if (!expiresAt) return res.status(400).send("expiresAt is required");

    const student_record = await context.db.User.findMany({
      where: {
        id: { equals: studentId },
      },
    });

    const studentName = student_record[0]?.name ?? "Student";
    const studentEmail = student_record[0]?.email ?? "";

    const sender_record = await context.db.User.findMany({
      where: {
        id: { equals: session?.id },
      },
    });

    const senderName = sender_record[0]?.name ?? "Sender";
    const senderEmail = sender_record[0]?.email ?? "";

    try {
      const currentDate = new Date();
      const expirationDate = new Date(expiresAt);

      const records = await context.db.InvitationToken.findMany({
        where: {
          project: { id: { equals: req.params.projectId } },
        },
        orderBy: { expiresAt: "desc" },
        take: 1,
      });

      const record = records[0] ?? null;

      const canUpdate =
        !!record &&
        !!record.expiresAt &&
        new Date(record.expiresAt) > currentDate &&
        (record.usedCount ?? 0) < (record.maxUses ?? 1);

      if (canUpdate) {
        const usedCount = record!.usedCount ?? 0;
        await context.db.InvitationToken.updateOne({
          where: { id: record!.id },
          data: {
            usedCount: usedCount + 1,
          },
        });

        if (studentEmail && senderEmail && record?.tokenHash) {
          await inviteEmail(studentName, studentEmail, senderName, senderEmail, record.tokenHash);
        }
        const createdProjectInvitation = await context.db.ProjectInvitation.createOne({
          data: {
            email: studentEmail,
            user: { connect: { id: studentId } },
            project: { connect: { id: req.params.projectId } },
          },
        });
        return res.json({ message: "Invitation token updated", tokenId: record!.id });
      }

      const rawToken = crypto.randomBytes(32).toString("base64url");
      const tokenHash = await bcrypt.hash(rawToken, 10);

      const created = await context.db.InvitationToken.createOne({
        data: {
          tokenHash,
          project: { connect: { id: req.params.projectId } },
          roleToGrant,
          expiresAt: expirationDate.toISOString(),
          maxUses: Number(maxUses) || 1,
          createdBy: { connect: { id: session!.id } },
          notes,
        },
      });
      const createdProjectInvitation = await context.db.ProjectInvitation.createOne({
        data: {
          email: studentEmail,
          user: { connect: { id: studentId } },
          project: { connect: { id: req.params.projectId } },
        },
      });

      if (studentEmail && senderEmail && created?.tokenHash) {
        await inviteEmail(studentName, studentEmail, senderName, senderEmail, created.tokenHash);
      }
      return res.json({ message: "New invitation token created", tokenId: created.id });
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err?.message || "Failed to process invitation");
    }
  });

  return router;
}
