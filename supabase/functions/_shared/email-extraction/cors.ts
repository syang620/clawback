import { errors } from "./errors.ts";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";

export function createCorsHeaders(
  origin: string | null,
  allowedOrigins: readonly string[],
): Headers {
  const headers = new Headers({ Vary: "Origin" });
  if (!origin) return headers;
  if (!allowedOrigins.includes(origin)) throw errors.originForbidden();

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  headers.set("Access-Control-Max-Age", "600");
  return headers;
}
