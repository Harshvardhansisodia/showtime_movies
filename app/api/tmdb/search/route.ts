// app/api/tmdb/search/route.ts
import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const MAX_RETRIES = 2;       // total attempts = 1 + MAX_RETRIES
const TIMEOUT_MS  = 8000;    // per-attempt timeout

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(t);

      // If ok, return immediately
      if (res.ok) return res;

      // Respect Retry-After for 429s if provided
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        const ra = Number(res.headers.get("retry-after"));
        const backoff = isNaN(ra) ? 300 * Math.pow(2, attempt) : ra * 1000;
        if (attempt < retries) await sleep(backoff + Math.random() * 150);
        else return res;
      } else {
        return res; // 4xx other than 429: do not retry
      }
    } catch (err) {
      clearTimeout(t);
      if (attempt < retries) {
        await sleep(300 * Math.pow(2, attempt) + Math.random() * 150);
      } else {
        throw err;
      }
    }
  }
  throw new Error("unreachable");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = (url.searchParams.get("type") || "movie").toLowerCase(); // "movie" | "tv"
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "Missing TMDB_API_KEY" }, { status: 500 }); // keep key server-side [web:491]
  if (!["movie", "tv"].includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 }); // validate type [web:485]
  if (!q) {
    return NextResponse.json({ results: [], page: 1, total_pages: 0, total_results: 0 }, { headers: { "cache-control": "no-store" } });
  }

  const endpoint = `${TMDB_BASE}/search/${type}?query=${encodeURIComponent(q)}&page=${page}&include_adult=false&language=en-US&api_key=${apiKey}`; // correct endpoints [web:485]

  try {
    const res = await fetchWithRetry(endpoint, { cache: "no-store", headers: { accept: "application/json" } }); // dynamic fetch [web:126]
    if (!res.ok) {
      return NextResponse.json({ error: `TMDB error ${res.status}` }, { status: res.status }); // bubble up status [web:485]
    }
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return NextResponse.json(
      { results, page: data?.page ?? 1, total_pages: data?.total_pages ?? 0, total_results: data?.total_results ?? results.length },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Failed to query TMDB (timeout or network)" }, { status: 502 }); // stabilized failure path [web:471]
  }
}
