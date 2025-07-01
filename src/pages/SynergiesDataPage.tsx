import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List, Filter, ChevronDown, ChevronUp, Star, Download, SlidersHorizontal, Eye, Sparkles, Users, BarChart3, TrendingUp, Trophy } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { Synergy } from '../types';
import { commonSynergies } from '../data/synergies';

interface TraitStat {
  apiName: string;
  displayName: string;
  count: number;
  style: string;
  stats: {
    nbGames: number;
    nbBoards: number;
    avgPlacement: number;
    top4Percent: number;
    top1Percent: number;
    pickRate: number;
  };
  tier?: string;
  localImageUrl?: string;
}

export default function SynergiesDataPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [synergies, setSynergies] = useState<Synergy[]>([]);
  const [traitStats, setTraitStats] = useState<TraitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSynergies, setSelectedSynergies] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'pickRate' | 'avgPlacement' | 'top4Percent'>('pickRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [filterCount, setFilterCount] = useState<number | 'all'>('all');
  const [patchInfo, setPatchInfo] = useState({ version: '', set: '', lastUpdate: '' });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    count: true,
    style: true,
    pickRate: true,
    avgPlacement: true,
    top4Percent: true,
    top1Percent: true,
    tier: true
  });

  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Charger les synergies de base
        setSynergies(commonSynergies);
        
        // Charger les stats des traits
        const traitsRes = await fetch('/data/tft/traits_stats/tft_traits_stats_processed_1751380439242.json');
        if (!traitsRes.ok) throw new Error('Erreur lors du chargement des stats des traits');
        const traitsData = await traitsRes.json();
        
        // Transformer l'objet en tableau
        const traitsArray = Object.values(traitsData) as TraitStat[];
        
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
        
        setTraitStats(traitsArray);
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

  const addSynergyAsTag = (synergyName: string) => {
    if (!selectedTags.includes(synergyName)) {
      setSelectedTags([...selectedTags, synergyName]);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSelectedTags([]);
  };

  // Filtrage des synergies
  const filteredTraits = traitStats.filter((trait) => {
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) =>
        trait.displayName.toLowerCase().includes(tag.toLowerCase()) ||
        trait.apiName.toLowerCase().includes(tag.toLowerCase())
      );
    const matchesInput =
      inputValue === '' ||
      trait.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
      trait.apiName.toLowerCase().includes(inputValue.toLowerCase());
    const matchesTier =
      filterTier === 'all' || trait.tier === filterTier;
    const matchesStyle =
      filterStyle === 'all' || trait.style === filterStyle;
    const matchesCount =
      filterCount === 'all' || trait.count === filterCount;

    return (
      (matchesTags || matchesInput) &&
      matchesTier &&
      matchesStyle &&
      matchesCount
    );
  });

  // Tri des synergies
  const sortedTraits = [...filteredTraits].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.displayName.localeCompare(b.displayName);
        break;
      case 'count':
        comparison = a.count - b.count;
        break;
      case 'pickRate':
        comparison = b.stats.pickRate - a.stats.pickRate;
        break;
      case 'avgPlacement':
        comparison = a.stats.avgPlacement - b.stats.avgPlacement;
        break;
      case 'top4Percent':
        comparison = b.stats.top4Percent - a.stats.top4Percent;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Toggle synergy selection
  const toggleSynergySelection = (synergyName: string) => {
    setSelectedSynergies((prev) =>
      prev.includes(synergyName)
        ? prev.filter((name) => name !== synergyName)
        : [...prev, synergyName]
    );
  };

  // Gestion des filtres
  const clearAllFilters = () => {
    setFilterTier('all');
    setFilterStyle('all');
    setFilterCount('all');
    setSelectedTags([]);
    setInputValue('');
  };

  // Obtenir les styles uniques
  const uniqueStyles = Array.from(new Set(traitStats.map(trait => trait.style))).sort();
  
  // Obtenir les counts uniques
  const uniqueCounts = Array.from(new Set(traitStats.map(trait => trait.count))).sort((a, b) => a - b);

  // Gestion du tri des colonnes
  const handleColumnSort = (column: 'name' | 'count' | 'pickRate' | 'avgPlacement' | 'top4Percent') => {
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

  // Fonction pour obtenir la couleur du style
  const getStyleColor = (style: string) => {
    switch (style) {
      case '1': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case '2': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case '3': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case '4': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case '5': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case '6': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
      'API Name',
      'Count',
      'Style',
      'Pick Rate',
      'Placement Moyen',
      'Top 4%',
      'Top 1%',
      'Tier'
    ].join(',');
    
    // Convertir les données en lignes CSV
    const rows = sortedTraits.map(trait => [
      trait.displayName,
      trait.apiName,
      trait.count,
      trait.style,
      (trait.stats.pickRate * 100).toFixed(2) + '%',
      trait.stats.avgPlacement.toFixed(2),
      (trait.stats.top4Percent * 100).toFixed(1) + '%',
      (trait.stats.top1Percent * 100).toFixed(1) + '%',
      trait.tier || 'C'
    ].join(','));
    
    // Combiner en-têtes et lignes
    const csvContent = [headers, ...rows].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `synergies_tft_${patchInfo.version}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtenir l'image d'une synergie
  const getSynergyImage = (apiName: string): string => {
    const cleanName = apiName.replace(/^TFT\d+_/, '').toLowerCase();
    const synergy = commonSynergies.find(s => s.name.toLowerCase() === cleanName);
    return synergy?.imageUrl || `/images/traits/${cleanName}.webp`;
  };

  // Obtenir le style en texte
  const getStyleText = (style: string): string => {
    switch (style) {
      case '1': return 'Bronze';
      case '2': return 'Argent';
      case '3': return 'Or';
      case '4': return 'Chromatic';
      case '5': return 'Prismatic';
      case '6': return 'Legendary';
      default: return 'Unknown';
    }
  };

  return (
    <>
      {/* Header de section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Synergies</h2>
            <p className="text-slate-400">
              Statistiques détaillées des synergies du patch {patchInfo.version}
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

      {/* Onglets par tier */}
      <div className="mb-8">
        <div className="border-b border-slate-700/50">
          <div className="flex items-center space-x-6 overflow-x-auto">
            {/* Onglet "Tous" */}
            <button
              onClick={() => setFilterTier('all')}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                filterTier === 'all'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Tous</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {traitStats.length}
              </span>
            </button>

            {/* Onglets par tier */}
            {['S', 'A', 'B', 'C'].map((tier) => {
              const count = traitStats.filter(t => t.tier === tier).length;
              return (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    filterTier === tier
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="font-medium">Tier {tier}</span>
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
                  { value: 'pickRate', label: 'Pick Rate' },
                  { value: 'avgPlacement', label: 'Placement moyen' },
                  { value: 'top4Percent', label: 'Top 4%' },
                  { value: 'count', label: 'Nombre d\'unités' },
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

            {/* Filtres */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="text-white font-medium">Nombre d'unités</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="filterCount"
                    checked={filterCount === 'all'}
                    onChange={() => setFilterCount('all')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    filterCount === 'all' ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                  }`} />
                  <span className="text-slate-300 text-sm">Tous</span>
                </label>
                {uniqueCounts.map(count => (
                  <label key={count} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="filterCount"
                      checked={filterCount === count}
                      onChange={() => setFilterCount(count)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      filterCount === count ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                    }`} />
                    <span className="text-slate-300 text-sm">{count} unités</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Style et statistiques */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-white font-medium">Style</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="filterStyle"
                    checked={filterStyle === 'all'}
                    onChange={() => setFilterStyle('all')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    filterStyle === 'all' ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                  }`} />
                  <span className="text-slate-300 text-sm">Tous</span>
                </label>
                {uniqueStyles.map(style => (
                  <label key={style} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="filterStyle"
                      checked={filterStyle === style}
                      onChange={() => setFilterStyle(style)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      filterStyle === style ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                    }`} />
                    <span className="text-slate-300 text-sm">{getStyleText(style)}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getStyleColor(style)}`}>
                      {style}
                    </span>
                  </label>
                ))}
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
              {sortedTraits.length} synergies trouvées
            </div>
          </div>
        </div>
      )}

      {/* Affichage des synergies */}
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
                <option value="pickRate">Pick Rate</option>
                <option value="avgPlacement">Placement moyen</option>
                <option value="top4Percent">Top 4%</option>
                <option value="count">Nombre d'unités</option>
                <option value="name">Nom</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full font-medium">
              {sortedTraits.length} résultats
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
                Chargement des synergies...
              </p>
            </div>
          ) : sortedTraits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">
                  Aucune synergie trouvée
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
                          <span>Synergie</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.count && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('count')}>
                        <div className="flex items-center space-x-1">
                          <span>Unités</span>
                          {getSortIcon('count')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.style && (
                      <th scope="col" className="px-4 py-3">
                        <span>Style</span>
                      </th>
                    )}
                    {visibleColumns.pickRate && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('pickRate')}>
                        <div className="flex items-center space-x-1">
                          <span>Pick Rate</span>
                          {getSortIcon('pickRate')}
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
                    {visibleColumns.top4Percent && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('top4Percent')}>
                        <div className="flex items-center space-x-1">
                          <span>Top 4%</span>
                          {getSortIcon('top4Percent')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.top1Percent && (
                      <th scope="col" className="px-4 py-3">
                        <span>Top 1%</span>
                      </th>
                    )}
                    {visibleColumns.tier && (
                      <th scope="col" className="px-4 py-3">
                        <span>Tier</span>
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTraits.map((trait) => {
                    const synergyImage = getSynergyImage(trait.apiName);
                    return (
                      <tr 
                        key={`${trait.apiName}_${trait.count}`} 
                        className={`border-b border-slate-700/30 ${
                          hoveredRow === `${trait.apiName}_${trait.count}` ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
                        } transition-colors`}
                        onMouseEnter={() => setHoveredRow(`${trait.apiName}_${trait.count}`)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {visibleColumns.name && (
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {/* Hexagonal gold background */}
                                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-lg transform rotate-45 -z-10"></div>
                                <img 
                                  src={synergyImage} 
                                  alt={trait.displayName} 
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-600/50 relative z-10"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-white">{trait.displayName}</div>
                                <div className="text-xs text-slate-400">{trait.apiName.replace(/^TFT\d+_/, '')}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.count && (
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-400" />
                              <span className="text-white font-medium">{trait.count}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.style && (
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStyleColor(trait.style)}`}>
                              {getStyleText(trait.style)}
                            </span>
                          </td>
                        )}
                        {visibleColumns.pickRate && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{(trait.stats.pickRate * 100).toFixed(2)}%</span>
                              <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                                <div
                                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                                  style={{ width: `${Math.min((trait.stats.pickRate * 100) * 3, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.avgPlacement && (
                          <td className="px-4 py-3">
                            <span className={`font-medium ${getPlacementColor(trait.stats.avgPlacement)}`}>
                              {trait.stats.avgPlacement.toFixed(2)}
                            </span>
                          </td>
                        )}
                        {visibleColumns.top4Percent && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{(trait.stats.top4Percent * 100).toFixed(1)}%</span>
                              <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                                <div
                                  className="h-1.5 rounded-full bg-green-500 transition-all"
                                  style={{ width: `${Math.min((trait.stats.top4Percent * 100), 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.top1Percent && (
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-white">{(trait.stats.top1Percent * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.tier && (
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getTierColor(trait.tier || 'C')}`}>
                              {trait.tier || 'C'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleSynergySelection(trait.displayName)}
                              className={`p-1.5 rounded transition-colors ${
                                selectedSynergies.includes(trait.displayName)
                                  ? 'text-blue-500 bg-blue-500/10'
                                  : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                              }`}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => addSynergyAsTag(trait.displayName)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded hover:bg-blue-500/10"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {sortedTraits.map((trait) => {
                const synergyImage = getSynergyImage(trait.apiName);
                return (
                  <div
                    key={`${trait.apiName}_${trait.count}`}
                    onClick={() => addSynergyAsTag(trait.displayName)}
                    className="group relative overflow-hidden rounded-xl border border-slate-600/20 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-purple-500/50"
                  >
                    {/* Badge tier */}
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm">
                      Tier {trait.tier || 'C'}
                    </div>

                    {/* Badge count */}
                    <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm flex items-center space-x-1">
                      <Users className="w-2 h-2" />
                      <span>{trait.count}</span>
                    </div>

                    {/* Image floutée en fond au hover */}
                    <div
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-15 blur-sm scale-110 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
                      style={{ backgroundImage: `url(${synergyImage})` }}
                    ></div>

                    {/* Contenu */}
                    <div className="relative z-10 flex flex-col items-center space-y-3 mt-4">
                      <div className="relative">
                        {/* Hexagonal gold background */}
                        <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-xl transform rotate-45 -z-10"></div>
                        <img
                          src={synergyImage}
                          alt={trait.displayName}
                          className="w-16 h-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110 relative z-10"
                        />
                      </div>

                      <div className="text-center space-y-2">
                        <h4 className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors duration-200">
                          {trait.displayName}
                        </h4>
                        
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStyleColor(trait.style)}`}>
                            {getStyleText(trait.style)}
                          </span>
                        </div>

                        {/* Stats compactes */}
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-blue-400" />
                            <span className="text-slate-300">{(trait.stats.pickRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-3 h-3 text-green-400" />
                            <span className={`${getPlacementColor(trait.stats.avgPlacement)}`}>{trait.stats.avgPlacement.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {sortedTraits.map((trait) => {
                const synergyImage = getSynergyImage(trait.apiName);
                return (
                  <div
                    key={`${trait.apiName}_${trait.count}`}
                    onClick={() => addSynergyAsTag(trait.displayName)}
                    className="group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border border-slate-600/20 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-purple-500/50 hover:bg-slate-600/30"
                  >
                    {/* Fond flouté pour la ligne */}
                    <div
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-sm scale-100 transition-all duration-500 group-hover:opacity-40 group-hover:blur-md"
                      style={{ backgroundImage: `url(${synergyImage})` }}
                    ></div>

                    {/* Overlay pour améliorer la lisibilité */}
                    <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

                    {/* Image de la synergie */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="relative">
                        {/* Hexagonal gold background */}
                        <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-xl transform rotate-45 -z-10"></div>
                        <img
                          src={synergyImage}
                          alt={trait.displayName}
                          className="w-16 h-16 rounded-lg object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-purple-400/60 relative z-10"
                        />
                      </div>
                    </div>

                    <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      {/* Nom et badges */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-semibold text-base group-hover:text-purple-300 transition-colors drop-shadow-sm">
                            {trait.displayName}
                          </h4>
                          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getTierColor(trait.tier || 'C')}`}>
                            {trait.tier || 'C'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-400 text-sm">{trait.apiName.replace(/^TFT\d+_/, '')}</span>
                        </div>
                      </div>

                      {/* Unités et style */}
                      <div className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2 mb-1">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">{trait.count}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getStyleColor(trait.style)}`}>
                            {getStyleText(trait.style)}
                          </span>
                        </div>
                      </div>

                      {/* Pick Rate */}
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">{(trait.stats.pickRate * 100).toFixed(2)}%</div>
                        <div className="text-xs text-slate-400">Pick Rate</div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                          <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.min((trait.stats.pickRate * 100) * 3, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Placement moyen */}
                      <div className="text-center">
                        <div className={`text-sm font-medium ${getPlacementColor(trait.stats.avgPlacement)}`}>
                          {trait.stats.avgPlacement.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">Avg Placement</div>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          trait.stats.avgPlacement <= 3.5
                            ? 'bg-green-500/20 text-green-400'
                            : trait.stats.avgPlacement <= 4.2
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trait.stats.avgPlacement <= 3.5 ? '↗' : 
                          trait.stats.avgPlacement <= 4.2 ? '→' : '↘'}
                        </div>
                      </div>

                      {/* Top 4% et Top 1% */}
                      <div className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-green-400">{(trait.stats.top4Percent * 100).toFixed(1)}%</div>
                            <span className="text-xs text-slate-400">Top 4</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-yellow-400">{(trait.stats.top1Percent * 100).toFixed(1)}%</div>
                            <span className="text-xs text-slate-400">Top 1</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}