import { Router } from "express";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import type { Context } from ".keystone/types";

export function createInvitationsRouter(commonContext: Context) {
  console.log("[invites] mounting invitations router");
  const router = Router();

  router.get("/api/_invites/health", (_req, res) => res.send("ok-invites"));

  // create a token (admin-only)
  router.post("/api/projects/:projectId/invitations", async (req, res) => {
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

  return router;
}
