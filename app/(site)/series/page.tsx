// app/(site)/series/page.tsx
import Link from "next/link";
import { fetchSeriesPage } from "@/lib/fetcher";
import { resolveImage } from "@/lib/images";
import Card from "@/components/ui/Card";
import InlineSearch from "@/components/search/InlineSearch";

type Props = {
  searchParams: Promise<{ page?: string; count?: string }>;
};

export const metadata = {
  title: "All Series • MovieVerse",
};

export default async function SeriesListingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page ?? 1));
  const count = Math.min(60, Math.max(12, Number(sp?.count ?? 24)));

  const data = await fetchSeriesPage(page, count);
  const { results, totalPages } = data;

  const hasPrev = page > 1;
  const hasNext = totalPages ? page < totalPages : results.length === count;

  return (
    <section className="px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-semibold">All Series</h1>

        <div className="inline-flex items-center gap-2">
          {hasPrev && (
            <Link
              href={`/series?page=${page - 1}&count=${count}`}
              className="rounded-md bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm text-gray-200 transition"
              prefetch
            >
              Previous
            </Link>
          )}
          {hasNext && (
            <Link
              href={`/series?page=${page + 1}&count=${count}`}
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
          tableName="series"
          placeholder="Search series..."
          limit={24}
          gridId="series-default-grid"
        />
      </div>

      {results.length === 0 ? (
        <p className="mt-6 text-gray-400">No series found.</p>
      ) : (
        <div
          id="series-default-grid"
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {results.map((s) => {
            const poster =
              resolveImage(s.poster_path) || "/images/notavailable.png";
            const title =
              (s as any).name ??
              (s as any).original_name ??
              s.title ??
              "Untitled";
            return <Card
              key={s.id}
              title={s.name ?? s.original_name ?? s.title ?? "Untitled"}
              poster={resolveImage(s.poster_path) || "/images/notavailable.png"}
              kind="series"
              id={s.id}
              payload={s}
            />;
          })}
        </div>
      )}
    </section>
  );
}
