import { Request, Response } from "express";
import { Context } from ".keystone/types";

export const getActivityLog = async (req: Request, res: Response, context: Context) => {
  try {
    const { projectId } = req.params;

    const activityLog = await context.query.ActivityLog.findMany({
      where: {
        project: { id: { equals: projectId } }, // must match the Project item ID
      }, // milsteoneId must match the milestoneID
      query: `
        milestone {
          id
          milestoneName
        }
        oldStatus
        newStatus
        updatedBy {
          id
          name
        }
        timestamp
      `,
    });

    if (activityLog.length === 0) {
      return res.status(404).json({ message: "No activity log entries found for this project." });
    }

    res.status(200).json(activityLog);
  } catch (err) {
    console.error("Failed to get activity log:", err);
    res.status(500).json({ message: "Error retrieving activity log entries" });
  }
};
