import React from 'react';
import { Heart, Flame, Star } from 'lucide-react';
import { Champion } from '../types';
import { commonSynergies } from '../data/synergies';

interface ChampionCardProps {
  champion: Champion;
  viewMode: 'grid' | 'compact';
  isFavorite: boolean;
  onToggleFavorite: (championName: string) => void;
  onAddAsTag: (championName: string) => void;
  recommendedItems: any[];
}

export default function ChampionCard({
  champion,
  viewMode,
  isFavorite,
  onToggleFavorite,
  onAddAsTag,
  recommendedItems,
}: ChampionCardProps) {
  const getCostColor = (cost: number) => {
    const colors = {
      1: 'from-gray-500 to-gray-600',
      2: 'from-green-500 to-green-600',
      3: 'from-blue-500 to-blue-600',
      4: 'from-purple-500 to-purple-600',
      5: 'from-yellow-500 to-yellow-600',
    };
    return colors[cost as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getSynergyData = (synergyName: string) => {
    const synergy = commonSynergies.find((s) => s.name === synergyName);
    return synergy || { name: synergyName, color: 'from-gray-500 to-gray-600', imageUrl: '' };
  };

  const currentCost = champion.cost[0];

  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onAddAsTag(champion.name)}
        className="group relative overflow-hidden rounded-xl border border-slate-600/20 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-500/50"
      >
        {/* Badge Meta */}
        {champion.isMeta && (
          <div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center space-x-1">
            <Flame className="w-3 h-3" />
            <span>META</span>
          </div>
        )}

        {/* Badge avgPlacement */}
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm">
          {champion.avgPlacement?.toFixed(1)}
        </div>

        {/* Image floutée en fond au hover */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-15 blur-sm scale-110 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
          style={{ backgroundImage: `url(${champion.imageUrl})` }}
        ></div>

        {/* Contenu */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <img
              src={champion.imageUrl}
              alt={champion.name}
              className="w-16 h-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
            />
            {/* Badge de coût */}
            <div
              className={`absolute -bottom-2 -right-2 rounded-full w-6 h-6 flex items-center justify-center shadow-lg bg-gradient-to-r ${getCostColor(
                currentCost
              )}`}
            >
              <span className="text-white text-xs font-bold">
                {currentCost}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors duration-200">
              {champion.name}
            </h4>

            {/* Synergies avec images */}
            <div className="flex flex-wrap justify-center gap-1">
              {champion.traits?.slice(0, 3).map((trait, index) => {
                const synergyData = getSynergyData(trait);
                return (
                  <div
                    key={index}
                    className={`px-1 py-0.5 rounded-md bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 text-xs font-medium text-white shadow-sm flex items-center space-x-1`}
                  >
                    {synergyData.imageUrl ? (
                      <div className="relative">
                        {/* Hexagonal gold background */}
                        <div className="absolute inset-0 w-4 h-4 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-md transform rotate-45 -z-10"></div>
                        <img 
                          src={synergyData.imageUrl} 
                          alt={trait}
                          className="w-4 h-4 object-cover rounded relative z-10"
                        />
                      </div>
                    ) : (
                      <span className="text-xs">{synergyData.icon}</span>
                    )}
                    <span className="text-[10px]">{trait}</span>
                  </div>
                );
              })}
            </div>

            {/* Stats compactes avec badge */}
            <div className="flex items-center justify-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/60 text-slate-100 border border-slate-600">
                  {(champion.winRate || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Items recommandés */}
            {recommendedItems.length > 0 && (
              <div className="flex justify-center space-x-1 mt-2">
                {recommendedItems.map((item, index) => (
                  <div key={index} className="relative group/item">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-6 h-6 rounded border border-slate-600/50 transition-all duration-200 hover:scale-110 hover:border-yellow-400/60"
                      title={item.name}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-900/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mode compact (liste)
  return (
    <div
      onClick={() => onAddAsTag(champion.name)}
      className="group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border border-slate-600/20 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-blue-500/50 hover:bg-slate-600/30"
    >
      {/* Fond flouté pour la ligne */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-sm scale-100 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
        style={{ backgroundImage: `url(${champion.imageUrl})` }}
      ></div>

      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

      {/* Image du champion */}
      <div className="relative z-10 flex-shrink-0">
        <img
          src={champion.imageUrl}
          alt={champion.name}
          className="w-16 h-16 rounded-lg object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-blue-400/60"
        />
        <div
          className={`absolute -bottom-1 -right-1 rounded-full w-6 h-6 flex items-center justify-center shadow-lg bg-gradient-to-r ${getCostColor(
            currentCost
          )}`}
        >
          <span className="text-white text-xs font-bold">{currentCost}</span>
        </div>
      </div>

      <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Nom et badges */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors drop-shadow-sm">
              {champion.name}
            </h4>

            {/* Spacer */}
            <span className="w-2"></span>

            {champion.isMeta && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center space-x-1">
                <Flame className="w-2.5 h-2.5" />
                <span>META</span>
              </div>
            )}

            {/* Spacer supplémentaire */}
            <span className="w-2"></span>

            {/* Badge avgPlacement */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-600 text-[11px] font-semibold text-white shadow">
              {champion.avgPlacement?.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Synergies avec images */}
        <div className="space-y-0">
          <div className="text-xs text-slate-400 font-medium mb-1">Traits</div>
          <div className="flex flex-wrap gap-1">
            {champion.traits?.map((trait, index) => {
              const synergyData = getSynergyData(trait);
              return (
                <div
                  key={index}
                  className="px-2 py-0.5 rounded-md bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 text-xs font-medium text-white shadow-sm flex items-center space-x-1"
                >
                  {synergyData.imageUrl ? (
                    <div className="relative">
                      {/* Hexagonal gold background */}
                      <div className="absolute inset-0 w-4 h-4 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-md transform rotate-45 -z-10"></div>
                      <img 
                        src={synergyData.imageUrl} 
                        alt={trait}
                        className="w-4 h-4 object-cover rounded relative z-10"
                      />
                    </div>
                  ) : (
                    <span className="text-xs">{synergyData.icon}</span>
                  )}
                  <span>{trait}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items recommandés */}
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Items recommandés</div>
          <div className="flex justify-center space-x-1">
            {recommendedItems.map((item, index) => (
              <div key={index} className="relative group/item">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-8 h-8 rounded border-2 border-slate-600/50 bg-slate-800/50 transition-all duration-200 hover:scale-110 hover:border-yellow-400/60"
                  title={item.name}
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-900/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                  {item.name}
                </div>
              </div>
            ))}
            {recommendedItems.length === 0 && (
              <span className="text-xs text-slate-500">Aucun item recommandé</span>
            )}
          </div>
        </div>

        {/* Winrate amélioré */}
        <div className="text-center space-y-3">
          {/* Badge du pourcentage */}
          <div className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white bg-slate-700/80 border border-slate-600 shadow-sm">
            {(champion.winRate || 0).toFixed(1)}%
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                (champion.winRate || 0) >= 60
                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                  : (champion.winRate || 0) >= 50
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-500 to-red-400'
              }`}
              style={{ width: `${Math.min((champion.winRate || 0), 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Tier et Rôle */}
        <div className="text-center">
          <div className="flex flex-col items-center gap-2">
            {/* Tier badge */}
            <div className={`px-3 py-1 rounded-md text-sm font-bold ${
              champion.tier === 'S' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              champion.tier === 'A' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              champion.tier === 'B' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              Tier {champion.tier}
            </div>
            
            {/* Rôle (Carry/Core) */}
            {(champion.asCarry > 0 || champion.asCore > 0) && (
              <div className="flex items-center gap-2">
                {champion.asCarry > 0 && (
                  <div className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>Carry</span>
                  </div>
                )}
                {champion.asCore > 0 && (
                  <div className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium">
                    Core
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}