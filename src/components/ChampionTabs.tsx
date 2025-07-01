import React from 'react';
import { Crown } from 'lucide-react';

interface ChampionTabsProps {
  activeTab: number | 'all';
  onTabChange: (tab: number | 'all') => void;
  championCounts: Record<number, number>;
  totalChampions: number;
}

export default function ChampionTabs({ 
  activeTab, 
  onTabChange, 
  championCounts, 
  totalChampions 
}: ChampionTabsProps) {
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

  const goldIcon = "https://cdn.dak.gg/tft/images2/icon/ico-gold-v2.png";

  return (
    <div className="mb-8">
      <div className="border-b border-slate-700/50">
        <div className="flex items-center space-x-6 overflow-x-auto">
          {/* Onglet "Tous" */}
          <button
            onClick={() => onTabChange('all')}
            className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span className="font-medium">Tous</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
              {totalChampions}
            </span>
          </button>

          {/* Onglets par coût */}
          {[1, 2, 3, 4, 5].map((cost) => (
            <button
              key={cost}
              onClick={() => onTabChange(cost)}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === cost
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <img src={goldIcon} alt="Gold" className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">{getCostLabel(cost)}</span>
              <span className="font-medium sm:hidden">{cost}</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {championCounts[cost] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}