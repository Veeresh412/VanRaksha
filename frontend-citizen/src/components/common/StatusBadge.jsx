import { useTranslation } from '../../hooks/useTranslation';
import './StatusBadge.css';

const STATUS_KEYS = {
  submitted: 'status.submitted',
  processing: 'status.processing',
  under_review: 'status.underReview',
  resolved: 'status.resolved',
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const config = STATUS_KEYS[status] || STATUS_KEYS.submitted;
  const className = `status-badge status-badge--${status === 'under_review' ? 'review' : status || 'submitted'}`;

  return <span className={className}>{t(config)}</span>;
}

export function StatusBanner({ status }) {
  const { t } = useTranslation();
  const config = STATUS_KEYS[status] || STATUS_KEYS.submitted;
  const className = `status-banner status-banner--${status === 'under_review' ? 'review' : status || 'submitted'}`;

  return <div className={className}>{t(config)}</div>;
}
