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
    },
    {
      id: 'items' as const,
      name: 'Items',
      icon: Package,
      color: 'from-green-500 to-emerald-600',
      count: counts.items,
    },
    {
      id: 'synergies' as const,
      name: 'Synergies',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      count: counts.synergies,
    },
    {
      id: 'optimizations' as const,
      name: 'Optimisations',
      icon: Target,
      color: 'from-orange-500 to-red-600',
      count: counts.optimizations,
    },
  ];

  return (
    <div className="mb-8">
      {/* Version compacte et élégante */}
      <div className="bg-slate-800/20 backdrop-blur rounded-xl border border-slate-700/30 p-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 whitespace-nowrap font-medium ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-${tab.color.split('-')[1]}-500/25 scale-105`
                    : 'text-slate-300 hover:bg-slate-700/40 hover:text-white hover:scale-105'
                }`}
              >
                {/* Effet de brillance subtil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 rounded-lg"></div>
                
                <div className="relative flex items-center space-x-3">
                  {/* Icône compacte */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-white/15' : 'bg-slate-700/30 group-hover:bg-slate-600/40'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Nom */}
                  <span className="text-sm font-semibold">{tab.name}</span>
                  
                  {/* Badge compteur compact */}
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-600/40 text-slate-400 group-hover:bg-slate-500/50 group-hover:text-slate-200'
                  }`}>
                    {tab.count}
                  </div>
                </div>

                {/* Indicateur actif en bas */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}