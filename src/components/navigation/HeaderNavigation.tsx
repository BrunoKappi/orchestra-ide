import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Cpu,
  Shapes,
  Activity,
  Sun,
  Moon,
  RotateCcw,
  Monitor,
  Zap,
  Bell,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Workflow,
  AlertTriangle,
  ArrowLeftRight,
  Network,
  Shield,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

import { useSecurityStore } from "../../store/useSecurityStore";

import { useObjectModelStore } from "../../store/useObjectModelStore";
import { useWidgetStore } from "../../store/useWidgetStore";
import { useScreenStore } from "../../store/useScreenStore";
import { useFlowStore } from "../../store/useFlowStore";
import { useOpcStore } from "../../store/useOpcStore";
import { Modal } from "../ui/Modal";
import { cn } from "../../utils/cn";

export const HeaderNavigation = () => {
  const { theme, toggleTheme, alarmEvents } = useObjectModelStore();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("archestra_navbar_collapsed") === "true";
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetMockConfirmOpen, setIsResetMockConfirmOpen] = useState(false);

  const activeUnackCount = (alarmEvents || []).filter(
    (evt) => evt.status === "Active Unacknowledged",
  ).length;

  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    {
      to: "/",
      label: "Orquestra IDE",
      icon: Cpu,
      colorClass: "text-sky-500",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/widgets",
      label: "Widgets",
      icon: Shapes,
      colorClass: "text-emerald-500",
      activeTextClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      to: "/flows",
      label: "Fluxogramas",
      icon: Workflow,
      colorClass: "text-sky-500",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/simulator",
      label: "Simulador",
      icon: Activity,
      colorClass: "text-sky-500",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/screens",
      label: "Telas",
      icon: Monitor,
      colorClass: "text-violet-500",
      activeTextClass: "text-violet-600 dark:text-violet-400",
    },
    {
      to: "/runtime",
      label: "Runtime",
      icon: Zap,
      colorClass: "text-amber-500",
      activeTextClass: "text-amber-600 dark:text-amber-400",
    },
    {
      to: "/alarms",
      label: "Alarmes",
      icon: Bell,
      colorClass: "text-rose-500",
      activeTextClass: "text-rose-600 dark:text-rose-455",
      badge: activeUnackCount > 0 ? activeUnackCount : undefined,
      animate: activeUnackCount > 0 ? "animate-bounce" : undefined,
    },
    {
      to: "/historian",
      label: "Historian",
      icon: TrendingUp,
      colorClass: "text-violet-500",
      activeTextClass: "text-violet-600 dark:text-violet-400",
    },
    {
      to: "/omm",
      label: "OMM",
      icon: ArrowLeftRight,
      colorClass: "text-sky-500",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/opc-browser",
      label: "OPC Browser",
      icon: Network,
      colorClass: "text-sky-455",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/connectivity",
      label: "Connectivity Studio",
      icon: Network,
      colorClass: "text-emerald-500",
      activeTextClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      to: "/security",
      label: "Usuários e Segurança",
      icon: Shield,
      colorClass: "text-sky-500",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/grid-dashboard",
      label: "Grid Designer",
      icon: LayoutGrid,
      colorClass: "text-amber-500",
      activeTextClass: "text-amber-600 dark:text-amber-400",
    },
  ];

  const currentPath = location.pathname;
  const activeItem =
    navItems.find((item) => {
      if (item.to === "/") {
        return currentPath === "/";
      }
      return currentPath.startsWith(item.to);
    }) || navItems[0];

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (isCollapsed) {
    return (
      <div className="absolute top-2 right-4 z-40">
        <button
          onClick={() => {
            setIsCollapsed(false);
            localStorage.setItem("archestra_navbar_collapsed", "false");
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md transition-all flex items-center gap-1.5 text-[11px] font-semibold select-none cursor-pointer"
          title="Expandir Barra de Menu">
          <ChevronDown className="w-4 h-4 text-sky-500 animate-bounce" />
          <span>Menu</span>
          {activeUnackCount > 0 && (
            <span className="px-1.5 py-0.1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold select-none shrink-0 animate-pulse">
              {activeUnackCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleResetMockData = () => {
    setIsResetMockConfirmOpen(true);
  };

  const executeWipeAllData = () => {
    useObjectModelStore.getState().clearAllData();
    useWidgetStore.getState().clearAllData();
    useScreenStore.getState().clearAllData();
    useFlowStore.getState().clearAllData();
    useSecurityStore.getState().clearAllData();
    // Clear OMM-specific namespace
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('omm_v2') || key === 'grid_dashboard_layout')) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setIsResetConfirmOpen(false);
  };

  const executeResetMockData = () => {
    // Full reset: clear everything including OMM namespace, then reseed
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('omm_v2')) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('grid_dashboard_layout');
    useObjectModelStore.getState().resetAllData();
    useOpcStore.getState().init();
    useWidgetStore.getState().init();
    useScreenStore.getState().init();
    useFlowStore.getState().init();
    setIsResetMockConfirmOpen(false);
  };

  return (
    <header className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-2xs z-30 select-none">
      {/* Route Tabs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 select-none shrink-0">
          <img
            src="/SerranoIcon.png"
            alt="Serrano Logo"
            className="w-7 h-7 object-contain"
          />
          <span className="text-base font-bold text-gray-600 dark:text-slate-100 tracking-wide">
            Serrano Automação
          </span>
        </div>
        {/* Navigation Route Switches */}
        <div ref={dropdownRef} className="relative z-50">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[180px] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200/80 dark:border-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all select-none cursor-pointer">
            <div className="flex items-center gap-2">
              <activeItem.icon
                className={cn(
                  "w-4 h-4",
                  activeItem.colorClass,
                  activeItem.animate,
                )}
              />
              <span>{activeItem.label}</span>
              {activeItem.badge !== undefined && (
                <span className="px-1.5 py-0.1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold animate-pulse">
                  {activeItem.badge}
                </span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-1.5 min-w-[200px] max-h-[350px] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-100">
              {navItems.map((item) => {
                const isActive =
                  item.to === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setIsDropdownOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60",
                      isActive
                        ? "bg-sky-50/50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                    )}>
                    <div className="flex items-center gap-2">
                      <item.icon
                        className={cn(
                          "w-3.5 h-3.5",
                          isActive
                            ? item.colorClass
                            : "text-slate-400 dark:text-slate-500",
                          item.animate,
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          title="Reset to Initial Seed Dataset">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>

        <button
          onClick={handleResetMockData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium transition-colors bg-emerald-50/30 dark:bg-emerald-950/10"
          title="Reset e Criar Massa de Dados Customizada (Tanques/Esferas)">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reset/Mock</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Light/Dark Theme">
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <button
          onClick={() => {
            setIsCollapsed(true);
            localStorage.setItem("archestra_navbar_collapsed", "true");
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="Colapsar Barra de Menu">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Confirmar Limpeza Completa"
        subtitle="Esta ação é irreversível">
        <div className="flex flex-col gap-4 text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-rose-800 dark:text-rose-400">
                Atenção!
              </p>
              <p className="mt-1 text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
                Você está prestes a deletar <strong>TUDO</strong> do banco de
                dados do sistema, incluindo:
              </p>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-rose-700/80 dark:text-rose-300/70 font-mono">
                <li>Todos os Objetos & Modelos</li>
                <li>Todas as Telas & Gráficos</li>
                <li>Todos os Alarmes & Históricos</li>
                <li>Todos os Fluxogramas</li>
                <li>Todos os Movimentos OMM</li>
              </ul>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            O sistema será redefinido para um estado completamente vazio (Clean
            Slate) sem nenhum dado semeado.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors">
              Cancelar
            </button>
            <button
              onClick={executeWipeAllData}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold cursor-pointer transition-colors shadow-sm shadow-rose-500/10 flex items-center gap-1.5">
              Limpar Tudo
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResetMockConfirmOpen}
        onClose={() => setIsResetMockConfirmOpen(false)}
        title="Confirmar Reset e Criação de Mock"
        subtitle="Esta ação irá recriar a base com Tanques e Esferas">
        <div className="flex flex-col gap-4 text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                Massa de Dados Customizada
              </p>
              <p className="mt-1 text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
                Você irá redefinir o sistema e semear uma nova estrutura contendo:
              </p>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/70 font-mono">
                <li>Templates e Objetos de Tanques e Esferas</li>
                <li>Simuladores ativos para Nível, Temperatura e Pressão</li>
                <li>Widgets Premium (Tanque e Esfera) altamente estilizados</li>
                <li>Tela Sinóptica com interligação e tubulações dinâmicas</li>
                <li>Tags OPC dedicadas e fluxos de conectividade</li>
              </ul>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Todas as alterações atuais não salvas serão perdidas. A nova base estará configurada para simulação industrial.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              onClick={() => setIsResetMockConfirmOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors">
              Cancelar
            </button>
            <button
              onClick={executeResetMockData}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold cursor-pointer transition-colors shadow-sm shadow-emerald-500/10 flex items-center gap-1.5">
              Confirmar e Semear
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
