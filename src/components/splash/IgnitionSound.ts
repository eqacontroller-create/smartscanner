// Som de ignição esportivo usando Web Audio API
let audioContext: AudioContext | null = null;

function createWhiteNoise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  return noise;
}

export function playIgnitionSound(volume: number = 0.15): void {
  try {
    // Criar contexto se não existir
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // Oscilador grave principal (simula motor)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.4);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.8);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 1.2);
    
    // Oscilador secundário (harmônico)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, now);
    osc2.frequency.exponentialRampToValueAtTime(240, now + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(160, now + 1.0);
    
    // Ruído branco para textura de ignição
    const noise = createWhiteNoise(ctx, 1.5);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    
    // Ganhos individuais
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0, now);
    osc1Gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.1);
    osc1Gain.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.6);
    osc1Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0, now);
    osc2Gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.15);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    // Compressor para suavizar picos
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, now);
    compressor.knee.setValueAtTime(20, now);
    compressor.ratio.setValueAtTime(8, now);
    
    // Conexões
    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    osc1Gain.connect(compressor);
    osc2Gain.connect(compressor);
    noiseGain.connect(compressor);
    
    compressor.connect(ctx.destination);
    
    // Iniciar e parar
    osc1.start(now);
    osc2.start(now);
    noise.start(now);
    
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.2);
    noise.stop(now + 0.8);
    
  } catch (error) {
    console.warn('[Splash] Could not play ignition sound:', error);
  }
}

export function cleanupAudio(): void {
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}
