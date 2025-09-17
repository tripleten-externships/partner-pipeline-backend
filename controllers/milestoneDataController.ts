import { Request, Response } from "express";
import { Context } from ".keystone/types";
import { Milestone } from "../models/milestone";

// context from milestone route file
//test
export const getProjectMilestones = async (req: Request, res: Response, context: Context) => {
  try {
    const { projectId } = req.params;

    // use keystone context to access database info from milestone schema
    const milestones = await context.query.Milestone.findMany({
      where: {
        project: {
          id: {
            equals: projectId,
          },
        },
      },
      query: `
        milestoneName
        status
        assignee
      `,
    });

    if (milestones.length === 0) {
      return res.status(404).json({ message: "No milestones found for this project." });
    }

    res.status(200).json(milestones);
  } catch (err) {
    console.error("Failed to get milestones:", err);
    res.status(500).json({ message: "Error retrieving milestones" });
  }
};

// TODO: updateMilestone function will be implemented here (PPC4-11)
export const updateMilestone = async (req: Request, res: Response, context: Context) => {
  try {
    const { id } = req.params; // Extract milestone id from URL params
    const { milestoneName, status } = req.body; // Extract fields from req.body
    if (!id) {
      return res.status(400).json({ message: "Milestone ID is required" });
    }
    if (!milestoneName && !status) {
      return res.status(400).json({ message: "At least one field must entered" });
    }
    const updatedData: any = {};
    if (milestoneName) updatedData.milestoneName = milestoneName;
    if (status) updatedData.status = status;
    const updated = await context.query.Milestone.updateOne({
      // Update milestone in database using Keystone context
      where: { id },
      data: updatedData,
      query: "id milestoneName status assignee", // Return only selected fields
    });
    if (!updated) {
      // if milestone does not exist
      return res.status(404).json({ message: "Milestone not found" });
    } else return res.status(200).json(updated); // returns one that updated
  } catch (err) {
    console.error("Error updateding milestone", err);
    res.status(500).json({ message: "Server error" });
  }
};
