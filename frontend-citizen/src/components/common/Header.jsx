import { Menu, Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppShell } from '../../hooks/useAppShell';
import './Header.css';

export default function Header({
  title,
  showBack = false,
  showMenu = false,
  showNotification = false,
  variant = 'default',
  onBack,
}) {
  const navigate = useNavigate();
  const { isMenuOpen, toggleMenu, openNotifications, unreadCount } = useAppShell();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`header ${variant === 'green' ? 'header--green' : ''}`}>
      <div className="header__left">
        {showBack && (
          <button className="header__btn" onClick={handleBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
        )}
        {showMenu && !isMenuOpen && (
          <button
            type="button"
            className="header__btn"
            onClick={toggleMenu}
            aria-label="Open menu"
            aria-expanded={false}
          >
            <Menu size={22} />
          </button>
        )}
        {showMenu && isMenuOpen && (
          <span className="header__btn header__btn--placeholder" aria-hidden="true" />
        )}
      </div>

      {title && (
        <div className="header__center">
          <h1 className="header__title">{title}</h1>
        </div>
      )}

      <div className="header__right">
        {showNotification && (
          <button
            className="header__btn header__notification"
            onClick={openNotifications}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
          >
            <Bell size={22} />
            {unreadCount > 0 && <span className="header__badge" />}
          </button>
        )}
      </div>
    </header>
  );
}
