import { statelessSessions } from "@keystone-6/core/session";

const sessionSecret = process.env.SESSION_SECRET || "default-dev-secret-change-in-production";

export const keystoneSession = statelessSessions({
  secret: sessionSecret,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
});
