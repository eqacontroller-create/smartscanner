-- Tabela para histórico de diagnósticos visuais
CREATE TABLE public.visual_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Contexto do veículo
  vehicle_brand varchar,
  vehicle_model varchar,
  vehicle_year varchar,
  vehicle_engine varchar,
  
  -- Dados da análise
  media_type varchar NOT NULL DEFAULT 'image', -- 'image' ou 'video'
  analysis_type varchar NOT NULL DEFAULT 'diagnosis', -- 'diagnosis', 'part_identification', etc
  
  -- Resultado da IA
  risk_level varchar NOT NULL DEFAULT 'unknown', -- 'low', 'medium', 'high', 'critical', 'unknown'
  title varchar NOT NULL,
  description text NOT NULL,
  recommendation text,
  parts_mentioned jsonb DEFAULT '[]'::jsonb, -- Lista de peças identificadas
  
  -- Metadados
  thumbnail_url text, -- URL opcional para miniatura (se usar storage)
  notes text -- Notas do usuário
);

-- Habilitar RLS
ALTER TABLE public.visual_diagnoses ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa seus próprios diagnósticos
CREATE POLICY "Users can view own diagnoses"
ON public.visual_diagnoses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnoses"
ON public.visual_diagnoses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnoses"
ON public.visual_diagnoses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagnoses"
ON public.visual_diagnoses
FOR DELETE
USING (auth.uid() = user_id);

-- Índice para busca por usuário e data
CREATE INDEX idx_visual_diagnoses_user_date ON public.visual_diagnoses (user_id, created_at DESC);