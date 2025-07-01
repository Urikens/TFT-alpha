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
      {/* Version fine et élégante */}
      <div className="bg-slate-800/20 backdrop-blur rounded-xl border border-slate-700/30 p-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {/* Onglet "Tous" */}
          <button
            onClick={() => onTabChange('all')}
            className={`group relative flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 whitespace-nowrap font-medium ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                : 'text-slate-300 hover:bg-slate-700/40 hover:text-white hover:scale-105'
            }`}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 rounded-lg"></div>
            
            <div className="relative flex items-center space-x-2">
              <div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                activeTab === 'all' ? 'bg-white/15' : 'bg-slate-700/30 group-hover:bg-slate-600/40'
              }`}>
                <Crown className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold">Tous</span>
              <div className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-600/40 text-slate-400 group-hover:bg-slate-500/50'
              }`}>
                {totalChampions}
              </div>
            </div>

            {/* Indicateur actif */}
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white rounded-full"></div>
            )}
          </button>

          {/* Onglets par coût */}
          {[1, 2, 3, 4, 5].map((cost) => (
            <button
              key={cost}
              onClick={() => onTabChange(cost)}
              className={`group relative flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 whitespace-nowrap font-medium ${
                activeTab === cost
                  ? `bg-gradient-to-r ${getCostColor(cost)} text-white shadow-lg scale-105`
                  : 'text-slate-300 hover:bg-slate-700/40 hover:text-white hover:scale-105'
              }`}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 rounded-lg"></div>
              
              <div className="relative flex items-center space-x-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  activeTab === cost ? 'bg-white/15' : 'bg-slate-700/30 group-hover:bg-slate-600/40'
                }`}>
                  <img src={goldIcon} alt="Gold" className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline">{getCostLabel(cost)}</span>
                <span className="text-sm font-semibold sm:hidden">{cost}</span>
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === cost ? 'bg-white/20 text-white' : 'bg-slate-600/40 text-slate-400 group-hover:bg-slate-500/50'
                }`}>
                  {championCounts[cost] || 0}
                </div>
              </div>

              {/* Indicateur actif */}
              {activeTab === cost && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}