import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  color?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  className,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find the selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Toggle open/close
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchQuery('');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-left shadow-2xs transition-all focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500",
          disabled ? "opacity-60 bg-slate-50 dark:bg-slate-900 cursor-not-allowed border-slate-205 dark:border-slate-800" : "hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/10"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className={cn("truncate", !selectedOption && "text-slate-400 dark:text-slate-500")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
              ({selectedOption.subLabel})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-450 dark:text-slate-500">
          {!disabled && value && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 shadow-xl overflow-hidden focus:outline-none scale-100 origin-top animate-in fade-in duration-100">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:ring-0 p-0"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
            />
          </div>

          {/* Options List */}
          <ul className="max-h-60 overflow-y-auto p-1 divide-y divide-transparent">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors",
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-semibold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 truncate max-w-[150px]">
                          — {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-650 shrink-0" />}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                Nenhum resultado encontrado
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
