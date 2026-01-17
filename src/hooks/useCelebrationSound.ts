/**
 * useCelebrationSound - Hook para tocar sons de celebração usando Web Audio API
 * Som suave e opcional para feedback multissensorial
 */

import { useCallback, useRef } from 'react';
import logger from '@/lib/logger';

interface CelebrationSoundOptions {
  enabled?: boolean;
  volume?: number; // 0-1
}

// Create a pleasant celebration chime using Web Audio API
function createCelebrationSound(audioContext: AudioContext, volume: number = 0.3) {
  const now = audioContext.currentTime;
  
  // Create master gain for volume control
  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(volume, now);
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
  masterGain.connect(audioContext.destination);
  
  // Notes for a pleasant celebratory arpeggio (C major chord ascending)
  const notes = [
    { freq: 523.25, delay: 0, duration: 0.3 },     // C5
    { freq: 659.25, delay: 0.08, duration: 0.3 },  // E5
    { freq: 783.99, delay: 0.16, duration: 0.4 },  // G5
    { freq: 1046.50, delay: 0.24, duration: 0.6 }, // C6 (octave)
  ];
  
  notes.forEach(({ freq, delay, duration }) => {
    // Create oscillator for the note
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, now + delay);
    
    // Individual note envelope
    const noteGain = audioContext.createGain();
    noteGain.gain.setValueAtTime(0, now + delay);
    noteGain.gain.linearRampToValueAtTime(0.8, now + delay + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.01, now + delay + duration);
    
    oscillator.connect(noteGain);
    noteGain.connect(masterGain);
    
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration + 0.1);
  });
  
  // Add a subtle shimmer/sparkle effect
  const shimmerOsc = audioContext.createOscillator();
  shimmerOsc.type = 'triangle';
  shimmerOsc.frequency.setValueAtTime(2093, now + 0.3); // High C7
  
  const shimmerGain = audioContext.createGain();
  shimmerGain.gain.setValueAtTime(0, now + 0.3);
  shimmerGain.gain.linearRampToValueAtTime(0.15, now + 0.32);
  shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
  
  shimmerOsc.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  
  shimmerOsc.start(now + 0.3);
  shimmerOsc.stop(now + 1);
}

export function useCelebrationSound(options: CelebrationSoundOptions = {}) {
  const { enabled = true, volume = 0.3 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const play = useCallback(() => {
    if (!enabled) return;
    
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume if suspended (required by browsers after user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      createCelebrationSound(audioContext, volume);
    } catch (error) {
      // Silently fail if Web Audio API is not supported
      logger.debug('Celebration sound not available:', error);
    }
  }, [enabled, volume]);
  
  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);
  
  return { play, cleanup };
}

// Standalone function for one-off sounds
export function playCelebrationSound(volume: number = 0.3) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    createCelebrationSound(audioContext, volume);
    
    // Auto-cleanup after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, 2000);
  } catch (error) {
    logger.debug('Celebration sound not available:', error);
  }
}
