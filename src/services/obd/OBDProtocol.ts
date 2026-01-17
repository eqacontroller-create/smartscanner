// OBD-II Protocol Definitions
// Centraliza todos os PIDs, comandos e constantes do protocolo OBD-II

export interface PIDDefinition {
  pid: string;
  name: string;
  shortName: string;
  unit: string;
  bytes: 1 | 2;
  min: number;
  max: number;
  decode: (a: number, b?: number) => number;
}

// Dicionário de PIDs OBD-II Mode 01
export const OBD_PIDS: Record<string, PIDDefinition> = {
  RPM: {
    pid: '0C',
    name: 'Rotação do Motor',
    shortName: 'RPM',
    unit: 'RPM',
    bytes: 2,
    min: 0,
    max: 8000,
    decode: (a, b = 0) => Math.round((a * 256 + b) / 4),
  },
  SPEED: {
    pid: '0D',
    name: 'Velocidade do Veículo',
    shortName: 'Velocidade',
    unit: 'km/h',
    bytes: 1,
    min: 0,
    max: 220,
    decode: (a) => a,
  },
  COOLANT_TEMP: {
    pid: '05',
    name: 'Temperatura do Líquido de Arrefecimento',
    shortName: 'Temp. Motor',
    unit: '°C',
    bytes: 1,
    min: -40,
    max: 150,
    decode: (a) => a - 40,
  },
  ENGINE_LOAD: {
    pid: '04',
    name: 'Carga Calculada do Motor',
    shortName: 'Carga',
    unit: '%',
    bytes: 1,
    min: 0,
    max: 100,
    decode: (a) => Math.round(a * 100 / 255),
  },
  INTAKE_AIR_TEMP: {
    pid: '0F',
    name: 'Temperatura do Ar de Admissão',
    shortName: 'Temp. Ar',
    unit: '°C',
    bytes: 1,
    min: -40,
    max: 80,
    decode: (a) => a - 40,
  },
  THROTTLE_POSITION: {
    pid: '11',
    name: 'Posição da Borboleta',
    shortName: 'Borboleta',
    unit: '%',
    bytes: 1,
    min: 0,
    max: 100,
    decode: (a) => Math.round(a * 100 / 255),
  },
  MAF: {
    pid: '10',
    name: 'Fluxo de Ar MAF',
    shortName: 'MAF',
    unit: 'g/s',
    bytes: 2,
    min: 0,
    max: 500,
    decode: (a, b = 0) => Math.round((a * 256 + b) / 100 * 10) / 10,
  },
  MAP: {
    pid: '0B',
    name: 'Pressão do Coletor de Admissão',
    shortName: 'MAP',
    unit: 'kPa',
    bytes: 1,
    min: 0,
    max: 255,
    decode: (a) => a,
  },
  TIMING_ADVANCE: {
    pid: '0E',
    name: 'Avanço de Ignição',
    shortName: 'Avanço',
    unit: '°',
    bytes: 1,
    min: -64,
    max: 64,
    decode: (a) => Math.round(a / 2 - 64),
  },
  STFT_BANK1: {
    pid: '06',
    name: 'Correção de Combustível Curto Prazo (B1)',
    shortName: 'STFT B1',
    unit: '%',
    bytes: 1,
    min: -50,
    max: 50,
    decode: (a) => Math.round((a - 128) * 100 / 128),
  },
  LTFT_BANK1: {
    pid: '07',
    name: 'Correção de Combustível Longo Prazo (B1)',
    shortName: 'LTFT B1',
    unit: '%',
    bytes: 1,
    min: -50,
    max: 50,
    decode: (a) => Math.round((a - 128) * 100 / 128),
  },
  FUEL_LEVEL: {
    pid: '2F',
    name: 'Nível de Combustível',
    shortName: 'Combustível',
    unit: '%',
    bytes: 1,
    min: 0,
    max: 100,
    decode: (a) => Math.round(a * 100 / 255),
  },
  VOLTAGE: {
    pid: '42',
    name: 'Tensão da Bateria',
    shortName: 'Bateria',
    unit: 'V',
    bytes: 2,
    min: 0,
    max: 20,
    decode: (a, b = 0) => Math.round((a * 256 + b) / 1000 * 10) / 10,
  },
  // Sensor O2 para validação forense de combustível
  O2_SENSOR_B1S1: {
    pid: '14',
    name: 'Sensor O2 Banco 1 Sensor 1',
    shortName: 'O2 B1S1',
    unit: 'V',
    bytes: 2,
    min: 0,
    max: 1.275,
    // Byte A = voltagem (0-1.275V), Byte B = STFT associado (ignoramos aqui)
    decode: (a, _b = 0) => Math.round(a / 200 * 1000) / 1000,
  },
  // Sensor O2 Banco 1 Sensor 2 (após catalisador)
  O2_SENSOR_B1S2: {
    pid: '15',
    name: 'Sensor O2 Banco 1 Sensor 2',
    shortName: 'O2 B1S2',
    unit: 'V',
    bytes: 2,
    min: 0,
    max: 1.275,
    decode: (a, _b = 0) => Math.round(a / 200 * 1000) / 1000,
  },
};

// Comandos AT do ELM327
export const ELM327_COMMANDS = {
  RESET: 'AT Z',
  ECHO_OFF: 'AT E0',
  LINEFEED_OFF: 'AT L0',
  SPACES_OFF: 'AT S0',
  HEADERS_OFF: 'AT H0',
  HEADERS_ON: 'AT H1',
  AUTO_PROTOCOL: 'AT SP0',
  FAST_INIT: 'AT FI',
  SET_TIMEOUT: 'AT ST',
  READ_VIN: '0902',
  READ_DTC: '03',
  CLEAR_DTC: '04',
} as const;

// UUIDs do Bluetooth Low Energy para ELM327
export const BLUETOOTH_UUIDS = {
  SERVICE: '0000fff0-0000-1000-8000-00805f9b34fb',
  WRITE_CHAR: '0000fff2-0000-1000-8000-00805f9b34fb',
  NOTIFY_CHAR: '0000fff1-0000-1000-8000-00805f9b34fb',
} as const;

// Constantes de timing
export const OBD_TIMING = {
  POLLING_INTERVAL_MS: 600,
  COMMAND_DELAY_MS: 50,
  THROTTLE_IDLE_MS: 500,
  THROTTLE_NORMAL_MS: 200,
  THROTTLE_SPORT_MS: 100,
  SPORT_RPM_THRESHOLD: 4000,
  COMMAND_TIMEOUT_MS: 2500,
  INIT_TIMEOUT_MS: 6000,
  MAX_CONSECUTIVE_FAILURES: 5,
  AUTO_RECONNECT_DELAY_MS: 2000,
  MAX_AUTO_RECONNECT_ATTEMPTS: 3,
} as const;

// PIDs padrão para monitoramento contínuo
export const DEFAULT_MONITORING_PIDS = ['RPM', 'SPEED', 'COOLANT_TEMP', 'ENGINE_LOAD'] as const;

// Obter definição de PID por nome ou código
export function getPIDByName(name: string): PIDDefinition | undefined {
  return OBD_PIDS[name];
}

export function getPIDByCode(code: string): PIDDefinition | undefined {
  const upperCode = code.toUpperCase();
  return Object.values(OBD_PIDS).find(pid => pid.pid === upperCode);
}

// Construir comando OBD-II Mode 01
export function buildMode01Command(pidCode: string): string {
  return `01${pidCode.toUpperCase()}`;
}
