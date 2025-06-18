import { statelessSessions } from "@keystone-6/core/session";

export const keystoneSession = statelessSessions({
  secret: process.env.SESSION_SECRET!,
  maxAge: 60 * 60 * 24 * 30, // 30 days
});
