import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, User } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { TrustTierBadge } from './VerificationBadges';
import { formatDate } from '../../utils/dateUtils';
import { getEvidenceTypeKey, getReportTitle } from '../../utils/evidenceUtils';
import {
  formatAuthenticityScore,
  formatLocationShort,
  getReporterDisplayName,
} from '../../utils/reportDisplay';
import { useTranslation } from '../../hooks/useTranslation';
import './ReportCard.css';

export default function ReportCard({ report }) {
  const { t } = useTranslation();
  const evidenceKey = getEvidenceTypeKey(report);
  const title = getReportTitle(report);
  const reporterName = getReporterDisplayName(report);
  const locationLabel = formatLocationShort(report);
  const authenticityScore = formatAuthenticityScore(report);

  return (
    <Link to={`/reports/${report.id}`} className="report-card">
      <div className="report-card__content">
        <div className="report-card__header">
          <span className="report-card__id">{report.id}</span>
          <span className="report-card__date">{formatDate(report.submittedAt)}</span>
        </div>

        <p className="report-card__title">{title}</p>

        {report.description && report.description !== title && (
          <p className="report-card__description">{report.description}</p>
        )}

        <div className="report-card__badges">
          {report.trustTier != null && (
            <TrustTierBadge tier={report.trustTier} showFullLabel />
          )}
          <StatusBadge status={report.status} />
        </div>

        <div className="report-card__meta-row">
          {reporterName && (
            <span className="report-card__meta-item">
              <User size={13} aria-hidden="true" />
              <span>{reporterName}</span>
            </span>
          )}
          {locationLabel && (
            <span className="report-card__meta-item">
              <MapPin size={13} aria-hidden="true" />
              <span>{locationLabel}</span>
            </span>
          )}
          {authenticityScore != null && (
            <span className="report-card__meta-item report-card__meta-item--score">
              {t('report.authenticityScore')}: {authenticityScore}
            </span>
          )}
        </div>

        {evidenceKey !== 'none' && (
          <p className="report-card__evidence">{t(`report.evidenceTypes.${evidenceKey}`)}</p>
        )}
      </div>
      <ChevronRight size={20} className="report-card__chevron" />
    </Link>
  );
}
