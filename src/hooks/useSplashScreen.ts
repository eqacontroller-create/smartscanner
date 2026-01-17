import { useState, useEffect, useCallback } from 'react';

export type SplashPhase = 'ignition' | 'boot' | 'ready' | 'hidden';

interface UseSplashScreenOptions {
  minDuration?: number;
  enabled?: boolean;
}

export function useSplashScreen(options: UseSplashScreenOptions = {}) {
  const { minDuration = 3200, enabled = true } = options; // Duração maior para experiência premium
  
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
    
    // Sequência de fases sincronizada com áudio premium
    const timers = [
      // Ignição → Boot (curto, para iniciar áudio)
      setTimeout(() => setPhase('boot'), 300),
      // Boot → Ready (sincronizado com fim do áudio ~1.6s)
      setTimeout(() => setPhase('ready'), 1800),
      // Ready → Hidden (após experiência completa)
      setTimeout(() => {
        setPhase('hidden');
        // Fade out elegante
        setTimeout(() => setIsVisible(false), 400);
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
