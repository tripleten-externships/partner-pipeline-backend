import { Router } from "express";
import { sendReminder } from "../controllers/reminderController";
import { Context } from ".keystone/types";

const router = Router();

router.post("/api/send", (req, res) => {
  const context: Context = (req as any).context;
  sendReminder(req, res, context);
});

export default router;
