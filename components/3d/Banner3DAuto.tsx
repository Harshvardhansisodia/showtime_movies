// components/3d/Banner3DAuto.tsx
"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Image as DreiImage } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export type AutoSlideItem = {
  id: number;
  title: string;
  backdrop: string;
  poster?: string;
  href?: string;
  overview?: string;
  payload:{}
};

// Mouse drag hook for desktop
function useMouseDrag(onDragLeft?: () => void, onDragRight?: () => void) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const minDragDistance = 50;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
    setDragStart(e.clientX);
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragStart === null) return;
    setIsDragging(true);
    e.preventDefault();
  }, [dragStart]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragStart === null) return;
    
    if (isDragging) {
      const distance = dragStart - e.clientX;
      const isLeftDrag = distance > minDragDistance;
      const isRightDrag = distance < -minDragDistance;

      if (isLeftDrag) {
        onDragLeft?.();
      } else if (isRightDrag) {
        onDragRight?.();
      }
    }

    setIsDragging(false);
    setDragStart(null);
    e.preventDefault();
  }, [dragStart, isDragging, onDragLeft, onDragRight, minDragDistance]);

  return {
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
    isDragging,
  };
}

// Touch swipe hook for mobile
function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft?.();
    } else if (isRightSwipe) {
      onSwipeRight?.();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, minSwipeDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Hydration-safe device detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isMounted };
}

function Slides({ items, index, isMobile }: { items: AutoSlideItem[]; index: number; isMobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const vw = viewport.width;
  const vh = viewport.height;

  const slides = useMemo(
    () =>
      items.map((it, i) => ({
        ...it,
        pos: [i * vw, 0, 0] as [number, number, number],
        url: (isMobile && it.poster ? it.poster : it.backdrop) || it.backdrop,
      })),
    [items, vw, isMobile]
  );

  useFrame((_, delta) => {
    const targetX = -index * vw;
    if (group.current) {
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 4, delta);
    }
  });

  return (
    <group ref={group}>
      {slides.map((s) => (
        <group key={s.id} position={s.pos}>
          {s.url && (
            <DreiImage 
              url={s.url} 
              scale={[vw, vh]} 
              toneMapped={false}
            />
          )}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[vw, vh]} />
            <meshBasicMaterial transparent color="#000" opacity={0.14} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Mobile fallback component
function MobileBanner({ items, index }: { items: AutoSlideItem[]; index: number }) {
  const active = items[index] ?? items[0];
  const imageUrl = (active?.poster || active?.backdrop) ?? '';
  
  return (
    <div 
      className="h-full w-full bg-cover bg-center bg-no-repeat relative transition-all duration-500 ease-out"
      style={{
        backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(45deg, #1a1a1a, #2d2d2d)',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

export default function Banner3DAuto({ items }: { items: AutoSlideItem[] }) {
  const count = Math.max(1, items.length);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { isMobile, isMounted } = useIsMobile();
  const router = useRouter();

  // Auto slide with pause/resume capability
  useEffect(() => {
    if (isPaused) return;
    
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count, isPaused]);

  const goToNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, [count]);

  const goToPrev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, [count]);

  const goToSlide = useCallback((slideIndex: number) => {
    setIndex(slideIndex);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  // Handle banner click on mobile (navigate to current movie)
  const handleBannerClick = useCallback((e: React.MouseEvent) => {
    if (!isMobile) return;
    
    // Don't trigger if clicking on buttons or dots
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    
    const active = items[index];
    if (active?.href) {
      window.location.href = active.href;
    }
  }, [isMobile, items, index]);

  // Desktop mouse drag handlers - destructure to separate isDragging from DOM props
  const { handlers: dragHandlers, isDragging } = useMouseDrag(goToNext, goToPrev);

  // Mobile touch swipe handlers
  const swipeHandlers = useSwipe(goToNext, goToPrev);

  const active = items[index] ?? items[0];

  // Show fallback during SSR and hydration
  if (!isMounted) {
    return (
      <div className="relative h-[90vh] w-full overflow-hidden">
        <MobileBanner items={items} index={index} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/30 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
        <div className="relative z-20 flex h-full items-end">
          <div className="w-full max-w-6xl md:mx-auto ml-4 md:ml-0 px-0 md:px-6 pb-12">
            <p className="text-blue-300 text-sm">Newly Added</p>
            <h1 className="mt-2 text-4xl md:text-7xl font-semibold tracking-wide text-white drop-shadow-lg">
              {active?.title ?? "—"}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    
    <div 
      className="relative h-[95vh] w-full overflow-hidden select-none"
      {...(isMobile ? swipeHandlers : dragHandlers)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {isMobile ? (
          <MobileBanner items={items} index={index} />
        ) : (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ fov: 55, position: [0, 0, 6] }}
            fallback={<MobileBanner items={items} index={index} />}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 6, 5]} intensity={0.9} />
            <Environment preset="city" background={false} />
            <Slides items={items} index={index} isMobile={false} />
          </Canvas>
        )}
      </div>

      {/* Gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-black via-black/60 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-92 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />

      {/* Content overlay */}
      <div className="relative z-20 flex h-full items-end pointer-events-none">
        <div className="w-full max-w-6xl md:mx-auto ml-4 md:ml-5 px-0 md:px-6 pb-12">
          <p className="text-blue-300 text-xl">Newly Added</p>
          <h1 className="mt-2 text-4xl md:text-9xl font-semibold tracking-wide text-white drop-shadow-lg transition-all duration-500">
            {active?.title ?? "—"}
          </h1>
          {active?.overview ? (
            <p className="mt-4 max-w-2xl text-gray-200 line-clamp-3 drop-shadow-md transition-all duration-500">
              {active.overview}
            </p>
          ) : null}
          <div className="mt-6 flex gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                if (!active?.href) return;
                try {
                  const key = `detail:${active.href}`;
                  const rec = { v: 1, at: Date.now(), data: active };
                  sessionStorage.setItem(key, JSON.stringify(rec)); // store payload [web:587]
                } catch {}
                router.push(active.href); // client-side route change [web:617]
              }}
              className="inline-flex items-center rounded-md border-0 bg-white px-5 h-11 text-black font-medium hover:bg-gray-200 transition-colors touch-manipulation"
            >
              ▶ Watch Now
            </button>
            <button className="inline-flex items-center rounded-md border border-white/30 px-5 h-11 text-white hover:bg-white/10 transition-colors touch-manipulation">
              + Add
            </button>
          </div>

          {/* Navigation dots */}
          <div className="mt-6 flex gap-2 pointer-events-auto">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(i);
                }}
                className={`h-2 w-2 rounded-full transition-all duration-300 touch-manipulation ${
                  i === index ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60 hover:scale-110"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Interaction hints */}
          {isMobile ? (
            <p className="mt-4 text-xs text-white/60 pointer-events-none">
              Swipe to navigate • Tap to watch
            </p>
          ) : (
            <p className="mt-4 text-xs text-white/60 pointer-events-none">
              Drag to navigate
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
