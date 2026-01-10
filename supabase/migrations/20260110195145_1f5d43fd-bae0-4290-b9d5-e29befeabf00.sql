
-- Tabela de configurações do motorista
CREATE TABLE public.trip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fuel_price DECIMAL(10,2) DEFAULT 6.00,
  average_consumption DECIMAL(10,2) DEFAULT 12.0,
  vehicle_cost_per_km DECIMAL(10,3) DEFAULT 0.10,
  auto_ride_enabled BOOLEAN DEFAULT true,
  auto_start_delay INTEGER DEFAULT 5,
  auto_stop_delay INTEGER DEFAULT 30,
  speed_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de corridas
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  distance DECIMAL(10,3) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  cost_per_km DECIMAL(10,3) DEFAULT 0,
  duration INTEGER DEFAULT 0,
  average_speed DECIMAL(10,2) DEFAULT 0,
  amount_received DECIMAL(10,2),
  profit DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar corridas do dia
CREATE INDEX idx_rides_user_date ON public.rides(user_id, start_time);

-- Habilitar RLS
ALTER TABLE public.trip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Policies para trip_settings
CREATE POLICY "Users can view own settings" ON public.trip_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.trip_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.trip_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para rides
CREATE POLICY "Users can view own rides" ON public.rides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rides" ON public.rides
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_trip_settings_updated_at
  BEFORE UPDATE ON public.trip_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para corridas
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
