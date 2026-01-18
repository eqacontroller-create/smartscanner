-- Adicionar modelos faltantes de Citroën, BMW, Mercedes e Audi

INSERT INTO vehicle_models (brand, model_name, years_available, engine_options, common_issues, popular_parts, maintenance_schedule)
VALUES 
-- Citroën modelos faltantes
(
  'citroen',
  'C3 (Geração Anterior)',
  '2003-2022',
  '[{"name": "1.4 GLX", "displacement": "1.4L", "fuel": "flex"}, {"name": "1.6 Exclusive", "displacement": "1.6L", "fuel": "flex"}]'::jsonb,
  '[{"title": "Vidro elétrico", "severity": "info", "description": "Máquina de vidro pode apresentar lentidão"}, {"title": "Sensor de temperatura", "severity": "warning", "description": "Pode dar leituras incorretas"}]'::jsonb,
  '{"maquina_vidro": "Citroen 9222.AV", "sensor_temp": "Wahler 4212.92", "correia_acessorios": "Gates 6PK1070"}'::jsonb,
  '{"oleo_motor": 10000, "correia_acessorios": 40000, "velas": 30000}'::jsonb
),
(
  'citroen',
  'C4',
  '2007-2018',
  '[{"name": "2.0 GLX", "displacement": "2.0L", "fuel": "flex"}, {"name": "1.6 THP", "displacement": "1.6L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Correia dentada", "severity": "critical", "description": "Troca obrigatória a cada 60.000km"}, {"title": "Bobina de ignição", "severity": "warning", "description": "Falhas após 50.000km"}]'::jsonb,
  '{"correia_dentada": "Gates K015587XS", "bobina_ignicao": "Bosch 0221504461", "vela_ignicao": "NGK PLZKAR6A-11"}'::jsonb,
  '{"oleo_motor": 10000, "correia_dentada": 60000, "fluido_freio": 30000}'::jsonb
),
(
  'citroen',
  'C4 Lounge',
  '2013-2020',
  '[{"name": "1.6 THP", "displacement": "1.6L turbo", "fuel": "gasolina"}, {"name": "2.0 Origine", "displacement": "2.0L", "fuel": "flex"}]'::jsonb,
  '[{"title": "Embreagem", "severity": "warning", "description": "Desgaste em uso urbano intenso"}, {"title": "Central multimídia", "severity": "info", "description": "Travamentos ocasionais"}]'::jsonb,
  '{"kit_embreagem": "Valeo 826696", "pastilha_freio": "Fras-le PD/1015", "filtro_cabine": "PSA 6447.XF"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_cabine": 15000, "embreagem": 50000}'::jsonb
),
(
  'citroen',
  'Aircross',
  '2010-2017',
  '[{"name": "1.6 GLX", "displacement": "1.6L", "fuel": "flex"}, {"name": "1.6 Exclusive", "displacement": "1.6L", "fuel": "flex"}]'::jsonb,
  '[{"title": "Suspensão", "severity": "warning", "description": "Batentes podem desgastar rapidamente"}, {"title": "Direção elétrica", "severity": "info", "description": "Pode apresentar ruídos"}]'::jsonb,
  '{"batente_suspensao": "Sampel SC5010", "amortecedor": "Cofap MP32783", "terminal_direcao": "Nakata N99098"}'::jsonb,
  '{"oleo_motor": 10000, "suspensao": 40000, "alinhamento": 10000}'::jsonb
),

-- Mercedes modelos
(
  'mercedes',
  'Classe A',
  '2013-2025',
  '[{"name": "A200", "displacement": "1.3L turbo", "fuel": "gasolina"}, {"name": "A250", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "AMG A35", "displacement": "2.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Câmbio DCT", "severity": "warning", "description": "Pode apresentar solavancos em baixa velocidade"}, {"title": "Sistema MBUX", "severity": "info", "description": "Atualizações de software recomendadas"}]'::jsonb,
  '{"oleo_cambio": "MB 236.21", "pastilha_freio": "TRW GDB1960", "filtro_ar": "Mann C25008"}'::jsonb,
  '{"oleo_motor": 15000, "fluido_cambio": 60000, "pastilhas": 30000}'::jsonb
),
(
  'mercedes',
  'Classe C',
  '2008-2025',
  '[{"name": "C180", "displacement": "1.6L turbo", "fuel": "gasolina"}, {"name": "C200", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "C300", "displacement": "2.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Suspensão pneumática", "severity": "warning", "description": "Bolsas podem vazar em versões equipadas"}, {"title": "Sensor de estacionamento", "severity": "info", "description": "Calibração pode ser necessária"}]'::jsonb,
  '{"amortecedor": "Bilstein B4", "pastilha_freio": "Textar 2446801", "filtro_oleo": "Mann HU7010z"}'::jsonb,
  '{"oleo_motor": 15000, "fluido_freio": 24000, "suspensao": 80000}'::jsonb
),
(
  'mercedes',
  'GLA',
  '2014-2025',
  '[{"name": "GLA200", "displacement": "1.3L turbo", "fuel": "gasolina"}, {"name": "GLA250", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "AMG GLA35", "displacement": "2.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Injeção direta", "severity": "info", "description": "Limpeza de válvulas recomendada a cada 40.000km"}, {"title": "Freio de estacionamento", "severity": "warning", "description": "Motor pode precisar de ajuste"}]'::jsonb,
  '{"vela_ignicao": "NGK 95712", "filtro_cabine": "Mann CUK29005", "disco_freio": "Brembo 09.C881.11"}'::jsonb,
  '{"oleo_motor": 15000, "velas": 60000, "limpeza_injecao": 40000}'::jsonb
),
(
  'mercedes',
  'CLA',
  '2013-2025',
  '[{"name": "CLA180", "displacement": "1.3L turbo", "fuel": "gasolina"}, {"name": "CLA200", "displacement": "1.3L turbo", "fuel": "gasolina"}, {"name": "CLA250", "displacement": "2.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Câmbio 7G-DCT", "severity": "warning", "description": "Troca de óleo recomendada a cada 40.000km"}, {"title": "Faróis LED", "severity": "info", "description": "Unidade de controle pode precisar de reparo"}]'::jsonb,
  '{"oleo_cambio": "MB 236.21", "pastilha_freio": "TRW GDB2059", "filtro_ar": "Mann C27006"}'::jsonb,
  '{"oleo_motor": 15000, "oleo_cambio": 40000, "filtro_cabine": 20000}'::jsonb
),

-- Audi modelos
(
  'audi',
  'A3',
  '2007-2025',
  '[{"name": "1.4 TFSI", "displacement": "1.4L turbo", "fuel": "gasolina"}, {"name": "2.0 TFSI", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "S3", "displacement": "2.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Corrente de comando", "severity": "critical", "description": "Motor EA888 antigo pode ter estiramento"}, {"title": "Bomba d''água", "severity": "warning", "description": "Pode vazar após 80.000km"}]'::jsonb,
  '{"corrente_comando": "INA 559017230", "bomba_dagua": "Graf PA1091", "vela_ignicao": "NGK 94201"}'::jsonb,
  '{"oleo_motor": 15000, "corrente": 120000, "fluido_freio": 24000}'::jsonb
),
(
  'audi',
  'A4',
  '2008-2025',
  '[{"name": "2.0 TFSI", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "2.0 TDI", "displacement": "2.0L diesel", "fuel": "diesel"}, {"name": "S4", "displacement": "3.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Consumo de óleo", "severity": "warning", "description": "Motor 2.0 TFSI antigo pode consumir óleo"}, {"title": "Tensor da correia", "severity": "info", "description": "Verificar a cada revisão"}]'::jsonb,
  '{"oleo_motor": "Castrol Edge 5W30", "filtro_oleo": "Mann HU7197x", "pastilha_freio": "TRW GDB1617"}'::jsonb,
  '{"oleo_motor": 15000, "filtro_ar": 30000, "fluido_transmissao": 60000}'::jsonb
),
(
  'audi',
  'A1',
  '2011-2025',
  '[{"name": "1.0 TFSI", "displacement": "1.0L turbo", "fuel": "gasolina"}, {"name": "1.4 TFSI", "displacement": "1.4L turbo", "fuel": "gasolina"}, {"name": "S1", "displacement": "2.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Embreagem DSG", "severity": "warning", "description": "Câmbio DSG pode precisar de adaptação"}, {"title": "Sensor MAP", "severity": "info", "description": "Pode sujar com o tempo"}]'::jsonb,
  '{"oleo_cambio_dsg": "VAG G052182A2", "filtro_ar": "Mann C14130", "vela_ignicao": "NGK 95712"}'::jsonb,
  '{"oleo_motor": 15000, "oleo_dsg": 60000, "velas": 60000}'::jsonb
),
(
  'audi',
  'Q3',
  '2012-2025',
  '[{"name": "1.4 TFSI", "displacement": "1.4L turbo", "fuel": "gasolina"}, {"name": "2.0 TFSI", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "2.0 TDI", "displacement": "2.0L diesel", "fuel": "diesel"}]'::jsonb,
  '[{"title": "Sistema Quattro", "severity": "info", "description": "Verificar fluido do diferencial"}, {"title": "Turbina", "severity": "warning", "description": "Manutenção preventiva recomendada"}]'::jsonb,
  '{"oleo_diferencial": "VAG G052145S2", "filtro_oleo": "Mann HU7020z", "amortecedor": "Sachs 316591"}'::jsonb,
  '{"oleo_motor": 15000, "oleo_diferencial": 60000, "suspensao": 60000}'::jsonb
),
(
  'audi',
  'Q5',
  '2009-2025',
  '[{"name": "2.0 TFSI", "displacement": "2.0L turbo", "fuel": "gasolina"}, {"name": "2.0 TDI", "displacement": "2.0L diesel", "fuel": "diesel"}, {"name": "SQ5", "displacement": "3.0L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Corrente de distribuição", "severity": "critical", "description": "Verificar em modelos até 2013"}, {"title": "Bomba de alta pressão", "severity": "warning", "description": "Pode apresentar ruídos"}]'::jsonb,
  '{"corrente_distribuicao": "INA 559017410", "bomba_combustivel": "Bosch 0261520472", "pastilha_freio": "TRW GDB1841"}'::jsonb,
  '{"oleo_motor": 15000, "corrente": 120000, "fluido_freio": 24000}'::jsonb
);