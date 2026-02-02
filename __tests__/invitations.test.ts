import request from "supertest";
import { Express } from "express";
import { createInvitationsRouter } from "../routes/invitationsRoute";
import type { Context } from ".keystone/types";
import * as bcrypt from "bcryptjs";

// Mock bcrypt
jest.mock("bcryptjs");

// Mock the email controller
jest.mock("../controllers/sendInviteController", () => ({
  inviteEmail: jest.fn().mockResolvedValue(true),
}));

// Mock Jest functions
const mockFindMany = jest.fn();
const mockFindOne = jest.fn();
const mockCreateOne = jest.fn();
const mockUpdateOne = jest.fn();

// Mock permissions
jest.mock("../utils/access", () => ({
  permissions: {
    isAdminLike: jest.fn(() => true),
  },
  isSignedIn: jest.fn(() => true),
}));

// Mock Keystone context
const createMockContext = (sessionData?: any) => {
  const mockDb = {
    User: {
      findMany: mockFindMany,
    },
    Project: {
      updateOne: mockUpdateOne,
    },
    ProjectInvitation: {
      createOne: mockCreateOne,
      findOne: mockFindOne,
      findMany: mockFindMany, // Add findMany for checking existing invitations
    },
    InvitationToken: {
      findMany: mockFindMany,
      findOne: mockFindOne,
      createOne: mockCreateOne,
      updateOne: mockUpdateOne,
    },
  };

  return {
    session: sessionData ? { data: sessionData } : undefined,
    req: {},
    sudo: jest.fn(() => ({
      db: mockDb,
    })),
    db: mockDb,
    withRequest: jest.fn((req, res) => ({
      session: sessionData ? { data: sessionData } : undefined,
      req,
      sudo: jest.fn(() => ({
        db: mockDb,
      })),
      db: mockDb,
    })),
  } as unknown as Context;
};

// Create Express app for testing
const createTestApp = (context: Context) => {
  const express = require("express");
  const app: Express = express();
  app.use(express.json());
  const router = createInvitationsRouter(context);
  app.use(router);
  return app;
};

describe("Invitations Route", () => {
  let app: Express;
  let mockContext: Context;

  const mockSession = {
    id: "user-123",
    email: "admin@example.com",
    name: "Admin User",
  };

  const mockProject = {
    id: "project-123",
    name: "Test Project",
  };

  const mockProjectInvitation = {
    id: "invitation-123",
    email: "student@example.com",
    projectId: "project-123",
  };

  const mockInvitationToken = {
    id: "token-123",
    tokenHash: "hashed-token",
    project: "invitation-123", // This is the GraphQL field name
    projectId: "invitation-123", // This is what the route code checks
    roleToGrant: "Student",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 1,
    usedCount: 0,
    revoked: false,
    notes: "Test invitation",
  };

  beforeEach(() => {
    mockContext = createMockContext(mockSession);
    app = createTestApp(mockContext);
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFindMany.mockResolvedValue([]);
    mockCreateOne.mockResolvedValue(mockInvitationToken);
    mockUpdateOne.mockResolvedValue(mockInvitationToken);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-token");
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
  });

  describe("POST /:projectId/invitations", () => {
    const validInvitationData = {
      roleToGrant: "student",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxUses: 1,
      notes: "Test invitation",
      recipientEmail: "student@example.com",
      recipientName: "Test Student",
    };

    it("should create a new invitation successfully", async () => {
      // First findMany checks for existing ProjectInvitation (none found)
      mockFindMany.mockResolvedValueOnce([]);

      // Mock ProjectInvitation creation
      mockCreateOne.mockResolvedValueOnce({
        ...mockProjectInvitation,
        id: "new-invitation-123",
      });

      // Mock InvitationToken creation
      mockCreateOne.mockResolvedValueOnce({
        ...mockInvitationToken,
        id: "new-token-123",
      });

      const response = await request(app)
        .post("/project-123/invitations")
        .send(validInvitationData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("inviteLink");
      expect(response.body).toHaveProperty("tokenId");
      expect(response.body).toHaveProperty("expiresAt");
      expect(response.body.message).toContain("New invitation token created");
      expect(response.body.inviteLink).toMatch(/accept-invitation\?token=.*&invitationId=/);
    });

    it("should normalize role to proper case", async () => {
      // First findMany checks for existing ProjectInvitation (none found)
      mockFindMany.mockResolvedValueOnce([]);
      mockCreateOne.mockResolvedValueOnce(mockProjectInvitation);
      mockCreateOne.mockResolvedValueOnce(mockInvitationToken);

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          roleToGrant: "student", // lowercase
        });

      expect(response.status).toBe(200);
      // Verify the token was created with capitalized role
      expect(mockCreateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roleToGrant: "Student", // Should be capitalized
          }),
        })
      );
    });

    it("should return 401 when user is not authenticated", async () => {
      const unauthApp = createTestApp(createMockContext());

      const response = await request(unauthApp)
        .post("/project-123/invitations")
        .send(validInvitationData);

      expect(response.status).toBe(401);
      expect(response.text).toContain("Authentication required");
    });

    it("should return 400 when expiresAt is missing", async () => {
      const invalidData = { ...validInvitationData };
      delete (invalidData as any).expiresAt;

      const response = await request(app).post("/project-123/invitations").send(invalidData);

      expect(response.status).toBe(400);
      expect(response.text).toContain("expiresAt");
    });

    it("should return 400 when expiresAt is invalid", async () => {
      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          expiresAt: "invalid-date",
        });

      expect(response.status).toBe(400);
      expect(response.text).toContain("expiresAt");
    });

    it("should return 400 when email format is invalid", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          recipientEmail: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.text).toContain("Invalid email format");
    });

    it("should return 400 when role is invalid", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          roleToGrant: "InvalidRole",
        });

      expect(response.status).toBe(400);
      expect(response.text).toContain("Invalid role");
    });

    it("should return 400 when maxUses is too low", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          maxUses: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.error).toContain("Invalid maxUses");
      expect(response.body.details.field).toBe("maxUses");
    });

    it("should return 400 when maxUses is too high", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          maxUses: 101,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.error).toContain("Invalid maxUses");
      expect(response.body.details.field).toBe("maxUses");
    });

    it("should return 400 when notes exceed max length", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          notes: "x".repeat(1001),
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.error).toContain("Notes too long");
      expect(response.body.details.field).toBe("notes");
    });

    it("should create invitation with user if studentId provided", async () => {
      const mockUser = {
        id: "student-123",
        email: "student@example.com",
        name: "Test Student",
      };

      const mockSender = {
        id: mockSession.id,
        email: mockSession.email,
        name: mockSession.name,
      };

      // Reset and set up mockFindMany to return specific values based on call order
      mockFindMany.mockReset();
      let findManyCallCount = 0;
      mockFindMany.mockImplementation(async () => {
        findManyCallCount++;
        if (findManyCallCount === 1) return [mockUser]; // Student lookup
        if (findManyCallCount === 2) return [mockSender]; // Sender lookup
        return []; // ProjectInvitation check
      });

      mockCreateOne.mockReset();
      mockCreateOne
        .mockResolvedValueOnce(mockProjectInvitation) // First call: create ProjectInvitation
        .mockResolvedValueOnce(mockInvitationToken); // Second call: create InvitationToken

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          ...validInvitationData,
          studentId: "student-123",
        });

      expect(response.status).toBe(200);
      // Verify ProjectInvitation was created with user connection
      expect(mockCreateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "student@example.com", // Should use student's email, not recipientEmail
            user: { connect: { id: "student-123" } },
          }),
        })
      );
    });

    it("should create new token even if valid token exists (no reuse)", async () => {
      const existingToken = {
        ...mockInvitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        usedCount: 0,
        maxUses: 5,
      };

      // First findMany looks for existing ProjectInvitation
      mockFindMany.mockResolvedValueOnce([mockProjectInvitation]);
      // Always creates new token (no reuse logic)
      mockCreateOne.mockResolvedValueOnce(mockInvitationToken);

      const response = await request(app)
        .post("/project-123/invitations")
        .send(validInvitationData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New invitation token created");
      // Verify new token was created (not reused)
      expect(response.body).toHaveProperty("inviteLink");
      expect(response.body).toHaveProperty("tokenId");
    });

    it("should handle database errors gracefully", async () => {
      mockFindMany.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/project-123/invitations")
        .send(validInvitationData);

      expect(response.status).toBe(500);
      expect(response.text).toContain("Database error"); // Should return the actual error message
    });

    it("should generate secure random tokens", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation
      mockCreateOne.mockResolvedValueOnce(mockProjectInvitation);
      mockCreateOne.mockResolvedValueOnce(mockInvitationToken);

      const response = await request(app)
        .post("/project-123/invitations")
        .send(validInvitationData);

      expect(response.status).toBe(200);
      expect(response.body.inviteLink).toMatch(/token=[a-zA-Z0-9_-]+/);
      expect(bcrypt.hash).toHaveBeenCalled(); // Should hash the token
    });
  });

  describe("POST /accept", () => {
    const validAcceptData = {
      token: "raw-token-value",
      invitationId: "token-123",
    };

    beforeEach(() => {
      mockFindOne.mockResolvedValue(mockInvitationToken);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
    });

    it("should accept a valid invitation", async () => {
      mockFindOne.mockResolvedValueOnce(mockInvitationToken); // Token lookup
      mockFindOne.mockResolvedValueOnce(mockProjectInvitation); // ProjectInvitation lookup
      mockUpdateOne.mockResolvedValueOnce({}); // Project update
      mockUpdateOne.mockResolvedValueOnce({}); // Token usedCount update

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Invitation accepted");
      expect(response.body.projectId).toBe(mockProjectInvitation.projectId);
    });

    it("should return 401 when user is not authenticated", async () => {
      const unauthApp = createTestApp(createMockContext());

      const response = await request(unauthApp).post("/accept").send(validAcceptData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Not authenticated");
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("should return 400 when token is missing", async () => {
      const response = await request(app).post("/accept").send({
        invitationId: "token-123",
        // token is missing
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing token");
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 when token is invalid", async () => {
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false); // Invalid token

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Invalid or expired token");
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should return 404 when token is expired", async () => {
      const expiredToken = {
        ...mockInvitationToken,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      mockFindOne.mockResolvedValueOnce(expiredToken);

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Invalid or expired token");
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should return 404 when token is revoked", async () => {
      const revokedToken = {
        ...mockInvitationToken,
        revoked: true,
      };

      mockFindOne.mockResolvedValueOnce(revokedToken);

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(404);
      expect(response.body.).toContain("Invalid or expired token");
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should return 400 when usage limit exceeded", async () => {
      const usedUpToken = {
        ...mockInvitationToken,
        usedCount: 1,
        maxUses: 1,
      };

      mockFindOne.mockResolvedValueOnce(usedUpToken);

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Token usage limit exceeded");
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("should increment usedCount on successful acceptance", async () => {
      mockFindOne.mockResolvedValueOnce(mockInvitationToken);
      mockFindOne.mockResolvedValueOnce(mockProjectInvitation);
      mockUpdateOne.mockResolvedValueOnce({}); // Project update
      mockUpdateOne.mockResolvedValueOnce({}); // Token usedCount update

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(200);
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockInvitationToken.id },
          data: { usedCount: 1 }, // Should increment from 0 to 1
        })
      );
    });

    it("should add user to project on acceptance", async () => {
      mockFindOne.mockResolvedValueOnce(mockInvitationToken);
      mockFindOne.mockResolvedValueOnce(mockProjectInvitation);
      mockUpdateOne.mockResolvedValueOnce({}); // Project update
      mockUpdateOne.mockResolvedValueOnce({}); // Token usedCount update

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(200);
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockProjectInvitation.projectId },
          data: { members: { connect: { id: mockSession.id } } },
        })
      );
    });

    it("should work without invitationId by searching all tokens", async () => {
      mockFindMany.mockResolvedValueOnce([mockInvitationToken]); // Search all tokens
      mockFindOne.mockResolvedValueOnce(mockProjectInvitation);
      mockUpdateOne.mockResolvedValueOnce({});
      mockUpdateOne.mockResolvedValueOnce({});

      const response = await request(app).post("/accept").send({
        token: "raw-token-value",
        // No invitationId
      });

      expect(response.status).toBe(200);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            revoked: { equals: false },
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      mockFindOne.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).post("/accept").send(validAcceptData);

      expect(response.status).toBe(500);
      expect(response.text).toContain("Database error"); // Should return the actual error message
    });
  });

  describe("POST /:projectId/invitationTokens", () => {
    const validTokenData = {
      roleToGrant: "Student",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxUses: 1,
      notes: "Test token",
    };

    it("should create a new invitation token", async () => {
      mockCreateOne.mockResolvedValueOnce(mockInvitationToken);

      const response = await request(app)
        .post("/project-123/invitationTokens")
        .send(validTokenData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("inviteLink");
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("expiresAt");
    });

    it("should return 401 when user is not authenticated", async () => {
      const unauthApp = createTestApp(createMockContext());

      const response = await request(unauthApp)
        .post("/project-123/invitationTokens")
        .send(validTokenData);

      expect(response.status).toBe(401);
      expect(response.text).toContain("Authentication required");
    });

    it("should return 400 when expiresAt is missing", async () => {
      const invalidData = { ...validTokenData };
      delete (invalidData as any).expiresAt;

      const response = await request(app).post("/project-123/invitationTokens").send(invalidData);

      expect(response.status).toBe(400);
      expect(response.text).toContain("expiresAt");
    });
  });

  describe("Security", () => {
    it("should hash tokens before storing", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation
      mockCreateOne.mockResolvedValueOnce(mockProjectInvitation);
      mockCreateOne.mockResolvedValueOnce(mockInvitationToken);

      const validInvitationData = {
        roleToGrant: "Student",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxUses: 1,
        recipientEmail: "student@example.com",
        recipientName: "Test Student",
      };

      await request(app).post("/project-123/invitations").send(validInvitationData);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockCreateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenHash: expect.any(String),
          }),
        })
      );
    });

    it("should never store raw tokens in database", async () => {
      mockFindMany.mockResolvedValueOnce([]); // No existing ProjectInvitation
      mockCreateOne.mockResolvedValueOnce(mockProjectInvitation);
      mockCreateOne.mockResolvedValueOnce(mockInvitationToken);

      const response = await request(app)
        .post("/project-123/invitations")
        .send({
          roleToGrant: "Student",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxUses: 1,
          recipientEmail: "student@example.com",
          recipientName: "Test Student",
        });

      const rawToken = response.body.inviteLink.match(/token=([^&]+)/)?.[1];

      // Verify raw token is NOT stored
      expect(mockCreateOne).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenHash: rawToken,
          }),
        })
      );
    });
  });
});
