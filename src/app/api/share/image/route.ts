import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import {
  parseShareImageUrl,
  SHARE_IMAGE_MAX_BYTES,
  shareImageTypeAllowed,
} from "@/lib/share-image-proxy";

export const dynamic = "force-dynamic";

/**
 * Same-origin proxy so share pictures can include ESPN team logos.
 * Logged-in pool members only. Host allow-list is tight.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me) {
    return NextResponse.json({ error: "No membership" }, { status: 403 });
  }

  const raw = new URL(req.url).searchParams.get("url");
  const target = parseShareImageUrl(raw);
  if (!target) {
    return NextResponse.json({ error: "Blocked image host" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*,*/*;q=0.8" },
      cache: "force-cache",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: "Image not found" }, { status: 502 });
  }

  const type = upstream.headers.get("content-type");
  if (!shareImageTypeAllowed(type)) {
    return NextResponse.json({ error: "Not an image" }, { status: 415 });
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.byteLength === 0 || buf.byteLength > SHARE_IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": type!.split(";")[0]!.trim(),
      "Cache-Control": "private, max-age=86400",
    },
  });
}
