-- Adicionar coluna refuel_settings na tabela profiles para sincronização cloud
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS refuel_settings jsonb DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.refuel_settings IS 'Configurações de abastecimento em JSON: tankCapacity, monitoringDistance, stftWarningThreshold, etc.';