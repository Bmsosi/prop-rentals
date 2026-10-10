import crypto from "crypto";

export function generatePublicId() {
  return crypto.randomBytes(16).toString("hex");
}
