import React from 'react';
import { Package, Star, Sparkles } from 'lucide-react';
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
    if (item.isNew) return 'from-green-500 to-emerald-600';
    return 'from-blue-500 to-cyan-600';
  };

  const getItemTypeBadge = () => {
    if (item.isEmblem) return { text: 'EMBLÈME', icon: Sparkles };
    if (item.isUnique) return { text: 'UNIQUE', icon: Star };
    if (item.isNew) return { text: 'NOUVEAU', icon: Package };
    return null;
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
            {React.createElement(getItemTypeBadge()!.icon, { className: 'w-3 h-3' })}
            <span>{getItemTypeBadge()!.text}</span>
          </div>
        )}

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

      <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Nom et badges */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors drop-shadow-sm">
              {item.name}
            </h4>

            {getItemTypeBadge() && (
              <div className={`bg-gradient-to-r ${getItemTypeColor()} text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center space-x-1`}>
                {React.createElement(getItemTypeBadge()!.icon, { className: 'w-2.5 h-2.5' })}
                <span>{getItemTypeBadge()!.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description courte */}
        <div className="space-y-1">
          {item.shortDesc && (
            <p className="text-slate-300 text-sm drop-shadow-sm">
              {item.shortDesc}
            </p>
          )}
        </div>

        {/* Stats/Compositions */}
        <div className="text-center">
          {item.compositions && item.compositions.length > 0 && (
            <div className="text-xs text-slate-400">
              Composé de: {item.compositions.length} éléments
            </div>
          )}
          {item.affectedTraitKey && (
            <div className="text-xs text-purple-400 font-medium">
              Trait: {item.affectedTraitKey}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}