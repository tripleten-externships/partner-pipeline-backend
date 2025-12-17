import type { Request, Response } from "express";
import type { Context } from ".keystone/types";

/**
 * Counts inactive students
 */
export async function getInactiveStudentsCount(
  context: Context,
  req: Request,
  res: Response
) {
  try {
    const daysUncontacted = parseInt(req.query.daysUncontacted as string) || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysUncontacted);

    const inactiveCount = await context.query.WaitlistEntry.count({
      where: {
        status: { equals: "pending" },
        createdAt: { lte: cutoffDate.toISOString() },
      },
    });

    return res.json({ count: inactiveCount });
  } catch (error: any) {
    console.error("Error counting inactive students:", error);
    return res.status(500).json({
      error: "Failed to count inactive students",
      message: error?.message,
    });
  }
}

