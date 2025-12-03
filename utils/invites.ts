import crypto from "crypto";

export function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
