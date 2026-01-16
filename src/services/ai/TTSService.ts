// Text-to-Speech Service
// Abstração para TTS via OpenAI e Web Speech API

import { decryptApiKey } from '@/lib/encryption';

export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface OpenAITTSOptions extends TTSOptions {
  apiKey: string;
  model?: 'tts-1' | 'tts-1-hd';
}

export const TTSService = {
  /**
   * Fala usando OpenAI TTS
   * Retorna o elemento de áudio para controle externo
   */
  async speakWithOpenAI(
    text: string,
    options: OpenAITTSOptions
  ): Promise<HTMLAudioElement> {
    const decryptedKey = decryptApiKey(options.apiKey);
    
    if (!decryptedKey) {
      throw new Error('Invalid API key');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'tts-1',
        voice: options.voice || 'onyx',
        input: text,
        speed: options.rate || 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI TTS error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    audio.volume = options.volume || 1;
    
    // Cleanup URL quando o áudio terminar
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    audio.onerror = () => URL.revokeObjectURL(audioUrl);

    return audio;
  },

  /**
   * Fala usando Web Speech API
   * Retorna o utterance para controle externo
   */
  speakWithBrowser(
    text: string,
    options: TTSOptions = {}
  ): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = 'pt-BR';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 0.95;
    utterance.volume = options.volume || 1;

    // Tentar usar voz específica ou encontrar pt-BR
    const voices = window.speechSynthesis.getVoices();
    
    if (options.voice) {
      const selectedVoice = voices.find(v => v.voiceURI === options.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Auto-selecionar voz pt-BR
      const ptBRVoice = voices.find(voice => 
        voice.lang === 'pt-BR' || 
        voice.lang.startsWith('pt-BR') ||
        voice.lang === 'pt_BR'
      );
      
      if (ptBRVoice) {
        utterance.voice = ptBRVoice;
      }
    }

    return utterance;
  },

  /**
   * Verifica se Web Speech API é suportada
   */
  isBrowserTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  /**
   * Para toda fala atual (Web Speech)
   */
  stopBrowserSpeech(): void {
    if (this.isBrowserTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  /**
   * Obtém vozes disponíveis
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isBrowserTTSSupported()) return [];
    return window.speechSynthesis.getVoices();
  },

  /**
   * Filtra vozes em português
   */
  getPortugueseVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(voice => 
      voice.lang.startsWith('pt')
    );
  },
};
