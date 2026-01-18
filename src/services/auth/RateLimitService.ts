// Rate Limit Service
// Proteção contra ataques de força bruta no login

import { supabase } from '@/integrations/supabase/client';

export interface RateLimitStatus {
  blocked: boolean;
  attempts: number;
  maxAttempts: number;
  remainingAttempts: number;
  unlockAt?: string;
  remainingSeconds?: number;
}

interface RateLimitResponse {
  blocked: boolean;
  attempts: number;
  max_attempts: number;
  remaining_attempts: number;
  unlock_at?: string;
  remaining_seconds?: number;
}

export const RateLimitService = {
  /**
   * Verifica se o email está bloqueado por excesso de tentativas
   */
  async checkLoginBlocked(email: string): Promise<RateLimitStatus> {
    try {
      const { data, error } = await supabase.rpc('is_login_blocked', {
        p_email: email.toLowerCase(),
        p_max_attempts: 5,
        p_window_minutes: 15,
      });

      if (error) {
        console.error('[RateLimitService] Error checking block status:', error);
        // Em caso de erro, permitir login (fail open para não bloquear usuários legítimos)
        return {
          blocked: false,
          attempts: 0,
          maxAttempts: 5,
          remainingAttempts: 5,
        };
      }

      // Cast para o tipo correto
      const response = data as unknown as RateLimitResponse | null;

      return {
        blocked: response?.blocked ?? false,
        attempts: response?.attempts ?? 0,
        maxAttempts: response?.max_attempts ?? 5,
        remainingAttempts: response?.remaining_attempts ?? 5,
        unlockAt: response?.unlock_at,
        remainingSeconds: response?.remaining_seconds,
      };
    } catch (error) {
      console.error('[RateLimitService] Exception in checkLoginBlocked:', error);
      return {
        blocked: false,
        attempts: 0,
        maxAttempts: 5,
        remainingAttempts: 5,
      };
    }
  },

  /**
   * Registra uma tentativa de login
   */
  async recordLoginAttempt(email: string, success: boolean): Promise<void> {
    try {
      await supabase.rpc('record_login_attempt', {
        p_email: email.toLowerCase(),
        p_success: success,
        p_ip_address: null, // IP não disponível no cliente
      });
    } catch (error) {
      console.error('[RateLimitService] Error recording attempt:', error);
    }
  },

  /**
   * Formata o tempo restante para desbloqueio
   */
  formatRemainingTime(seconds: number): string {
    if (seconds <= 0) return 'agora';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes === 0) {
      return `${secs} segundo${secs !== 1 ? 's' : ''}`;
    }
    
    if (secs === 0) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    
    return `${minutes}min ${secs}s`;
  },
};
