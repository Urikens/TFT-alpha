import React from 'react';
import { Sparkles, Star, Zap } from 'lucide-react';
import { Synergy } from '../types';

interface SynergyCardProps {
  synergy: Synergy;
  viewMode: 'grid' | 'compact';
  isSelected: boolean;
  onToggleSelect: (synergyName: string) => void;
  onAddAsTag: (synergyName: string) => void;
  championCount?: number;
}

export default function SynergyCard({
  synergy,
  viewMode,
  isSelected,
  onToggleSelect,
  onAddAsTag,
  championCount = 0,
}: SynergyCardProps) {
  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onAddAsTag(synergy.name)}
        className={`group relative overflow-hidden rounded-xl border-2 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
          isSelected
            ? 'border-purple-500 shadow-lg shadow-purple-500/30'
            : 'border-slate-600/20 hover:border-purple-500/50'
        }`}
      >
        {/* Badge nombre de champions */}
        {championCount > 0 && (
          <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm">
            {championCount}
          </div>
        )}

        {/* Image floutée en fond au hover */}
        {synergy.imageUrl && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-15 blur-sm scale-110 transition-all duration-500 group-hover:opacity-60 group-hover:blur-md"
            style={{ backgroundImage: `url(${synergy.imageUrl})` }}
          ></div>
        )}

        {/* Contenu */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            {synergy.imageUrl ? (
              <div className="relative">
                {/* Hexagonal gold background */}
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-xl transform rotate-45 -z-10"></div>
                <img
                  src={synergy.imageUrl}
                  alt={synergy.name}
                  className="w-16 h-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110 relative z-10"
                />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${synergy.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-2xl">{synergy.icon}</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors duration-200">
              {synergy.name}
            </h4>
            
            {championCount > 0 && (
              <div className="flex items-center justify-center space-x-1 text-xs text-slate-400">
                <Star className="w-3 h-3" />
                <span>{championCount} champions</span>
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
      onClick={() => onAddAsTag(synergy.name)}
      className={`group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border-2 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:bg-slate-600/30 ${
        isSelected
          ? 'border-purple-500 shadow-lg shadow-purple-500/30'
          : 'border-slate-600/20 hover:border-purple-500/50'
      }`}
    >
      {/* Fond flouté pour la ligne */}
      {synergy.imageUrl && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-sm scale-100 transition-all duration-500 group-hover:opacity-40 group-hover:blur-md"
          style={{ backgroundImage: `url(${synergy.imageUrl})` }}
        ></div>
      )}

      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

      {/* Image/Icône de la synergie */}
      <div className="relative z-10 flex-shrink-0">
        {synergy.imageUrl ? (
          <div className="relative">
            {/* Hexagonal gold background */}
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-xl transform rotate-45 -z-10"></div>
            <img
              src={synergy.imageUrl}
              alt={synergy.name}
              className="w-16 h-16 rounded-lg object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-purple-400/60 relative z-10"
            />
          </div>
        ) : (
          <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${synergy.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-purple-400/60`}>
            <span className="text-2xl">{synergy.icon}</span>
          </div>
        )}
      </div>

      <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Nom et type */}
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-base group-hover:text-purple-300 transition-colors drop-shadow-sm">
            {synergy.name}
          </h4>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400 text-sm">Synergie</span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="text-center">
          {championCount > 0 && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-white drop-shadow-sm">
                {championCount}
              </div>
              <div className="text-xs text-slate-400">Champions</div>
            </div>
          )}
        </div>

        {/* Couleur dominante */}
        <div className="text-center">
          <div className={`inline-block w-8 h-8 rounded-full bg-gradient-to-r ${synergy.color} border-2 border-slate-600 shadow-lg`}></div>
          <div className="text-xs text-slate-400 mt-1">Couleur</div>
        </div>
      </div>
    </div>
  );
}