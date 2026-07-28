import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  ConnectivityConnection,
  ConnectivityFlow,
  ConnectivityFolder,
  ConnectivityMessageTrace,
  ConnectivitySchedule,
  ConnectivityLogEntry,
  ConnectivityGlobalVariable,
  ConnectivitySecret,
  ConnectivityMappingRule,
  ConnectionStatus,
  HealthIndicator,
} from '../types/connectivity';

const STORAGE_KEY = 'archestra_connectivity_store';

interface ConnectivityStoreState {
  folders: ConnectivityFolder[];
  connections: ConnectivityConnection[];
  flows: ConnectivityFlow[];
  messageTraces: ConnectivityMessageTrace[];
  schedules: ConnectivitySchedule[];
  logs: ConnectivityLogEntry[];
  globalVariables: ConnectivityGlobalVariable[];
  secrets: ConnectivitySecret[];
  mappingRules: ConnectivityMappingRule[];

  // Active Selections / UI state
  activeTab: string;
  selectedConnectionId: string | null;
  selectedFlowId: string | null;
  selectedTraceId: string | null;

  // Actions
  setActiveTab: (tab: string) => void;
  setSelectedConnectionId: (id: string | null) => void;
  setSelectedFlowId: (id: string | null) => void;
  setSelectedTraceId: (id: string | null) => void;

  // Connections CRUD
  addConnection: (conn: Omit<ConnectivityConnection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateConnection: (id: string, conn: Partial<ConnectivityConnection>) => void;
  deleteConnection: (id: string) => void;
  duplicateConnection: (id: string) => void;
  toggleFavoriteConnection: (id: string) => void;
  testConnection: (id: string) => Promise<{ status: ConnectionStatus; latencyMs: number; message: string }>;

  // Folders CRUD
  addFolder: (name: string, parentId?: string | null) => void;
  updateFolder: (id: string, folder: Partial<ConnectivityFolder>) => void;
  deleteFolder: (id: string) => void;
  moveFolder: (id: string, parentId: string | null) => void;
  moveFlowToFolder: (flowId: string, folderId: string | null) => void;

  // Flows CRUD
  addFlow: (flow: Omit<ConnectivityFlow, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFlow: (id: string, flow: Partial<ConnectivityFlow>) => void;
  deleteFlow: (id: string) => void;
  duplicateFlow: (id: string) => void;
  updateFlowNodesEdges: (id: string, nodes: any[], edges: any[]) => void;
  executeFlowSimulation: (id: string) => void;

  // Schedules CRUD
  addSchedule: (schedule: Omit<ConnectivitySchedule, 'id'>) => void;
  updateSchedule: (id: string, schedule: Partial<ConnectivitySchedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleScheduleStatus: (id: string) => void;
  triggerScheduleNow: (id: string) => void;

  // Global Variables CRUD
  addGlobalVariable: (variable: Omit<ConnectivityGlobalVariable, 'id' | 'updatedAt'>) => void;
  updateGlobalVariable: (id: string, variable: Partial<ConnectivityGlobalVariable>) => void;
  deleteGlobalVariable: (id: string) => void;

  // Secrets CRUD
  addSecret: (secret: Omit<ConnectivitySecret, 'id' | 'lastRotatedAt'>) => void;
  updateSecret: (id: string, secret: Partial<ConnectivitySecret>) => void;
  deleteSecret: (id: string) => void;
  rotateSecret: (id: string) => void;

  // Mapping Rules CRUD
  addMappingRule: (rule: Omit<ConnectivityMappingRule, 'id' | 'updatedAt'>) => void;
  updateMappingRule: (id: string, rule: Partial<ConnectivityMappingRule>) => void;
  deleteMappingRule: (id: string) => void;
  toggleMappingRule: (id: string) => void;

  // Reset & Seed Data
  resetToSeedData: () => void;
  exportStateJson: () => string;
  importStateJson: (jsonStr: string) => boolean;
}

// Helper to seed 27 realistic connection types
const getInitialConnections = (): ConnectivityConnection[] => [
  {
    id: 'conn-sql-server-prod',
    name: 'DB_SQLServer_Corporativo',
    type: 'SQL Server',
    category: 'Database',
    description: 'Banco de dados principal do ERP / MES em Microsoft SQL Server 2022',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 12).toISOString(),
    simulatedLatencyMs: 14,
    messagesProcessedCount: 3421900,
    msgPerSecond: 124.5,
    color: '#0284c7',
    icon: 'Database',
    tags: ['MSSQL', 'ERP', 'MES', 'Principal'],
    notes: 'Pooling configurado para 100 conexões simultâneas.',
    healthIndicator: 'Excellent',
    healthPercentage: 98,
    isFavorite: true,
    config: {
      host: 'sqlserver-cluster.internal.corp',
      port: 1433,
      database: 'Serrano_Production_DB',
      user: 'svc_orchestra_connect',
      encrypt: true,
      poolSize: 50,
      timeout: 30,
    },
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-oracle-sap',
    name: 'DB_Oracle_SAP_HANA',
    type: 'Oracle',
    category: 'Enterprise ERP',
    description: 'Conexão Oracle DB para integração com módulo de inventário SAP ERP',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 45).toISOString(),
    simulatedLatencyMs: 28,
    messagesProcessedCount: 1892000,
    msgPerSecond: 48.2,
    color: '#dc2626',
    icon: 'Database',
    tags: ['Oracle', 'SAP', 'Inventory', 'ERP'],
    notes: 'TNS Name configurado com Failover RAC.',
    healthIndicator: 'Good',
    healthPercentage: 92,
    isFavorite: true,
    config: {
      host: 'oracle-rac.prod.corp',
      port: 1521,
      sid: 'ORAPROD',
      user: 'SAP_READONLY',
      schema: 'SAPABAP1',
    },
    createdAt: '2026-01-12T11:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-postgres-historian',
    name: 'DB_PostgreSQL_Historian',
    type: 'PostgreSQL',
    category: 'Database',
    description: 'Banco relacional com extensão TimescaleDB para telemetria histórica',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 5).toISOString(),
    simulatedLatencyMs: 8,
    messagesProcessedCount: 9840120,
    msgPerSecond: 310.8,
    color: '#3b82f6',
    icon: 'Database',
    tags: ['TimescaleDB', 'Postgres', 'Telemetry'],
    notes: 'Armazena séries temporais com compressão ativa.',
    healthIndicator: 'Excellent',
    healthPercentage: 99,
    isFavorite: true,
    config: {
      host: 'timescale-prod-01.local',
      port: 5432,
      database: 'historian_series',
      user: 'telemetry_writer',
      sslMode: 'require',
    },
    createdAt: '2026-01-15T09:15:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-mysql-lab',
    name: 'DB_MySQL_Qualidade',
    type: 'MySQL',
    category: 'Database',
    description: 'Banco de dados MySQL do laboratório de análises físico-químicas',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 120).toISOString(),
    simulatedLatencyMs: 19,
    messagesProcessedCount: 412000,
    msgPerSecond: 12.4,
    color: '#0891b2',
    icon: 'Database',
    tags: ['MySQL', 'Quality', 'LIMS'],
    notes: 'Coleta amostras dos ensaios de qualidade.',
    healthIndicator: 'Good',
    healthPercentage: 94,
    isFavorite: false,
    config: {
      host: 'mysql-lims.internal',
      port: 3306,
      database: 'lims_quality_db',
      user: 'orchestra_lims',
    },
    createdAt: '2026-02-01T14:20:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-sqlite-local',
    name: 'DB_SQLite_Cache_Local',
    type: 'SQLite',
    category: 'Database',
    description: 'Banco embarcado para fila de buffer offline em nós Edge',
    environment: 'Staging',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 2).toISOString(),
    simulatedLatencyMs: 2,
    messagesProcessedCount: 1540300,
    msgPerSecond: 85.0,
    color: '#64748b',
    icon: 'Database',
    tags: ['SQLite', 'Edge', 'Buffer'],
    notes: 'Fila WAL mode ativada.',
    healthIndicator: 'Excellent',
    healthPercentage: 100,
    isFavorite: false,
    config: {
      filepath: '/var/lib/orchestra/buffer_cache.db',
      journalMode: 'WAL',
      busyTimeout: 5000,
    },
    createdAt: '2026-02-05T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-sap-rfc-prod',
    name: 'SAP_S4HANA_RFC_Gateway',
    type: 'SAP',
    category: 'Enterprise ERP',
    description: 'Interface RFC / BAPI para criação de Ordens de Produção e Baixa de Estoque',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 30).toISOString(),
    simulatedLatencyMs: 65,
    messagesProcessedCount: 620400,
    msgPerSecond: 18.5,
    color: '#0284c7',
    icon: 'Briefcase',
    tags: ['SAP', 'S4HANA', 'BAPI', 'PP', 'MM'],
    notes: 'Utiliza RFC Connector oficial SAP NCo.',
    healthIndicator: 'Good',
    healthPercentage: 95,
    isFavorite: true,
    config: {
      ashost: 'sap-s4-app01.corp.internal',
      sysnr: '00',
      client: '100',
      sysid: 'PRD',
      user: 'BAPI_ORCHESTRA',
      bapiModule: 'BAPI_PRODORD_CREATE',
    },
    createdAt: '2026-01-20T13:45:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-rest-wms',
    name: 'API_REST_WMS_Senior',
    type: 'REST API',
    category: 'Web APIs & Protocols',
    description: 'API RESTful para integração de movimentos de estoque WMS',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 18).toISOString(),
    simulatedLatencyMs: 42,
    messagesProcessedCount: 890100,
    msgPerSecond: 32.1,
    color: '#10b981',
    icon: 'Globe',
    tags: ['REST', 'JSON', 'WMS', 'Senior'],
    notes: 'Autenticação OAuth 2.0 Bearer token com refresh a cada 1h.',
    healthIndicator: 'Excellent',
    healthPercentage: 97,
    isFavorite: true,
    config: {
      baseUrl: 'https://wms.senior.corp.com/api/v2',
      method: 'POST',
      authType: 'OAuth 2.0',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    },
    createdAt: '2026-01-18T16:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-soap-legacy-erp',
    name: 'SOAP_Legacy_ERP_Gateway',
    type: 'SOAP',
    category: 'Web APIs & Protocols',
    description: 'Serviço SOAP Web Service legado para consulta de cadastros de produto',
    environment: 'Production',
    status: 'Warning',
    lastCommunication: new Date(Date.now() - 1000 * 300).toISOString(),
    simulatedLatencyMs: 180,
    messagesProcessedCount: 145000,
    msgPerSecond: 4.8,
    color: '#d97706',
    icon: 'Code',
    tags: ['SOAP', 'XML', 'Legacy', 'WSDL'],
    notes: 'Algumas timeouts durante horários de pico.',
    healthIndicator: 'Fair',
    healthPercentage: 78,
    isFavorite: false,
    config: {
      wsdlUrl: 'http://legacy-erp.internal/services/Products.asmx?WSDL',
      soapAction: 'http://tempuri.org/GetProductDetails',
      timeout: 15000,
    },
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-opc-ua-planta',
    name: 'OPC_UA_Planta_Principal',
    type: 'OPC UA',
    category: 'Industrial',
    description: 'Servidor OPC UA Kepware ServerEx gerenciando 15.000 tags dos CLPs da fábrica',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 1).toISOString(),
    simulatedLatencyMs: 5,
    messagesProcessedCount: 45209000,
    msgPerSecond: 1450.0,
    color: '#059669',
    icon: 'Radio',
    tags: ['OPC UA', 'Kepware', 'PLCs', 'SCADA', 'Critical'],
    notes: 'Security Policy: Basic256Sha256 / SignAndEncrypt.',
    healthIndicator: 'Excellent',
    healthPercentage: 99,
    isFavorite: true,
    config: {
      endpointUrl: 'opc.tcp://192.168.10.50:4840',
      namespaceIndex: 2,
      securityPolicy: 'Basic256Sha256',
      securityMode: 'SignAndEncrypt',
      username: 'orchestra_opc_user',
      publishingIntervalMs: 250,
    },
    createdAt: '2026-01-05T07:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-opc-da-legacy',
    name: 'OPC_DA_InTouch_SCADA',
    type: 'OPC DA',
    category: 'Industrial',
    description: 'Servidor OPC Classic DA (COM/DCOM) do supervisório Wonderware InTouch',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 3).toISOString(),
    simulatedLatencyMs: 12,
    messagesProcessedCount: 12800000,
    msgPerSecond: 420.0,
    color: '#16a34a',
    icon: 'Radio',
    tags: ['OPC DA', 'InTouch', 'DCOM', 'Legacy'],
    notes: 'Conectado via Wrapper OPC DA-to-UA Bridge.',
    healthIndicator: 'Good',
    healthPercentage: 90,
    isFavorite: false,
    config: {
      progId: 'OPC.SimaticNET.1',
      node: '192.168.10.60',
      groupRateMs: 500,
    },
    createdAt: '2026-01-06T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-mqtt-broker-prod',
    name: 'MQTT_EMQX_Broker_IoT',
    type: 'MQTT Broker',
    category: 'Messaging & Queue',
    description: 'Broker MQTT EMQX Enterprise para sensores IoT e gateways remotos LoRaWAN',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 2).toISOString(),
    simulatedLatencyMs: 7,
    messagesProcessedCount: 22405000,
    msgPerSecond: 890.0,
    color: '#8b5cf6',
    icon: 'MessageSquare',
    tags: ['MQTT', 'EMQX', 'IoT', 'Sensors', 'Telemetry'],
    notes: 'QoS 1 com tópicos formatados em Sparkplug B.',
    healthIndicator: 'Excellent',
    healthPercentage: 98,
    isFavorite: true,
    config: {
      brokerUrl: 'mqtt://broker-emqx.internal.corp',
      port: 1883,
      clientId: 'Orchestra_Connectivity_Studio',
      qos: 1,
      keepAliveSeconds: 60,
      cleanSession: true,
      topics: ['spBv1.0/Serrano/#', 'sensors/temperature/+', 'machinery/telemetry/#'],
    },
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-rabbitmq-events',
    name: 'RabbitMQ_Industrial_Bus',
    type: 'RabbitMQ',
    category: 'Messaging & Queue',
    description: 'Barramento de eventos com mensagens AMQP para desacoplamento de sistemas',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 4).toISOString(),
    simulatedLatencyMs: 9,
    messagesProcessedCount: 15900000,
    msgPerSecond: 520.0,
    color: '#f97316',
    icon: 'Layers',
    tags: ['RabbitMQ', 'AMQP', 'EventBus'],
    notes: 'Exchanges: industrial.events, omm.movements.',
    healthIndicator: 'Excellent',
    healthPercentage: 97,
    isFavorite: true,
    config: {
      host: 'rabbitmq-cluster.local',
      port: 5672,
      vhost: '/industrial',
      user: 'orchestra_app',
      exchange: 'industrial.events',
    },
    createdAt: '2026-01-14T15:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-kafka-analytics',
    name: 'Kafka_Stream_Analytics',
    type: 'Kafka',
    category: 'Messaging & Queue',
    description: 'Cluster Apache Kafka para streaming de eventos de alta vazão e inteligência de dados',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 1).toISOString(),
    simulatedLatencyMs: 6,
    messagesProcessedCount: 89040000,
    msgPerSecond: 2850.0,
    color: '#0f172a',
    icon: 'Activity',
    tags: ['Kafka', 'Streaming', 'Analytics', 'BigData'],
    notes: 'Tópicos com retenção de 7 dias.',
    healthIndicator: 'Excellent',
    healthPercentage: 99,
    isFavorite: true,
    config: {
      brokers: 'kafka1.corp:9092,kafka2.corp:9092,kafka3.corp:9092',
      groupId: 'orchestra-connectivity-group',
      topic: 'telemetry.raw.events',
      securityProtocol: 'PLAINTEXT',
    },
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-modbus-tcp-linha1',
    name: 'ModbusTCP_Inversores_Linha1',
    type: 'Modbus TCP',
    category: 'Industrial',
    description: 'Comunicação direta via Modbus TCP com inversores de frequência e multimedidores',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 10).toISOString(),
    simulatedLatencyMs: 15,
    messagesProcessedCount: 4200000,
    msgPerSecond: 95.0,
    color: '#eab308',
    icon: 'Cpu',
    tags: ['Modbus', 'Fieldbus', 'Inversores', 'Energia'],
    notes: 'Leitura de registradores 40001 a 40050 a cada 1s.',
    healthIndicator: 'Good',
    healthPercentage: 94,
    isFavorite: false,
    config: {
      host: '192.168.20.101',
      port: 502,
      slaveId: 1,
      timeoutMs: 2000,
      pollingRateMs: 1000,
    },
    createdAt: '2026-01-22T11:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-siemens-s7-linha2',
    name: 'Siemens_S71500_Envase',
    type: 'Siemens S7',
    category: 'Industrial',
    description: 'Driver nativo S7comm para CLP Siemens S7-1500 da linha de envase',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 2).toISOString(),
    simulatedLatencyMs: 7,
    messagesProcessedCount: 18400000,
    msgPerSecond: 640.0,
    color: '#00838f',
    icon: 'Cpu',
    tags: ['Siemens', 'S7-1500', 'TIA Portal', 'Envase'],
    notes: 'DB10 (Produção) e DB20 (Status da Máquina).',
    healthIndicator: 'Excellent',
    healthPercentage: 98,
    isFavorite: true,
    config: {
      host: '192.168.20.20',
      rack: 0,
      slot: 1,
      connectionType: 'PG/OP',
      dbNumber: 10,
    },
    createdAt: '2026-01-08T14:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-allen-bradley-clp',
    name: 'Rockwell_ControlLogix_L83E',
    type: 'Allen Bradley',
    category: 'Industrial',
    description: 'Driver EtherNet/IP CIP para CLP Allen-Bradley ControlLogix 5580',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 3).toISOString(),
    simulatedLatencyMs: 9,
    messagesProcessedCount: 14200000,
    msgPerSecond: 480.0,
    color: '#c2410c',
    icon: 'Cpu',
    tags: ['Rockwell', 'AllenBradley', 'ControlLogix', 'CIP'],
    notes: 'Leitura direta de Controller Tags.',
    healthIndicator: 'Excellent',
    healthPercentage: 96,
    isFavorite: false,
    config: {
      host: '192.168.20.30',
      slot: 0,
      cpuType: 'ControlLogix',
    },
    createdAt: '2026-01-11T10:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-pi-system-osisoft',
    name: 'OSIsoft_PI_System_Plant',
    type: 'PI System',
    category: 'Industrial',
    description: 'Historian corporativo OSIsoft PI System (AVEVA PI) via AF SDK / Web API',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 60).toISOString(),
    simulatedLatencyMs: 35,
    messagesProcessedCount: 7800000,
    msgPerSecond: 180.0,
    color: '#0369a1',
    icon: 'TrendingUp',
    tags: ['PISystem', 'AVEVA', 'AF', 'Historian'],
    notes: 'Integração com PI Asset Framework (AF).',
    healthIndicator: 'Good',
    healthPercentage: 95,
    isFavorite: false,
    config: {
      webApiUrl: 'https://pi-web.corp.com/piwebapi',
      afServer: 'CORP-AF-01',
      database: 'Serrano_Plant_Assets',
    },
    createdAt: '2026-01-25T16:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-ip21-aspentech',
    name: 'AspenTech_IP21_Historian',
    type: 'IP21',
    category: 'Industrial',
    description: 'Banco de dados historador industrial Aspen InfoPlus.21 (IP21)',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 180).toISOString(),
    simulatedLatencyMs: 45,
    messagesProcessedCount: 3100000,
    msgPerSecond: 65.0,
    color: '#4d7c0f',
    icon: 'TrendingUp',
    tags: ['IP21', 'AspenTech', 'Refinery', 'Historian'],
    notes: 'Conectado via SQLplus ODBC driver.',
    healthIndicator: 'Good',
    healthPercentage: 91,
    isFavorite: false,
    config: {
      server: 'ip21-server.corp.local',
      port: 10014,
      user: 'ip21_read',
    },
    createdAt: '2026-01-28T09:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-csv-import-files',
    name: 'File_CSV_Apontamento_Turno',
    type: 'CSV',
    category: 'Files & Storage',
    description: 'Diretório monitorado para importação de relatórios CSV de apontamento manual',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 600).toISOString(),
    simulatedLatencyMs: 12,
    messagesProcessedCount: 24500,
    msgPerSecond: 1.2,
    color: '#059669',
    icon: 'FileText',
    tags: ['CSV', 'FileWatcher', 'Import', 'Turnos'],
    notes: 'Monitora pasta \\\\fileserver\\apontamentos\\*.csv',
    healthIndicator: 'Excellent',
    healthPercentage: 99,
    isFavorite: false,
    config: {
      folderPath: '\\\\fileserver\\apontamentos',
      filePattern: '*.csv',
      delimiter: ';',
      hasHeader: true,
      encoding: 'UTF-8',
    },
    createdAt: '2026-02-02T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-excel-planilhas',
    name: 'File_Excel_Planejamento_PCP',
    type: 'Excel',
    category: 'Files & Storage',
    description: 'Leitura de planilhas XLSX com programação semanal do PCP',
    environment: 'Staging',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 1200).toISOString(),
    simulatedLatencyMs: 25,
    messagesProcessedCount: 4800,
    msgPerSecond: 0.4,
    color: '#15803d',
    icon: 'FileText',
    tags: ['Excel', 'PCP', 'XLSX', 'Planejamento'],
    notes: 'Lê aba "Programacao_Producao".',
    healthIndicator: 'Good',
    healthPercentage: 94,
    isFavorite: false,
    config: {
      folderPath: '/data/pcp_imports',
      sheetName: 'Programacao_Producao',
      startRow: 2,
    },
    createdAt: '2026-02-03T11:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-xml-nfe',
    name: 'File_XML_Notas_Fiscais',
    type: 'XML',
    category: 'Files & Storage',
    description: 'Importação automática de arquivos XML de NF-e para entrada de matéria-prima',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 450).toISOString(),
    simulatedLatencyMs: 15,
    messagesProcessedCount: 68000,
    msgPerSecond: 2.8,
    color: '#b45309',
    icon: 'Code',
    tags: ['XML', 'NFe', 'Recebimento', 'Fiscal'],
    notes: 'Valida esquema XSD SEFAZ v4.0.',
    healthIndicator: 'Excellent',
    healthPercentage: 98,
    isFavorite: false,
    config: {
      folderPath: '/var/nfe/inbox',
      schemaValidate: true,
    },
    createdAt: '2026-01-19T14:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-json-telemetry-file',
    name: 'File_JSON_Logs_Dispositivos',
    type: 'JSON',
    category: 'Files & Storage',
    description: 'Processamento de arquivos JSON exportados por balanças e etiquetadoras',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 90).toISOString(),
    simulatedLatencyMs: 10,
    messagesProcessedCount: 310000,
    msgPerSecond: 14.2,
    color: '#7c3aed',
    icon: 'FileText',
    tags: ['JSON', 'Balança', 'Etiquetadora'],
    notes: 'Parse recursivo de objetos aninhados.',
    healthIndicator: 'Excellent',
    healthPercentage: 97,
    isFavorite: false,
    config: {
      folderPath: '/data/scale_logs',
      jsonPathRoot: '$.weighings[*]',
    },
    createdAt: '2026-01-21T09:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-ftp-fornecedores',
    name: 'FTP_Fornecedores_Lotes',
    type: 'FTP',
    category: 'Files & Storage',
    description: 'Servidor FTP para recebimento de certificados de análise de fornecedores',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 1800).toISOString(),
    simulatedLatencyMs: 65,
    messagesProcessedCount: 12400,
    msgPerSecond: 0.8,
    color: '#2563eb',
    icon: 'Folder',
    tags: ['FTP', 'Fornecedores', 'Certificados'],
    notes: 'Conexão FTP em modo Passivo.',
    healthIndicator: 'Good',
    healthPercentage: 90,
    isFavorite: false,
    config: {
      host: 'ftp.suppliers-network.org',
      port: 21,
      mode: 'passive',
      user: 'serrano_receiver',
    },
    createdAt: '2026-01-16T15:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-sftp-secure-backup',
    name: 'SFTP_Secure_Export_ERP',
    type: 'SFTP',
    category: 'Files & Storage',
    description: 'Transferência segura via SFTP (SSH) para backup externo de logs e auditoria',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 3600).toISOString(),
    simulatedLatencyMs: 50,
    messagesProcessedCount: 89000,
    msgPerSecond: 3.5,
    color: '#1e3a8a',
    icon: 'Lock',
    tags: ['SFTP', 'SSH', 'Security', 'Backup'],
    notes: 'Autenticação via chave RSA 4096-bit.',
    healthIndicator: 'Excellent',
    healthPercentage: 99,
    isFavorite: false,
    config: {
      host: 'sftp.cloudbackup.corp',
      port: 22,
      authType: 'PrivateKey',
      remotePath: '/backups/orchestra',
    },
    createdAt: '2026-01-17T11:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-smtp-notificacoes',
    name: 'SMTP_Alertas_Corporativo',
    type: 'SMTP',
    category: 'Utilities',
    description: 'Servidor de e-mail SMTP para disparo de alertas críticos e relatórios diários',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 300).toISOString(),
    simulatedLatencyMs: 90,
    messagesProcessedCount: 45200,
    msgPerSecond: 1.5,
    color: '#e11d48',
    icon: 'Mail',
    tags: ['SMTP', 'Email', 'Alerts', 'Notifications'],
    notes: 'TLS porta 587 ativado.',
    healthIndicator: 'Excellent',
    healthPercentage: 97,
    isFavorite: true,
    config: {
      host: 'smtp.office365.com',
      port: 587,
      useTls: true,
      fromAddress: 'alertas.planta@serrano.com.br',
    },
    createdAt: '2026-01-09T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-websocket-realtime',
    name: 'WebSocket_Realtime_Andon',
    type: 'WebSocket',
    category: 'Web APIs & Protocols',
    description: 'Conexão bidirecional via WebSocket para atualização instantânea dos painéis Andon',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 1).toISOString(),
    simulatedLatencyMs: 4,
    messagesProcessedCount: 38900000,
    msgPerSecond: 1120.0,
    color: '#06b6d4',
    icon: 'Zap',
    tags: ['WebSocket', 'Andon', 'Realtime', 'Dashboards'],
    notes: 'Conexão wss:// mantida com auto-reconnect.',
    healthIndicator: 'Excellent',
    healthPercentage: 99,
    isFavorite: true,
    config: {
      url: 'wss://andon.serrano.com.br/ws/v1/factory-floor',
      heartbeatIntervalMs: 15000,
    },
    createdAt: '2026-01-04T12:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-filesystem-watch',
    name: 'FileSystem_Local_Watcher',
    type: 'File System',
    category: 'Files & Storage',
    description: 'Monitoramento em tempo real do sistema de arquivos local para novos arquivos',
    environment: 'Production',
    status: 'Connected',
    lastCommunication: new Date(Date.now() - 1000 * 15).toISOString(),
    simulatedLatencyMs: 2,
    messagesProcessedCount: 95000,
    msgPerSecond: 5.4,
    color: '#475569',
    icon: 'Folder',
    tags: ['FileSystem', 'Watcher', 'Local'],
    notes: 'Watcher no evento OnFileCreated.',
    healthIndicator: 'Excellent',
    healthPercentage: 100,
    isFavorite: false,
    config: {
      watchDirectory: 'C:\\SerranoData\\Ingestion',
      recursive: true,
    },
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

// Helper to seed pre-built flows
const getInitialFlows = (): ConnectivityFlow[] => [
  {
    id: 'flow-opc-to-object',
    name: 'Pipeline_01_Leitura_OPC_para_Objeto',
    description: 'Assina tags no OPC UA Kepware e atualiza propriedades em tempo real nos Objetos do Orquestra',
    category: 'Industrial IoT',
    version: '1.2.0',
    author: 'Eng. Automação Bruno',
    status: 'Running',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Este fluxo assina 50 tags industriais do servidor OPC UA Planta Principal e sincroniza o runtime dos Objetos da Linha 01.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Assinatura OPC UA',
          category: 'Entrada',
          blockType: 'OPC Subscription',
          iconName: 'Radio',
          color: '#059669',
          description: 'Escuta alterações de tags OPC',
          inputsCount: 0,
          outputsCount: 1,
          properties: { connection: 'conn-opc-ua-planta', pollingRateMs: 250, nodePath: 'ns=2;s=Line1.Temperature' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Filtro & Normalização',
          category: 'Transformação',
          blockType: 'Filter',
          iconName: 'Filter',
          color: '#3b82f6',
          description: 'Filtra ruídos e valida qualidade',
          inputsCount: 1,
          outputsCount: 1,
          properties: { condition: 'payload.quality === "Good" && payload.value > 0' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Escrever Objeto Orquestra',
          category: 'Industrial',
          blockType: 'Escrever Objeto',
          iconName: 'Cpu',
          color: '#8b5cf6',
          description: 'Atualiza a propriedade Temperatura no Objeto Tanque01',
          inputsCount: 1,
          outputsCount: 0,
          properties: { targetObject: 'Tanque_Misturador_01', targetProperty: 'Temperatura' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
    executedCount: 452900,
    avgDurationMs: 8.4,
    errorRatePercent: 0.02,
  },
  {
    id: 'flow-object-to-db',
    name: 'Pipeline_02_Objeto_para_Banco_Dados',
    description: 'Persiste alterações de estado dos Objetos do Orquestra no SQL Server Corporativo',
    category: 'Database Sync',
    version: '2.0.1',
    author: 'Equipe de Dados',
    status: 'Running',
    createdAt: '2026-01-20T14:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Grava histórico de medições agregadas no banco relacional SQL Server a cada ciclo de medição.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Gatilho de Variável',
          category: 'Entrada',
          blockType: 'Mudança de Variável',
          iconName: 'Activity',
          color: '#f59e0b',
          description: 'Dispara na alteração de propriedades',
          inputsCount: 0,
          outputsCount: 1,
          properties: { variable: 'Tanque_Misturador_01.Nivel' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Mapeamento de Campos',
          category: 'Transformação',
          blockType: 'Mapping',
          iconName: 'ArrowLeftRight',
          color: '#6366f1',
          description: 'Mapeia para tabela TB_Historico_Medicoes',
          inputsCount: 1,
          outputsCount: 1,
          properties: { mappingTable: 'Tanque -> db_tanque, Nivel -> db_nivel' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Insert SQL Server',
          category: 'Banco de Dados',
          blockType: 'Insert',
          iconName: 'Database',
          color: '#0284c7',
          description: 'Insere registro no SQL Server',
          inputsCount: 1,
          outputsCount: 0,
          properties: { connection: 'conn-sql-server-prod', table: 'TB_Historico_Medicoes' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
    ],
    executedCount: 128400,
    avgDurationMs: 14.2,
    errorRatePercent: 0.1,
  },
  {
    id: 'flow-omm-to-sap',
    name: 'Pipeline_03_OMM_Movimento_para_SAP',
    description: 'Envia eventos de confirmação de movimento do OMM para o SAP S/4HANA via BAPI RFC',
    category: 'ERP Integration',
    version: '1.0.0',
    author: 'Integrador ERP',
    status: 'Running',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Sincroniza automaticamente movimentos concluídos do OMM com as ordens do SAP.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Evento de Movimento OMM',
          category: 'Entrada',
          blockType: 'Novo Movimento',
          iconName: 'ArrowLeftRight',
          color: '#0284c7',
          description: 'Escuta novos movimentos de material',
          inputsCount: 0,
          outputsCount: 1,
          properties: { eventType: 'MovementCompleted' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Transformar Payload SAP RFC',
          category: 'Transformação',
          blockType: 'Parse JSON',
          iconName: 'Code',
          color: '#8b5cf6',
          description: 'Estrutura estrutura BAPI_GOODSMVT_CREATE',
          inputsCount: 1,
          outputsCount: 1,
          properties: { bapiStructure: 'BAPI_GOODSMVT_CREATE' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Chamada BAPI SAP',
          category: 'Comunicação',
          blockType: 'SOAP Client',
          iconName: 'Briefcase',
          color: '#dc2626',
          description: 'Executa a BAPI no SAP ERP',
          inputsCount: 1,
          outputsCount: 0,
          properties: { connection: 'conn-sap-rfc-prod', functionName: 'BAPI_GOODSMVT_CREATE' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
    executedCount: 42100,
    avgDurationMs: 78.0,
    errorRatePercent: 0.5,
  },
  {
    id: 'flow-alarm-to-email',
    name: 'Pipeline_04_Alarme_Critico_para_Email',
    description: 'Detecta alarmes de alta severidade no Alarm Manager e dispara e-mail com detalhes via SMTP',
    category: 'Alarm Notification',
    version: '1.1.0',
    author: 'Supervisão de Operações',
    status: 'Running',
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Notifica os supervisores de turno quando um alarme de severidade CRITICAL não for reconhecido em até 2 minutos.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Gatilho de Novo Alarme',
          category: 'Entrada',
          blockType: 'Novo Alarme',
          iconName: 'Bell',
          color: '#ef4444',
          description: 'Capta alarmes disparados no sistema',
          inputsCount: 0,
          outputsCount: 1,
          properties: { severityFilter: 'Critical' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Formatador de E-mail HTML',
          category: 'Utilidades',
          blockType: 'Formatação',
          iconName: 'Mail',
          color: '#10b981',
          description: 'Gera o corpo do e-mail com a tag e o valor',
          inputsCount: 1,
          outputsCount: 1,
          properties: { template: 'Alerta Crítico na Tag {{tag}}: {{message}}' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Enviar E-mail SMTP',
          category: 'Comunicação',
          blockType: 'SMTP Send',
          iconName: 'Mail',
          color: '#e11d48',
          description: 'Dispara e-mail via servidor SMTP',
          inputsCount: 1,
          outputsCount: 0,
          properties: { connection: 'conn-smtp-notificacoes', recipient: '{{ALERT_EMAIL_RECIPIENTS}}' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    ],
    executedCount: 840,
    avgDurationMs: 120.5,
    errorRatePercent: 0.0,
  },
  {
    id: 'flow-csv-to-db',
    name: 'Pipeline_05_Importacao_CSV_para_Banco',
    description: 'Lê arquivos CSV de apontamentos de produção e insere no banco de dados com validação',
    category: 'Custom Pipeline',
    version: '1.0.0',
    author: 'Analista de Processos',
    status: 'Paused',
    createdAt: '2026-02-04T11:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Monitora a pasta de arquivos recebidos e insere os registros na tabela de apontamentos.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'File Watcher CSV',
          category: 'Entrada',
          blockType: 'File Watcher',
          iconName: 'FileText',
          color: '#059669',
          description: 'Monitora arquivos CSV de entrada',
          inputsCount: 0,
          outputsCount: 1,
          properties: { connection: 'conn-csv-import-files', filePattern: '*.csv' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Bulk Insert Postgres',
          category: 'Banco de Dados',
          blockType: 'Insert',
          iconName: 'Database',
          color: '#0284c7',
          description: 'Grava dados no banco de apontamentos',
          inputsCount: 1,
          outputsCount: 0,
          properties: { connection: 'conn-postgres-historian', table: 'tb_apontamentos' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
    ],
    executedCount: 1250,
    avgDurationMs: 45.0,
    errorRatePercent: 0.8,
  },
  {
    id: 'flow-rest-to-runtime',
    name: 'Pipeline_06_REST_API_para_Runtime',
    description: 'Consome endpoints REST do sistema WMS e atualiza tags no Runtime da fábrica',
    category: 'ERP Integration',
    version: '1.3.0',
    author: 'Integrador MES',
    status: 'Running',
    createdAt: '2026-01-25T14:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Consulta ordens ativas no WMS Senior e atualiza a propriedade de OrdemAtiva no Runtime.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Timer Polling REST',
          category: 'Entrada',
          blockType: 'Timer',
          iconName: 'Clock',
          color: '#059669',
          description: 'Consulta API a cada 30 segundos',
          inputsCount: 0,
          outputsCount: 1,
          properties: { intervalMs: 30000 },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'REST Client WMS',
          category: 'Comunicação',
          blockType: 'REST Client',
          iconName: 'Globe',
          color: '#ec4899',
          description: 'GET /api/v2/orders/active',
          inputsCount: 1,
          outputsCount: 1,
          properties: { connection: 'conn-rest-wms', endpoint: '/orders/active' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Atualizar Runtime Orquestra',
          category: 'Industrial',
          blockType: 'Escrever Objeto',
          iconName: 'Cpu',
          color: '#8b5cf6',
          description: 'Sincroniza ordens ativas',
          inputsCount: 1,
          outputsCount: 0,
          properties: { targetObject: 'Linha_Envase_01', targetProperty: 'OrdemAtiva' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
    executedCount: 8920,
    avgDurationMs: 42.1,
    errorRatePercent: 0.1,
  },
  {
    id: 'flow-mqtt-to-omm',
    name: 'Pipeline_07_MQTT_IoT_para_OMM',
    description: 'Escuta mensagens MQTT de leitores de código de barras LoRaWAN e registra movimentos no OMM',
    category: 'Industrial IoT',
    version: '1.0.0',
    author: 'Eng. IoT Pedro',
    status: 'Running',
    createdAt: '2026-01-28T16:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Capta leituras de balanças MQTT e cria ordens de movimentação de paletes automaticamente.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'MQTT Subscriber',
          category: 'Entrada',
          blockType: 'MQTT Subscriber',
          iconName: 'MessageSquare',
          color: '#059669',
          description: 'Escuta em spBv1.0/Serrano/#',
          inputsCount: 0,
          outputsCount: 1,
          properties: { connection: 'conn-mqtt-broker-prod', topic: 'sensors/scales/+' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Criar Movimento OMM',
          category: 'Industrial',
          blockType: 'Criar Movimento',
          iconName: 'ArrowLeftRight',
          color: '#8b5cf6',
          description: 'Gera movimento no OMM',
          inputsCount: 1,
          outputsCount: 0,
          properties: { origin: 'Depósito A', destination: 'Envase' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
    ],
    executedCount: 54100,
    avgDurationMs: 12.0,
    errorRatePercent: 0.05,
  },
  {
    id: 'flow-sql-to-kpi',
    name: 'Pipeline_08_SQLServer_para_KPI_Dashboard',
    description: 'Consulta totais de produção diários no SQL Server e atualiza métricas no KPI Dashboard',
    category: 'Quality Analytics',
    version: '2.1.0',
    author: 'Gerente PCP',
    status: 'Running',
    createdAt: '2026-02-02T10:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Calcula o OEE diário consolidado da fábrica e atualiza o widget de meta no KPI Dashboard.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Cron 15 Minutos',
          category: 'Entrada',
          blockType: 'Cron',
          iconName: 'Clock',
          color: '#059669',
          description: 'Executa a cada 15 min',
          inputsCount: 0,
          outputsCount: 1,
          properties: { cron: '*/15 * * * *' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Query OEE SQL Server',
          category: 'Banco de Dados',
          blockType: 'Select',
          iconName: 'Database',
          color: '#0284c7',
          description: 'Calcula OEE consolidado',
          inputsCount: 1,
          outputsCount: 1,
          properties: { connection: 'conn-sql-server-prod', query: 'SELECT dbo.fn_CalculateOEE()' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Atualizar KPI Dashboard',
          category: 'Industrial',
          blockType: 'Atualizar KPI',
          iconName: 'Activity',
          color: '#8b5cf6',
          description: 'Atualiza o indicador de OEE',
          inputsCount: 1,
          outputsCount: 0,
          properties: { kpiKey: 'KPI_OEE_Geral' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
    ],
    executedCount: 3100,
    avgDurationMs: 28.5,
    errorRatePercent: 0.0,
  },
  {
    id: 'flow-quality-to-events',
    name: 'Pipeline_09_Qualidade_para_Event_Engine',
    description: 'Monitora laudos de qualidade fora de especificação e dispara eventos no Event Engine',
    category: 'Quality Analytics',
    version: '1.0.0',
    author: 'Eng. Qualidade Ana',
    status: 'Running',
    createdAt: '2026-02-03T14:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Gera alertas de não conformidade no Event Engine para ação imediata da equipe de Qualidade.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Polling MySQL Qualidade',
          category: 'Entrada',
          blockType: 'Database Query',
          iconName: 'Database',
          color: '#059669',
          description: 'Busca novos laudos reprovados',
          inputsCount: 0,
          outputsCount: 1,
          properties: { connection: 'conn-mysql-lab', query: 'SELECT * FROM tb_laudos WHERE status="REPROVADO"' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Disparar Evento de Não Conformidade',
          category: 'Industrial',
          blockType: 'Executar Evento',
          iconName: 'Zap',
          color: '#8b5cf6',
          description: 'Notifica o Event Engine',
          inputsCount: 1,
          outputsCount: 0,
          properties: { eventName: 'QualityNonConformityDetected' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
    ],
    executedCount: 420,
    avgDurationMs: 18.0,
    errorRatePercent: 0.0,
  },
  {
    id: 'flow-cutoff-to-historian',
    name: 'Pipeline_10_Cutoff_para_Historian',
    description: 'Executa a consolidação de fechamento de turno (Cut-off) e envia séries temporais ao Historian',
    category: 'Cut-off Historian',
    version: '1.0.0',
    author: 'Supervisão de Produção',
    status: 'Running',
    createdAt: '2026-02-05T07:00:00Z',
    updatedAt: new Date().toISOString(),
    documentation: 'Realiza a leitura de encerramento de turno e grava os totais consolidados no Historian.',
    nodes: [
      {
        id: 'node-1',
        type: 'customNode',
        position: { x: 50, y: 150 },
        data: {
          label: 'Evento de Cut-off de Turno',
          category: 'Entrada',
          blockType: 'Evento do Sistema',
          iconName: 'Clock',
          color: '#059669',
          description: 'Dispara no fechamento do turno',
          inputsCount: 0,
          outputsCount: 1,
          properties: { event: 'ShiftCutoffTriggered' },
        },
      },
      {
        id: 'node-2',
        type: 'customNode',
        position: { x: 320, y: 150 },
        data: {
          label: 'Executar Cut-off Orquestra',
          category: 'Industrial',
          blockType: 'Executar Cut-off',
          iconName: 'Zap',
          color: '#8b5cf6',
          description: 'Consolida totais do turno',
          inputsCount: 1,
          outputsCount: 1,
          properties: { shiftId: 'Turno_01' },
        },
      },
      {
        id: 'node-3',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Gravar Historian TimescaleDB',
          category: 'Banco de Dados',
          blockType: 'Insert',
          iconName: 'Database',
          color: '#0284c7',
          description: 'Persiste série histórica do turno',
          inputsCount: 1,
          outputsCount: 0,
          properties: { connection: 'conn-postgres-historian', table: 'historian_series' },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
    executedCount: 180,
    avgDurationMs: 65.0,
    errorRatePercent: 0.0,
  },
];

// Helper to seed pre-built message traces
const getInitialMessageTraces = (): ConnectivityMessageTrace[] => [
  {
    id: 'trace-exec-001',
    flowId: 'flow-opc-to-object',
    flowName: 'Pipeline_01_Leitura_OPC_para_Objeto',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    trigger: 'OPC Subscription (ns=2;s=Line1.Temperature)',
    totalDurationMs: 8.4,
    status: 'Success',
    steps: [
      {
        stepId: 'step-1',
        nodeName: 'Assinatura OPC UA',
        nodeType: 'OPC Subscription',
        payloadIn: { event: 'TagValueChanged', tag: 'ns=2;s=Line1.Temperature' },
        payloadOut: {
          tagPath: 'ns=2;s=Line1.Temperature',
          rawValue: 87.45,
          quality: 'Good',
          timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
        },
        durationMs: 2.1,
        status: 'Success',
        logMessage: 'Tag value received from Kepware OPC Server.',
        timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
      },
      {
        stepId: 'step-2',
        nodeName: 'Filtro & Normalização',
        nodeType: 'Filter',
        payloadIn: {
          tagPath: 'ns=2;s=Line1.Temperature',
          rawValue: 87.45,
          quality: 'Good',
          timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
        },
        payloadOut: {
          validated: true,
          normalizedValue: 87.45,
          unit: '°C',
          objectId: 'Tanque_Misturador_01',
          property: 'Temperatura',
        },
        durationMs: 1.8,
        status: 'Success',
        logMessage: 'Validation passed. Value normalized to °C.',
        timestamp: new Date(Date.now() - 1000 * 29).toISOString(),
      },
      {
        stepId: 'step-3',
        nodeName: 'Escrever Objeto Orquestra',
        nodeType: 'Escrever Objeto',
        payloadIn: {
          validated: true,
          normalizedValue: 87.45,
          unit: '°C',
          objectId: 'Tanque_Misturador_01',
          property: 'Temperatura',
        },
        payloadOut: {
          success: true,
          objectUpdated: 'Tanque_Misturador_01',
          propertyUpdated: 'Temperatura',
          newValue: 87.45,
          runtimeUpdated: true,
        },
        durationMs: 4.5,
        status: 'Success',
        logMessage: 'Object property updated successfully in Orquestra Runtime.',
        timestamp: new Date(Date.now() - 1000 * 28).toISOString(),
      },
    ],
  },
];

// Helper to seed schedules
const getInitialSchedules = (): ConnectivitySchedule[] => [
  {
    id: 'sched-001',
    flowId: 'flow-opc-to-object',
    flowName: 'Pipeline_01_Leitura_OPC_para_Objeto',
    triggerType: 'Fixed Interval',
    intervalSeconds: 1,
    status: 'Active',
    lastRunAt: new Date(Date.now() - 1000 * 1).toISOString(),
    nextRunAt: new Date(Date.now() + 1000 * 1).toISOString(),
    runCount: 452900,
    description: 'Execução contínua a cada 1 segundo.',
  },
  {
    id: 'sched-002',
    flowId: 'flow-object-to-db',
    flowName: 'Pipeline_02_Objeto_para_Banco_Dados',
    triggerType: 'Cron Expression',
    cronExpression: '*/5 * * * *',
    status: 'Active',
    lastRunAt: new Date(Date.now() - 1000 * 120).toISOString(),
    nextRunAt: new Date(Date.now() + 1000 * 180).toISOString(),
    runCount: 128400,
    description: 'Agendado por Cron: A cada 5 minutos.',
  },
  {
    id: 'sched-003',
    flowId: 'flow-omm-to-sap',
    flowName: 'Pipeline_03_OMM_Movimento_para_SAP',
    triggerType: 'OMM Event',
    eventPattern: 'MovementStateChanged -> COMPLETED',
    status: 'Active',
    lastRunAt: new Date(Date.now() - 1000 * 600).toISOString(),
    runCount: 42100,
    description: 'Disparado automaticamente ao concluir movimento no OMM.',
  },
];

// Helper to seed logs
const getInitialLogs = (): ConnectivityLogEntry[] => [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 1000 * 5).toISOString(),
    flowId: 'flow-opc-to-object',
    flowName: 'Pipeline_01_Leitura_OPC_para_Objeto',
    durationMs: 8,
    messageCount: 1,
    source: 'OPC_UA_Planta_Principal',
    destination: 'Orquestra_Runtime_Tanque01',
    status: 'Success',
    severity: 'Info',
    triggeredBy: 'OPC Subscription',
    details: 'Valores das tags sincronizados com sucesso sem erros.',
    traceId: 'trace-exec-001',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    flowId: 'flow-object-to-db',
    flowName: 'Pipeline_02_Objeto_para_Banco_Dados',
    durationMs: 14,
    messageCount: 15,
    source: 'Orquestra_Runtime',
    destination: 'DB_SQLServer_Corporativo',
    status: 'Success',
    severity: 'Info',
    triggeredBy: 'Scheduler (Cron)',
    details: 'Batch de 15 medições inserido na tabela TB_Historico_Medicoes.',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 1000 * 180).toISOString(),
    flowId: 'flow-alarm-to-email',
    flowName: 'Pipeline_04_Alarme_Critico_para_Email',
    durationMs: 120,
    messageCount: 1,
    source: 'Alarm_Engine_Critical',
    destination: 'SMTP_Alertas_Corporativo',
    status: 'Success',
    severity: 'Warning',
    triggeredBy: 'Alarm Manager',
    details: 'Alarme de Alta Temperatura no Tanque 01 notificado aos supervisores.',
  },
];

// Helper to seed global variables
const getInitialGlobalVariables = (): ConnectivityGlobalVariable[] => [
  {
    id: 'gvar-001',
    name: 'ERP_BASE_URL',
    type: 'String',
    value: 'https://sap-s4.corp.serrano.com.br/api/v1',
    description: 'URL base de homologação/produção da API do ERP SAP',
    category: 'ERP',
    environment: 'Production',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gvar-002',
    name: 'OPC_DEFAULT_NAMESPACE',
    type: 'Number',
    value: '2',
    description: 'Namespace de tags padrão no servidor Kepware OPC UA',
    category: 'Industrial',
    environment: 'Production',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gvar-003',
    name: 'ALERT_EMAIL_RECIPIENTS',
    type: 'String',
    value: 'supervisao.fabrica@serrano.com.br, manutencao.planta@serrano.com.br',
    description: 'Lista de e-mails para envio de alertas críticos de alarme',
    category: 'Notifications',
    environment: 'Production',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gvar-004',
    name: 'MAX_RETRY_COUNT',
    type: 'Number',
    value: '5',
    description: 'Número máximo de tentativas em falha de conexão',
    category: 'System',
    environment: 'Production',
    updatedAt: new Date().toISOString(),
  },
];

// Helper to seed secret vault
const getInitialSecrets = (): ConnectivitySecret[] => [
  {
    id: 'sec-001',
    name: 'SAP_SERVICE_ACCOUNT_KEY',
    category: 'Password',
    valueMasked: '••••••••••••••••',
    realValue: 'SapSerrano2026!ProdSecretKey',
    lastRotatedAt: '2026-01-01T00:00:00Z',
    status: 'Active',
    associatedConnections: ['conn-sap-rfc-prod'],
    description: 'Senha da conta de serviço para chamadas BAPI no SAP ERP',
  },
  {
    id: 'sec-002',
    name: 'MQTT_PROD_PASSWORD',
    category: 'API Token',
    valueMasked: '••••••••••••••••',
    realValue: 'emqx_token_sec_88492019482',
    lastRotatedAt: '2026-01-10T10:00:00Z',
    status: 'Active',
    associatedConnections: ['conn-mqtt-broker-prod'],
    description: 'Chave de autenticação no Broker EMQX Enterprise',
  },
  {
    id: 'sec-003',
    name: 'SQL_SERVER_PASS',
    category: 'Password',
    valueMasked: '••••••••••••••••',
    realValue: 'SqlSerranoPass#2026',
    lastRotatedAt: '2025-12-15T00:00:00Z',
    status: 'Expiring Soon',
    associatedConnections: ['conn-sql-server-prod'],
    description: 'Senha de acesso ao cluster SQL Server Corporativo',
  },
];

// Helper to seed universal mapping rules
const getInitialMappingRules = (): ConnectivityMappingRule[] => [
  {
    id: 'map-001',
    name: 'Mapeamento_OPC_para_Propriedade_Tanque',
    description: 'Mapeia a tag de temperatura do OPC Browser para a propriedade Temperatura no Objeto Tanque',
    sourceModule: 'OPC Tag',
    sourceEntity: 'Kepware.Line1.Temperature',
    sourceField: 'Value',
    transformations: [
      { id: 't1', type: 'Converter', name: 'To Float', config: { precision: 2 } },
      { id: 't2', type: 'Format Date', name: 'Add Timestamp', config: { format: 'ISO' } },
    ],
    targetModule: 'Object Property',
    targetEntity: 'Tanque_Misturador_01',
    targetField: 'Temperatura',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'map-002',
    name: 'Mapeamento_OMM_Movimento_para_KPI',
    description: 'Calcula tempo de permanência de lote a partir de movimentos do OMM e envia para KPI Dashboard',
    sourceModule: 'OMM Movement',
    sourceEntity: 'Movimento_Envase_Lote',
    sourceField: 'DurationSeconds',
    transformations: [
      { id: 't1', type: 'Math Calc', name: 'Seconds to Minutes', config: { formula: 'x / 60' } },
    ],
    targetModule: 'KPI',
    targetEntity: 'KPI_Eficiencia_Envase',
    targetField: 'ValorAtual',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
];

const getInitialFolders = (): ConnectivityFolder[] => [
  { id: 'folder-industrial', name: 'Integrações Industriais', parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'folder-erp', name: 'ERP & Corporativo', parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'folder-analytics', name: 'Analytics & KPIs', parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'folder-sub-plc', name: 'PLCs & OPC-UA', parentId: 'folder-industrial', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const useConnectivityStore = create<ConnectivityStoreState>()(
  immer((set, get) => {
    // Attempt load from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    let initialFolders = getInitialFolders();
    let initialConnections = getInitialConnections();
    let initialFlows = getInitialFlows();
    let initialMessageTraces = getInitialMessageTraces();
    let initialSchedules = getInitialSchedules();
    let initialLogs = getInitialLogs();
    let initialGlobalVariables = getInitialGlobalVariables();
    let initialSecrets = getInitialSecrets();
    let initialMappingRules = getInitialMappingRules();

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.folders?.length) initialFolders = parsed.folders;
        if (parsed.connections?.length) initialConnections = parsed.connections;
        if (parsed.flows?.length) initialFlows = parsed.flows;
        if (parsed.messageTraces?.length) initialMessageTraces = parsed.messageTraces;
        if (parsed.schedules?.length) initialSchedules = parsed.schedules;
        if (parsed.logs?.length) initialLogs = parsed.logs;
        if (parsed.globalVariables?.length) initialGlobalVariables = parsed.globalVariables;
        if (parsed.secrets?.length) initialSecrets = parsed.secrets;
        if (parsed.mappingRules?.length) initialMappingRules = parsed.mappingRules;
      } catch (err) {
        console.error('Failed to load connectivity store from localStorage:', err);
      }
    }

    const saveState = (state: ConnectivityStoreState) => {
      const payload = {
        folders: state.folders,
        connections: state.connections,
        flows: state.flows,
        messageTraces: state.messageTraces,
        schedules: state.schedules,
        logs: state.logs,
        globalVariables: state.globalVariables,
        secrets: state.secrets,
        mappingRules: state.mappingRules,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    };

    return {
      folders: initialFolders,
      connections: initialConnections,
      flows: initialFlows,
      messageTraces: initialMessageTraces,
      schedules: initialSchedules,
      logs: initialLogs,
      globalVariables: initialGlobalVariables,
      secrets: initialSecrets,
      mappingRules: initialMappingRules,

      activeTab: 'flows',
      selectedConnectionId: null,
      selectedFlowId: initialFlows[0]?.id || null,
      selectedTraceId: initialMessageTraces[0]?.id || null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedConnectionId: (id) => set({ selectedConnectionId: id }),
      setSelectedFlowId: (id) => set({ selectedFlowId: id }),
      setSelectedTraceId: (id) => set({ selectedTraceId: id }),

      // Folders CRUD
      addFolder: (name, parentId = null) => {
        set((state) => {
          const newFolder: ConnectivityFolder = {
            id: `folder-${uuidv4()}`,
            name,
            parentId: parentId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.folders.push(newFolder);
          saveState(state);
        });
      },
      updateFolder: (id, folderData) => {
        set((state) => {
          const folder = state.folders.find((f) => f.id === id);
          if (folder) {
            Object.assign(folder, folderData, { updatedAt: new Date().toISOString() });
            saveState(state);
          }
        });
      },
      deleteFolder: (id) => {
        set((state) => {
          state.folders = state.folders.filter((f) => f.id !== id && f.parentId !== id);
          state.flows.forEach((flow) => {
            if (flow.folderId === id) {
              flow.folderId = null;
            }
          });
          saveState(state);
        });
      },
      moveFolder: (id, parentId) => {
        set((state) => {
          const folder = state.folders.find((f) => f.id === id);
          if (folder && folder.id !== parentId) {
            folder.parentId = parentId;
            folder.updatedAt = new Date().toISOString();
            saveState(state);
          }
        });
      },
      moveFlowToFolder: (flowId, folderId) => {
        set((state) => {
          const flow = state.flows.find((f) => f.id === flowId);
          if (flow) {
            flow.folderId = folderId;
            flow.updatedAt = new Date().toISOString();
            saveState(state);
          }
        });
      },

      // Connections
      addConnection: (connData) =>
        set((state) => {
          const newConn: ConnectivityConnection = {
            ...connData,
            id: `conn-${uuidv4().slice(0, 8)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.connections.unshift(newConn);
          saveState(state as any);
        }),

      updateConnection: (id, connData) =>
        set((state) => {
          const idx = state.connections.findIndex((c) => c.id === id);
          if (idx !== -1) {
            state.connections[idx] = {
              ...state.connections[idx],
              ...connData,
              updatedAt: new Date().toISOString(),
            };
            saveState(state as any);
          }
        }),

      deleteConnection: (id) =>
        set((state) => {
          state.connections = state.connections.filter((c) => c.id !== id);
          if (state.selectedConnectionId === id) state.selectedConnectionId = null;
          saveState(state as any);
        }),

      duplicateConnection: (id) =>
        set((state) => {
          const conn = state.connections.find((c) => c.id === id);
          if (conn) {
            const duplicated: ConnectivityConnection = {
              ...conn,
              id: `conn-${uuidv4().slice(0, 8)}`,
              name: `${conn.name}_Cópia`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            state.connections.unshift(duplicated);
            saveState(state as any);
          }
        }),

      toggleFavoriteConnection: (id) =>
        set((state) => {
          const conn = state.connections.find((c) => c.id === id);
          if (conn) {
            conn.isFavorite = !conn.isFavorite;
            saveState(state as any);
          }
        }),

      testConnection: async (id) => {
        // Simulate testing connection
        const conn = get().connections.find((c) => c.id === id);
        if (!conn) return { status: 'Error', latencyMs: 0, message: 'Conexão não encontrada.' };

        const outcomes: Array<{ status: ConnectionStatus; latency: number; msg: string; health: HealthIndicator; pct: number }> = [
          { status: 'Connected', latency: Math.floor(Math.random() * 15) + 5, msg: 'Conexão estabelecida com sucesso! Handshake OK.', health: 'Excellent', pct: 98 },
          { status: 'Connected', latency: Math.floor(Math.random() * 25) + 10, msg: 'Conexão OK. Tempo de resposta normal.', health: 'Good', pct: 92 },
          { status: 'Warning', latency: Math.floor(Math.random() * 150) + 100, msg: 'Latência alta detectada durante a consulta.', health: 'Fair', pct: 75 },
        ];

        const result = outcomes[Math.floor(Math.random() * outcomes.length)];

        set((state) => {
          const target = state.connections.find((c) => c.id === id);
          if (target) {
            target.status = result.status;
            target.simulatedLatencyMs = result.latency;
            target.lastCommunication = new Date().toISOString();
            target.healthIndicator = result.health;
            target.healthPercentage = result.pct;

            // Log event
            state.logs.unshift({
              id: `log-${uuidv4().slice(0, 8)}`,
              timestamp: new Date().toISOString(),
              flowId: 'system-test',
              flowName: `Teste_Conexao_${target.name}`,
              durationMs: result.latency,
              messageCount: 1,
              source: 'Connectivity_Studio_Tester',
              destination: target.name,
              status: result.status === 'Connected' ? 'Success' : 'Warning',
              severity: result.status === 'Connected' ? 'Info' : 'Warning',
              triggeredBy: 'Manual Test',
              details: result.msg,
            });

            saveState(state as any);
          }
        });

        return { status: result.status, latencyMs: result.latency, message: result.msg };
      },

      // Flows
      addFlow: (flowData) =>
        set((state) => {
          const newFlow: ConnectivityFlow = {
            ...flowData,
            id: `flow-${uuidv4().slice(0, 8)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.flows.unshift(newFlow);
          state.selectedFlowId = newFlow.id;
          saveState(state as any);
        }),

      updateFlow: (id, flowData) =>
        set((state) => {
          const idx = state.flows.findIndex((f) => f.id === id);
          if (idx !== -1) {
            state.flows[idx] = {
              ...state.flows[idx],
              ...flowData,
              updatedAt: new Date().toISOString(),
            };
            saveState(state as any);
          }
        }),

      deleteFlow: (id) =>
        set((state) => {
          state.flows = state.flows.filter((f) => f.id !== id);
          if (state.selectedFlowId === id) state.selectedFlowId = state.flows[0]?.id || null;
          saveState(state as any);
        }),

      duplicateFlow: (id) =>
        set((state) => {
          const flow = state.flows.find((f) => f.id === id);
          if (flow) {
            const duplicated: ConnectivityFlow = {
              ...flow,
              id: `flow-${uuidv4().slice(0, 8)}`,
              name: `${flow.name}_Cópia`,
              status: 'Draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            state.flows.unshift(duplicated);
            state.selectedFlowId = duplicated.id;
            saveState(state as any);
          }
        }),

      updateFlowNodesEdges: (id, nodes, edges) =>
        set((state) => {
          const flow = state.flows.find((f) => f.id === id);
          if (flow) {
            flow.nodes = nodes;
            flow.edges = edges;
            flow.updatedAt = new Date().toISOString();
            saveState(state as any);
          }
        }),

      executeFlowSimulation: (id) => {
        const flow = get().flows.find((f) => f.id === id);
        if (!flow) return;

        const duration = Math.floor(Math.random() * 20) + 5;
        const newTraceId = `trace-${uuidv4().slice(0, 8)}`;

        const newTrace: ConnectivityMessageTrace = {
          id: newTraceId,
          flowId: flow.id,
          flowName: flow.name,
          timestamp: new Date().toISOString(),
          trigger: 'Execução Simulada Manual',
          totalDurationMs: duration,
          status: 'Success',
          steps: [
            {
              stepId: 'step-1',
              nodeName: 'Trigger Entrada',
              nodeType: 'Manual Trigger',
              payloadIn: { trigger: 'user_action', timestamp: new Date().toISOString() },
              payloadOut: { dataRaw: { temperature: 84.2, pressure: 3.4, status: 'NORMAL' } },
              durationMs: 2.1,
              status: 'Success',
              logMessage: 'Payload de entrada simulado capturado com sucesso.',
              timestamp: new Date().toISOString(),
            },
            {
              stepId: 'step-2',
              nodeName: 'Transformação & Filtro',
              nodeType: 'Transform',
              payloadIn: { dataRaw: { temperature: 84.2, pressure: 3.4, status: 'NORMAL' } },
              payloadOut: {
                transformed: true,
                temperatureCelsius: 84.2,
                pressureBar: 3.4,
                alertLevel: 'LOW',
              },
              durationMs: 1.5,
              status: 'Success',
              logMessage: 'Payload transformado e validado conforme schema.',
              timestamp: new Date().toISOString(),
            },
            {
              stepId: 'step-3',
              nodeName: 'Destino Final',
              nodeType: 'Output Connector',
              payloadIn: {
                transformed: true,
                temperatureCelsius: 84.2,
                pressureBar: 3.4,
                alertLevel: 'LOW',
              },
              payloadOut: { status: 'PERSISTED_OK', recordsInserted: 1 },
              durationMs: 3.4,
              status: 'Success',
              logMessage: 'Mensagem entregue com sucesso ao destino.',
              timestamp: new Date().toISOString(),
            },
          ],
        };

        set((state) => {
          const targetFlow = state.flows.find((f) => f.id === id);
          if (targetFlow) {
            targetFlow.executedCount += 1;
            targetFlow.lastExecutedAt = new Date().toISOString();
          }

          state.messageTraces.unshift(newTrace);
          state.selectedTraceId = newTraceId;

          state.logs.unshift({
            id: `log-${uuidv4().slice(0, 8)}`,
            timestamp: new Date().toISOString(),
            flowId: flow.id,
            flowName: flow.name,
            durationMs: duration,
            messageCount: 1,
            source: 'Simulador',
            destination: 'Destino Configurado',
            status: 'Success',
            severity: 'Info',
            triggeredBy: 'Manual Trigger',
            details: 'Execução de teste simulada executada sem erros.',
            traceId: newTraceId,
          });

          saveState(state as any);
        });
      },

      // Schedules
      addSchedule: (schedData) =>
        set((state) => {
          const newSched: ConnectivitySchedule = {
            ...schedData,
            id: `sched-${uuidv4().slice(0, 8)}`,
          };
          state.schedules.unshift(newSched);
          saveState(state as any);
        }),

      updateSchedule: (id, schedData) =>
        set((state) => {
          const idx = state.schedules.findIndex((s) => s.id === id);
          if (idx !== -1) {
            state.schedules[idx] = { ...state.schedules[idx], ...schedData };
            saveState(state as any);
          }
        }),

      deleteSchedule: (id) =>
        set((state) => {
          state.schedules = state.schedules.filter((s) => s.id !== id);
          saveState(state as any);
        }),

      toggleScheduleStatus: (id) =>
        set((state) => {
          const sched = state.schedules.find((s) => s.id === id);
          if (sched) {
            sched.status = sched.status === 'Active' ? 'Paused' : 'Active';
            saveState(state as any);
          }
        }),

      triggerScheduleNow: (id) => {
        const sched = get().schedules.find((s) => s.id === id);
        if (sched && sched.flowId) {
          get().executeFlowSimulation(sched.flowId);
          set((state) => {
            const target = state.schedules.find((s) => s.id === id);
            if (target) {
              target.lastRunAt = new Date().toISOString();
              target.runCount += 1;
              saveState(state as any);
            }
          });
        }
      },

      // Global Variables
      addGlobalVariable: (varData) =>
        set((state) => {
          const newVar: ConnectivityGlobalVariable = {
            ...varData,
            id: `gvar-${uuidv4().slice(0, 8)}`,
            updatedAt: new Date().toISOString(),
          };
          state.globalVariables.unshift(newVar);
          saveState(state as any);
        }),

      updateGlobalVariable: (id, varData) =>
        set((state) => {
          const idx = state.globalVariables.findIndex((v) => v.id === id);
          if (idx !== -1) {
            state.globalVariables[idx] = {
              ...state.globalVariables[idx],
              ...varData,
              updatedAt: new Date().toISOString(),
            };
            saveState(state as any);
          }
        }),

      deleteGlobalVariable: (id) =>
        set((state) => {
          state.globalVariables = state.globalVariables.filter((v) => v.id !== id);
          saveState(state as any);
        }),

      // Secrets
      addSecret: (secData) =>
        set((state) => {
          const newSec: ConnectivitySecret = {
            ...secData,
            id: `sec-${uuidv4().slice(0, 8)}`,
            lastRotatedAt: new Date().toISOString(),
          };
          state.secrets.unshift(newSec);
          saveState(state as any);
        }),

      updateSecret: (id, secData) =>
        set((state) => {
          const idx = state.secrets.findIndex((s) => s.id === id);
          if (idx !== -1) {
            state.secrets[idx] = { ...state.secrets[idx], ...secData };
            saveState(state as any);
          }
        }),

      deleteSecret: (id) =>
        set((state) => {
          state.secrets = state.secrets.filter((s) => s.id !== id);
          saveState(state as any);
        }),

      rotateSecret: (id) =>
        set((state) => {
          const sec = state.secrets.find((s) => s.id === id);
          if (sec) {
            sec.lastRotatedAt = new Date().toISOString();
            sec.status = 'Active';
            saveState(state as any);
          }
        }),

      // Mapping Rules
      addMappingRule: (ruleData) =>
        set((state) => {
          const newRule: ConnectivityMappingRule = {
            ...ruleData,
            id: `map-${uuidv4().slice(0, 8)}`,
            updatedAt: new Date().toISOString(),
          };
          state.mappingRules.unshift(newRule);
          saveState(state as any);
        }),

      updateMappingRule: (id, ruleData) =>
        set((state) => {
          const idx = state.mappingRules.findIndex((r) => r.id === id);
          if (idx !== -1) {
            state.mappingRules[idx] = {
              ...state.mappingRules[idx],
              ...ruleData,
              updatedAt: new Date().toISOString(),
            };
            saveState(state as any);
          }
        }),

      deleteMappingRule: (id) =>
        set((state) => {
          state.mappingRules = state.mappingRules.filter((r) => r.id !== id);
          saveState(state as any);
        }),

      toggleMappingRule: (id) =>
        set((state) => {
          const rule = state.mappingRules.find((r) => r.id === id);
          if (rule) {
            rule.enabled = !rule.enabled;
            rule.updatedAt = new Date().toISOString();
            saveState(state as any);
          }
        }),

      // Reset & Storage Utilities
      resetToSeedData: () =>
        set((state) => {
          state.connections = getInitialConnections();
          state.flows = getInitialFlows();
          state.messageTraces = getInitialMessageTraces();
          state.schedules = getInitialSchedules();
          state.logs = getInitialLogs();
          state.globalVariables = getInitialGlobalVariables();
          state.secrets = getInitialSecrets();
          state.mappingRules = getInitialMappingRules();
          state.selectedConnectionId = null;
          state.selectedFlowId = state.flows[0]?.id || null;
          state.selectedTraceId = state.messageTraces[0]?.id || null;
          saveState(state as any);
        }),

      exportStateJson: () => {
        const state = get();
        const payload = {
          connections: state.connections,
          flows: state.flows,
          messageTraces: state.messageTraces,
          schedules: state.schedules,
          logs: state.logs,
          globalVariables: state.globalVariables,
          secrets: state.secrets,
          mappingRules: state.mappingRules,
        };
        return JSON.stringify(payload, null, 2);
      },

      importStateJson: (jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr);
          set((state) => {
            if (Array.isArray(parsed.connections)) state.connections = parsed.connections;
            if (Array.isArray(parsed.flows)) state.flows = parsed.flows;
            if (Array.isArray(parsed.messageTraces)) state.messageTraces = parsed.messageTraces;
            if (Array.isArray(parsed.schedules)) state.schedules = parsed.schedules;
            if (Array.isArray(parsed.logs)) state.logs = parsed.logs;
            if (Array.isArray(parsed.globalVariables)) state.globalVariables = parsed.globalVariables;
            if (Array.isArray(parsed.secrets)) state.secrets = parsed.secrets;
            if (Array.isArray(parsed.mappingRules)) state.mappingRules = parsed.mappingRules;
            saveState(state as any);
          });
          return true;
        } catch (err) {
          console.error('Failed to import JSON data:', err);
          return false;
        }
      },
    };
  })
);
