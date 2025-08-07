import { Request, Response } from "express";

export const getActivityLog = (req: Request, res: Response) => {
  console.log("getActivityLog request:");
  console.log(req);
};