import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export interface AccessTokenPayload {
  sub: string;
  type: "access";
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
