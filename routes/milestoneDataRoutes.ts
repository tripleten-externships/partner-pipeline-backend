import { Router } from "express";

const router = Router();

router.get("/api/projects/:projectId/milestones" /*getProjectMilestones*/);
// as of now this route requires it's respective controller function

export default router;
