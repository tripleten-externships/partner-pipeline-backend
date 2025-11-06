import { Router } from "express";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import type { Context } from ".keystone/types";
import { inviteEmail } from "../controllers/sendInviteController";
import express from "express";
import type { Request } from "express";
import { permissions } from "../utils/access";

// Validation constants
const ALLOWED_ROLES = ["Student", "Project Mentor", "Mentor", "Admin"] as const;
const MAX_USES_MIN = 1;
const MAX_USES_MAX = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 255;
const MAX_NOTES_LENGTH = 1000;

// Security constants
const TOKEN_BYTE_SIZE = 32; // Size in bytes for crypto.randomBytes
const BCRYPT_SALT_ROUNDS = 10; // Number of rounds for bcrypt hashing
const DEFAULT_FRONTEND_URL = "http://localhost:3000"; // Fallback frontend URL

// Error response helpers
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
}

function createErrorResponse(code: string, message: string, details?: any): ErrorResponse {
  return {
    error: message,
    code,
    ...(details && { details }),
  };
}

// Validation helpers
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function isValidRole(role: string): boolean {
  return ALLOWED_ROLES.includes(role as any);
}

function isValidMaxUses(maxUses: number): boolean {
  return Number.isInteger(maxUses) && maxUses >= MAX_USES_MIN && maxUses <= MAX_USES_MAX;
}

export function createInvitationsRouter(commonContext: Context) {
  const router = express.Router();
  router.use(express.json());

  // Health check
  router.get("/api/_invites/health", (_req, res) => res.send("ok-invites"));

  // Create raw token and return followable link
  router.post("/:projectId/invitationTokens", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    const session = (context.session as any)?.data;
    const body = (context.req as Request).body;

    // Check authentication
    if (!session?.id) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Authentication required"));
    }

    // Check authorization - only admins can create invitations
    if (!permissions.isAdminLike()) {
      return res.status(403).json(createErrorResponse("FORBIDDEN", "Admin access required"));
    }

    const { roleToGrant = "Student", expiresAt, maxUses = 1, notes = "" } = body ?? {};

    // Validate expiresAt
    if (!expiresAt || isNaN(Date.parse(expiresAt))) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "expiresAt (ISO) is required and must be valid", {
          field: "expiresAt",
          value: expiresAt,
        })
      );
    }

    // Validate roleToGrant
    if (!isValidRole(roleToGrant)) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Invalid role", {
          field: "roleToGrant",
          value: roleToGrant,
          allowedValues: ALLOWED_ROLES,
        })
      );
    }

    // Validate maxUses
    const maxUsesNum = Number(maxUses);
    if (!isValidMaxUses(maxUsesNum)) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Invalid maxUses value", {
          field: "maxUses",
          value: maxUses,
          min: MAX_USES_MIN,
          max: MAX_USES_MAX,
        })
      );
    }

    // Validate notes length
    if (notes.length > MAX_NOTES_LENGTH) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Notes too long", {
          field: "notes",
          currentLength: notes.length,
          maxLength: MAX_NOTES_LENGTH,
        })
      );
    }

    try {
      const rawToken = crypto.randomBytes(TOKEN_BYTE_SIZE).toString("base64url");
      const tokenHash = await bcrypt.hash(rawToken, BCRYPT_SALT_ROUNDS);

      const created = await context.db.InvitationToken.createOne({
        data: {
          tokenHash,
          project: { connect: { id: req.params.projectId } },
          roleToGrant,
          expiresAt: new Date(expiresAt).toISOString(),
          maxUses: maxUsesNum,
          createdBy: { connect: { id: session.id } },
          notes,
        },
      });
      // Generate followable invite link
      const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
      const inviteLink = `${frontendUrl}/accept-invitation?token=${rawToken}&invitationId=${created.id}`;

      res.json({
        id: created.id,
        token: rawToken, // Raw token (send this via email)
        inviteLink, // Followable link
        expiresAt: created.expiresAt,
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json(
        createErrorResponse("SERVER_ERROR", "Failed to create invitation token", {
          message: err?.message,
        })
      );
    }
  });

  // Create or update invitation and send email
  router.post("/:projectId/invitations", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    const session = (context.session as any)?.data;

    const body = ((context.req as Request)?.body ?? {}) as {
      roleToGrant?: string;
      expiresAt?: string;
      maxUses?: number;
      notes?: string;
      studentId?: string;
      recipientEmail?: string;
      recipientName?: string;
      token?: string;
    };

    // Check authentication
    if (!session?.id) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Authentication required"));
    }

    // Check authorization - only admins can create invitations
    if (!permissions.isAdminLike()) {
      return res.status(403).json(createErrorResponse("FORBIDDEN", "Admin access required"));
    }

    const {
      roleToGrant = "Student",
      expiresAt,
      maxUses = 1,
      notes = "",
      studentId = "",
      recipientEmail = "",
      recipientName = "",
    } = body;

    // Validate recipientEmail
    if (recipientEmail && !isValidEmail(recipientEmail)) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Invalid email format", {
          field: "recipientEmail",
          value: recipientEmail,
        })
      );
    }

    // Validate recipientName length
    if (recipientName && recipientName.length > MAX_NAME_LENGTH) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Recipient name too long", {
          field: "recipientName",
          currentLength: recipientName.length,
          maxLength: MAX_NAME_LENGTH,
        })
      );
    }

    // Validate notes length
    if (notes.length > MAX_NOTES_LENGTH) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Notes too long", {
          field: "notes",
          currentLength: notes.length,
          maxLength: MAX_NOTES_LENGTH,
        })
      );
    }

    // Validate expiresAt
    if (!expiresAt || isNaN(Date.parse(expiresAt))) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "expiresAt is required and must be valid", {
          field: "expiresAt",
          value: expiresAt,
        })
      );
    }

    // Validate maxUses
    const maxUsesNum = Number(maxUses);
    if (!isValidMaxUses(maxUsesNum)) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Invalid maxUses value", {
          field: "maxUses",
          value: maxUses,
          min: MAX_USES_MIN,
          max: MAX_USES_MAX,
        })
      );
    }

    // Normalize roleToGrant to match the expected format
    // For single word roles like "student", capitalize first letter
    // For multi-word roles like "project mentor", capitalize each word
    const normalizedRole = roleToGrant
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Validate role after normalization
    if (!isValidRole(normalizedRole)) {
      return res.status(400).json(
        createErrorResponse("VALIDATION_ERROR", "Invalid role", {
          field: "roleToGrant",
          value: roleToGrant,
          normalizedValue: normalizedRole,
          allowedValues: ALLOWED_ROLES,
        })
      );
    }

    const expirationDate = new Date(expiresAt);
    const currentDate = new Date();

    // Handle both existing user invitations and email-based invitations
    let student = null;
    let studentEmail = recipientEmail;
    let studentName = recipientName;

    if (studentId) {
      [student] = await context.db.User.findMany({ where: { id: { equals: studentId } } });
      studentName = student?.name ?? "Student";
      studentEmail = student?.email ?? "";
    }

    // Get sender info from session (already validated above)
    const [sender] = await context.db.User.findMany({ where: { id: { equals: session.id } } });
    const senderName = sender?.name ?? "Sender";
    const senderEmail = sender?.email ?? "";

    try {
      // STEP 1: Check for existing ProjectInvitation for this email and project
      const [existingProjectInvitation] = await context.sudo().db.ProjectInvitation.findMany({
        where: {
          email: { equals: studentEmail },
          project: { id: { equals: req.params.projectId } },
        },
        take: 1,
      });

      let projectInvitation;
      if (existingProjectInvitation) {
        projectInvitation = existingProjectInvitation;
      } else {
        // Create new ProjectInvitation if none exists
        const invitationData: any = {
          email: studentEmail,
          project: { connect: { id: req.params.projectId } },
        };

        if (studentId && student) {
          invitationData.user = { connect: { id: studentId } };
        }

        // Use sudo() to bypass access controls since we don't have a valid session
        projectInvitation = await context.sudo().db.ProjectInvitation.createOne({
          data: invitationData,
        });
      }

      // STEP 2: Always create a new token (no reuse - simpler and more secure)
      // Old tokens can expire naturally or be revoked if needed
      const rawToken = crypto.randomBytes(TOKEN_BYTE_SIZE).toString("base64url");
      const tokenHash = await bcrypt.hash(rawToken, BCRYPT_SALT_ROUNDS);

      const created = await context.sudo().db.InvitationToken.createOne({
        data: {
          tokenHash,
          project: { connect: { id: projectInvitation.id } }, // Connect to ProjectInvitation
          roleToGrant: normalizedRole,
          expiresAt: expirationDate.toISOString(),
          maxUses: maxUsesNum,
          notes,
        },
      });

      const tokenId = created.id;

      // Generate followable invite link with RAW token
      const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
      const inviteLink = `${frontendUrl}/accept-invitation?token=${rawToken}&invitationId=${tokenId}`;

      // Send email with RAW token instead of hash
      if (studentEmail && senderEmail && rawToken) {
        await inviteEmail(studentName, studentEmail, senderName, senderEmail, inviteLink);
      }

      res.json({
        message: "New invitation token created",
        tokenId,
        inviteLink, // Return the followable link
        expiresAt: expirationDate.toISOString(),
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json(
        createErrorResponse("SERVER_ERROR", "Failed to process invitation", {
          message: err?.message,
        })
      );
    }
  });

  // Accept invitation
  router.post("/accept", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    const session = (context.session as any)?.data;
    const { token, invitationId } = (context.req as Request)?.body ?? {};

    if (!session?.id) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Not authenticated"));
    }
    if (!token) {
      return res
        .status(400)
        .json(createErrorResponse("VALIDATION_ERROR", "Missing token", { field: "token" }));
    }

    try {
      let match;

      if (invitationId) {
        // If we have the invitationId, fetch that specific token
        const specificToken = await context.db.InvitationToken.findOne({
          where: { id: invitationId },
        });

        if (
          specificToken &&
          new Date(specificToken.expiresAt) > new Date() &&
          !specificToken.revoked &&
          bcrypt.compareSync(token, specificToken.tokenHash)
        ) {
          match = specificToken;
        }
      } else {
        // Fallback: search all tokens (less efficient)
        const tokens = await context.db.InvitationToken.findMany({
          where: {
            expiresAt: { gt: new Date().toISOString() },
            revoked: { equals: false },
          },
        });

        match = tokens.find((t) => bcrypt.compareSync(token, t.tokenHash));
      }

      if (!match) {
        return res.status(404).json(
          createErrorResponse("NOT_FOUND", "Invalid or expired token", {
            providedInvitationId: invitationId,
          })
        );
      }

      if ((match.usedCount ?? 0) >= (match.maxUses ?? 1)) {
        return res.status(400).json(
          createErrorResponse("VALIDATION_ERROR", "Token usage limit exceeded", {
            usedCount: match.usedCount,
            maxUses: match.maxUses,
          })
        );
      }

      const invitationRecordId = match.projectId;
      if (!invitationRecordId) {
        return res.status(404).json(
          createErrorResponse("NOT_FOUND", "Invitation not linked to a project", {
            tokenId: match.id,
          })
        );
      }

      // Fetch the ProjectInvitation
      const invitation = await context.sudo().db.ProjectInvitation.findOne({
        where: { id: invitationRecordId },
      });

      const projectId = invitation?.projectId;
      if (!projectId) {
        return res.status(404).json(
          createErrorResponse("NOT_FOUND", "Project not found", {
            invitationId: invitationRecordId,
          })
        );
      }

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
      res.status(500).json(
        createErrorResponse("SERVER_ERROR", "Failed to accept invitation", {
          message: err?.message,
        })
      );
    }
  });

  return router;
}
