import { useEffect, useState, useRef } from 'react';

interface AnimatedGaugeProps {
  phase: 'ignition' | 'boot' | 'ready' | 'hidden';
}

export function AnimatedGauge({ phase }: AnimatedGaugeProps) {
  const [needleAngle, setNeedleAngle] = useState(-135);
  const [activeLeds, setActiveLeds] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);
  
  // Animação fluida com easing de luxo
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (phase === 'ignition') {
      setNeedleAngle(-135);
      setActiveLeds([]);
    } else if (phase === 'boot') {
      // Animação suave e majestosa com bezier curves
      let startTime: number | null = null;
      const totalDuration = 2800; // ms - mais devagar para presença
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        // Easing: ease-out-expo para subida, ease-in-out para descida
        let easedProgress: number;
        let targetAngle: number;
        let targetLeds: number;
        
        if (progress < 0.6) {
          // Fase 1: Subida rápida (0-60%)
          const phaseProgress = progress / 0.6;
          // Ease-out-expo
          easedProgress = 1 - Math.pow(2, -10 * phaseProgress);
          targetAngle = -135 + (270 * easedProgress); // -135 a +135
          targetLeds = Math.floor(11 * easedProgress);
        } else if (progress < 0.75) {
          // Fase 2: Pequeno bounce no máximo (60-75%)
          const bounceProgress = (progress - 0.6) / 0.15;
          targetAngle = 135 - (30 * Math.sin(bounceProgress * Math.PI)); // Bounce
          targetLeds = 11;
        } else {
          // Fase 3: Descida suave para idle (75-100%)
          const descentProgress = (progress - 0.75) / 0.25;
          // Ease-in-out-cubic
          easedProgress = descentProgress < 0.5 
            ? 4 * descentProgress * descentProgress * descentProgress
            : 1 - Math.pow(-2 * descentProgress + 2, 3) / 2;
          targetAngle = 135 - (135 * easedProgress); // 135 a 0
          targetLeds = 11 - Math.floor(6 * easedProgress); // 11 a 5
        }
        
        setNeedleAngle(targetAngle);
        setActiveLeds(Array.from({ length: Math.max(0, targetLeds) }, (_, idx) => idx));
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else if (phase === 'ready') {
      // Posição final suave
      const animateToReady = () => {
        let startTime: number | null = null;
        const duration = 400;
        const startAngle = needleAngle;
        
        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease-out-cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setNeedleAngle(startAngle + (0 - startAngle) * eased);
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setNeedleAngle(0);
            setActiveLeds([0, 1, 2, 3, 4]); // Verde apenas
          }
        };
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animateToReady();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase]);

  // Cores dos LEDs com gradientes premium
  const getLedColor = (index: number, isActive: boolean) => {
    if (!isActive) return 'hsl(217 33% 20%)';
    if (index < 5) return 'hsl(142 76% 45%)'; // Verde
    if (index < 8) return 'hsl(45 93% 55%)'; // Amarelo
    return 'hsl(0 84% 55%)'; // Vermelho
  };

  const getLedGlow = (index: number, isActive: boolean) => {
    if (!isActive) return 'none';
    if (index < 5) return '0 0 12px hsl(142 76% 45% / 0.9)';
    if (index < 8) return '0 0 12px hsl(45 93% 55% / 0.9)';
    return '0 0 15px hsl(0 84% 55% / 1)';
  };

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          {/* Gradiente de fundo premium */}
          <radialGradient id="gaugeGradientPremium" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(222 47% 16%)" />
            <stop offset="70%" stopColor="hsl(222 47% 10%)" />
            <stop offset="100%" stopColor="hsl(222 47% 6%)" />
          </radialGradient>
          
          {/* Gradiente do anel externo */}
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217 33% 30%)" />
            <stop offset="50%" stopColor="hsl(217 33% 20%)" />
            <stop offset="100%" stopColor="hsl(217 33% 25%)" />
          </linearGradient>
          
          {/* Efeito de glow suave */}
          <filter id="glowSoft">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Efeito de glow forte */}
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Sombra interna */}
          <filter id="innerShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="3" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
            <feBlend in2="SourceGraphic" mode="normal" />
          </filter>
        </defs>
        
        {/* Sombra externa do gauge */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="hsl(0 0% 0% / 0.3)"
          strokeWidth="4"
          filter="url(#glowSoft)"
        />
        
        {/* Anel externo metálico */}
        <circle
          cx="100"
          cy="100"
          r="93"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="3"
        />
        
        {/* Fundo principal com profundidade */}
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="url(#gaugeGradientPremium)"
          filter="url(#innerShadow)"
        />
        
        {/* Anel interno decorativo */}
        <circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke="hsl(217 33% 25% / 0.5)"
          strokeWidth="0.5"
        />
        
        {/* LEDs no arco com animação suave */}
        {Array.from({ length: 11 }).map((_, i) => {
          const angle = -135 + (i * 27);
          const radian = (angle * Math.PI) / 180;
          const x = 100 + 80 * Math.cos(radian);
          const y = 100 + 80 * Math.sin(radian);
          const isActive = activeLeds.includes(i);
          
          return (
            <g key={i}>
              {/* Glow do LED */}
              {isActive && (
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={getLedColor(i, true)}
                  opacity="0.3"
                  filter="url(#glowSoft)"
                />
              )}
              {/* LED principal */}
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={getLedColor(i, isActive)}
                style={{
                  filter: isActive ? 'url(#glowSoft)' : undefined,
                  transition: 'fill 0.08s ease-out',
                }}
              />
              {/* Reflexo do LED */}
              {isActive && (
                <circle
                  cx={x - 1.5}
                  cy={y - 1.5}
                  r="1.5"
                  fill="hsl(0 0% 100% / 0.4)"
                />
              )}
            </g>
          );
        })}
        
        {/* Marcações numéricas premium */}
        {[0, 2, 4, 6, 8].map((num, i) => {
          const angle = -135 + (i * 67.5);
          const radian = (angle * Math.PI) / 180;
          const x = 100 + 60 * Math.cos(radian);
          const y = 100 + 60 * Math.sin(radian);
          
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(215 20% 60%)"
              fontSize="11"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="500"
            >
              {num}
            </text>
          );
        })}
        
        {/* Texto RPM x1000 */}
        <text
          x="100"
          y="138"
          textAnchor="middle"
          fill="hsl(215 20% 50%)"
          fontSize="8"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          RPM ×1000
        </text>
        
        {/* Centro do gauge com efeito metálico */}
        <circle
          cx="100"
          cy="100"
          r="14"
          fill="hsl(222 47% 18%)"
          stroke="hsl(217 33% 30%)"
          strokeWidth="1"
        />
        
        {/* Agulha com movimento fluido */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '100px 100px',
            transition: phase === 'ready' ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        >
          {/* Sombra da agulha */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="32"
            stroke="hsl(0 0% 0% / 0.4)"
            strokeWidth="5"
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          
          {/* Base da agulha */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="32"
            stroke="hsl(0 84% 40%)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Agulha principal com glow */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="33"
            stroke="hsl(0 84% 55%)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glowStrong)"
          />
          
          {/* Ponta luminosa */}
          <polygon
            points="100,28 96,42 104,42"
            fill="hsl(0 84% 55%)"
            filter="url(#glowSoft)"
          />
          
          {/* Brilho na ponta */}
          <circle
            cx="100"
            cy="32"
            r="3"
            fill="hsl(0 84% 70%)"
            opacity="0.8"
          />
        </g>
        
        {/* Centro decorativo final */}
        <circle
          cx="100"
          cy="100"
          r="10"
          fill="hsl(222 47% 22%)"
        />
        <circle
          cx="100"
          cy="100"
          r="6"
          fill="hsl(222 47% 28%)"
        />
        <circle
          cx="100"
          cy="100"
          r="4"
          fill="hsl(0 84% 55%)"
          filter="url(#glowSoft)"
        />
        {/* Reflexo central */}
        <circle
          cx="98"
          cy="98"
          r="2"
          fill="hsl(0 0% 100% / 0.3)"
        />
      </svg>
      
      {/* Reflexo de vidro sobreposto */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `
            linear-gradient(
              145deg, 
              hsl(0 0% 100% / 0.06) 0%, 
              transparent 40%,
              transparent 60%,
              hsl(0 0% 0% / 0.1) 100%
            )
          `,
        }}
      />
    </div>
  );
}
