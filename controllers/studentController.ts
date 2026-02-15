import { Request, Response } from "express";
import { Context } from ".keystone/types";

const ALLOWED_STATUSES = ["pending", "invited", "accepted", "rejected"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_SELECT =
  "id name email status notes program completedOn contactedBy { id } lastContactedOn hasVoucher";
const MAP_UI_TO_DB: Record<string, string> = {
  se: "software_engineering",
  "ai/ml": "ai_machine_learning",
  "ai automation": "ai_automation",
  "bi analytics": "business_intelligence_analytics",
  cs: "cyber_security",
  qa: "quality_assurance",
  "ai se": "ai_software_engineering",
  "ux/ui": "ux_ui_design",
};

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
  const {
    name,
    email,
    status,
    notes,
    program,
    completedOn,
    contactedBy,
    lastContactedOn,
    hasVoucher,
  } = req.body ?? {};

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

  // 3. Ensure at least one field was provided
  const hasAnyField =
    name !== undefined ||
    email !== undefined ||
    status !== undefined ||
    notes !== undefined ||
    program !== undefined ||
    completedOn !== undefined ||
    contactedBy !== undefined ||
    lastContactedOn !== undefined ||
    hasVoucher !== undefined;

  if (!hasAnyField) {
    res.status(400).json(error("VALIDATION_ERROR", "No fields to update"));
    return;
  }

  const updateData: Record<string, any> = {};

  // Validation schema
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
  // program
  if (program !== undefined) {
    if (typeof program !== "string") {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid program type"));
      return;
    }

    const key = program.trim().toLowerCase();
    const mapped = MAP_UI_TO_DB[key];

    if (!mapped) {
      res
        .status(400)
        .json(
          error("VALIDATION_ERROR", "Invalid program value", { allowed: Object.keys(MAP_UI_TO_DB) })
        );
      return;
    }
    updateData.program = mapped;
  }
  // completedOn
  if (completedOn !== undefined) {
    if (typeof completedOn !== "string" || Number.isNaN(Date.parse(completedOn))) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid completedOn date"));
      return;
    }
    updateData.completedOn = completedOn;
  }
  // lastContactedOn
  if (lastContactedOn !== undefined) {
    if (typeof lastContactedOn !== "string" || Number.isNaN(Date.parse(lastContactedOn))) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid lastContactedOn date"));
      return;
    }
    updateData.lastContactedOn = lastContactedOn;
  }
  // contactedBy
  if (contactedBy !== undefined) {
    if (typeof contactedBy !== "string" || contactedBy.trim().length === 0) {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid contactedBy user ID"));
      return;
    }
    updateData.contactedBy = { connect: { id: contactedBy.trim() } };

    // When contactedBy changes, lastContactedOn updates
    if (lastContactedOn === undefined) {
      updateData.lastContactedOn = new Date().toISOString();
    }
  }
  // hasVoucher
  if (hasVoucher !== undefined) {
    if (typeof hasVoucher !== "boolean") {
      res.status(400).json(error("VALIDATION_ERROR", "Invalid voucher selection"));
      return;
    }
    updateData.hasVoucher = hasVoucher;
  }

  // Must have at least one field to update
  if (Object.keys(updateData).length === 0) {
    res.status(400).json(error("VALIDATION_ERROR", "No valid fields to update"));
    return;
  }

  // 5. Fetch waitlist student by ID
  try {
    const student = await context.query.waitListStudent.findOne({
      where: { id },
      query: WAITLIST_SELECT,
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
        query: "id",
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
      query: WAITLIST_SELECT,
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

export const deleteWaitlistStudent = async (
  req: Request,
  res: Response,
  context: Context
): Promise<void> => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json(error("BAD_REQUEST", "Invalid Id"));
    return;
  }

  // The client sends a keystone session cookie in the req headers. Keystone
  // decodes it to get auth data upon each request.
  const session = context.session;

  // Not logged in
  if (!session) {
    res.status(401).json(error("UNAUTHORIZED", "Not signed in"));
    return;
  }

  // Logged in but not allowed..
  if (session?.data?.isAdmin !== true) {
    res.status(403).json(error("FORBIDDEN", "Admin access required"));
    return;
  }

  try {
    const student = await context.db.waitListStudent.findOne({
      where: { id },
    });

    if (!student) {
      res.status(404).json(error("NOT_FOUND", "Student not found"));
      return;
    }

    const deleted = await context.db.waitListStudent.deleteOne({
      where: { id },
    });

    if (deleted) {
      const oldStatus = student.status;
      const newStatus = "deleted";
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
      }
    }

    // Return clear 204 No Content on success.
    res.sendStatus(204);
    return;
  } catch (err) {
    console.error("Error deleting student: ", err);
    res.status(500).json(error("INTERNAL_SERVER_ERROR", "An error occurred"));
    return;
  }
};
