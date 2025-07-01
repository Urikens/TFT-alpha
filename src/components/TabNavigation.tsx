import React from 'react';
import { Crown, Sparkles, Package, Target, Zap } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'champions' | 'items' | 'synergies' | 'optimizations';
  onTabChange: (tab: 'champions' | 'items' | 'synergies' | 'optimizations') => void;
  counts: {
    champions: number;
    items: number;
    synergies: number;
    optimizations: number;
  };
}

export default function TabNavigation({ activeTab, onTabChange, counts }: TabNavigationProps) {
  const tabs = [
    {
      id: 'champions' as const,
      name: 'Champions',
      icon: Crown,
      color: 'from-blue-500 to-purple-600',
      count: counts.champions,
      description: 'Unités de combat'
    },
    {
      id: 'items' as const,
      name: 'Items',
      icon: Package,
      color: 'from-green-500 to-emerald-600',
      count: counts.items,
      description: 'Équipements'
    },
    {
      id: 'synergies' as const,
      name: 'Synergies',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      count: counts.synergies,
      description: 'Traits & Bonus'
    },
    {
      id: 'optimizations' as const,
      name: 'Optimisations',
      icon: Target,
      color: 'from-orange-500 to-red-600',
      count: counts.optimizations,
      description: 'Conseils stratégiques'
    },
  ];

  return (
    <div className="mb-8">
      {/* Version 1: Cards horizontales avec descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                isActive
                  ? `bg-gradient-to-br ${tab.color} text-white border-transparent shadow-2xl shadow-${tab.color.split('-')[1]}-500/30`
                  : 'bg-slate-800/40 backdrop-blur text-slate-300 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50'
              }`}
            >
              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              
              <div className="relative p-6 text-center space-y-3">
                {/* Icône avec animation */}
                <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 shadow-lg' 
                    : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                }`}>
                  <Icon className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                </div>

                {/* Titre */}
                <div>
                  <h3 className={`font-bold text-lg transition-colors ${
                    isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                    {tab.name}
                  </h3>
                  <p className={`text-sm transition-colors ${
                    isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {tab.description}
                  </p>
                </div>

                {/* Compteur avec badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-700/50 text-slate-300 group-hover:bg-slate-600/50'
                }`}>
                  {tab.count}
                </div>

                {/* Indicateur actif */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-full"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Version alternative: Barre horizontale moderne */}
      <div className="hidden">
        <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700/30 p-2">
          <div className="flex items-center space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 font-semibold group ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-105'
                  }`}
                >
                  {/* Icône */}
                  <Icon className="w-5 h-5" />
                  
                  {/* Texte */}
                  <span>{tab.name}</span>
                  
                  {/* Badge compteur */}
                  <div className={`px-2 py-1 rounded-full text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-600/50 text-slate-400 group-hover:bg-slate-500/50 group-hover:text-slate-200'
                  }`}>
                    {tab.count}
                  </div>

                  {/* Effet de survol */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Version alternative: Style sidebar vertical */}
      <div className="hidden">
        <div className="flex flex-col space-y-3 w-64">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg`
                    : 'bg-slate-800/40 text-slate-300 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50'
                }`}
              >
                {/* Icône */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Contenu */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{tab.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-slate-600/50'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    isActive ? 'text-white/80' : 'text-slate-400'
                  }`}>
                    {tab.description}
                  </p>
                </div>

                {/* Indicateur */}
                {isActive && (
                  <div className="w-1 h-8 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}