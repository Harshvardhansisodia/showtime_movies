'use client';

import { useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashScreenWrapper() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('splashSeen');
    if (!seen) setShowSplash(true);
  }, []);

  const handleDone = () => {
    localStorage.setItem('splashSeen', 'true');
    setShowSplash(false);
  };

  if (!showSplash) return null;

  return <SplashScreen onDone={handleDone} />;
}
