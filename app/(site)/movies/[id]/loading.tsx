// app/(site)/movies/[id]/loading.tsx
export default function Loading() {
  return (
    <section className="px-6 py-10">
      <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="aspect-video w-full bg-gray-800 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </section>
  );
}
