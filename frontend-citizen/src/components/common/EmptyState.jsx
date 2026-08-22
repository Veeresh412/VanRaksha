import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={48} strokeWidth={1.25} />
        </div>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {message && <p className="empty-state__message">{message}</p>}
    </div>
  );
}
