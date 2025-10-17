import { Request, Response } from "express";
import { Context } from ".keystone/types";

export const sendReminder = async (
  req: Request,
  res: Response,
  context: Context
): Promise<void> => {
  console.log("sendReminder endpoint triggered");

  const { id } = req.body;
  console.log("Received ID:", id);

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  try {
    // Step 1: Fetch user by ID
    const user = await context.query.User.findOne({
      where: { id },
      query: `
        id
        reminder_count
        status
      `,
    });

    if (!user) {
      console.error("No user found for ID:", id);
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log("Found user:", user.id);
    console.log("Current status:", user.status);
    console.log("Current reminder count:", user.reminder_count);

    const currentCount = user?.reminder_count || 0;

    // Step 2: Trigger update — increment reminder_count by 1
    await context.query.User.updateOne({
      where: { id },
      data: { reminder_count: currentCount + 1 },
    });

    // Step 3: Fetch updated user
    const updatedUser = await context.query.User.findOne({
      where: { id },
      query: `
        id
        reminder_count
        status
      `,
    });

    console.log("Updated reminder count:", updatedUser.reminder_count);
    console.log("Updated status:", updatedUser.status);

    res.status(200).json({
      message: `Reminder sent. Status is now ${updatedUser.status}`,
      reminder_count: updatedUser.reminder_count,
      status: updatedUser.status,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
