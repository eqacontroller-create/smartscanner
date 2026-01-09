import { useState, useEffect, useCallback } from 'react';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';

const STORAGE_KEY = 'jarvis-settings';

export function useJarvisSettings() {
  const [settings, setSettings] = useState<JarvisSettings>(defaultJarvisSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultJarvisSettings, ...parsed });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do Jarvis:', error);
    }
    setIsLoaded(true);
  }, []);

  // Carregar vozes disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices);
    };

    loadVoices();
    
    // Algumas implementações carregam vozes de forma assíncrona
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Salvar configurações no localStorage
  const saveSettings = useCallback((newSettings: JarvisSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações do Jarvis:', error);
    }
  }, []);

  // Atualizar configuração específica
  const updateSetting = useCallback(<K extends keyof JarvisSettings>(
    key: K,
    value: JarvisSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Restaurar padrões
  const resetToDefaults = useCallback(() => {
    saveSettings(defaultJarvisSettings);
  }, [saveSettings]);

  // Filtrar vozes em português
  const portugueseVoices = availableVoices.filter(voice => 
    voice.lang.startsWith('pt')
  );

  return {
    settings,
    updateSetting,
    resetToDefaults,
    availableVoices,
    portugueseVoices,
    isLoaded,
  };
}
