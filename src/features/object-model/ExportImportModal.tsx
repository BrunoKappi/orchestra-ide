import React, { useState } from 'react';
import { Copy, Check, Download, Upload } from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { Modal } from '../../components/ui/Modal';

export const ExportImportModal: React.FC = () => {
  const {
    isExportImportModalOpen,
    exportImportMode,
    exportPayload,
    closeExportImportModal,
    importJsonPayload,
  } = useObjectModelStore();

  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(exportPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([exportPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archestra_object_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    setErrorMsg('');
    if (!importText.trim()) {
      setErrorMsg('Please paste a valid JSON string.');
      return;
    }
    const success = importJsonPayload(importText.trim());
    if (!success) {
      setErrorMsg('Failed to parse or import JSON. Verify JSON structure.');
    }
  };

  return (
    <Modal
      isOpen={isExportImportModalOpen}
      onClose={closeExportImportModal}
      title={
        exportImportMode === 'export'
          ? 'Export Object Structure (JSON)'
          : 'Import Object Structure (JSON)'
      }
      subtitle={
        exportImportMode === 'export'
          ? 'Includes all properties, scripts, origin templates, and relational dependencies.'
          : 'Paste an exported JSON payload to recreate the template or object.'
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {exportImportMode === 'export' ? (
          <>
            <textarea
              readOnly
              value={exportPayload}
              rows={12}
              className="w-full p-3 bg-slate-950 text-sky-400 font-mono text-[11px] border border-slate-800 rounded-lg outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download .json file</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                JSON Payload
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                placeholder="Paste object JSON structure here..."
                className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] border border-slate-800 rounded-lg outline-none leading-relaxed"
              />
              {errorMsg && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">
                  {errorMsg}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeExportImportModal}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import Object</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
