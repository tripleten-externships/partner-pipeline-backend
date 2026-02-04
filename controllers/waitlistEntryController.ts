import { Request, Response } from "express";
import { Context } from ".keystone/types";

export const updateWaitlistNotes = async (req: Request, res: Response, context: Context) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    console.log("notes: ", notes);
    console.log("id, notes: ", id, notes);
    if (!notes) {
      return res.status(400).json({ message: "Notes are required" });
    }

    const updatedEntry = await context.db.WaitlistEntry.updateOne({
      where: { id },
      data: { notes },
    });

    if (!updatedEntry) {
      return res.status(404).json({ message: "Waitlist entry not found" });
    }

    return res.status(200).json(updatedEntry);
  } catch (err) {
    console.error("Failed to update waitlist entry:", err);
    return res.status(500).json({ message: "Error updating waitlist entries" });
  }
};
