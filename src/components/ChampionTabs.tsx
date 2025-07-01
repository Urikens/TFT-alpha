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

  const getTabBorderColor = (cost: number) => {
    const colors = {
      1: "border-gray-500",
      2: "border-green-500",
      3: "border-blue-500", 
      4: "border-purple-500",
      5: "border-yellow-500"
    };
    return colors[cost as keyof typeof colors] || "border-gray-500";
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

  const goldIcon = "https://cdn.dak.gg/tft/images2/icon/ico-gold-v2.png";

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => onTabChange('all')}
          className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500 shadow-lg scale-105'
              : 'bg-slate-800/60 text-slate-300 border-slate-600/50 hover:bg-slate-700/60 hover:scale-105'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span className="font-semibold">Tous</span>
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
            {totalChampions}
          </span>
        </button>
        {[1, 2, 3, 4, 5].map((cost) => (
          <button
            key={cost}
            onClick={() => onTabChange(cost)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
              activeTab === cost
                ? `bg-gradient-to-r ${getCostColor(cost)} text-white ${getTabBorderColor(cost)} shadow-lg scale-105`
                : 'bg-slate-800/60 text-slate-300 border-slate-600/50 hover:bg-slate-700/60 hover:scale-105'
            }`}
          >
            <img src={goldIcon} alt="Gold" className="w-4 h-4" />
            <span className="font-semibold">{getCostLabel(cost)}</span>
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {championCounts[cost] || 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}