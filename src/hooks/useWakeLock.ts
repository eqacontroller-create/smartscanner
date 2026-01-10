import { useState, useEffect, useRef, useCallback } from 'react';

// 1 segundo de silêncio em WAV base64 (para manter processamento no Android)
const SILENT_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

interface UseWakeLockOptions {
  enabled: boolean;                    // Configuração do usuário
  isConnected: boolean;                // Status Bluetooth
  onVisibilityRestore?: () => void;    // Callback quando tela volta
}

interface UseWakeLockReturn {
  isWakeLockActive: boolean;           // Wake lock está ativo
  isWakeLockSupported: boolean;        // API suportada
  isAudioKeepAliveActive: boolean;     // Áudio silencioso ativo
  requestWakeLock: () => Promise<void>;
  releaseWakeLock: () => Promise<void>;
}

export function useWakeLock({
  enabled,
  isConnected,
  onVisibilityRestore,
}: UseWakeLockOptions): UseWakeLockReturn {
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [isAudioKeepAliveActive, setIsAudioKeepAliveActive] = useState(false);
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasConnectedRef = useRef(false);
  
  // Verificar suporte à API
  const isWakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  // Handler quando wake lock é liberado pelo sistema
  const handleWakeLockRelease = useCallback(() => {
    console.log('🌙 Wake Lock liberado pelo sistema');
    setIsWakeLockActive(false);
    wakeLockRef.current = null;
  }, []);

  // Solicitar Wake Lock
  const requestWakeLock = useCallback(async () => {
    if (!isWakeLockSupported) {
      console.log('⚠️ Wake Lock API não suportada');
      return;
    }

    // Já está ativo
    if (wakeLockRef.current) {
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      sentinel.addEventListener('release', handleWakeLockRelease);
      setIsWakeLockActive(true);
      console.log('🌙 Wake Lock ativado - tela permanecerá ligada');
    } catch (err) {
      console.warn('⚠️ Não foi possível ativar Wake Lock:', err);
      setIsWakeLockActive(false);
    }
  }, [isWakeLockSupported, handleWakeLockRelease]);

  // Liberar Wake Lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
        console.log('🌙 Wake Lock liberado manualmente');
      } catch (err) {
        console.warn('⚠️ Erro ao liberar Wake Lock:', err);
      }
    }
  }, []);

  // Iniciar áudio silencioso (hack para Android manter processamento)
  const startAudioKeepAlive = useCallback(() => {
    if (audioRef.current) {
      return; // Já está tocando
    }

    try {
      const audio = new Audio(SILENT_AUDIO_BASE64);
      audio.loop = true;
      audio.volume = 0.001; // Praticamente mudo
      audio.play().then(() => {
        audioRef.current = audio;
        setIsAudioKeepAliveActive(true);
        console.log('🔊 Audio keep-alive iniciado');
      }).catch((err) => {
        console.warn('⚠️ Não foi possível iniciar audio keep-alive:', err);
      });
    } catch (err) {
      console.warn('⚠️ Erro ao criar audio keep-alive:', err);
    }
  }, []);

  // Parar áudio silencioso
  const stopAudioKeepAlive = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setIsAudioKeepAliveActive(false);
      console.log('🔊 Audio keep-alive parado');
    }
  }, []);

  // Handler para mudança de visibilidade (tela desbloqueada/bloqueada)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁 Tela desbloqueada - verificando conexões...');
        
        // Re-adquirir wake lock se estava conectado e habilitado
        if (enabled && wasConnectedRef.current) {
          await requestWakeLock();
        }
        
        // Notificar componente pai para verificar reconexão
        onVisibilityRestore?.();
      } else {
        console.log('👁 Tela bloqueada - wake lock pode ser liberado pelo sistema');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, requestWakeLock, onVisibilityRestore]);

  // Gerenciar wake lock e audio baseado em conexão e configuração
  useEffect(() => {
    if (enabled && isConnected) {
      wasConnectedRef.current = true;
      requestWakeLock();
      startAudioKeepAlive();
    } else {
      if (!isConnected) {
        wasConnectedRef.current = false;
        releaseWakeLock();
        stopAudioKeepAlive();
      }
    }
  }, [enabled, isConnected, requestWakeLock, releaseWakeLock, startAudioKeepAlive, stopAudioKeepAlive]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      releaseWakeLock();
      stopAudioKeepAlive();
    };
  }, [releaseWakeLock, stopAudioKeepAlive]);

  return {
    isWakeLockActive,
    isWakeLockSupported,
    isAudioKeepAliveActive,
    requestWakeLock,
    releaseWakeLock,
  };
}
