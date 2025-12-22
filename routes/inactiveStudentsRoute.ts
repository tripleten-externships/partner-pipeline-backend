import express from "express";
import type { Context } from ".keystone/types";
import { getInactiveStudentsCount } from "../controllers/inactiveStudentsController";

export function createInactiveStudentsRouter(commonContext: Context) {
  const router = express.Router();
  router.use(express.json());

  router.get("/inactive-count", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    return getInactiveStudentsCount(context, req, res);
  });

  return router;
}
