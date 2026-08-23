import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { TrustTierBadge } from './VerificationBadges';
import { formatDate } from '../../utils/dateUtils';
import { getEvidenceTypeKey, getReportTitle } from '../../utils/evidenceUtils';
import { useTranslation } from '../../hooks/useTranslation';
import './ReportCard.css';

export default function ReportCard({ report }) {
  const { t } = useTranslation();
  const evidenceKey = getEvidenceTypeKey(report);
  const title = getReportTitle(report);

  return (
    <Link to={`/reports/${report.id}`} className="report-card">
      <div className="report-card__content">
        <div className="report-card__header">
          <span className="report-card__id">{report.id}</span>
          <span className="report-card__date">{formatDate(report.submittedAt)}</span>
        </div>

        <p className="report-card__title">{title}</p>

        <div className="report-card__badges">
          {report.trustTier != null && (
            <TrustTierBadge tier={report.trustTier} showFullLabel />
          )}
          <StatusBadge status={report.status} />
        </div>

        {evidenceKey !== 'none' && (
          <p className="report-card__evidence">{t(`report.evidenceTypes.${evidenceKey}`)}</p>
        )}
      </div>
      <ChevronRight size={20} className="report-card__chevron" />
    </Link>
  );
}
