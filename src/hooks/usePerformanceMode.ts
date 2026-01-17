import { useState, useEffect, useMemo } from 'react';

export type PerformanceLevel = 'high' | 'medium' | 'low';

export interface PerformanceConfig {
  level: PerformanceLevel;
  particleCount: number;
  enableGlow: boolean;
  enableBlur: boolean;
  enableParticles: boolean;
  animationDuration: number; // multiplier
  prefersReducedMotion: boolean;
}

interface DeviceMetrics {
  cores: number;
  memory: number; // GB
  isMobile: boolean;
  isLowEndGPU: boolean;
  frameRate: number;
}

/**
 * Hook that detects device performance capabilities and returns
 * optimized animation settings for the current device.
 * 
 * Detection methods:
 * 1. Hardware concurrency (CPU cores)
 * 2. Device memory API
 * 3. Mobile/touch detection
 * 4. GPU capabilities via canvas
 * 5. Frame rate sampling
 * 6. prefers-reduced-motion
 */
export function usePerformanceMode(): PerformanceConfig {
  const [metrics, setMetrics] = useState<DeviceMetrics>({
    cores: 4,
    memory: 4,
    isMobile: false,
    isLowEndGPU: false,
    frameRate: 60,
  });
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Detect device capabilities on mount
  useEffect(() => {
    const detectCapabilities = async () => {
      // 1. CPU cores
      const cores = navigator.hardwareConcurrency || 4;
      
      // 2. Device memory (Chrome only)
      const memory = (navigator as any).deviceMemory || 4;
      
      // 3. Mobile detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || 'ontouchstart' in window;
      
      // 4. GPU detection via WebGL
      let isLowEndGPU = false;
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Detect integrated/low-end GPUs
            isLowEndGPU = /Intel|Mali|Adreno 3|Adreno 4|PowerVR/i.test(renderer);
          }
        }
      } catch (e) {
        // WebGL not available, assume low-end
        isLowEndGPU = true;
      }
      
      // 5. Frame rate sampling
      let frameRate = 60;
      try {
        const frames: number[] = [];
        let lastTime = performance.now();
        
        const measureFrame = () => {
          const now = performance.now();
          const delta = now - lastTime;
          if (delta > 0) {
            frames.push(1000 / delta);
          }
          lastTime = now;
          
          if (frames.length < 20) {
            requestAnimationFrame(measureFrame);
          } else {
            // Calculate average FPS
            const avgFps = frames.reduce((a, b) => a + b, 0) / frames.length;
            setMetrics(prev => ({ ...prev, frameRate: Math.round(avgFps) }));
          }
        };
        
        requestAnimationFrame(measureFrame);
      } catch (e) {
        // Keep default 60fps
      }
      
      setMetrics({
        cores,
        memory,
        isMobile,
        isLowEndGPU,
        frameRate,
      });
    };
    
    detectCapabilities();
    
    // 6. Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Calculate performance level based on metrics
  const config = useMemo<PerformanceConfig>(() => {
    // If user prefers reduced motion, use minimal animations
    if (prefersReducedMotion) {
      return {
        level: 'low',
        particleCount: 0,
        enableGlow: false,
        enableBlur: false,
        enableParticles: false,
        animationDuration: 0.5,
        prefersReducedMotion: true,
      };
    }
    
    // Calculate performance score (0-100)
    let score = 50; // Base score
    
    // CPU cores contribution (+/- 20)
    if (metrics.cores >= 8) score += 20;
    else if (metrics.cores >= 4) score += 10;
    else if (metrics.cores <= 2) score -= 20;
    
    // Memory contribution (+/- 15)
    if (metrics.memory >= 8) score += 15;
    else if (metrics.memory >= 4) score += 5;
    else if (metrics.memory <= 2) score -= 15;
    
    // Mobile penalty (-10)
    if (metrics.isMobile) score -= 10;
    
    // Low-end GPU penalty (-15)
    if (metrics.isLowEndGPU) score -= 15;
    
    // Frame rate contribution (+/- 20)
    if (metrics.frameRate >= 55) score += 10;
    else if (metrics.frameRate < 30) score -= 20;
    else if (metrics.frameRate < 45) score -= 10;
    
    // Determine level based on score
    if (score >= 60) {
      return {
        level: 'high',
        particleCount: 14,
        enableGlow: true,
        enableBlur: true,
        enableParticles: true,
        animationDuration: 1,
        prefersReducedMotion: false,
      };
    } else if (score >= 35) {
      return {
        level: 'medium',
        particleCount: 6,
        enableGlow: true,
        enableBlur: false,
        enableParticles: true,
        animationDuration: 0.8,
        prefersReducedMotion: false,
      };
    } else {
      return {
        level: 'low',
        particleCount: 3,
        enableGlow: false,
        enableBlur: false,
        enableParticles: false,
        animationDuration: 0.6,
        prefersReducedMotion: false,
      };
    }
  }, [metrics, prefersReducedMotion]);
  
  return config;
}

/**
 * Lightweight version that only checks reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}
