import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List, Heart, Flame, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Champion, Item } from '../types';
import { commonSynergies } from '../data/synergies';
import ChampionCard from '../components/ChampionCard';
import SearchBar from '../components/SearchBar';
import FilterHub from '../components/FilterHub';
import { generatedItemsStats } from '../data/items_stats_generated';

export default function ChampionsDataPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'cost' | 'name' | 'winrate' | 'avgPlacement'>('winrate');
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSynergies, setSelectedSynergies] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyMeta, setShowOnlyMeta] = useState(false);
  const [patchInfo, setPatchInfo] = useState({ version: '', set: '', lastUpdate: '' });
  const [recommendedItemsMap, setRecommendedItemsMap] = useState<Record<string, Item[]>>({});

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
      'Nidalee': ['Anima Squad', 'Swift'],
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
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cost':
        return a.cost[0] - b.cost[0];
      case 'winrate':
        return (b.winRate || 0) - (a.winRate || 0);
      case 'avgPlacement':
        return (a.avgPlacement || 0) - (b.avgPlacement || 0);
      default:
        return 0;
    }
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
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {sortedChampions.map((champion) => (
                <ChampionCard
                  key={champion.key}
                  champion={champion}
                  viewMode={viewMode}
                  isFavorite={favorites.includes(champion.name)}
                  onToggleFavorite={toggleFavorite}
                  onAddAsTag={addChampionAsTag}
                  recommendedItems={recommendedItemsMap[champion.name] || []}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedChampions.map((champion) => (
                <ChampionCard
                  key={champion.key}
                  champion={champion}
                  viewMode={viewMode}
                  isFavorite={favorites.includes(champion.name)}
                  onToggleFavorite={toggleFavorite}
                  onAddAsTag={addChampionAsTag}
                  recommendedItems={recommendedItemsMap[champion.name] || []}
                />
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