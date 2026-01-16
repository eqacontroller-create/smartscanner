# OBD-II Scanner com Jarvis AI - Knowledge Base

## 1. Visão Geral do Projeto

**Nome:** OBD-II Scanner com Jarvis AI  
**Tecnologias:** React 18, TypeScript, Tailwind CSS, Vite, Supabase Edge Functions  
**Propósito:** Aplicativo de diagnóstico automotivo via Bluetooth Low Energy (BLE) com assistente de voz inteligente

---

## 2. Arquitetura Principal

### Frontend (React + TypeScript)
- **Página principal:** `src/pages/Index.tsx`
- **Hooks customizados:** `src/hooks/`
- **Componentes de dashboard:** `src/components/dashboard/`
- **Componentes de mecânico:** `src/components/mechanic/`
- **Bibliotecas utilitárias:** `src/lib/`

### Backend (Supabase Edge Functions)
- **jarvis-ai:** IA conversacional com Gemini 3 Flash
- **explain-dtc:** Explicação de códigos de erro

---

## 3. Funcionalidades de Conexão Bluetooth

### Hook `useBluetooth.ts`

**Service UUID:** `0000fff0-0000-1000-8000-00805f9b34fb`

**Sensores monitorados em tempo real:**

| Sensor | PID OBD-II | Fórmula |
|--------|------------|---------|
| RPM | 010C | ((A * 256) + B) / 4 |
| Velocidade | 010D | A (km/h) |
| Temperatura | 0105 | A - 40 (Celsius) |
| Voltagem | 0142 | ((A * 256) + B) / 1000 (Volts) |
| Combustível | 012F | (A * 100) / 255 (%) |
| Carga Motor | 0104 | (A * 100) / 255 (%) |

**Comandos AT de inicialização:**
- `AT Z` - Reset do ELM327
- `AT E0` - Desativar echo
- `AT L0` - Desativar linefeeds
- `AT S0` - Desativar espaços
- `AT H0` - Desativar headers
- `AT SP0` - Auto protocolo

**Estabilidade:**
- Cada leitura de PID encapsulada em try/catch individual
- Delay de 50ms entre comandos
- Flag `isReadingRef` para evitar leituras sobrepostas
- Intervalo de polling: 600ms

---

## 4. Sistema Jarvis - Assistente de Voz

### Componentes do Jarvis

| Arquivo | Função |
|---------|--------|
| `useJarvis.ts` | Síntese de voz (TTS) com Web Speech API |
| `useJarvisAI.ts` | Integração com IA conversacional |
| `useVoiceRecognition.ts` | Reconhecimento de voz (STT) |
| `useJarvisSettings.ts` | Configurações persistentes no localStorage |

### Configurações Disponíveis (`JarvisSettings`)

```typescript
// Alertas
welcomeEnabled: boolean           // Boas-vindas ao conectar
highRpmAlertEnabled: boolean      // Alerta de motor frio + alta rotação
highTempAlertEnabled: boolean     // Alerta de superaquecimento
highTempThreshold: number         // Limite em Celsius (padrão: 100)
speedAlertEnabled: boolean        // Alerta de velocidade
speedLimit: number                // Limite km/h (padrão: 120)
lowVoltageAlertEnabled: boolean   // Alerta de bateria baixa
lowVoltageThreshold: number       // Limite volts (padrão: 12.5)
maintenanceAlertEnabled: boolean  // Lembretes de manutenção
currentMileage: number            // Quilometragem atual
nextOilChange: number             // Próxima troca de óleo
nextInspection: number            // Próxima revisão

// IA Conversacional
aiModeEnabled: boolean            // Ativar modo IA
aiResponseLength: 'short' | 'medium' | 'detailed'
continuousListening: boolean      // Escuta contínua
wakeWord: string                  // Palavra de ativação (padrão: "jarvis")

// Configurações de Voz
volume: number                    // 0.0 a 1.0
rate: number                      // 0.5 a 2.0 (velocidade)
pitch: number                     // 0.5 a 2.0 (tom)
selectedVoiceURI: string | null   // Voz selecionada
```

### Alertas Automáticos

| Alerta | Condição | Cooldown |
|--------|----------|----------|
| Boas-vindas | Ao conectar | Único |
| Pé Pesado | RPM > 2500 com motor frio (< 60°C) | 30s |
| Superaquecimento | Temperatura > limite configurado | 60s |
| Velocidade | Velocidade > limite configurado | 30s |
| Bateria Baixa | Voltagem < 12.5V | 60s |

---

## 5. Edge Function jarvis-ai

### Contexto do Veículo Enviado

```typescript
interface VehicleContext {
  rpm: number | null;
  speed: number | null;
  temperature: number | null;
  voltage: number | null;
  fuelLevel: number | null;
  engineLoad: number | null;
  isConnected: boolean;
  isPolling: boolean;
}
```

### Configuração do Modelo de IA

- **Provedor:** Lovable AI Gateway
- **Modelo:** google/gemini-3-flash-preview
- **Max Tokens:** 150
- **Temperatura:** 0.7

### Capacidades do Jarvis

- Informar dados do veículo em tempo real
- Explicar situações do motor
- Alertar sobre problemas (bateria, temperatura, combustível)
- Dicas de economia e manutenção
- Análise do sistema elétrico
- Respostas personalizadas conforme tamanho configurado

---

## 6. Scanner de Códigos de Erro (DTC)

### Componente `DTCScanner.tsx`

**Protocolos suportados:**
- OBD-II Modo 03 (códigos de emissão)
- UDS Serviço 19 02 (diagnóstico avançado)

### Módulos ECU Escaneados

| Módulo | Descrição |
|--------|-----------|
| ECM | Motor (Engine Control Module) |
| TCM | Transmissão (Transmission Control Module) |
| ABS | Freios Anti-travamento |
| SRS | Airbag (Supplemental Restraint System) |
| BCM | Carroceria (Body Control Module) |
| TPMS | Monitoramento de Pneus |
| HVAC | Climatização |
| IC | Painel de Instrumentos |

### Base de Dados de DTCs (`dtcDatabase.ts`)

- Mais de 50 códigos pré-cadastrados
- Severidade: `low`, `medium`, `high`
- Descrição em português
- Causas possíveis listadas

### Limpeza de Códigos

- OBD-II Modo 04: `04`
- UDS Clear: `14 FF FF FF`

---

## 7. Monitor de Dados ao Vivo

### Componente `LiveDataMonitor.tsx`

**PIDs Disponíveis:**

| PID | Nome | Unidade | Fórmula |
|-----|------|---------|---------|
| 0C | RPM | RPM | ((A×256)+B)/4 |
| 0D | Velocidade | km/h | A |
| 05 | Temp. Motor | °C | A-40 |
| 04 | Carga Motor | % | A×100/255 |
| 0F | Temp. Ar | °C | A-40 |
| 11 | Borboleta | % | A×100/255 |
| 10 | MAF | g/s | ((A×256)+B)/100 |
| 0B | MAP | kPa | A |
| 0E | Avanço | ° | A/2-64 |
| 06 | STFT B1 | % | (A-128)×100/128 |
| 07 | LTFT B1 | % | (A-128)×100/128 |
| 2F | Combustível | % | A×100/255 |
| 42 | Bateria | V | ((A×256)+B)/1000 |

### Funcionalidades

- Gráficos em tempo real (Recharts)
- Gravação de dados para análise
- Exportação para CSV
- Seleção de sensores ativos
- Histórico de valores

---

## 8. Decodificador de VIN

### Arquivo `vinDecoder.ts`

**Capacidades:**
- Suporte a mais de 120 fabricantes
- Detecção de país de origem
- Ano do modelo (2001-2030)

**Grupos de Fabricantes:**
- VAG (Volkswagen, Audi, Seat, Skoda)
- GM (Chevrolet, Buick, Cadillac, GMC)
- Ford (Ford, Lincoln, Mercury)
- Toyota (Toyota, Lexus, Scion)
- Honda (Honda, Acura)
- Hyundai (Hyundai, Kia, Genesis)
- Nissan (Nissan, Infiniti)
- FCA (Fiat, Chrysler, Jeep, Dodge, Ram)
- BMW (BMW, Mini, Rolls-Royce)
- Mercedes (Mercedes-Benz, Smart)

---

## 9. Componentes de Dashboard

| Componente | Função |
|------------|--------|
| `RPMGauge.tsx` | Gauge analógico de RPM estilo velocímetro |
| `RPMCard.tsx` | Card digital de RPM com status |
| `VehicleStats.tsx` | Cards de velocidade, temperatura, voltagem, combustível, carga |
| `StatusIndicator.tsx` | Indicador de status da conexão Bluetooth |
| `ConnectionButton.tsx` | Botão conectar/desconectar Bluetooth |
| `LogPanel.tsx` | Painel de logs de comunicação AT/OBD |
| `VehicleVIN.tsx` | Leitor e decodificador de VIN |
| `JarvisFloatingWidget.tsx` | Widget flutuante do assistente de voz |
| `JarvisSettingsSheet.tsx` | Painel lateral de configurações |
| `JarvisVoiceButton.tsx` | Botão de ativação por voz |
| `JarvisTestButton.tsx` | Botão de teste de áudio |

---

## 10. Componentes de Mecânico

| Componente | Função |
|------------|--------|
| `DTCScanner.tsx` | Scanner principal de códigos de erro |
| `DTCList.tsx` | Lista de DTCs encontrados |
| `DTCModal.tsx` | Modal com detalhes do código |
| `DTCAlertBanner.tsx` | Banner de alerta de erros |
| `LiveDataMonitor.tsx` | Monitor de dados em tempo real |
| `FreezeFrameData.tsx` | Dados de freeze frame |
| `ScanProgress.tsx` | Barra de progresso do scan |
| `ScanHistory.tsx` | Histórico de scans anteriores |
| `AllClearShield.tsx` | Indicador de "sem erros" |
| `OBDLimitations.tsx` | Informações sobre limitações |

---

## 11. Compatibilidade

### Adaptadores OBD-II Suportados

- ELM327 via Bluetooth Low Energy (BLE)
- Service UUID: `0000fff0-0000-1000-8000-00805f9b34fb`
- Write Characteristic: `0000fff2-0000-1000-8000-00805f9b34fb`
- Notify Characteristic: `0000fff1-0000-1000-8000-00805f9b34fb`

### Navegadores Suportados

| Navegador | Suporte |
|-----------|---------|
| Chrome (Desktop) | ✅ Completo |
| Chrome (Android) | ✅ Completo |
| Edge | ✅ Completo |
| Opera | ✅ Completo |
| Safari | ❌ Não suporta Web Bluetooth |
| Firefox | ❌ Não suporta Web Bluetooth |
| iOS (todos) | ❌ Não suporta Web Bluetooth |

---

## 12. Estrutura de Arquivos (ATUALIZADA)

```
src/
├── pages/
│   └── Index.tsx              # Página principal (~75 linhas, apenas orquestra)
├── services/                    # ⭐ NOVO - Camada de serviços puros
│   ├── obd/
│   │   ├── OBDParser.ts        # Parsing de respostas OBD-II (Mode 01, VIN)
│   │   └── OBDProtocol.ts      # Constantes, PIDs, UUIDs, timing, comandos AT
│   ├── supabase/
│   │   ├── ProfileService.ts   # CRUD de perfis de usuário
│   │   ├── RidesService.ts     # CRUD de corridas com sync real-time
│   │   ├── ScanHistoryService.ts # Histórico de scans DTC
│   │   └── VehicleService.ts   # CRUD de veículos por VIN
│   └── ai/
│       ├── JarvisService.ts    # Integração com IA Gemini via Edge Function
│       └── TTSService.ts       # Síntese de voz (Text-to-Speech)
├── hooks/
│   ├── useVehicleSession.ts    # ⭐ Hook composto (OBD + Theme + Auth + Rides + Benefits)
│   ├── useJarvisSystem.ts      # ⭐ Hook composto (Settings + TTS + AI)
│   ├── useRefuel.ts            # ⭐ Hook composto (Monitor + Settings)
│   ├── useOBD.ts               # Conexão BLE + leitura de sensores
│   ├── useJarvis.ts            # Síntese de voz (TTS)
│   ├── useJarvisAI.ts          # Integração com IA
│   ├── useJarvisSettings.ts    # Configurações persistentes
│   ├── useVoiceRecognition.ts  # Reconhecimento de voz (STT)
│   ├── useAutoRide.ts          # Detecção automática de corridas
│   ├── useTripCalculator.ts    # Cálculo de custos de viagem
│   ├── useRefuelMonitor.ts     # Monitor de abastecimento
│   ├── useRefuelSettings.ts    # Configurações de abastecimento
│   ├── useVehicleBenefits.ts   # Benefícios e dicas por marca
│   ├── useVehicleTheme.ts      # Tema dinâmico por marca
│   ├── useSyncedProfile.ts     # Sync de perfil com Supabase
│   ├── useSyncedRides.ts       # Sync de corridas com Supabase
│   ├── useSyncedSettings.ts    # Sync de configurações com Supabase
│   ├── useMaintenanceSchedule.ts # Alertas de manutenção
│   ├── useShiftLight.ts        # Luz de troca de marcha
│   ├── useAlerts.ts            # Sistema de alertas do Jarvis
│   └── useWakeLock.ts          # Manter tela ligada
├── components/
│   ├── dashboard/
│   │   ├── AppHeader.tsx       # ⭐ Header com veículo, sync, Jarvis controls
│   │   ├── AppFooter.tsx       # ⭐ Rodapé com branding
│   │   ├── ConnectionPanel.tsx # ⭐ Status de conexão e alertas
│   │   ├── MainTabs.tsx        # ⭐ Navegação principal por tabs
│   │   ├── FloatingControls.tsx # ⭐ Jarvis widget, modais de corrida/refuel
│   │   ├── TelemetrySection.tsx # ⭐ Gauge RPM e estatísticas
│   │   ├── ActionDock.tsx      # ⭐ Barra de ações (conectar, abastecer, settings)
│   │   ├── RPMGauge.tsx
│   │   ├── VehicleStats.tsx
│   │   ├── JarvisFloatingWidget.tsx
│   │   └── ...
│   ├── tabs/
│   │   ├── DashboardTab.tsx    # Conteúdo da aba Painel
│   │   ├── MechanicTab.tsx     # Conteúdo da aba Mecânica
│   │   ├── FinancialTab.tsx    # Conteúdo da aba Finanças
│   │   └── SettingsTab.tsx     # Conteúdo da aba Config
│   ├── mechanic/
│   │   ├── DTCScanner.tsx
│   │   ├── LiveDataMonitor.tsx
│   │   └── ...
│   ├── financial/
│   │   ├── TripMonitor.tsx
│   │   ├── TodayRides.tsx
│   │   ├── RideEndModal.tsx
│   │   └── ...
│   ├── refuel/
│   │   ├── RefuelModal.tsx
│   │   ├── FuelQualityMonitor.tsx
│   │   └── ...
│   └── ui/                    # Componentes shadcn/ui
├── lib/
│   ├── dtcDatabase.ts         # Base de códigos de erro
│   ├── dtcParser.ts           # Parser de respostas DTC
│   ├── vinDecoder.ts          # Decodificador de VIN
│   ├── vehicleProfiles.ts     # Perfis de veículos por marca
│   ├── liveDataParser.ts      # Parser de dados ao vivo
│   ├── ecuModules.ts          # Módulos ECU conhecidos
│   ├── freezeFrameParser.ts   # Parser de freeze frame
│   ├── scanHistory.ts         # Histórico de scans (localStorage)
│   └── logger.ts              # Sistema de logging condicional
├── types/
│   ├── jarvisSettings.ts      # Tipos de configuração do Jarvis
│   ├── tripSettings.ts        # Tipos de viagem e corridas
│   ├── refuelTypes.ts         # Tipos de abastecimento
│   ├── vehicleTypes.ts        # Tipos de veículos e benefícios
│   ├── maintenanceTypes.ts    # Tipos de manutenção
│   └── sessionContext.ts      # ⭐ Tipos unificados de contexto
├── contexts/
│   └── OBDContext.tsx         # Contexto React para OBD (usa Services)
└── integrations/
    └── supabase/
        ├── client.ts          # Cliente Supabase (auto-gerado)
        └── types.ts           # Tipos do banco (auto-gerado)

supabase/
└── functions/
    ├── jarvis-ai/             # IA conversacional
    │   └── index.ts
    └── explain-dtc/           # Explicação de DTCs
        └── index.ts
```

---

## 13. Regras de Desenvolvimento

### Bluetooth
- Sempre usar try/catch individual para cada leitura de PID
- Delay de 50ms entre comandos AT/OBD
- Timeout de 3 segundos por comando
- Verificar conexão antes de cada leitura

### Jarvis
- Respostas devem ser concisas (2-3 frases para modo 'short')
- Usar linguagem amigável e informal
- Referir-se ao usuário como "chefe" ou "parceiro"
- Evitar termos muito técnicos

### Alertas
- Respeitar cooldowns para evitar spam de voz
- Prioridade: Temperatura > Voltagem > Velocidade > RPM
- Mensagens claras e acionáveis

### Dashboard
- Cores de alerta: verde (normal), amarelo (atenção), vermelho (crítico)
- Atualização em tempo real sem flickering
- Valores "--" quando sem dados

### Polling
- Intervalo de 600ms entre ciclos de leitura
- Flag isReadingRef para evitar sobreposição
- Fallback gracioso para sensores não suportados

---

## 14. Banco de Dados (Supabase)

### Tabelas

**vehicles**
- `id`: UUID (PK)
- `vin`: VARCHAR (único)
- `manufacturer`: VARCHAR
- `manufacturer_group`: VARCHAR
- `model_year`: VARCHAR
- `country`: VARCHAR
- `created_at`, `updated_at`: TIMESTAMP

**dtc_scans**
- `id`: UUID (PK)
- `vehicle_id`: UUID (FK → vehicles)
- `vin`: VARCHAR
- `scan_date`: TIMESTAMP
- `total_dtcs`: INTEGER
- `modules_scanned`: INTEGER
- `scan_duration_ms`: INTEGER
- `notes`: TEXT

**dtc_findings**
- `id`: UUID (PK)
- `scan_id`: UUID (FK → dtc_scans)
- `dtc_code`: VARCHAR
- `module_id`: VARCHAR
- `module_name`: VARCHAR
- `raw_code`: VARCHAR
- `status_byte`: VARCHAR

**profiles**
- `id`: UUID (PK, FK → auth.users)
- Configurações do Jarvis, veículo, viagem, abastecimento

**rides**
- `id`: UUID (PK)
- `user_id`: UUID (FK)
- `start_time`, `end_time`: TIMESTAMP
- `distance`, `cost`, `profit`: NUMERIC

**trip_settings**
- `id`: UUID (PK)
- `user_id`: UUID (FK)
- Configurações de viagem e corrida automática

**refuel_entries**
- `id`: UUID (PK)
- `user_id`: UUID (FK)
- Dados de abastecimento e qualidade do combustível

---

## 15. Secrets e Variáveis de Ambiente

### Variáveis Automáticas (não editar)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Secrets para Edge Functions
- `LOVABLE_API_KEY` (auto-configurado para Lovable AI)

---

## 16. Fluxo de Uso Típico

1. **Conectar:** Usuário clica em "Conectar" → Seleciona dispositivo ELM327 → Inicialização AT
2. **Dashboard:** Jarvis dá boas-vindas → Dados começam a fluir → Alertas automáticos
3. **Mecânico:** Usuário abre aba "Mecânico" → Escaneia DTCs → Visualiza/limpa códigos
4. **Dados ao Vivo:** Monitor de PIDs selecionados → Gráficos em tempo real
5. **Jarvis:** Perguntas por voz → IA processa contexto → Resposta falada

---

## 17. Troubleshooting Comum

| Problema | Causa | Solução |
|----------|-------|---------|
| "Bluetooth não suportado" | Navegador incompatível | Usar Chrome/Edge |
| "Dispositivo não encontrado" | ELM327 desligado ou pareado | Verificar energia e pareamento |
| "NO DATA" em PIDs | Sensor não suportado | Normal para alguns veículos |
| Jarvis não responde | Microfone bloqueado | Permitir acesso ao microfone |
| Dados oscilando | Polling muito rápido | Aumentar intervalo |
| Bip e sai ao falar | Recognition reiniciando | Já corrigido com refs |

---

## 18. Arquitetura de Services (BLINDADO) ⭐

### Princípio: Services são Puros
Services não têm estado React. São funções puras que processam dados.

### `src/services/obd/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `OBDParser.ts` | Parsing de respostas OBD-II (Mode 01, VIN), limpeza, validação, decodificação |
| `OBDProtocol.ts` | Constantes: PIDs, UUIDs Bluetooth, timing, comandos AT, fórmulas de decodificação |

**Funções Exportadas (OBDParser):**
- `cleanResponse(response: string): string`
- `isErrorResponse(cleanedResponse: string): boolean`
- `parseOBDResponse(pidCode: string, response: string): ParseResult`
- `parseVINResponse(response: string): VINInfo | null`
- `getAllPIDs(): PIDDefinition[]`

**Constantes Exportadas (OBDProtocol):**
- `OBD_PIDS` - Definições de todos os PIDs
- `ELM327_COMMANDS` - Comandos AT
- `BLUETOOTH_UUIDS` - UUIDs de service/characteristic
- `OBD_TIMING` - Delays, timeouts, polling

### `src/services/supabase/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `ProfileService.ts` | CRUD de perfis de usuário (getById, upsert, update) |
| `RidesService.ts` | CRUD de corridas (getTodayRides, save, update, subscribe) |
| `ScanHistoryService.ts` | Histórico de scans DTC (saveScanResult, getByVIN, compareScanResults) |
| `VehicleService.ts` | CRUD de veículos (getByVIN, getOrCreate) |

### `src/services/ai/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `JarvisService.ts` | Integração com IA Gemini via Edge Function |
| `TTSService.ts` | Síntese de voz com Web Speech API |

---

## 19. Hooks Compostos (BLINDADO) ⭐

### Princípio: Hooks Compostos Agregam
Hooks compostos combinam múltiplos hooks primitivos para reduzir complexidade no Index.tsx.

| Hook | Hooks Agregados | Retorno Principal |
|------|-----------------|-------------------|
| `useVehicleSession` | useOBD, useVehicleTheme, useAuth, useSyncedRides, useVehicleBenefits | Sessão completa do veículo |
| `useJarvisSystem` | useJarvisSettings, useJarvis, useJarvisAI | Sistema de voz e IA unificado |
| `useRefuel` | useRefuelMonitor, useRefuelSettings | Auditoria de abastecimento |

### `useVehicleSession`
```typescript
interface UseVehicleSessionReturn {
  // OBD
  vehicleData: VehicleData;
  status: ConnectionStatus;
  isPolling: boolean;
  isConnected: boolean;
  logs: string[];
  connect: () => Promise<void>;
  disconnect: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  sendRawCommand: (cmd: string) => Promise<string>;
  
  // Theme
  themeVehicle: DetectedVehicle | null;
  currentProfile: VehicleProfile;
  
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  
  // Rides
  syncedRides: SyncedRidesReturn;
  
  // Benefits
  vehicleBenefits: VehicleBenefitsReturn;
}
```

### `useJarvisSystem`
```typescript
interface UseJarvisSystemReturn {
  // Settings
  settings: JarvisSettings;
  updateSetting: <K>(key: K, value: JarvisSettings[K]) => void;
  resetToDefaults: () => void;
  
  // TTS
  speak: (text: string) => Promise<void>;
  testAudio: () => void;
  isSpeaking: boolean;
  isTTSSupported: boolean;
  
  // AI
  isListening: boolean;
  isProcessing: boolean;
  isContinuousMode: boolean;
  toggleListening: () => void;
  conversationHistory: Message[];
  // ... demais campos AI
}
```

---

## 20. Componentes de Dashboard Refatorados (BLINDADO) ⭐

| Componente | Responsabilidade | Props Principais |
|------------|------------------|------------------|
| `AppHeader.tsx` | Header com veículo, sync status, Jarvis controls | themeVehicle, syncStatus, jarvisEnabled |
| `AppFooter.tsx` | Rodapé com branding | (nenhuma) |
| `ConnectionPanel.tsx` | Status de conexão, erros, botão conectar | status, error, isSupported, onConnect |
| `MainTabs.tsx` | Navegação por tabs (Painel, Mecânica, Finanças, Config) | value, onValueChange, vehicleData, session |
| `FloatingControls.tsx` | Jarvis widget, modais de corrida e abastecimento | isListening, autoRide, refuel, modals |
| `TelemetrySection.tsx` | Gauge RPM, estatísticas do veículo | vehicleData, redlineRPM, isPolling |
| `ActionDock.tsx` | Barra de ações (conectar, abastecer, settings) | isConnected, onConnect, onOpenRefuel |

---

## 21. Tipos Unificados de Contexto (BLINDADO) ⭐

### Arquivo: `src/types/sessionContext.ts`

| Interface | Propósito |
|-----------|-----------|
| `SessionContext` | Dados OBD + veículo + auth + ações |
| `JarvisContext` | Settings + TTS + AI conversacional |
| `TripContext` | Dados de viagem + ações |
| `AutoRideContext` | Corridas automáticas + daily summary |
| `RefuelContext` | Monitor + settings de abastecimento |
| `ModalsState` | Estado dos modais (settings, flowSelector, refuel) |

---

## 22. Regras de Arquitetura (NÃO MODIFICAR) 🔒

### 1. Services são Puros
- Sem estado React (useState, useEffect)
- Apenas funções que processam dados
- Podem ser testados isoladamente

### 2. Hooks Compostos Agregam
- Combinam múltiplos hooks primitivos
- Não duplicam lógica entre si
- Retornam interface unificada

### 3. Index.tsx é Maestro
- Apenas orquestra componentes e hooks
- Máximo ~100 linhas legíveis
- Não processa dados diretamente

### 4. Props Agrupadas
- Usar objetos de contexto quando possível
- Evitar explosão de props individuais
- Tipos definidos em `src/types/`

### 5. OBDContext usa Services
- Parsing via `OBDParser`
- Constantes via `OBDProtocol`
- Não duplicar lógica de parsing

### 6. Componentes de UI são Burros
- Recebem dados via props
- Não fazem fetch direto
- Chamam callbacks para ações

### 7. Separação de Concerns
- `services/` → Lógica de negócio pura
- `hooks/` → Estado React + side effects
- `components/` → Apresentação visual
- `types/` → Definições TypeScript
- `lib/` → Utilitários e databases

---

## 23. Arquivos Protegidos (NÃO EDITAR) 🔒

Os seguintes arquivos são auto-gerados ou críticos:

- `src/integrations/supabase/client.ts` (auto-gerado)
- `src/integrations/supabase/types.ts` (auto-gerado)
- `supabase/config.toml` (auto-gerado)
- `.env` (auto-gerado)
- `package.json` (usar lov-add-dependency)

---

## 24. Histórico de Refatoração

### Janeiro 2026 - Grande Refatoração de Arquitetura

**Objetivo:** Eliminar dívida técnica e preparar para escala.

**Mudanças Realizadas:**
1. Extração de Services puros (`OBDParser`, `OBDProtocol`, `ProfileService`, etc.)
2. Criação de Hooks Compostos (`useVehicleSession`, `useJarvisSystem`, `useRefuel`)
3. Refatoração do `Index.tsx` para ~75 linhas
4. Criação de Tipos Unificados (`SessionContext`, etc.)
5. Componentização do Dashboard (`AppHeader`, `ConnectionPanel`, `MainTabs`, etc.)
6. Documentação completa em `KNOWLEDGE.md`

**Resultado:** Código profissional, testável, manutenível e pronto para crescer.
