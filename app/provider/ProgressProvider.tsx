// app/providers/ProgressProvider.tsx
"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timeout: any;
    // start after short delay to avoid flicker on fast transitions
    timeout = setTimeout(() => setActive(true), 150);
    return () => {
      clearTimeout(timeout);
      setActive(false);
    };
  }, [pathname]);

  return (
    <>
      {/* top bar */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] bg-white" />
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { transform: translateX(-100%) }
          50% { transform: translateX(100%) }
          100% { transform: translateX(300%) }
        }
      `}</style>

      {children}
    </>
  );
}
