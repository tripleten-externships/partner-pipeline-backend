import express from "express";
import type { Context } from ".keystone/types";
import { getAverageResponseTime } from "../controllers/invitationAnalyticsController";

export function createInvitationAnalyticsRouter(commonContext: Context) {
  const router = express.Router();
  router.use(express.json());

  router.get("/average-response-time", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    return getAverageResponseTime(context, req, res);
  });

  return router;
}
