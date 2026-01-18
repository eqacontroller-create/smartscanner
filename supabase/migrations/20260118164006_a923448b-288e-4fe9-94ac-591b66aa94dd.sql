-- Adicionar modelos Peugeot faltantes ao catálogo
INSERT INTO vehicle_models (brand, model_name, years_available, engine_options, common_issues, popular_parts, maintenance_schedule)
VALUES 
(
  'peugeot',
  '308',
  '2012-2024',
  '[{"name": "1.6 THP", "displacement": "1.6L turbo", "fuel": "gasolina"}, {"name": "1.6 Allure", "displacement": "1.6L", "fuel": "flex"}]'::jsonb,
  '[{"title": "Bobina de ignição", "severity": "warning", "description": "Falhas de ignição comuns após 60.000km"}, {"title": "Correia dentada", "severity": "critical", "description": "Troca obrigatória a cada 60.000km ou 4 anos"}]'::jsonb,
  '{"filtro_oleo": "PSA 1109.AY", "pastilha_freio": "Fras-le PD/1010", "correia_dentada": "Gates K015587XS"}'::jsonb,
  '{"oleo_motor": 10000, "correia_dentada": 60000, "fluido_freio": 30000}'::jsonb
),
(
  'peugeot',
  '408',
  '2011-2019',
  '[{"name": "2.0 Allure", "displacement": "2.0L", "fuel": "flex"}, {"name": "1.6 THP", "displacement": "1.6L turbo", "fuel": "gasolina"}]'::jsonb,
  '[{"title": "Sensor de estacionamento", "severity": "info", "description": "Falhas intermitentes nos sensores"}, {"title": "Embreagem", "severity": "warning", "description": "Desgaste acelerado em uso urbano"}]'::jsonb,
  '{"kit_embreagem": "Valeo 826696", "filtro_ar": "PSA 1444.VJ", "vela_ignicao": "NGK PLZKAR6A-11"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_ar": 20000, "velas": 40000}'::jsonb
),
(
  'peugeot',
  '508',
  '2012-2024',
  '[{"name": "1.6 THP", "displacement": "1.6L turbo", "fuel": "gasolina"}, {"name": "2.0 BlueHDi", "displacement": "2.0L diesel", "fuel": "diesel"}]'::jsonb,
  '[{"title": "Sistema Start-Stop", "severity": "info", "description": "Bateria auxiliar pode precisar de troca"}, {"title": "Suspensão traseira", "severity": "warning", "description": "Buchas podem apresentar folga"}]'::jsonb,
  '{"bateria_auxiliar": "Bosch S4 E05", "amortecedor_traseiro": "Monroe G8101", "filtro_combustivel": "PSA 190199"}'::jsonb,
  '{"oleo_motor": 15000, "filtro_combustivel": 30000, "fluido_transmissao": 60000}'::jsonb
),
(
  'peugeot',
  '207',
  '2008-2015',
  '[{"name": "1.4 XR", "displacement": "1.4L", "fuel": "flex"}, {"name": "1.6 XS", "displacement": "1.6L", "fuel": "flex"}]'::jsonb,
  '[{"title": "Vidro elétrico", "severity": "info", "description": "Máquina de vidro pode travar"}, {"title": "Direção hidráulica", "severity": "warning", "description": "Vazamentos na caixa de direção"}]'::jsonb,
  '{"maquina_vidro": "PSA 9222.CW", "oleo_direcao": "Total Fluide LDS", "correia_acessorios": "Gates 6PK1200"}'::jsonb,
  '{"oleo_motor": 10000, "correia_acessorios": 40000, "fluido_direcao": 50000}'::jsonb
),
(
  'peugeot',
  'Partner',
  '2010-2020',
  '[{"name": "1.6 Flex", "displacement": "1.6L", "fuel": "flex"}]'::jsonb,
  '[{"title": "Porta lateral", "severity": "info", "description": "Roletes da porta podem desgastar"}, {"title": "Suspensão dianteira", "severity": "warning", "description": "Pivôs e bandejas com desgaste em carga pesada"}]'::jsonb,
  '{"pivo_suspensao": "Nakata N99051", "bandeja_dianteira": "Axios 531.1765", "filtro_cabine": "PSA 6447.XG"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_cabine": 15000, "suspensao": 40000}'::jsonb
);