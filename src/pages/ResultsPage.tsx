import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Star, Copy, Eye, Heart, Flame, BarChart3, Target, TrendingUp, Users, Trophy, Shield, Sword, Sparkles, ChevronDown, ChevronUp, ExternalLink, Info, Zap } from 'lucide-react';
import { Champion, Item } from '../types';
import { commonSynergies } from '../data/synergies';

interface Composition {
  id: string;
  name: string;
  tier: 'S' | 'A' | 'B' | 'C';
  winRate: number;
  avgPlacement: number;
  playRate: number;
  champions: {
    champion: Champion;
    items: Item[];
    isCarry: boolean;
    level: number;
  }[];
  traits: {
    name: string;
    count: number;
    active: boolean;
    level: number;
  }[];
  earlyComp: Champion[];
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  gamePhase: 'Early' | 'Mid' | 'Late';
  rollDown: number;
  positioning: {
    frontline: Champion[];
    backline: Champion[];
  };
  gameplan: string;
  keyItems: string[];
}

interface ResultsPageProps {
  searchedChampions: string[];
  onBack: () => void;
}

export default function ResultsPage({ searchedChampions, onBack }: ResultsPageProps) {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [championsRes, itemsRes] = await Promise.all([
          fetch('/src/data/champions_TFT14.json'),
          fetch('/src/data/items_TFT14.json')
        ]);

        const championsData = await championsRes.json();
        const itemsData = await itemsRes.json();

        setChampions(championsData);
        setItems(itemsData);

        // Simulation d'analyse - affichage direct des compositions
        generateCompositions(championsData, itemsData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [searchedChampions]);

  const generateCompositions = (championsData: Champion[], itemsData: Item[]) => {
    const mockCompositions: Composition[] = [
      {
        id: '1',
        name: 'Anima Squad Hypercarry',
        tier: 'S',
        winRate: 78.4,
        avgPlacement: 2.1,
        playRate: 23.7,
        difficulty: 'Moyen',
        gamePhase: 'Late',
        rollDown: 8,
        gameplan: 'Jouer économie jusqu\'au niveau 8, puis roll pour Aurora 3* et Leona 2*. Positionner Aurora en sécurité à l\'arrière.',
        keyItems: ['Infinity Edge', 'Last Whisper', 'Bloodthirster'],
        champions: championsData.filter(c => c.traits?.includes('AnimaSquad')).slice(0, 8).map((champion, index) => ({
          champion,
          items: itemsData.slice(index * 3, (index * 3) + 3),
          isCarry: champion.cost[0] >= 4,
          level: champion.cost[0] >= 4 ? 3 : champion.cost[0] >= 3 ? 2 : 1
        })),
        traits: [
          { name: 'AnimaSquad', count: 7, active: true, level: 3 },
          { name: 'Marksman', count: 3, active: true, level: 2 },
          { name: 'Vanguard', count: 2, active: true, level: 1 }
        ],
        earlyComp: championsData.slice(0, 5),
        positioning: {
          frontline: championsData.slice(0, 3),
          backline: championsData.slice(3, 6)
        }
      },
      {
        id: '2',
        name: 'Exotech Rapidfire',
        tier: 'S',
        winRate: 74.8,
        avgPlacement: 2.4,
        playRate: 19.2,
        difficulty: 'Difficile',
        gamePhase: 'Mid',
        rollDown: 7,
        gameplan: 'Transition rapide vers Exotech au niveau 7. Prioriser Zeri 3* avec items AD. Flex entre Rapidfire et Marksman.',
        keyItems: ['Guinsoo\'s Rageblade', 'Runaan\'s Hurricane', 'Giant Slayer'],
        champions: championsData.filter(c => c.traits?.includes('Exotech') || c.traits?.includes('Rapidfire')).slice(0, 8).map((champion, index) => ({
          champion,
          items: itemsData.slice((index * 3) + 3, (index * 3) + 6),
          isCarry: champion.cost[0] >= 3,
          level: champion.cost[0] >= 4 ? 3 : champion.cost[0] >= 3 ? 2 : 1
        })),
        traits: [
          { name: 'Exotech', count: 5, active: true, level: 2 },
          { name: 'Rapidfire', count: 4, active: true, level: 2 },
          { name: 'Marksman', count: 2, active: true, level: 1 }
        ],
        earlyComp: championsData.slice(5, 10),
        positioning: {
          frontline: championsData.slice(5, 8),
          backline: championsData.slice(8, 11)
        }
      },
      {
        id: '3',
        name: 'Syndicate Bruiser',
        tier: 'A',
        winRate: 69.3,
        avgPlacement: 3.2,
        playRate: 16.8,
        difficulty: 'Facile',
        gamePhase: 'Early',
        rollDown: 6,
        gameplan: 'Composition agressive early/mid game. Roll au niveau 6 pour stabiliser avec Darius 3*. Transition vers 8 si économie le permet.',
        keyItems: ['Warmog\'s Armor', 'Gargoyle Stoneplate', 'Bramble Vest'],
        champions: championsData.filter(c => c.traits?.includes('Syndicate') || c.traits?.includes('Bruiser')).slice(0, 8).map((champion, index) => ({
          champion,
          items: itemsData.slice((index * 3) + 6, (index * 3) + 9),
          isCarry: champion.cost[0] >= 3,
          level: champion.cost[0] >= 4 ? 3 : champion.cost[0] >= 3 ? 2 : 1
        })),
        traits: [
          { name: 'Syndicate', count: 6, active: true, level: 3 },
          { name: 'Bruiser', count: 4, active: true, level: 2 },
          { name: 'Vanguard', count: 2, active: true, level: 1 }
        ],
        earlyComp: championsData.slice(10, 15),
        positioning: {
          frontline: championsData.slice(10, 13),
          backline: championsData.slice(13, 16)
        }
      },
      {
        id: '4',
        name: 'Divinicorp Dynamo',
        tier: 'A',
        winRate: 65.7,
        avgPlacement: 3.5,
        playRate: 14.3,
        difficulty: 'Moyen',
        gamePhase: 'Mid',
        rollDown: 7,
        gameplan: 'Composition AP scaling. Prioriser Morgana 3* avec items AP. Utiliser Dynamo pour maximiser les dégâts de zone.',
        keyItems: ['Archangel\'s Staff', 'Rabadon\'s Deathcap', 'Morellonomicon'],
        champions: championsData.filter(c => c.traits?.includes('Divinicorp') || c.traits?.includes('Dynamo')).slice(0, 8).map((champion, index) => ({
          champion,
          items: itemsData.slice((index * 3) + 9, (index * 3) + 12),
          isCarry: champion.cost[0] >= 3,
          level: champion.cost[0] >= 4 ? 3 : champion.cost[0] >= 3 ? 2 : 1
        })),
        traits: [
          { name: 'Divinicorp', count: 5, active: true, level: 2 },
          { name: 'Dynamo', count: 3, active: true, level: 2 },
          { name: 'Techie', count: 2, active: true, level: 1 }
        ],
        earlyComp: championsData.slice(15, 20),
        positioning: {
          frontline: championsData.slice(15, 18),
          backline: championsData.slice(18, 21)
        }
      }
    ];

    setCompositions(mockCompositions);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'from-red-500 to-pink-600';
      case 'A': return 'from-orange-500 to-yellow-600';
      case 'B': return 'from-blue-500 to-cyan-600';
      case 'C': return 'from-gray-500 to-slate-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile': return 'text-green-400';
      case 'Moyen': return 'text-yellow-400';
      case 'Difficile': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getSynergyData = (synergyName: string) => {
    const synergy = commonSynergies.find(s => s.name === synergyName);
    return synergy || { name: synergyName, color: 'from-gray-500 to-gray-600', imageUrl: '' };
  };

  const getTraitLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'border-gray-400 bg-gray-400/20 text-gray-300';
      case 2: return 'border-yellow-400 bg-yellow-400/20 text-yellow-300';
      case 3: return 'border-orange-400 bg-orange-400/20 text-orange-300';
      case 4: return 'border-red-400 bg-red-400/20 text-red-300';
      default: return 'border-gray-400 bg-gray-400/20 text-gray-300';
    }
  };

  const toggleFavorite = (compId: string) => {
    setFavorites(prev => 
      prev.includes(compId)
        ? prev.filter(id => id !== compId)
        : [...prev, compId]
    );
  };

  const toggleExpanded = (compId: string) => {
    setExpandedComp(expandedComp === compId ? null : compId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-400 text-lg font-medium">
            Chargement des compositions...
          </p>
          <p className="text-slate-500 text-sm">
            Basé sur: {searchedChampions.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header de section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-3 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">Compositions Recommandées</h2>
              <p className="text-slate-400">
                Basé sur vos champions: <span className="text-blue-400 font-medium">{searchedChampions.join(', ')}</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full font-medium">
            {compositions.length} compositions trouvées
          </div>
        </div>

        {/* Liste des compositions */}
        <div className="space-y-4">
          {compositions.map((comp) => (
            <div
              key={comp.id}
              className="group relative overflow-hidden bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl"
            >
              {/* Image de fond floutée */}
              {comp.champions[0] && (
                <div
                  className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-all duration-700 blur-sm scale-110"
                  style={{
                    backgroundImage: `url(${comp.champions[0].champion.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Overlay pour améliorer la lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

              <div className="relative z-10 p-6">
                {/* Header de la composition */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getTierColor(comp.tier)} text-white font-bold text-sm shadow-lg`}>
                      Tier {comp.tier}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        {comp.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className={getDifficultyColor(comp.difficulty)}>{comp.difficulty}</span>
                        <span>•</span>
                        <span>{comp.gamePhase} Game</span>
                        <span>•</span>
                        <span>Roll Down Niv. {comp.rollDown}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Stats principales */}
                    <div className="flex items-center space-x-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-400">{comp.winRate}%</div>
                        <div className="text-xs text-slate-400">Winrate</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-400">{comp.avgPlacement}</div>
                        <div className="text-xs text-slate-400">Placement</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-400">{comp.playRate}%</div>
                        <div className="text-xs text-slate-400">Play Rate</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(comp.id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.includes(comp.id)
                            ? 'text-pink-500 bg-pink-500/10'
                            : 'text-slate-400 hover:text-pink-400 hover:bg-pink-500/10'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpanded(comp.id)}
                        className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10"
                      >
                        {expandedComp === comp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Champions avec items repositionnés */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-300 font-medium text-sm">Champions ({comp.champions.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {comp.champions.map((champData, index) => (
                      <div key={index} className="relative group/champ flex flex-col items-center">
                        {/* Champion principal */}
                        <div className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                          champData.isCarry 
                            ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' 
                            : 'border-slate-600 hover:border-blue-400'
                        }`}>
                          <img
                            src={champData.champion.imageUrl}
                            alt={champData.champion.name}
                            className="w-14 h-14 object-cover transition-all duration-300 group-hover/champ:scale-110"
                          />
                          
                          {/* Niveau du champion */}
                          <div className="absolute -top-2 -left-2 bg-slate-900 border border-slate-600 rounded-full w-6 h-6 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{champData.level}</span>
                          </div>

                          {/* Badge carry */}
                          {champData.isCarry && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-xl">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Items sous le champion - repositionnés pour plus de clarté */}
                        <div className="flex space-x-1 mt-2">
                          {champData.items.slice(0, 3).map((item, i) => (
                            <div
                              key={i}
                              className="relative group/item"
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded border-2 border-slate-600 bg-slate-800 hover:border-blue-400 transition-all duration-200 hover:scale-110"
                              />
                              {/* Tooltip pour le nom de l'item */}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                                {item.name}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Nom du champion au hover */}
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/champ:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10">
                          {champData.champion.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synergies actives */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300 font-medium text-sm">Synergies Actives</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {comp.traits.filter(trait => trait.active).map((trait, index) => {
                      const synergyData = getSynergyData(trait.name);
                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 border-2 ${getTraitLevelColor(trait.level)}`}
                        >
                          {synergyData.imageUrl ? (
                            <img 
                              src={synergyData.imageUrl} 
                              alt={trait.name}
                              className="w-4 h-4 object-cover rounded"
                            />
                          ) : (
                            <span className="text-blue-400">⚡</span>
                          )}
                          <span className="font-bold">{trait.name}</span>
                          <div className="bg-white/30 rounded-full px-2 py-0.5 text-xs font-bold">
                            {trait.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panneau détaillé */}
                {expandedComp === comp.id && (
                  <div className="mt-6 pt-6 border-t border-slate-700/30 space-y-6">
                    {/* Plan de jeu */}
                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-3 text-sm flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Plan de Jeu
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed bg-slate-700/20 rounded-lg p-4">
                        {comp.gameplan}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Early comp */}
                      <div>
                        <h5 className="text-green-400 font-semibold mb-3 text-sm flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Early Game
                        </h5>
                        <div className="grid grid-cols-5 gap-2">
                          {comp.earlyComp.map((champion, index) => (
                            <div key={index} className="relative">
                              <img
                                src={champion.imageUrl}
                                alt={champion.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                                title={champion.name}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Positionnement */}
                      <div>
                        <h5 className="text-blue-400 font-semibold mb-3 text-sm flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Positionnement
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Frontline</div>
                            <div className="flex space-x-1">
                              {comp.positioning.frontline.slice(0, 4).map((champion, index) => (
                                <img
                                  key={index}
                                  src={champion.imageUrl}
                                  alt={champion.name}
                                  className="w-6 h-6 rounded border border-slate-600"
                                  title={champion.name}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Backline</div>
                            <div className="flex space-x-1">
                              {comp.positioning.backline.slice(0, 4).map((champion, index) => (
                                <img
                                  key={index}
                                  src={champion.imageUrl}
                                  alt={champion.name}
                                  className="w-6 h-6 rounded border border-slate-600"
                                  title={champion.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items clés */}
                      <div>
                        <h5 className="text-yellow-400 font-semibold mb-3 text-sm flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          Items Clés
                        </h5>
                        <div className="space-y-2">
                          {comp.keyItems.map((itemName, index) => (
                            <div key={index} className="text-slate-300 text-sm bg-slate-700/30 rounded px-3 py-1">
                              {itemName}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions étendues */}
                    <div className="flex space-x-3 pt-4 border-t border-slate-700/30">
                      <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-300 text-sm font-bold hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30">
                        <Copy className="w-4 h-4" />
                        <span>Copier la composition</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600/50 to-emerald-600/50 hover:from-green-500/70 hover:to-emerald-500/70 text-white rounded-lg transition-all duration-300 text-sm font-bold hover:scale-105 border border-green-500/30">
                        <ExternalLink className="w-4 h-4" />
                        <span>Guide détaillé</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {compositions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-2">Aucune composition trouvée</p>
              <p className="text-slate-500 text-sm">
                Essayez avec d'autres champions ou ajustez vos critères de recherche
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}