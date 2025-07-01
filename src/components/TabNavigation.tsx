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
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all whitespace-nowrap font-semibold ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg scale-105`
                  : 'bg-slate-800/60 text-slate-300 border-slate-600/50 hover:bg-slate-700/60 hover:scale-105 hover:border-slate-500/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.name}</span>
              <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}