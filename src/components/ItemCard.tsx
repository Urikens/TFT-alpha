import React from 'react';
import { Package, Star, Sparkles, TrendingUp, BarChart3 } from 'lucide-react';
import { Item } from '../types';

interface ItemCardProps {
  item: Item;
  viewMode: 'grid' | 'compact';
  isSelected: boolean;
  onToggleSelect: (itemKey: string) => void;
  onAddAsTag: (itemName: string) => void;
}

export default function ItemCard({
  item,
  viewMode,
  isSelected,
  onToggleSelect,
  onAddAsTag,
}: ItemCardProps) {
  const getItemTypeColor = () => {
    if (item.isEmblem) return 'from-purple-500 to-indigo-600';
    if (item.isUnique) return 'from-yellow-500 to-orange-600';
    if (item.tier === 1) return 'from-green-500 to-emerald-600';
    if (item.tier === 2) return 'from-blue-500 to-cyan-600';
    if (item.tier === 3) return 'from-purple-500 to-violet-600';
    if (item.tier === 4) return 'from-orange-500 to-amber-600';
    if (item.tier === 5) return 'from-red-500 to-rose-600';
    return 'from-gray-500 to-slate-600';
  };

  const getItemTypeBadge = () => {
    if (item.isEmblem) return { text: 'EMBLÈME', icon: Sparkles };
    if (item.isUnique) return { text: 'UNIQUE', icon: Star };
    if (item.itemType === 'ornn') return { text: 'ORNN', icon: Star };
    return { text: `TIER ${item.tier}`, icon: Star };
  };

  const getPlacementColor = () => {
    if (item.avgPlacement <= 3.5) return 'text-green-400';
    if (item.avgPlacement <= 4.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onAddAsTag(item.name)}
        className={`group relative overflow-hidden rounded-xl border-2 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
          isSelected
            ? 'border-blue-500 shadow-lg shadow-blue-500/30'
            : 'border-slate-600/20 hover:border-blue-500/50'
        }`}
      >
        {/* Badge type */}
        {getItemTypeBadge() && (
          <div className={`absolute top-2 left-2 z-20 bg-gradient-to-r ${getItemTypeColor()} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center space-x-1`}>
            {React.createElement(getItemTypeBadge().icon, { className: 'w-3 h-3' })}
            <span>{getItemTypeBadge().text}</span>
          </div>
        )}

        {/* Badge stats */}
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm">
          {item.avgPlacement.toFixed(1)}
        </div>

        {/* Image floutée en fond au hover */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-15 blur-sm scale-110 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
          style={{ backgroundImage: `url(${item.imageUrl})` }}
        ></div>

        {/* Contenu */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors duration-200">
              {item.name}
            </h4>
            
            {item.shortDesc && (
              <p className="text-slate-400 text-xs leading-relaxed">
                {item.shortDesc}
              </p>
            )}

            {/* Stats */}
            <div className="flex justify-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-slate-300">{(item.pickRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-3 h-3 text-green-400" />
                <span className={`${getPlacementColor()}`}>{item.avgPlacement.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode compact (liste)
  return (
    <div
      onClick={() => onAddAsTag(item.name)}
      className={`group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border-2 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:bg-slate-600/30 ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/30'
          : 'border-slate-600/20 hover:border-blue-500/50'
      }`}
    >
      {/* Fond flouté pour la ligne */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-sm scale-100 transition-all duration-500 group-hover:opacity-40 group-hover:blur-md"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      ></div>

      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

      {/* Image de l'item */}
      <div className="relative z-10 flex-shrink-0">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-16 h-16 rounded-lg object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-blue-400/60"
        />
      </div>

      <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Nom et badges */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors drop-shadow-sm">
              {item.name}
            </h4>

            {getItemTypeBadge() && (
              <div className={`bg-gradient-to-r ${getItemTypeColor()} text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center space-x-1`}>
                {React.createElement(getItemTypeBadge().icon, { className: 'w-2.5 h-2.5' })}
                <span>{getItemTypeBadge().text}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm capitalize">{item.itemType}</span>
            {item.craftable && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Craftable</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 col-span-2">
          {item.desc && (
            <p className="text-slate-300 text-sm drop-shadow-sm">
              {item.desc}
            </p>
          )}
          {item.shortDesc && (
            <p className="text-slate-400 text-xs">
              {item.shortDesc}
            </p>
          )}
        </div>

        {/* Pick Rate */}
        <div className="text-center">
          <div className="text-sm font-medium text-white drop-shadow-sm">
            {(item.pickRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Pick Rate</div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min((item.pickRate * 100) * 3, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Placement moyen */}
        <div className="text-center">
          <div className={`text-sm font-medium ${getPlacementColor()} drop-shadow-sm`}>
            {item.avgPlacement.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400">Avg Placement</div>
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
            item.avgPlacement <= 3.5
              ? 'bg-green-500/20 text-green-400'
              : item.avgPlacement <= 4.2
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {item.avgPlacement <= 3.5 ? '↗' : 
             item.avgPlacement <= 4.2 ? '→' : '↘'}
          </div>
        </div>
      </div>
    </div>
  );
}