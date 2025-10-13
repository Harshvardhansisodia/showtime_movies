import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function GET() {
  try {
    // 👇 Forward to upstream API (server-side, so no CORS problem)
    const upstream = `${API_BASE}/api/hlstoken/1`;
    const res = await fetch(upstream, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream failed" }, { status: res.status });
    }

    const data = await res.json();
    if (!data || typeof data.hlstoken !== "string") {
      return NextResponse.json({ error: "Invalid HLS token payload" }, { status: 500 });
    }

    return NextResponse.json(
      { hlstoken: data.hlstoken },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    console.error("HLS token route error:", e);
    return NextResponse.json({ error: "Failed to fetch HLS token" }, { status: 500 });
  }
}
