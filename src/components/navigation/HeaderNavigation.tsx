import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Cpu,
  Shapes,
  Activity,
  Sun,
  Moon,
  RotateCcw,
  Upload,
  Monitor,
  Zap,
  Database,
  Bell,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Search,
  Workflow,
  AlertTriangle,
} from "lucide-react";

import { useObjectModelStore } from "../../store/useObjectModelStore";
import { useWidgetStore } from "../../store/useWidgetStore";
import { useScreenStore } from "../../store/useScreenStore";
import { useFlowStore } from "../../store/useFlowStore";
import { Modal } from "../ui/Modal";
import { cn } from "../../utils/cn";

interface HeaderNavigationProps {
  onImportClick?: () => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  onImportClick,
}) => {
  const {
    theme,
    toggleTheme,
    alarmEvents,
  } = useObjectModelStore();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("archestra_navbar_collapsed") === "true";
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const activeUnackCount = (alarmEvents || []).filter(
    (evt) => evt.status === "Active Unacknowledged",
  ).length;

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

  const executeWipeAllData = () => {
    useObjectModelStore.getState().clearAllData();
    useWidgetStore.getState().clearAllData();
    useScreenStore.getState().clearAllData();
    useFlowStore.getState().clearAllData();
    setIsResetConfirmOpen(false);
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
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/50 text-xs">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Cpu className="w-3.5 h-3.5 text-sky-500" />
            <span>Orquestra IDE</span>
          </NavLink>

          <NavLink
            to="/properties"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Search className="w-3.5 h-3.5 text-sky-500" />
            <span>Property Browser</span>
          </NavLink>

          <NavLink
            to="/widgets"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Shapes className="w-3.5 h-3.5 text-emerald-500" />
            <span>Widgets</span>
          </NavLink>

          <NavLink
            to="/flows"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Workflow className="w-3.5 h-3.5 text-sky-500" />
            <span>Fluxogramas</span>
          </NavLink>

          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>Simulador</span>
          </NavLink>

          <NavLink
            to="/screens"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Monitor className="w-3.5 h-3.5 text-violet-500" />
            <span>Telas</span>
          </NavLink>

          <NavLink
            to="/runtime"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Runtime</span>
          </NavLink>

          <NavLink
            to="/alarms"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-455 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Bell
              className={cn(
                "w-3.5 h-3.5 text-rose-500",
                activeUnackCount > 0 && "animate-bounce",
              )}
            />
            <span>Alarmes</span>
            {activeUnackCount > 0 && (
              <span className="ml-1 px-1.5 py-0.1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold select-none shrink-0 animate-pulse">
                {activeUnackCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/database"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <Database className="w-3.5 h-3.5 text-cyan-500" />
            <span>Banco de Dados</span>
          </NavLink>

          <NavLink
            to="/historian"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150",
                isActive
                  ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )
            }>
            <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
            <span>Historian</span>
          </NavLink>
        </nav>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 text-xs">
        {onImportClick && (
          <button
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            title="Import JSON Data">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        )}

        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          title="Reset to Initial Seed Dataset">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
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
                <li>Todos os Fluxogramas & BPMN</li>
                <li>Todos os Scripts & Variáveis</li>
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
    </header>
  );
};
