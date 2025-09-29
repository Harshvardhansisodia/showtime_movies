// app/(site)/error.tsx
"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-6 py-16">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-gray-400">
        We couldn’t load this page right now. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded bg-white px-4 py-2 text-black hover:bg-gray-200"
      >
        Try again
      </button>
    </div>
  );
}
