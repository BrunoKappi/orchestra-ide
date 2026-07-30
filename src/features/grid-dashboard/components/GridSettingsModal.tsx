import React, { useState } from 'react';
import type { GridConfig } from '../types';
import { Modal } from '../../../components/ui/Modal';
import { LayoutGrid } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface GridSettingsModalProps {
  isOpen: boolean;
  initialConfig: GridConfig;
  titleText?: string;
  onClose: () => void;
  onConfirm: (config: GridConfig) => void;
}

export const GridSettingsModal: React.FC<GridSettingsModalProps> = ({
  isOpen,
  initialConfig,
  titleText = "Nova Tela de Dashboard",
  onClose,
  onConfirm,
}) => {
  const [screenName, setScreenName] = useState(initialConfig.screenName || "Dashboard de Tanques 01");
  const [rows, setRows] = useState(initialConfig.rows || 8);
  const [cols, setCols] = useState(initialConfig.cols || 8);
  const [activePreset, setActivePreset] = useState<string>(
    `${initialConfig.rows}x${initialConfig.cols}`
  );

  const presets = [
    { label: '6x6', r: 6, c: 6 },
    { label: '8x8', r: 8, c: 8 },
    { label: '10x10', r: 10, c: 10 },
    { label: '12x12', r: 12, c: 12 },
  ];

  const handleApplyPreset = (pRows: number, pCols: number, pLabel: string) => {
    setRows(pRows);
    setCols(pCols);
    setActivePreset(pLabel);
  };

  const handleConfirm = () => {
    onConfirm({
      screenName: screenName.trim() || "Nova Tela",
      rows: Math.max(2, Math.min(24, rows)),
      cols: Math.max(2, Math.min(24, cols)),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div className="space-y-5 p-1">
        {/* Screen Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nome da Tela
          </label>
          <input
            type="text"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            placeholder="Ex: Pátio de Tanques Leste"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tamanho da Grade (Presets)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p.r, p.c, p.label)}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-bold font-mono transition-all flex flex-col items-center gap-1",
                  activePreset === p.label
                    ? "bg-sky-500 text-white border-sky-600 shadow-md ring-2 ring-sky-500/20"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <LayoutGrid className="w-4 h-4 opacity-80" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Configuração Personalizada
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Linhas (2 a 24)
              </label>
              <input
                type="number"
                min={2}
                max={24}
                value={rows}
                onChange={(e) => {
                  setRows(parseInt(e.target.value) || 2);
                  setActivePreset("custom");
                }}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Colunas (2 a 24)
              </label>
              <input
                type="number"
                min={2}
                max={24}
                value={cols}
                onChange={(e) => {
                  setCols(parseInt(e.target.value) || 2);
                  setActivePreset("custom");
                }}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-colors"
          >
            Aplicar Grade
          </button>
        </div>
      </div>
    </Modal>
  );
};
