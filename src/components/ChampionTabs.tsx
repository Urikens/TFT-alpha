import React from 'react';
import { Crown, DollarSign } from 'lucide-react';

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
      {/* Version moderne avec design amélioré */}
      <div className="bg-slate-800/20 backdrop-blur rounded-2xl border border-slate-700/30 p-3">
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {/* Onglet "Tous" */}
          <button
            onClick={() => onTabChange('all')}
            className={`group relative flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 whitespace-nowrap font-semibold ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500 shadow-xl shadow-blue-500/30 scale-105'
                : 'bg-slate-800/40 text-slate-300 border-slate-600/30 hover:bg-slate-700/50 hover:scale-105 hover:border-slate-500/50'
            }`}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            <div className="relative flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                activeTab === 'all' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-600/50'
              }`}>
                <Crown className="w-4 h-4" />
              </div>
              <span>Tous</span>
              <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-600/50 text-slate-400 group-hover:bg-slate-500/50'
              }`}>
                {totalChampions}
              </div>
            </div>
          </button>

          {/* Onglets par coût */}
          {[1, 2, 3, 4, 5].map((cost) => (
            <button
              key={cost}
              onClick={() => onTabChange(cost)}
              className={`group relative flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 whitespace-nowrap font-semibold ${
                activeTab === cost
                  ? `bg-gradient-to-r ${getCostColor(cost)} text-white border-transparent shadow-xl scale-105`
                  : 'bg-slate-800/40 text-slate-300 border-slate-600/30 hover:bg-slate-700/50 hover:scale-105 hover:border-slate-500/50'
              }`}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              
              <div className="relative flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  activeTab === cost ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                }`}>
                  <img src={goldIcon} alt="Gold" className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline">{getCostLabel(cost)}</span>
                <span className="sm:hidden">{cost}</span>
                <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeTab === cost ? 'bg-white/20 text-white' : 'bg-slate-600/50 text-slate-400 group-hover:bg-slate-500/50'
                }`}>
                  {championCounts[cost] || 0}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Version alternative: Pills modernes */}
      <div className="hidden">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => onTabChange('all')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-full border-2 transition-all whitespace-nowrap ${
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
              className={`flex items-center space-x-2 px-4 py-3 rounded-full border-2 transition-all whitespace-nowrap ${
                activeTab === cost
                  ? `bg-gradient-to-r ${getCostColor(cost)} text-white border-transparent shadow-lg scale-105`
                  : 'bg-slate-800/60 text-slate-300 border-slate-600/50 hover:bg-slate-700/60 hover:scale-105'
              }`}
            >
              <img src={goldIcon} alt="Gold" className="w-4 h-4" />
              <span className="font-semibold">{cost}</span>
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                {championCounts[cost] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}