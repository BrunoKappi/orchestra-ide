import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Shapes, Activity, Monitor, Zap, Bell, TrendingUp, Workflow,
  ArrowLeftRight, Network, Shield, LayoutGrid, History, Database,
  ArrowUpRight
} from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useOmmStore } from '../features/omm/store/useOmmStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { alarmEvents } = useObjectModelStore();
  const { movements } = useOmmStore();

  const activeUnackCount = (alarmEvents || []).filter(
    (evt) => evt.status === 'Active Unacknowledged'
  ).length;

  const activeMovementsCount = (movements || []).filter(
    (m) => m.status === 'Active'
  ).length;

  const modules = useMemo(() => [
    {
      to: '/orchestra',
      label: 'Orquestra IDE',
      desc: 'Modelagem integrada de templates, objetos e variáveis de equipamentos industriais.',
      icon: Cpu,
      color: 'from-sky-500 to-indigo-500 hover:shadow-sky-500/10',
    },
    {
      to: '/widgets',
      label: 'Widgets Designer',
      desc: 'Criação e edição de elementos gráficos industriais premium baseados em SVG.',
      icon: Shapes,
      color: 'from-emerald-500 to-teal-500 hover:shadow-emerald-500/10',
    },
    {
      to: '/flows',
      label: 'Fluxogramas',
      desc: 'Criação de lógica de processos por meio de fluxogramas interativos e conexões dinâmicas.',
      icon: Workflow,
      color: 'from-blue-500 to-cyan-500 hover:shadow-blue-500/10',
    },
    {
      to: '/simulator',
      label: 'Simulador Global',
      desc: 'Painel central para forçar, simular ruídos e testar regras em tempo real.',
      icon: Activity,
      color: 'from-sky-500 to-cyan-500 hover:shadow-sky-500/10',
    },
    {
      to: '/screens',
      label: 'Designer de Telas',
      desc: 'Construção visual de sinóticos com arrastar-e-soltar e bindings de animação.',
      icon: Monitor,
      color: 'from-violet-500 to-purple-500 hover:shadow-violet-500/10',
    },
    {
      to: '/runtime',
      label: 'Runtime Sinótico',
      desc: 'Execução operacional e supervisão das telas sinópticas criadas.',
      icon: Zap,
      color: 'from-amber-500 to-orange-500 hover:shadow-amber-500/10',
    },
    {
      to: '/alarms',
      label: 'Central de Alarmes',
      desc: 'Visualização de alarmes de processo ativos, reconhecimento e auditoria.',
      icon: Bell,
      color: 'from-rose-500 to-red-500 hover:shadow-rose-500/10',
      badge: activeUnackCount > 0 ? activeUnackCount : undefined,
    },
    {
      to: '/historian',
      label: 'Historian',
      desc: 'Tendências e históricos temporais sob demanda com gráficos interativos.',
      icon: TrendingUp,
      color: 'from-violet-500 to-indigo-500 hover:shadow-violet-500/10',
    },
    {
      to: '/omm',
      label: 'OMM (Order Movement)',
      desc: 'Gerenciador de movimentações, planta operacional e alinhamentos de dutos.',
      icon: ArrowLeftRight,
      color: 'from-sky-500 to-indigo-650 hover:shadow-sky-500/10',
      badge: activeMovementsCount > 0 ? activeMovementsCount : undefined,
    },
    {
      to: '/opc-browser',
      label: 'OPC Network Browser',
      desc: 'Mapeador e visualizador de rede de tags e servidores virtuais OPC.',
      icon: Network,
      color: 'from-sky-500 to-teal-500 hover:shadow-sky-500/10',
    },
    {
      to: '/connectivity',
      label: 'Connectivity Studio',
      desc: 'Estúdio para integrar fontes OPC UA/DA e gerenciar drivers de comunicação.',
      icon: Network,
      color: 'from-emerald-500 to-teal-600 hover:shadow-emerald-500/10',
    },
    {
      to: '/security',
      label: 'Segurança & Perfis',
      desc: 'Configurações de usuários, controle de permissões por perfil e logs de acessos.',
      icon: Shield,
      color: 'from-indigo-500 to-violet-650 hover:shadow-indigo-500/10',
    },
    {
      to: '/grid-dashboard',
      label: 'Grid Designer',
      desc: 'Dashboard dinâmico e flexível com grade modular de telemetria.',
      icon: LayoutGrid,
      color: 'from-amber-500 to-yellow-600 hover:shadow-amber-500/10',
    },
    {
      to: '/logs',
      label: 'Logs e Rastreabilidade',
      desc: 'Registro completo de eventos de runtime, modificações de engenharia e trilha.',
      icon: History,
      color: 'from-slate-500 to-slate-650 hover:shadow-slate-500/10',
    },
    {
      to: '/database-analytics',
      label: 'Database & Performance',
      desc: 'Métricas de consumo de LocalStorage, CPU e RAM com análise gráfica.',
      icon: Database,
      color: 'from-indigo-600 to-purple-650 hover:shadow-indigo-500/10',
    },
  ], [activeUnackCount, activeMovementsCount]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <HeaderNavigation />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Modules Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <div
                key={m.to}
                onClick={() => navigate(m.to)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Glow Effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-sky-500/0 rounded-full translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top Row: Icon and Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-sm transition-transform group-hover:scale-105 duration-300`}>
                      <m.icon className="w-5 h-5" />
                    </div>
                    
                    {m.badge !== undefined ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold animate-pulse">
                        {m.badge} ativo{m.badge > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    )}
                  </div>

                  {/* Text Details */}
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                    {m.label}
                  </h4>
                  
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
