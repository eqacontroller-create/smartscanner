-- Tabela de modelos de veículos brasileiros
CREATE TABLE public.vehicle_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand varchar NOT NULL,
  model_name varchar NOT NULL,
  model_code varchar,
  years_available varchar NOT NULL,
  engine_options jsonb DEFAULT '[]'::jsonb,
  popular_parts jsonb DEFAULT '{}'::jsonb,
  common_issues jsonb DEFAULT '[]'::jsonb,
  maintenance_schedule jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(brand, model_name)
);

-- RLS - Leitura pública, apenas admin pode modificar
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on vehicle_models" 
ON public.vehicle_models 
FOR SELECT 
USING (true);

CREATE POLICY "Only service role can modify vehicle_models" 
ON public.vehicle_models 
FOR ALL
USING (auth.role() = 'service_role');

-- Trigger de updated_at
CREATE TRIGGER update_vehicle_models_updated_at
BEFORE UPDATE ON public.vehicle_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- SEED: Top 30 modelos mais vendidos no Brasil
INSERT INTO public.vehicle_models (brand, model_name, years_available, engine_options, popular_parts, common_issues) VALUES
-- FIAT
('fiat', 'Strada', '2020-2025', '["1.3 Firefly", "1.4 Fire"]', '{"filtro_oleo": "Filtro de óleo motor", "correia_alternador": "Correia do alternador", "pastilha_freio": "Pastilha de freio dianteira"}', '[{"title": "Falha na bomba de combustível", "severity": "warning"}, {"title": "Desgaste precoce de embreagem", "severity": "info"}]'),
('fiat', 'Mobi', '2016-2025', '["1.0 Fire", "1.0 Firefly"]', '{"filtro_ar": "Filtro de ar motor", "vela_ignicao": "Vela de ignição", "amortecedor": "Amortecedor dianteiro"}', '[{"title": "Ruído na suspensão", "severity": "info"}, {"title": "Consumo elevado de óleo", "severity": "warning"}]'),
('fiat', 'Argo', '2017-2025', '["1.0 Firefly", "1.3 Firefly", "1.8 E.torQ"]', '{"filtro_cabine": "Filtro de ar condicionado", "disco_freio": "Disco de freio dianteiro", "bobina_ignicao": "Bobina de ignição"}', '[{"title": "Problema no módulo de vidro", "severity": "info"}]'),
('fiat', 'Uno', '2010-2022', '["1.0 Fire", "1.0 Evo", "1.4 Evo"]', '{"correia_dentada": "Correia dentada", "bomba_agua": "Bomba d''água", "tensor_correia": "Tensor da correia"}', '[{"title": "Vazamento no radiador", "severity": "warning"}, {"title": "Sensor de temperatura falha", "severity": "info"}]'),
('fiat', 'Toro', '2016-2025', '["1.3 Turbo Flex", "1.8 E.torQ", "2.0 Turbo Diesel"]', '{"filtro_diesel": "Filtro de combustível diesel", "pastilha_freio_traseira": "Pastilha de freio traseira", "oleo_cambio": "Óleo do câmbio automático"}', '[{"title": "Problema no câmbio automático", "severity": "critical"}, {"title": "Falha no turbo", "severity": "warning"}]'),
('fiat', 'Cronos', '2018-2025', '["1.0 Firefly", "1.3 Firefly", "1.8 E.torQ"]', '{"amortecedor_traseiro": "Amortecedor traseiro", "terminal_direcao": "Terminal de direção", "bieleta": "Bieleta estabilizadora"}', '[{"title": "Ruído na suspensão traseira", "severity": "info"}]'),
('fiat', 'Pulse', '2021-2025', '["1.0 Turbo", "1.3 Turbo"]', '{"filtro_oleo": "Filtro de óleo motor turbo", "intercooler": "Intercooler", "valvula_wastegate": "Válvula wastegate"}', '[{"title": "Hesitação em baixa rotação", "severity": "info"}]'),
-- VOLKSWAGEN
('volkswagen', 'Polo', '2018-2025', '["1.0 MPI", "1.0 TSI", "1.4 TSI"]', '{"bobina_ignicao": "Bobina de ignição TSI", "sensor_map": "Sensor MAP", "valvula_solenoide": "Válvula solenoide turbo"}', '[{"title": "Falha na bobina de ignição", "severity": "warning"}, {"title": "Consumo de óleo TSI", "severity": "info"}]'),
('volkswagen', 'T-Cross', '2019-2025', '["1.0 TSI", "1.4 TSI"]', '{"sensor_estacionamento": "Sensor de estacionamento", "camera_re": "Câmera de ré", "central_multimidia": "Central multimídia"}', '[{"title": "Problema na central multimídia", "severity": "info"}]'),
('volkswagen', 'Gol', '2008-2023', '["1.0 MPI", "1.6 MSI"]', '{"cabo_vela": "Cabo de vela", "bico_injetor": "Bico injetor", "sonda_lambda": "Sonda lambda"}', '[{"title": "Vazamento na junta do cabeçote", "severity": "critical"}, {"title": "Falha no corpo de borboleta", "severity": "warning"}]'),
('volkswagen', 'Virtus', '2018-2025', '["1.0 TSI", "1.4 TSI"]', '{"modulo_abs": "Módulo ABS", "sensor_abs": "Sensor ABS", "fluido_freio": "Fluido de freio DOT4"}', '[{"title": "Luz de ABS acende", "severity": "warning"}]'),
('volkswagen', 'Nivus', '2020-2025', '["1.0 TSI"]', '{"teto_solar": "Motor do teto solar", "sensor_chuva": "Sensor de chuva", "para_brisa": "Para-brisa com sensores"}', '[{"title": "Infiltração pelo teto solar", "severity": "warning"}]'),
('volkswagen', 'Saveiro', '2010-2025', '["1.6 MSI", "1.6 16V"]', '{"amortecedor_carga": "Amortecedor para carga", "mola_suspensao": "Mola de suspensão reforçada", "rolamento_roda": "Rolamento de roda"}', '[{"title": "Desgaste prematuro dos pneus traseiros", "severity": "info"}]'),
-- CHEVROLET
('chevrolet', 'Onix', '2012-2025', '["1.0 SPE/4", "1.0 Turbo", "1.4 SPE/4"]', '{"sensor_rotacao": "Sensor de rotação", "atuador_marcha_lenta": "Atuador de marcha lenta", "catalisador": "Catalisador"}', '[{"title": "Problema no atuador de marcha lenta", "severity": "warning"}, {"title": "Falha no sensor de rotação", "severity": "critical"}]'),
('chevrolet', 'Onix Plus', '2019-2025', '["1.0 SPE/4", "1.0 Turbo"]', '{"embreagem": "Kit de embreagem", "volante_motor": "Volante do motor bimassa", "bomba_oleo": "Bomba de óleo"}', '[{"title": "Ruído no volante bimassa", "severity": "warning"}]'),
('chevrolet', 'Tracker', '2020-2025', '["1.0 Turbo", "1.2 Turbo"]', '{"turbo": "Turbina", "valvula_egr": "Válvula EGR", "dpf": "Filtro de partículas"}', '[{"title": "Luz de motor acesa por EGR", "severity": "warning"}]'),
('chevrolet', 'S10', '2012-2025', '["2.5 Flex", "2.8 Turbo Diesel"]', '{"filtro_diesel": "Filtro de combustível diesel", "injetor_diesel": "Bico injetor diesel", "bomba_injetora": "Bomba injetora"}', '[{"title": "Problema na bomba injetora", "severity": "critical"}, {"title": "Falha no sistema AdBlue", "severity": "warning"}]'),
('chevrolet', 'Spin', '2012-2025', '["1.8 SPE/4"]', '{"correia_acessorios": "Correia de acessórios", "tensor_automatico": "Tensor automático", "polia_alternador": "Polia do alternador"}', '[{"title": "Chiado na correia", "severity": "info"}]'),
-- HYUNDAI
('hyundai', 'HB20', '2012-2025', '["1.0 MPI", "1.0 TGDI", "1.6 MPI"]', '{"sensor_tps": "Sensor de posição da borboleta", "bomba_combustivel": "Bomba de combustível", "regulador_pressao": "Regulador de pressão"}', '[{"title": "Falha na bomba de combustível", "severity": "critical"}, {"title": "Problema no ar condicionado", "severity": "info"}]'),
('hyundai', 'Creta', '2017-2025', '["1.6 MPI", "2.0 MPI"]', '{"compressor_ar": "Compressor do ar condicionado", "condensador": "Condensador", "filtro_secador": "Filtro secador"}', '[{"title": "Vazamento no ar condicionado", "severity": "warning"}]'),
('hyundai', 'Tucson', '2016-2025', '["1.6 TGDI", "2.0 MPI"]', '{"turbina": "Turbina", "valvula_wastegate": "Válvula wastegate", "intercooler": "Intercooler"}', '[{"title": "Perda de potência por turbo", "severity": "warning"}]'),
-- TOYOTA
('toyota', 'Corolla', '2015-2025', '["1.8 VVT-i", "2.0 VVT-iE", "1.8 Híbrido"]', '{"bateria_hibrido": "Bateria híbrida", "motor_eletrico": "Motor elétrico", "inversor": "Inversor de potência"}', '[{"title": "Degradação da bateria híbrida", "severity": "info"}]'),
('toyota', 'Corolla Cross', '2021-2025', '["1.8 Híbrido", "2.0 VVT-iE"]', '{"sensor_estacionamento": "Sensor de estacionamento", "camera_360": "Sistema de câmeras 360°", "radar_frontal": "Radar de segurança"}', '[{"title": "Calibração do radar necessária", "severity": "info"}]'),
('toyota', 'Hilux', '2016-2025', '["2.7 Flex", "2.8 Turbo Diesel"]', '{"correia_alternador": "Correia do alternador", "tensor_correia": "Tensor da correia", "bomba_vacuo": "Bomba de vácuo"}', '[{"title": "Vazamento na bomba de vácuo", "severity": "warning"}]'),
('toyota', 'Yaris', '2018-2023', '["1.3 VVT-i", "1.5 VVT-i"]', '{"vela_ignicao": "Vela de ignição iridium", "filtro_ar": "Filtro de ar esportivo", "oleo_cvt": "Óleo do câmbio CVT"}', '[{"title": "Hesitação do câmbio CVT", "severity": "info"}]'),
-- HONDA
('honda', 'Civic', '2016-2025', '["1.5 Turbo", "2.0 i-VTEC"]', '{"turbina": "Turbina", "valvula_vtec": "Válvula VTEC", "sensor_detonacao": "Sensor de detonação"}', '[{"title": "Diluição de óleo por combustível", "severity": "warning"}]'),
('honda', 'HR-V', '2015-2025', '["1.5 i-VTEC", "1.8 i-VTEC"]', '{"amortecedor": "Amortecedor dianteiro", "coxim_motor": "Coxim do motor", "barra_estabilizadora": "Barra estabilizadora"}', '[{"title": "Ruído na suspensão dianteira", "severity": "info"}]'),
('honda', 'City', '2015-2025', '["1.5 i-VTEC"]', '{"polia_virabrequim": "Polia do virabrequim", "correia_dentada": "Correia dentada", "bomba_agua": "Bomba d''água"}', '[{"title": "Troca obrigatória de correia aos 100km", "severity": "warning"}]'),
-- RENAULT
('renault', 'Kwid', '2017-2025', '["1.0 SCe"]', '{"vela_ignicao": "Vela de ignição", "bobina_ignicao": "Bobina de ignição", "filtro_combustivel": "Filtro de combustível"}', '[{"title": "Falha no sensor de combustível", "severity": "info"}]'),
('renault', 'Duster', '2012-2025', '["1.6 SCe", "2.0 16V"]', '{"cardã": "Junta homocinética", "rolamento_roda_traseira": "Rolamento de roda traseira", "diferencial": "Óleo do diferencial"}', '[{"title": "Ruído no cardã", "severity": "warning"}]'),
('renault', 'Sandero', '2008-2023', '["1.0 SCe", "1.6 SCe"]', '{"terminal_direcao": "Terminal de direção", "pivo_suspensao": "Pivô de suspensão", "bucha_bandeja": "Bucha da bandeja"}', '[{"title": "Folga na direção", "severity": "warning"}]'),
-- JEEP
('jeep', 'Compass', '2016-2025', '["1.3 Turbo", "2.0 Turbo Diesel"]', '{"modulo_tracao": "Módulo de tração 4x4", "diferencial_traseiro": "Diferencial traseiro", "junta_cardã": "Junta do cardã"}', '[{"title": "Falha no sistema 4x4", "severity": "warning"}]'),
('jeep', 'Renegade', '2015-2025', '["1.3 Turbo", "1.8 E.torQ", "2.0 Turbo Diesel"]', '{"embreagem_dupla": "Kit embreagem dupla", "atuador_embreagem": "Atuador da embreagem", "volante_bimassa": "Volante bimassa"}', '[{"title": "Trepidação na embreagem automatizada", "severity": "critical"}, {"title": "Problema no câmbio DDCT", "severity": "warning"}]');