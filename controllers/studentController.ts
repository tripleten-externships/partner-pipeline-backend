import { Request, Response } from "express";
import { Context } from ".keystone/types";

const ALLOWED_STATUSES = ["pending", "invited", "accepted", "rejected"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function error(code: string, message: string, details?: any) {
  return { error: { message, code, ...(details ? { details } : {}) } };
}

export const updateWaitlistStudent = async (
  req: Request,
  res: Response,
  context: Context
): Promise<void> => {
  console.log("updateWaitlistStudent endpoint triggered");

  const { id } = req.params;
  const { name, email, status, notes } = req.body ?? {};

  // 1. Validate ID
  if (!id || typeof id !== "string") {
    res.status(400).json(error("VALIDATION_ERROR", "Invalid student ID"));
    return;
  }

  // 2. Authorization check
  const session = context.session;
  if (!session) {
    res.status(401).json(error("UNAUTHORIZED", "Not signed in"));
    return;
  }
  if (session?.data?.isAdmin !== true) {
    res.status(403).json(error("FORBIDDEN", "Admin access required"));
    return;
  }

  // Schema validation and normalization 3-4 (inline)
  // 3. PATCH-like update handling
  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  // Must have at least one field to update
  if (Object.keys(updateData).length === 0) {
    res.status(400).json(error("VALIDATION_ERROR", "No fields to update"));
    return;
  }

  // 4. Validate fields (if provided)
  // name
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid name"));
      return;
    }
    updateData.name = name.trim();
  }
  // email
  if (email !== undefined) {
    if (typeof email !== "string" || email.length > 254) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid email"));
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid email format"));
      return;
    }
    updateData.email = normalizedEmail;
  }
  // status
  if (status !== undefined) {
    if (typeof status !== "string") {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid status type"));
      return;
    }

    const normalizedStatus = status.trim().toLowerCase();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      res
        .status(400)
        .json(error("VALIDATION_ERROR", "Invalid status value", { allowed: ALLOWED_STATUSES }));
      return;
    }
    updateData.status = normalizedStatus;
  }
  // notes
  if (notes !== undefined) {
    if (typeof notes !== "string" || notes.length > 2000) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid notes"));
      return;
    }
    updateData.notes = notes;
  }

  // 5. Fetch waitlist student by ID
  try {
    const student = await context.query.waitListStudent.findOne({
      where: { id },
      query: ` id name email status notes `,
    });

    if (!student) {
      res.status(404).json(error("NOT_FOUND", "Student not found"));
      return;
    }

    // 6. Check for duplicate email if email is being updated
    if (updateData.email && updateData.email !== student.email) {
      const existing = await context.query.waitListStudent.findMany({
        where: { email: { equals: updateData.email } },
        take: 1,
        query: " id ",
      });

      if (existing.length > 0 && existing[0].id !== id) {
        res.status(409).json(error("CONFLICT", "Email already in use by another student"));
        return;
      }
    }

    // 7. Update the student details
    const updatedStudent = await context.query.waitListStudent.updateOne({
      where: { id },
      data: updateData,
      query: "id name email status notes",
    });

    // 8. If status is being updated + update activity log
    if (updateData.status && updateData.status !== student.status) {
      const oldStatus = student.status;
      const newStatus = updateData.status;
      try {
        await context.query.ActivityLog.createOne({
          data: {
            updatedBy: { connect: { id: session.data.id } },
            oldStatus,
            newStatus,
          },
        });
      } catch (logErr) {
        console.error("Failed to create ActivityLog entry:", logErr);
        // Proceed without blocking the main update
      }
    }

    // 9. Return updated student
    res.status(200).json({ data: updatedStudent });
    return;
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json(error("INTERNAL_SERVER_ERROR", "An error occurred"));
    return;
  }
};
