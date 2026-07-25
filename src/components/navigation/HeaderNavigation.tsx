import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Cpu, Shapes, Activity, Sun, Moon, RotateCcw, Upload } from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { cn } from '../../utils/cn';

interface HeaderNavigationProps {
  onImportClick?: () => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ onImportClick }) => {
  const { theme, toggleTheme, init: initObjectModel } = useObjectModelStore();
  const { init: initWidgets } = useWidgetStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);



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
            <span>Componentes Gráficos (Widgets)</span>
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
      </div>
    </header>
  );
};
