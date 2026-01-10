-- Tabela de abastecimentos para auditoria de combustível
CREATE TABLE public.refuel_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_per_liter DECIMAL(10,3) NOT NULL,
  liters_added DECIMAL(10,3) NOT NULL,
  total_paid DECIMAL(10,2) NOT NULL,
  fuel_level_before INTEGER,
  fuel_level_after INTEGER,
  tank_capacity INTEGER DEFAULT 50,
  quality TEXT DEFAULT 'unknown',
  stft_average DECIMAL(5,2),
  ltft_delta DECIMAL(5,2),
  distance_monitored DECIMAL(10,3),
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_details TEXT,
  pump_accuracy_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar abastecimentos do usuário
CREATE INDEX idx_refuel_entries_user ON public.refuel_entries(user_id, timestamp DESC);

-- Habilitar RLS
ALTER TABLE public.refuel_entries ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios abastecimentos
CREATE POLICY "Users can view own refuel entries"
ON public.refuel_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários inserirem seus próprios abastecimentos
CREATE POLICY "Users can insert own refuel entries"
ON public.refuel_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios abastecimentos
CREATE POLICY "Users can update own refuel entries"
ON public.refuel_entries
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para usuários deletarem seus próprios abastecimentos
CREATE POLICY "Users can delete own refuel entries"
ON public.refuel_entries
FOR DELETE
USING (auth.uid() = user_id);