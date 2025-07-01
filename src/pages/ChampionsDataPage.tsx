import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List, Filter, ChevronDown, ChevronUp, Star, Crown, Download, SlidersHorizontal, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Champion, Item } from '../types';
import SearchBar from '../components/SearchBar';
import FilterHub from '../components/FilterHub';
import { tftDataConnector } from '../data/data_connector';

export default function ChampionsDataPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampions, setSelectedChampions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'winRate' | 'avgPlacement'>('winRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCost, setFilterCost] = useState<number | 'all'>('all');
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [patchInfo, setPatchInfo] = useState({ version: '', set: '', lastUpdate: '' });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    cost: true,
    traits: true,
    winRate: true,
    avgPlacement: true,
    pickRate: true,
    tier: true,
    asCarry: true,
    asCore: true
  });
  const [availableTraits, setAvailableTraits] = useState<string[]>([]);

  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Utiliser le connecteur de données
        const championsData = tftDataConnector.getAllChampions();
        
        // Extraire tous les traits uniques
        const allTraits = new Set<string>();
        championsData.forEach(champion => {
          if (champion.traits) {
            champion.traits.forEach(trait => allTraits.add(trait));
          }
        });
        
        // Charger les infos de patch
        const patchRes = await fetch('/data/tft/update.json');
        if (patchRes.ok) {
          const patchData = await patchRes.json();
          setPatchInfo({
            version: patchData.patch || '15.13',
            set: 'Set 14',
            lastUpdate: patchData.updatedAtUTC || new Date().toISOString()
          });
        }
        
        setChampions(championsData);
        setAvailableTraits(Array.from(allTraits).sort());
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Gestion de la recherche
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      removeTag(selectedTags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !selectedTags.includes(trimmedValue)) {
      setSelectedTags([...selectedTags, trimmedValue]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    setSelectedTags(selectedTags.filter((_, i) => i !== index));
  };

  const addChampionAsTag = (championName: string) => {
    if (!selectedTags.includes(championName)) {
      setSelectedTags([...selectedTags, championName]);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSelectedTags([]);
  };

  // Filtrage des champions
  const filteredChampions = champions.filter((champion) => {
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) =>
        champion.name.toLowerCase().includes(tag.toLowerCase()) ||
        (champion.traits && champion.traits.some(t => t.toLowerCase().includes(tag.toLowerCase())))
      );
    const matchesInput =
      inputValue === '' ||
      champion.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      (champion.traits && champion.traits.some(t => t.toLowerCase().includes(inputValue.toLowerCase())));
    const matchesCost =
      filterCost === 'all' || champion.cost[0] === filterCost;
    const matchesTrait =
      filterTrait === 'all' || (champion.traits && champion.traits.includes(filterTrait));

    return (
      (matchesTags || matchesInput) &&
      matchesCost &&
      matchesTrait
    );
  });

  // Tri des champions
  const sortedChampions = [...filteredChampions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'cost':
        comparison = a.cost[0] - b.cost[0];
        break;
      case 'winRate':
        comparison = (b.winRate || 0) - (a.winRate || 0);
        break;
      case 'avgPlacement':
        comparison = (a.avgPlacement || 5) - (b.avgPlacement || 5);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Toggle champion selection
  const toggleChampionSelection = (championName: string) => {
    setSelectedChampions((prev) =>
      prev.includes(championName)
        ? prev.filter((name) => name !== championName)
        : [...prev, championName]
    );
  };

  // Gestion des filtres
  const clearAllFilters = () => {
    setFilterCost('all');
    setFilterTrait('all');
    setSelectedTags([]);
    setInputValue('');
  };

  // Gestion du tri des colonnes
  const handleColumnSort = (column: 'name' | 'cost' | 'winRate' | 'avgPlacement') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Toggle visibilité des colonnes
  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Obtenir l'icône de tri pour une colonne
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Fonction pour obtenir la couleur du coût
  const getCostColor = (cost: number) => {
    switch (cost) {
      case 1: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 2: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 3: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 4: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 5: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Fonction pour obtenir la couleur du tier
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'A': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'C': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Fonction pour obtenir la couleur du placement
  const getPlacementColor = (placement: number) => {
    if (placement <= 3.5) return 'text-green-400';
    if (placement <= 4.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Exporter les données en CSV
  const exportToCSV = () => {
    // Définir les en-têtes
    const headers = [
      'Nom',
      'Coût',
      'Traits',
      'Winrate',
      'Placement Moyen',
      'Pick Rate',
      'Tier',
      'Carry',
      'Core'
    ].join(',');
    
    // Convertir les données en lignes CSV
    const rows = sortedChampions.map(champion => [
      champion.name,
      champion.cost[0],
      champion.traits ? champion.traits.join('|') : '',
      (champion.winRate || 0).toFixed(1) + '%',
      (champion.avgPlacement || 5).toFixed(2),
      (champion.pickRate || 0).toFixed(1) + '%',
      champion.tier || 'C',
      champion.asCarry || 0,
      champion.asCore || 0
    ].join(','));
    
    // Combiner en-têtes et lignes
    const csvContent = [headers, ...rows].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `champions_tft_${patchInfo.version}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtenir les items recommandés pour un champion
  const getRecommendedItems = (championName: string): Item[] => {
    return tftDataConnector.getRecommendedItems(championName);
  };

  return (
    <>
      {/* Header de section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Champions</h2>
            <p className="text-slate-400">
              Statistiques détaillées des champions du patch {patchInfo.version}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors border border-green-500/30"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
              showFilters 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                : 'bg-slate-800/60 text-slate-300 border-slate-600/50 hover:bg-slate-700/60'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtres</span>
          </button>
          <div className="flex items-center space-x-1 bg-slate-800/60 rounded-lg border border-slate-600/50 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded transition-all ${
                viewMode === 'compact'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Onglets par coût */}
      <div className="mb-8">
        <div className="border-b border-slate-700/50">
          <div className="flex items-center space-x-6 overflow-x-auto">
            {/* Onglet "Tous" */}
            <button
              onClick={() => setFilterCost('all')}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                filterCost === 'all'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span className="font-medium">Tous</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {champions.length}
              </span>
            </button>

            {/* Onglets par coût */}
            {[1, 2, 3, 4, 5].map((cost) => {
              const count = champions.filter(c => c.cost[0] === cost).length;
              return (
                <button
                  key={cost}
                  onClick={() => setFilterCost(cost)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    filterCost === cost
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="font-medium">{cost} Coût</span>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-8">
        <SearchBar
          inputValue={inputValue}
          setInputValue={setInputValue}
          selectedTags={selectedTags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onKeyDown={handleInputKeyDown}
          onClear={clearSearch}
        />
      </div>

      {/* Panneau de filtres avancés */}
      {showFilters && (
        <div className="mb-8 bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tri */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-medium">Tri</h3>
              </div>
              <div className="space-y-2">
                {[
                  { value: 'winRate', label: 'Winrate' },
                  { value: 'avgPlacement', label: 'Placement moyen' },
                  { value: 'cost', label: 'Coût' },
                  { value: 'name', label: 'Nom' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sortBy"
                      checked={sortBy === option.value}
                      onChange={() => setSortBy(option.value as any)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      sortBy === option.value ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                    }`} />
                    <span className="text-slate-300 text-sm">{option.label}</span>
                  </label>
                ))}
                
                <div className="pt-2 flex items-center space-x-3">
                  <span className="text-slate-300 text-sm">Direction:</span>
                  <button
                    onClick={() => setSortDirection('asc')}
                    className={`px-3 py-1 rounded text-xs ${
                      sortDirection === 'asc' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    Ascendant
                  </button>
                  <button
                    onClick={() => setSortDirection('desc')}
                    className={`px-3 py-1 rounded text-xs ${
                      sortDirection === 'desc' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    Descendant
                  </button>
                </div>
              </div>
            </div>

            {/* Traits */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-white font-medium">Trait</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="filterTrait"
                    checked={filterTrait === 'all'}
                    onChange={() => setFilterTrait('all')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    filterTrait === 'all' ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                  }`} />
                  <span className="text-slate-300 text-sm">Tous</span>
                </label>
                {availableTraits.map(trait => {
                  const count = tftDataConnector.getChampionCountByTrait(trait);
                  return (
                    <label key={trait} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="filterTrait"
                        checked={filterTrait === trait}
                        onChange={() => setFilterTrait(trait)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        filterTrait === trait ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                      }`} />
                      <span className="text-slate-300 text-sm">{trait}</span>
                      <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Statistiques et options de colonnes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-white font-medium">Statistiques</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{champions.length}</div>
                  <div className="text-xs text-slate-400">Total Champions</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {champions.filter(c => c.tier === 'S').length}
                  </div>
                  <div className="text-xs text-slate-400">Tier S</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {champions.filter(c => c.asCarry > 0).length}
                  </div>
                  <div className="text-xs text-slate-400">Carries</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-400">
                    {champions.filter(c => c.isMeta).length}
                  </div>
                  <div className="text-xs text-slate-400">Meta</div>
                </div>
              </div>
              
              {viewMode === 'table' && (
                <div className="pt-4 border-t border-slate-700/30 mt-4">
                  <h4 className="text-white text-sm font-medium mb-2">Colonnes visibles</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(visibleColumns).map(([column, isVisible]) => (
                      <label key={column} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumnVisibility(column as keyof typeof visibleColumns)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isVisible ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                        }`}>
                          {isVisible && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                        </div>
                        <span className="text-slate-300 text-xs capitalize">{column}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Effacer tous les filtres
            </button>
            <div className="text-xs text-slate-500">
              {sortedChampions.length} champions trouvés
            </div>
          </div>
        </div>
      )}

      {/* Affichage des champions */}
      <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 overflow-hidden shadow-2xl">
        {/* Contrôles de tri */}
        <div className="p-4 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 font-medium">
                  Trier par :
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
              >
                <option value="winRate">Winrate</option>
                <option value="avgPlacement">Placement moyen</option>
                <option value="cost">Coût</option>
                <option value="name">Nom</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full font-medium">
              {sortedChampions.length} résultats
            </div>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div
                  className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin"
                  style={{
                    animationDirection: 'reverse',
                    animationDuration: '1.5s',
                  }}
                ></div>
              </div>
              <p className="text-slate-400 text-lg font-medium">
                Chargement des champions...
              </p>
            </div>
          ) : sortedChampions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">
                  Aucun champion trouvé
                </p>
                <p className="text-slate-500 text-sm">
                  Essayez d'ajuster vos filtres
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-3 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                >
                  Effacer tous les filtres
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0">
                  <tr>
                    {visibleColumns.name && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Champion</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.cost && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('cost')}>
                        <div className="flex items-center space-x-1">
                          <span>Coût</span>
                          {getSortIcon('cost')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.traits && (
                      <th scope="col" className="px-4 py-3">
                        <span>Traits</span>
                      </th>
                    )}
                    {visibleColumns.winRate && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('winRate')}>
                        <div className="flex items-center space-x-1">
                          <span>Winrate</span>
                          {getSortIcon('winRate')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.avgPlacement && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('avgPlacement')}>
                        <div className="flex items-center space-x-1">
                          <span>Placement</span>
                          {getSortIcon('avgPlacement')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.pickRate && (
                      <th scope="col" className="px-4 py-3">
                        <span>Pick Rate</span>
                      </th>
                    )}
                    {visibleColumns.tier && (
                      <th scope="col" className="px-4 py-3">
                        <span>Tier</span>
                      </th>
                    )}
                    {visibleColumns.asCarry && (
                      <th scope="col" className="px-4 py-3">
                        <span>Carry</span>
                      </th>
                    )}
                    {visibleColumns.asCore && (
                      <th scope="col" className="px-4 py-3">
                        <span>Core</span>
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3">
                      <span>Items</span>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChampions.map((champion) => (
                    <tr 
                      key={champion.key} 
                      className={`border-b border-slate-700/30 ${
                        hoveredRow === champion.key ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
                      } transition-colors`}
                      onMouseEnter={() => setHoveredRow(champion.key)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {visibleColumns.name && (
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={champion.imageUrl} 
                              alt={champion.name} 
                              className="w-10 h-10 rounded-lg object-cover border border-slate-600/50"
                            />
                            <div>
                              <div className="font-medium text-white">{champion.name}</div>
                              {champion.isMeta && (
                                <div className="text-xs text-orange-400">Meta</div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.cost && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getCostColor(champion.cost[0])}`}>
                            {champion.cost[0]}
                          </span>
                        </td>
                      )}
                      {visibleColumns.traits && (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {champion.traits?.map((trait, index) => {
                              const synergy = tftDataConnector.getSynergyByName(trait);
                              return (
                                <div 
                                  key={index} 
                                  className="px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-slate-300 border border-slate-600/30 flex items-center space-x-1"
                                >
                                  {synergy?.imageUrl && (
                                    <div className="relative">
                                      {/* Hexagonal gold background */}
                                      <div className="absolute inset-0 w-4 h-4 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-md transform rotate-45 -z-10"></div>
                                      <img 
                                        src={synergy.imageUrl} 
                                        alt={trait}
                                        className="w-4 h-4 object-cover rounded relative z-10"
                                      />
                                    </div>
                                  )}
                                  <span>{trait}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      )}
                      {visibleColumns.winRate && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{(champion.winRate || 0).toFixed(1)}%</span>
                            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  (champion.winRate || 0) >= 70
                                    ? 'bg-green-500'
                                    : (champion.winRate || 0) >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min((champion.winRate || 0), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.avgPlacement && (
                        <td className="px-4 py-3">
                          <span className={`font-medium ${getPlacementColor(champion.avgPlacement || 5)}`}>
                            {(champion.avgPlacement || 5).toFixed(2)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.pickRate && (
                        <td className="px-4 py-3">
                          <span className="text-slate-300">{(champion.pickRate || 0).toFixed(1)}%</span>
                        </td>
                      )}
                      {visibleColumns.tier && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getTierColor(champion.tier || 'C')}`}>
                            {champion.tier || 'C'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.asCarry && (
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {champion.asCarry > 0 ? (
                              <div className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-medium flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>{champion.asCarry}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.asCore && (
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {champion.asCore > 0 ? (
                              <div className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium">
                                {champion.asCore}
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex space-x-1">
                          {getRecommendedItems(champion.name).map((item, index) => (
                            <div key={index} className="relative group/item">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded border-2 border-slate-600/50 bg-slate-800/50 transition-all duration-200 hover:scale-110 hover:border-yellow-400/60"
                                title={item.name}
                              />
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-900/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                                {item.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleChampionSelection(champion.name)}
                            className={`p-1.5 rounded transition-colors ${
                              selectedChampions.includes(champion.name)
                                ? 'text-blue-500 bg-blue-500/10'
                                : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addChampionAsTag(champion.name)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded hover:bg-blue-500/10"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center text-slate-400 py-10">
                Les vues grille et compacte ne sont pas disponibles dans cette page.
                <br />
                Veuillez utiliser la vue tableau pour consulter les statistiques détaillées.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}