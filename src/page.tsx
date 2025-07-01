"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Mic,
  Crown,
  Shield,
  Users,
  TrendingUp,
  UserPlus,
  LifeBuoy,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  Sword,
  Filter,
  Grid3X3,
  List,
  Eye,
  Settings,
  Sparkles,
  Target,
  DollarSign,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Heart,
  Flame,
  ShieldCheck
} from "lucide-react";

type Champion = {
  name: string;
  cost: number;
  image: string;
  traits?: string[];
  rating?: number;
  winRate?: number;
  pickRate?: number;
  avgPlacement?: number;
};

const goldIcon = "https://cdn.dak.gg/tft/images2/icon/ico-gold-v2.png";

// Synergies communes TFT (simulées)
const commonSynergies = [
  { name: "Invoker", icon: "🔮", color: "from-purple-500 to-indigo-600" },
  { name: "Dominator", icon: "👑", color: "from-red-500 to-pink-600" },
  { name: "Ambusher", icon: "⚡", color: "from-yellow-500 to-orange-600" },
  { name: "Vanguard", icon: "🛡️", color: "from-blue-500 to-cyan-600" },
  { name: "Sniper", icon: "🎯", color: "from-green-500 to-emerald-600" },
  { name: "Rebel", icon: "🔥", color: "from-orange-500 to-red-600" },
  { name: "Sentinel", icon: "⚔️", color: "from-gray-500 to-slate-600" },
  { name: "Chemtech", icon: "🧪", color: "from-lime-500 to-green-600" }
];

export default function TFTInterface() {
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('compact');
  const [sortBy, setSortBy] = useState<'cost' | 'name' | 'rarity'>('cost');
  
  // Filtres avancés
  const [showFilters, setShowFilters] = useState(false);
  const [costRange, setCostRange] = useState<[number, number]>([1, 5]);
  const [selectedSynergies, setSelectedSynergies] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyMeta, setShowOnlyMeta] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    async function fetchChampions() {
      try {
        const res = await fetch("/champions-cleaned.json");
        if (!res.ok) throw new Error("Erreur lors du chargement des champions");
        const data = (await res.json()) as Champion[];
        
        // Ajouter des statistiques simulées
        const championsWithStats = data.map(champion => ({
          ...champion,
          rating: Math.floor(Math.random() * 3) + 3, // Note entre 3 et 5
          winRate: Math.floor(Math.random() * 30) + 45, // Winrate entre 45% et 75%
          pickRate: Math.floor(Math.random() * 25) + 5, // Pick rate entre 5% et 30%
          avgPlacement: Math.round((Math.random() * 2 + 3) * 10) / 10 // Placement moyen entre 3.0 et 5.0
        }));
        
        setChampions(championsWithStats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchChampions();
  }, []);

  // Gérer l'ajout de tags
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
      setInputValue("");
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

  // Filtrer champions
  const filteredChampions = champions.filter((champion) => {
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => champion.name.toLowerCase().includes(tag.toLowerCase()));
    const matchesInput = inputValue === "" || 
      champion.name.toLowerCase().includes(inputValue.toLowerCase());
    const matchesCost = champion.cost >= costRange[0] && champion.cost <= costRange[1];
    const matchesFavorites = !showOnlyFavorites || favorites.includes(champion.name);
    const matchesSynergies = selectedSynergies.length === 0 || 
      (champion.traits && selectedSynergies.some(s => champion.traits?.includes(s)));
    
    return (matchesTags || matchesInput) && matchesCost && matchesFavorites && matchesSynergies;
  });

  // Grouper par coût
  const groupedChampions = filteredChampions.reduce((acc, champion) => {
    const cost = champion.cost;
    if (!acc[cost]) acc[cost] = [];
    acc[cost].push(champion);
    return acc;
  }, {} as Record<number, Champion[]>);

  // Trier champions dans chaque groupe
  const sortedGroupedChampions = Object.entries(groupedChampions).reduce((acc, [cost, champions]) => {
    const sorted = [...champions].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return a.cost - b.cost;
        case 'rarity':
          return b.cost - a.cost;
        default:
          return 0;
      }
    });
    acc[parseInt(cost)] = sorted;
    return acc;
  }, {} as Record<number, Champion[]>);

  // Toggle favorite
  const toggleFavorite = (championName: string) => {
    setFavorites(prev => 
      prev.includes(championName)
        ? prev.filter(name => name !== championName)
        : [...prev, championName]
    );
  };

  // Toggle synergy filter
  const toggleSynergy = (synergy: string) => {
    setSelectedSynergies(prev => 
      prev.includes(synergy)
        ? prev.filter(s => s !== synergy)
        : [...prev, synergy]
    );
  };

  const clearAllFilters = () => {
    setCostRange([1, 5]);
    setSelectedSynergies([]);
    setShowOnlyFavorites(false);
    setShowOnlyMeta(false);
    setSelectedTags([]);
    setInputValue("");
  };

  const getCostLabel = (cost: number) => {
    const labels = {
      1: "1 Pièce",
      2: "2 Pièces", 
      3: "3 Pièces",
      4: "4 Pièces",
      5: "5 Pièces"
    };
    return labels[cost as keyof typeof labels] || `${cost} Pièces`;
  };

  const getCostColor = (cost: number) => {
    const colors = {
      1: "from-gray-500 to-gray-600",
      2: "from-green-500 to-green-600",
      3: "from-blue-500 to-blue-600", 
      4: "from-purple-500 to-purple-600",
      5: "from-yellow-500 to-yellow-600"
    };
    return colors[cost as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TFT Assistant</h1>
              <p className="text-sm text-slate-400">Patch 14.1 • Set 10</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/70 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#" className="hover:text-white transition-colors">Accueil</a>
            <a href="#" className="hover:text-white transition-colors">Compositions</a>
            <a href="#" className="hover:text-white transition-colors">Champions</a>
            <a href="#" className="hover:text-white transition-colors">Objets</a>
            <a href="#" className="hover:text-white transition-colors">Synergies</a>
            <a href="#" className="hover:text-white transition-colors">À propos</a>
          </div>
          <div className="flex items-center space-x-4 text-slate-300">
            <button className="p-2 rounded hover:bg-blue-600/20 transition">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </button>
            <button className="p-2 rounded hover:bg-slate-700 transition">
              <LifeBuoy className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header de section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Champions</h2>
              <p className="text-slate-400">Découvrez et filtrez tous les champions du set actuel</p>
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
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtres</span>
            </button>
            <div className="flex items-center space-x-1 bg-slate-800/60 rounded-lg border border-slate-600/50 p-1">
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

        {/* Barre de recherche avec tags */}
        <div className="mb-8">
          <div className="relative bg-slate-800/40 backdrop-blur border border-slate-600/30 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-inner">
            <div className="flex items-center space-x-2">
              <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {selectedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm border border-blue-500/30"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="ml-2 hover:text-blue-100 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={selectedTags.length === 0 ? "Rechercher des champions..." : "Ajouter un champion..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none min-w-[200px]"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Panneau de filtres avancés */}
        {showFilters && (
          <div className="mb-8 bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Filtre par coût */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-white font-medium">Coût</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{costRange[0]} pièce{costRange[0] > 1 ? 's' : ''}</span>
                    <span className="text-slate-400">{costRange[1]} pièce{costRange[1] > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={costRange[0]}
                      onChange={(e) => setCostRange([parseInt(e.target.value), costRange[1]])}
                      className="flex-1 slider-thumb"
                    />
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={costRange[1]}
                      onChange={(e) => setCostRange([costRange[0], parseInt(e.target.value)])}
                      className="flex-1 slider-thumb"
                    />
                  </div>
                </div>
              </div>

              {/* Synergies */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white font-medium">Synergies</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {commonSynergies.slice(0, 6).map((synergy) => (
                    <button
                      key={synergy.name}
                      onClick={() => toggleSynergy(synergy.name)}
                      className={`p-2 rounded-lg text-xs transition-all ${
                        selectedSynergies.includes(synergy.name)
                          ? `bg-gradient-to-r ${synergy.color} text-white shadow-lg`
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      <span className="mr-1">{synergy.icon}</span>
                      {synergy.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options rapides */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-400" />
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
                {Object.values(sortedGroupedChampions).flat().length} champions trouvés
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
                  <span className="text-sm text-slate-300">Trier par :</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="cost">Coût</option>
                  <option value="name">Nom</option>
                  <option value="rarity">Rareté</option>
                </select>
              </div>
              <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full">
                {Object.values(sortedGroupedChampions).flat().length} résultats
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
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                  ></div>
                </div>
                <p className="text-slate-400 text-lg font-medium">
                  Chargement des champions...
                </p>
              </div>
            ) : Object.keys(sortedGroupedChampions).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-lg mb-2">Aucun champion trouvé</p>
                  <p className="text-slate-500 text-sm">Essayez d'ajuster vos filtres</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-3 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                  >
                    Effacer tous les filtres
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(sortedGroupedChampions)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([cost, champions]) => (
                  <div key={cost} className="space-y-4">
                    {/* En-tête de catégorie */}
                    <div className="flex items-center space-x-4">
                      <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getCostColor(parseInt(cost))} text-white font-semibold flex items-center space-x-2 shadow-lg`}>
                        <img src={goldIcon} alt="Gold" className="w-4 h-4" />
                        <span>{getCostLabel(parseInt(cost))}</span>
                        <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                          {champions.length}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-600/50 to-transparent"></div>
                    </div>

                    {/* Champions de cette catégorie */}
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                        {champions.map((champion) => (
                          <div
                            key={champion.name}
                            onClick={() => addChampionAsTag(champion.name)}
                            className="group relative overflow-hidden rounded-xl border border-slate-600/20 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-500/50"
                          >
                            {/* Image floutée en fond au hover */}
                            <div
                              className="absolute inset-0 z-0 bg-cover bg-center opacity-0 blur-md scale-110 transition-all duration-500 group-hover:opacity-30"
                              style={{ backgroundImage: `url(${champion.image})` }}
                            ></div>

                            {/* Contenu */}
                            <div className="relative z-10 flex flex-col items-center space-y-3">
                              <div className="relative">
                                <img
                                  src={champion.image}
                                  alt={champion.name}
                                  className="w-16 h-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
                                />
                                {/* Badge de coût */}
                                <div className="absolute -top-2 -right-2 bg-yellow-600 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                  <span className="text-white text-xs font-bold">
                                    {champion.cost}
                                  </span>
                                </div>
                              </div>

                              <div className="text-center">
                                <h4 className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors duration-200">
                                  {champion.name}
                                </h4>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {champions.map((champion) => (
                          <div
                            key={champion.name}
                            onClick={() => addChampionAsTag(champion.name)}
                            className="group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border border-slate-600/20 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-blue-500/50 hover:bg-slate-600/30"
                          >
                            {/* Fond flouté pour la ligne - TOUJOURS VISIBLE */}
                            <div
                              className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-sm scale-110 transition-all duration-500 group-hover:opacity-40 group-hover:blur-md"
                              style={{ backgroundImage: `url(${champion.image})` }}
                            ></div>
                            
                            {/* Overlay pour améliorer la lisibilité */}
                            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/40 group-hover:from-slate-900/70 group-hover:via-slate-800/40 group-hover:to-slate-900/20 transition-all duration-500"></div>

                            <div className="relative z-10 flex-shrink-0">
                              <img
                                src={champion.image}
                                alt={champion.name}
                                className="w-12 h-12 rounded-lg object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-blue-400/60"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-yellow-600 rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                <span className="text-white text-xs font-bold">
                                  {champion.cost}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              {/* Nom du champion */}
                              <div>
                                <h4 className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors drop-shadow-sm">
                                  {champion.name}
                                </h4>
                                <div className="flex items-center space-x-1 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < (champion.rating || 0)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-slate-500'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs text-slate-400 ml-1">
                                    {champion.rating}/5
                                  </span>
                                </div>
                              </div>

                              {/* Winrate */}
                              <div className="text-center">
                                <div className="text-sm font-medium text-white drop-shadow-sm">
                                  {champion.winRate}%
                                </div>
                                <div className="text-xs text-slate-400">Winrate</div>
                                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      (champion.winRate || 0) >= 60
                                        ? 'bg-green-500'
                                        : (champion.winRate || 0) >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${champion.winRate}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Pick Rate */}
                              <div className="text-center">
                                <div className="text-sm font-medium text-white drop-shadow-sm">
                                  {champion.pickRate}%
                                </div>
                                <div className="text-xs text-slate-400">Pick Rate</div>
                                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                                  <div
                                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                                    style={{ width: `${Math.min((champion.pickRate || 0) * 3, 100)}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Placement moyen */}
                              <div className="text-center">
                                <div className="text-sm font-medium text-white drop-shadow-sm">
                                  {champion.avgPlacement}
                                </div>
                                <div className="text-xs text-slate-400">Avg Place</div>
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                  (champion.avgPlacement || 0) <= 3.5
                                    ? 'bg-green-500/20 text-green-400'
                                    : (champion.avgPlacement || 0) <= 4.2
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {(champion.avgPlacement || 0) <= 3.5 ? '↗' : 
                                   (champion.avgPlacement || 0) <= 4.2 ? '→' : '↘'}
                                </div>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}