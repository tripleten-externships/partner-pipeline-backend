import { Request, Response } from "express";
import { Context } from ".keystone/types";

export const getWaitList = async (req: Request, res: Response, context: Context) => {
  try {
    const waitList = await context.query.WaitlistEntry.findMany();
    res.status(200).json(waitList);
  } catch (error) {
    console.error("Failed to get wait list:", error);
    res.status(500).json({ message: "Error retrieving wait list" });
  }
};