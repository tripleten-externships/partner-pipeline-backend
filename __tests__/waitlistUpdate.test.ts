import request from "supertest";
import { Express } from "express";
import { createWaitlistRouter } from "../routes/waitlistRoute";
import type { Context } from ".keystone/types";

// Mock jest funstions
const mockWaitlistFindOne = jest.fn();
const mockWaitlistFindMany = jest.fn();
const mockWaitlistUpdateOne = jest.fn();
const mockActivityCreateOne = jest.fn();

// Mock Keystone context
const createMockContext = (sessionData?: any) => {
  const mockQuery = {
    waitListStudent: {
      findOne: mockWaitlistFindOne,
      findMany: mockWaitlistFindMany,
      updateOne: mockWaitlistUpdateOne,
    },
    ActivityLog: {
      createOne: mockActivityCreateOne,
    },
  };

  return {
    session: sessionData ? { data: sessionData } : undefined,
    req: {},
    query: mockQuery,
    withRequest: jest.fn((req, res) => ({
      session: sessionData ? { data: sessionData } : undefined,
      req,
      query: mockQuery,
    })),
  } as unknown as Context;
};

// Create express app with the waitlist router
const createTestApp = (context: Context) => {
  const express = require("express");
  const app: Express = express();
  app.use(express.json());
  const apiRouter = express.Router();
  apiRouter.use("/waitlist", createWaitlistRouter(context));
  app.use("/api", apiRouter);
  return app;
};

// Test suite for waitlist update endpoint
describe("PUT api/waitlist/:id", () => {
  let app: Express;

  // 200 OK
  const adminSession = {
    id: "admin-123",
    isAdmin: true,
  };

  // 403 Forbidden
  const nonAdminSession = {
    id: "user-456",
    isAdmin: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp(createMockContext(adminSession));

    // Existing student
    mockWaitlistFindOne.mockResolvedValue({
      id: "waitlist-123",
      name: "Old Name",
      email: "old@example.com",
      status: "pending",
      notes: "Old notes",
    });

    // No duplicate email found
    mockWaitlistFindMany.mockResolvedValue([]);

    // Update succeeds
    mockWaitlistUpdateOne.mockResolvedValue({
      id: "waitlist-123",
      name: "Old Name",
      email: "new@example.com",
      status: "pending",
      notes: "Old notes",
    });

    mockActivityCreateOne.mockResolvedValue({ id: "activity-123" });
  });

  // Not signed in
  it("returns 401 when not signed in", async () => {
    const unauthApp = createTestApp(createMockContext());

    const response = await request(unauthApp)
      .put("/api/waitlist/waitlist-123")
      .send({ notes: "Updated notes" }); // any valid field works

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.body.error.message).toBe("Not signed in");
  });

  // Not admin
  it("returns 403 when not admin", async () => {
    const nonAdminApp = createTestApp(createMockContext(nonAdminSession));

    const response = await request(nonAdminApp)
      .put("/api/waitlist/waitlist-123")
      .send({ notes: "Updated notes" }); // any valid field works

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(response.body.error.message).toBe("Admin access required");
  });

  // Duplicate email conflict
  it("returns 409 when email is already used by another student", async () => {
    mockWaitlistFindMany.mockResolvedValueOnce([{ id: "waitlist-999" }]);

    const response = await request(app)
      .put("/api/waitlist/waitlist-123")
      .send({ email: "taken@example.com" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    expect(response.body.error.message).toBe("Email already in use by another student");

    // Should not proceed to update
    expect(mockWaitlistUpdateOne).not.toHaveBeenCalled();
  });

  // Successful update + status change logs activity
  it("updates status, creates activity log, and returns 200", async () => {
    const existingStudent = {
      id: "waitlist-123",
      name: "Old Name",
      email: "old@example.com",
      status: "pending",
      notes: "Old notes",
    };

    const updatedStudent = {
      ...existingStudent,
      status: "invited",
    };

    // Emsure the status before update is "pending"
    mockWaitlistFindOne.mockResolvedValueOnce(existingStudent);

    // Mock the updated record returned from updateOne
    mockWaitlistUpdateOne.mockResolvedValueOnce(updatedStudent);

    const response = await request(app)
      .put("/api/waitlist/waitlist-123")
      .send({ status: "invited" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: updatedStudent });

    // findOne called to load existing student
    expect(mockWaitlistFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "waitlist-123" },
      })
    );

    // updateOne called with updated status
    expect(mockWaitlistUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "waitlist-123" },
        data: expect.objectContaining({ status: "invited" }),
      })
    );

    // Status change should create activity log
    expect(mockActivityCreateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          updatedBy: { connect: { id: adminSession.id } },
          oldStatus: "pending",
          newStatus: "invited",
        }),
      })
    );
  });
});
