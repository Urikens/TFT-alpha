import React from 'react';
import { Github, Twitter, Disc as Discord, Heart, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900/80 backdrop-blur-lg border-t border-slate-700/50 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">TFT Assistant</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              L'outil ultime pour dominer Teamfight Tactics. Analysez, optimisez et gagnez avec les meilleures compositions.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Navigation</h4>
            <ul className="space-y-2">
              {['Champions', 'Compositions', 'Objets', 'Synergies', 'Guides'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Ressources</h4>
            <ul className="space-y-2">
              {['Patch Notes', 'Méta Report', 'Statistiques', 'API', 'Support'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Communauté */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Communauté</h4>
            <div className="flex space-x-3">
              <a href="#" className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors">
                <Discord className="w-4 h-4 text-slate-400 hover:text-blue-400" />
              </a>
              <a href="#" className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors">
                <Twitter className="w-4 h-4 text-slate-400 hover:text-blue-400" />
              </a>
              <a href="#" className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors">
                <Github className="w-4 h-4 text-slate-400 hover:text-blue-400" />
              </a>
            </div>
            <p className="text-slate-500 text-xs">
              Rejoignez notre communauté de plus de 50k joueurs
            </p>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-slate-700/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © 2025 TFT Assistant. Fait avec <Heart className="w-4 h-4 inline text-red-500" /> pour la communauté TFT.
          </p>
          <p className="text-slate-500 text-sm mt-2 md:mt-0">
            Patch 14.1 • Set 10 • Données mises à jour il y a 2 minutes
          </p>
        </div>
      </div>
    </footer>
  );
}