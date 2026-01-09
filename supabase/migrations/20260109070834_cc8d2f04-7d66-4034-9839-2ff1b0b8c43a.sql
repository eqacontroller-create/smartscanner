-- Tabela para veículos identificados por VIN
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin VARCHAR(17) NOT NULL UNIQUE,
  manufacturer VARCHAR(100),
  country VARCHAR(100),
  model_year VARCHAR(10),
  manufacturer_group VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para scans de DTCs
CREATE TABLE public.dtc_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vin VARCHAR(17),
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_dtcs INTEGER NOT NULL DEFAULT 0,
  modules_scanned INTEGER NOT NULL DEFAULT 0,
  scan_duration_ms INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para DTCs encontrados em cada scan
CREATE TABLE public.dtc_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.dtc_scans(id) ON DELETE CASCADE NOT NULL,
  dtc_code VARCHAR(10) NOT NULL,
  raw_code VARCHAR(20),
  module_id VARCHAR(50),
  module_name VARCHAR(100),
  status_byte VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_dtc_scans_vehicle_id ON public.dtc_scans(vehicle_id);
CREATE INDEX idx_dtc_scans_vin ON public.dtc_scans(vin);
CREATE INDEX idx_dtc_scans_scan_date ON public.dtc_scans(scan_date DESC);
CREATE INDEX idx_dtc_findings_scan_id ON public.dtc_findings(scan_id);
CREATE INDEX idx_dtc_findings_dtc_code ON public.dtc_findings(dtc_code);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dtc_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dtc_findings ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura e escrita (app sem autenticação)
-- Em produção, adicionar user_id e restringir por usuário
CREATE POLICY "Allow public read on vehicles"
  ON public.vehicles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on vehicles"
  ON public.vehicles FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read on dtc_scans"
  ON public.dtc_scans FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on dtc_scans"
  ON public.dtc_scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on dtc_findings"
  ON public.dtc_findings FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on dtc_findings"
  ON public.dtc_findings FOR INSERT
  WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();