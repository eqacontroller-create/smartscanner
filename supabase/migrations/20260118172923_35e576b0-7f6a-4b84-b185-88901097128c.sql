-- =====================================================
-- MIGRAÇÃO: Rate Limiting para Login (Anti Força Bruta)
-- =====================================================

-- 1. Criar tabela para rastrear tentativas de login
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- 2. Criar índices para consultas eficientes
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_attempted_at ON public.login_attempts(attempted_at);
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- 4. Política: Apenas inserção pública (para registrar tentativas)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts FOR INSERT
WITH CHECK (true);

-- 5. Política: Leitura apenas para verificar próprias tentativas
CREATE POLICY "Check attempts by email"
ON public.login_attempts FOR SELECT
USING (true);

-- 6. Função para verificar se email está bloqueado
CREATE OR REPLACE FUNCTION public.is_login_blocked(
  p_email TEXT,
  p_max_attempts INT DEFAULT 5,
  p_window_minutes INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_attempts INT;
  v_last_attempt TIMESTAMPTZ;
  v_unlock_at TIMESTAMPTZ;
  v_remaining_seconds INT;
BEGIN
  -- Contar tentativas falhas na janela de tempo
  SELECT 
    COUNT(*),
    MAX(attempted_at)
  INTO 
    v_failed_attempts,
    v_last_attempt
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
    AND success = false
    AND attempted_at > now() - (p_window_minutes || ' minutes')::interval;

  -- Se não há tentativas ou está abaixo do limite
  IF v_failed_attempts < p_max_attempts THEN
    RETURN jsonb_build_object(
      'blocked', false,
      'attempts', v_failed_attempts,
      'max_attempts', p_max_attempts,
      'remaining_attempts', p_max_attempts - v_failed_attempts
    );
  END IF;

  -- Calcular quando desbloqueia
  v_unlock_at := v_last_attempt + (p_window_minutes || ' minutes')::interval;
  v_remaining_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_unlock_at - now()))::INT);

  RETURN jsonb_build_object(
    'blocked', true,
    'attempts', v_failed_attempts,
    'max_attempts', p_max_attempts,
    'remaining_attempts', 0,
    'unlock_at', v_unlock_at,
    'remaining_seconds', v_remaining_seconds
  );
END;
$$;

-- 7. Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (LOWER(p_email), p_success, p_ip_address);
  
  -- Se login bem-sucedido, limpar tentativas anteriores (opcional)
  IF p_success THEN
    DELETE FROM public.login_attempts
    WHERE email = LOWER(p_email)
      AND attempted_at < now() - interval '1 hour';
  END IF;
END;
$$;

-- 8. Limpeza automática de tentativas antigas (job diário via pg_cron se disponível)
-- Por enquanto, limpeza manual pode ser feita periodicamente
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;