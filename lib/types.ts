// lib/types.ts
export type Movie = {
  id: number;
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  created_at?: string | null;
  video_url?: string | null;
};

export type MoviesPage = {
  page: number;
  total: number;
  totalPages: number;
  results: Movie[];
};


export type Series = {
  id: number;
  name?: string;
  original_name?: string;
  title?: string;         
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  created_at?: string | null;
};

export type SeriesPage = {
  page: number;
  total: number;
  totalPages: number;
  results: Series[];
};
