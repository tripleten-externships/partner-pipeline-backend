import { Router } from "express";
import express from "express";
import { updateWaitlistStudent, deleteWaitlistStudent } from "../controllers/studentController";

export function createWaitlistRouter(commonContext: any) {
  const router = Router();

  router.use(express.json());

  // PATCH-like endpoint to update waitlist student info
  router.put("/:id", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    return updateWaitlistStudent(req, res, context);
  });

  router.delete("/:id", async (req, res) => {
    // Keystone creates a request scoped context object for each request that
    // includes database API's (context.db, context.query), session/auth info, etc...
    const context = await commonContext.withRequest(req, res);
    return deleteWaitlistStudent(req, res, context);
  });

  return router;
}
