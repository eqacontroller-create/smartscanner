-- Atualizar o registro existente do 308 para indicar que é genérico
UPDATE vehicle_models 
SET model_name = '308 (Genérico)'
WHERE brand = 'peugeot' AND model_name = '308';

-- Adicionar versões específicas do Peugeot 308
INSERT INTO vehicle_models (brand, model_name, years_available, engine_options, common_issues, popular_parts, maintenance_schedule)
VALUES 
(
  'peugeot',
  '308 Active',
  '2012-2019',
  '[{"name": "1.6 16v Flex", "displacement": "1.6L", "fuel": "flex", "power": "122cv (E) / 115cv (G)", "torque": "16,4 kgfm", "transmission": "manual 5v"}]'::jsonb,
  '[{"title": "Bomba de combustível fraca", "severity": "warning", "description": "Falha intermitente, especialmente em subidas"}, {"title": "Sensor de temperatura", "severity": "warning", "description": "Leitura incorreta no painel"}, {"title": "Rolamentos de roda", "severity": "info", "description": "Ruído após 80.000km"}, {"title": "Bieletas da barra estabilizadora", "severity": "info", "description": "Folga e ruídos em piso irregular"}]'::jsonb,
  '{"bomba_combustivel": "Bosch 0580453453", "sensor_temperatura": "Peugeot 1338A3", "rolamento_roda": "SKF BAH-0015", "bieleta_estabilizadora": "Lemförder 35824"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_oleo": 10000, "filtro_ar": 20000, "filtro_combustivel": 30000, "velas": 40000, "correia_acessorios": 60000}'::jsonb
),
(
  'peugeot',
  '308 Allure',
  '2012-2019',
  '[{"name": "2.0 16v Flex Manual", "displacement": "2.0L", "fuel": "flex", "power": "143cv (E) / 140cv (G)", "torque": "19,4 kgfm", "transmission": "manual 5v"}, {"name": "2.0 16v Flex Automático", "displacement": "2.0L", "fuel": "flex", "power": "143cv (E) / 140cv (G)", "torque": "19,4 kgfm", "transmission": "automático AL4 4v"}]'::jsonb,
  '[{"title": "Câmbio automático AL4", "severity": "critical", "description": "Solenoides de pressão e válvula moduladora com falha comum após 100.000km"}, {"title": "Sensor de oxigênio", "severity": "warning", "description": "Sonda lambda deteriorada causa consumo alto"}, {"title": "Coxins do motor", "severity": "warning", "description": "Vibração excessiva em marcha lenta"}, {"title": "Módulo BSI", "severity": "warning", "description": "Problemas elétricos intermitentes"}]'::jsonb,
  '{"kit_cambio_al4": "ZF 8HP", "sonda_lambda": "NGK OZA659-EE15", "coxim_motor": "Hutchinson 594254", "modulo_bsi": "Valeo 9664983080"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_oleo": 10000, "filtro_ar": 20000, "filtro_combustivel": 30000, "velas": 40000, "oleo_cambio_at": 60000, "correia_acessorios": 60000}'::jsonb
),
(
  'peugeot',
  '308 Feline',
  '2013-2019',
  '[{"name": "1.6 THP Turbo", "displacement": "1.6L turbo", "fuel": "gasolina", "power": "165cv", "torque": "24,5 kgfm", "transmission": "automático 6v"}]'::jsonb,
  '[{"title": "Correia dentada", "severity": "critical", "description": "Troca obrigatória a cada 80.000km ou 5 anos - motor de interferência"}, {"title": "Bobina de ignição", "severity": "warning", "description": "Falha causa motor falhando e luz de injeção"}, {"title": "Válvula termostática", "severity": "warning", "description": "Falha causa superaquecimento ou aquecimento lento"}, {"title": "Tensor da correia", "severity": "warning", "description": "Ruído característico ao ligar"}, {"title": "Turbo", "severity": "info", "description": "Verificar folgas após 120.000km"}]'::jsonb,
  '{"kit_correia_dentada": "Gates K015587XS", "bobina_ignicao": "Bosch 0221504470", "valvula_termostatica": "Wahler 410171.92D", "tensor_correia": "SKF VKM 13256", "turbo": "Garrett GT1544S"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_oleo": 10000, "filtro_ar": 15000, "velas_iridium": 40000, "correia_dentada": 80000, "fluido_arrefecimento": 40000}'::jsonb
),
(
  'peugeot',
  '308 Griffe',
  '2015-2019',
  '[{"name": "1.6 THP Turbo", "displacement": "1.6L turbo", "fuel": "gasolina", "power": "173cv", "torque": "24,5 kgfm", "transmission": "automático 6v"}]'::jsonb,
  '[{"title": "Correia dentada", "severity": "critical", "description": "Troca obrigatória a cada 80.000km ou 5 anos - motor de interferência"}, {"title": "Bomba d''água", "severity": "warning", "description": "Vazamento comum, trocar junto com correia dentada"}, {"title": "Bobina de ignição", "severity": "warning", "description": "Falha causa motor falhando e luz de injeção"}, {"title": "Embreagem do ar-condicionado", "severity": "info", "description": "Ruído ao acionar A/C"}, {"title": "Teto solar panorâmico", "severity": "info", "description": "Drenos entupidos causam infiltração"}]'::jsonb,
  '{"kit_correia_dentada": "Gates K015587XS", "bomba_agua": "SKF VKPC 83648", "bobina_ignicao": "Bosch 0221504470", "embreagem_compressor_ac": "Denso 5SE12C", "velas_iridium": "NGK PLZKAR6A-11"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_oleo": 10000, "filtro_ar": 15000, "velas_iridium": 40000, "correia_dentada": 80000, "fluido_arrefecimento": 40000, "filtro_cabine": 15000}'::jsonb
),
(
  'peugeot',
  '308 Roland Garros',
  '2014-2016',
  '[{"name": "1.6 THP Turbo", "displacement": "1.6L turbo", "fuel": "gasolina", "power": "165cv", "torque": "24,5 kgfm", "transmission": "automático 6v"}]'::jsonb,
  '[{"title": "Correia dentada", "severity": "critical", "description": "Troca obrigatória a cada 80.000km ou 5 anos - motor de interferência"}, {"title": "Teto solar panorâmico", "severity": "warning", "description": "Drenos entupidos causam infiltração no interior"}, {"title": "Bancos de couro", "severity": "info", "description": "Ressecamento do couro caramelo - hidratar regularmente"}, {"title": "Sensor de estacionamento", "severity": "info", "description": "Sensores traseiros com leitura incorreta"}, {"title": "Bobina de ignição", "severity": "warning", "description": "Falha causa motor falhando"}]'::jsonb,
  '{"kit_correia_dentada": "Gates K015587XS", "bobina_ignicao": "Bosch 0221504470", "sensor_estacionamento": "Valeo 890006", "hidratante_couro": "Meguiars G18616", "filtro_cabine_carvao": "Mann CUK 2243"}'::jsonb,
  '{"oleo_motor": 10000, "filtro_oleo": 10000, "filtro_ar": 15000, "velas_iridium": 40000, "correia_dentada": 80000, "fluido_arrefecimento": 40000, "limpeza_drenos_teto": 20000}'::jsonb
);