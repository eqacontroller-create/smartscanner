// Som de ignição V8 esportivo usando Web Audio API
let audioContext: AudioContext | null = null;

// Criar distorção para som agressivo de motor
function createDistortion(ctx: AudioContext): WaveShaperNode {
  const distortion = ctx.createWaveShaper();
  const samples = 256;
  const curve = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // Soft clipping agressivo para harmônicos ricos
    curve[i] = Math.tanh(x * 4) * 0.9;
  }
  
  distortion.curve = curve;
  distortion.oversample = '2x';
  return distortion;
}

// Criar ruído texturizado para starter motor
function createStarterNoise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  
  // Ruído com textura de "cranking"
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const crankFreq = 8 + t * 15; // Acelera o cranking
    const crankMod = Math.sin(2 * Math.PI * crankFreq * t);
    output[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * crankMod);
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  return noise;
}

// Burst de ignição (o "pop" explosivo)
function createIgnitionBurst(
  ctx: AudioContext, 
  time: number, 
  destination: AudioNode,
  volume: number
): void {
  // Oscilador de baixa frequência para o "thump"
  const burst = ctx.createOscillator();
  burst.type = 'square';
  burst.frequency.setValueAtTime(80, time);
  burst.frequency.exponentialRampToValueAtTime(30, time + 0.15);
  
  // Ruído para textura da explosão
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  
  // Filtro para o ruído
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(800, time);
  noiseFilter.Q.setValueAtTime(2, time);
  
  // Ganhos
  const burstGain = ctx.createGain();
  burstGain.gain.setValueAtTime(0, time);
  burstGain.gain.linearRampToValueAtTime(volume * 0.6, time + 0.015);
  burstGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  
  // Conexões
  burst.connect(burstGain);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  burstGain.connect(destination);
  noiseGain.connect(destination);
  
  burst.start(time);
  noise.start(time);
  burst.stop(time + 0.25);
  noise.stop(time + 0.2);
}

// Criar motor V8 com harmônicos
function createV8Engine(
  ctx: AudioContext, 
  startTime: number, 
  distortion: WaveShaperNode,
  volume: number
): { oscillators: OscillatorNode[], gains: GainNode[] } {
  const fundamentalFreq = 55; // A1 - base de motor V8
  const harmonics = [1, 2, 3, 4]; // Fundamental + 3 harmônicas
  const harmonicVolumes = [1, 0.6, 0.35, 0.2];
  
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  
  harmonics.forEach((harmonic, index) => {
    const osc = ctx.createOscillator();
    osc.type = index === 0 ? 'sawtooth' : 'triangle';
    
    const baseFreq = fundamentalFreq * harmonic;
    
    // Envelope de frequência: idle → rev up → idle
    osc.frequency.setValueAtTime(baseFreq * 0.5, startTime);
    osc.frequency.setValueAtTime(baseFreq * 0.6, startTime + 0.35); // Pós ignição
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 3.5, startTime + 1.0); // Rev up
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, startTime + 1.3); // Bounce
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, startTime + 1.8); // Idle
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, startTime + 2.2); // Settle
    
    const gain = ctx.createGain();
    const baseVolume = volume * harmonicVolumes[index];
    
    // Envelope de volume
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(baseVolume * 0.1, startTime + 0.35); // Pré-ignição
    gain.gain.linearRampToValueAtTime(baseVolume * 0.8, startTime + 0.45); // Ignição
    gain.gain.linearRampToValueAtTime(baseVolume * 1.0, startTime + 1.0); // Max rev
    gain.gain.linearRampToValueAtTime(baseVolume * 0.6, startTime + 1.5); // Descendo
    gain.gain.linearRampToValueAtTime(baseVolume * 0.3, startTime + 2.0); // Idle
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.4); // Fade out
    
    osc.connect(gain);
    gain.connect(distortion);
    
    oscillators.push(osc);
    gains.push(gain);
  });
  
  return { oscillators, gains };
}

export function playIgnitionSound(volume: number = 0.18): void {
  try {
    // Criar contexto se não existir
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // === SETUP DE EFEITOS ===
    
    // Distorção para som agressivo
    const distortion = createDistortion(ctx);
    
    // Filtro dinâmico
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.linearRampToValueAtTime(400, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 1.0); // Abre no rev
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.8); // Fecha no idle
    filter.Q.setValueAtTime(2, now);
    
    // Compressor para controle dinâmico
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-15, now);
    compressor.knee.setValueAtTime(10, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.15, now);
    
    // === STARTER MOTOR ===
    
    const starter = createStarterNoise(ctx, 0.4);
    const starterFilter = ctx.createBiquadFilter();
    starterFilter.type = 'bandpass';
    starterFilter.frequency.setValueAtTime(300, now);
    starterFilter.frequency.exponentialRampToValueAtTime(600, now + 0.35);
    starterFilter.Q.setValueAtTime(3, now);
    
    const starterGain = ctx.createGain();
    starterGain.gain.setValueAtTime(0, now);
    starterGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
    starterGain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.3);
    starterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    starter.connect(starterFilter);
    starterFilter.connect(starterGain);
    starterGain.connect(compressor);
    
    // === MOTOR V8 ===
    
    const { oscillators } = createV8Engine(ctx, now, distortion, volume);
    
    // Conexões do motor
    distortion.connect(filter);
    filter.connect(compressor);
    compressor.connect(ctx.destination);
    
    // === IGNITION BURST ===
    
    createIgnitionBurst(ctx, now + 0.35, compressor, volume);
    
    // === INICIAR TUDO ===
    
    starter.start(now);
    starter.stop(now + 0.45);
    
    oscillators.forEach(osc => {
      osc.start(now + 0.3);
      osc.stop(now + 2.5);
    });
    
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
