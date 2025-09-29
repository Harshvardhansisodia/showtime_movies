// components/detail/DetailFromCache.tsx
"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { resolveBackdrop, resolveImage } from "@/lib/images";

type Kind = "movies" | "series" | "request";

type Props = {
  kind: Kind;
  id: string;
  initialIsFeatured?: boolean;
  sendRequestAction?: (payload: { type_id: string | number; name: string; type: "movies" | "series" }) => Promise<unknown>;
};

export default function RequestDetailFromCache({ kind, id, initialIsFeatured = false, sendRequestAction }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [isFeatured, setIsFeatured] = useState(Boolean(initialIsFeatured));
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const key = `detail:/${kind}/${id}`;
      const raw = sessionStorage.getItem(key);
      const requestedKey = localStorage.getItem("Requested_key");
      if (requestedKey && String(requestedKey) === String(id)) {
        setSent(true);
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed?.data ?? null);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, [kind, id]); // client-only payload [web:289]

  const table: "movies" | "series" = useMemo(() => {
    if (kind === "movies" || kind === "series") return kind;
    const k = data;
    if (k?.media_type === "tv") return "series";
    if (k?.media_type === "movie") return "movies";
    if (k?.first_air_date || k?.original_name || k?.name) return "series";
    return "movies";
  }, [kind, data]); // infer if coming from request flow [web:289]

  const title =
    table === "series"
      ? data?.name ?? data?.original_name ?? data?.title ?? "Untitled"
      : data?.title ?? data?.name ?? "Untitled";
  const poster = resolveImage(data?.poster_path) || "/images/notavailable.png";
  const backdrop = resolveBackdrop(data?.backdrop_path) || "";
  const overview = data?.overview ?? "—";

  async function onSend() {
    if (!sendRequestAction || !data?.id || !title) return;
    setErr(null);
    startTransition(async () => {
      try {
        await sendRequestAction({
          type_id: data.id,         // was id
          name: title,              // unchanged
          type: table,              // was table
        });
        setSent(true);
        localStorage.setItem("Requested_key", data.id);
      } catch (e: any) {
        setErr(e?.message || "Failed to send request");
      }
    });
  }

  if (!data) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
        No cached data found for this tab; open the detail from a list to view payload-only details.
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-6 h-110 w-full overflow-hidden rounded-lg bg-black/30">
        {backdrop && (
          <Image
            src={backdrop}
            alt={title}
            fill
            className="object-cover opacity-70"
            sizes="100vw"
            priority
          />
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Image */}
        <div className="hidden md:block relative w-40 shrink-0 aspect-[2/3] overflow-hidden rounded">
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>

        {/* Details */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold">{title}</h1>

            <div className="inline-flex items-center gap-2 mt-2 md:mt-0">
              {isFeatured ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-md bg-white/20 px-4 h-10 text-white/80 cursor-not-allowed"
                  title="Already available"
                >
                  Already featured
                </button>
              ) : sent ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-md bg-green-500/20 px-4 h-10 text-green-300 cursor-default"
                >
                  Requested
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSend}
                  disabled={pending}
                  className={`inline-flex items-center rounded-md px-4 h-10 font-medium transition-colors ${pending
                      ? "bg-white/40 text-black/60 cursor-not-allowed"
                      : "bg-white text-black hover:bg-gray-200"
                    }`}
                >
                  {`Send ${table === "series" ? "Series" : "Movie"} Request`}
                </button>
              )}
            </div>
          </div>

          {err && <p className="mt-2 text-sm text-red-300">{err}</p>}

          <p className="mt-3 text-gray-300">{overview}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-300">
            <div>
              <dt className="text-gray-400">Release</dt>
              <dd>{data.release_date ?? data.first_air_date ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Rating</dt>
              <dd>{data.vote_average ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Votes</dt>
              <dd>{data.vote_count ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Popularity</dt>
              <dd>{data.popularity ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

    </>
  );
}
