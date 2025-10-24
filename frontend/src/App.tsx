import { useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth';
import SavedRoutes from './pages/SavedRoutes';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'auth' | 'saved' | 'explore' | 'profile'>('saved');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'about':
        return <About />;
      case 'auth':
        return <Auth />;
      case 'saved':
        return <SavedRoutes />;
      case 'explore':
        return <div className="p-8 text-center">Explore page coming soon...</div>;
      case 'profile':
        return <div className="p-8 text-center">Profile page coming soon...</div>;
      default:
        return <SavedRoutes />;
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <Header currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex flex-1 justify-center py-8 px-4 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
