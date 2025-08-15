import { Router } from "express";
import { getActivityLog } from "../controllers/activityLogController";
import { BaseKeystoneTypeInfo } from "@keystone-6/core/types";
import { Context } from ".keystone/types";

export function createActivityLogRouter(commonContext: Context<BaseKeystoneTypeInfo>) {
  const router = Router();

  router.get("/api/projects/:projectId/activity-log", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    if (!context) return res.status(500).send("Failed to get context");

    await getActivityLog(req, res, context);
  });

  return router;
}
