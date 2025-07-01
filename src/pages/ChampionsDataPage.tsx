import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List, Heart, Flame, Filter, ChevronDown, ChevronUp, Download, RefreshCw, SlidersHorizontal, Eye, EyeOff, Star } from 'lucide-react';
import { Champion, Item } from '../types';
import { commonSynergies } from '../data/synergies';
import SearchBar from '../components/SearchBar';
import FilterHub from '../components/FilterHub';
import { generatedItemsStats } from '../data/items_stats_generated';

export default function ChampionsDataPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'cost' | 'name' | 'winrate' | 'avgPlacement'>('winrate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSynergies, setSelectedSynergies] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyMeta, setShowOnlyMeta] = useState(false);
  const [patchInfo, setPatchInfo] = useState({ version: '', set: '', lastUpdate: '' });
  const [recommendedItemsMap, setRecommendedItemsMap] = useState<Record<string, Item[]>>({});
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    cost: true,
    traits: true,
    winRate: true,
    avgPlacement: true,
    pickRate: true,
    tier: true,
    asCarry: true,
    asCore: true,
    items: true
  });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Charger les champions enrichis
        const championsRes = await fetch('/data/tft/champions/tft_champions_enriched_1751380398183.json');
        if (!championsRes.ok) throw new Error('Erreur lors du chargement des champions');
        const championsData = await championsRes.json();
        
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
        const championsArray = Object.values(championsData).map((champion: any) => ({
          key: champion.champName.replace(/\s+/g, ''),
          name: champion.champName,
          cost: [1], // Valeur par défaut, à remplacer par les vraies données si disponibles
          imageUrl: champion.localImageUrl || `/images/champions/${champion.champName.replace(/\s+/g, '')}.webp`,
          traits: getChampionTraits(champion.champName), // Assigne des traits basés sur le nom
          isMeta: champion.meta,
          winRate: champion.rawWinrate,
          avgPlacement: champion.avgPlacement,
          gamesPlayed: champion.gamesPlayed,
          pickRate: champion.pickRate,
          tier: champion.tier,
          asCarry: champion.asCarry,
          asCore: champion.asCore
        }));
        
        // Générer des items recommandés pour chaque champion
        const itemsMap: Record<string, Item[]> = {};
        championsArray.forEach(champion => {
          itemsMap[champion.name] = getRecommendedItemsForChampion(champion);
        });
        
        setRecommendedItemsMap(itemsMap);
        setChampions(championsArray);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Fonction pour attribuer des traits aux champions basés sur leur nom
  const getChampionTraits = (championName: string): string[] => {
    // Mapping de champions à leurs traits (basé sur les données réelles du jeu)
    const traitsMapping: Record<string, string[]> = {
      'Alistar': ['Armorclad', 'Vanguard'],
      'Annie': ['Divinicorp', 'Controller'],
      'Aphelios': ['Divinicorp', 'Marksman'],
      'Aurora': ['Anima Squad', 'Marksman'],
      'Brand': ['Divinicorp', 'Controller'],
      'Braum': ['Ballistek', 'Vanguard'],
      'Chogath': ['Mob', 'Bruiser'],
      'Darius': ['Street Demon', 'Bruiser'],
      'Dr. Mundo': ['Street Demon', 'Bruiser'],
      'Draven': ['Street Demon', 'Marksman'],
      'Ekko': ['Anima Squad', 'Swift'],
      'Elise': ['Mob', 'Controller'],
      'Fiddlesticks': ['Mob', 'Controller'],
      'Galio': ['Divinicorp', 'Vanguard'],
      'Gragas': ['Ballistek', 'Bruiser'],
      'Graves': ['Ballistek', 'Marksman'],
      'Illaoi': ['Divinicorp', 'Bruiser'],
      'Jarvan IV': ['Divinicorp', 'Vanguard'],
      'Jax': ['Anima Squad', 'Bruiser'],
      'Jhin': ['Anima Squad', 'Marksman'],
      'Jinx': ['Anima Squad', 'Marksman'],
      'Kindred': ['Mob', 'Marksman'],
      'Kobuko': ['Street Demon', 'Swift'],
      'Kog\'Maw': ['Ballistek', 'Marksman'],
      'LeBlanc': ['Anima Squad', 'Controller'],
      'Leona': ['Anima Squad', 'Vanguard'],
      'Miss Fortune': ['Ballistek', 'Marksman'],
      'Mordekaiser': ['Street Demon', 'Vanguard'],
      'Morgana': ['Divinicorp', 'Controller'],
      'Naafiri': ['Street Demon', 'Swift'],
      'Neeko': ['Anima Squad', 'Controller'],
      'NidaleeCougar': ['Anima Squad', 'Swift'],
      'Poppy': ['Ballistek', 'Vanguard'],
      'Renekton': ['Street Demon', 'Bruiser'],
      'Rengar': ['Mob', 'Swift'],
      'Rhaast': ['Mob', 'Bruiser'],
      'Samira': ['Street Demon', 'Marksman'],
      'Sejuani': ['Ballistek', 'Vanguard'],
      'Senna': ['Divinicorp', 'Marksman'],
      'Seraphine': ['Divinicorp', 'Controller'],
      'Shaco': ['Mob', 'Swift'],
      'Shyvana': ['Street Demon', 'Bruiser'],
      'Skarner': ['Ballistek', 'Bruiser'],
      'Sylas': ['Anima Squad', 'Bruiser'],
      'Twisted Fate': ['Ballistek', 'Controller'],
      'Urgot': ['Ballistek', 'Bruiser'],
      'Varus': ['Divinicorp', 'Marksman'],
      'Vayne': ['Anima Squad', 'Marksman'],
      'Veigar': ['Mob', 'Controller'],
      'Vex': ['Mob', 'Controller'],
      'Vi': ['Anima Squad', 'Bruiser'],
      'Viego': ['Mob', 'Swift'],
      'Xayah': ['Anima Squad', 'Marksman'],
      'Yuumi': ['Divinicorp', 'Controller'],
      'Zac': ['Street Demon', 'Vanguard'],
      'Zed': ['Anima Squad', 'Swift'],
      'Zeri': ['Ballistek', 'Marksman'],
      'Ziggs': ['Ballistek', 'Controller'],
      'Zyra': ['Divinicorp', 'Controller']
    };
    
    return traitsMapping[championName] || [];
  };

  // Fonction pour générer des items recommandés pour chaque champion
  const getRecommendedItemsForChampion = (champion: Champion): Item[] => {
    // Mapping de classes à des items recommandés
    const itemsByClass: Record<string, string[]> = {
      'Marksman': ['InfinityEdge', 'LastWhisper', 'GuinsoosRageblade', 'RunaansHurricane', 'RapidFireCannon'],
      'Controller': ['BlueBuff', 'RabadonsDeathcap', 'JeweledGauntlet', 'Morellonomicon', 'ArchangelsStaff'],
      'Bruiser': ['WarmogsArmor', 'TitansResolve', 'SteraksGage', 'RedBuff', 'Bloodthirster'],
      'Vanguard': ['BrambleVest', 'DragonsClaw', 'GargoyleStoneplate', 'WarmogsArmor', 'Redemption'],
      'Swift': ['GuinsoosRageblade', 'RapidFireCannon', 'Quicksilver', 'RunaansHurricane', 'LastWhisper']
    };
    
    // Sélectionne des items basés sur les traits du champion
    let recommendedItemKeys: string[] = [];
    
    if (champion.traits) {
      // Priorise la classe principale pour les items
      const classTraits = champion.traits.filter(trait => 
        ['Marksman', 'Controller', 'Bruiser', 'Vanguard', 'Swift'].includes(trait)
      );
      
      if (classTraits.length > 0) {
        const mainClass = classTraits[0];
        recommendedItemKeys = itemsByClass[mainClass] || [];
      }
      
      // Si c'est un carry, priorise les items offensifs
      if (champion.asCarry > 0) {
        if (champion.traits.includes('Marksman')) {
          recommendedItemKeys = ['InfinityEdge', 'LastWhisper', 'GuinsoosRageblade'];
        } else if (champion.traits.includes('Controller')) {
          recommendedItemKeys = ['BlueBuff', 'RabadonsDeathcap', 'JeweledGauntlet'];
        } else {
          recommendedItemKeys = ['Bloodthirster', 'InfinityEdge', 'GuinsoosRageblade'];
        }
      }
    }
    
    // Trouve les objets correspondants dans generatedItemsStats
    const items = recommendedItemKeys
      .map(key => generatedItemsStats.find(item => item.key.includes(key)))
      .filter(Boolean) as Item[];
    
    // Si aucun item n'est trouvé, retourne des items par défaut
    if (items.length === 0) {
      return generatedItemsStats.slice(0, 3);
    }
    
    return items.slice(0, 3);
  };

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
        (champion.tier === tag) ||
        (champion.traits && champion.traits.some(trait => trait.toLowerCase().includes(tag.toLowerCase())))
      );
    const matchesInput =
      inputValue === '' ||
      champion.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      (champion.traits && champion.traits.some(trait => trait.toLowerCase().includes(inputValue.toLowerCase())));
    const matchesCost =
      activeTab === 'all' || champion.cost[0] === activeTab;
    const matchesFavorites =
      !showOnlyFavorites || favorites.includes(champion.name);
    const matchesMeta = !showOnlyMeta || champion.isMeta;
    const matchesSynergies =
      selectedSynergies.length === 0 ||
      (champion.traits &&
        selectedSynergies.some((s) => champion.traits?.includes(s)));

    return (
      (matchesTags || matchesInput) &&
      matchesCost &&
      matchesFavorites &&
      matchesMeta &&
      matchesSynergies
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
      case 'winrate':
        comparison = (b.winRate || 0) - (a.winRate || 0);
        break;
      case 'avgPlacement':
        comparison = (a.avgPlacement || 0) - (b.avgPlacement || 0);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Compter les champions par coût
  const championCounts = champions.reduce((acc, champion) => {
    acc[champion.cost[0]] = (acc[champion.cost[0]] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Toggle favorite
  const toggleFavorite = (championName: string) => {
    setFavorites((prev) =>
      prev.includes(championName)
        ? prev.filter((name) => name !== championName)
        : [...prev, championName]
    );
  };

  // Gestion des filtres
  const toggleSynergy = (synergy: string) => {
    setSelectedSynergies((prev) =>
      prev.includes(synergy)
        ? prev.filter((s) => s !== synergy)
        : [...prev, synergy]
    );
  };

  const clearAllFilters = () => {
    setActiveTab('all');
    setSelectedSynergies([]);
    setShowOnlyFavorites(false);
    setShowOnlyMeta(false);
    setSelectedTags([]);
    setInputValue('');
  };

  // Statistiques pour le hub
  const favoritesCount = favorites.length;
  const metaCount = champions.filter((c) => c.isMeta).length;

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

  // Fonction pour obtenir la couleur du coût
  const getCostColor = (cost: number) => {
    const colors = {
      1: 'bg-gray-500 text-white',
      2: 'bg-green-500 text-white',
      3: 'bg-blue-500 text-white',
      4: 'bg-purple-500 text-white',
      5: 'bg-yellow-500 text-white',
    };
    return colors[cost as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  // Gestion du tri des colonnes
  const handleColumnSort = (column: 'name' | 'cost' | 'winrate' | 'avgPlacement') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
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
      'Core',
      'Meta'
    ].join(',');
    
    // Convertir les données en lignes CSV
    const rows = sortedChampions.map(champion => [
      champion.name,
      champion.cost[0],
      champion.traits?.join(' | ') || '',
      (champion.winRate || 0).toFixed(1) + '%',
      (champion.avgPlacement || 0).toFixed(2),
      (champion.pickRate || 0).toFixed(1) + '%',
      champion.tier || '',
      champion.asCarry || 0,
      champion.asCore || 0,
      champion.isMeta ? 'Oui' : 'Non'
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
              onClick={() => setActiveTab('all')}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="font-medium">Tous</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {champions.length}
              </span>
            </button>

            {/* Onglets par tier */}
            {['S', 'A', 'B', 'C'].map((tier) => {
              const count = champions.filter(c => c.tier === tier).length;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTags([tier])}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    selectedTags.includes(tier)
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
                  { value: 'winrate', label: 'Winrate' },
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

            {/* Synergies */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ChevronDown className="w-4 h-4 text-purple-400" />
                <h3 className="text-white font-medium">Synergies populaires</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {commonSynergies.slice(0, 6).map((synergy) => (
                  <button
                    key={synergy.name}
                    onClick={() => toggleSynergy(synergy.name)}
                    className={`p-2 rounded-lg text-xs transition-all flex items-center space-x-1 ${
                      selectedSynergies.includes(synergy.name)
                        ? `bg-gradient-to-r ${synergy.color} text-white shadow-lg`
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {synergy.imageUrl ? (
                      <img 
                        src={synergy.imageUrl} 
                        alt={synergy.name}
                        className="w-4 h-4 object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs">{synergy.icon}</span>
                    )}
                    <span>{synergy.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options rapides */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-green-400" />
                <h3 className="text-white font-medium">Options</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyFavorites}
                    onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    showOnlyFavorites ? 'bg-pink-500 border-pink-500' : 'border-slate-500'
                  }`}>
                    {showOnlyFavorites && <Heart className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-slate-300 text-sm">Favoris uniquement</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyMeta}
                    onChange={(e) => setShowOnlyMeta(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    showOnlyMeta ? 'bg-orange-500 border-orange-500' : 'border-slate-500'
                  }`}>
                    {showOnlyMeta && <Flame className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-slate-300 text-sm">Meta uniquement</span>
                </label>
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
                <option value="winrate">Winrate</option>
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
                      <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => handleColumnSort('winrate')}>
                        <div className="flex items-center space-x-1">
                          <span>Winrate</span>
                          {getSortIcon('winrate')}
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
                    {visibleColumns.items && (
                      <th scope="col" className="px-4 py-3">
                        <span>Items recommandés</span>
                      </th>
                    )}
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
                        hoveredRow === champion.name ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
                      } transition-colors`}
                      onMouseEnter={() => setHoveredRow(champion.name)}
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
                                <div className="text-xs text-orange-400 flex items-center">
                                  <Flame className="w-3 h-3 mr-1" />
                                  <span>META</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.cost && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCostColor(champion.cost[0])}`}>
                            {champion.cost[0]}
                          </span>
                        </td>
                      )}
                      {visibleColumns.traits && (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {champion.traits?.map((trait, index) => {
                              const synergyData = commonSynergies.find(s => s.name === trait);
                              return (
                                <div
                                  key={index}
                                  className="px-2 py-0.5 rounded-md bg-slate-700/50 border border-slate-600/30 text-xs font-medium text-white flex items-center space-x-1"
                                >
                                  {synergyData?.imageUrl ? (
                                    <img 
                                      src={synergyData.imageUrl} 
                                      alt={trait}
                                      className="w-3 h-3 object-cover rounded"
                                    />
                                  ) : (
                                    <span className="text-[10px]">⚡</span>
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
                                  (champion.winRate || 0) >= 60
                                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                                    : (champion.winRate || 0) >= 50
                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                    : 'bg-gradient-to-r from-red-500 to-red-400'
                                }`}
                                style={{ width: `${Math.min((champion.winRate || 0), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.avgPlacement && (
                        <td className="px-4 py-3">
                          <span className={`font-medium ${getPlacementColor(champion.avgPlacement || 0)}`}>
                            {(champion.avgPlacement || 0).toFixed(2)}
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
                            {champion.tier}
                          </span>
                        </td>
                      )}
                      {visibleColumns.asCarry && (
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {champion.asCarry > 0 ? (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400 font-medium">{champion.asCarry}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.asCore && (
                        <td className="px-4 py-3">
                          <span className="text-blue-400 font-medium">{champion.asCore || '-'}</span>
                        </td>
                      )}
                      {visibleColumns.items && (
                        <td className="px-4 py-3">
                          <div className="flex space-x-1">
                            {recommendedItemsMap[champion.name]?.map((item, index) => (
                              <div key={index} className="relative group/item">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-8 h-8 rounded border border-slate-600/50 transition-all duration-200 hover:scale-110 hover:border-yellow-400/60"
                                  title={item.name}
                                />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-900/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                                  {item.name}
                                </div>
                              </div>
                            ))}
                            {(!recommendedItemsMap[champion.name] || recommendedItemsMap[champion.name].length === 0) && (
                              <span className="text-slate-500 text-xs">Aucun item</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleFavorite(champion.name)}
                            className={`p-1.5 rounded transition-colors ${
                              favorites.includes(champion.name)
                                ? 'text-pink-500 bg-pink-500/10'
                                : 'text-slate-400 hover:text-pink-400 hover:bg-pink-500/10'
                            }`}
                          >
                            <Heart className="w-4 h-4" />
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
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {sortedChampions.map((champion) => (
                <div
                  key={champion.key}
                  className="group relative overflow-hidden rounded-xl border border-slate-600/20 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-500/50"
                >
                  {/* Badge Meta */}
                  {champion.isMeta && (
                    <div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center space-x-1">
                      <Flame className="w-3 h-3" />
                      <span>META</span>
                    </div>
                  )}

                  {/* Badge avgPlacement */}
                  <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm">
                    {champion.avgPlacement?.toFixed(1)}
                  </div>

                  {/* Image floutée en fond au hover */}
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-15 blur-sm scale-110 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
                    style={{ backgroundImage: `url(${champion.imageUrl})` }}
                  ></div>

                  {/* Contenu */}
                  <div className="relative z-10 flex flex-col items-center space-y-3">
                    <div className="relative">
                      <img
                        src={champion.imageUrl}
                        alt={champion.name}
                        className="w-16 h-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Badge de coût */}
                      <div
                        className={`absolute -bottom-2 -right-2 rounded-full w-6 h-6 flex items-center justify-center shadow-lg bg-gradient-to-r ${getCostColor(
                          champion.cost[0]
                        )}`}
                      >
                        <span className="text-white text-xs font-bold">
                          {champion.cost[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors duration-200">
                        {champion.name}
                      </h4>

                      {/* Synergies avec images */}
                      <div className="flex flex-wrap justify-center gap-1">
                        {champion.traits?.slice(0, 3).map((trait, index) => {
                          const synergyData = commonSynergies.find((s) => s.name === trait);
                          return (
                            <div
                              key={index}
                              className={`px-1 py-0.5 rounded-md bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 text-xs font-medium text-white shadow-sm flex items-center space-x-1`}
                            >
                              {synergyData?.imageUrl ? (
                                <img 
                                  src={synergyData.imageUrl} 
                                  alt={trait}
                                  className="w-4 h-4 object-cover rounded"
                                />
                              ) : (
                                <span className="text-xs">{synergyData?.icon || '⚡'}</span>
                              )}
                              <span className="text-[10px]">{trait}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Stats compactes avec badge */}
                      <div className="flex items-center justify-center space-x-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/60 text-slate-100 border border-slate-600">
                            {(champion.winRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Items recommandés */}
                      {recommendedItemsMap[champion.name]?.length > 0 && (
                        <div className="flex justify-center space-x-1 mt-2">
                          {recommendedItemsMap[champion.name].map((item, index) => (
                            <div key={index} className="relative group/item">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded border border-slate-600/50 transition-all duration-200 hover:scale-110 hover:border-yellow-400/60"
                                title={item.name}
                              />
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-900/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                                {item.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {sortedChampions.map((champion) => (
                <div
                  key={champion.key}
                  className="group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border border-slate-600/20 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-blue-500/50 hover:bg-slate-600/30"
                >
                  {/* Fond flouté pour la ligne */}
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-sm scale-100 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
                    style={{ backgroundImage: `url(${champion.imageUrl})` }}
                  ></div>

                  {/* Overlay pour améliorer la lisibilité */}
                  <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

                  {/* Image du champion */}
                  <div className="relative z-10 flex-shrink-0">
                    <img
                      src={champion.imageUrl}
                      alt={champion.name}
                      className="w-16 h-16 rounded-lg object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-blue-400/60"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 rounded-full w-6 h-6 flex items-center justify-center shadow-lg bg-gradient-to-r ${getCostColor(
                        champion.cost[0]
                      )}`}
                    >
                      <span className="text-white text-xs font-bold">{champion.cost[0]}</span>
                    </div>
                  </div>

                  <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Nom et badges */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors drop-shadow-sm">
                          {champion.name}
                        </h4>

                        {/* Spacer */}
                        <span className="w-2"></span>

                        {champion.isMeta && (
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center space-x-1">
                            <Flame className="w-2.5 h-2.5" />
                            <span>META</span>
                          </div>
                        )}

                        {/* Spacer supplémentaire */}
                        <span className="w-2"></span>

                        {/* Badge avgPlacement */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-600 text-[11px] font-semibold text-white shadow">
                          {champion.avgPlacement?.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Synergies avec images */}
                    <div className="space-y-0">
                      <div className="text-xs text-slate-400 font-medium mb-1">Traits</div>
                      <div className="flex flex-wrap gap-1">
                        {champion.traits?.map((trait, index) => {
                          const synergyData = commonSynergies.find((s) => s.name === trait);
                          return (
                            <div
                              key={index}
                              className="px-2 py-0.5 rounded-md bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 text-xs font-medium text-white shadow-sm flex items-center space-x-1"
                            >
                              {synergyData?.imageUrl ? (
                                <img 
                                  src={synergyData.imageUrl} 
                                  alt={trait}
                                  className="w-4 h-4 object-cover rounded"
                                />
                              ) : (
                                <span className="text-xs">{synergyData?.icon || '⚡'}</span>
                              )}
                              <span>{trait}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items recommandés */}
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Items recommandés</div>
                      <div className="flex justify-center space-x-1">
                        {recommendedItemsMap[champion.name]?.map((item, index) => (
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
                        {(!recommendedItemsMap[champion.name] || recommendedItemsMap[champion.name].length === 0) && (
                          <span className="text-xs text-slate-500">Aucun item recommandé</span>
                        )}
                      </div>
                    </div>

                    {/* Winrate amélioré */}
                    <div className="text-center space-y-3">
                      {/* Badge du pourcentage */}
                      <div className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white bg-slate-700/80 border border-slate-600 shadow-sm">
                        {(champion.winRate || 0).toFixed(1)}%
                      </div>

                      {/* Barre de progression */}
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (champion.winRate || 0) >= 60
                              ? 'bg-gradient-to-r from-green-500 to-green-400'
                              : (champion.winRate || 0) >= 50
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${Math.min((champion.winRate || 0), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tier et Rôle */}
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        {/* Tier badge */}
                        <div className={`px-3 py-1 rounded-md text-sm font-bold ${getTierColor(champion.tier || 'C')}`}>
                          Tier {champion.tier}
                        </div>
                        
                        {/* Rôle (Carry/Core) */}
                        {(champion.asCarry > 0 || champion.asCore > 0) && (
                          <div className="flex items-center gap-2">
                            {champion.asCarry > 0 && (
                              <div className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-medium flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>Carry</span>
                              </div>
                            )}
                            {champion.asCore > 0 && (
                              <div className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium">
                                Core
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hub de filtres flottant */}
      <FilterHub
        selectedSynergies={selectedSynergies}
        onToggleSynergy={toggleSynergy}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavorites={setShowOnlyFavorites}
        showOnlyMeta={showOnlyMeta}
        onToggleMeta={setShowOnlyMeta}
        onClearAllFilters={clearAllFilters}
        championsCount={champions.length}
        favoritesCount={favoritesCount}
        metaCount={metaCount}
      />
    </>
  );
}