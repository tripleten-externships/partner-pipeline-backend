import { Router } from "express";
import { getActivityLog } from "../controllers/activityLogController";

const router = Router();

// End point for Activity Log
router.get("/api/projects/${projectId}/activity-log", getActivityLog);

export default router;