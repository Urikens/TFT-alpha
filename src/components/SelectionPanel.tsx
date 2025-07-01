import React from 'react';
import { X, Crown, Package, Sparkles, Target, Trash2 } from 'lucide-react';
import { Champion, Item } from '../types';

interface SelectionPanelProps {
  selectedChampions: string[];
  selectedItems: string[];
  selectedSynergies: string[];
  selectedOptimizations: string[];
  champions: Champion[];
  items: Item[];
  optimizations: any[];
  onRemoveChampion: (name: string) => void;
  onRemoveItem: (id: string) => void;
  onRemoveSynergy: (name: string) => void;
  onRemoveOptimization: (id: string) => void;
  onClearAll: () => void;
}

export default function SelectionPanel({
  selectedChampions,
  selectedItems,
  selectedSynergies,
  selectedOptimizations,
  champions,
  items,
  optimizations,
  onRemoveChampion,
  onRemoveItem,
  onRemoveSynergy,
  onRemoveOptimization,
  onClearAll,
}: SelectionPanelProps) {
  const totalSelections = selectedChampions.length + selectedItems.length + selectedSynergies.length + selectedOptimizations.length;

  if (totalSelections === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Sélection Active</h3>
            <p className="text-slate-400 text-sm">{totalSelections} élément{totalSelections > 1 ? 's' : ''} sélectionné{totalSelections > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onClearAll}
          className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Tout effacer</span>
        </button>
      </div>

      {/* Grille des sélections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Champions */}
        {selectedChampions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Champions ({selectedChampions.length})</span>
            </div>
            <div className="space-y-2">
              {selectedChampions.map((name) => {
                const champion = champions.find(c => c.name === name);
                return (
                  <div key={name} className="group flex items-center justify-between bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg p-3 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      {champion?.imageUrl && (
                        <img
                          src={champion.imageUrl}
                          alt={name}
                          className="w-8 h-8 rounded-lg object-cover border border-blue-400/30"
                        />
                      )}
                      <span className="text-blue-100 font-medium text-sm">{name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveChampion(name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-200 transition-all duration-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        {selectedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Items ({selectedItems.length})</span>
            </div>
            <div className="space-y-2">
              {selectedItems.map((id) => {
                const item = items.find(i => i.key === id);
                return item ? (
                  <div key={id} className="group flex items-center justify-between bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg p-3 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover border border-green-400/30"
                      />
                      <span className="text-green-100 font-medium text-sm">{item.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveItem(id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-green-400 hover:text-green-200 transition-all duration-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Synergies */}
        {selectedSynergies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Synergies ({selectedSynergies.length})</span>
            </div>
            <div className="space-y-2">
              {selectedSynergies.map((name) => (
                <div key={name} className="group flex items-center justify-between bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg p-3 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-purple-100 font-medium text-sm">{name}</span>
                  </div>
                  <button
                    onClick={() => onRemoveSynergy(name)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-purple-400 hover:text-purple-200 transition-all duration-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimisations */}
        {selectedOptimizations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-300">Optimisations ({selectedOptimizations.length})</span>
            </div>
            <div className="space-y-2">
              {selectedOptimizations.map((id) => {
                const optimization = optimizations.find(o => o.id === id);
                return optimization ? (
                  <div key={id} className="group flex items-center justify-between bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg p-3 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-orange-100 font-medium text-sm">{optimization.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveOptimization(id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-orange-400 hover:text-orange-200 transition-all duration-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}