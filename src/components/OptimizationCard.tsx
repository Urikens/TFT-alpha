import React from 'react';
import { Target, TrendingUp, Users, Zap, Star } from 'lucide-react';

interface Optimization {
  id: string;
  name: string;
  type: 'positioning' | 'economy' | 'itemization' | 'transition';
  description: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  impact: 'Faible' | 'Moyen' | 'Élevé';
  gamePhase: 'Early' | 'Mid' | 'Late' | 'All';
  tips: string[];
}

interface OptimizationCardProps {
  optimization: Optimization;
  viewMode: 'grid' | 'compact';
  isSelected: boolean;
  onToggleSelect: (optimizationId: string) => void;
  onAddAsTag: (optimizationName: string) => void;
}

export default function OptimizationCard({
  optimization,
  viewMode,
  isSelected,
  onToggleSelect,
  onAddAsTag,
}: OptimizationCardProps) {
  const getTypeIcon = () => {
    switch (optimization.type) {
      case 'positioning': return Target;
      case 'economy': return TrendingUp;
      case 'itemization': return Star;
      case 'transition': return Zap;
      default: return Target;
    }
  };

  const getTypeColor = () => {
    switch (optimization.type) {
      case 'positioning': return 'from-blue-500 to-cyan-600';
      case 'economy': return 'from-green-500 to-emerald-600';
      case 'itemization': return 'from-yellow-500 to-orange-600';
      case 'transition': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile': return 'text-green-400';
      case 'Moyen': return 'text-yellow-400';
      case 'Difficile': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Faible': return 'text-gray-400';
      case 'Moyen': return 'text-blue-400';
      case 'Élevé': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const TypeIcon = getTypeIcon();

  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onAddAsTag(optimization.name)}
        className={`group relative overflow-hidden rounded-xl border-2 backdrop-blur bg-slate-700/40 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
          isSelected
            ? 'border-orange-500 shadow-lg shadow-orange-500/30'
            : 'border-slate-600/20 hover:border-orange-500/50'
        }`}
      >
        {/* Badge type */}
        <div className={`absolute top-2 left-2 z-20 bg-gradient-to-r ${getTypeColor()} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center space-x-1`}>
          <TypeIcon className="w-3 h-3" />
          <span>{optimization.type.toUpperCase()}</span>
        </div>

        {/* Badge phase */}
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600 text-[10px] font-bold text-white shadow-sm">
          {optimization.gamePhase}
        </div>

        {/* Contenu */}
        <div className="relative z-10 flex flex-col items-center space-y-3 mt-8">
          <div className="relative">
            <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${getTypeColor()} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
              <TypeIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-white font-semibold text-sm group-hover:text-orange-300 transition-colors duration-200">
              {optimization.name}
            </h4>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              {optimization.description.substring(0, 80)}...
            </p>

            <div className="flex items-center justify-center space-x-2 text-xs">
              <span className={getDifficultyColor(optimization.difficulty)}>
                {optimization.difficulty}
              </span>
              <span className="text-slate-500">•</span>
              <span className={getImpactColor(optimization.impact)}>
                {optimization.impact}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode compact (liste)
  return (
    <div
      onClick={() => onAddAsTag(optimization.name)}
      className={`group relative overflow-hidden flex items-center space-x-4 p-4 bg-slate-700/20 backdrop-blur rounded-lg border-2 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:bg-slate-600/30 ${
        isSelected
          ? 'border-orange-500 shadow-lg shadow-orange-500/30'
          : 'border-slate-600/20 hover:border-orange-500/50'
      }`}
    >
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/50 group-hover:from-slate-900/80 group-hover:via-slate-800/50 group-hover:to-slate-900/30 transition-all duration-500"></div>

      {/* Icône de l'optimisation */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${getTypeColor()} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-slate-600/50 group-hover:border-orange-400/60`}>
          <TypeIcon className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="flex-1 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Nom et type */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-white font-semibold text-base group-hover:text-orange-300 transition-colors drop-shadow-sm">
              {optimization.name}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <TypeIcon className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400 text-sm capitalize">{optimization.type}</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <p className="text-slate-300 text-sm drop-shadow-sm">
            {optimization.description}
          </p>
        </div>

        {/* Difficulté et Impact */}
        <div className="text-center space-y-2">
          <div>
            <div className={`text-sm font-medium ${getDifficultyColor(optimization.difficulty)} drop-shadow-sm`}>
              {optimization.difficulty}
            </div>
            <div className="text-xs text-slate-400">Difficulté</div>
          </div>
        </div>

        {/* Phase et Impact */}
        <div className="text-center space-y-2">
          <div>
            <div className={`text-sm font-medium ${getImpactColor(optimization.impact)} drop-shadow-sm`}>
              {optimization.impact}
            </div>
            <div className="text-xs text-slate-400">Impact</div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
            {optimization.gamePhase}
          </div>
        </div>
      </div>
    </div>
  );
}