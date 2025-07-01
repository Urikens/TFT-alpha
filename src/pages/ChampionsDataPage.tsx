import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Crown, 
  Zap, 
  Heart, 
  Flame,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Settings,
  Grid3X3,
  List,
  Maximize2,
  Minimize2,
  Shield,
  Sword,
  Activity,
  Target,
  Info,
  ExternalLink,
  Copy,
  BookOpen,
  Sparkles,
  Users,
  Trophy,
  X,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Share2,
  FileText,
  Database,
  Layers,
  Gauge
} from 'lucide-react';
import { Champion, Item } from '../types';
import { commonSynergies } from '../data/synergies';

type SortField = 'name' | 'cost' | 'health' | 'attackDamage' | 'attackSpeed' | 'armor' | 'magicalResistance' | 'attackRange' | 'damagePerSecond' | 'startingMana' | 'skillMana';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'cards' | 'compact' | 'detailed';

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
  category: 'basic' | 'combat' | 'skill' | 'items' | 'meta';
  icon: React.ReactNode;
}

interface ChampionFilter {
  search: string;
  traits: string[];
  costs: number[];
  favorites: boolean;
  meta: boolean;
  minWinRate: number;
  maxWinRate: number;
  minPickRate: number;
  maxPickRate: number;
}

export default function ChampionsDataPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedChampions, setSelectedChampions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [savedFilters, setSavedFilters] = useState<string[]>([]);

  // Filtres avancés
  const [filters, setFilters] = useState<ChampionFilter>({
    search: '',
    traits: [],
    costs: [],
    favorites: false,
    meta: false,
    minWinRate: 0,
    maxWinRate: 100,
    minPickRate: 0,
    maxPickRate: 100,
  });

  // Configuration des colonnes avec icônes et catégories
  const [columns, setColumns] = useState<TableColumn[]>([
    // Colonnes de base
    { key: 'champion', label: 'Champion', sortable: true, visible: true, width: '280px', category: 'basic', icon: <Crown className="w-4 h-4" /> },
    { key: 'cost', label: 'Coût', sortable: true, visible: true, width: '80px', category: 'basic', icon: <Zap className="w-4 h-4" /> },
    { key: 'traits', label: 'Synergies', sortable: false, visible: true, width: '220px', category: 'basic', icon: <Sparkles className="w-4 h-4" /> },
    
    // Statistiques de combat
    { key: 'health', label: 'PV', sortable: true, visible: true, width: '100px', category: 'combat', icon: <Heart className="w-4 h-4" /> },
    { key: 'attackDamage', label: 'Dégâts', sortable: true, visible: true, width: '100px', category: 'combat', icon: <Sword className="w-4 h-4" /> },
    { key: 'damagePerSecond', label: 'DPS', sortable: true, visible: true, width: '80px', category: 'combat', icon: <Activity className="w-4 h-4" /> },
    { key: 'attackSpeed', label: 'AS', sortable: true, visible: false, width: '80px', category: 'combat', icon: <Gauge className="w-4 h-4" /> },
    { key: 'attackRange', label: 'Portée', sortable: true, visible: false, width: '80px', category: 'combat', icon: <Target className="w-4 h-4" /> },
    { key: 'armor', label: 'Armure', sortable: true, visible: true, width: '80px', category: 'combat', icon: <Shield className="w-4 h-4" /> },
    { key: 'magicalResistance', label: 'RM', sortable: true, visible: true, width: '80px', category: 'combat', icon: <Sparkles className="w-4 h-4" /> },
    
    // Compétences
    { key: 'skill', label: 'Compétence', sortable: false, visible: true, width: '200px', category: 'skill', icon: <Zap className="w-4 h-4" /> },
    { key: 'startingMana', label: 'Mana Initial', sortable: true, visible: false, width: '100px', category: 'skill', icon: <Database className="w-4 h-4" /> },
    { key: 'skillMana', label: 'Mana Max', sortable: true, visible: false, width: '100px', category: 'skill', icon: <Database className="w-4 h-4" /> },
    
    // Meta et items
    { key: 'winRate', label: 'Winrate', sortable: true, visible: true, width: '100px', category: 'meta', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'pickRate', label: 'Pick Rate', sortable: true, visible: true, width: '100px', category: 'meta', icon: <Users className="w-4 h-4" /> },
    { key: 'recommendItems', label: 'Items Recommandés', sortable: false, visible: true, width: '200px', category: 'items', icon: <Trophy className="w-4 h-4" /> },
    { key: 'actions', label: 'Actions', sortable: false, visible: true, width: '120px', category: 'basic', icon: <Settings className="w-4 h-4" /> }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [championsRes, itemsRes] = await Promise.all([
          fetch('/src/data/champions_TFT14.json'),
          fetch('/src/data/items_TFT14.json')
        ]);

        const championsData = await championsRes.json();
        const itemsData = await itemsRes.json();

        // Ajouter des statistiques simulées
        const championsWithStats = championsData.map((champion: Champion) => ({
          ...champion,
          winRate: Math.floor(Math.random() * 30) + 45,
          pickRate: Math.floor(Math.random() * 25) + 5,
          isMeta: Math.random() < 0.3
        }));

        setChampions(championsWithStats);
        setItems(itemsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtrage et tri
  const filteredAndSortedChampions = champions
    .filter(champion => {
      const matchesSearch = champion.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesTraits = filters.traits.length === 0 || 
        filters.traits.some(trait => champion.traits?.includes(trait));
      const matchesCost = filters.costs.length === 0 || 
        filters.costs.includes(champion.cost[0]);
      const matchesFavorites = !filters.favorites || favorites.includes(champion.name);
      const matchesMeta = !filters.meta || champion.isMeta;
      const matchesWinRate = (champion.winRate || 0) >= filters.minWinRate && (champion.winRate || 0) <= filters.maxWinRate;
      const matchesPickRate = (champion.pickRate || 0) >= filters.minPickRate && (champion.pickRate || 0) <= filters.maxPickRate;

      return matchesSearch && matchesTraits && matchesCost && matchesFavorites && matchesMeta && matchesWinRate && matchesPickRate;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'cost':
          aValue = a.cost[0];
          bValue = b.cost[0];
          break;
        case 'health':
          aValue = a.health[0];
          bValue = b.health[0];
          break;
        case 'attackDamage':
          aValue = a.attackDamage[0];
          bValue = b.attackDamage[0];
          break;
        case 'damagePerSecond':
          aValue = a.damagePerSecond[0];
          bValue = b.damagePerSecond[0];
          break;
        case 'attackSpeed':
          aValue = a.attackSpeed;
          bValue = b.attackSpeed;
          break;
        case 'attackRange':
          aValue = a.attackRange;
          bValue = b.attackRange;
          break;
        case 'armor':
          aValue = a.armor;
          bValue = b.armor;
          break;
        case 'magicalResistance':
          aValue = a.magicalResistance;
          bValue = b.magicalResistance;
          break;
        case 'startingMana':
          aValue = a.skill?.startingMana || 0;
          bValue = b.skill?.startingMana || 0;
          break;
        case 'skillMana':
          aValue = a.skill?.skillMana || 0;
          bValue = b.skill?.skillMana || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedChampions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChampions = filteredAndSortedChampions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleFavorite = (championName: string) => {
    setFavorites(prev => 
      prev.includes(championName)
        ? prev.filter(name => name !== championName)
        : [...prev, championName]
    );
  };

  const toggleChampionSelection = (championKey: string) => {
    setSelectedChampions(prev => 
      prev.includes(championKey)
        ? prev.filter(key => key !== championKey)
        : [...prev, championKey]
    );
  };

  const selectAllChampions = () => {
    if (selectedChampions.length === paginatedChampions.length) {
      setSelectedChampions([]);
    } else {
      setSelectedChampions(paginatedChampions.map(c => c.key));
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      traits: [],
      costs: [],
      favorites: false,
      meta: false,
      minWinRate: 0,
      maxWinRate: 100,
      minPickRate: 0,
      maxPickRate: 100,
    });
  };

  const saveCurrentFilter = () => {
    const filterName = `Filtre ${savedFilters.length + 1}`;
    setSavedFilters(prev => [...prev, filterName]);
  };

  const getCostColor = (cost: number) => {
    const colors = {
      1: 'from-gray-500 to-gray-600',
      2: 'from-green-500 to-green-600',
      3: 'from-blue-500 to-blue-600',
      4: 'from-purple-500 to-purple-600',
      5: 'from-yellow-500 to-yellow-600'
    };
    return colors[cost as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getSynergyData = (synergyName: string) => {
    const synergy = commonSynergies.find(s => s.name === synergyName);
    return synergy || { name: synergyName, color: 'from-gray-500 to-gray-600', imageUrl: '' };
  };

  const getRecommendedItems = (champion: Champion) => {
    return (champion.recommendItems || [])
      .map(itemKey => items.find(item => item.key === itemKey))
      .filter(Boolean) as Item[];
  };

  const openChampionDetails = (champion: Champion) => {
    setSelectedChampion(champion);
    setShowChampionModal(true);
  };

  const visibleColumns = columns.filter(col => col.visible);
  const columnsByCategory = columns.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = [];
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, TableColumn[]>);

  const categoryLabels = {
    basic: 'Informations de base',
    combat: 'Statistiques de combat',
    skill: 'Compétences',
    meta: 'Méta & Performance',
    items: 'Items & Équipement'
  };

  const categoryIcons = {
    basic: <Crown className="w-4 h-4" />,
    combat: <Sword className="w-4 h-4" />,
    skill: <Sparkles className="w-4 h-4" />,
    meta: <TrendingUp className="w-4 h-4" />,
    items: <Trophy className="w-4 h-4" />
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-400 text-lg font-medium">Chargement de la base de données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="max-w-full mx-auto px-6 py-8">
        {/* Header moderne avec statistiques */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Champions</h2>
              <p className="text-slate-400">
                Découvrez et filtrez tous les champions du set actuel
              </p>
            </div>
          </div>

            <div className="flex items-center space-x-4">
              {/* Modes de vue */}
              <div className="flex items-center space-x-1 bg-slate-800/60 rounded-xl border border-slate-600/50 p-1">
                {[
                  { mode: 'table', icon: <List className="w-4 h-4" />, label: 'Tableau' },
                  { mode: 'cards', icon: <Grid3X3 className="w-4 h-4" />, label: 'Cartes' },
                  { mode: 'compact', icon: <Layers className="w-4 h-4" />, label: 'Compact' },
                  { mode: 'detailed', icon: <FileText className="w-4 h-4" />, label: 'Détaillé' }
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    title={label}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et contrôles avancés */}
        <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {/* Recherche principale */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un champion, une synergie, une compétence..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all ${
                  showFilters ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
                {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== false && v !== 0 && v !== 100 && v !== '').length > 0 && (
                  <span className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== false && v !== 0 && v !== 100 && v !== '').length}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowColumnConfig(!showColumnConfig)}
                  className="flex items-center space-x-2 px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span>Colonnes</span>
                </button>
                
                {showColumnConfig && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-2xl z-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-semibold">Configuration des colonnes</h4>
                      <button
                        onClick={() => setShowColumnConfig(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {Object.entries(columnsByCategory).map(([category, cols]) => (
                        <div key={category}>
                          <h5 className="text-slate-300 font-medium mb-3 capitalize flex items-center space-x-2">
                            {categoryIcons[category as keyof typeof categoryIcons]}
                            <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                          </h5>
                          <div className="space-y-2 ml-6">
                            {cols.map(column => (
                              <label key={column.key} className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={column.visible}
                                  onChange={() => toggleColumnVisibility(column.key)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                  column.visible ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-blue-400'
                                }`}>
                                  {column.visible && <Eye className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {column.icon}
                                  <span className="text-slate-300 text-sm">{column.label}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-700/30">
                      <button
                        onClick={() => setColumns(prev => prev.map(col => ({ ...col, visible: true })))}
                        className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                      >
                        Tout afficher
                      </button>
                      <button
                        onClick={() => setColumns(prev => prev.map(col => ({ ...col, visible: col.category === 'basic' })))}
                        className="flex-1 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
                      >
                        Base seulement
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={resetFilters}
                className="p-3 text-slate-400 hover:text-red-400 transition-colors bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-red-500/50"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panneau de filtres avancés */}
          {showFilters && (
            <div className="border-t border-slate-700/30 pt-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Synergies */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Synergies</span>
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {commonSynergies.slice(0, 8).map(synergy => (
                      <label key={synergy.name} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.traits.includes(synergy.name)}
                          onChange={() => {
                            setFilters(prev => ({
                              ...prev,
                              traits: prev.traits.includes(synergy.name)
                                ? prev.traits.filter(t => t !== synergy.name)
                                : [...prev.traits, synergy.name]
                            }));
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 transition-all ${
                          filters.traits.includes(synergy.name) ? 'bg-purple-500 border-purple-500' : 'border-slate-500 group-hover:border-purple-400'
                        }`} />
                        <img 
                          src={synergy.imageUrl} 
                          alt={synergy.name}
                          className="w-4 h-4 object-cover rounded"
                        />
                        <span className="text-slate-300 text-sm">{synergy.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Coût */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Coût</span>
                  </h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(cost => (
                      <label key={cost} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.costs.includes(cost)}
                          onChange={() => {
                            setFilters(prev => ({
                              ...prev,
                              costs: prev.costs.includes(cost)
                                ? prev.costs.filter(c => c !== cost)
                                : [...prev.costs, cost]
                            }));
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 transition-all ${
                          filters.costs.includes(cost) ? 'bg-yellow-500 border-yellow-500' : 'border-slate-500 group-hover:border-yellow-400'
                        }`} />
                        <span className="text-slate-300 text-sm">{cost} pièce{cost > 1 ? 's' : ''}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span>Performance</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Winrate: {filters.minWinRate}% - {filters.maxWinRate}%</label>
                      <div className="flex space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.minWinRate}
                          onChange={(e) => setFilters(prev => ({ ...prev, minWinRate: parseInt(e.target.value) }))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.maxWinRate}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxWinRate: parseInt(e.target.value) }))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Pick Rate: {filters.minPickRate}% - {filters.maxPickRate}%</label>
                      <div className="flex space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.minPickRate}
                          onChange={(e) => setFilters(prev => ({ ...prev, minPickRate: parseInt(e.target.value) }))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.maxPickRate}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxPickRate: parseInt(e.target.value) }))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options et actions */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span>Options</span>
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.favorites}
                        onChange={(e) => setFilters(prev => ({ ...prev, favorites: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 ${
                        filters.favorites ? 'bg-pink-500 border-pink-500' : 'border-slate-500'
                      }`} />
                      <span className="text-slate-300 text-sm">Favoris uniquement</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.meta}
                        onChange={(e) => setFilters(prev => ({ ...prev, meta: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 ${
                        filters.meta ? 'bg-orange-500 border-orange-500' : 'border-slate-500'
                      }`} />
                      <span className="text-slate-300 text-sm">Meta uniquement</span>
                    </label>
                    
                    <div className="pt-2 space-y-2">
                      <button
                        onClick={saveCurrentFilter}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder</span>
                      </button>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value={10}>10 par page</option>
                        <option value={25}>25 par page</option>
                        <option value={50}>50 par page</option>
                        <option value={100}>100 par page</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenu principal selon le mode de vue */}
        {viewMode === 'table' ? (
          <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 overflow-hidden shadow-2xl">
            {/* Header du tableau avec actions en lot */}
            <div className="p-4 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChampions.length === paginatedChampions.length && paginatedChampions.length > 0}
                      onChange={selectAllChampions}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedChampions.length === paginatedChampions.length && paginatedChampions.length > 0
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-slate-500'
                    }`} />
                    <span className="text-slate-300 text-sm">
                      {selectedChampions.length > 0 ? `${selectedChampions.length} sélectionné(s)` : 'Tout sélectionner'}
                    </span>
                  </label>

                  {selectedChampions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 bg-pink-600/20 text-pink-400 rounded-lg hover:bg-pink-600/30 transition-colors text-sm">
                        <Heart className="w-3 h-3" />
                        <span>Favoris</span>
                      </button>
                      <button className="flex items-center space-x-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors text-sm">
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </button>
                      <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm">
                        <Share2 className="w-3 h-3" />
                        <span>Partager</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-xs text-slate-500">
                    Page {currentPage} sur {totalPages} • {filteredAndSortedChampions.length} champions
                  </div>
                  <div className="flex items-center space-x-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    <select
                      value={`${sortField}-${sortDirection}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-');
                        setSortField(field as SortField);
                        setSortDirection(direction as SortDirection);
                      }}
                      className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1 text-white text-sm"
                    >
                      <option value="name-asc">Nom (A-Z)</option>
                      <option value="name-desc">Nom (Z-A)</option>
                      <option value="cost-asc">Coût (croissant)</option>
                      <option value="cost-desc">Coût (décroissant)</option>
                      <option value="health-desc">PV (élevé)</option>
                      <option value="attackDamage-desc">Dégâts (élevé)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="w-12 p-4">
                      <input
                        type="checkbox"
                        checked={selectedChampions.length === paginatedChampions.length && paginatedChampions.length > 0}
                        onChange={selectAllChampions}
                        className="rounded border-slate-600"
                      />
                    </th>
                    {visibleColumns.map(column => (
                      <th
                        key={column.key}
                        className={`p-4 text-left text-slate-300 font-semibold ${column.width ? `w-[${column.width}]` : ''}`}
                      >
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key as SortField)}
                            className="flex items-center space-x-2 hover:text-white transition-colors group"
                          >
                            {column.icon}
                            <span>{column.label}</span>
                            {sortField === column.key && (
                              sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {column.icon}
                            <span>{column.label}</span>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedChampions.map((champion, index) => (
                    <tr
                      key={champion.key}
                      className={`border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                        selectedChampions.includes(champion.key) ? 'bg-blue-500/10' : ''
                      }`}
                      onClick={() => openChampionDetails(champion)}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedChampions.includes(champion.key)}
                          onChange={() => toggleChampionSelection(champion.key)}
                          className="rounded border-slate-600"
                        />
                      </td>

                      {/* Champion */}
                      {visibleColumns.find(col => col.key === 'champion') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={champion.imageUrl}
                                alt={champion.name}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-slate-600"
                              />
                              {champion.isMeta && (
                                <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                                  <Flame className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{champion.name}</div>
                              <div className="text-slate-400 text-sm">
                                {champion.skill?.name || 'Compétence inconnue'}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Coût */}
                      {visibleColumns.find(col => col.key === 'cost') && (
                        <td className="p-4">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${getCostColor(champion.cost[0])} text-white font-bold text-sm`}>
                            {champion.cost[0]}
                          </div>
                        </td>
                      )}

                      {/* Synergies */}
                      {visibleColumns.find(col => col.key === 'traits') && (
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {champion.traits?.slice(0, 3).map((trait, i) => {
                              const synergyData = getSynergyData(trait);
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gradient-to-r ${synergyData.color} text-white`}
                                >
                                  {synergyData.imageUrl && (
                                    <img 
                                      src={synergyData.imageUrl} 
                                      alt={trait}
                                      className="w-3 h-3 object-cover rounded"
                                    />
                                  )}
                                  <span>{trait}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      )}

                      {/* Autres colonnes avec icônes */}
                      {visibleColumns.find(col => col.key === 'health') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-red-400" />
                            <span className="text-white font-medium">{champion.health[0]}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'attackDamage') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Sword className="w-4 h-4 text-orange-400" />
                            <span className="text-white font-medium">{champion.attackDamage[0]}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'damagePerSecond') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-medium">{champion.damagePerSecond[0]}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'armor') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-white">{champion.armor}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'magicalResistance') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-white">{champion.magicalResistance}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'skill') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <img
                              src={champion.skill?.imageUrl}
                              alt={champion.skill?.name}
                              className="w-8 h-8 rounded border border-slate-600"
                            />
                            <div>
                              <div className="text-white text-sm font-medium">{champion.skill?.name}</div>
                              <div className="text-slate-400 text-xs">
                                {champion.skill?.startingMana}/{champion.skill?.skillMana} mana
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'winRate') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              (champion.winRate || 0) >= 60 ? 'bg-green-500' : 
                              (champion.winRate || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-white font-medium">{champion.winRate}%</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'pickRate') && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">{champion.pickRate}%</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'recommendItems') && (
                        <td className="p-4">
                          <div className="flex space-x-1">
                            {getRecommendedItems(champion).slice(0, 3).map((item, index) => (
                              <img
                                key={index}
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded border border-slate-600/50"
                                title={item.name}
                              />
                            ))}
                            {champion.recommendItems && champion.recommendItems.length > 3 && (
                              <div className="w-6 h-6 bg-slate-700 rounded border border-slate-600/50 flex items-center justify-center text-xs text-slate-400">
                                +{champion.recommendItems.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {visibleColumns.find(col => col.key === 'actions') && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleFavorite(champion.name)}
                              className={`p-2 rounded-lg transition-colors ${
                                favorites.includes(champion.name)
                                  ? 'text-pink-500 bg-pink-500/10'
                                  : 'text-slate-400 hover:text-pink-400 hover:bg-pink-500/10'
                              }`}
                            >
                              <Heart className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10">
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination améliorée */}
            <div className="p-4 border-t border-slate-700/30 bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-slate-400 text-sm">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedChampions.length)} sur {filteredAndSortedChampions.length} champions
                  </div>
                  {selectedChampions.length > 0 && (
                    <div className="text-blue-400 text-sm font-medium">
                      {selectedChampions.length} sélectionné(s)
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-2" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Autres modes de vue (cards, compact, detailed) */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Grid3X3 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Mode {viewMode} en développement</h3>
            <p className="text-slate-400">Ce mode d'affichage sera bientôt disponible.</p>
          </div>
        )}

        {filteredAndSortedChampions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Aucun champion trouvé</h3>
            <p className="text-slate-400 mb-4">Essayez d'ajuster vos filtres de recherche.</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Modal détails champion */}
        {showChampionModal && selectedChampion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChampionModal(false)}></div>
            
            <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowChampionModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start space-x-6 mb-8">
                <div className="relative">
                  <img
                    src={selectedChampion.imageUrl}
                    alt={selectedChampion.name}
                    className="w-32 h-32 rounded-xl object-cover border-2 border-slate-600"
                  />
                  {selectedChampion.isMeta && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-2">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-3">{selectedChampion.name}</h2>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getCostColor(selectedChampion.cost[0])} text-white font-bold`}>
                      Coût: {selectedChampion.cost[0]}
                    </div>
                    <div className="text-slate-400">Portée: {selectedChampion.attackRange}</div>
                    <div className="text-slate-400">AS: {selectedChampion.attackSpeed}</div>
                    {selectedChampion.winRate && (
                      <div className="text-green-400 font-bold">WR: {selectedChampion.winRate}%</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedChampion.traits?.map((trait, i) => {
                      const synergyData = getSynergyData(trait);
                      return (
                        <div
                          key={i}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-gradient-to-r ${synergyData.color} text-white`}
                        >
                          {synergyData.imageUrl && (
                            <img 
                              src={synergyData.imageUrl} 
                              alt={trait}
                              className="w-4 h-4 object-cover rounded"
                            />
                          )}
                          <span>{trait}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                    <Sword className="w-5 h-5 text-orange-400" />
                    <span>Statistiques de Combat</span>
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Points de Vie', value: selectedChampion.health.join(' / '), icon: <Heart className="w-4 h-4 text-red-400" /> },
                      { label: 'Dégâts d\'Attaque', value: selectedChampion.attackDamage.join(' / '), icon: <Sword className="w-4 h-4 text-orange-400" /> },
                      { label: 'DPS', value: selectedChampion.damagePerSecond.join(' / '), icon: <Activity className="w-4 h-4 text-yellow-400" /> },
                      { label: 'Armure', value: selectedChampion.armor, icon: <Shield className="w-4 h-4 text-blue-400" /> },
                      { label: 'Résistance Magique', value: selectedChampion.magicalResistance, icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                      { label: 'Vitesse d\'Attaque', value: selectedChampion.attackSpeed, icon: <Gauge className="w-4 h-4 text-cyan-400" /> },
                      { label: 'Portée d\'Attaque', value: selectedChampion.attackRange, icon: <Target className="w-4 h-4 text-green-400" /> }
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {stat.icon}
                          <span className="text-slate-300">{stat.label}:</span>
                        </div>
                        <span className="text-white font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span>Compétence</span>
                  </h3>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={selectedChampion.skill?.imageUrl}
                        alt={selectedChampion.skill?.name}
                        className="w-16 h-16 rounded-lg border border-slate-600"
                      />
                      <div>
                        <div className="text-white font-bold text-lg">{selectedChampion.skill?.name}</div>
                        <div className="text-slate-400 text-sm mb-2">
                          Mana: {selectedChampion.skill?.startingMana} / {selectedChampion.skill?.skillMana}
                        </div>
                        <div className="flex space-x-2">
                          <div className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                            Mana Initial: {selectedChampion.skill?.startingMana}
                          </div>
                          <div className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                            Mana Max: {selectedChampion.skill?.skillMana}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedChampion.skill?.desc || '' }} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span>Items Recommandés</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getRecommendedItems(selectedChampion).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded border border-slate-600/50"
                      />
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-slate-400 text-sm" dangerouslySetInnerHTML={{ __html: item.shortDesc || item.desc.substring(0, 50) + '...' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 mt-8 pt-6 border-t border-slate-700/30">
                <button
                  onClick={() => toggleFavorite(selectedChampion.name)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    favorites.includes(selectedChampion.name)
                      ? 'bg-pink-600 text-white'
                      : 'bg-pink-600/20 text-pink-400 hover:bg-pink-600/30'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>{favorites.includes(selectedChampion.name) ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                  <Copy className="w-4 h-4" />
                  <span>Copier les infos</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>Guide détaillé</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}