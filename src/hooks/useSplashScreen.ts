import { useState, useEffect, useCallback } from 'react';

export type SplashPhase = 'ignition' | 'boot' | 'ready' | 'exiting' | 'hidden';

interface UseSplashScreenOptions {
  minDuration?: number;
  enabled?: boolean;
}

export function useSplashScreen(options: UseSplashScreenOptions = {}) {
  const { minDuration = 5000, enabled = true } = options;
  
  const [isVisible, setIsVisible] = useState(enabled);
  const [phase, setPhase] = useState<SplashPhase>('ignition');
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      setPhase('hidden');
      return;
    }
    
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
      setPhase('hidden');
      return;
    }
    
    // Check if already shown this session
    const hasShownSplash = sessionStorage.getItem('splash_shown');
    if (hasShownSplash) {
      setIsVisible(false);
      setPhase('hidden');
      return;
    }
    
    // Mark as shown
    sessionStorage.setItem('splash_shown', 'true');
    
    // Premium phase sequence - slower and more majestic
    const timers = [
      // Ignition → Boot (moment of anticipation)
      setTimeout(() => setPhase('boot'), 600),
      // Boot → Ready (synced with premium sound ~3.8s)
      setTimeout(() => setPhase('ready'), 3800),
      // Ready → Exiting (start elegant exit animation)
      setTimeout(() => {
        setPhase('exiting');
        setIsExiting(true);
      }, minDuration - 800),
      // Exiting → Hidden (complete transition)
      setTimeout(() => {
        setPhase('hidden');
        setTimeout(() => setIsVisible(false), 100);
      }, minDuration),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [enabled, minDuration]);
  
  // Skip splash function
  const skipSplash = useCallback(() => {
    setIsExiting(true);
    setPhase('exiting');
    setTimeout(() => {
      setPhase('hidden');
      setIsVisible(false);
    }, 300);
  }, []);
  
  return { isVisible, phase, isExiting, skipSplash };
}
