import { Router } from "express";
import { Context } from ".keystone/types";
import { updateWaitlistStudent } from "../controllers/waitlistStudentController";

export function createWaitlistRouter(commonContext: any) {
  const router = Router();

  // PATCH-like endpoint to update waitlist student info
  router.put("/:id", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    return updateWaitlistStudent(req, res, context);
  });

  return router;
}
