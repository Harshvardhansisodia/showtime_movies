// components/layout/Header.tsx
import Link from "next/link";
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">ShowTime</Link>
        <nav className="text-sm text-gray-300 space-x-4">
          <Link href="/movies" className="hover:text-white">Movies</Link>
          <Link href="/series" className="hover:text-white">Series</Link>
          <Link href="/request" className="hover:text-white">Request</Link>
        </nav>
      </div>
    </header>
  );
}
