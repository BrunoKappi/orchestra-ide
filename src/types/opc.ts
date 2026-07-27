export type OpcNodeType =
  | 'server_ua'
  | 'server_da'
  | 'controller'
  | 'plc'
  | 'device'
  | 'area'
  | 'equipment'
  | 'folder'
  | 'tag';

export type OpcDataType = 'Float' | 'Integer' | 'Boolean' | 'String';

export type OpcQuality = 'Good' | 'Bad' | 'Uncertain' | 'Communication Lost';

export interface OpcNodeEntity {
  id: string;
  name: string;
  type: OpcNodeType;
  parentId: string | null;
  path: string; // Full hierarchical path, e.g., "Refinery.PLC_01.SectionA.TE_101"
  dataType?: OpcDataType;
  value?: string;
  quality?: OpcQuality;
  timestamp?: string; // ISO string
  engineeringUnit?: string; // e.g. "°C", "bar", "m³/h", "%"
  updateFrequencyMs?: number; // e.g. 1000, 2000, 5000
  description?: string;
  isFavorite?: boolean;
}

export interface OpcConnectorInterface {
  connect: (serverId: string) => Promise<boolean>;
  disconnect: (serverId: string) => Promise<boolean>;
  readTag: (tagPath: string) => Promise<{ value: string; quality: OpcQuality; timestamp: string }>;
  writeTag: (tagPath: string, value: string) => Promise<boolean>;
}
