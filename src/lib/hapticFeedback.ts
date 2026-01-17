/**
 * Haptic Feedback Utilities
 * Provides vibration and audio feedback for user interactions
 */

// Check if vibration is supported
export const isVibrationSupported = (): boolean => {
  return 'vibrate' in navigator;
};

// Vibration patterns
export const VIBRATION_PATTERNS = {
  // Quick tap - light feedback
  tap: [50],
  // Double tap - confirmation
  doubleTap: [50, 50, 50],
  // Success - ascending pattern
  success: [50, 100, 100],
  // Warning - attention pattern
  warning: [100, 50, 100, 50, 100],
  // Engine start - powerful pattern
  engineStart: [100, 50, 200],
  // Cranking detected - alert pattern
  crankingDetected: [50, 30, 50],
} as const;

/**
 * Trigger device vibration with a pattern
 */
export function vibrate(pattern: keyof typeof VIBRATION_PATTERNS | number[]): boolean {
  if (!isVibrationSupported()) {
    return false;
  }
  
  try {
    const vibrationPattern = Array.isArray(pattern) 
      ? pattern 
      : VIBRATION_PATTERNS[pattern];
    return navigator.vibrate(vibrationPattern);
  } catch {
    return false;
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopVibration(): void {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
}

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Play a beep sound with customizable frequency and duration
 */
export function playBeep(
  frequency: number = 800,
  duration: number = 150,
  volume: number = 0.3,
  type: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    // Resume context if suspended (required for autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Silently fail if audio doesn't work
  }
}

/**
 * Play cranking detected sound - quick alert
 */
export function playCrankingSound(): void {
  playBeep(600, 100, 0.25, 'sine');
  setTimeout(() => playBeep(800, 100, 0.25, 'sine'), 120);
}

/**
 * Play engine start sound - success tone
 */
export function playEngineStartSound(): void {
  playBeep(400, 100, 0.3, 'sine');
  setTimeout(() => playBeep(600, 100, 0.3, 'sine'), 120);
  setTimeout(() => playBeep(800, 150, 0.35, 'sine'), 240);
}

/**
 * Play test complete sound - triumphant
 */
export function playTestCompleteSound(): void {
  playBeep(523, 100, 0.25, 'sine'); // C5
  setTimeout(() => playBeep(659, 100, 0.25, 'sine'), 100); // E5
  setTimeout(() => playBeep(784, 150, 0.3, 'sine'), 200); // G5
}

/**
 * Combined haptic feedback - vibrate and play sound
 */
export function hapticFeedback(
  type: 'crankingDetected' | 'engineStart' | 'testComplete' | 'tap' | 'warning'
): void {
  switch (type) {
    case 'crankingDetected':
      vibrate('crankingDetected');
      playCrankingSound();
      break;
    case 'engineStart':
      vibrate('engineStart');
      playEngineStartSound();
      break;
    case 'testComplete':
      vibrate('success');
      playTestCompleteSound();
      break;
    case 'tap':
      vibrate('tap');
      playBeep(600, 50, 0.15);
      break;
    case 'warning':
      vibrate('warning');
      playBeep(300, 200, 0.3, 'square');
      break;
  }
}
