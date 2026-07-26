import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Cpu, Shapes, Activity, Sun, Moon, RotateCcw, Upload, Monitor, Zap, Database, Bell, ChevronDown, ChevronUp, TrendingUp, Search, Workflow } from 'lucide-react';


import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { cn } from '../../utils/cn';

interface HeaderNavigationProps {
  onImportClick?: () => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ onImportClick }) => {
  const { theme, toggleTheme, init: initObjectModel, alarmEvents } = useObjectModelStore();
  const { init: initWidgets } = useWidgetStore();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('archestra_navbar_collapsed') === 'true';
  });

  const activeUnackCount = (alarmEvents || []).filter(
    (evt) => evt.status === 'Active Unacknowledged'
  ).length;



  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (isCollapsed) {
    return (
      <div className="absolute top-2 right-4 z-40">
        <button
          onClick={() => {
            setIsCollapsed(false);
            localStorage.setItem('archestra_navbar_collapsed', 'false');
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md transition-all flex items-center gap-1.5 text-[11px] font-semibold select-none cursor-pointer"
          title="Expandir Barra de Menu"
        >
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
    if (window.confirm('Tem certeza de que deseja resetar os dados iniciais do sistema?')) {
      localStorage.clear();
      initObjectModel();
      initWidgets();
    }
  };

  return (
    <header className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-2xs z-30 select-none">
      {/* Route Tabs */}
      <div className="flex items-center gap-6">
        {/* Navigation Route Switches */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/50 text-xs">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Cpu className="w-3.5 h-3.5 text-sky-500" />
            <span>Orquestra IDE</span>
          </NavLink>

          <NavLink
            to="/properties"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Search className="w-3.5 h-3.5 text-sky-500" />
            <span>Property Browser</span>
          </NavLink>

          <NavLink
            to="/widgets"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Shapes className="w-3.5 h-3.5 text-emerald-500" />
            <span>Widgets</span>
          </NavLink>

          <NavLink
            to="/flows"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Workflow className="w-3.5 h-3.5 text-sky-500" />
            <span>Fluxogramas</span>
          </NavLink>

          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>Simulador</span>
          </NavLink>

          <NavLink
            to="/screens"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Monitor className="w-3.5 h-3.5 text-violet-500" />
            <span>Telas</span>
          </NavLink>

          <NavLink
            to="/runtime"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Runtime</span>
          </NavLink>

          <NavLink
            to="/alarms"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-455 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Bell className={cn('w-3.5 h-3.5 text-rose-500', activeUnackCount > 0 && 'animate-bounce')} />
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
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Database className="w-3.5 h-3.5 text-cyan-500" />
            <span>Banco de Dados</span>
          </NavLink>

          <NavLink
            to="/historian"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
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
            title="Import JSON Data"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        )}

        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          title="Reset to Initial Seed Dataset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <button
          onClick={() => {
            setIsCollapsed(true);
            localStorage.setItem('archestra_navbar_collapsed', 'true');
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="Colapsar Barra de Menu"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
