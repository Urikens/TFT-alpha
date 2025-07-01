import React from 'react';
import { Crown, Sparkles, Package, Target } from 'lucide-react';

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
      count: counts.champions,
    },
    {
      id: 'items' as const,
      name: 'Items',
      icon: Package,
      count: counts.items,
    },
    {
      id: 'synergies' as const,
      name: 'Synergies',
      icon: Sparkles,
      count: counts.synergies,
    },
    {
      id: 'optimizations' as const,
      name: 'Optimisations',
      icon: Target,
      count: counts.optimizations,
    },
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-slate-700/50">
        <div className="flex items-center space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}