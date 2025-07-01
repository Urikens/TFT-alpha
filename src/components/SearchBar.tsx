import React from 'react';
import { Search, Mic, X } from 'lucide-react';

interface SearchBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  selectedTags: string[];
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: () => void;
}

export default function SearchBar({
  inputValue,
  setInputValue,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onKeyDown,
  onClear
}: SearchBarProps) {
  const hasContent = inputValue.length > 0 || selectedTags.length > 0;

  return (
    <div className="relative bg-slate-800/40 backdrop-blur border border-slate-600/30 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-inner">
      <div className="flex items-center space-x-2">
        <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {selectedTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 rounded-lg text-sm border border-blue-500/30 backdrop-blur"
            >
              {tag}
              <button
                onClick={() => onRemoveTag(index)}
                className="ml-2 hover:text-blue-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={selectedTags.length === 0 ? "Rechercher des champions..." : "Ajouter un champion..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none min-w-[200px]"
          />
        </div>
        <div className="flex items-center space-x-2">
          {hasContent && (
            <button 
              onClick={onClear}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 rounded-lg hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}