import { Router } from "express";
import {
  getProjectMilestones,
  createProjectMilestone,
} from "../controllers/milestoneDataController";
import { BaseKeystoneTypeInfo } from "@keystone-6/core/types";
import { Context } from ".keystone/types";

// function to use keystone context in custom express route
export function createMilestoneRouter(commonContext: Context<BaseKeystoneTypeInfo>) {
  const router = Router();

  // async function to determine if context was found
  router.get("/api/projects/:projectId/milestones", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    if (!context) return res.status(500).send("Failed to get context");

    // if context exists, run controller function
    await getProjectMilestones(req, res, context);
  });
  // NEW PAX CODE -- TOP
  router.post("/api/projects/:projectId/milestones", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    if (!context) return res.status(500).send("Failed to get context");

    // if context exists, run controller function
    await createProjectMilestone(req, res, context); // NOT REAL, NOT MADE, NAMED BY PAX -- CAN/probably will BE CHANGED
  });
  // NEW PAX CODE -- BOTTOM

  return router;
}
