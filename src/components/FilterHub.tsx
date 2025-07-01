import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  Target,
  BarChart3,
  X,
  FilterX,
  Heart,
  Flame,
  RotateCcw,
  Search,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { commonSynergies } from '../data/synergies';

interface FilterHubProps {
  selectedSynergies: string[];
  onToggleSynergy: (synergy: string) => void;
  showOnlyFavorites: boolean;
  onToggleFavorites: (value: boolean) => void;
  showOnlyMeta: boolean;
  onToggleMeta: (value: boolean) => void;
  onClearAllFilters: () => void;
  championsCount: number;
  favoritesCount: number;
  metaCount: number;
}

type PanelType = 'synergies' | 'options' | 'stats' | 'search' | null;

export default function FilterHub({
  selectedSynergies,
  onToggleSynergy,
  showOnlyFavorites,
  onToggleFavorites,
  showOnlyMeta,
  onToggleMeta,
  onClearAllFilters,
  championsCount,
  favoritesCount,
  metaCount,
}: FilterHubProps) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [searchFilters, setSearchFilters] = useState({
    minWinRate: 0,
    maxCost: 5,
    minRating: 0,
    sortBy: 'winrate' as 'winrate' | 'pickrate' | 'rating' | 'cost',
  });
  const hubRef = useRef<HTMLDivElement>(null);

  const activeFiltersCount =
    selectedSynergies.length +
    (showOnlyFavorites ? 1 : 0) +
    (showOnlyMeta ? 1 : 0) +
    (searchFilters.minWinRate > 0 ? 1 : 0) +
    (searchFilters.maxCost < 5 ? 1 : 0) +
    (searchFilters.minRating > 0 ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  // Fermer le panneau au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (hubRef.current && !hubRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const getSynergyData = (synergyName: string) => {
    const synergy = commonSynergies.find((s) => s.name === synergyName);
    return synergy || { name: synergyName, color: 'from-gray-500 to-gray-600', imageUrl: '' };
  };

  const resetSearchFilters = () => {
    setSearchFilters({
      minWinRate: 0,
      maxCost: 5,
      minRating: 0,
      sortBy: 'winrate',
    });
  };

  return (
    <div ref={hubRef} className="fixed bottom-6 right-6 z-40">
      {/* Panneaux */}
      {activePanel && (
        <div className="absolute bottom-20 right-0 w-80 mb-4">
          {/* Panel Synergies */}
          {activePanel === 'synergies' && (
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Synergies</h3>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {commonSynergies.map((synergy) => (
                  <button
                    key={synergy.name}
                    onClick={() => onToggleSynergy(synergy.name)}
                    className={`p-3 rounded-lg text-xs transition-all flex items-center space-x-2 ${
                      selectedSynergies.includes(synergy.name)
                        ? `bg-gradient-to-r ${synergy.color} text-white shadow-lg scale-105`
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:scale-105'
                    }`}
                  >
                    {synergy.imageUrl ? (
                      <img 
                        src={synergy.imageUrl} 
                        alt={synergy.name}
                        className="w-4 h-4 object-cover rounded"
                      />
                    ) : (
                      <span className="text-base">⭐</span>
                    )}
                    <span className="font-medium truncate">{synergy.name}</span>
                  </button>
                ))}
              </div>

              {selectedSynergies.length > 0 && (
                <button
                  onClick={() =>
                    selectedSynergies.forEach((s) => onToggleSynergy(s))
                  }
                  className="w-full mt-4 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Effacer les synergies</span>
                </button>
              )}
            </div>
          )}

          {/* Panel Search Filters */}
          {activePanel === 'search' && (
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">Filtres avancés</h3>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Winrate minimum */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300 font-medium flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Winrate min.</span>
                    </label>
                    <span className="text-xs text-blue-400 font-bold">{searchFilters.minWinRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={searchFilters.minWinRate}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, minWinRate: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Coût maximum */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300 font-medium flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Coût max.</span>
                    </label>
                    <span className="text-xs text-yellow-400 font-bold">{searchFilters.maxCost}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={searchFilters.maxCost}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, maxCost: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Rating minimum */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300 font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Note min.</span>
                    </label>
                    <span className="text-xs text-yellow-400 font-bold">{searchFilters.minRating}/5</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={searchFilters.minRating}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, minRating: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Tri par */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-300 font-medium">Trier par</label>
                  <select
                    value={searchFilters.sortBy}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="winrate">Winrate</option>
                    <option value="pickrate">Pick Rate</option>
                    <option value="rating">Note</option>
                    <option value="cost">Coût</option>
                  </select>
                </div>

                <button
                  onClick={resetSearchFilters}
                  className="w-full px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          )}

          {/* Panel Options */}
          {activePanel === 'options' && (
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold">Options</h3>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={showOnlyFavorites}
                    onChange={(e) => onToggleFavorites(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      showOnlyFavorites
                        ? 'bg-pink-500 border-pink-500 scale-110'
                        : 'border-slate-500'
                    }`}
                  >
                    {showOnlyFavorites && (
                      <Heart className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-slate-300 font-medium">
                    Favoris uniquement
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={showOnlyMeta}
                    onChange={(e) => onToggleMeta(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      showOnlyMeta
                        ? 'bg-orange-500 border-orange-500 scale-110'
                        : 'border-slate-500'
                    }`}
                  >
                    {showOnlyMeta && <Flame className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-slate-300 font-medium">
                    Meta uniquement
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Panel Stats */}
          {activePanel === 'stats' && (
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-white font-semibold">Statistiques</h3>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {championsCount}
                  </div>
                  <div className="text-xs text-slate-400">Champions</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {selectedSynergies.length}
                  </div>
                  <div className="text-xs text-slate-400">Synergies</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {favoritesCount}
                  </div>
                  <div className="text-xs text-slate-400">Favoris</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {metaCount}
                  </div>
                  <div className="text-xs text-slate-400">Meta</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Boutons flottants */}
      <div className="flex flex-col items-end space-y-3">
        {/* Bouton Reset (si filtres actifs) */}
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-lg backdrop-blur transition-all duration-200 hover:scale-105"
          >
            <FilterX className="w-4 h-4" />
            <span className="text-sm font-medium">Reset</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}

        {/* Boutons de panneaux */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => togglePanel('search')}
            className={`p-3 rounded-lg shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 ${
              activePanel === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/90 text-blue-400 hover:bg-blue-600/20'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => togglePanel('synergies')}
            className={`p-3 rounded-lg shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 ${
              activePanel === 'synergies'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/90 text-purple-400 hover:bg-purple-600/20'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <button
            onClick={() => togglePanel('options')}
            className={`p-3 rounded-lg shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 ${
              activePanel === 'options'
                ? 'bg-green-600 text-white'
                : 'bg-slate-800/90 text-green-400 hover:bg-green-600/20'
            }`}
          >
            <Target className="w-5 h-5" />
          </button>

          <button
            onClick={() => togglePanel('stats')}
            className={`p-3 rounded-lg shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 ${
              activePanel === 'stats'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800/90 text-cyan-400 hover:bg-cyan-600/20'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}