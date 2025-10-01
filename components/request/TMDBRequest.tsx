// components/request/TMDBRequest.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { resolveImage } from "@/lib/images";
const routeKind = "request";

type Kind = "movie" | "tv";

export default function TMDBRequest() {
  const [kind, setKind] = useState<Kind>("movie"); // default Movies
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = async () => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setErr(null);
      return;
    }
    try {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setErr(null);
      // Call our server route which securely adds the TMDB API key. [web:491][web:467]
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&type=${kind}&page=1`, {
        signal: ctrl.signal,
        headers: { "cache-control": "no-cache" },
      });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Enter key triggers search
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") doSearch();
  };

  return (
    <section className="px-3 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Search ${kind === "movie" ? "movies" : "series"}...`}
          className="flex-1 rounded-md px-4 py-2.5 text-white outline-none 
       bg-white/5 border-2 border-transparent 
       [background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)_border-box] 
       animate-gradient bg-[length:300%_300%] w-full"
          aria-label="Search"
        />

        {/* Toggle: Movies / Series */}
        <div className="inline-flex rounded-md bg-white/10 p-1  border border-white/10 mt-2 sm:mt-0">
          <button
            type="button"
            onClick={() => { setKind("movie"); setResults([]); }}
            className={`px-3 h-10 w-full rounded ${kind === "movie" ? "bg-white text-black" : "text-gray-200 hover:text-white"}`}
            aria-pressed={kind === "movie"}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => { setKind("tv"); setResults([]); }}
            className={`px-3 h-10 w-full rounded ${kind === "tv" ? "bg-white text-black" : "text-gray-200 hover:text-white"}`}
            aria-pressed={kind === "tv"}
          >
            Series
          </button>
        </div>

        <button
          type="button"
          onClick={doSearch}
          disabled={loading || !q.trim()}
          className={`h-10 rounded-md px-4 flex items-center justify-center gap-2 mt-2 sm:mt-0 
    ${loading || !q.trim()
              ? "bg-white/50 text-black/60 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-200"} w-full sm:w-auto`}
        >
          {/* Icon (always visible) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
            />
          </svg>

          {/* Text (hidden on small screens, shown on md and up) */}
          <span className="hidden md:inline">
            {loading ? "Searching…" : "Search"}
          </span>
        </button>

      </div>


      {/* Status */}
      {loading && <p className="mt-4 text-gray-400 text-sm">Searching…</p>}
      {err && (
        <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-red-200 text-sm">
          {err}
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((it: any) => {
            const title = kind === "movie" ? it.title ?? "Untitled" : it.name ?? it.original_name ?? "Untitled";
            const poster = resolveImage(it.poster_path) || "/images/notavailable.png";
            return <Card
              key={`${routeKind}-${it.id}`}
              title={kind === "movie" ? it.title ?? "Untitled" : it.name ?? it.original_name ?? "Untitled"}
              poster={resolveImage(it.poster_path) || "/images/notavailable.png"}
              kind={routeKind}
              id={it.id}
              payload={it}
            />;
          })}
        </div>
      )}
    </section>
  );
}
