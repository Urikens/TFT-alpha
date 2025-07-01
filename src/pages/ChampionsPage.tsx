import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List } from 'lucide-react';
import { Champion, Item, FilterState } from '../types';
import { commonSynergies } from '../data/synergies';
import SearchBar from '../components/SearchBar';
import AnalyzeButton from '../components/AnalyzeButton';
import AnalysisModal from '../components/AnalysisModal';
import FilterHub from '../components/FilterHub';
import ChampionTabs from '../components/ChampionTabs';
import ChampionCard from '../components/ChampionCard';
import ResultsPage from './ResultsPage';

export default function ChampionsPage() {
  const [inputValue, setInputValue] = useState('');
  const [champions, setChampions] = useState<Champion[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  // États d'analyse
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([
    {
      name: 'Chargement des données',
      duration: 800,
      completed: false,
      current: false,
    },
    {
      name: 'Analyse des synergies',
      duration: 1200,
      completed: false,
      current: false,
    },
    {
      name: 'Calcul des statistiques',
      duration: 900,
      completed: false,
      current: false,
    },
    {
      name: 'Génération des recommandations',
      duration: 1100,
      completed: false,
      current: false,
    },
    { 
      name: 'Finalisation', 
      duration: 400, 
      completed: false, 
      current: false 
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // États de filtres
  const [filters, setFilters] = useState<FilterState>({
    selectedTags: [],
    selectedSynergies: [],
    showOnlyFavorites: false,
    showOnlyMeta: false,
    activeTab: 'all',
    sortBy: 'name',
    viewMode: 'grid',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Charger les champions
        const championsRes = await fetch('/src/data/champions_14.json');
        if (!championsRes.ok) throw new Error('Erreur lors du chargement des champions');
        const championsData: Champion[] = await championsRes.json();
  
        // Charger la méta (tableau)
        const metaRes = await fetch('/src/data/champion_meta.json');
        if (!metaRes.ok) throw new Error('Erreur lors du chargement des données méta');
        const metaArray: {
          champName: string;
          gamesPlayed: number;
          rawWinrate: number;
          weightedWinrate: number;
          avgPlacement: number;
          meta: boolean;
        }[] = await metaRes.json();
  
        // Transformer la liste en objet indexé par nom de champion pour accès rapide
        const metaData = metaArray.reduce((acc, meta) => {
          acc[meta.champName] = meta;
          return acc;
        }, {} as Record<string, typeof metaArray[0]>);
  
        // Charger les items
        const itemsRes = await fetch('/src/data/items_14.json');
        if (!itemsRes.ok) throw new Error('Erreur lors du chargement des items');
        const itemsData: Item[] = await itemsRes.json();
  
        // Fusionner les données champions + méta
        const championsWithStats = championsData.map((champion) => {
          const metaStats = metaData[champion.name] || {};
  
          return {
            ...champion,
            isMeta: metaStats.meta ?? false,
            winRate: metaStats.rawWinrate ?? null,
            avgPlacement: metaStats.avgPlacement ?? null,
            gamesPlayed: metaStats.gamesPlayed ?? 0,
            // tu peux ajouter d'autres champs si nécessaire
          };
        });
  
        setChampions(championsWithStats);
        setItems(itemsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  // Gestion de la recherche
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (
      e.key === 'Backspace' &&
      inputValue === '' &&
      filters.selectedTags.length > 0
    ) {
      removeTag(filters.selectedTags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !filters.selectedTags.includes(trimmedValue)) {
      setFilters((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, trimmedValue],
      }));
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((_, i) => i !== index),
    }));
  };

  const addChampionAsTag = (championName: string) => {
    if (!filters.selectedTags.includes(championName)) {
      setFilters((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, championName],
      }));
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setFilters((prev) => ({
      ...prev,
      selectedTags: [],
    }));
  };

  // Gestion de l'analyse
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setShowAnalysisModal(true);
    setCurrentStep(0);
    setProgress(0);

    // Reset des étapes
    setAnalysisSteps((prev) =>
      prev.map((step) => ({
        ...step,
        completed: false,
        current: false,
      }))
    );

    // Simuler l'analyse
    let totalDuration = 0;
    const totalTime = analysisSteps.reduce(
      (sum, step) => sum + step.duration,
      0
    );

    analysisSteps.forEach((step, index) => {
      setTimeout(() => {
        setAnalysisSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            current: i === index,
            completed: i < index,
          }))
        );
        setCurrentStep(index);

        // Mettre à jour la progression
        const progressValue =
          ((totalDuration + step.duration) / totalTime) * 100;
        setProgress(progressValue);

        // Si c'est la dernière étape
        if (index === analysisSteps.length - 1) {
          setTimeout(() => {
            setAnalysisSteps((prev) =>
              prev.map((s) => ({
                ...s,
                completed: true,
                current: false,
              }))
            );
            setCurrentStep(analysisSteps.length);
            setProgress(100);
            setIsAnalyzing(false);
          }, step.duration);
        }
      }, totalDuration);

      totalDuration += step.duration;
    });
  };

  const completeAnalysis = () => {
    setShowAnalysisModal(false);
    setShowResults(true);
  };

  const handleBackFromResults = () => {
    setShowResults(false);
  };

  // Filtrage des champions
  const filteredChampions = champions.filter((champion) => {
    const matchesTags =
      filters.selectedTags.length === 0 ||
      filters.selectedTags.some((tag) =>
        champion.name.toLowerCase().includes(tag.toLowerCase())
      );
    const matchesInput =
      inputValue === '' ||
      champion.name.toLowerCase().includes(inputValue.toLowerCase());
    const matchesCost =
      filters.activeTab === 'all' || champion.cost[0] === filters.activeTab;
    const matchesFavorites =
      !filters.showOnlyFavorites || favorites.includes(champion.name);
    const matchesMeta = !filters.showOnlyMeta || champion.isMeta;
    const matchesSynergies =
      filters.selectedSynergies.length === 0 ||
      (champion.traits &&
        filters.selectedSynergies.some((s) => champion.traits?.includes(s)));

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
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cost':
        return a.cost[0] - b.cost[0];
      case 'winrate':
        return (b.winRate || 0) - (a.winRate || 0);
      default:
        return 0;
    }
  });

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
    setFilters((prev) => ({
      ...prev,
      selectedSynergies: prev.selectedSynergies.includes(synergy)
        ? prev.selectedSynergies.filter((s) => s !== synergy)
        : [...prev.selectedSynergies, synergy],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      selectedTags: [],
      selectedSynergies: [],
      showOnlyFavorites: false,
      showOnlyMeta: false,
      activeTab: 'all',
      sortBy: 'name',
      viewMode: 'grid',
    });
    setInputValue('');
  };

  // Compter les champions par coût
  const championCounts = champions.reduce((acc, champion) => {
    acc[champion.cost[0]] = (acc[champion.cost[0]] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Obtenir les items recommandés pour un champion
  const getRecommendedItems = (champion: Champion) => {
    return (champion.recommendItems || [])
      .map((itemKey) => items.find((item) => item.key === itemKey))
      .filter(Boolean) as Item[];
  };

  // Statistiques pour le hub
  const favoritesCount = favorites.length;
  const metaCount = champions.filter((c) => c.isMeta).length;

  const hasSearchCriteria =
    inputValue.length > 0 || filters.selectedTags.length > 0;

  if (showResults) {
    return (
      <ResultsPage
        searchedChampions={filters.selectedTags}
        onBack={handleBackFromResults}
      />
    );
  }

  return (
    <>
      {/* Header de section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Champions</h2>
            <p className="text-slate-400">
              Découvrez et filtrez tous les champions du set actuel
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-slate-800/60 rounded-lg border border-slate-600/50 p-1">
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, viewMode: 'grid' }))
              }
              className={`p-2 rounded transition-all ${
                filters.viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, viewMode: 'compact' }))
              }
              className={`p-2 rounded transition-all ${
                filters.viewMode === 'compact'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et bouton analyser */}
      <div className="mb-8 flex items-center space-x-4">
        <div className="flex-1">
          <SearchBar
            inputValue={inputValue}
            setInputValue={setInputValue}
            selectedTags={filters.selectedTags}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onKeyDown={handleInputKeyDown}
            onClear={clearSearch}
          />
        </div>
        <AnalyzeButton
          onClick={startAnalysis}
          disabled={!hasSearchCriteria}
          isAnalyzing={isAnalyzing}
        />
      </div>

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
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as any,
                  }))
                }
                className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
              >
                <option value="name">Nom</option>
                <option value="cost">Coût</option>
                <option value="winrate">Winrate</option>
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
          ) : filters.viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {sortedChampions.map((champion) => (
                <ChampionCard
                  key={champion.key}
                  champion={champion}
                  viewMode={filters.viewMode}
                  isFavorite={favorites.includes(champion.name)}
                  onToggleFavorite={toggleFavorite}
                  onAddAsTag={addChampionAsTag}
                  recommendedItems={getRecommendedItems(champion)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedChampions.map((champion) => (
                <ChampionCard
                  key={champion.key}
                  champion={champion}
                  viewMode={filters.viewMode}
                  isFavorite={favorites.includes(champion.name)}
                  onToggleFavorite={toggleFavorite}
                  onAddAsTag={addChampionAsTag}
                  recommendedItems={getRecommendedItems(champion)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'analyse */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        steps={analysisSteps}
        currentStep={currentStep}
        progress={progress}
        onComplete={completeAnalysis}
      />
    </>
  );
}