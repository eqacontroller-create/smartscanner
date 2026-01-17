// Som Premium de Inicialização - "Electric Supercar Boot"
// Inspirado em Tesla, Porsche Taycan, BMW iDrive
// Volume e duração aumentados para PRESENÇA

let audioContext: AudioContext | null = null;

// Criar reverb sintético com decay longo para espacialidade
function createReverb(ctx: AudioContext, duration: number = 2.0): ConvolverNode {
  const convolver = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Decaimento exponencial natural - mais longo
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2);
    }
  }
  
  convolver.buffer = impulse;
  return convolver;
}

// Sub-bass sweep profundo (sensação de poder) - ESTENDIDO
function createSubBassSweep(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  
  // Sweep de 22Hz para 55Hz (frequências que você SENTE no peito)
  osc.frequency.setValueAtTime(22, startTime);
  osc.frequency.exponentialRampToValueAtTime(55, startTime + 0.5);
  osc.frequency.exponentialRampToValueAtTime(38, startTime + 1.0);
  osc.frequency.exponentialRampToValueAtTime(45, startTime + 1.2);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume * 1.0, startTime + 0.15); // Mais forte
  gain.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.5);
  gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.9);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.3);
  
  // Filtro passa-baixa para suavizar
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(90, startTime);
  filter.Q.setValueAtTime(1.2, startTime);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  
  osc.start(startTime);
  osc.stop(startTime + 1.5);
}

// Nota musical cristalina (acorde) - MAIS LONGA
function createChordNote(
  ctx: AudioContext, 
  startTime: number, 
  frequency: number,
  destination: AudioNode,
  volume: number,
  duration: number = 1.0
): void {
  // Oscilador principal (sine puro = som premium)
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);
  
  // Leve detuning para riqueza
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 1.002, startTime);
  
  // Terceiro oscilador para corpo
  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 0.998, startTime);
  
  // Ganho com envelope ADSR suave - MAIS FORTE
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.06); // Attack
  gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.18); // Decay
  gain.gain.setValueAtTime(volume * 0.5, startTime + 0.18); // Sustain
  gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Release longo
  
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.85);
  
  const gain3 = ctx.createGain();
  gain3.gain.setValueAtTime(0, startTime);
  gain3.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.1);
  gain3.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);
  
  osc.connect(gain);
  osc2.connect(gain2);
  osc3.connect(gain3);
  gain.connect(destination);
  gain2.connect(destination);
  gain3.connect(destination);
  
  osc.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc.stop(startTime + duration + 0.2);
  osc2.stop(startTime + duration + 0.2);
  osc3.stop(startTime + duration + 0.2);
}

// Shimmer layer (brilho cristalino nas altas frequências) - MAIS PRESENTE
function createShimmer(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  const frequencies = [2093, 2637, 3136, 3520]; // C7, E7, G7, A7 (mais overtones)
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    
    const gain = ctx.createGain();
    const delay = i * 0.05; // Arpejo mais espaçado
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.15, startTime + delay + 0.04); // Mais forte
    gain.gain.linearRampToValueAtTime(volume * 0.1, startTime + delay + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
    
    // Filtro para suavizar as altas
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, startTime);
    filter.Q.setValueAtTime(0.5, startTime);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    
    osc.start(startTime + delay);
    osc.stop(startTime + 1.5);
  });
}

// Ready chime final (confirmação elegante) - MAIS IMPACTANTE
function createReadyChime(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  // Duas notas em sequência - mais presença
  const notes = [
    { freq: 880, time: 0, dur: 0.25 },     // A5
    { freq: 1318.5, time: 0.15, dur: 0.5 } // E6 (quinta) - segura mais
  ];
  
  notes.forEach(note => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime + note.time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime + note.time);
    gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + note.time + 0.025); // Mais forte
    gain.gain.linearRampToValueAtTime(volume * 0.35, startTime + note.time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.time + note.dur);
    
    osc.connect(gain);
    gain.connect(destination);
    
    osc.start(startTime + note.time);
    osc.stop(startTime + note.time + note.dur + 0.1);
  });
}

// Heartbeat pulse poderoso (presença no peito)
function createHeartbeatPulse(
  ctx: AudioContext, 
  startTime: number, 
  destination: AudioNode,
  volume: number
): void {
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(38, startTime + i * 0.2);
    osc.frequency.exponentialRampToValueAtTime(28, startTime + i * 0.2 + 0.12);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime + i * 0.2);
    gain.gain.linearRampToValueAtTime(volume * 0.45, startTime + i * 0.2 + 0.03); // Mais forte
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.2 + 0.15);
    
    osc.connect(gain);
    gain.connect(destination);
    
    osc.start(startTime + i * 0.2);
    osc.stop(startTime + i * 0.2 + 0.2);
  }
}

export function playIgnitionSound(volume: number = 0.55): void {
  try {
    // Criar ou reutilizar contexto
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // === SETUP DE EFEITOS ===
    
    // Compressor para controle dinâmico - menos agressivo
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-15, now);
    compressor.knee.setValueAtTime(12, now);
    compressor.ratio.setValueAtTime(3, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.3, now);
    
    // Reverb para espacialidade - mais longo
    const reverb = createReverb(ctx, 2.0);
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.25, now); // 25% wet - mais espacial
    
    // Dry/Wet mix
    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.75, now); // 75% dry
    
    // Master gain - começa mais alto
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.2, now); // Boost inicial
    
    // Routing
    dryGain.connect(compressor);
    reverbGain.connect(reverb);
    reverb.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    // === SEQUÊNCIA SONORA ESTENDIDA ===
    
    // 1. Sub-bass sweep (0-1.3s) - sensação de poder
    createSubBassSweep(ctx, now, dryGain, volume);
    
    // 2. Chord arpeggio ascendente ESPAÇADO (0.2-2.0s)
    const chordNotes = [
      { freq: 261.63, time: 0.2, dur: 1.1 },   // C4
      { freq: 329.63, time: 0.5, dur: 1.0 },   // E4
      { freq: 392.00, time: 0.85, dur: 0.95 }, // G4
      { freq: 523.25, time: 1.2, dur: 0.9 },   // C5 (oitava)
    ];
    
    chordNotes.forEach(note => {
      createChordNote(ctx, now + note.time, note.freq, reverbGain, volume, note.dur);
    });
    
    // 3. Shimmer layer (1.0-2.2s) - brilho cristalino
    createShimmer(ctx, now + 1.0, reverbGain, volume);
    
    // 4. Heartbeat pulse (1.4-1.8s) - presença
    createHeartbeatPulse(ctx, now + 1.4, dryGain, volume);
    
    // 5. Ready chime (2.0-2.7s) - confirmação elegante
    createReadyChime(ctx, now + 2.0, reverbGain, volume);
    
    // Fade out master suave e longo
    masterGain.gain.setValueAtTime(1.2, now + 2.5);
    masterGain.gain.linearRampToValueAtTime(0.8, now + 2.8);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
    
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
