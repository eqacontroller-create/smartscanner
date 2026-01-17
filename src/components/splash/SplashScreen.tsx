import { useEffect, useRef, memo, useMemo } from 'react';
import { AnimatedGauge } from './AnimatedGauge';
import { playIgnitionSound, cleanupAudio } from './IgnitionSound';
import type { SplashPhase } from '@/hooks/useSplashScreen';

interface SplashScreenProps {
  phase: SplashPhase;
  onSkip?: () => void;
}

// Gerar partículas estilo aurora boreal
function generateAuroraParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    hue: 142 + Math.random() * 40 - 20, // Verde com variação
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 4,
    amplitude: 15 + Math.random() * 20,
  }));
}

export const SplashScreen = memo(function SplashScreen({ phase, onSkip }: SplashScreenProps) {
  const hasPlayedSound = useRef(false);
  const particles = useMemo(() => generateAuroraParticles(25), []);
  
  // Tocar som premium quando entrar na fase boot
  useEffect(() => {
    if (phase === 'boot' && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      // Sincronizado com a animação visual
      setTimeout(() => {
        playIgnitionSound(0.25);
      }, 50);
    }
    
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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
        isReady ? 'opacity-100' : 'opacity-100'
      }`}
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, hsl(222 47% 14%) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, hsl(142 40% 8% / 0.5) 0%, transparent 40%),
          linear-gradient(180deg, hsl(222 47% 5%) 0%, hsl(222 47% 9%) 50%, hsl(222 47% 6%) 100%)
        `,
      }}
      onClick={onSkip}
      role="presentation"
      aria-label="Carregando aplicativo"
    >
      {/* Noise texture overlay para profundidade */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Partículas Aurora Boreal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!isIgnition && particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: `radial-gradient(circle, hsl(${p.hue} 70% 55% / 0.6) 0%, transparent 70%)`,
              boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue} 70% 50% / 0.4)`,
              animation: `aurora-float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              '--amplitude': `${p.amplitude}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Glow principal atrás do gauge */}
      <div 
        className={`absolute w-[500px] h-[500px] rounded-full transition-all duration-1000 ${
          isIgnition ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`}
        style={{
          background: `
            radial-gradient(circle, 
              hsl(142 76% 45% / ${isReady ? 0.15 : 0.08}) 0%, 
              hsl(142 76% 40% / ${isReady ? 0.08 : 0.04}) 30%,
              transparent 70%
            )
          `,
          filter: 'blur(40px)',
        }}
      />
      
      {/* Logo com efeito "acordar" (blur → focus) */}
      <div 
        className={`mb-10 text-center transition-all duration-700 ease-out ${
          isIgnition 
            ? 'opacity-0 scale-90 blur-lg translate-y-4' 
            : isReady
              ? 'opacity-100 scale-100 blur-0 translate-y-0'
              : 'opacity-90 scale-100 blur-[1px] translate-y-0'
        }`}
      >
        <h1 
          className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{
            background: `linear-gradient(135deg, 
              hsl(142 76% 60%) 0%, 
              hsl(142 76% 48%) 50%,
              hsl(152 70% 45%) 100%
            )`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: isReady ? 'drop-shadow(0 0 30px hsl(142 76% 45% / 0.5))' : 'none',
            transition: 'filter 0.5s ease-out',
          }}
        >
          SmartScanner
        </h1>
        <p 
          className={`text-sm mt-2 tracking-wide transition-all duration-500 ${
            isReady ? 'text-muted-foreground' : 'text-muted-foreground/60'
          }`}
        >
          Diagnóstico OBD-II Inteligente
        </p>
      </div>
      
      {/* Gauge animado premium */}
      <div className={`transition-all duration-700 ${
        isIgnition ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
      }`}>
        <AnimatedGauge phase={phase} />
      </div>
      
      {/* Barra de progresso com glow pulsante */}
      <div className="mt-12 w-56 md:w-72">
        <div 
          className="h-1 rounded-full overflow-hidden relative"
          style={{ background: 'hsl(var(--muted) / 0.5)' }}
        >
          {/* Glow pulsante na barra */}
          <div
            className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
              isBoot ? 'opacity-100 animate-pulse' : 'opacity-0'
            }`}
            style={{
              background: 'linear-gradient(90deg, transparent 0%, hsl(142 76% 45% / 0.3) 50%, transparent 100%)',
            }}
          />
          
          {/* Barra de progresso */}
          <div
            className={`h-full rounded-full relative ${
              isIgnition ? 'w-0' : ''
            } ${isBoot ? 'w-[70%]' : ''} ${isReady ? 'w-full' : ''}`}
            style={{
              background: 'linear-gradient(90deg, hsl(142 76% 40%) 0%, hsl(142 76% 55%) 100%)',
              boxShadow: isReady 
                ? '0 0 20px hsl(142 76% 45% / 0.8), 0 0 40px hsl(142 76% 45% / 0.4)'
                : '0 0 10px hsl(142 76% 45% / 0.5)',
              transition: isBoot 
                ? 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                : 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        
        {/* Status text premium */}
        <p 
          className={`text-center text-xs mt-4 font-medium tracking-widest uppercase transition-all duration-500 ${
            isReady 
              ? 'text-primary' 
              : 'text-muted-foreground/70'
          }`}
          style={{
            textShadow: isReady ? '0 0 20px hsl(142 76% 45% / 0.6)' : 'none',
          }}
        >
          {isIgnition && (
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
              Inicializando
            </span>
          )}
          {isBoot && (
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
              Verificando sistemas
            </span>
          )}
          {isReady && (
            <span className="inline-flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary" />
              PRONTO
            </span>
          )}
        </p>
      </div>
      
      {/* Rodapé elegante */}
      <div className="absolute bottom-8 text-center">
        <p className="text-muted-foreground/40 text-xs font-light tracking-wide">
          v1.0.0
        </p>
        {onSkip && (
          <p className="text-muted-foreground/25 text-[10px] mt-2 tracking-wider uppercase">
            Toque para pular
          </p>
        )}
      </div>
      
      {/* Estilos de animação inline */}
      <style>{`
        @keyframes aurora-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(var(--amplitude, 15px), calc(var(--amplitude, 15px) * -0.5)) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translate(calc(var(--amplitude, 15px) * 0.5), var(--amplitude, 15px)) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translate(calc(var(--amplitude, 15px) * -0.5), calc(var(--amplitude, 15px) * 0.3)) scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
});
