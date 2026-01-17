-- Adicionar colunas para Forensics Fuel Analysis (State Machine)
-- Permite armazenar contexto do usuário e estado forense final

ALTER TABLE public.refuel_entries 
ADD COLUMN IF NOT EXISTS fuel_context VARCHAR DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS fuel_state VARCHAR DEFAULT 'stable',
ADD COLUMN IF NOT EXISTS o2_avg NUMERIC,
ADD COLUMN IF NOT EXISTS ltft_final NUMERIC,
ADD COLUMN IF NOT EXISTS adaptation_complete BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN public.refuel_entries.fuel_context IS 'Contexto informado pelo usuário: same_fuel, gas_to_ethanol, ethanol_to_gas, unknown';
COMMENT ON COLUMN public.refuel_entries.fuel_state IS 'Estado forense final: stable, adapting, suspicious, contaminated, mechanical';
COMMENT ON COLUMN public.refuel_entries.o2_avg IS 'Voltagem média do sensor O2 durante análise';
COMMENT ON COLUMN public.refuel_entries.ltft_final IS 'Valor final do LTFT após análise';
COMMENT ON COLUMN public.refuel_entries.adaptation_complete IS 'Se a adaptação Flex foi concluída com sucesso';