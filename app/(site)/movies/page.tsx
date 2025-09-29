// app/(site)/movies/page.tsx
import Link from "next/link";
import { fetchMoviesPage } from "@/lib/fetcher";
import { resolveImage } from "@/lib/images";
import Card from "@/components/ui/Card";
import InlineSearch from "@/components/search/InlineSearch";

type Props = {
  searchParams: Promise<{ page?: string; count?: string }>;
};

export const metadata = {
  title: "All Movies • MovieVerse",
};

export default async function MoviesListingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page ?? 1));
  const count = Math.min(60, Math.max(12, Number(sp?.count ?? 24)));

  const data = await fetchMoviesPage(page, count);
  const { results, totalPages } = data;

  const hasPrev = page > 1;
  const hasNext = totalPages ? page < totalPages : results.length === count;

  return (
    <section className="px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-semibold">All Movies</h1>
        <div className="mt-4">
        </div>
        <div className="inline-flex items-center gap-2">
          {hasPrev && (
            <Link
              href={`/movies?page=${page - 1}&count=${count}`}
              className="rounded-md bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm text-gray-200 transition"
              prefetch
            >
              Previous
            </Link>
          )}
          {hasNext && (
            <Link
              href={`/movies?page=${page + 1}&count=${count}`}
              className="rounded-md bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm text-gray-200 transition"
              prefetch
            >
              Next
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4">
        <InlineSearch
          tableName="movies"
          placeholder="Search movies..."
          limit={24}
          gridId="movies-default-grid"
        />
      </div>

      {results.length === 0 ? (
        <p className="mt-6 text-gray-400">No movies found.</p>
      ) : (
        <div
          id="movies-default-grid"
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {results.map((m) => {
            const poster =
              resolveImage(m.poster_path) || "/images/notavailable.png";
            return <Card
              key={m.id}
              title={m.title || "Untitled"}
              poster={resolveImage(m.poster_path) || "/images/notavailable.png"}
              kind="movies"
              id={m.id}
              payload={m}
            />;
          })}
        </div>
      )}
    </section>
  );
}
