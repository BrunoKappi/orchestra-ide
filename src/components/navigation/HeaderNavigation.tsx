import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  History,
  Database,
  LogOut,
} from "lucide-react";

import { useSecurityStore } from "../../store/useSecurityStore";
import { useLogStore } from "../../store/useLogStore";

import { useObjectModelStore } from "../../store/useObjectModelStore";
import { useWidgetStore } from "../../store/useWidgetStore";
import { useScreenStore } from "../../store/useScreenStore";
import { useFlowStore } from "../../store/useFlowStore";
import { useOpcStore } from "../../store/useOpcStore";
import { useOmmStore } from "../../features/omm/store/useOmmStore";
import { useAuthStore } from "../../store/useAuthStore";
import { historyEngine } from "../../services/HistoryEngine";
import { Modal } from "../ui/Modal";
import { cn } from "../../utils/cn";

export const HeaderNavigation = () => {
  const { theme, toggleTheme, alarmEvents, init } = useObjectModelStore();

  useEffect(() => {
    init();
  }, [init]);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("archestra_navbar_collapsed") === "true";
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetMockConfirmOpen, setIsResetMockConfirmOpen] = useState(false);

  const activeUnackCount = (alarmEvents || []).filter(
    (evt) => evt.status === "Active Unacknowledged",
  ).length;

  const location = useLocation();
  const navigate = useNavigate();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dataPopoverRef = useRef<HTMLDivElement>(null);
  const userPopoverRef = useRef<HTMLDivElement>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDataPopoverOpen, setIsDataPopoverOpen] = useState(false);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);

  const { currentUser, logout } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        dataPopoverRef.current &&
        !dataPopoverRef.current.contains(target)
      ) {
        setIsDataPopoverOpen(false);
      }
      if (
        userPopoverRef.current &&
        !userPopoverRef.current.contains(target)
      ) {
        setIsUserPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    {
      to: "/orchestra",
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
    {
      to: "/logs",
      label: "Logs e Auditoria",
      icon: History,
      colorClass: "text-sky-500",
      activeTextClass: "text-sky-600 dark:text-sky-400",
    },
    {
      to: "/database-analytics",
      label: "Database & Performance",
      icon: Database,
      colorClass: "text-indigo-500",
      activeTextClass: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  const currentPath = location.pathname;
  const activeItem =
    navItems.find((item) => {
      if (item.to === "/") {
        return currentPath === "/" || currentPath === "/home";
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
    useLogStore.getState().clearLogs();
    
    // Clear other specific keys in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('omm_v2') || 
        key.startsWith('historian_v1_') ||
        key.startsWith('archestra_') ||
        key === 'grid_dashboard_layout' ||
        key === 'grid_dashboard_screens' ||
        key === 'opc_virtual_tags'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    
    // Clear stores in memory
    useOmmStore.getState().clearAll();
    historyEngine.clearAll();
    
    // Force OMM refresh and OPC re-init
    useOmmStore.getState().refresh();
    useOpcStore.getState().init();
    
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
    useLogStore.getState().resetMockLogs();
    setIsResetMockConfirmOpen(false);
  };

  return (
    <header className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-2xs z-30 select-none">
      {/* Route Tabs */}
      <div className="flex items-center gap-6">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 select-none shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img
            src="/SerranoIcon.png"
            alt="Serrano Logo"
            className="w-7 h-7 object-contain"
          />
          <span className="text-base font-bold text-gray-600 dark:text-slate-100 tracking-wide">
            Serrano Automação
          </span>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2.5 text-xs">
        {/* Navigation Route Switches (Repositioned to the right side) */}
        <div ref={dropdownRef} className="relative z-50">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[170px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all select-none cursor-pointer">
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
          </button>

          {isDropdownOpen && (
            <div className={cn(
              "absolute right-0 mt-1.5 min-w-[200px] max-h-[350px] overflow-y-auto rounded-lg border shadow-lg py-1 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-100",
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            )}>
              {navItems.map((item) => {
                const isActive =
                  item.to === "/"
                    ? currentPath === "/" || currentPath === "/home"
                    : currentPath.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setIsDropdownOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-sky-950/40 text-sky-400 dark:bg-sky-950/40 dark:text-sky-400"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700",
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

        {/* Data Management Dropdown */}
        <div ref={dataPopoverRef} className="relative z-50">
          <button
            onClick={() => setIsDataPopoverOpen(!isDataPopoverOpen)}
            className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Gestão de Dados Local Storage"
          >
            <Database className="w-4 h-4 text-indigo-500" />
            <ChevronDown className="w-3 h-3 opacity-60 ml-1" />
          </button>

          {isDataPopoverOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-lg border shadow-lg py-1.5 z-50 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              <div className="px-3 py-1 text-[10px] font-bold uppercase border-b mb-1 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700">
                Banco de Dados Local
              </div>
              
              <button
                onClick={() => {
                  setIsDataPopoverOpen(false);
                  handleResetData();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors font-semibold text-rose-600 dark:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Limpar Tudo (Reset Data)</span>
              </button>

              <button
                onClick={() => {
                  setIsDataPopoverOpen(false);
                  handleResetMockData();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors font-semibold text-emerald-600 dark:text-emerald-450 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Restaurar Mock (Reset/Mock)</span>
              </button>

              <button
                onClick={() => {
                  setIsDataPopoverOpen(false);
                  navigate('/simulator');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors font-semibold border-t mt-1.5 pt-1.5 text-sky-600 dark:text-sky-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Activity className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>Painel Simulador Global</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 transition-colors"
          title="Toggle Light/Dark Theme">
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Session Dropdown */}
        {currentUser && (
          <div ref={userPopoverRef} className="relative z-50">
            <button
              onClick={() => setIsUserPopoverOpen(!isUserPopoverOpen)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all select-none cursor-pointer"
            >
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-5 h-5 rounded-md object-cover border border-black/5 dark:border-white/5 bg-slate-200 dark:bg-slate-900"
              />
              <span className="max-w-[70px] truncate">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {isUserPopoverOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-lg border shadow-lg py-2 z-50 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                <div className="px-3 py-1 flex flex-col gap-0.5 border-b mb-1.5 pb-1.5 border-slate-100 dark:border-slate-700">
                  <span className="font-bold truncate text-slate-800 dark:text-slate-100">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{currentUser.role}</span>
                </div>

                <button
                  onClick={() => {
                    setIsUserPopoverOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 text-left transition-colors font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/25"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logoff / Sair</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => {
            setIsCollapsed(true);
            localStorage.setItem("archestra_navbar_collapsed", "true");
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
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
