import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Plus, User } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" aria-label={t('common.mainNavigation')}>
      <div className="bottom-nav__bar">
        <div className="bottom-nav__side bottom-nav__side--start">
          <NavLink
            to="/"
            className={`bottom-nav__item ${location.pathname === '/' ? 'bottom-nav__item--active' : ''}`}
            end
          >
            <Home size={22} strokeWidth={2} />
            <span className="bottom-nav__label">{t('nav.home')}</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={`bottom-nav__item ${isActive('/reports') ? 'bottom-nav__item--active' : ''}`}
          >
            <FileText size={22} strokeWidth={2} />
            <span className="bottom-nav__label">{t('nav.reports')}</span>
          </NavLink>
        </div>

        <div className="bottom-nav__side bottom-nav__side--end">
          <NavLink
            to="/profile"
            className={`bottom-nav__item ${isActive('/profile') ? 'bottom-nav__item--active' : ''}`}
          >
            <User size={22} strokeWidth={2} />
            <span className="bottom-nav__label">{t('nav.profile')}</span>
          </NavLink>
        </div>
      </div>

      <NavLink
        to="/report"
        className={`bottom-nav__fab ${isActive('/report') ? 'bottom-nav__fab--active' : ''}`}
        aria-label={t('nav.reportIncident')}
      >
        <Plus size={26} strokeWidth={2.5} />
      </NavLink>
    </nav>
  );
}
