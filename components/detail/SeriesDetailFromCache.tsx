// components/detail/SeriesDetailFromCache.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { resolveImage } from "@/lib/images";

type Episode = {
  id: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  episode_number?: number;
  season_number?: number;
  runtime?: number | null;
  video_url?: string | null; // expected in payload
};

type Season = {
  id: number;
  name?: string;
  season_number?: number;
  air_date?: string | null;
  episode_count?: number;
  poster_path?: string | null;
  episodes?: Episode[];
};

export default function SeriesDetailFromCache({ id }: { id: string }) {
  const [data, setData] = useState<any | null>(null);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [episodeIndex, setEpisodeIndex] = useState(0);

  // Read series payload from sessionStorage by key detail:/series/{id} [web:587]
  useEffect(() => {
    try {
      const key = `detail:/series/${id}`;
      const raw = sessionStorage.getItem(key);
      if (!raw) return setData(null);
      const parsed = JSON.parse(raw);
      setData(parsed?.data ?? null);
    } catch {
      setData(null);
    }
  }, [id]);

  // Derive seasons and default selection (prefer season_number === 1)
  const seasons: Season[] = useMemo(() => Array.isArray(data?.seasons) ? data.seasons : [], [data]);
  useEffect(() => {
    if (!seasons.length) return;
    const defaultSeasonIdx = Math.max(
      0,
      seasons.findIndex((s) => s?.season_number === 1)
    );
    setSeasonIndex(defaultSeasonIdx === -1 ? 0 : defaultSeasonIdx);
    setEpisodeIndex(0);
  }, [seasons]);

  if (!data) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
        No cached series data found in this tab; open the detail from a list to view payload-only details.
      </div>
    );
  }

  const title = data.name ?? data.original_name ?? data.title ?? "Untitled";
  const language = data.original_language ? String(data.original_language).toUpperCase() : null;
  const poster = resolveImage(data.poster_path) || "/images/notavailable.png";

  const selectedSeason = seasons[seasonIndex];
  const episodes: Episode[] = Array.isArray(selectedSeason?.episodes) ? selectedSeason!.episodes! : [];
  const selectedEpisode = episodes[episodeIndex];

  // Player source and fallback still image
  const videoUrl = selectedEpisode?.video_url?.trim() || "";
  const still = resolveImage(selectedEpisode?.still_path) || "";

  return (
    <div className="space-y-6">
      {/* Player or still image (16:9 responsive) */}
      <div className="w-full overflow-hidden rounded-lg bg-black/30">
        {videoUrl ? (
          <div className="">{/* 16:9, responsive */} {/* [web:633] */}
            <iframe
              className="w-full h-full aspect-video"
              src={videoUrl}
              title={`${title} — ${selectedEpisode?.name ?? ""}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        ) : (
          <div className="relative aspect-video">
            {still ? (
              <Image
                src={still}
                alt={selectedEpisode?.name ?? title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
            )}
          </div>
        )}
      </div>

      {/* Header + meta */}
      <div className="flex flex-col md:flex-row md:items-start md:gap-6">
        {/* Poster */}
        <div className="hidden md:relative mx-auto md:mx-0 w-40 md:w-48 lg:w-56 aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
          <Image src={poster} alt={title} fill className="object-cover" sizes="(max-width: 768px) 160px, 224px" />
        </div>

        {/* Details */}
        <div className="mt-4 md:mt-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {language && <span className="rounded bg-white/10 px-2 py-1 text-white/80">Lang: {language}</span>}
            {data.first_air_date && (
              <span className="rounded bg-white/10 px-2 py-1 text-white/80">First air: {data.first_air_date}</span>
            )}
            {Array.isArray(data.genre_ids) && data.genre_ids.length > 0 && (
              <span className="rounded bg-white/10 px-2 py-1 text-white/80">Genres: {data.genre_ids.length}</span>
            )}
          </div>

          {/* Season/episode controls */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm text-white/80">
              Season:
              <select
                className="ml-2 rounded border border-white/20 bg-white/10 px-2 py-1 text-white"
                value={seasonIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSeasonIndex(idx);
                  setEpisodeIndex(0);
                }}
              >
                {seasons.map((s, i) => (
                  <option key={s.id ?? i} value={i}>
                    {s.name ?? `Season ${s.season_number ?? i + 1}`} ({s.episode_count ?? s.episodes?.length ?? 0})
                  </option>
                ))}
              </select>
            </label>

            {selectedSeason?.air_date && (
              <span className="text-sm text-white/70">• Aired: {selectedSeason.air_date}</span>
            )}
          </div>

          {/* Episodes list */}
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5">
            {episodes.length === 0 ? (
              <p className="p-3 text-sm text-gray-300">No episodes available for this season.</p>
            ) : (
              <ul className="max-h-60 overflow-y-auto divide-y divide-white/10">
                {episodes.map((ep, i) => {
                  const isActive = i === episodeIndex;
                  const epTitle =
                    ep.name ??
                    `Episode ${ep.episode_number ?? i + 1}`;
                  return (
                    <li key={ep.id ?? i}>
                      <button
                        type="button"
                        onClick={() => setEpisodeIndex(i)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-3 hover:bg-white/10 transition ${
                          isActive ? "bg-white/10" : ""
                        }`}
                      >
                        {/* Thumb */}
                        <div className="relative w-16 h-10 shrink-0 overflow-hidden rounded">
                          {ep.still_path ? (
                            <Image
                              src={resolveImage(ep.still_path) || "/images/notavailable.png"}
                              alt={epTitle}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="h-full w-full bg-white/10" />
                          )}
                        </div>

                        {/* Text */}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{epTitle}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-white/70">{ep.overview || "—"}</p>
                          <div className="mt-1 text-[11px] text-white/60">
                            {typeof ep.runtime === "number" ? `${ep.runtime} min` : ""}
                            {typeof ep.episode_number === "number" ? ` • Ep ${ep.episode_number}` : ""}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Selected episode info */}
          {selectedEpisode && (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">
                {selectedEpisode.name ?? `Episode ${selectedEpisode.episode_number ?? episodeIndex + 1}`}
              </h2>
              <p className="mt-2 text-sm text-gray-300">{selectedEpisode.overview || "—"}</p>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/80">
                {typeof selectedEpisode.runtime === "number" && (
                  <span className="rounded bg-white/10 px-2 py-1">{selectedEpisode.runtime} min</span>
                )}
                {selectedEpisode.season_number && selectedEpisode.episode_number && (
                  <span className="rounded bg-white/10 px-2 py-1">
                    S{selectedEpisode.season_number} • E{selectedEpisode.episode_number}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

