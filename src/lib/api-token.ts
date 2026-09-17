import { hmacSign, hmacSignMatch, randomToken } from "./token-crypto";

export const API_TOKEN_TTL_MS = 60 * 60 * 1000;
export type ApiScope = "cron" | "api";

export type ApiTokenPayload = {
  s: ApiScope;
  exp: number;
  iat: number;
  jti: string;
};

function encode(payload: ApiTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(raw: string): ApiTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed?.s !== "cron" && parsed?.s !== "api") return null;
    if (!Number.isFinite(parsed.exp) || !Number.isFinite(parsed.iat)) return null;
    if (typeof parsed.jti !== "string" || !parsed.jti) return null;
    return parsed as ApiTokenPayload;
  } catch {
    return null;
  }
}

export function mintApiToken(
  scope: ApiScope,
  ttlMs = API_TOKEN_TTL_MS,
  now = Date.now()
): string {
  const payload: ApiTokenPayload = {
    s: scope,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + ttlMs) / 1000),
    jti: randomToken(16),
  };
  const body = encode(payload);
  return `ss.${body}.${hmacSign(body)}`;
}

export function verifyApiToken(
  token: string,
  scope: ApiScope,
  now = Date.now()
): ApiTokenPayload | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "ss") return null;
  const body = parts[1];
  const sig = parts[2];
  if (!body || !sig || !hmacSignMatch(body, sig)) return null;
  const payload = decode(body);
  if (!payload || payload.s !== scope) return null;
  if (payload.exp * 1000 <= now) return null;
  return payload;
}

export function bearerToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)/i.exec(auth);
  return match?.[1]?.trim() ?? "";
}
