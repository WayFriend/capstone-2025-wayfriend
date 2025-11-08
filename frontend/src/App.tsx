import { useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth';
import SavedRoutes from './pages/SavedRoutes';
import FindRoute from './pages/FindRoute';
import { AuthProvider } from './contexts/AuthContext';
import './styles/App.css';

// 저장된 경로 정보 타입
interface SavedRouteForNavigation {
  start: string;
  end: string;
  startLocation?: { lat: number; lng: number; name: string };
  endLocation?: { lat: number; lng: number; name: string };
  mode?: 'walking' | 'wheelchair';
  filter?: 'safest' | 'no-stairs' | 'recommended';
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'auth' | 'saved' | 'find-route' | 'profile'>('home');
  const [savedRouteForNavigation, setSavedRouteForNavigation] = useState<SavedRouteForNavigation | null>(null);

  const handleNavigateToRoute = (route: SavedRouteForNavigation) => {
    setSavedRouteForNavigation(route);
    setCurrentPage('find-route');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'about':
        return <About />;
      case 'auth':
        return <Auth />;
      case 'saved':
        return <SavedRoutes onNavigateToRoute={handleNavigateToRoute} />;
      case 'find-route':
        return <FindRoute savedRoute={savedRouteForNavigation} onRouteLoaded={() => setSavedRouteForNavigation(null)} />;
      case 'profile':
        return <div className="p-8 text-center">Profile page coming soon...</div>;
      default:
        return <Home />;
    }
  };

  return (
    <AuthProvider>
      <div className="relative flex w-full h-screen flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full flex-col w-full">
          <Header currentPage={currentPage} onPageChange={setCurrentPage} />
          <main className="flex flex-1 w-full min-h-0">
            {renderPage()}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
