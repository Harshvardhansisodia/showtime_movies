// lib/images.ts

export function resolveImage(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "https://image.tmdb.org/t/p/w500";
  return `${base}${path}`;
}
export function resolveBackdrop(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_BACKDROP_BASE ?? "https://image.tmdb.org/t/p/w1280";
  return `${base}${path}`;
}