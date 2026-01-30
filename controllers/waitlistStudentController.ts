import { Request, Response } from "express";

export async function updateWaitlistStudent(req: Request, res: Response, context: any) {
  return res.status(501).json({
    error: { code: "Not_Implemented", message: "This endpoint is not yet implemented." },
  });
}
