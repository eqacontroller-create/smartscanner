import React from 'react';
import { cn } from '@/lib/utils';

interface OBDDiagramProps {
  portPosition: { x: number; y: number };
  className?: string;
}

export function OBDDiagram({ portPosition, className }: OBDDiagramProps) {
  return (
    <div className={cn("relative w-full max-w-sm mx-auto", className)}>
      <svg
        viewBox="0 0 300 200"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Painel do carro - fundo */}
        <rect
          x="10"
          y="10"
          width="280"
          height="180"
          rx="8"
          className="fill-muted/30 stroke-border"
          strokeWidth="2"
        />

        {/* Volante */}
        <circle
          cx="150"
          cy="50"
          r="35"
          className="fill-muted stroke-foreground/50"
          strokeWidth="3"
        />
        <circle
          cx="150"
          cy="50"
          r="12"
          className="fill-background stroke-foreground/50"
          strokeWidth="2"
        />
        
        {/* Painel de instrumentos */}
        <rect
          x="90"
          y="15"
          width="120"
          height="20"
          rx="4"
          className="fill-muted/50 stroke-border"
          strokeWidth="1"
        />

        {/* Pedais */}
        <g className="fill-muted/60 stroke-foreground/30" strokeWidth="1">
          {/* Embreagem */}
          <rect x="50" y="140" width="25" height="40" rx="3" />
          {/* Freio */}
          <rect x="85" y="145" width="30" height="35" rx="3" />
          {/* Acelerador */}
          <rect x="125" y="155" width="20" height="25" rx="3" />
        </g>

        {/* Console central */}
        <rect
          x="200"
          y="80"
          width="70"
          height="100"
          rx="4"
          className="fill-muted/40 stroke-border"
          strokeWidth="1"
        />

        {/* Caixa de fusíveis (lado esquerdo) */}
        <rect
          x="20"
          y="100"
          width="40"
          height="50"
          rx="3"
          className="fill-muted/50 stroke-border"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
        <text
          x="40"
          y="128"
          textAnchor="middle"
          className="fill-muted-foreground text-[8px]"
        >
          Fusíveis
        </text>

        {/* Porta OBD - Posição dinâmica */}
        <g transform={`translate(${portPosition.x * 2.8}, ${portPosition.y * 1.8})`}>
          {/* Círculo de radar pulsante */}
          <circle
            r="25"
            className="fill-primary/10 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <circle
            r="18"
            className="fill-primary/20 animate-ping"
            style={{ animationDuration: '2s', animationDelay: '0.5s' }}
          />
          
          {/* Conector OBD */}
          <rect
            x="-12"
            y="-6"
            width="24"
            height="12"
            rx="2"
            className="fill-primary stroke-primary-foreground"
            strokeWidth="1"
          />
          
          {/* Pinos do conector */}
          <g className="fill-primary-foreground">
            {[...Array(8)].map((_, i) => (
              <rect
                key={`top-${i}`}
                x={-10 + i * 2.8}
                y="-4"
                width="1.5"
                height="3"
                rx="0.5"
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <rect
                key={`bottom-${i}`}
                x={-10 + i * 2.8}
                y="1"
                width="1.5"
                height="3"
                rx="0.5"
              />
            ))}
          </g>
        </g>

        {/* Legenda */}
        <text
          x="150"
          y="195"
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          Vista do espaço do motorista
        </text>
      </svg>

      {/* Indicador de posição */}
      <div 
        className="absolute pointer-events-none"
        style={{
          left: `${portPosition.x}%`,
          top: `${portPosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-primary/20 animate-pulse" />
          <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
        </div>
      </div>
    </div>
  );
}
