import { useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth';
import SavedRoutes from './pages/SavedRoutes';
import FindRoute from './pages/FindRoute';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'auth' | 'saved' | 'find-route' | 'profile'>('home');

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
      case 'find-route':
        return <FindRoute />;
      case 'profile':
        return <div className="p-8 text-center">Profile page coming soon...</div>;
      default:
        return <Home />;
    }
  };

  return (
    <div className="relative flex w-full h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full flex-col w-full">
        <Header currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex flex-1 w-full min-h-0">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
