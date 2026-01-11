-- Criar tabela profiles para salvar todas as configurações do usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Veículo
  vin VARCHAR(17),
  vehicle_brand VARCHAR(50),
  vehicle_model VARCHAR(100),
  model_year VARCHAR(10),
  
  -- Configurações de Combustível
  fuel_price NUMERIC DEFAULT 6.00,
  average_consumption NUMERIC DEFAULT 12.0,
  vehicle_cost_per_km NUMERIC DEFAULT 0.10,
  fuel_type VARCHAR(20) DEFAULT 'gasoline',
  
  -- Configurações de Auto-Ride
  auto_ride_enabled BOOLEAN DEFAULT true,
  auto_start_delay INTEGER DEFAULT 5,
  auto_stop_delay INTEGER DEFAULT 30,
  speed_threshold INTEGER DEFAULT 10,
  
  -- Configurações do Jarvis - Motor
  redline_rpm INTEGER DEFAULT 6500,
  high_temp_threshold INTEGER DEFAULT 100,
  speed_limit INTEGER DEFAULT 120,
  low_voltage_threshold NUMERIC DEFAULT 12.5,
  current_mileage INTEGER DEFAULT 0,
  
  -- Alertas habilitados
  welcome_enabled BOOLEAN DEFAULT true,
  high_rpm_alert_enabled BOOLEAN DEFAULT true,
  high_temp_alert_enabled BOOLEAN DEFAULT true,
  speed_alert_enabled BOOLEAN DEFAULT true,
  low_voltage_alert_enabled BOOLEAN DEFAULT true,
  maintenance_alert_enabled BOOLEAN DEFAULT true,
  shift_light_enabled BOOLEAN DEFAULT true,
  lugging_alert_enabled BOOLEAN DEFAULT true,
  ai_mode_enabled BOOLEAN DEFAULT true,
  keep_awake_enabled BOOLEAN DEFAULT true,
  
  -- Configurações de Voz
  voice_volume NUMERIC DEFAULT 1.0,
  voice_rate NUMERIC DEFAULT 0.9,
  voice_pitch NUMERIC DEFAULT 0.95,
  selected_voice_uri VARCHAR(200),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuário só acessa próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();