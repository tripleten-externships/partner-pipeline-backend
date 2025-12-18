import type { Request, Response } from "express";
import type { Context } from ".keystone/types";

/**
 * Returns the total number of students in the waitlist
 */
export async function getWaitlistTotalCount(context: Context, req: Request, res: Response) {
  try {
    const totalCount = await context.query.WaitlistEntry.count({
      where: {},
    });

    return res.json({ count: totalCount });
  } catch (error: any) {
    console.error("Error counting total waitlist students:", error);
    return res.status(500).json({
      error: "Failed to count total waitlist students",
      message: error?.message,
    });
  }
}
