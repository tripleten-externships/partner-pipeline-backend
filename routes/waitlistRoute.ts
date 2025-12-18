import express from "express";
import type { Context } from ".keystone/types";
import { getWaitlistTotalCount } from "../controllers/waitlistController";

export function createWaitlistRouter(commonContext: Context) {
  const router = express.Router();
  router.use(express.json());

  router.get("/total-count", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    return getWaitlistTotalCount(context, req, res);
  });

  return router;
}
