import React from 'react';
import { BarChart3, X, CheckCircle, Clock, Zap } from 'lucide-react';

interface AnalysisStep {
  name: string;
  duration: number;
  completed: boolean;
  current: boolean;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: AnalysisStep[];
  currentStep: number;
  progress: number;
  onComplete: () => void;
}

export default function AnalysisModal({ 
  isOpen, 
  onClose, 
  steps, 
  currentStep, 
  progress,
  onComplete 
}: AnalysisModalProps) {
  if (!isOpen) return null;

  const isCompleted = currentStep >= steps.length;

  // Auto-fermeture et affichage des résultats quand l'analyse est terminée
  React.useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000); // Délai de 1 seconde pour voir l'animation de completion
      
      return () => clearTimeout(timer);
    }
  }, [isCompleted, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Analyse TFT</h3>
              <p className="text-sm text-slate-400">
                {isCompleted ? 'Analyse terminée !' : 'Traitement des données...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300 font-medium">Progression</span>
            <span className="text-sm text-blue-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-out ${
                isCompleted 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                step.completed
                  ? 'bg-green-500/10 border border-green-500/20'
                  : step.current
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-slate-700/30 border border-slate-600/20'
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : step.current ? (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Clock className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  step.completed ? 'text-green-300' : step.current ? 'text-blue-300' : 'text-slate-400'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-slate-500">{step.duration}ms</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message de completion */}
        {isCompleted && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Compositions trouvées !</span>
            </div>
            <p className="text-slate-400 text-sm">
              Redirection automatique vers les résultats...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}