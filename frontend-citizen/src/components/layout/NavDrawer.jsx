import { NavLink } from 'react-router-dom';
import { X, Home, FileText, Info, ClipboardList, Shield, LifeBuoy, LogOut, Globe } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './NavDrawer.css';

const INFO_LINKS = [
  { slug: 'about', labelKey: 'nav.about', icon: Info },
  { slug: 'reporting', labelKey: 'nav.howReporting', icon: ClipboardList },
  { slug: 'privacy', labelKey: 'nav.privacy', icon: Shield },
  { slug: 'help', labelKey: 'nav.help', icon: LifeBuoy },
];

export default function NavDrawer({ open, onClose, onOpenInfo, onLogout }) {
  const { t, locale, setLocale, languages } = useTranslation();

  if (!open) return null;

  return (
    <div className="nav-drawer" role="presentation">
      <button
        type="button"
        className="nav-drawer__backdrop"
        onClick={onClose}
        aria-label={t('common.closeMenu')}
      />

      <aside className="nav-drawer__panel" aria-label="Navigation menu">
        <div className="nav-drawer__header">
          <div>
            <p className="nav-drawer__brand">{t('brand.name')}</p>
            <p className="nav-drawer__subtitle">{t('brand.tagline')}</p>
          </div>
          <button
            type="button"
            className="nav-drawer__close"
            onClick={onClose}
            aria-label={t('common.closeMenu')}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="nav-drawer__nav">
          <NavLink to="/" className="nav-drawer__link" onClick={onClose} end>
            <Home size={20} />
            {t('nav.home')}
          </NavLink>

          <NavLink to="/reports" className="nav-drawer__link" onClick={onClose}>
            <FileText size={20} />
            {t('nav.myReports')}
          </NavLink>

          <div className="nav-drawer__divider" />

          {INFO_LINKS.map(({ slug, labelKey, icon: Icon }) => (
            <button
              key={slug}
              type="button"
              className="nav-drawer__link nav-drawer__link--button"
              onClick={() => onOpenInfo(slug)}
            >
              <Icon size={20} />
              {t(labelKey)}
            </button>
          ))}

          <div className="nav-drawer__divider" />

          <div className="nav-drawer__language">
            <div className="nav-drawer__language-header">
              <Globe size={20} />
              <span>{t('languages.title')}</span>
            </div>
            <div className="nav-drawer__language-options">
              {languages.map(({ code, labelKey }) => (
                <button
                  key={code}
                  type="button"
                  className={`nav-drawer__language-option ${
                    locale === code ? 'nav-drawer__language-option--active' : ''
                  }`}
                  onClick={() => setLocale(code)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="nav-drawer__divider" />

          <button
            type="button"
            className="nav-drawer__link nav-drawer__link--button nav-drawer__link--logout"
            onClick={onLogout}
          >
            <LogOut size={20} />
            {t('common.logout')}
          </button>
        </nav>
      </aside>
    </div>
  );
}
