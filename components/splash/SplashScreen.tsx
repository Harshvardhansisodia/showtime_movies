'use client';

import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLoadReady } from './useLoadReady';
import { useBodyScrollLock } from './useBodyScrollLock';
import Particles from './Particles';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const isReady = useLoadReady({ idleMs: 400, minDurationMs: 1400 });
  const [phase, setPhase] = useState<'title' | 'popcorn' | 'gate' | 'done'>('title');
  const [visible, setVisible] = useState(true);
  const [startY, setStartY] = useState<number | null>(null);

  useBodyScrollLock(visible);

  // Phase sequencing
  useEffect(() => {
    if (phase === 'title') {
      const t = setTimeout(() => setPhase('popcorn'), 1000);
      return () => clearTimeout(t);
    }
    if (phase === 'popcorn') {
      const t = setTimeout(() => setPhase('gate'), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Done phase: fade out and call onDone
  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 600);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  // Left-click drag swipe detection
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
    setStartY(e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startY == null) return;
    const dy = e.clientY - startY;
    if (dy < -50 && isReady) setPhase('done');
    setStartY(null);
  };

  const dismissIfReady = () => { if (isReady) setPhase('done'); };

  // Motion value for drag
  const y = useMotionValue(0);

  const handleDragEnd = (_: any, info: { point: { y: number } }) => {
    if (info.point.y < -50) {
      // drag threshold passed → hide splash
      setPhase('done');
      setVisible(false);
      onDone();
    } else {
      // snap back
      y.set(0);
    }
  };

  // Container class
  const containerClass = useMemo(
    () => `fixed inset-0 z-[9999] bg-black select-none overscroll-none ${visible ? '' : 'pointer-events-none invisible'}`,
    [visible]
  );

  return (
    <div
      aria-hidden={!visible}
      className={containerClass}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Full-screen motion div for smooth swipe-up effect */}
      <motion.div
        className="cursor-grab absolute inset-0 w-full h-full"
        style={{ y }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: -9999, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ y: phase === 'done' ? '-100%' : '0%' }}
        transition={{ duration: 10, ease: 'easeInOut' }}
      >
        {/* Background particles */}
        {visible && <Particles />}

        {/* Title */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'title' && (
              <motion.h1
                key="title"
                className="text-5xl md:text-7xl tracking-widest font-extrabold text-white"
                initial={{ scale: 0.6, opacity: 0, letterSpacing: '0.2em' }}
                animate={{ scale: 1, opacity: 1, letterSpacing: '0.35em' }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              >
                SHOWTIME
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom "GRAB YOUR POPCORN" and swipe button */}
        <div className="absolute bottom-16 w-full flex flex-col items-center gap-4 px-6 text-center">
          {(phase === 'popcorn' || phase === 'gate') && (
            <motion.p
              className="text-2xl md:text-3xl text-white"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              GRAB YOUR POPCORNS!!
            </motion.p>
          )}

          {phase === 'gate' && isReady && (
            <motion.img
              src="/images/up.png"
              alt="Swipe up"
              className="w-25 h-25"
              animate={{ y: [0, 6, 0] }} // small up-down animation
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
