// app/(site)/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="px-6 py-16">
      <h2 className="text-2xl font-semibold">Not Found</h2>
      <p className="mt-2 text-gray-400">Could not find requested resource.</p>
      <Link href="/" className="mt-6 inline-block underline text-blue-400">
        Go home
      </Link>
    </section>
  );
}
