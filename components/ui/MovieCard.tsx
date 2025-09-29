// components/ui/MovieCard.tsx
import Link from "next/link";
import Card from "./Card";
import { resolveImage } from "@/lib/images";
import { Movie } from "@/lib/types";

export default function MovieCard({ movie }: { movie: Movie }) {
  const poster = resolveImage(movie.poster_path);
  return (
    <Link href={`/movies/${movie.id}`}>
      <Card title={movie.title} poster={poster || "/images/notavailable.png"} />
    </Link>
  );
}
