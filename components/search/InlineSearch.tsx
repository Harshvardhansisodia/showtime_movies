// components/search/InlineSearch.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { resolveImage } from "@/lib/images";

type Item = Record<string, any>;

export default function InlineSearch({
  tableName,              // "movies" | "series"
  placeholder = "Search...",
  limit = 24,
  className = "",
  gridId,                 // <- id of default grid to toggle
}: {
  tableName: "movies" | "series";
  placeholder?: string;
  limit?: number;
  className?: string;
  gridId: string;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function titleOf(it: Item) {
    return tableName === "movies"
      ? it.title ?? "Untitled"
      : it.name ?? it.original_name ?? it.title ?? "Untitled";
  }

  function posterOf(it: Item) {
    return resolveImage(it.poster_path) || "/images/notavailable.png";
  }

  function hrefOf(it: Item) {
    return `/${tableName}/${it.id}`;
  }

  // Live search (debounced)
  useEffect(() => {
    if (!q) {
      setResults([]);
      setError(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        setError(null);
        const url = `/api/${tableName}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { "cache-control": "no-cache" },
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        setResults(list);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [q, tableName, limit]); // client-side composition pattern is required here [web:393][web:289]

  // Toggle default grid visibility based on results
  useEffect(() => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (results.length > 0) {
      grid.classList.add("hidden");   // hide default grid when we have search results [web:441]
    } else {
      grid.classList.remove("hidden"); // show default grid when no results or input cleared [web:441]
    }
  }, [results.length, gridId]); // this keeps Server UI intact while client controls visibility [web:393][web:289]

  const showSearchGrid = q.length > 0;

  return (
    <div className={className}>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md px-4 py-2.5 text-white outline-none 
             bg-white/5 border-2 border-transparent 
             [background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)_border-box] 
             animate-gradient bg-[length:300%_300%]"
          aria-label={`Search ${tableName}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
        )}
      </div>

      {showSearchGrid && (
        <>
          {error ? (
            <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-red-200 text-sm">
              {error}
            </div>
          ) : results.length === 0 ? (
            <p className="mt-4 text-gray-400 text-sm">No results found.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((it) => (
              <Card
                key={it.id}
                title={titleOf(it)}
                poster={posterOf(it)}
                kind={tableName === "movies" ? "movies" : "series"}
                id={it.id}
                payload={it}
              />
            ))}
          </div>
          )}
        </>
      )}
    </div>
  );
}
