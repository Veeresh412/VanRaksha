import { useTranslation } from '../../hooks/useTranslation';
import './StatusBadge.css';

const STATUS_KEYS = {
  pending: 'status.pending',
  submitted: 'status.submitted',
  processing: 'status.processing',
  under_review: 'status.underReview',
  verified: 'status.verified',
  rejected: 'status.rejected',
  resolved: 'status.resolved',
};

function getStatusClassName(status) {
  if (status === 'under_review') return 'review';
  return status || 'submitted';
}

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const config = STATUS_KEYS[status] || STATUS_KEYS.submitted;
  const className = `status-badge status-badge--${getStatusClassName(status)}`;

  return <span className={className}>{t(config)}</span>;
}

export function StatusBanner({ status }) {
  const { t } = useTranslation();
  const config = STATUS_KEYS[status] || STATUS_KEYS.submitted;
  const className = `status-banner status-banner--${getStatusClassName(status)}`;

  return <div className={className}>{t(config)}</div>;
}
