import { useEffect, useRef, memo } from 'react';
import { AnimatedGauge } from './AnimatedGauge';
import { playIgnitionSound, cleanupAudio } from './IgnitionSound';
import type { SplashPhase } from '@/hooks/useSplashScreen';

interface SplashScreenProps {
  phase: SplashPhase;
  onSkip?: () => void;
}

export const SplashScreen = memo(function SplashScreen({ phase, onSkip }: SplashScreenProps) {
  const hasPlayedSound = useRef(false);
  
  // Tocar som de ignição quando entrar na fase boot
  useEffect(() => {
    if (phase === 'boot' && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      // Pequeno delay para sincronizar com animação
      setTimeout(() => {
        playIgnitionSound(0.12);
      }, 100);
    }
    
    // Cleanup do áudio quando componente desmontar
    return () => {
      cleanupAudio();
    };
  }, [phase]);
  
  // Permitir pular com ESC ou clique
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onSkip) {
        onSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);
  
  if (phase === 'hidden') {
    return null;
  }

  const isIgnition = phase === 'ignition';
  const isReady = phase === 'ready';
  const isBoot = phase === 'boot';
  
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 47% 11%) 100%)',
      }}
      onClick={onSkip}
      role="presentation"
      aria-label="Carregando aplicativo"
    >
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!isIgnition && (
          <>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-splash-particle"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `hsl(${142 + Math.random() * 20} 70% 50% / ${0.2 + Math.random() * 0.3})`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </>
        )}
      </div>
      
      {/* Glow atrás do gauge */}
      <div 
        className={`absolute w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${isIgnition ? 'opacity-0' : 'opacity-30'}`}
        style={{
          background: 'radial-gradient(circle, hsl(142 76% 45% / 0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Logo no topo */}
      <div 
        className={`mb-8 text-center transition-all duration-500 ${isIgnition ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <h1 
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, hsl(142 76% 55%) 0%, hsl(142 76% 40%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: isReady ? '0 0 30px hsl(142 76% 45% / 0.5)' : 'none',
          }}
        >
          SmartScanner
        </h1>
        <p className="text-muted-foreground text-sm mt-1 opacity-70">
          Diagnóstico OBD-II Inteligente
        </p>
      </div>
      
      {/* Gauge animado */}
      <AnimatedGauge phase={phase} />
      
      {/* Barra de progresso */}
      <div className="mt-10 w-48 md:w-64">
        <div 
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'hsl(var(--muted))' }}
        >
          <div
            className={`h-full rounded-full transition-all ease-out ${isIgnition ? 'w-0' : ''} ${isBoot ? 'w-2/3 duration-1000' : ''} ${isReady ? 'w-full duration-500' : ''}`}
            style={{
              background: 'linear-gradient(90deg, hsl(142 76% 45%) 0%, hsl(142 76% 55%) 100%)',
              boxShadow: '0 0 10px hsl(142 76% 45% / 0.6)',
            }}
          />
        </div>
        
        {/* Status text */}
        <p 
          className={`text-center text-xs mt-3 font-medium tracking-wide uppercase transition-all duration-300 ${isReady ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
        >
          {isIgnition && 'Inicializando...'}
          {isBoot && 'Verificando sistemas...'}
          {isReady && '● PRONTO'}
        </p>
      </div>
      
      {/* Versão no rodapé */}
      <div className="absolute bottom-6 text-center">
        <p className="text-muted-foreground/50 text-xs">
          v1.0.0
        </p>
        {onSkip && (
          <p className="text-muted-foreground/30 text-xs mt-1">
            Toque para pular
          </p>
        )}
      </div>
    </div>
  );
});
