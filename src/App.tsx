import React, { useState } from 'react';
import Layout from './components/Layout';
import EnhancedChampionsPage from './pages/EnhancedChampionsPage';
import ChampionsDataPage from './pages/ChampionsDataPage';
import CompositionsPage from './pages/CompositionsPage';
import ItemsDataPage from './pages/ItemsDataPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'champions' | 'compositions' | 'items'>('home');

  const handleNavigation = (page: string) => {
    if (page === 'home' || page === 'Accueil') {
      setCurrentPage('home');
    } else if (page === 'champions' || page === 'Champions') {
      setCurrentPage('champions');
    } else if (page === 'compositions' || page === 'Compositions') {
      setCurrentPage('compositions');
    } else if (page === 'items' || page === 'Items') {
      setCurrentPage('items');
    }
    // Pour les autres pages, on peut ajouter console.log pour le moment
    console.log('Navigation vers:', page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return 'Accueil';
      case 'champions': return 'Champions';
      case 'compositions': return 'Compositions';
      case 'items': return 'Items';
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
      ) : currentPage === 'items' ? (
        <ItemsDataPage />
      ) : (
        <EnhancedChampionsPage />
      )}
    </Layout>
  );
}