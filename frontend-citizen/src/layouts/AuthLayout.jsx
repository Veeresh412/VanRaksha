import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLanguagePicker from '../components/layout/AuthLanguagePicker';

export default function AuthLayout() {
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

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell">
      <div className="app-container app-container--auth">
        <Outlet />
        <AuthLanguagePicker />
      </div>
    </div>
  );
}
