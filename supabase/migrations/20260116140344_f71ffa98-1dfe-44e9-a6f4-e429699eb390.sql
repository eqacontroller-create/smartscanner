-- Adicionar campo de nome do posto aos registros de abastecimento
ALTER TABLE public.refuel_entries 
ADD COLUMN IF NOT EXISTS station_name text DEFAULT NULL;

-- Adicionar índice para busca por posto
CREATE INDEX IF NOT EXISTS idx_refuel_entries_station_name 
ON public.refuel_entries(station_name) 
WHERE station_name IS NOT NULL;