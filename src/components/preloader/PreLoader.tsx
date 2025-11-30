'use client';

import { useEffect, useState } from 'react';

interface PreLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

export function PreLoader({ onComplete, duration = 2000 }: PreLoaderProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-6xl font-medium text-white" style={{ fontFamily: 'var(--font-doto)' }}>
        Social Bro
      </div>
    </div>
  );
}
