import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export interface AdminTokenPayload {
  sub: string;
  username: string;
  role: "admin";
  type: "admin";
}

export function signAdminToken(adminId: string, username: string): string {
  return jwt.sign(
    { sub: adminId, username, role: "admin", type: "admin" } satisfies AdminTokenPayload,
    env.ADMIN_JWT_SECRET,
    { expiresIn: env.ADMIN_JWT_EXPIRES_IN } as SignOptions,
  );
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
  if (payload.type !== "admin" || payload.role !== "admin") {
    throw new Error("Not an admin token");
  }
  return payload;
}
