import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { useTranslation } from '../../hooks/useTranslation';
import './NotificationPanel.css';

export default function NotificationPanel({
  open,
  onClose,
  notifications,
  onNotificationClick,
  onMarkAllRead,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  const hasUnread = notifications.some((item) => !item.read);

  return (
    <div className="notification-panel" role="presentation">
      <button
        type="button"
        className="notification-panel__backdrop"
        onClick={onClose}
        aria-label={t('notifications.close')}
      />

      <div className="notification-panel__dropdown" role="dialog" aria-label={t('notifications.title')}>
        <div className="notification-panel__header">
          <h2 className="notification-panel__title">{t('notifications.title')}</h2>
          {hasUnread && (
            <button
              type="button"
              className="notification-panel__mark-read"
              onClick={onMarkAllRead}
            >
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>

        <div className="notification-panel__list">
          {notifications.length === 0 ? (
            <p className="notification-panel__empty">{t('notifications.empty')}</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`notification-panel__item ${
                  !notification.read ? 'notification-panel__item--unread' : ''
                }`}
                onClick={() => onNotificationClick(notification)}
              >
                <div className="notification-panel__item-top">
                  <span className="notification-panel__item-title">
                    {t(notification.titleKey)} — {notification.reportId}
                  </span>
                  {!notification.read && <span className="notification-panel__dot" />}
                </div>
                <p className="notification-panel__item-message">{t(notification.messageKey)}</p>
                <div className="notification-panel__item-meta">
                  {notification.status && <StatusBadge status={notification.status} />}
                  <span className="notification-panel__item-time">
                    {formatDateTime(notification.createdAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
