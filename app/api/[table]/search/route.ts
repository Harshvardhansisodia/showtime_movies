// app/api/[table]/search/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // adjust if needed

export async function GET(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const { table } = await context.params;
  if (!["movies", "series"].includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 24)));

  // Empty query -> return empty list so the client can show default paginated grid
  if (!q) {
    return NextResponse.json({ results: [] }, { status: 200, headers: { "cache-control": "no-store" } });
  }

  try {
    // OPTION A: Forward to upstream if it supports search
    const upstreamSearch = `${API_BASE}/api/${table}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    const tryUpstream = await fetch(upstreamSearch, { cache: "no-store" });
    if (tryUpstream.ok) {
      const data = await tryUpstream.json();
      const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      return NextResponse.json({ results }, { headers: { "cache-control": "no-store" } });
    }

    // OPTION B: Fallback — fetch a larger page and filter here
    const listUrl = `${API_BASE}/api/${table}?page=1&count=200`;
    const res = await fetch(listUrl, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Upstream failed" }, { status: res.status });
    const data = await res.json();
    const rows: any[] = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    const qLower = q.toLowerCase();

    const results = rows
      .filter((it) => {
        const t = it.title || it.name || it.original_name || "";
        return String(t).toLowerCase().includes(qLower);
      })
      .slice(0, limit);

    return NextResponse.json({ results }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: "Search error" }, { status: 500 });
  }
}
