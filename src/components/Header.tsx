import React from 'react';
import { Zap, Clock, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  patchInfo?: {
    version: string;
    set: string;
    lastUpdate: string;
  };
}

export default function Header({ 
  currentPage = 'Accueil', 
  onNavigate, 
  patchInfo = {
    version: '14.1',
    set: 'Set 10',
    lastUpdate: '2024-01-15 14:30'
  }
}: HeaderProps) {
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      console.log('Navigation vers:', page);
    }
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = formatLastUpdate(patchInfo.lastUpdate);

  return (
    <>
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TFT Assistant</h1>
              <p className="text-sm text-slate-400">Patch {patchInfo.version} • {patchInfo.set}</p>
            </div>
          </div>

          {/* Widgets d'informations */}
          <div className="flex items-center space-x-3">
            {/* Widget Patch */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 py-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="text-xs">
                <span className="text-slate-400">Patch</span>
                <span className="text-white font-medium ml-1">{patchInfo.version}</span>
              </div>
            </div>

            {/* Widget Version */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 py-2 flex items-center space-x-2">
              <Zap className="w-3 h-3 text-purple-400" />
              <div className="text-xs">
                <span className="text-slate-400">Version</span>
                <span className="text-white font-medium ml-1">{patchInfo.set}</span>
              </div>
            </div>

            {/* Widget Dernière mise à jour */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 py-2 flex items-center space-x-2">
              <Clock className="w-3 h-3 text-green-400" />
              <div className="text-xs">
                <div className="text-slate-400"></div>
                <div className="text-white font-medium">{date} {time}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/70 backdrop-blur border-b border-slate-700/50 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-8 text-sm font-medium text-slate-300">
            {[
              { name: 'Accueil', key: 'home' },
              { name: 'Champions', key: 'champions' },
              { name: 'Compositions', key: 'compositions' },
            ].map((page) => (
              <button
                key={page.key}
                onClick={() => handleNavigation(page.key)}
                className={`hover:text-white transition-colors relative ${
                  currentPage === page.name ? 'text-blue-400' : ''
                }`}
              >
                {page.name}
                {currentPage === page.name && (
                  <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}