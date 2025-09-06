import { Request, Response } from "express";
import { Context } from ".keystone/types";

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