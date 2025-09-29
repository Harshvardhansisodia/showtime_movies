// components/ui/Card.tsx
"use client";
import Link from "next/link";
import Image from "next/image";

type Kind = "movies" | "series" | "request";

type Props = {
  title: string;
  poster: string;
  href?: string;               // optional direct href override
  kind?: Kind;                 // auto-build href if given with id
  id?: number | string;
  payload?: any;               // full item to pass to detail page
  prefetch?: boolean | null;   // let Next manage prefetch by default
};

export default function Card({ title, poster, href, kind, id, payload, prefetch = null }: Props) {
  const autoHref = !href && kind && (id !== undefined && id !== null) ? `/${kind}/${id}` : href;
  const to = autoHref ?? "#";

  function handleClick() {
    if (!payload || !autoHref) return;
    try {
      const key = `detail:${autoHref}`;
      const record = { v: 1, at: Date.now(), data: payload };
      sessionStorage.setItem(key, JSON.stringify(record)); // per‑tab storage [web:587][web:588]
    } catch {}
  }

  return (
    <Link href={to} prefetch={prefetch} onClick={handleClick}>
      <div className="group relative rounded-lg p-[2px] bg-[linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)] bg-[length:300%_300%] animate-gradient">
        <div className="overflow-hidden rounded-lg bg-[#0f172a]">
          <div className="relative aspect-[2/3]">
            <Image
              src={poster}
              alt={title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          </div>
          <div className="p-3">
            <h3 className="flex items-center text-sm text-white/90 truncate">{title}</h3>
          </div>
        </div>
        <span className="absolute inset-0" aria-hidden />
      </div>
    </Link>
  );
}
