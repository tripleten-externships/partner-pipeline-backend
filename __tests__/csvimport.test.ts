import request from "supertest";
import { Express } from "express";
import { createCsvImportRouter } from "../routes/csvImportRoute";
import { KeystoneContext } from "@keystone-6/core/types";

// Mock the Jest functions
const mockFindMany = jest.fn();
const mockCreateOne = jest.fn();
const mockUpdateOne = jest.fn();

// Mock Keystone context
const mockContext = {
  sudo: jest.fn(() => ({
    query: {
      waitListStudent: {
        findMany: mockFindMany,
        createOne: mockCreateOne,
        updateOne: mockUpdateOne,
      },
    },
  })),
} as unknown as KeystoneContext;

// Create Express app for testing
const createTestApp = () => {
  const express = require("express");
  const app: Express = express();
  const router = createCsvImportRouter(mockContext);
  app.use(router);
  return app;
};

describe("CSV Import Route", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe("GET /_csv/health", () => {
    it("should return health check", async () => {
      const response = await request(app).get("/_csv/health");

      expect(response.status).toBe(200);
      expect(response.text).toBe("ok-csv-import");
    });
  });

  describe("POST /waitlist/import", () => {
    describe("Success Cases", () => {
      it("should import valid CSV with all fields", async () => {
        const csvContent =
          "name,email,status,joined\nJohn Doe,john@test.com,pending,2025-10-15\nJane Smith,jane@test.com,approved,2025-10-14";

        // Mock database responses
        mockFindMany
          .mockResolvedValueOnce([]) // No existing for John
          .mockResolvedValueOnce([]); // No existing for Jane

        mockCreateOne.mockResolvedValueOnce({ id: "1" }).mockResolvedValueOnce({ id: "2" });

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: "Import completed: 2 created, 0 updated",
          results: {
            created: 2,
            updated: 0,
            errors: [],
          },
        });
      });

      it("should import CSV with only required fields", async () => {
        const csvContent = "name,email\nJohn Doe,john@test.com";

        mockFindMany.mockResolvedValueOnce([]);
        mockCreateOne.mockResolvedValueOnce({ id: "1" });

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.created).toBe(1);

        // Verify default status was used
        expect(mockCreateOne).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: "pending",
          }),
        });
      });

      it("should update existing entries with duplicate emails", async () => {
        const csvContent = "name,email,status\nJohn Updated,john@test.com,approved";

        mockFindMany.mockResolvedValueOnce([
          { id: "existing-1", email: "john@test.com", createdAt: new Date("2025-01-01") },
        ]);
        mockUpdateOne.mockResolvedValueOnce({ id: "existing-1" });

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body.results.updated).toBe(1);
        expect(response.body.results.created).toBe(0);

        expect(mockUpdateOne).toHaveBeenCalledWith({
          where: { id: "existing-1" },
          data: expect.objectContaining({
            name: "John Updated",
            status: "approved",
          }),
        });
      });
    });

    describe("File Upload Error Handling", () => {
      it("should handle missing file", async () => {
        const response = await request(app).post("/waitlist/import");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: "No file uploaded",
        });
      });
    });

    describe("CSV Format Error Handling", () => {
      it("should reject empty CSV files", async () => {
        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(""), {
            filename: "empty.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: "CSV file is empty",
        });
      });

      it("should reject CSV with missing required columns", async () => {
        const csvContent = "fullname,email_address\nJohn Doe,john@test.com";

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Missing required columns");
        expect(response.body.required).toEqual(["name", "email"]);
        expect(response.body.found).toEqual(["fullname", "email_address"]);
      });
    });

    describe("Data Validation Error Handling", () => {
      it("should handle rows with missing name", async () => {
        const csvContent = "name,email\n,john@test.com\nJane Smith,jane@test.com";

        mockFindMany.mockResolvedValueOnce([]);
        mockCreateOne.mockResolvedValueOnce({ id: "1" });

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body.results).toEqual({
          created: 1,
          updated: 0,
          errors: ['Row with email "john@test.com": Name is required'],
        });
      });

      it("should handle invalid email formats", async () => {
        const csvContent = "name,email\nJohn Doe,invalid-email\nJane Smith,jane@test.com";

        mockFindMany.mockResolvedValueOnce([]);
        mockCreateOne.mockResolvedValueOnce({ id: "1" });

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body.results.errors).toContain("Invalid email format: invalid-email");
        expect(response.body.results.created).toBe(1);
      });

      it("should handle invalid status values", async () => {
        const csvContent =
          "name,email,status\nJohn Doe,john@test.com,maybe\nJane Smith,jane@test.com,approved";

        mockFindMany.mockResolvedValueOnce([]);
        mockCreateOne.mockResolvedValueOnce({ id: "1" });

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body.results.errors).toContain(
          'Invalid status "maybe" for john@test.com. Must be: pending, approved, or rejected'
        );
        expect(response.body.results.created).toBe(1);
      });
    });

    describe("Database Error Handling", () => {
      it("should handle database errors during record creation", async () => {
        const csvContent = "name,email\nJohn Doe,john@test.com";

        mockFindMany.mockResolvedValueOnce([]);
        mockCreateOne.mockRejectedValueOnce(new Error("Database connection failed"));

        const response = await request(app)
          .post("/waitlist/import")
          .attach("file", Buffer.from(csvContent), {
            filename: "test.csv",
            contentType: "text/csv",
          });

        expect(response.status).toBe(200);
        expect(response.body.results.errors).toContain(
          "Failed to process john@test.com: Database connection failed"
        );
      });
    });
  });
});
