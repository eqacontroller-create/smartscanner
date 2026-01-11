-- Adicionar colunas para sistema de IA Híbrida na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(20) DEFAULT 'basic';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS openai_voice VARCHAR(20) DEFAULT 'onyx';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS openai_tts_enabled BOOLEAN DEFAULT true;