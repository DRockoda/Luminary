export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, opts: { code?: string; details?: unknown } = {}) {
    super(message);
    this.status = status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, msg, { code: "BAD_REQUEST", details });
export const unauthorized = (msg = "Unauthorized") =>
  new HttpError(401, msg, { code: "UNAUTHORIZED" });
export const forbidden = (msg = "Forbidden") => new HttpError(403, msg, { code: "FORBIDDEN" });
export const notFound = (msg = "Not found") => new HttpError(404, msg, { code: "NOT_FOUND" });
export const conflict = (msg: string) => new HttpError(409, msg, { code: "CONFLICT" });
export const tooMany = (msg = "Too many requests") =>
  new HttpError(429, msg, { code: "RATE_LIMITED" });
