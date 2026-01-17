import { useState, useEffect, useCallback } from 'react';

export type SplashPhase = 'ignition' | 'boot' | 'ready' | 'hidden';

interface UseSplashScreenOptions {
  minDuration?: number;
  enabled?: boolean;
}

export function useSplashScreen(options: UseSplashScreenOptions = {}) {
  const { minDuration = 2800, enabled = true } = options;
  
  const [isVisible, setIsVisible] = useState(enabled);
  const [phase, setPhase] = useState<SplashPhase>('ignition');
  
  // Verificar se deve mostrar splash (apenas primeira vez na sessão)
  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      setPhase('hidden');
      return;
    }
    
    // Verificar prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
      setPhase('hidden');
      return;
    }
    
    // Verificar se já mostrou nesta sessão
    const hasShownSplash = sessionStorage.getItem('splash_shown');
    if (hasShownSplash) {
      setIsVisible(false);
      setPhase('hidden');
      return;
    }
    
    // Marcar como mostrado
    sessionStorage.setItem('splash_shown', 'true');
    
    // Sequência de fases
    const timers = [
      // Ignição → Boot (após 400ms)
      setTimeout(() => setPhase('boot'), 400),
      // Boot → Ready (após 1600ms)
      setTimeout(() => setPhase('ready'), 1600),
      // Ready → Hidden (após minDuration)
      setTimeout(() => {
        setPhase('hidden');
        // Pequeno delay antes de esconder completamente para fade out
        setTimeout(() => setIsVisible(false), 300);
      }, minDuration),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [enabled, minDuration]);
  
  // Função para pular splash
  const skipSplash = useCallback(() => {
    setPhase('hidden');
    setTimeout(() => setIsVisible(false), 150);
  }, []);
  
  return { isVisible, phase, skipSplash };
}
