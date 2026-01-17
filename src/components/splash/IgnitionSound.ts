// Som Premium de Inicialização - "Electric Supercar Boot"
// Inspirado em Tesla, Porsche Taycan, BMW iDrive

let audioContext: AudioContext | null = null;

// Criar reverb sintético com delay feedback
function createReverb(ctx: AudioContext, duration: number = 1.5): ConvolverNode {
  const convolver = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Decaimento exponencial natural
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  
  convolver.buffer = impulse;
  return convolver;
}

// Sub-bass sweep profundo (sensação de poder)
function createSubBassSweep(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  
  // Sweep de 25Hz para 60Hz (frequências que você SENTE)
  osc.frequency.setValueAtTime(25, startTime);
  osc.frequency.exponentialRampToValueAtTime(60, startTime + 0.3);
  osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.6);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.1);
  gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);
  
  // Filtro passa-baixa para suavizar
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(80, startTime);
  filter.Q.setValueAtTime(1, startTime);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  
  osc.start(startTime);
  osc.stop(startTime + 0.8);
}

// Nota musical cristalina (acorde)
function createChordNote(
  ctx: AudioContext, 
  startTime: number, 
  frequency: number,
  destination: AudioNode,
  volume: number,
  duration: number = 0.6
): void {
  // Oscilador principal (sine puro = som premium)
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);
  
  // Leve detuning para riqueza
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 1.002, startTime);
  
  // Ganho com envelope ADSR suave
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.05); // Attack
  gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.15); // Decay
  gain.gain.setValueAtTime(volume * 0.3, startTime + 0.15); // Sustain
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Release
  
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.8);
  
  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(destination);
  gain2.connect(destination);
  
  osc.start(startTime);
  osc2.start(startTime);
  osc.stop(startTime + duration + 0.1);
  osc2.stop(startTime + duration + 0.1);
}

// Shimmer layer (brilho cristalino nas altas frequências)
function createShimmer(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  const frequencies = [2093, 2637, 3136]; // C7, E7, G7 (overtones)
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    
    const gain = ctx.createGain();
    const delay = i * 0.03; // Ligeiro arpejo
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.08, startTime + delay + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
    
    // Filtro para suavizar as altas
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, startTime);
    filter.Q.setValueAtTime(0.5, startTime);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    
    osc.start(startTime + delay);
    osc.stop(startTime + 1);
  });
}

// Ready chime final (confirmação elegante)
function createReadyChime(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  // Duas notas em sequência rápida (bip-bop premium)
  const notes = [
    { freq: 880, time: 0, dur: 0.15 },    // A5
    { freq: 1318.5, time: 0.1, dur: 0.35 } // E6 (quinta)
  ];
  
  notes.forEach(note => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime + note.time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime + note.time);
    gain.gain.linearRampToValueAtTime(volume * 0.35, startTime + note.time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.time + note.dur);
    
    osc.connect(gain);
    gain.connect(destination);
    
    osc.start(startTime + note.time);
    osc.stop(startTime + note.time + note.dur + 0.1);
  });
}

// Heartbeat pulse sutil (opcional, para quando ready)
function createHeartbeatPulse(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(35, startTime + i * 0.15);
    osc.frequency.exponentialRampToValueAtTime(25, startTime + i * 0.15 + 0.1);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(volume * 0.25, startTime + i * 0.15 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.15 + 0.12);
    
    osc.connect(gain);
    gain.connect(destination);
    
    osc.start(startTime + i * 0.15);
    osc.stop(startTime + i * 0.15 + 0.15);
  }
}

export function playIgnitionSound(volume: number = 0.25): void {
  try {
    // Criar ou reutilizar contexto
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // === SETUP DE EFEITOS ===
    
    // Compressor para controle dinâmico
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, now);
    compressor.knee.setValueAtTime(10, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.25, now);
    
    // Reverb para espacialidade
    const reverb = createReverb(ctx, 1.2);
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.2, now); // 20% wet
    
    // Dry/Wet mix
    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.8, now); // 80% dry
    
    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1, now);
    
    // Routing
    dryGain.connect(compressor);
    reverbGain.connect(reverb);
    reverb.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    // === SEQUÊNCIA SONORA ===
    
    // 1. Sub-bass sweep (0-600ms) - sensação de poder
    createSubBassSweep(ctx, now, dryGain, volume);
    
    // 2. Chord arpeggio ascendente (100-800ms)
    const chordNotes = [
      { freq: 261.63, time: 0.1, dur: 0.7 },   // C4
      { freq: 329.63, time: 0.2, dur: 0.6 },   // E4
      { freq: 392.00, time: 0.32, dur: 0.55 }, // G4
      { freq: 523.25, time: 0.45, dur: 0.5 },  // C5 (oitava)
    ];
    
    chordNotes.forEach(note => {
      createChordNote(ctx, now + note.time, note.freq, reverbGain, volume, note.dur);
    });
    
    // 3. Shimmer layer (450-1000ms) - brilho cristalino
    createShimmer(ctx, now + 0.45, reverbGain, volume);
    
    // 4. Heartbeat pulse (700-900ms) - presença
    createHeartbeatPulse(ctx, now + 0.7, dryGain, volume);
    
    // 5. Ready chime (900-1300ms) - confirmação
    createReadyChime(ctx, now + 0.95, reverbGain, volume);
    
    // Fade out master no final
    masterGain.gain.setValueAtTime(1, now + 1.3);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    
  } catch (error) {
    console.warn('[Splash] Could not play startup sound:', error);
  }
}

export function cleanupAudio(): void {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}
