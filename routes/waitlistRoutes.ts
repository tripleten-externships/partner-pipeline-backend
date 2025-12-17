import { Router } from "express";
import { getWaitList } from "../controllers/waitListController";
import { BaseKeystoneTypeInfo } from "@keystone-6/core/types";
import { Context } from ".keystone/types";

export function createWaitlistRouter(commonContext: Context<BaseKeystoneTypeInfo>) {
  const router = Router();

  router.get("/api/waitlist", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    if (!context) return res.status(500).send("Failed to get context");

    await getWaitList(req, res, context);
  });

  return router;
}
