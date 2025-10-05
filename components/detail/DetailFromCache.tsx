// components/detail/DetailFromCache.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { resolveBackdrop, resolveImage } from "@/lib/images";

type Kind = "movies" | "series" | "request";

export default function DetailFromCache({ kind, id }: { kind: Kind; id: string }) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    try {
      const key = `detail:/${kind}/${id}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed?.data ?? null);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, [kind, id]); // client-only read, no network [web:587][web:289]

  if (!data) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
        No cached data found for this tab; open the detail from a list to view payload-only details.
      </div>
    );
  }

  const isMovie = kind === "movies";
  const title = isMovie
    ? data.title ?? data.name ?? "Untitled"
    : data.name ?? data.original_name ?? data.title ?? "Untitled";
  const overview = data.overview ?? "—";
  const poster = resolveImage(data.poster_path) || "/images/notavailable.png";
  const backdrop = resolveBackdrop(data.backdrop_path) || "";
  const videoUrl: string | undefined = data.video_url?.trim() || backdrop; // expected in payload

  return (
    <div className="space-y-6">
      {/* Hero area: iframe for movies if video_url exists, else backdrop image */}
      <div className="w-full overflow-hidden rounded-lg bg-black/30">
        {isMovie && videoUrl ? (
          <div className="relative md:bottom-33 w-full aspect-video"> {/* 16:9 responsive player */} {/* [web:633][web:644] */}
            <HLSPlayer 
              videoUrl={videoUrl}
              title={title}
            />
          </div>
        ) : (
          <div className="relative h-56 md:h-80 w-full">
            {backdrop ? (
              <Image
                src={backdrop}
                alt={title}
                fill
                className="object-cover opacity-70"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
            )}
          </div>
        )}
      </div>

      {/* Content block */}
      <div className="flex flex-col md:-mt-39 md:flex-row md:items-start md:gap-6">
        {/* Poster */}
        <div className="hidden md:relative mx-auto md:mx-0 w-40 md:w-48 lg:w-56 aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
          <Image src={poster} alt={title} fill className="object-cover" sizes="(max-width: 768px) 160px, 224px" />
        </div>

        {/* Details */}
        <div className="mt-4 md:mt-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>

          {/* Meta chips (render if present) */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {data.original_language && (
              <span className="rounded bg-white/10 px-2 py-1 text-white/80">
                Lang: {String(data.original_language).toUpperCase()}
              </span>
            )}
            {data.release_date && (
              <span className="rounded bg-white/10 px-2 py-1 text-white/80">Release: {data.release_date}</span>
            )}
            {data.runtime && (
              <span className="rounded bg-white/10 px-2 py-1 text-white/80">{data.runtime} min</span>
            )}
            {Array.isArray(data.genre_names) &&
              data.genre_names.slice(0, 4).map((g: string, i: number) => (
                <span key={i} className="rounded bg-white/10 px-2 py-1 text-white/80">
                  {g}
                </span>
              ))}
          </div>

          {/* Overview */}
          <p className="mt-4 text-gray-300 leading-relaxed">{overview}</p>

          {/* Stats grid */}
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <dt className="text-gray-400">Rating</dt>
              <dd className="mt-1 text-white">{data.vote_average ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <dt className="text-gray-400">Votes</dt>
              <dd className="mt-1 text-white">{data.vote_count ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <dt className="text-gray-400">Popularity</dt>
              <dd className="mt-1 text-white">{data.popularity ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <dt className="text-gray-400">Status</dt>
              <dd className="mt-1 text-white">{data.status ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}



