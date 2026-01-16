import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from 'react';
import { JarvisSettings, defaultJarvisSettings } from '@/types/jarvisSettings';
import { useSyncedProfile } from '@/hooks/useSyncedProfile';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'jarvis-settings';

// ============================================
// GLOBAL STORE - Single source of truth
// ============================================

type Listener = () => void;

// Global state that persists across all hook instances
let globalSettings: JarvisSettings = defaultJarvisSettings;
let globalListeners: Set<Listener> = new Set();
let globalInitialized = false;

// Load from localStorage on module initialization
function initializeGlobalSettings() {
  if (globalInitialized) return;
  globalInitialized = true;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      globalSettings = { ...defaultJarvisSettings, ...parsed };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações do Jarvis:', error);
  }
}

// Initialize immediately
if (typeof window !== 'undefined') {
  initializeGlobalSettings();
}

function subscribe(listener: Listener): () => void {
  globalListeners.add(listener);
  return () => globalListeners.delete(listener);
}

function getSnapshot(): JarvisSettings {
  return globalSettings;
}

function getServerSnapshot(): JarvisSettings {
  return defaultJarvisSettings;
}

function notifyListeners() {
  globalListeners.forEach(listener => listener());
}

function setGlobalSettings(newSettings: JarvisSettings) {
  globalSettings = newSettings;
  notifyListeners();
}

// ============================================
// HOOK
// ============================================

export function useJarvisSettings() {
  const { isAuthenticated } = useAuth();
  const syncedProfile = useSyncedProfile();
  
  // Use global store for settings - ALL instances share this state
  const localSettings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(globalInitialized);
  
  // Track if we've synced from cloud to prevent loops
  const hasSyncedFromCloud = useRef(false);

  // Determine which settings to use
  // - If authenticated and cloud has loaded, prefer cloud settings
  // - Otherwise use local/global settings
  const settings = isAuthenticated && !syncedProfile.loading && syncedProfile.synced
    ? syncedProfile.profile.jarvisSettings 
    : localSettings;

  // Sync cloud settings to global store when cloud loads
  useEffect(() => {
    if (isAuthenticated && !syncedProfile.loading && syncedProfile.synced && !hasSyncedFromCloud.current) {
      hasSyncedFromCloud.current = true;
      const cloudSettings = syncedProfile.profile.jarvisSettings;
      
      // Update global store with cloud data
      setGlobalSettings(cloudSettings);
      
      // Also update localStorage as backup
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudSettings));
      } catch (error) {
        console.error('Erro ao atualizar cache local:', error);
      }
    }
  }, [isAuthenticated, syncedProfile.loading, syncedProfile.synced, syncedProfile.profile.jarvisSettings]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedFromCloud.current = false;
    }
  }, [isAuthenticated]);

  // Mark as loaded
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Carregar vozes disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices);
    };

    loadVoices();
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Salvar configurações (Global + localStorage + Cloud)
  const saveSettings = useCallback(async (newSettings: JarvisSettings) => {
    // 1. Update global store immediately (all instances will re-render)
    setGlobalSettings(newSettings);
    
    // 2. Save to localStorage (offline backup)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações locais:', error);
    }
    
    // 3. If authenticated, sync to cloud
    if (isAuthenticated) {
      await syncedProfile.updateJarvisSettings(newSettings);
    }
  }, [isAuthenticated, syncedProfile]);

  // Atualizar configuração específica
  const updateSetting = useCallback(<K extends keyof JarvisSettings>(
    key: K,
    value: JarvisSettings[K]
  ) => {
    // Use the current global settings to ensure we have latest values
    const currentSettings = getSnapshot();
    const newSettings = { ...currentSettings, [key]: value };
    saveSettings(newSettings);
  }, [saveSettings]);

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
    isLoaded: isLoaded && (!isAuthenticated || !syncedProfile.loading),
    synced: syncedProfile.synced,
    loading: syncedProfile.loading,
  };
}
