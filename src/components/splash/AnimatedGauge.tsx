import { useEffect, useState } from 'react';

interface AnimatedGaugeProps {
  phase: 'ignition' | 'boot' | 'ready' | 'hidden';
}

export function AnimatedGauge({ phase }: AnimatedGaugeProps) {
  const [needleAngle, setNeedleAngle] = useState(-135);
  const [activeLeds, setActiveLeds] = useState<number[]>([]);
  
  // Animação da agulha baseada na fase
  useEffect(() => {
    if (phase === 'ignition') {
      setNeedleAngle(-135);
      setActiveLeds([]);
    } else if (phase === 'boot') {
      // Sweep para o máximo
      const bootSequence = async () => {
        // Subir gradualmente
        for (let i = 0; i <= 10; i++) {
          await new Promise(r => setTimeout(r, 50));
          setNeedleAngle(-135 + (i * 27)); // -135 a +135
          setActiveLeds(Array.from({ length: i + 1 }, (_, idx) => idx));
        }
        // Voltar para zero
        await new Promise(r => setTimeout(r, 200));
        for (let i = 10; i >= 5; i--) {
          await new Promise(r => setTimeout(r, 40));
          setNeedleAngle(-135 + (i * 27));
          setActiveLeds(Array.from({ length: i + 1 }, (_, idx) => idx));
        }
      };
      bootSequence();
    } else if (phase === 'ready') {
      setNeedleAngle(0);
      setActiveLeds([0, 1, 2, 3, 4]); // Verde apenas
    }
  }, [phase]);

  // Cores dos LEDs: verde (0-4), amarelo (5-7), vermelho (8-10)
  const getLedColor = (index: number, isActive: boolean) => {
    if (!isActive) return 'hsl(var(--muted))';
    if (index < 5) return 'hsl(142 76% 45%)'; // Verde
    if (index < 8) return 'hsl(45 93% 55%)'; // Amarelo
    return 'hsl(0 84% 55%)'; // Vermelho
  };

  const getLedGlow = (index: number, isActive: boolean) => {
    if (!isActive) return 'none';
    if (index < 5) return '0 0 8px hsl(142 76% 45% / 0.8)';
    if (index < 8) return '0 0 8px hsl(45 93% 55% / 0.8)';
    return '0 0 12px hsl(0 84% 55% / 0.9)';
  };

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Fundo do gauge */}
        <defs>
          <radialGradient id="gaugeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(222 47% 15%)" />
            <stop offset="100%" stopColor="hsl(222 47% 8%)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Círculo externo */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          opacity="0.5"
        />
        
        {/* Fundo principal */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#gaugeGradient)"
        />
        
        {/* Anel interno decorativo */}
        <circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* LEDs no arco */}
        {Array.from({ length: 11 }).map((_, i) => {
          const angle = -135 + (i * 27);
          const radian = (angle * Math.PI) / 180;
          const x = 100 + 80 * Math.cos(radian);
          const y = 100 + 80 * Math.sin(radian);
          const isActive = activeLeds.includes(i);
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="5"
              fill={getLedColor(i, isActive)}
              filter={isActive ? "url(#glow)" : undefined}
              style={{
                boxShadow: getLedGlow(i, isActive),
                transition: 'fill 0.1s ease-out',
              }}
            />
          );
        })}
        
        {/* Marcações numéricas */}
        {[0, 2, 4, 6, 8].map((num, i) => {
          const angle = -135 + (i * 67.5);
          const radian = (angle * Math.PI) / 180;
          const x = 100 + 62 * Math.cos(radian);
          const y = 100 + 62 * Math.sin(radian);
          
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
              fontFamily="system-ui"
            >
              {num}
            </text>
          );
        })}
        
        {/* Texto RPM x1000 */}
        <text
          x="100"
          y="140"
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize="8"
          opacity="0.7"
        >
          RPM x1000
        </text>
        
        {/* Centro do gauge */}
        <circle
          cx="100"
          cy="100"
          r="12"
          fill="hsl(222 47% 20%)"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        
        {/* Agulha */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '100px 100px',
            transition: phase === 'boot' ? 'transform 0.05s linear' : 'transform 0.3s ease-out',
          }}
        >
          {/* Sombra da agulha */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="hsl(0 0% 0% / 0.3)"
            strokeWidth="4"
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          {/* Agulha principal */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="hsl(0 84% 55%)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#strongGlow)"
          />
          {/* Ponta da agulha */}
          <polygon
            points="100,30 96,45 104,45"
            fill="hsl(0 84% 55%)"
            filter="url(#glow)"
          />
        </g>
        
        {/* Centro decorativo */}
        <circle
          cx="100"
          cy="100"
          r="8"
          fill="hsl(222 47% 25%)"
        />
        <circle
          cx="100"
          cy="100"
          r="4"
          fill="hsl(0 84% 55%)"
          filter="url(#glow)"
        />
      </svg>
      
      {/* Reflexo/brilho */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
