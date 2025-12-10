import type { Request, Response } from "express";
import type { Context } from ".keystone/types";

export async function getAverageResponseTime(context: Context, req: Request, res: Response) {
  try {
    const creationLogs = await context.sudo().db.InvitationTokenLog.findMany({
      where: {
        operation: { equals: "create" },
      },
    });

    const updateLogs = await context.sudo().db.InvitationTokenLog.findMany({
      where: {
        operation: { equals: "update" },
      },
    });

    const responseTimes: number[] = [];

    for (const updateLog of updateLogs) {
      try {
        const before = updateLog.before ? JSON.parse(updateLog.before as string) : null;
        const after = updateLog.after ? JSON.parse(updateLog.after as string) : null;

        if (before && after && after.usedCount > before.usedCount) {
          const tokenId = after.id;
          const acceptanceTime = new Date(updateLog.timestamp!);

          const creationLog = creationLogs.find((log) => {
            try {
              const createdToken = log.after ? JSON.parse(log.after as string) : null;
              return createdToken && createdToken.id === tokenId;
            } catch {
              return false;
            }
          });

          if (creationLog && creationLog.timestamp) {
            const creationTime = new Date(creationLog.timestamp);
            const diffInMs = acceptanceTime.getTime() - creationTime.getTime();
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            responseTimes.push(diffInDays);
          }
        }
      } catch (err) {
        console.error("Error processing log:", err);
      }
    }

    if (responseTimes.length === 0) {
      return res.json({
        message: "No accepted invitations found",
        averageResponseTime: null,
        totalResponses: 0,
      });
    }

    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    const average = sum / responseTimes.length;

    return res.json({
      message: "Average response time calculated successfully",
      averageResponseTimeDays: Number(average.toFixed(2)),
      totalResponses: responseTimes.length,
      responseTimes: responseTimes.map((t) => Number(t.toFixed(2))),
      details: {
        minResponseTime: Number(Math.min(...responseTimes).toFixed(2)),
        maxResponseTime: Number(Math.max(...responseTimes).toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error("Error calculating average response time:", error);
    return res.status(500).json({
      error: "Failed to calculate average response time",
      message: error?.message,
    });
  }
}
