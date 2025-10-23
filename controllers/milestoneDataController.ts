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

export const createProjectMilestone = async (req: Request, res: Response, context: Context) => {
  try {
    const { milestoneName, status, description } = req.body;
    const { projectId } = req.params;

    // validate required fields
    if (!milestoneName || !status || !description || !projectId)
      return res.status(400).json({ message: "Missing required fields" });

    // check project exists
    const project = await context.db.Project.findOne({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // create milestone
    const milestone = await context.db.Milestone.createOne({
      data: {
        milestoneName,
        status,
        description,
        project: { connect: { id: projectId } },
      },
    });

    res.status(201).json(milestone);
  } catch (err: any) {
    console.error("Error creating milestone:", err);
    res.status(500).json({ message: "Failed to create milestone" });
  }
};
