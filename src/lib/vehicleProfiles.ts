// Sistema de Perfis de Veículo para Scanner Universal
// Mapeamento WMI (World Manufacturer Identifier) para marcas

import type { VehicleSpecs, VehicleTip, KnownIssue } from '@/types/vehicleTypes';

export type VehicleBrand = 
  | 'volkswagen' 
  | 'ford' 
  | 'chevrolet' 
  | 'honda' 
  | 'fiat' 
  | 'toyota' 
  | 'hyundai' 
  | 'kia'
  | 'renault'
  | 'nissan'
  | 'mitsubishi'
  | 'jeep'
  | 'bmw'
  | 'mercedes'
  | 'audi'
  | 'generic';

export interface VehicleProfile {
  brand: VehicleBrand;
  displayName: string;
  slogan: string;
  // Cores HSL para CSS variables
  colors: {
    primary: string; // HSL format: "h s% l%"
    accent: string;
    primaryForeground: string;
  };
  // Especificações técnicas típicas
  specs: VehicleSpecs;
  // Dicas específicas da marca
  tips: VehicleTip[];
  // Problemas conhecidos comuns
  knownIssues: KnownIssue[];
  // Características para contexto do Jarvis AI
  characteristics: string;
}

export interface DetectedVehicle {
  vin: string | null;
  brand: VehicleBrand;
  manufacturer: string;
  modelYear: string | null;
  country: string | null;
  profile: VehicleProfile;
}

// Specs padrão para marcas genéricas
const defaultSpecs: VehicleSpecs = {
  typicalRedlineRPM: 6500,
  normalTempRange: [85, 100],
  normalVoltageRange: [13.5, 14.5],
  fuelTrimTolerance: 10,
  shiftPointEco: 0.4,
  shiftPointSport: 0.85,
};

// Perfis de cada marca com cores, specs e configurações
export const VEHICLE_PROFILES: Record<VehicleBrand, VehicleProfile> = {
  volkswagen: {
    brand: 'volkswagen',
    displayName: 'Volkswagen',
    slogan: 'Das Auto',
    colors: {
      primary: '214 100% 16%', // Azul escuro VW #001E50
      accent: '195 100% 41%', // Azul claro #00A0D2
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [85, 105],
      normalVoltageRange: [13.8, 14.4],
      fuelTrimTolerance: 8,
      shiftPointEco: 0.35,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'vw-fuel-1',
        category: 'combustivel',
        title: 'Gasolina de alta octanagem',
        description: 'Motores TSI e turbo funcionam melhor com gasolina aditivada de alta octanagem para evitar detonação.',
        priority: 'alta',
      },
      {
        id: 'vw-manut-1',
        category: 'manutencao',
        title: 'Troca de óleo DSG',
        description: 'Câmbios DSG requerem troca de óleo a cada 60.000 km para funcionamento suave.',
        priority: 'media',
      },
      {
        id: 'vw-eco-1',
        category: 'economia',
        title: 'Modo ECO',
        description: 'Mantenha rotações entre 2000-3000 RPM para melhor economia. Motores VAG são eficientes em baixa rotação.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'vw-issue-1',
        title: 'Tensor da correia dentada',
        description: 'Motores EA111 e EA211 podem ter desgaste prematuro do tensor. Verifique a cada revisão.',
        symptoms: ['Ruído na partida', 'Motor falhando'],
        affectedYears: '2008-2018',
        severity: 'warning',
      },
      {
        id: 'vw-issue-2',
        title: 'Bobina de ignição',
        description: 'Bobinas podem falhar causando falhas no motor. Comum em motores TSI.',
        symptoms: ['Luz de motor acesa', 'Motor falhando', 'Perda de potência'],
        severity: 'warning',
      },
    ],
    characteristics: 'Veículos alemães precisos e tecnológicos. Motores turbo eficientes em baixa rotação. Sistemas eletrônicos avançados. Preferem gasolina de alta qualidade.',
  },
  ford: {
    brand: 'ford',
    displayName: 'Ford',
    slogan: 'Built Ford Tough',
    colors: {
      primary: '212 100% 22%', // Azul Ford #003478
      accent: '199 89% 48%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [85, 100],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 10,
      shiftPointEco: 0.4,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'ford-manut-1',
        category: 'manutencao',
        title: 'Sistema de arrefecimento',
        description: 'Verifique o nível do líquido de arrefecimento regularmente. Motores Sigma são sensíveis a superaquecimento.',
        priority: 'alta',
      },
      {
        id: 'ford-eco-1',
        category: 'economia',
        title: 'Economia de combustível',
        description: 'Motores Duratec e EcoBoost são mais econômicos em rotações médias (2500-3500 RPM).',
        priority: 'media',
      },
    ],
    knownIssues: [
      {
        id: 'ford-issue-1',
        title: 'Sensor de temperatura',
        description: 'O sensor de temperatura pode apresentar leituras incorretas em alguns modelos.',
        symptoms: ['Temperatura oscilante', 'Ventoinha ligando constantemente'],
        severity: 'info',
      },
    ],
    characteristics: 'Veículos robustos e confiáveis. Motores EcoBoost turbo são potentes e econômicos. Boa relação custo-benefício em manutenção.',
  },
  chevrolet: {
    brand: 'chevrolet',
    displayName: 'Chevrolet',
    slogan: 'Find New Roads',
    colors: {
      primary: '43 73% 52%', // Dourado #D4AF37
      accent: '0 0% 20%',
      primaryForeground: '0 0% 10%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [85, 100],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 10,
      shiftPointEco: 0.4,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'gm-flex-1',
        category: 'combustivel',
        title: 'Combustível Flex',
        description: 'Motores GM Flex se adaptam bem a qualquer proporção gasolina/etanol. Em dias frios, prefira mais gasolina.',
        priority: 'media',
      },
      {
        id: 'gm-oleo-1',
        category: 'manutencao',
        title: 'Óleo do motor',
        description: 'Use sempre óleo 5W30 sintético para melhor proteção e economia.',
        priority: 'alta',
      },
    ],
    knownIssues: [
      {
        id: 'gm-issue-1',
        title: 'Junta do cabeçote',
        description: 'Motores 1.0 e 1.4 podem ter problemas de junta do cabeçote em caso de superaquecimento.',
        symptoms: ['Perda de água', 'Fumaça branca no escapamento', 'Óleo leitoso'],
        severity: 'critical',
      },
    ],
    characteristics: 'Veículos versáteis e econômicos. Motores Flex muito adaptáveis. Peças de reposição acessíveis. Boa para uso urbano.',
  },
  honda: {
    brand: 'honda',
    displayName: 'Honda',
    slogan: 'The Power of Dreams',
    colors: {
      primary: '0 100% 40%', // Vermelho Honda #CC0000
      accent: '0 0% 75%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 7000,
      normalTempRange: [80, 95],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 8,
      shiftPointEco: 0.35,
      shiftPointSport: 0.9,
    },
    tips: [
      {
        id: 'honda-vtec-1',
        category: 'desempenho',
        title: 'Sistema VTEC',
        description: 'Motores VTEC têm potência extra acima de 5500 RPM. Permita que o motor aqueça antes de explorar altas rotações.',
        priority: 'media',
      },
      {
        id: 'honda-oleo-1',
        category: 'manutencao',
        title: 'Óleo 0W20',
        description: 'Motores Honda modernos requerem óleo 0W20 para máxima eficiência e proteção.',
        priority: 'alta',
      },
    ],
    knownIssues: [
      {
        id: 'honda-issue-1',
        title: 'Consumo de óleo',
        description: 'Alguns motores i-VTEC podem consumir óleo em altas quilometragens. Verifique o nível regularmente.',
        symptoms: ['Nível de óleo baixando', 'Fumaça azulada na aceleração'],
        affectedYears: '2012-2016',
        severity: 'info',
      },
    ],
    characteristics: 'Motores de alta rotação e durabilidade lendária. Sistema VTEC oferece potência em altas RPM. Manutenção simples e confiável.',
  },
  fiat: {
    brand: 'fiat',
    displayName: 'Fiat',
    slogan: 'Driven by Passion',
    colors: {
      primary: '352 74% 41%', // Vermelho Fiat #B81E2D
      accent: '0 0% 100%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6000,
      normalTempRange: [85, 105],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 12,
      shiftPointEco: 0.4,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'fiat-correia-1',
        category: 'manutencao',
        title: 'Correia dentada',
        description: 'Troque a correia dentada a cada 50.000 km. Motores Fire são interferentes - correia rompida pode causar danos graves.',
        priority: 'alta',
      },
      {
        id: 'fiat-aquece-1',
        category: 'desempenho',
        title: 'Aquecimento do motor',
        description: 'Motores Fiat aquecem rapidamente. Não force o motor nos primeiros 3 minutos.',
        priority: 'media',
      },
    ],
    knownIssues: [
      {
        id: 'fiat-issue-1',
        title: 'Sensor de temperatura',
        description: 'O sensor de temperatura do motor Fire pode falhar dando leituras erráticas.',
        symptoms: ['Temperatura oscilante no painel', 'Ventoinha não liga'],
        severity: 'warning',
      },
      {
        id: 'fiat-issue-2',
        title: 'Corpo de borboleta',
        description: 'O corpo de borboleta pode precisar de limpeza a cada 30.000 km.',
        symptoms: ['Marcha lenta irregular', 'Dificuldade na partida'],
        severity: 'info',
      },
    ],
    characteristics: 'Veículos compactos e ágeis. Motores Fire são simples e de fácil manutenção. Peças acessíveis no Brasil. Ideais para cidade.',
  },
  toyota: {
    brand: 'toyota',
    displayName: 'Toyota',
    slogan: "Let's Go Places",
    colors: {
      primary: '0 92% 48%', // Vermelho Toyota #EB0A1E
      accent: '0 0% 50%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [80, 95],
      normalVoltageRange: [13.8, 14.4],
      fuelTrimTolerance: 6,
      shiftPointEco: 0.35,
      shiftPointSport: 0.8,
    },
    tips: [
      {
        id: 'toyota-durabilidade-1',
        category: 'manutencao',
        title: 'Manutenção preventiva',
        description: 'Siga o plano de manutenção Toyota. Motores são extremamente duráveis quando bem cuidados.',
        priority: 'media',
      },
      {
        id: 'toyota-hibrido-1',
        category: 'economia',
        title: 'Direção econômica',
        description: 'Modelos híbridos aproveitam melhor a frenagem regenerativa. Antecipe frenagens para recuperar energia.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'toyota-issue-1',
        title: 'Bomba d\'água',
        description: 'A bomba d\'água pode precisar de troca preventiva em alta quilometragem.',
        symptoms: ['Vazamento de água', 'Ruído de rolamento'],
        affectedYears: '2010-2015',
        severity: 'info',
      },
    ],
    characteristics: 'Lendária confiabilidade japonesa. Motores duráveis que rodam milhares de km. Sistema híbrido eficiente. Manutenção previsível.',
  },
  hyundai: {
    brand: 'hyundai',
    displayName: 'Hyundai',
    slogan: 'New Thinking. New Possibilities.',
    colors: {
      primary: '212 100% 19%', // Azul marinho #002C5F
      accent: '195 85% 45%', // Azul claro secundário
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [85, 100],
      normalVoltageRange: [13.6, 14.4],
      fuelTrimTolerance: 8,
      shiftPointEco: 0.38,
      shiftPointSport: 0.88,
    },
    tips: [
      {
        id: 'hyundai-garantia-1',
        category: 'manutencao',
        title: 'Garantia de 5 anos',
        description: 'Mantenha revisões em dia na rede autorizada para preservar a garantia estendida. Hyundai oferece uma das melhores coberturas do mercado.',
        priority: 'alta',
      },
      {
        id: 'hyundai-turbo-1',
        category: 'desempenho',
        title: 'Motor Turbo GDI',
        description: 'Motores turbo GDI precisam de óleo sintético 5W30 de qualidade. Evite acelerações bruscas com motor frio.',
        priority: 'alta',
      },
      {
        id: 'hyundai-smartsense-1',
        category: 'seguranca',
        title: 'Hyundai SmartSense',
        description: 'Calibre os sensores ADAS após trocar para-brisa ou realizar alinhamento. Sistema requer recalibração profissional.',
        priority: 'media',
      },
      {
        id: 'hyundai-bluelink-1',
        category: 'conectividade',
        title: 'Bluelink',
        description: 'Use o app Bluelink para monitorar o veículo remotamente, pré-climatizar e localizar em estacionamentos.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'hyundai-issue-1',
        title: 'Motor Theta II GDI',
        description: 'Alguns motores Theta II podem apresentar consumo de óleo elevado. Verifique o nível a cada 1.000 km.',
        symptoms: ['Consumo de óleo elevado', 'Ruído no motor', 'Luz de óleo acendendo'],
        affectedYears: '2011-2019',
        severity: 'warning',
      },
      {
        id: 'hyundai-issue-2',
        title: 'Sensor de detonação',
        description: 'Use combustível de qualidade para evitar problemas com sensor de detonação em motores GDI.',
        symptoms: ['Luz de motor acesa', 'Perda de potência', 'Ruído metálico'],
        severity: 'info',
      },
      {
        id: 'hyundai-issue-3',
        title: 'Câmbio DCT',
        description: 'Câmbio de dupla embreagem pode apresentar trancos em baixa velocidade. Atualize o software na concessionária.',
        symptoms: ['Trancos ao arrancar', 'Hesitação em baixa velocidade'],
        affectedYears: '2016-2021',
        severity: 'warning',
      },
    ],
    characteristics: 'Veículos coreanos modernos com excelente custo-benefício. Garantia de 5 anos líder de mercado. Motores GDI turbo eficientes. Tecnologia SmartSense e conectividade Bluelink. Design arrojado e esportivo.',
  },
  kia: {
    brand: 'kia',
    displayName: 'Kia',
    slogan: 'Movement that Inspires',
    colors: {
      primary: '352 85% 45%', // Vermelho Kia
      accent: '0 0% 20%', // Preto
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [85, 100],
      normalVoltageRange: [13.6, 14.4],
      fuelTrimTolerance: 8,
      shiftPointEco: 0.38,
      shiftPointSport: 0.88,
    },
    tips: [
      {
        id: 'kia-garantia-1',
        category: 'manutencao',
        title: 'Garantia de 7 anos',
        description: 'Kia oferece garantia de até 7 anos ou 150.000 km. Mantenha o histórico de revisões para usufruir da cobertura completa.',
        priority: 'alta',
      },
      {
        id: 'kia-turbo-1',
        category: 'desempenho',
        title: 'Motor T-GDI',
        description: 'Motores turbo T-GDI são potentes e econômicos. Use gasolina aditivada para manter os injetores limpos.',
        priority: 'media',
      },
      {
        id: 'kia-uvo-1',
        category: 'conectividade',
        title: 'UVO Connect',
        description: 'O sistema UVO oferece navegação online, comandos de voz e integração com smartphones. Mantenha o software atualizado.',
        priority: 'baixa',
      },
      {
        id: 'kia-eco-1',
        category: 'economia',
        title: 'Modo ECO/Sport',
        description: 'Alterne entre modos de condução conforme necessidade. Modo ECO pode economizar até 15% de combustível em cidade.',
        priority: 'media',
      },
    ],
    knownIssues: [
      {
        id: 'kia-issue-1',
        title: 'Motor Theta II',
        description: 'Similar ao Hyundai, alguns motores Theta II podem ter consumo de óleo. Recall disponível para alguns modelos.',
        symptoms: ['Consumo de óleo', 'Ruído de biela', 'Motor travando'],
        affectedYears: '2011-2019',
        severity: 'critical',
      },
      {
        id: 'kia-issue-2',
        title: 'Bomba de combustível GDI',
        description: 'A bomba de alta pressão pode apresentar falhas em motores GDI mais antigos.',
        symptoms: ['Dificuldade de partida', 'Falhas em aceleração', 'Perda de potência'],
        affectedYears: '2012-2017',
        severity: 'warning',
      },
      {
        id: 'kia-issue-3',
        title: 'Sistema Start-Stop',
        description: 'Bateria AGM específica requerida. Bateria comum causa falhas no sistema.',
        symptoms: ['Start-Stop não funciona', 'Bateria descarregando'],
        severity: 'info',
      },
    ],
    characteristics: 'Design premiado e inovador. Garantia líder de 7 anos. Compartilha plataformas com Hyundai, tecnologia equivalente. Excelente custo-benefício e acabamento refinado.',
  },
  renault: {
    brand: 'renault',
    displayName: 'Renault',
    slogan: 'Passion for Life',
    colors: {
      primary: '48 100% 50%', // Amarelo #FFCC00
      accent: '0 0% 20%',
      primaryForeground: '0 0% 10%',
    },
    specs: {
      typicalRedlineRPM: 6000,
      normalTempRange: [85, 100],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 10,
      shiftPointEco: 0.4,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'renault-eletrica-1',
        category: 'manutencao',
        title: 'Sistema elétrico',
        description: 'Verifique conexões elétricas periodicamente. Renault tem sistemas eletrônicos sensíveis.',
        priority: 'media',
      },
      {
        id: 'renault-turbo-1',
        category: 'combustivel',
        title: 'Combustível para turbo',
        description: 'Motores turbo TCe funcionam melhor com gasolina aditivada.',
        priority: 'media',
      },
    ],
    knownIssues: [
      {
        id: 'renault-issue-1',
        title: 'Sonda lambda',
        description: 'A sonda lambda pode apresentar falhas prematuras em alguns modelos.',
        symptoms: ['Consumo elevado', 'Luz de motor acesa'],
        severity: 'warning',
      },
    ],
    characteristics: 'Design europeu e conforto. Motores turbo TCe eficientes. Sistemas multimídia avançados. Suspensão confortável.',
  },
  nissan: {
    brand: 'nissan',
    displayName: 'Nissan',
    slogan: 'Innovation that Excites',
    colors: {
      primary: '352 100% 45%', // Vermelho Nissan
      accent: '0 0% 85%', // Prata
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [82, 98],
      normalVoltageRange: [13.5, 14.4],
      fuelTrimTolerance: 8,
      shiftPointEco: 0.38,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'nissan-cvt-1',
        category: 'manutencao',
        title: 'Câmbio CVT Xtronic',
        description: 'Troque o fluido do CVT a cada 40.000 km. Use apenas NS-3 original para garantir durabilidade máxima.',
        priority: 'alta',
      },
      {
        id: 'nissan-eco-1',
        category: 'economia',
        title: 'Modo ECO',
        description: 'O modo ECO ajusta acelerador e ar-condicionado para máxima economia. Ideal para trânsito urbano.',
        priority: 'media',
      },
      {
        id: 'nissan-safety-1',
        category: 'seguranca',
        title: 'Nissan Safety Shield',
        description: 'Mantenha para-brisa limpo e sensores livres de obstrução para funcionamento correto do sistema.',
        priority: 'media',
      },
      {
        id: 'nissan-turbo-1',
        category: 'desempenho',
        title: 'Motor VC-Turbo',
        description: 'Motores VC-Turbo ajustam taxa de compressão automaticamente. Gasolina premium recomendada para máximo desempenho.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'nissan-issue-1',
        title: 'Transmissão CVT Jatco',
        description: 'CVTs mais antigos podem apresentar desgaste prematuro. Troque o fluido regularmente e evite acelerações bruscas.',
        symptoms: ['Patinação em subida', 'Ruído de correia', 'Trancos em aceleração', 'Hesitação ao arrancar'],
        affectedYears: '2010-2017',
        severity: 'warning',
      },
      {
        id: 'nissan-issue-2',
        title: 'Sensor de posição do acelerador',
        description: 'O sensor pode causar hesitação ou resposta irregular do acelerador.',
        symptoms: ['Acelerador travando', 'Resposta irregular', 'Luz de motor acesa'],
        severity: 'info',
      },
      {
        id: 'nissan-issue-3',
        title: 'Corrente de distribuição',
        description: 'Alguns motores VQ podem ter desgaste prematuro da corrente em alta quilometragem.',
        symptoms: ['Ruído metálico ao ligar', 'Luz de motor', 'Motor falhando'],
        affectedYears: '2008-2015',
        severity: 'warning',
      },
    ],
    characteristics: 'Inovação japonesa com CVT Xtronic suave e eficiente. Tecnologia ProPILOT para condução semi-autônoma. Motores VC-Turbo com compressão variável. Confiabilidade japonesa com design moderno.',
  },
  mitsubishi: {
    brand: 'mitsubishi',
    displayName: 'Mitsubishi',
    slogan: 'Drive your Ambition',
    colors: {
      primary: '352 100% 45%', // Vermelho Mitsubishi
      accent: '0 0% 20%', // Preto
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [82, 100],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 10,
      shiftPointEco: 0.4,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'mitsu-4wd-1',
        category: 'desempenho',
        title: 'Sistema Super Select 4WD',
        description: 'Use 4H para estradas de terra e 4HLc para trilhas. Em asfalto seco, mantenha em 2H para economia.',
        priority: 'alta',
      },
      {
        id: 'mitsu-diesel-1',
        category: 'manutencao',
        title: 'Motor Diesel 2.4',
        description: 'Troque filtro de combustível a cada 20.000 km. Use diesel S10 para melhor desempenho e longevidade.',
        priority: 'alta',
      },
      {
        id: 'mitsu-cvt-1',
        category: 'manutencao',
        title: 'CVT Jatco',
        description: 'Troque o fluido CVT a cada 40.000 km. Evite reboque pesado com CVT.',
        priority: 'media',
      },
      {
        id: 'mitsu-eco-1',
        category: 'economia',
        title: 'Direção econômica',
        description: 'Motores MIVEC são mais eficientes entre 2000-3500 RPM. Evite ultrapassar 3000 RPM em uso normal.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'mitsu-issue-1',
        title: 'Válvula EGR (Diesel)',
        description: 'A válvula EGR pode acumular fuligem e causar perda de potência em motores diesel.',
        symptoms: ['Perda de potência', 'Fumaça preta', 'Luz de motor acesa', 'Consumo elevado'],
        affectedYears: '2015-2020',
        severity: 'warning',
      },
      {
        id: 'mitsu-issue-2',
        title: 'DPF (Filtro de Partículas)',
        description: 'O DPF pode entupir em uso exclusivamente urbano. Faça viagens longas periodicamente para regeneração.',
        symptoms: ['Luz DPF acesa', 'Perda de potência', 'Modo de emergência'],
        severity: 'warning',
      },
      {
        id: 'mitsu-issue-3',
        title: 'Sensor de temperatura do ar',
        description: 'O sensor MAF/IAT pode apresentar leituras incorretas após longos períodos.',
        symptoms: ['Consumo elevado', 'Marcha lenta irregular', 'Perda de potência'],
        severity: 'info',
      },
    ],
    characteristics: 'Tradição japonesa em 4x4 e off-road. Sistema Super Select versátil. Motores diesel robustos e confiáveis. Picapes e SUVs resistentes para trabalho pesado. Tecnologia MIVEC para eficiência.',
  },
  jeep: {
    brand: 'jeep',
    displayName: 'Jeep',
    slogan: 'Go Anywhere. Do Anything.',
    colors: {
      primary: '80 50% 30%', // Verde oliva militar
      accent: '0 0% 20%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [85, 105],
      normalVoltageRange: [13.5, 14.5],
      fuelTrimTolerance: 12,
      shiftPointEco: 0.4,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'jeep-4x4-1',
        category: 'desempenho',
        title: 'Sistema 4x4',
        description: 'Após uso off-road, verifique e limpe o chassi. Sistema 4x4 precisa de fluido trocado a cada 60.000 km.',
        priority: 'media',
      },
      {
        id: 'jeep-pneu-1',
        category: 'seguranca',
        title: 'Pneus off-road',
        description: 'Pneus AT ou MT consomem mais combustível em asfalto. Calibre corretamente para cada terreno.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'jeep-issue-1',
        title: 'Consumo elevado',
        description: 'SUVs Jeep têm consumo naturalmente mais alto. Normal para a categoria.',
        symptoms: ['Consumo acima de 8-10 km/l na cidade'],
        severity: 'info',
      },
    ],
    characteristics: 'Capacidade off-road lendária. Robustez para aventuras. Sistema 4x4 capaz. Design icônico.',
  },
  bmw: {
    brand: 'bmw',
    displayName: 'BMW',
    slogan: 'The Ultimate Driving Machine',
    colors: {
      primary: '210 100% 30%', // Azul BMW
      accent: '0 0% 90%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 7000,
      normalTempRange: [85, 105],
      normalVoltageRange: [13.8, 14.4],
      fuelTrimTolerance: 6,
      shiftPointEco: 0.35,
      shiftPointSport: 0.9,
    },
    tips: [
      {
        id: 'bmw-manut-1',
        category: 'manutencao',
        title: 'Manutenção premium',
        description: 'Use apenas peças e fluidos originais ou equivalentes de alta qualidade. Motores BMW são exigentes.',
        priority: 'alta',
      },
      {
        id: 'bmw-turbo-1',
        category: 'desempenho',
        title: 'Aquecimento turbo',
        description: 'Deixe o motor aquecer 2-3 minutos antes de acelerar forte. Após viagem longa, deixe em marcha lenta 30 segundos antes de desligar.',
        priority: 'alta',
      },
    ],
    knownIssues: [
      {
        id: 'bmw-issue-1',
        title: 'Vazamento de óleo',
        description: 'Juntas e retentores podem ressecar com idade. Verifique regularmente.',
        symptoms: ['Manchas de óleo no chão', 'Cheiro de óleo queimado'],
        severity: 'warning',
      },
      {
        id: 'bmw-issue-2',
        title: 'Sistema de arrefecimento',
        description: 'Componentes plásticos do sistema podem falhar com idade.',
        symptoms: ['Vazamento de água', 'Superaquecimento'],
        severity: 'warning',
      },
    ],
    characteristics: 'Engenharia alemã premium. Motores potentes e responsivos. Dinâmica de condução esportiva. Manutenção requer atenção e qualidade.',
  },
  mercedes: {
    brand: 'mercedes',
    displayName: 'Mercedes-Benz',
    slogan: 'The Best or Nothing',
    colors: {
      primary: '0 0% 15%', // Preto elegante
      accent: '0 0% 75%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6500,
      normalTempRange: [80, 100],
      normalVoltageRange: [13.8, 14.4],
      fuelTrimTolerance: 6,
      shiftPointEco: 0.35,
      shiftPointSport: 0.85,
    },
    tips: [
      {
        id: 'merc-oleo-1',
        category: 'manutencao',
        title: 'Óleo aprovado MB',
        description: 'Use apenas óleos com aprovação Mercedes-Benz (MB 229.5 ou superior).',
        priority: 'alta',
      },
      {
        id: 'merc-conforto-1',
        category: 'economia',
        title: 'Modo Comfort',
        description: 'O modo Comfort oferece melhor economia. Modo Sport consome significativamente mais.',
        priority: 'baixa',
      },
    ],
    knownIssues: [
      {
        id: 'merc-issue-1',
        title: 'Suspensão a ar',
        description: 'Modelos com suspensão a ar podem precisar de manutenção do sistema após anos de uso.',
        symptoms: ['Carro baixando quando estacionado', 'Compressor trabalhando muito'],
        severity: 'warning',
      },
    ],
    characteristics: 'Luxo e refinamento alemão. Conforto excepcional. Tecnologia de segurança avançada. Manutenção premium obrigatória.',
  },
  audi: {
    brand: 'audi',
    displayName: 'Audi',
    slogan: 'Vorsprung durch Technik',
    colors: {
      primary: '0 0% 15%', // Preto
      accent: '0 100% 50%',
      primaryForeground: '0 0% 100%',
    },
    specs: {
      typicalRedlineRPM: 6800,
      normalTempRange: [85, 105],
      normalVoltageRange: [13.8, 14.4],
      fuelTrimTolerance: 6,
      shiftPointEco: 0.35,
      shiftPointSport: 0.9,
    },
    tips: [
      {
        id: 'audi-quattro-1',
        category: 'desempenho',
        title: 'Sistema Quattro',
        description: 'A tração Quattro oferece aderência excepcional. Aproveite em piso molhado ou terra.',
        priority: 'media',
      },
      {
        id: 'audi-dsg-1',
        category: 'manutencao',
        title: 'Câmbio S-Tronic',
        description: 'Troque o óleo do câmbio S-Tronic (DSG) a cada 60.000 km na rede autorizada.',
        priority: 'alta',
      },
    ],
    knownIssues: [
      {
        id: 'audi-issue-1',
        title: 'Consumo de óleo',
        description: 'Motores TFSI podem consumir óleo dentro da especificação (até 1L/1000km). Verifique nível a cada 1000 km.',
        symptoms: ['Nível de óleo baixando'],
        severity: 'info',
      },
    ],
    characteristics: 'Tecnologia alemã avançada. Tração Quattro lendária. Motores TFSI potentes e eficientes. Interior premium e tecnológico.',
  },
  generic: {
    brand: 'generic',
    displayName: 'Veículo',
    slogan: 'Scanner Universal OBD-II',
    colors: {
      primary: '142 76% 45%', // Verde padrão do app
      accent: '199 89% 48%',
      primaryForeground: '222 47% 11%',
    },
    specs: defaultSpecs,
    tips: [
      {
        id: 'gen-manut-1',
        category: 'manutencao',
        title: 'Manutenção regular',
        description: 'Siga o plano de manutenção do fabricante. Troque óleo a cada 10.000 km ou 1 ano.',
        priority: 'media',
      },
      {
        id: 'gen-eco-1',
        category: 'economia',
        title: 'Direção econômica',
        description: 'Mantenha rotações entre 2000-3000 RPM para melhor economia de combustível.',
        priority: 'baixa',
      },
    ],
    knownIssues: [],
    characteristics: 'Veículo genérico. Seguindo recomendações universais de manutenção e cuidados.',
  },
};

// Mapeamento WMI para marcas
const WMI_TO_BRAND: Record<string, VehicleBrand> = {
  // Volkswagen
  '9BW': 'volkswagen', '93W': 'volkswagen', '3VW': 'volkswagen', 
  'WVW': 'volkswagen', 'WV1': 'volkswagen', 'WV2': 'volkswagen',
  'WV3': 'volkswagen', 'AAV': 'volkswagen',
  
  // Audi (parte do grupo VW)
  'WAU': 'audi', 'WUA': 'audi', 'TRU': 'audi', '93V': 'audi',
  
  // Ford
  '9BF': 'ford', '1FA': 'ford', '1FB': 'ford', '1FC': 'ford',
  '1FD': 'ford', '1FM': 'ford', '1FT': 'ford', '3FA': 'ford',
  'WF0': 'ford', '6FP': 'ford', 'NM0': 'ford',
  
  // GM/Chevrolet
  '9BG': 'chevrolet', '1G1': 'chevrolet', '1G2': 'chevrolet',
  '1G4': 'chevrolet', '1G6': 'chevrolet', '1GC': 'chevrolet',
  '1GT': 'chevrolet', '3G1': 'chevrolet', '8AG': 'chevrolet',
  
  // Honda
  '93H': 'honda', 'JHM': 'honda', '1HG': 'honda', '2HG': 'honda',
  '5FN': 'honda', '5J6': 'honda', 'MLH': 'honda',
  
  // Fiat
  '9BD': 'fiat', 'ZFA': 'fiat', 'ZAR': 'fiat', 'ZFF': 'fiat',
  'ZLA': 'fiat', 'ZAM': 'fiat',
  
  // Toyota
  '9BR': 'toyota', 'JT2': 'toyota', 'JT3': 'toyota', 'JTE': 'toyota',
  '4T1': 'toyota', '4T3': 'toyota', '2T1': 'toyota', 'MR0': 'toyota',
  'JTD': 'toyota', 'JTN': 'toyota', 'JTM': 'toyota',
  
  // Hyundai
  'KMH': 'hyundai', '5NP': 'hyundai', '2HM': 'hyundai',
  'KMF': 'hyundai', 'MAL': 'hyundai', '5XY': 'hyundai',
  
  // Kia
  'KNA': 'kia', 'KND': 'kia', 'KNE': 'kia', '5XX': 'kia',
  'U5Y': 'kia', '3KP': 'kia',
  
  // Renault
  '93Y': 'renault', 'VF1': 'renault', 'VF2': 'renault',
  'KNM': 'renault',
  
  // Nissan
  '94D': 'nissan', 'JN1': 'nissan', '1N4': 'nissan', '1N6': 'nissan',
  '3N1': 'nissan', '5N1': 'nissan', 'JN8': 'nissan', 'SJN': 'nissan',
  
  // Mitsubishi
  'JA3': 'mitsubishi', 'JA4': 'mitsubishi', 'JA7': 'mitsubishi',
  'JMB': 'mitsubishi', 'JMY': 'mitsubishi', 'JMZ': 'mitsubishi',
  'MMB': 'mitsubishi', 'MMC': 'mitsubishi', 'MMT': 'mitsubishi',
  '4A3': 'mitsubishi', '6MM': 'mitsubishi',
  
  // Jeep
  '1J4': 'jeep', '1J8': 'jeep', '1C4': 'jeep', 'WK2': 'jeep',
  
  // BMW
  'WBA': 'bmw', 'WBS': 'bmw', 'WBY': 'bmw', '5UX': 'bmw',
  
  // Mercedes-Benz
  'WDB': 'mercedes', 'WDC': 'mercedes', 'WDD': 'mercedes',
  'WDF': 'mercedes', '4JG': 'mercedes', 'WMX': 'mercedes',
};

/**
 * Detecta a marca do veículo baseado no VIN
 */
export function detectBrandFromVIN(vin: string): VehicleBrand {
  if (!vin || vin.length < 3) return 'generic';
  
  const wmi = vin.substring(0, 3).toUpperCase();
  
  // Busca exata
  if (WMI_TO_BRAND[wmi]) {
    return WMI_TO_BRAND[wmi];
  }
  
  // Busca por prefixo de 2 caracteres
  const prefix2 = wmi.substring(0, 2);
  for (const [key, brand] of Object.entries(WMI_TO_BRAND)) {
    if (key.startsWith(prefix2)) {
      return brand;
    }
  }
  
  return 'generic';
}

/**
 * Obtém o perfil completo do veículo
 */
export function getVehicleProfile(brand: VehicleBrand): VehicleProfile {
  return VEHICLE_PROFILES[brand] || VEHICLE_PROFILES.generic;
}

/**
 * Detecta e retorna informações completas do veículo
 */
export function detectVehicle(vin: string | null, manufacturer?: string, modelYear?: string, country?: string): DetectedVehicle {
  const brand = vin ? detectBrandFromVIN(vin) : 'generic';
  const profile = getVehicleProfile(brand);
  
  return {
    vin,
    brand,
    manufacturer: manufacturer || profile.displayName,
    modelYear: modelYear || null,
    country: country || null,
    profile,
  };
}

/**
 * Obtém características da marca para contexto do Jarvis
 */
export function getBrandCharacteristics(brand: VehicleBrand): string {
  const profile = getVehicleProfile(brand);
  return profile.characteristics;
}

/**
 * Obtém dica aleatória da marca
 */
export function getRandomBrandTip(brand: VehicleBrand): VehicleTip | null {
  const profile = getVehicleProfile(brand);
  if (profile.tips.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * profile.tips.length);
  return profile.tips[randomIndex];
}
