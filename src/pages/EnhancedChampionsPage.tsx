import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Grid3X3, List } from 'lucide-react';
import { Champion, Item, FilterState } from '../types';
import { commonSynergies } from '../data/synergies';
import SearchBar from '../components/SearchBar';
import AnalyzeButton from '../components/AnalyzeButton';
import AnalysisModal from '../components/AnalysisModal';
import FilterHub from '../components/FilterHub';
import ChampionCard from '../components/ChampionCard';
import ItemCard from '../components/ItemCard';
import SynergyCard from '../components/SynergyCard';
import OptimizationCard from '../components/OptimizationCard';
import TabNavigation from '../components/TabNavigation';
import SelectionPanel from '../components/SelectionPanel';
import ResultsPage from './ResultsPage';

// Types pour les optimisations
interface Optimization {
  id: string;
  name: string;
  type: 'positioning' | 'economy' | 'itemization' | 'transition';
  description: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  impact: 'Faible' | 'Moyen' | 'Élevé';
  gamePhase: 'Early' | 'Mid' | 'Late' | 'All';
  tips: string[];
}

export default function EnhancedChampionsPage() {
  const [inputValue, setInputValue] = useState('');
  const [champions, setChampions] = useState<Champion[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'champions' | 'items' | 'synergies' | 'optimizations'>('champions');

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

  // États de sélection - NOUVEAU SYSTÈME
  const [selectedChampions, setSelectedChampions] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSynergies, setSelectedSynergies] = useState<string[]>([]);
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);

  // État pour contrôler l'affichage filtré ou complet
  const [showFilteredResults, setShowFilteredResults] = useState(false);

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
          };
        });

        // Générer des optimisations simulées
        const mockOptimizations: Optimization[] = [
          {
            id: '1',
            name: 'Positionnement Carry Arrière',
            type: 'positioning',
            description: 'Placez vos carries en dernière ligne pour maximiser leur survie et leur temps de DPS.',
            difficulty: 'Facile',
            impact: 'Élevé',
            gamePhase: 'All',
            tips: ['Utilisez les coins du plateau', 'Évitez les assassins', 'Protégez avec des tanks']
          },
          {
            id: '2',
            name: 'Économie 50 Gold',
            type: 'economy',
            description: 'Maintenez 50+ gold pour maximiser les intérêts et stabiliser votre économie.',
            difficulty: 'Moyen',
            impact: 'Élevé',
            gamePhase: 'Mid',
            tips: ['Ne descendez jamais sous 50g', 'Rollez seulement si nécessaire', 'Priorisez les upgrades naturels']
          },
          {
            id: '3',
            name: 'Items Prioritaires',
            type: 'itemization',
            description: 'Priorisez les items de votre carry principal avant de distribuer aux autres champions.',
            difficulty: 'Facile',
            impact: 'Élevé',
            gamePhase: 'Early',
            tips: ['3 items sur le carry principal', 'Items défensifs sur les tanks', 'Évitez de disperser']
          },
          {
            id: '4',
            name: 'Transition Flexible',
            type: 'transition',
            description: 'Adaptez votre composition en fonction des champions et items obtenus.',
            difficulty: 'Difficile',
            impact: 'Moyen',
            gamePhase: 'Mid',
            tips: ['Gardez plusieurs options ouvertes', 'Observez le lobby', 'Pivotez au bon moment']
          },
          {
            id: '5',
            name: 'Scout Adversaires',
            type: 'positioning',
            description: 'Observez les compositions adverses pour adapter votre positionnement.',
            difficulty: 'Moyen',
            impact: 'Moyen',
            gamePhase: 'All',
            tips: ['Vérifiez les assassins', 'Adaptez contre les AoE', 'Repositionnez entre les rounds']
          }
        ];
  
        setChampions(championsWithStats);
        setItems(itemsData);
        setOptimizations(mockOptimizations);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // FONCTION CORRIGÉE : Détection automatique du bon onglet
  const detectBestTab = (searchTerm: string): 'champions' | 'items' | 'synergies' | 'optimizations' => {
    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2) return activeTab;

    // Recherche dans les champions
    const championMatches = champions.filter(champion => 
      champion.name.toLowerCase().includes(term) ||
      (champion.traits && champion.traits.some(trait => trait.toLowerCase().includes(term))) ||
      (champion.skill && champion.skill.name.toLowerCase().includes(term))
    ).length;

    // Recherche dans les items
    const itemMatches = items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.shortDesc && item.shortDesc.toLowerCase().includes(term)) ||
      (item.desc && item.desc.toLowerCase().includes(term)) ||
      (item.affectedTraitKey && item.affectedTraitKey.toLowerCase().includes(term))
    ).length;

    // Recherche dans les synergies
    const synergyMatches = commonSynergies.filter(synergy =>
      synergy.name.toLowerCase().includes(term)
    ).length;

    // Recherche dans les optimisations
    const optimizationMatches = optimizations.filter(optimization =>
      optimization.name.toLowerCase().includes(term) ||
      optimization.description.toLowerCase().includes(term) ||
      optimization.type.toLowerCase().includes(term) ||
      optimization.difficulty.toLowerCase().includes(term)
    ).length;

    // Retourne l'onglet avec le plus de résultats
    const maxMatches = Math.max(championMatches, itemMatches, synergyMatches, optimizationMatches);
    
    if (maxMatches === 0) return activeTab;
    
    if (championMatches === maxMatches) return 'champions';
    if (itemMatches === maxMatches) return 'items';
    if (synergyMatches === maxMatches) return 'synergies';
    return 'optimizations';
  };
  
  // Gestion de la recherche avec changement automatique d'onglet
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

  // FONCTION CORRIGÉE : Gestion de la saisie avec changement automatique d'onglet
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Si on tape quelque chose, détecter le meilleur onglet et changer automatiquement
    if (value.trim().length >= 2) {
      const bestTab = detectBestTab(value);
      
      if (bestTab !== activeTab) {
        setActiveTab(bestTab);
      }
      setShowFilteredResults(true);
    } else {
      setShowFilteredResults(false);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !filters.selectedTags.includes(trimmedValue)) {
      // Détecter le meilleur onglet avant d'ajouter le tag
      const bestTab = detectBestTab(trimmedValue);
      setActiveTab(bestTab);
      
      setFilters((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, trimmedValue],
      }));
      setInputValue('');
      setShowFilteredResults(true);
    }
  };

  const removeTag = (index: number) => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((_, i) => i !== index),
    }));
    
    // Si plus de tags, reset l'affichage
    if (filters.selectedTags.length === 1) {
      setShowFilteredResults(false);
    }
  };

  // NOUVEAU : Fonction pour ajouter à la sélection et reset l'affichage
  const addToSelection = (name: string, type: 'champion' | 'item' | 'synergy' | 'optimization', id?: string) => {
    switch (type) {
      case 'champion':
        if (!selectedChampions.includes(name)) {
          setSelectedChampions(prev => [...prev, name]);
        }
        break;
      case 'item':
        if (id && !selectedItems.includes(id)) {
          setSelectedItems(prev => [...prev, id]);
        }
        break;
      case 'synergy':
        if (!selectedSynergies.includes(name)) {
          setSelectedSynergies(prev => [...prev, name]);
        }
        break;
      case 'optimization':
        if (id && !selectedOptimizations.includes(id)) {
          setSelectedOptimizations(prev => [...prev, id]);
        }
        break;
    }

    // Reset l'affichage pour montrer tous les éléments
    setShowFilteredResults(false);
    setInputValue('');
    setFilters(prev => ({
      ...prev,
      selectedTags: []
    }));
  };

  // NOUVEAU : Fonctions pour supprimer de la sélection
  const removeFromChampions = (name: string) => {
    setSelectedChampions(prev => prev.filter(n => n !== name));
  };

  const removeFromItems = (id: string) => {
    setSelectedItems(prev => prev.filter(n => n !== id));
  };

  const removeFromSynergies = (name: string) => {
    setSelectedSynergies(prev => prev.filter(n => n !== name));
  };

  const removeFromOptimizations = (id: string) => {
    setSelectedOptimizations(prev => prev.filter(n => n !== id));
  };

  const clearSearch = () => {
    setInputValue('');
    setFilters((prev) => ({
      ...prev,
      selectedTags: [],
    }));
    setShowFilteredResults(false);
  };

  // NOUVEAU : Reset complet de toutes les sélections
  const resetAllSelections = () => {
    setSelectedChampions([]);
    setSelectedItems([]);
    setSelectedSynergies([]);
    setSelectedOptimizations([]);
    setShowFilteredResults(false);
    setInputValue('');
    setFilters(prev => ({
      ...prev,
      selectedTags: []
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
    setShowFilteredResults(false);
    resetAllSelections();
  };

  // Toggle favorite
  const toggleFavorite = (name: string) => {
    setFavorites((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  // Obtenir les items recommandés pour un champion
  const getRecommendedItems = (champion: Champion) => {
    return (champion.recommendItems || [])
      .map((itemKey) => items.find((item) => item.key === itemKey))
      .filter(Boolean) as Item[];
  };

  // Compter les champions par synergie
  const getSynergyChampionCount = (synergyName: string) => {
    return champions.filter(champion => 
      champion.traits?.includes(synergyName)
    ).length;
  };

  // FONCTION CORRIGÉE : Recherche universelle dans le texte
  const searchInText = (text: string, searchTerms: string[]): boolean => {
    if (searchTerms.length === 0) return true;
    
    const normalizedText = text.toLowerCase();
    return searchTerms.some(term => 
      normalizedText.includes(term.toLowerCase())
    );
  };

  // FONCTION CORRIGÉE : Filtrage selon l'onglet actif avec recherche universelle
  const getFilteredData = () => {
    // Si on n'affiche pas les résultats filtrés, retourner toutes les données
    if (!showFilteredResults && inputValue.trim() === '' && filters.selectedTags.length === 0) {
      switch (activeTab) {
        case 'champions': return champions;
        case 'items': return items;
        case 'synergies': return commonSynergies;
        case 'optimizations': return optimizations;
        default: return [];
      }
    }

    const searchTerms = [
      ...filters.selectedTags,
      ...(inputValue.trim() ? [inputValue.trim()] : [])
    ];

    switch (activeTab) {
      case 'champions':
        return champions.filter((champion) => {
          const matchesSearch = searchTerms.length === 0 || 
            searchInText(champion.name, searchTerms) ||
            (champion.traits && champion.traits.some(trait => 
              searchInText(trait, searchTerms)
            )) ||
            (champion.skill && searchInText(champion.skill.name, searchTerms)) ||
            (champion.skill && searchInText(champion.skill.desc, searchTerms));

          const matchesFavorites =
            !filters.showOnlyFavorites || favorites.includes(champion.name);
          const matchesMeta = !filters.showOnlyMeta || champion.isMeta;
          const matchesSynergies =
            filters.selectedSynergies.length === 0 ||
            (champion.traits &&
              filters.selectedSynergies.some((s) => champion.traits?.includes(s)));

          return matchesSearch && matchesFavorites && matchesMeta && matchesSynergies;
        });

      case 'items':
        return items.filter((item) => {
          const matchesSearch = searchTerms.length === 0 ||
            searchInText(item.name, searchTerms) ||
            searchInText(item.shortDesc || '', searchTerms) ||
            searchInText(item.desc || '', searchTerms) ||
            searchInText(item.fromDesc || '', searchTerms) ||
            searchInText(item.affectedTraitKey || '', searchTerms) ||
            (item.tags && item.tags.some(tag => searchInText(tag, searchTerms))) ||
            (item.compositions && item.compositions.some(comp => searchInText(comp, searchTerms)));

          return matchesSearch;
        });

      case 'synergies':
        return commonSynergies.filter((synergy) => {
          const matchesSearch = searchTerms.length === 0 ||
            searchInText(synergy.name, searchTerms) ||
            searchInText(synergy.icon, searchTerms);

          return matchesSearch;
        });

      case 'optimizations':
        return optimizations.filter((optimization) => {
          const matchesSearch = searchTerms.length === 0 ||
            searchInText(optimization.name, searchTerms) ||
            searchInText(optimization.description, searchTerms) ||
            searchInText(optimization.type, searchTerms) ||
            searchInText(optimization.difficulty, searchTerms) ||
            searchInText(optimization.gamePhase, searchTerms) ||
            searchInText(optimization.impact, searchTerms) ||
            (optimization.tips && optimization.tips.some(tip => searchInText(tip, searchTerms)));

          return matchesSearch;
        });

      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  // Tri des données filtrées
  const sortedData = [...filteredData].sort((a: any, b: any) => {
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cost':
        if (activeTab === 'champions') {
          return (a as Champion).cost[0] - (b as Champion).cost[0];
        }
        return 0;
      case 'winrate':
        if (activeTab === 'champions') {
          return ((b as Champion).winRate || 0) - ((a as Champion).winRate || 0);
        }
        return 0;
      default:
        return 0;
    }
  });

  // Statistiques pour les onglets
  const tabCounts = {
    champions: champions.length,
    items: items.length,
    synergies: commonSynergies.length,
    optimizations: optimizations.length,
  };

  // Statistiques pour le hub
  const favoritesCount = favorites.length;
  const metaCount = champions.filter((c) => c.isMeta).length;

  // Total des sélections
  const totalSelections = selectedChampions.length + selectedItems.length + selectedSynergies.length + selectedOptimizations.length;

  const hasSearchCriteria =
    inputValue.length > 0 || 
    filters.selectedTags.length > 0 ||
    totalSelections > 0 ||
    filters.selectedSynergies.length > 0;

  if (showResults) {
    return (
      <ResultsPage
        searchedChampions={[...selectedChampions, ...filters.selectedTags]}
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
            <h2 className="text-3xl font-bold text-white">Assistant TFT</h2>
            <p className="text-slate-400">
              Sélectionnez des champions, items, synergies et optimisations pour créer la composition parfaite
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

      {/* Navigation par onglets */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Barre de recherche et bouton analyser */}
      <div className="mb-8 flex items-center space-x-4">
        <div className="flex-1">
          <SearchBar
            inputValue={inputValue}
            setInputValue={handleInputChange}
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

      {/* NOUVEAU : Panneau des sélections */}
      <SelectionPanel
        selectedChampions={selectedChampions}
        selectedItems={selectedItems}
        selectedSynergies={selectedSynergies}
        selectedOptimizations={selectedOptimizations}
        champions={champions}
        items={items}
        optimizations={optimizations}
        onRemoveChampion={removeFromChampions}
        onRemoveItem={removeFromItems}
        onRemoveSynergy={removeFromSynergies}
        onRemoveOptimization={removeFromOptimizations}
        onClearAll={resetAllSelections}
      />

      {/* Affichage du contenu selon l'onglet */}
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
                {activeTab === 'champions' && (
                  <>
                    <option value="cost">Coût</option>
                    <option value="winrate">Winrate</option>
                  </>
                )}
              </select>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full font-medium">
              {sortedData.length} résultats
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
                Chargement des données...
              </p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">
                  Aucun résultat trouvé
                </p>
                <p className="text-slate-500 text-sm">
                  Essayez d'ajuster votre recherche
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
              {sortedData.map((item: any) => {
                if (activeTab === 'champions') {
                  return (
                    <ChampionCard
                      key={item.key}
                      champion={item}
                      viewMode={filters.viewMode}
                      isFavorite={favorites.includes(item.name)}
                      onToggleFavorite={toggleFavorite}
                      onAddAsTag={(name) => addToSelection(name, 'champion')}
                      recommendedItems={getRecommendedItems(item)}
                    />
                  );
                } else if (activeTab === 'items') {
                  return (
                    <ItemCard
                      key={item.key}
                      item={item}
                      viewMode={filters.viewMode}
                      isSelected={selectedItems.includes(item.key)}
                      onToggleSelect={(key) => addToSelection(item.name, 'item', key)}
                      onAddAsTag={(name) => addToSelection(name, 'item', item.key)}
                    />
                  );
                } else if (activeTab === 'synergies') {
                  return (
                    <SynergyCard
                      key={item.name}
                      synergy={item}
                      viewMode={filters.viewMode}
                      isSelected={selectedSynergies.includes(item.name)}
                      onToggleSelect={(name) => addToSelection(name, 'synergy')}
                      onAddAsTag={(name) => addToSelection(name, 'synergy')}
                      championCount={getSynergyChampionCount(item.name)}
                    />
                  );
                } else if (activeTab === 'optimizations') {
                  return (
                    <OptimizationCard
                      key={item.id}
                      optimization={item}
                      viewMode={filters.viewMode}
                      isSelected={selectedOptimizations.includes(item.id)}
                      onToggleSelect={(id) => addToSelection(item.name, 'optimization', id)}
                      onAddAsTag={(name) => addToSelection(name, 'optimization', item.id)}
                    />
                  );
                }
                return null;
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedData.map((item: any) => {
                if (activeTab === 'champions') {
                  return (
                    <ChampionCard
                      key={item.key}
                      champion={item}
                      viewMode={filters.viewMode}
                      isFavorite={favorites.includes(item.name)}
                      onToggleFavorite={toggleFavorite}
                      onAddAsTag={(name) => addToSelection(name, 'champion')}
                      recommendedItems={getRecommendedItems(item)}
                    />
                  );
                } else if (activeTab === 'items') {
                  return (
                    <ItemCard
                      key={item.key}
                      item={item}
                      viewMode={filters.viewMode}
                      isSelected={selectedItems.includes(item.key)}
                      onToggleSelect={(key) => addToSelection(item.name, 'item', key)}
                      onAddAsTag={(name) => addToSelection(name, 'item', item.key)}
                    />
                  );
                } else if (activeTab === 'synergies') {
                  return (
                    <SynergyCard
                      key={item.name}
                      synergy={item}
                      viewMode={filters.viewMode}
                      isSelected={selectedSynergies.includes(item.name)}
                      onToggleSelect={(name) => addToSelection(name, 'synergy')}
                      onAddAsTag={(name) => addToSelection(name, 'synergy')}
                      championCount={getSynergyChampionCount(item.name)}
                    />
                  );
                } else if (activeTab === 'optimizations') {
                  return (
                    <OptimizationCard
                      key={item.id}
                      optimization={item}
                      viewMode={filters.viewMode}
                      isSelected={selectedOptimizations.includes(item.id)}
                      onToggleSelect={(id) => addToSelection(item.name, 'optimization', id)}
                      onAddAsTag={(name) => addToSelection(name, 'optimization', item.id)}
                    />
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hub de filtres flottant */}
      <FilterHub
        selectedSynergies={filters.selectedSynergies}
        onToggleSynergy={toggleSynergy}
        showOnlyFavorites={filters.showOnlyFavorites}
        onToggleFavorites={(value) =>
          setFilters((prev) => ({ ...prev, showOnlyFavorites: value }))
        }
        showOnlyMeta={filters.showOnlyMeta}
        onToggleMeta={(value) =>
          setFilters((prev) => ({ ...prev, showOnlyMeta: value }))
        }
        onClearAllFilters={clearAllFilters}
        championsCount={sortedData.length}
        favoritesCount={favoritesCount}
        metaCount={metaCount}
      />

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