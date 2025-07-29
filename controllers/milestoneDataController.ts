import { Request, Response } from "express";

//stub data 'for simulation!'
const mockMilestones = {
  "1": [
    { name: "first phase", status: "completed", assigne: "ana" },
    { name: "second phase", status: "ongoing", assigne: "tom" },
  ],
  "2": [], //no milestones!
};

export const getProjectMilestones = (req: Request, res: Response) => {
  const { projectId } = req.params; // extract the projectId from the URL

  // Fetch milestones for the given projectId, defaulting to empty array if there is none.
  const milestones = mockMilestones[projectId] || [];

  //respond with the list of milestones 'even if it is an empty array'.
  res.status(200).json(milestones);
};
