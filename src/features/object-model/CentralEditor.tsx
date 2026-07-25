import React, { useState, useEffect } from "react";
import {
  Boxes,
  Box,
  Copy,
  Check,
  Edit2,
  ListFilter,
  Code,
  Layers,
  Activity,
} from "lucide-react";
import { useObjectModelStore } from "../../store/useObjectModelStore";
import { PropertiesTable } from "./PropertiesTable";
import { ScriptsEditor } from "./ScriptsEditor";
import { AssociatedWidgetsEditor } from "./AssociatedWidgetsEditor";
import { PropertyModal } from "./PropertyModal";
import { ScriptModal } from "./ScriptModal";
import { ExportImportModal } from "./ExportImportModal";
import { MockConfigModal } from "./MockConfigModal";
import { cn } from "../../utils/cn";

export const CentralEditor: React.FC = () => {
  const {
    selectedEntity,
    selectedTemplate,
    selectedObject,
    templates,
    activeEditorTab,
    setActiveEditorTab,
    updateEntityDetails,
  } = useObjectModelStore();

  const [copiedId, setCopiedId] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const [nameVal, setNameVal] = useState("");
  const [descVal, setDescVal] = useState("");

  const currentEntity =
    selectedEntity?.type === "template" ? selectedTemplate : selectedObject;

  useEffect(() => {
    if (currentEntity) {
      setNameVal(currentEntity.name);
      setDescVal(currentEntity.description || "");
    }
  }, [currentEntity?.id, currentEntity?.name, currentEntity?.description]);

  if (!selectedEntity || !currentEntity) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-950 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
          <Boxes className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No Template or Instance Selected
        </h3>
        <p className="text-xs max-w-sm mt-1 text-slate-500">
          Select an item from the Derivation or Deployment hierarchy tree on the
          left to edit its properties and scripts.
        </p>
      </div>
    );
  }

  const isTemplate = selectedEntity.type === "template";
  const isDerived = isTemplate && selectedTemplate?.parentTemplateId !== null;

  // Origin template resolution
  let originTemplateName = "None (Root Template)";
  if (isTemplate && selectedTemplate?.parentTemplateId) {
    const parentT = templates.find(
      (t) => t.id === selectedTemplate.parentTemplateId,
    );
    originTemplateName = parentT ? parentT.name : "Unknown Parent";
  } else if (!isTemplate && selectedObject?.templateId) {
    const originT = templates.find((t) => t.id === selectedObject.templateId);
    originTemplateName = originT ? originT.name : "Unknown Template";
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentEntity.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveName = () => {
    if (nameVal.trim() && nameVal.trim() !== currentEntity.name) {
      updateEntityDetails(currentEntity.id, selectedEntity.type, {
        name: nameVal.trim(),
      });
    }
    setIsEditingName(false);
  };

  const handleSaveDesc = () => {
    if (descVal.trim() !== currentEntity.description) {
      updateEntityDetails(currentEntity.id, selectedEntity.type, {
        description: descVal.trim(),
      });
    }
    setIsEditingDesc(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Header Card */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Entity Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5",
                isTemplate
                  ? isDerived
                    ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    : "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
              )}>
              {isTemplate ? (
                <Boxes className="w-5 h-5" />
              ) : (
                <Box className="w-5 h-5" />
              )}
            </div>

            {/* Editable Name & Meta */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    autoFocus
                    className="text-base font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 border border-sky-500 rounded outline-none text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingName(true)}
                    className="text-base font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors group flex items-center gap-1.5">
                    <span>{currentEntity.name}</span>
                    <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                  </h2>
                )}

                {/* Type Badge */}
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0",
                    isTemplate
                      ? isDerived
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200"
                        : "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200"
                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200",
                  )}>
                  {isTemplate
                    ? isDerived
                      ? "Derived Template"
                      : "Root Template"
                    : "Instance"}
                </span>
              </div>

              {/* Editable Description */}
              <div>
                {isEditingDesc ? (
                  <input
                    type="text"
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    onBlur={handleSaveDesc}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveDesc();
                      if (e.key === "Escape") setIsEditingDesc(false);
                    }}
                    autoFocus
                    placeholder="Add description..."
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 px-2 py-0.5 border border-sky-500 rounded outline-none text-slate-700 dark:text-slate-300"
                  />
                ) : (
                  <p
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-slate-500 dark:text-slate-400 truncate cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 group">
                    <span>
                      {currentEntity.description ||
                        "No description provided. Click to add."}
                    </span>
                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Meta Info Badges */}
          <div className="flex flex-col items-end gap-1.5 text-xs text-slate-500 shrink-0">
            {/* Origin Template */}
            <div className="flex items-center gap-1.5 text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Origin:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {originTemplateName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Sub-Header Navigation Tabs */}
      <div className="flex items-center gap-2 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveEditorTab("properties")}
          className={cn(
            "flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition-colors duration-150",
            activeEditorTab === "properties"
              ? "border-sky-600 text-sky-600 dark:text-sky-400"
              : "border-transparent hover:text-slate-900 dark:hover:text-slate-100",
          )}>
          <ListFilter className="w-4 h-4" />
          <span>Properties</span>
        </button>

        <button
          onClick={() => setActiveEditorTab("scripts")}
          className={cn(
            "flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition-colors duration-150",
            activeEditorTab === "scripts"
              ? "border-sky-600 text-sky-600 dark:text-sky-400"
              : "border-transparent hover:text-slate-900 dark:hover:text-slate-100",
          )}>
          <Code className="w-4 h-4" />
          <span>Scripts</span>
        </button>

        <button
          onClick={() => setActiveEditorTab("graphics")}
          className={cn(
            "flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition-colors duration-150",
            activeEditorTab === "graphics"
              ? "border-sky-600 text-sky-600 dark:text-sky-400"
              : "border-transparent hover:text-slate-900 dark:hover:text-slate-100",
          )}>
          <Layers className="w-4 h-4" />
          <span>Graphics</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30 dark:bg-slate-950">
        {activeEditorTab === "properties" ? (
          <PropertiesTable />
        ) : activeEditorTab === "scripts" ? (
          <ScriptsEditor />
        ) : (
          <AssociatedWidgetsEditor />
        )}
      </div>

      {/* Modals */}
      <PropertyModal />
      <ScriptModal />
      <ExportImportModal />
      <MockConfigModal />
    </div>
  );
};
