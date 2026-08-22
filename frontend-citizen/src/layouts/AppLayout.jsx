import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppShell } from '../hooks/useAppShell';
import AppShellProvider from '../context/AppShellProvider';
import NavDrawerHost from '../components/layout/NavDrawerHost';
import BottomNavigation from '../components/navigation/BottomNavigation';
import './AppLayout.css';

function AppLayoutContent() {
  const { isMenuOpen } = useAppShell();

  return (
    <div className="app-shell">
      <div
        className={[
          'app-container',
          'app-container--with-nav',
          isMenuOpen ? 'app-container--menu-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <NavDrawerHost />
        <Outlet />
        <BottomNavigation />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-container app-container--loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShellProvider>
      <AppLayoutContent />
    </AppShellProvider>
  );
}
