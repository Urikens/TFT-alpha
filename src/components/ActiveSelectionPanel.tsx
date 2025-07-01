import React, { useState } from 'react';
import { X, Crown, Package, Sparkles, Target, Trash2, ChevronDown, ChevronUp, Zap, BarChart3, Users, Star } from 'lucide-react';
import { Champion, Item } from '../types';

interface ActiveSelectionPanelProps {
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

export default function ActiveSelectionPanel({
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
}: ActiveSelectionPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    champions: true,
    items: true,
    synergies: true,
    optimizations: true,
  });

  const totalSelections = selectedChampions.length + selectedItems.length + selectedSynergies.length + selectedOptimizations.length;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'champions': return Crown;
      case 'items': return Package;
      case 'synergies': return Sparkles;
      case 'optimizations': return Target;
      default: return Star;
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'champions': return 'from-blue-500 to-cyan-600';
      case 'items': return 'from-green-500 to-emerald-600';
      case 'synergies': return 'from-purple-500 to-pink-600';
      case 'optimizations': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getSectionTextColor = (section: string) => {
    switch (section) {
      case 'champions': return 'text-blue-300';
      case 'items': return 'text-green-300';
      case 'synergies': return 'text-purple-300';
      case 'optimizations': return 'text-orange-300';
      default: return 'text-slate-300';
    }
  };

  const getSectionBgColor = (section: string) => {
    switch (section) {
      case 'champions': return 'bg-blue-500/10 border-blue-500/20';
      case 'items': return 'bg-green-500/10 border-green-500/20';
      case 'synergies': return 'bg-purple-500/10 border-purple-500/20';
      case 'optimizations': return 'bg-orange-500/10 border-orange-500/20';
      default: return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  if (totalSelections === 0) {
    return (
      <div className="sticky top-8">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-8 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Sélection Active</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cliquez sur des champions, items, synergies ou optimisations pour les ajouter à votre sélection et créer la composition parfaite.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-slate-400">Analyse</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-slate-400">Compos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-8">
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/40 p-6 border-b border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Sélection Active</h3>
                <p className="text-slate-400 text-sm">{totalSelections} élément{totalSelections > 1 ? 's' : ''} sélectionné{totalSelections > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={onClearAll}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Reset</span>
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Champions */}
            {selectedChampions.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('champions')}
                  className="w-full flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getSectionColor('champions')} rounded-lg flex items-center justify-center`}>
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-blue-300 font-semibold">Champions ({selectedChampions.length})</span>
                  </div>
                  {expandedSections.champions ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
                </button>
                
                {expandedSections.champions && (
                  <div className="space-y-2 pl-4">
                    {selectedChampions.map((name) => {
                      const champion = champions.find(c => c.name === name);
                      return (
                        <div key={name} className="group flex items-center justify-between bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-lg p-3 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            {champion?.imageUrl && (
                              <img
                                src={champion.imageUrl}
                                alt={name}
                                className="w-10 h-10 rounded-lg object-cover border border-blue-400/30"
                              />
                            )}
                            <div>
                              <span className="text-blue-100 font-medium text-sm">{name}</span>
                              {champion?.cost && (
                                <div className="text-xs text-blue-400">Coût: {champion.cost[0]}</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveChampion(name)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-200 transition-all duration-200 rounded hover:bg-blue-500/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('items')}
                  className="w-full flex items-center justify-between p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getSectionColor('items')} rounded-lg flex items-center justify-center`}>
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-green-300 font-semibold">Items ({selectedItems.length})</span>
                  </div>
                  {expandedSections.items ? <ChevronUp className="w-4 h-4 text-green-400" /> : <ChevronDown className="w-4 h-4 text-green-400" />}
                </button>
                
                {expandedSections.items && (
                  <div className="space-y-2 pl-4">
                    {selectedItems.map((id) => {
                      const item = items.find(i => i.key === id);
                      return item ? (
                        <div key={id} className="group flex items-center justify-between bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 rounded-lg p-3 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-green-400/30"
                            />
                            <div>
                              <span className="text-green-100 font-medium text-sm">{item.name}</span>
                              {item.isEmblem && (
                                <div className="text-xs text-green-400">Emblème</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveItem(id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-green-400 hover:text-green-200 transition-all duration-200 rounded hover:bg-green-500/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Synergies */}
            {selectedSynergies.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('synergies')}
                  className="w-full flex items-center justify-between p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getSectionColor('synergies')} rounded-lg flex items-center justify-center`}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-purple-300 font-semibold">Synergies ({selectedSynergies.length})</span>
                  </div>
                  {expandedSections.synergies ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
                </button>
                
                {expandedSections.synergies && (
                  <div className="space-y-2 pl-4">
                    {selectedSynergies.map((name) => (
                      <div key={name} className="group flex items-center justify-between bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-lg p-3 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {/* Hexagonal gold background */}
                            <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-lg transform rotate-45 -z-10"></div>
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center relative z-10">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <span className="text-purple-100 font-medium text-sm">{name}</span>
                        </div>
                        <button
                          onClick={() => onRemoveSynergy(name)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-purple-400 hover:text-purple-200 transition-all duration-200 rounded hover:bg-purple-500/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optimisations */}
            {selectedOptimizations.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('optimizations')}
                  className="w-full flex items-center justify-between p-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getSectionColor('optimizations')} rounded-lg flex items-center justify-center`}>
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-orange-300 font-semibold">Optimisations ({selectedOptimizations.length})</span>
                  </div>
                  {expandedSections.optimizations ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
                </button>
                
                {expandedSections.optimizations && (
                  <div className="space-y-2 pl-4">
                    {selectedOptimizations.map((id) => {
                      const optimization = optimizations.find(o => o.id === id);
                      return optimization ? (
                        <div key={id} className="group flex items-center justify-between bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 rounded-lg p-3 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                              <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <span className="text-orange-100 font-medium text-sm">{optimization.name}</span>
                              <div className="text-xs text-orange-400">{optimization.difficulty} • {optimization.impact}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveOptimization(id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-orange-400 hover:text-orange-200 transition-all duration-200 rounded hover:bg-orange-500/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer avec statistiques */}
        <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/30 p-4 border-t border-slate-700/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{totalSelections}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{selectedChampions.length}</div>
              <div className="text-xs text-slate-400">Champions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}