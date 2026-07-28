import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Play,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Database,
  Send,
  Code,
  Workflow,
  Clock,
  Bell,
  Activity,
  Zap,
  Layers,
  StickyNote,
  Radio,
  Network,
  Cpu,
} from 'lucide-react';
import type { IndustrialNodeType } from '../../../types/flow';
import { cn } from '../../../utils/cn';

interface PaletteItem {
  id: string;
  type: string;
  industrialType?: IndustrialNodeType;
  name: string;
  category: string;
  description: string;
  icon: any;
  colorClass: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Core BPMN
  { id: 'bpmn_start', type: 'start', name: 'Início do Processo', category: 'Core BPMN', description: 'Ponto de partida do fluxo', icon: Play, colorClass: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'bpmn_end', type: 'end', name: 'Fim do Processo', category: 'Core BPMN', description: 'Término da execução', icon: CheckCircle2, colorClass: 'text-rose-500 bg-rose-500/10' },
  { id: 'bpmn_gw_excl', type: 'gateway_exclusive', name: 'Decisão Exclusiva (XOR)', category: 'Core BPMN', description: 'Desvio condicional True/False', icon: HelpCircle, colorClass: 'text-amber-500 bg-amber-500/10' },
  { id: 'bpmn_gw_par', type: 'gateway_parallel', name: 'Gateway Paralelo (AND)', category: 'Core BPMN', description: 'Divisão ou junção de ramos em paralelo', icon: ArrowRight, colorClass: 'text-sky-500 bg-sky-500/10' },

  // Leitura & Escrita Industrial
  { id: 'ind_read_prop', type: 'read_property', industrialType: 'read_property', name: 'Ler Propriedade', category: 'Leitura & Escrita', description: 'Obtém valor de propriedade de um objeto', icon: Database, colorClass: 'text-sky-500 bg-sky-500/10' },
  { id: 'ind_write_prop', type: 'write_property', industrialType: 'write_property', name: 'Escrever Propriedade', category: 'Leitura & Escrita', description: 'Atribui novo valor para propriedade de objeto', icon: Send, colorClass: 'text-amber-500 bg-amber-500/10' },
  { id: 'ind_read_opc', type: 'read_property', industrialType: 'read_property', name: 'Ler OPC Simulado', category: 'Leitura & Escrita', description: 'Lê dados de servidor OPC DA/UA', icon: Network, colorClass: 'text-emerald-500 bg-emerald-500/10' },

  // Lógica & Condição
  { id: 'ind_compare', type: 'compare_variable', industrialType: 'compare_variable', name: 'Comparar Variável', category: 'Lógica & Condição', description: 'Avalia expressões >, <, ==, !=, AND, OR', icon: HelpCircle, colorClass: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'ind_expr', type: 'execute_expression', industrialType: 'execute_expression', name: 'Executar Expressão', category: 'Lógica & Condição', description: 'Cálculo matemático ou condicional', icon: Cpu, colorClass: 'text-teal-500 bg-teal-500/10' },

  // Automação & Scripts
  { id: 'ind_script', type: 'execute_script', industrialType: 'execute_script', name: 'Executar Script', category: 'Automação & Scripts', description: 'Executa código TypeScript/JavaScript customizado', icon: Code, colorClass: 'text-purple-500 bg-purple-500/10' },
  { id: 'ind_subflow', type: 'call_flowchart', industrialType: 'call_flowchart', name: 'Executar Sub-Fluxo', category: 'Automação & Scripts', description: 'Chama outro fluxograma como subprocesso', icon: Workflow, colorClass: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'ind_timer', type: 'timer', industrialType: 'timer', name: 'Temporizador / Delay', category: 'Automação & Scripts', description: 'Pausa execução por tempo configurado', icon: Clock, colorClass: 'text-cyan-500 bg-cyan-500/10' },

  // Alarmes & Eventos
  { id: 'ind_wait_alarm', type: 'wait_alarm', industrialType: 'wait_alarm', name: 'Aguardar Alarme', category: 'Alarmes & Eventos', description: 'Espera ativação ou reconhecimento de alarme', icon: Bell, colorClass: 'text-rose-500 bg-rose-500/10' },
  { id: 'ind_ack_alarm', type: 'ack_alarm', industrialType: 'ack_alarm', name: 'Reconhecer Alarme', category: 'Alarmes & Eventos', description: 'Reconhece alarme ativo no sistema', icon: Bell, colorClass: 'text-red-500 bg-red-500/10' },
  { id: 'ind_event', type: 'raise_event', industrialType: 'raise_event', name: 'Criar Evento System', category: 'Alarmes & Eventos', description: 'Dispara evento no Event Engine', icon: Zap, colorClass: 'text-orange-500 bg-orange-500/10' },

  // Integração & Banco
  { id: 'ind_history', type: 'query_history', industrialType: 'query_history', name: 'Consultar Historian', category: 'Integração & Banco', description: 'Consulta dados históricos de processo', icon: Activity, colorClass: 'text-violet-500 bg-violet-500/10' },
  { id: 'ind_sql', type: 'query_history', industrialType: 'query_history', name: 'Consulta SQL Simulada', category: 'Integração & Banco', description: 'Executa query SQL em banco relacional', icon: Database, colorClass: 'text-blue-500 bg-blue-500/10' },
  { id: 'ind_rest', type: 'execute_script', industrialType: 'execute_script', name: 'Chamada REST Simulada', category: 'Integração & Banco', description: 'Requisição HTTP/REST GET/POST', icon: Network, colorClass: 'text-sky-500 bg-sky-500/10' },
  { id: 'ind_mqtt', type: 'raise_event', industrialType: 'raise_event', name: 'Publicar MQTT Simulado', category: 'Integração & Banco', description: 'Publica mensagem em broker MQTT', icon: Radio, colorClass: 'text-emerald-500 bg-emerald-500/10' },

  // Organização & Notas
  { id: 'ind_container', type: 'container', name: 'Contêiner de Área', category: 'Contêineres & Notas', description: 'Agrupa visualmente uma área do processo', icon: Layers, colorClass: 'text-sky-500 bg-sky-500/10' },
  { id: 'ind_sticky', type: 'sticky_note', name: 'Nota Adesiva', category: 'Contêineres & Notas', description: 'Insere comentários e documentação visual', icon: StickyNote, colorClass: 'text-amber-500 bg-amber-500/10' },
];

interface FlowV2PaletteProps {
  onAddNode: (type: string, name: string, industrialType?: IndustrialNodeType) => void;
}

export const FlowV2Palette: React.FC<FlowV2PaletteProps> = ({ onAddNode }) => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['ind_read_prop', 'ind_write_prop', 'ind_compare']);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Core BPMN': true,
    'Leitura & Escrita': true,
    'Lógica & Condição': true,
    'Automação & Scripts': true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const categories = Array.from(new Set(PALETTE_ITEMS.map((item) => item.category)));

  const filteredItems = PALETTE_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('application/reactflow-type', item.type);
    e.dataTransfer.setData('application/reactflow-name', item.name);
    if (item.industrialType) {
      e.dataTransfer.setData('application/reactflow-industrial', item.industrialType);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col h-full shrink-0 select-none">
      {/* Top Search Input */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar blocos & nós..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
      </div>

      {/* Palette Body Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Favorites section if search empty */}
        {!search && favorites.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>Favoritos</span>
            </h4>

            <div className="space-y-1">
              {PALETTE_ITEMS.filter((i) => favorites.includes(i.id)).map((item) => (
                <div
                  key={`fav_${item.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => onAddNode(item.type, item.name, item.industrialType)}
                  className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-grab active:cursor-grabbing transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', item.colorClass)}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories list */}
        {categories.map((cat) => {
          const itemsInCat = filteredItems.filter((i) => i.category === cat);
          if (itemsInCat.length === 0) return null;
          const isOpen = openCategories[cat] ?? true;

          return (
            <div key={cat} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span>{cat}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {isOpen && (
                <div className="space-y-1">
                  {itemsInCat.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => onAddNode(item.type, item.name, item.industrialType)}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 hover:border-sky-500/50 hover:shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-grab active:cursor-grabbing transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-800/50', item.colorClass)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-slate-900 dark:text-slate-100">{item.name}</span>
                          <span className="block text-[9px] text-slate-400 font-normal truncate">{item.description}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 transition-all"
                      >
                        <Star className={cn('w-3.5 h-3.5', favorites.includes(item.id) && 'text-amber-500 fill-current opacity-100')} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
