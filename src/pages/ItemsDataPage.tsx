import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List, Filter, ChevronDown, ChevronUp, Star, Package, Download, SlidersHorizontal, Eye, EyeOff } from 'lucide-react';
import { Item } from '../types';
import SearchBar from '../components/SearchBar';
import FilterHub from '../components/FilterHub';
import ItemCard from '../components/ItemCard';

export default function ItemsDataPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'tier' | 'pickRate' | 'avgPlacement'>('tier');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTier, setFilterTier] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [patchInfo, setPatchInfo] = useState({ version: '', set: '', lastUpdate: '' });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    tier: true,
    type: true,
    pickRate: true,
    avgPlacement: true,
    top4Percent: true,
    top1Percent: true,
    craftable: true
  });

  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Charger les items enrichis
        const itemsRes = await fetch('/data/tft/individual_items/individual_items_stats_1751380429632.json');
        if (!itemsRes.ok) throw new Error('Erreur lors du chargement des items');
        const itemsData = await itemsRes.json();
        
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
        
        // Transformer l'objet en tableau
        const itemsArray = Object.values(itemsData).map((item: any) => ({
          key: item.key,
          name: item.name || item.key.replace('TFT_Item_', '').replace('TFT14_Item_', ''),
          imageUrl: item.localImageUrl || `/images/items/${item.key.replace('TFT_Item_', '')}.webp`,
          desc: `Tier ${item.stats.tier} item with ${(item.stats.pick_rate * 100).toFixed(1)}% pick rate`,
          shortDesc: `Avg placement: ${item.stats.avg_placement.toFixed(2)}`,
          fromDesc: item.stats.craftable ? 'Craftable item' : 'Special item',
          isEmblem: item.key.includes('EmblemItem'),
          isUnique: item.stats.item_type === 'ornn',
          tags: [item.stats.item_type],
          tier: item.stats.tier,
          score: item.stats.score,
          pickRate: item.stats.pick_rate,
          avgPlacement: item.stats.avg_placement,
          top4Percent: item.stats.top_4_percent,
          top1Percent: item.stats.top_1_percent,
          itemType: item.stats.item_type,
          craftable: item.stats.craftable
        }));
        
        setItems(itemsArray);
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

  const addItemAsTag = (itemName: string) => {
    if (!selectedTags.includes(itemName)) {
      setSelectedTags([...selectedTags, itemName]);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSelectedTags([]);
  };

  // Filtrage des items
  const filteredItems = items.filter((item) => {
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) =>
        item.name.toLowerCase().includes(tag.toLowerCase()) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
      );
    const matchesInput =
      inputValue === '' ||
      item.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(inputValue.toLowerCase())));
    const matchesTier =
      filterTier === 'all' || item.tier === filterTier;
    const matchesType =
      filterType === 'all' || item.itemType === filterType;

    return (
      (matchesTags || matchesInput) &&
      matchesTier &&
      matchesType
    );
  });

  // Tri des items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'tier':
        comparison = a.tier - b.tier;
        break;
      case 'pickRate':
        comparison = b.pickRate - a.pickRate;
        break;
      case 'avgPlacement':
        comparison = a.avgPlacement - b.avgPlacement;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Toggle item selection
  const toggleItemSelection = (itemKey: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemKey)
        ? prev.filter((key) => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  // Gestion des filtres
  const clearAllFilters = () => {
    setFilterTier('all');
    setFilterType('all');
    setSelectedTags([]);
    setInputValue('');
  };

  // Obtenir les types d'items uniques
  const itemTypes = Array.from(new Set(items.map(item => item.itemType)));

  // Gestion du tri des colonnes
  const handleColumnSort = (column: 'name' | 'tier' | 'pickRate' | 'avgPlacement') => {
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
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 2: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 3: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 4: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 5: return 'bg-red-500/20 text-red-400 border-red-500/30';
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
      'Tier',
      'Type',
      'Pick Rate',
      'Placement Moyen',
      'Top 4%',
      'Top 1%',
      'Craftable'
    ].join(',');
    
    // Convertir les données en lignes CSV
    const rows = sortedItems.map(item => [
      item.name,
      item.tier,
      item.itemType,
      (item.pickRate * 100).toFixed(1) + '%',
      item.avgPlacement.toFixed(2),
      (item.top4Percent * 100).toFixed(1) + '%',
      (item.top1Percent * 100).toFixed(1) + '%',
      item.craftable ? 'Oui' : 'Non'
    ].join(','));
    
    // Combiner en-têtes et lignes
    const csvContent = [headers, ...rows].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `items_tft_${patchInfo.version}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Header de section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Items</h2>
            <p className="text-slate-400">
              Statistiques détaillées des items du patch {patchInfo.version}
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
              <span className="font-medium">Tous</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </button>

            {/* Onglets par tier */}
            {[1, 2, 3, 4, 5].map((tier) => {
              const count = items.filter(i => i.tier === tier).length;
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
                  { value: 'tier', label: 'Tier' },
                  { value: 'pickRate', label: 'Pick Rate' },
                  { value: 'avgPlacement', label: 'Placement moyen' },
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

            {/* Types d'items */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-green-400" />
                <h3 className="text-white font-medium">Type d'item</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="filterType"
                    checked={filterType === 'all'}
                    onChange={() => setFilterType('all')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    filterType === 'all' ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                  }`} />
                  <span className="text-slate-300 text-sm">Tous</span>
                </label>
                {itemTypes.map(type => (
                  <label key={type} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="filterType"
                      checked={filterType === type}
                      onChange={() => setFilterType(type)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      filterType === type ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                    }`} />
                    <span className="text-slate-300 text-sm capitalize">{type}</span>
                  </label>
                ))}
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
                  <div className="text-lg font-bold text-white">{items.length}</div>
                  <div className="text-xs text-slate-400">Total Items</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {items.filter(i => i.craftable).length}
                  </div>
                  <div className="text-xs text-slate-400">Craftables</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {items.filter(i => i.isEmblem).length}
                  </div>
                  <div className="text-xs text-slate-400">Emblèmes</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-400">
                    {items.filter(i => i.isUnique).length}
                  </div>
                  <div className="text-xs text-slate-400">Uniques</div>
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
              {sortedItems.length} items trouvés
            </div>
          </div>
        </div>
      )}

      {/* Affichage des items */}
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
                <option value="tier">Tier</option>
                <option value="pickRate">Pick Rate</option>
                <option value="avgPlacement">Placement moyen</option>
                <option value="name">Nom</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full font-medium">
              {sortedItems.length} résultats
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
                Chargement des items...
              </p>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">
                  Aucun item trouvé
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
                          <span>Item</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.tier && (
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('tier')}>
                        <div className="flex items-center space-x-1">
                          <span>Tier</span>
                          {getSortIcon('tier')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.type && (
                      <th scope="col" className="px-4 py-3">
                        <span>Type</span>
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
                      <th scope="col" className="px-4 py-3">
                        <span>Top 4%</span>
                      </th>
                    )}
                    {visibleColumns.top1Percent && (
                      <th scope="col" className="px-4 py-3">
                        <span>Top 1%</span>
                      </th>
                    )}
                    {visibleColumns.craftable && (
                      <th scope="col" className="px-4 py-3">
                        <span>Craftable</span>
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr 
                      key={item.key} 
                      className={`border-b border-slate-700/30 ${
                        hoveredRow === item.key ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
                      } transition-colors`}
                      onMouseEnter={() => setHoveredRow(item.key)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {visibleColumns.name && (
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-lg object-cover border border-slate-600/50"
                            />
                            <div>
                              <div className="font-medium text-white">{item.name}</div>
                              {item.isEmblem && (
                                <div className="text-xs text-purple-400">Emblème</div>
                              )}
                              {item.isUnique && (
                                <div className="text-xs text-yellow-400">Unique</div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.tier && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getTierColor(item.tier)}`}>
                            {item.tier}
                          </span>
                        </td>
                      )}
                      {visibleColumns.type && (
                        <td className="px-4 py-3">
                          <span className="text-slate-300 capitalize">{item.itemType}</span>
                        </td>
                      )}
                      {visibleColumns.pickRate && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{(item.pickRate * 100).toFixed(1)}%</span>
                            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                              <div
                                className="h-1.5 rounded-full bg-blue-500 transition-all"
                                style={{ width: `${Math.min((item.pickRate * 100) * 3, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.avgPlacement && (
                        <td className="px-4 py-3">
                          <span className={`font-medium ${getPlacementColor(item.avgPlacement)}`}>
                            {item.avgPlacement.toFixed(2)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.top4Percent && (
                        <td className="px-4 py-3">
                          <span className="text-slate-300">{(item.top4Percent * 100).toFixed(1)}%</span>
                        </td>
                      )}
                      {visibleColumns.top1Percent && (
                        <td className="px-4 py-3">
                          <span className="text-slate-300">{(item.top1Percent * 100).toFixed(1)}%</span>
                        </td>
                      )}
                      {visibleColumns.craftable && (
                        <td className="px-4 py-3">
                          <span className={item.craftable ? 'text-green-400' : 'text-red-400'}>
                            {item.craftable ? 'Oui' : 'Non'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleItemSelection(item.key)}
                            className={`p-1.5 rounded transition-colors ${
                              selectedItems.includes(item.key)
                                ? 'text-blue-500 bg-blue-500/10'
                                : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addItemAsTag(item.name)}
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
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {sortedItems.map((item) => (
                <ItemCard
                  key={item.key}
                  item={item}
                  viewMode={viewMode}
                  isSelected={selectedItems.includes(item.key)}
                  onToggleSelect={toggleItemSelection}
                  onAddAsTag={addItemAsTag}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {sortedItems.map((item) => (
                <ItemCard
                  key={item.key}
                  item={item}
                  viewMode={viewMode}
                  isSelected={selectedItems.includes(item.key)}
                  onToggleSelect={toggleItemSelection}
                  onAddAsTag={addItemAsTag}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}