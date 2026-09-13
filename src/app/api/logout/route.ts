import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

/** Same-origin path only — home or login after Sign out. */
function safeNext(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return "/";
  }
  if (path.startsWith("/api/")) return "/";
  return path;
}

/**
 * In-app Sign out. Native form POST + Auth.js `signOut()` + `redirect()`
 * so cookie-clear stays on the response (Safari-safe, same as /api/login).
 */
export async function POST(req: Request) {
  let next = "/";
  try {
    const form = await req.formData();
    next = safeNext(form.get("callbackUrl"));
  } catch {
    /* home */
  }

  await signOut({ redirect: false });
  redirect(next);
}
