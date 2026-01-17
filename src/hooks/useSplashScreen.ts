import { useState, useEffect, useCallback } from 'react';

export type SplashPhase = 'ignition' | 'boot' | 'ready' | 'hidden';

interface UseSplashScreenOptions {
  minDuration?: number;
  enabled?: boolean;
}

export function useSplashScreen(options: UseSplashScreenOptions = {}) {
  const { minDuration = 5000, enabled = true } = options; // Duração maior para experiência de luxo
  
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
    
    // Sequência de fases sincronizada com áudio premium (mais devagar, com presença)
    const timers = [
      // Ignição → Boot (momento de expectativa)
      setTimeout(() => setPhase('boot'), 600),
      // Boot → Ready (sincronizado com som ~3.5s)
      setTimeout(() => setPhase('ready'), 3800),
      // Ready → Hidden (pausa para apreciar + fade elegante)
      setTimeout(() => {
        setPhase('hidden');
        // Fade out suave
        setTimeout(() => setIsVisible(false), 700);
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
