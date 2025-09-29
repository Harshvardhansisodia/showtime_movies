// components/ui/HorizontalRail.tsx
"use client";
import { useCallback, useRef, useState } from "react";

export default function HorizontalRail({
  children,
  ariaLabel = "Movies",
  className = "",
  enableWheel = true,
  enableDrag = true,
}: {
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  enableWheel?: boolean;
  enableDrag?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  // Map vertical wheel to horizontal scroll (optional)
  const onHorizontalWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!enableWheel) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      e.currentTarget.scrollBy({ left: e.deltaY < 0 ? -80 : 80, behavior: "auto" });
    }
  }, [enableWheel]);

  // Pointer-based drag scrolling (desktop)
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableDrag) return;
    const el = ref.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
  }, [enableDrag]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - startX.current;
    el.scrollLeft = startScrollLeft.current - dx;
  }, [dragging]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const el = ref.current;
    if (!el) return;
    // pointer capture auto releases on pointerup; just toggle state
    setDragging(false);
  }, [dragging]);

  return (
    <div
      ref={ref}
      role="list"
      aria-label={ariaLabel}
      onWheel={enableWheel ? onHorizontalWheel : undefined}
      onPointerDown={enableDrag ? onPointerDown : undefined}
      onPointerMove={enableDrag ? onPointerMove : undefined}
      onPointerUp={enableDrag ? endDrag : undefined}
      onPointerCancel={enableDrag ? endDrag : undefined}
      className={[
        "overflow-x-auto no-scrollbar flex snap-x snap-mandatory gap-4",
        "touch-pan-x select-none",        // allow horizontal touch pan, prevent accidental text select
        dragging ? "cursor-grabbing" : "cursor-grab", // visual feedback
        className,
      ].join(" ")}
      // Prevent native image drag ghost on desktop
      draggable={false}
    >
      {children}
    </div>
  );
}
