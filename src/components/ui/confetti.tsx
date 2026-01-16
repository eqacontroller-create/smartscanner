/**
 * Confetti - Componente de celebração com partículas animadas
 */

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
  type: 'circle' | 'square' | 'star';
}

const COLORS = [
  'hsl(142, 76%, 45%)', // primary green
  'hsl(142, 76%, 55%)',
  'hsl(142, 76%, 65%)',
  'hsl(48, 100%, 50%)',  // gold
  'hsl(199, 89%, 48%)',  // accent blue
  'hsl(280, 70%, 60%)',  // purple
];

export function Confetti({ 
  active, 
  duration = 3000, 
  particleCount = 50,
  className 
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const types: Particle['type'][] = ['circle', 'square', 'star'];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 500,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
    return newParticles;
  }, [particleCount]);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles());
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration, generateParticles]);

  if (!isVisible || !active) return null;

  return (
    <div 
      className={cn(
        'fixed inset-0 pointer-events-none z-50 overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${duration}ms`,
          }}
        >
          {particle.type === 'circle' && (
            <div
              className="rounded-full animate-confetti-spin"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
              }}
            />
          )}
          {particle.type === 'square' && (
            <div
              className="animate-confetti-spin"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
              }}
            />
          )}
          {particle.type === 'star' && (
            <div
              className="animate-confetti-spin text-lg"
              style={{
                color: particle.color,
                fontSize: particle.size * 1.5,
                transform: `rotate(${particle.rotation}deg)`,
              }}
            >
              ✦
            </div>
          )}
        </div>
      ))}
      
      {/* Center celebration burst */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-3xl animate-ping" style={{ width: 200, height: 200, marginLeft: -100, marginTop: -100 }} />
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      </div>
    </div>
  );
}

// Hook para controlar confetti facilmente
export function useConfetti(duration = 3000) {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), duration + 100);
  }, [duration]);

  return { isActive, trigger };
}
