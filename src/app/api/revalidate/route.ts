import { revalidateTag } from "next/cache";

/**
 * Called by a Sanity webhook on publish so new content shows up right away instead of after the
 * cache window. Configure the webhook with ?secret=<SANITY_REVALIDATE_SECRET> or the
 * x-revalidate-secret header.
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  const given = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  if (!secret || given !== secret) return Response.json({ ok: false, error: "Invalid or missing secret" }, { status: 401 });
  revalidateTag("sanity", "max");
  return Response.json({ ok: true });
}
