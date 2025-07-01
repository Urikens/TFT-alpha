import React, { useState } from 'react';
import Layout from './components/Layout';
import EnhancedChampionsPage from './pages/EnhancedChampionsPage';
import ChampionsDataPage from './pages/ChampionsDataPage';
import CompositionsPage from './pages/CompositionsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'champions' | 'compositions'>('home');

  const handleNavigation = (page: string) => {
    if (page === 'home' || page === 'Accueil') {
      setCurrentPage('home');
    } else if (page === 'champions' || page === 'Champions') {
      setCurrentPage('champions');
    } else if (page === 'compositions' || page === 'Compositions') {
      setCurrentPage('compositions');
    }
    // Pour les autres pages, on peut ajouter console.log pour le moment
    console.log('Navigation vers:', page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return 'Accueil';
      case 'champions': return 'Champions';
      case 'compositions': return 'Compositions';
      default: return 'Accueil';
    }
  };

  return (
    <Layout 
      currentPage={getPageTitle()}
      onNavigate={handleNavigation}
    >
      {currentPage === 'home' ? (
        <EnhancedChampionsPage />
      ) : currentPage === 'champions' ? (
        <ChampionsDataPage />
      ) : currentPage === 'compositions' ? (
        <CompositionsPage />
      ) : (
        <EnhancedChampionsPage />
      )}
    </Layout>
  );
}