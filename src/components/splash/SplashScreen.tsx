import { useEffect, useRef, memo, useMemo } from 'react';
import { AnimatedGauge } from './AnimatedGauge';
import { playIgnitionSound, cleanupAudio } from './IgnitionSound';
import { BrandLogo } from './logos';
import type { SplashPhase } from '@/hooks/useSplashScreen';
import { DEFAULT_THEME, type SplashTheme } from '@/lib/splashThemes';

interface SplashScreenProps {
  phase: SplashPhase;
  onSkip?: () => void;
  theme?: SplashTheme;
}

// OPTIMIZED: Generate fewer aurora particles with simpler properties
function generateAuroraParticles(count: number, baseHue: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2, // Smaller: 2-5px
    hue: baseHue + Math.random() * 30 - 15,
    delay: Math.random() * 2,
    duration: 5 + Math.random() * 3, // Slower, smoother
  }));
}

export const SplashScreen = memo(function SplashScreen({ 
  phase, 
  onSkip,
  theme = DEFAULT_THEME 
}: SplashScreenProps) {
  const hasPlayedSound = useRef(false);
  
  // OPTIMIZED: Fewer particles (12-16 instead of 25-35)
  const particles = useMemo(() => {
    const count = theme.premium ? 14 : 10;
    return generateAuroraParticles(count, theme.colors.particleHue);
  }, [theme.colors.particleHue, theme.premium]);
  
  // Tocar som premium quando entrar na fase boot
  useEffect(() => {
    if (phase === 'boot' && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      setTimeout(() => {
        playIgnitionSound(0.55);
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
  const isExiting = phase === 'exiting';

  // Glow com cor da marca
  const glowColor = `hsl(${theme.colors.glow})`;
  const glowOpacityReady = theme.premium ? 0.18 : 0.15;
  const glowOpacityNormal = theme.premium ? 0.1 : 0.08;
  
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-out ${
        isExiting 
          ? 'opacity-0 scale-105 blur-lg' 
          : 'opacity-100 scale-100 blur-0'
      }`}
      style={{
        background: theme.gradient.background,
      }}
      onClick={onSkip}
      role="presentation"
      aria-label="Carregando aplicativo"
    >
      {/* Noise texture overlay para profundidade */}
      <div 
        className={`absolute inset-0 pointer-events-none ${theme.premium ? 'opacity-[0.04]' : 'opacity-[0.03]'}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Shimmer metálico para marcas premium */}
      {theme.premium && !isIgnition && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] animate-pulse"
          style={{
            background: `linear-gradient(45deg, transparent 30%, ${glowColor} 50%, transparent 70%)`,
            backgroundSize: '200% 200%',
          }}
        />
      )}
      
      {/* OPTIMIZED Aurora particles - GPU accelerated, simpler styles */}
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
              background: `hsl(${p.hue} 60% 50% / 0.5)`,
              boxShadow: `0 0 ${p.size}px hsl(${p.hue} 60% 50% / 0.3)`,
              animation: `aurora-optimized ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Glow principal atrás do gauge - cor da marca */}
      <div 
        className={`absolute w-[500px] h-[500px] rounded-full transition-all duration-1000 ${
          isIgnition ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`}
        style={{
          background: `
            radial-gradient(circle, 
              ${glowColor.replace(')', ` / ${isReady ? glowOpacityReady : glowOpacityNormal})`)} 0%, 
              ${glowColor.replace(')', ` / ${isReady ? glowOpacityNormal : 0.04})`)} 30%,
              transparent 70%
            )
          `,
          filter: 'blur(40px)',
        }}
      />
      
      {/* REMOVED: Second glow for premium brands - causes performance issues */}
      
      {/* Logo animado da marca - esconde durante exiting (FlyingLogo assume) */}
      <div 
        className={`mb-6 transition-all duration-500 ease-out ${
          isIgnition 
            ? 'opacity-0 scale-75' 
            : isExiting
              ? 'opacity-0 scale-50 -translate-y-8' // Fade out as FlyingLogo takes over
              : 'opacity-100 scale-100'
        }`}
      >
        <BrandLogo 
          brand={theme.brand}
          phase={phase}
          glowColor={glowColor}
        />
      </div>
      
      {/* Nome e slogan da marca */}
      <div 
        className={`mb-8 text-center transition-all duration-700 ease-out ${
          isIgnition 
            ? 'opacity-0 scale-90 blur-lg translate-y-4' 
            : isReady
              ? 'opacity-100 scale-100 blur-0 translate-y-0'
              : 'opacity-90 scale-100 blur-[1px] translate-y-0'
        }`}
      >
        <h1 
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{
            background: theme.gradient.logo,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: isReady ? `drop-shadow(0 0 30px ${glowColor.replace(')', ' / 0.5)')})` : 'none',
            transition: 'filter 0.5s ease-out',
          }}
        >
          {theme.displayName}
        </h1>
        <p 
          className={`text-sm mt-2 tracking-wide transition-all duration-500 ${
            isReady ? 'text-muted-foreground' : 'text-muted-foreground/60'
          }`}
          style={{
            fontStyle: theme.brand !== 'generic' ? 'italic' : 'normal',
          }}
        >
          {theme.slogan}
        </p>
      </div>
      
      {/* Gauge animado premium */}
      <div className={`transition-all duration-700 ${
        isIgnition ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
      }`}>
        <AnimatedGauge phase={isExiting ? 'ready' : phase} />
      </div>
      
      {/* Barra de progresso com cor da marca */}
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
              background: `linear-gradient(90deg, transparent 0%, ${glowColor.replace(')', ' / 0.3)')} 50%, transparent 100%)`,
            }}
          />
          
          {/* Barra de progresso com gradiente da marca */}
          <div
            className={`h-full rounded-full relative ${
              isIgnition ? 'w-0' : ''
            } ${isBoot ? 'w-[70%]' : ''} ${isReady || isExiting ? 'w-full' : ''}`}
            style={{
              background: theme.gradient.progress,
              boxShadow: isReady 
                ? `0 0 20px ${glowColor.replace(')', ' / 0.8)')}, 0 0 40px ${glowColor.replace(')', ' / 0.4)')}`
                : `0 0 10px ${glowColor.replace(')', ' / 0.5)')}`,
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
            textShadow: isReady ? `0 0 20px ${glowColor.replace(')', ' / 0.6)')}` : 'none',
            color: isReady ? glowColor : undefined,
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
              <span 
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: glowColor.replace(')', ' / 0.7)') }}
              />
              Verificando sistemas
            </span>
          )}
          {(isReady || isExiting) && (
            <span className="inline-flex items-center gap-2 animate-fade-in">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ background: glowColor }}
              />
              PRONTO
            </span>
          )}
        </p>
      </div>
      
      {/* Rodapé elegante */}
      <div className="absolute bottom-8 text-center">
        <p className="text-muted-foreground/40 text-xs font-light tracking-wide">
          {theme.brand !== 'generic' ? 'SmartScanner' : 'v1.0.0'}
        </p>
        {onSkip && (
          <p className="text-muted-foreground/25 text-[10px] mt-2 tracking-wider uppercase">
            Toque para pular
          </p>
        )}
      </div>
      
      {/* OPTIMIZED: Simpler aurora animation - fewer keyframes, GPU accelerated */}
      <style>{`
        @keyframes aurora-optimized {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(15px, -10px, 0) scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
});
