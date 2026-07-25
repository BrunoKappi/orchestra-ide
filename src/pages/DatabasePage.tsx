import React, { useState, useEffect } from 'react';
import {
  Search,
  Database,
  Trash2,
  Download,
  Copy,
  Plus,
  RefreshCw,
  FileCode,
  Table,
  Check,
  AlertCircle,
  HelpCircle,
  HardDrive
} from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { STORAGE_KEYS } from '../repository/storageKey';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useWidgetStore } from '../store/useWidgetStore';
import { useScreenStore } from '../store/useScreenStore';
import { cn } from '../utils/cn';

interface DbTable {
  id: string;
  name: string;
  key: string;
  description: string;
}

const DB_TABLES: DbTable[] = [
  {
    id: 'templates',
    name: 'Modelos (Templates)',
    key: STORAGE_KEYS.TEMPLATES,
    description: 'Modelos de objetos industriais que definem a herança de propriedades e scripts.'
  },
  {
    id: 'objects',
    name: 'Instâncias (Objects)',
    key: STORAGE_KEYS.OBJECTS,
    description: 'Instâncias criadas a partir de templates que rodam no ambiente físico/lógico.'
  },
  {
    id: 'properties',
    name: 'Propriedades de Objetos',
    key: STORAGE_KEYS.PROPERTIES,
    description: 'Atributos e variáveis pertencentes a cada template ou instância.'
  },
  {
    id: 'scripts',
    name: 'Scripts de Automação',
    key: STORAGE_KEYS.SCRIPTS,
    description: 'Lógicas de execução associadas a eventos das variáveis nos modelos.'
  },
  {
    id: 'deployment_folders',
    name: 'Pastas de Deployment',
    key: STORAGE_KEYS.DEPLOYMENT_FOLDERS,
    description: 'Estrutura hierárquica de pastas organizacionais da planta para o runtime.'
  },
  {
    id: 'deployment_nodes',
    name: 'Nós de Deployment',
    key: STORAGE_KEYS.DEPLOYMENT_NODES,
    description: 'Mapeamentos de associação dos objetos para as respectivas pastas de deploy.'
  },
  {
    id: 'widgets',
    name: 'Componentes Gráficos (Widgets)',
    key: STORAGE_KEYS.WIDGETS,
    description: 'Biblioteca de widgets gráficos reutilizáveis para construção de IHMs.'
  },
  {
    id: 'widget_folders',
    name: 'Pastas de Componentes',
    key: STORAGE_KEYS.WIDGET_FOLDERS,
    description: 'Pastas organizacionais para catalogar os componentes gráficos.'
  },
  {
    id: 'widget_nodes',
    name: 'Nós de Componentes',
    key: STORAGE_KEYS.WIDGET_NODES,
    description: 'Associação dos widgets na árvore de diretório do painel de componentes.'
  },
  {
    id: 'associated_widgets',
    name: 'Mapeamento de Variáveis',
    key: STORAGE_KEYS.ASSOCIATED_WIDGETS,
    description: 'Associação de elementos dinâmicos e variáveis físicas a widgets em telas.'
  },
  {
    id: 'mock_configs',
    name: 'Simulações de Sensores (Mock)',
    key: STORAGE_KEYS.MOCK_CONFIGS,
    description: 'Configurações de geradores de ondas (senoide, ruído, rampa) para variáveis simuladas.'
  },
  {
    id: 'alarm_events',
    name: 'Histórico e Ocorrências de Alarmes',
    key: (STORAGE_KEYS as any).ALARM_EVENTS,
    description: 'Histórico e status de todos os eventos de alarme gerados nas variáveis do sistema.'
  },
  {

    id: 'simulator_settings',
    name: 'Configurações Globais do Simulador',
    key: STORAGE_KEYS.SIMULATOR_SETTINGS,
    description: 'Configurações globais de velocidade de tick e status do simulador em runtime.'
  },
  {
    id: 'screens',
    name: 'Telas Operacionais',
    key: STORAGE_KEYS.SCREENS,
    description: 'Telas sinóticas criadas no Designer com elementos estáticos e dinâmicos.'
  },
  {
    id: 'screen_folders',
    name: 'Pastas de Telas',
    key: STORAGE_KEYS.SCREEN_FOLDERS,
    description: 'Estrutura de pastas da árvore do Designer de Telas.'
  },
  {
    id: 'screen_nodes',
    name: 'Nós de Telas',
    key: STORAGE_KEYS.SCREEN_NODES,
    description: 'Nós que posicionam telas e subpastas de forma ordenada na árvore do Designer.'
  },
  {
    id: 'seeded',
    name: 'Configuração de Seed',
    key: STORAGE_KEYS.SEEDED,
    description: 'Flag interna indicando se os dados de exemplo iniciais foram injetados.'
  }
];

export const DatabasePage: React.FC = () => {
  const [selectedTableId, setSelectedTableId] = useState<string>('templates');
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [searchDataQuery, setSearchDataQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid');
  
  // Table Data State
  const [tableItems, setTableItems] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  
  // Copy and Injection States
  const [copied, setCopied] = useState<boolean>(false);
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);
  const [injectJson, setInjectJson] = useState<string>('');
  const [injectError, setInjectError] = useState<string | null>(null);

  // Load and refresh counts
  const refreshData = () => {
    const counts: Record<string, number> = {};
    DB_TABLES.forEach((table) => {
      try {
        const raw = localStorage.getItem(table.key);
        if (raw) {
          const parsed = JSON.parse(raw);
          counts[table.id] = Array.isArray(parsed) ? parsed.length : 1;
        } else {
          counts[table.id] = 0;
        }
      } catch {
        counts[table.id] = 0;
      }
    });
    setTableCounts(counts);

    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (activeTable) {
      try {
        const raw = localStorage.getItem(activeTable.key);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTableItems(Array.isArray(parsed) ? parsed : [parsed]);
        } else {
          setTableItems([]);
        }
      } catch {
        setTableItems([]);
      }
    }
    setSelectedRow(null);
  };

  useEffect(() => {
    refreshData();
  }, [selectedTableId]);

  // Sync state stores back to runtime on any db changes
  const syncStores = () => {
    useObjectModelStore.getState().init();
    useWidgetStore.getState().init();
    useScreenStore.getState().init();
    refreshData();
  };

  // Copy raw JSON to clipboard
  const handleCopyJson = () => {
    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (!activeTable) return;
    const raw = localStorage.getItem(activeTable.key) || '[]';
    navigator.clipboard.writeText(JSON.stringify(JSON.parse(raw), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON file
  const handleExportTable = () => {
    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (!activeTable) return;
    const raw = localStorage.getItem(activeTable.key) || '[]';
    const blob = new Blob([JSON.stringify(JSON.parse(raw), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTable.id}_table.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear/Truncate Table
  const handleTruncateTable = () => {
    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (!activeTable) return;
    if (window.confirm(`Tem certeza de que deseja limpar (TRUNCATE) a tabela "${activeTable.name}"? Isso apagará todos os dados salvos!`)) {
      if (activeTable.key === STORAGE_KEYS.SEEDED) {
        localStorage.setItem(activeTable.key, 'false');
      } else {
        localStorage.setItem(activeTable.key, '[]');
      }
      syncStores();
    }
  };

  // Open inject panel and pre-fill structure
  const handleOpenInject = () => {
    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (!activeTable) return;

    let templateObj: any = { id: 'uuid-gerado-automaticamente' };
    if (tableItems.length > 0) {
      // Deep copy first element and generate a new ID to use as starting template
      templateObj = JSON.parse(JSON.stringify(tableItems[0]));
      if (templateObj.id) {
        templateObj.id = crypto.randomUUID ? crypto.randomUUID() : 'novo-id-injetado-' + Math.floor(Math.random() * 10000);
      }
      if (templateObj.name) {
        templateObj.name = templateObj.name + ' (Injected Copy)';
      }
    } else {
      // Basic defaults based on key types
      if (selectedTableId === 'templates') {
        templateObj = { id: 'new-template-id', name: 'Novo Template', parentTemplateId: null, description: 'Descricao do template' };
      } else if (selectedTableId === 'objects') {
        templateObj = { id: 'new-object-id', templateId: 'template-id', name: 'Nova Instancia', description: 'Descricao da instancia', isDeployed: true };
      } else if (selectedTableId === 'properties') {
        templateObj = { id: 'new-prop-id', entityId: 'object-or-template-id', entityType: 'instance', name: 'temperatura', dataType: 'Float', defaultValue: '25.0', description: 'Sensor de Temp' };
      }
    }

    setInjectJson(JSON.stringify(templateObj, null, 2));
    setInjectError(null);
    setShowInjectModal(true);
  };

  // Submit dynamic data injection
  const handleInjectData = () => {
    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (!activeTable) return;

    try {
      const parsed = JSON.parse(injectJson);
      const raw = localStorage.getItem(activeTable.key);
      let list = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(list)) {
        list = [list];
      }

      if (Array.isArray(parsed)) {
        list.push(...parsed);
      } else {
        list.push(parsed);
      }

      localStorage.setItem(activeTable.key, JSON.stringify(list));
      syncStores();
      setShowInjectModal(false);
      setInjectError(null);
    } catch (e: any) {
      setInjectError('Formato JSON Inválido: ' + e.message);
    }
  };

  // Delete individual row
  const handleDeleteRow = (index: number) => {
    const activeTable = DB_TABLES.find((t) => t.id === selectedTableId);
    if (!activeTable) return;
    if (window.confirm('Tem certeza de que deseja excluir este registro específico?')) {
      const newList = [...tableItems];
      newList.splice(index, 1);
      localStorage.setItem(activeTable.key, JSON.stringify(newList));
      syncStores();
    }
  };

  const selectedTable = DB_TABLES.find((t) => t.id === selectedTableId);

  // Filter tables
  const filteredTables = DB_TABLES.filter((t) =>
    t.name.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
    t.key.toLowerCase().includes(searchTableQuery.toLowerCase())
  );

  // Filter records
  const filteredItems = tableItems.filter((item) => {
    if (!searchDataQuery) return true;
    const strVal = JSON.stringify(item).toLowerCase();
    return strVal.includes(searchDataQuery.toLowerCase());
  });

  // Calculate size of selected table in KB
  const getTableSizeKb = () => {
    if (!selectedTable) return '0.00';
    const raw = localStorage.getItem(selectedTable.key) || '';
    const bytes = new Blob([raw]).size;
    return (bytes / 1024).toFixed(2);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Database className="w-3.5 h-3.5 text-cyan-500" />
              <span>Tabelas no LocalStorage</span>
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tabelas..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none">
            {filteredTables.map((table) => {
              const count = tableCounts[table.id] ?? 0;
              const isSelected = selectedTableId === table.id;

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={cn(
                    'group flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150',
                    isSelected
                      ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-semibold border-l-2 border-cyan-500'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/55'
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{table.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono truncate">{table.key}</span>
                  </div>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0',
                    count > 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30'
                      : 'bg-slate-100 dark:bg-slate-850 text-slate-400'
                  )}>
                    {count}
                  </span>
                </div>
              );
            })}

            {filteredTables.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Nenhuma tabela encontrada.
              </div>
            )}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 flex flex-col bg-slate-100/40 dark:bg-slate-950/15 overflow-hidden">
          {selectedTable ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Header Info */}
              <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-2xs select-none shrink-0">
                <div className="min-w-[300px] flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-850 dark:text-slate-200">
                      {selectedTable.name}
                    </h2>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {selectedTable.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedTable.description}
                  </p>
                </div>

                {/* Operations Toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenInject}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    title="Injetar Mock no LocalStorage"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    <span>Injetar Registro</span>
                  </button>

                  <button
                    onClick={handleExportTable}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Exportar Tabela como JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar</span>
                  </button>

                  <button
                    onClick={handleTruncateTable}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Limpar Tabela (Truncate)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Truncar</span>
                  </button>

                  <button
                    onClick={refreshData}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                    title="Recarregar dados"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Database Stats Bar */}
              <div className="p-3 grid grid-cols-4 gap-3 shrink-0 select-none">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/5 text-cyan-500">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Registros</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{tableItems.length}</strong>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tamanho da Tabela</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">{getTableSizeKb()} KB</strong>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 dark:bg-violet-500/5 text-violet-500">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Storage Engine</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">LocalStorage</strong>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-amber-500">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Formato dos Registros</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">JSON Array</strong>
                  </div>
                </div>
              </div>

              {/* Table / View Settings Bar */}
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar registros na listagem..."
                    value={searchDataQuery}
                    onChange={(e) => setSearchDataQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* View switcher buttons */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-850 text-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150 cursor-pointer',
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Visualizador de Registros</span>
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150 cursor-pointer',
                      viewMode === 'json'
                        ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON Completo</span>
                  </button>
                </div>
              </div>

              {/* Data Viewer Body */}
              <div className="flex-1 overflow-hidden p-4 flex gap-4">
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid List View */}
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto shadow-2xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none sticky top-0 z-10">
                            <th className="py-2.5 px-4">#</th>
                            <th className="py-2.5 px-4">ID / Identificador</th>
                            <th className="py-2.5 px-4">Dados (JSON Resumido)</th>
                            <th className="py-2.5 px-4 w-24 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                          {filteredItems.map((item, index) => {
                            const isRowSelected = selectedRow === item;
                            const itemId = item.id || item.key || `index_${index}`;
                            
                            // Format brief description of the object
                            const displayFields = { ...item };
                            delete displayFields.id;
                            delete displayFields.key;
                            const briefJson = JSON.stringify(displayFields);
                            const truncatedBrief = briefJson.length > 80 ? briefJson.slice(0, 80) + '...' : briefJson;

                            return (
                              <tr
                                key={index}
                                onClick={() => setSelectedRow(item)}
                                className={cn(
                                  'hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors cursor-pointer',
                                  isRowSelected && 'bg-cyan-500/5 text-cyan-800 dark:text-cyan-400 font-semibold'
                                )}
                              >
                                <td className="py-3 px-4 text-slate-400 font-mono">{index + 1}</td>
                                <td className="py-3 px-4 font-semibold font-mono truncate max-w-[160px]" title={itemId}>
                                  {itemId}
                                </td>
                                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono truncate max-w-lg" title={briefJson}>
                                  {truncatedBrief}
                                </td>
                                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleDeleteRow(index)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                                    title="Excluir Registro"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {filteredItems.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500 italic">
                                Nenhum registro encontrado para a tabela selecionada.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Detailed Row JSON Inspector sidebar */}
                    {selectedRow && (
                      <div className="w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                            Detalhe do Registro
                          </h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="p-1 text-slate-400 hover:text-sky-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-normal border border-slate-850 select-text">
                          {JSON.stringify(selectedRow, null, 2)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Full raw JSON display page */
                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-cyan-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Estrutura JSON Completa no LocalStorage</span>
                      </div>
                      <button
                        onClick={handleCopyJson}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-semibold transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado para Clipboard' : 'Copiar Tudo'}</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto bg-slate-950 text-slate-300 p-4 rounded-lg font-mono text-xs whitespace-pre leading-relaxed border border-slate-850 select-text">
                      {JSON.stringify(tableItems, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Welcome State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
              <Database className="w-12 h-12 text-cyan-500 animate-pulse mb-4" />
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Selecione uma Tabela de Dados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Escolha uma das tabelas de armazenamento do LocalStorage no menu esquerdo para gerenciar, editar e injetar informações.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Inject Data Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 w-[550px] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                  Simular Injeção de Dados: {selectedTable?.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Inserindo em {selectedTable?.key}
                </p>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center gap-2 p-3 bg-cyan-500/5 dark:bg-cyan-950/10 border border-cyan-100 dark:border-cyan-950/30 rounded-lg text-[11px] text-cyan-700 dark:text-cyan-400 leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 text-cyan-500" />
                <span>
                  Edite a estrutura JSON abaixo para injetar um novo registro. Ao confirmar, o objeto será anexado ao array de armazenamento e todas as views sincronizarão automaticamente.
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conteúdo JSON do Registro</label>
                <textarea
                  value={injectJson}
                  onChange={(e) => {
                    setInjectJson(e.target.value);
                    if (injectError) setInjectError(null);
                  }}
                  rows={14}
                  className="w-full font-mono text-xs p-3 bg-slate-950 text-slate-350 dark:text-emerald-400 border border-slate-200 dark:border-slate-850 rounded-lg outline-none focus:border-cyan-500 select-text"
                />
              </div>

              {injectError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 rounded-lg text-xs text-rose-600 dark:text-rose-400 font-semibold select-text">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{injectError}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowInjectModal(false)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleInjectData}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Injetar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="h-6 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              LocalStorage Database Explorer Active
            </span>
          </div>
          <span>Tamanho Total do Cache: <strong className="text-slate-600 dark:text-slate-300">{(new Blob([Object.values(localStorage).join('')]).size / 1024).toFixed(1)} KB</strong></span>
        </div>
        <span>Orquestra Database Admin Tool v1.0</span>
      </footer>
    </div>
  );
};

