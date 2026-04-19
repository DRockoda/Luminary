import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export interface AccessTokenPayload {
  sub: string;
  type: "access";
}

/** Short-lived JWT embedded in Google OAuth `state` (not a session access token). */
export interface DriveOAuthStatePayload {
  sub: string;
  type: "drive_oauth";
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access" } satisfies AccessTokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

/** Google OAuth `state` — longer TTL than access tokens so slow consent flows still verify. */
export function signDriveOAuthState(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "drive_oauth" } satisfies DriveOAuthStatePayload,
    env.JWT_SECRET,
    { expiresIn: "30m" } as SignOptions,
  );
}

export function verifyDriveOAuthState(token: string): DriveOAuthStatePayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as DriveOAuthStatePayload;
  if (payload.type !== "drive_oauth") {
    throw new Error("Invalid OAuth state token");
  }
  return payload;
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign(
    { sub: userId, jti, type: "refresh" } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
