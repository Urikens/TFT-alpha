import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  showFooter?: boolean;
  onNavigate?: (page: string) => void;
}

export default function Layout({ children, currentPage, showFooter = true, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header currentPage={currentPage} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}