-- Adicionar campos detalhados do veículo em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vehicle_engine varchar,
ADD COLUMN IF NOT EXISTS vehicle_transmission varchar DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS vehicle_nickname varchar;