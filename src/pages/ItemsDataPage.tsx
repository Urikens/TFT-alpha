import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List, Filter, ChevronDown, ChevronUp, Star, Package } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'tier' | 'pickRate' | 'avgPlacement'>('tier');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTier, setFilterTier] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [patchInfo, setPatchInfo] = useState({ version: '', set: '', lastUpdate: '' });

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
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'tier':
        return a.tier - b.tier;
      case 'pickRate':
        return b.pickRate - a.pickRate;
      case 'avgPlacement':
        return a.avgPlacement - b.avgPlacement;
      default:
        return 0;
    }
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

            {/* Statistiques */}
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

        <div className="p-6">
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
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
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
            <div className="space-y-3">
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