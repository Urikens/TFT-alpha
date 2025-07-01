import React from 'react';
import { BarChart3, Sparkles } from 'lucide-react';

interface AnalyzeButtonProps {
  onClick: () => void;
  disabled: boolean;
  isAnalyzing: boolean;
}

export default function AnalyzeButton({ onClick, disabled, isAnalyzing }: AnalyzeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isAnalyzing}
      className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 font-semibold ${
        disabled || isAnalyzing
          ? 'bg-slate-700/50 text-slate-500 border-slate-600/30 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500/50 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-lg hover:shadow-xl'
      }`}
    >
      {isAnalyzing ? (
        <>
          <div className="relative">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <span>Analyse en cours...</span>
        </>
      ) : (
        <>
          <BarChart3 className="w-5 h-5" />
          <span>Analyser</span>
          <Sparkles className="w-4 h-4 opacity-70" />
        </>
      )}
    </button>
  );
}