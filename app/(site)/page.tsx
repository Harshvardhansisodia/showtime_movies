// app/(site)/page.tsx
import Link from "next/link";
import { fetchMovies, fetchTrending, fetchSeries } from "@/lib/fetcher";
import { resolveBackdrop, resolveImage } from "@/lib/images";
import Card from "@/components/ui/Card";
import Banner3DAuto from "@/components/3d/Banner3DAuto";

import ClearSessionOnMount from "@/components/system/ClearSessionOnMount";

export default async function HomePage() {

  const [trendingRes, moviesRes, seriesRes] = await Promise.allSettled([
    fetchTrending(1),
    fetchMovies(1, "estimated"),
    fetchSeries(1, "estimated"),
  ]);

  const trending =
    trendingRes.status === "fulfilled" ? trendingRes.value.slice(0, 10) : [];

  const bannerItems = trending
    .map((m) => ({
      id: m.id,
      title: m.title ?? "Untitled",
      overview: m.overview,
      backdrop: resolveBackdrop(m.backdrop_path) || "",
      poster: resolveImage(m.poster_path) || "",
      href: `/movies/${m.id}`,
      payload:m
    }))
    .filter((x) => x.backdrop || x.poster);

  const movies = moviesRes.status === "fulfilled" ? moviesRes.value : [];
  const error =
    moviesRes.status === "rejected"
      ? "Unable to load movies right now. Please try again shortly."
      : null;

  const series = seriesRes.status === "fulfilled" ? seriesRes.value : [];
  const seriesError =
    seriesRes.status === "rejected"
      ? "Unable to load series right now. Please try again shortly."
      : null;

  const visibleMovies = movies.slice(0, 6);
  const visibleSeries = series.slice(0, 6);

  return (
    <>
      <ClearSessionOnMount />
      <Banner3DAuto items={bannerItems} />

      {/* Movies */}
      <section className="px-6 py-10 bg-gradient-to-b from-transparent to-black">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-semibold">Movies</h1>

          {/* Right arrow link to full listing */}
          <Link
            href="/movies"
            aria-label="See all movies"
            className="group inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            prefetch
          >
            <span className="hidden sm:inline">See all</span>
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 text-gray-300 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-red-200"
          >
            <p className="font-medium">Error loading movies</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        ) : visibleMovies.length === 0 ? (
          <p className="mt-6 text-gray-400">No movies found at the moment.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleMovies.map((m) => {
              const poster =
                resolveImage(m.poster_path) || "/images/notavailable.png";
              return (
                <Card
                  key={m.id}
                  title={m.title || "Untitled"}
                  poster={resolveImage(m.poster_path) || "/images/notavailable.png"}
                  kind="movies"
                  id={m.id}
                  payload={m}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Series */}
      <section className="px-6 pb-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Series</h2>

          <Link
            href="/series"
            aria-label="See all series"
            className="group inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            prefetch
          >
            <span className="hidden sm:inline">See all</span>
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 text-gray-300 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>

        {seriesError ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-red-200"
          >
            <p className="font-medium">Error loading series</p>
            <p className="text-sm opacity-90">{seriesError}</p>
          </div>
        ) : visibleSeries.length === 0 ? (
          <p className="mt-6 text-gray-400">No series found at the moment.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleSeries.map((s) => {
              const poster =
                resolveImage(s.poster_path) || "/images/notavailable.png";
              const title = s.title || (s as any).name || (s as any).original_name || "Untitled";
              return <Card
                  key={s.id}
                  title={title}
                  poster={poster}
                  kind="series"
                  id={s.id}
                  payload={s}
                />;
            })}
          </div>
        )}
      </section>
    </>
  );
}
