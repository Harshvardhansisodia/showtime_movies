// app/loading.tsx
export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/40 border-t-white" />
    </div>
  );
}
