// components/layout/Footer.tsx
export default function Footer() {
  return (
<footer className="border-t border-white/10">
  <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-400 flex flex-col md:flex-row items-center md:justify-between gap-2">
    {/* Left text */}
    <span>© {new Date().getFullYear()} ShowTime</span>

    {/* Right text */}
    <span>With ❤️ by Harshul</span>
  </div>
</footer>

  );
}
