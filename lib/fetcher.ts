// lib/fetcher.ts
import { MoviesPage, Movie } from "./types";
import { Series, SeriesPage } from "./types";
import { API_BASE } from "./constants";


export async function fetchMoviesPage(
  page = 1,
  count: number | "estimated" = "estimated"
): Promise<MoviesPage> {
  const params = new URLSearchParams({ page: String(page), count: String(count) });
  const url = `${API_BASE}/api/movies?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 300, tags: ["movies"] } });
  if (!res.ok) throw new Error(`Failed to fetch movies: ${res.status}`);
  const data = (await res.json()) as MoviesPage;
  if (!data || !Array.isArray(data.results)) {
    throw new Error("Invalid movies payload");
  }
  return data;
}

// Convenience if only list is needed
export async function fetchMovies(
  page = 1,
  count: number | "estimated" = "estimated"
): Promise<Movie[]> {
  const data = await fetchMoviesPage(page, count);
  return data.results;
}

export async function fetchTrending(page = 1): Promise<Movie[]> {
  const url = `${API_BASE}/api/trendingmovies?page=${page}`;
  const res = await fetch(url, { next: { revalidate: 300, tags: ["trending"] } });
  if (!res.ok) throw new Error(`Failed to fetch trending: ${res.status}`);
  const data = (await res.json()) as MoviesPage;
  if (!data || !Array.isArray(data.results)) throw new Error("Invalid trending payload");
  return data.results;
}


export async function fetchSeries(
  page = 1,
  count: number | "estimated" = "estimated"
): Promise<Series[]> {
  const params = new URLSearchParams({ page: String(page), count: String(count) });
  const res = await fetch(`${API_BASE}/api/series?${params.toString()}`, {
    next: { revalidate: 300, tags: ["series"] },
  });
  if (!res.ok) throw new Error(`Failed to fetch series: ${res.status}`);
  const data = (await res.json()) as SeriesPage;
  if (!data || !Array.isArray(data.results)) throw new Error("Invalid series payload");
  return data.results;
}

export async function fetchSeriesPage(page = 1, count: number | "estimated" = 24): Promise<SeriesPage> {
  const params = new URLSearchParams({ page: String(page), count: String(count) });
  const res = await fetch(`${API_BASE}/api/series?${params.toString()}`, {
    next: { revalidate: 300, tags: ["series"] },
  });
  if (!res.ok) throw new Error(`Failed to fetch series page: ${res.status}`);
  const data = (await res.json()) as SeriesPage;
  if (!data || !Array.isArray(data.results)) throw new Error("Invalid series payload");
  return data;
}


export async function fetchHLSToken(): Promise<string | null> {
  const url = `${API_BASE}/api/hlstoken/1`;

  // Next.js server-side fetch (no CORS issue)
  const res = await fetch(url, {
    next: { revalidate: 60, tags: ["hlstoken"] },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch HLS token: ${res.status}`);
  }

  const data = await res.json();
  if (!data || typeof data.hlstoken !== "string") {
    throw new Error("Invalid HLS token payload");
  }

  return data.hlstoken;
}
