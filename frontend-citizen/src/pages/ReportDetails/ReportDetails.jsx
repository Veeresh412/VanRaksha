import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Map, Play } from 'lucide-react';
import { getReportById } from '../../services/reportService';
import { getReportTrustResult } from '../../services/trustService';
import { formatDateTime } from '../../utils/dateUtils';
import { getTrustTierDescription } from '../../models/trustStatus';
import { getEvidenceTypeKey, getReportTitle } from '../../utils/evidenceUtils';
import {
  formatAuthenticityScore,
  formatLocationShort,
  getPrimaryPhoto,
  getReporterDisplayName,
} from '../../utils/reportDisplay';
import { useTranslation } from '../../hooks/useTranslation';
import { translateErrorMessage } from '../../utils/i18nHelpers';
import Header from '../../components/common/Header';
import { StatusBanner } from '../../components/common/StatusBadge';
import StatusTimeline from '../../components/reports/StatusTimeline';
import EvidenceVerificationList from '../../components/reports/EvidenceVerificationList';
import '../../components/reports/EvidenceVerificationList.css';
import {
  TrustTierBadge,
  CorroborationBadge,
  VerificationStatusBadge,
} from '../../components/reports/VerificationBadges';
import './ReportDetails.css';

const CORROBORATION_DESC_KEYS = {
  awaiting: 'corroboration.awaitingDesc',
  partial: 'corroboration.partialDesc',
  corroborated: 'corroboration.corroboratedDesc',
};

const VERIFICATION_DESC_KEYS = {
  verified: 'verification.evidenceVerified',
  failed: 'verification.couldNotConfirm',
  pending: 'verification.verificationPending',
  processing: 'verification.evidenceProcessing',
};

export default function ReportDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [trustResult, setTrustResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getReportById(id), getReportTrustResult(id)])
      .then(([reportData, result]) => {
        if (cancelled) return;
        setReport(reportData);
        setTrustResult(result);
      })
      .catch((err) => {
        if (!cancelled) setError(translateErrorMessage(t, err.message));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch report data only when id changes
  }, [id]);

  if (loading) {
    return (
      <div className="report-details-page">
        <Header title={t('report.detailsTitle')} showBack />
        <div className="report-details-page__loading">
          <div className="loading-spinner" aria-hidden="true" />
          <p>{t('report.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="report-details-page">
        <Header title={t('report.detailsTitle')} showBack />
        <div className="report-details-page__error">{error || t('report.notFound')}</div>
      </div>
    );
  }

  const hasEvidence = report.photos?.length > 0 || report.videos?.length > 0;
  const hasTrustTier = trustResult?.trustTier != null;
  const geoStatus = trustResult?.evidenceVerification?.geoTagStatus || 'pending';
  const authStatus = trustResult?.evidenceVerification?.authenticityStatus || 'pending';
  const corroborationKey = report.corroborationStatus || 'awaiting';
  const reportTitle = getReportTitle(report);
  const evidenceKey = getEvidenceTypeKey(report);
  const reporterName = getReporterDisplayName(report);
  const locationLabel = formatLocationShort(report);
  const authenticityScore = formatAuthenticityScore(report);
  const primaryPhoto = getPrimaryPhoto(report);

  return (
    <div className="report-details-page">
      <Header title={t('report.detailsTitle')} showBack />

      <div className="report-details-page__content">
        <StatusBanner status={report.status} />

        <div className="report-details-page__meta">
          <h2 className="report-details-page__id">{report.id}</h2>
          <p className="report-details-page__title">{reportTitle}</p>
          <p className="report-details-page__date">
            {t('report.submittedOn')} {formatDateTime(report.submittedAt)}
          </p>
        </div>

        <div className="report-details-page__section">
          <h3 className="report-details-page__section-title">{t('report.reporterInfo')}</h3>
          <div className="detail-summary-card">
            {reporterName && (
              <div className="detail-summary-row">
                <span className="detail-summary-row__label">{t('report.reporter')}</span>
                <span className="detail-summary-row__value">{reporterName}</span>
              </div>
            )}
            <div className="detail-summary-row">
              <span className="detail-summary-row__label">{t('trust.trustTier')}</span>
              <span className="detail-summary-row__value">
                {hasTrustTier ? (
                  <TrustTierBadge tier={trustResult.trustTier} showFullLabel />
                ) : (
                  <span className="report-details-page__unassessed">{t('report.trustTierPending')}</span>
                )}
              </span>
            </div>
            <div className="detail-summary-row">
              <span className="detail-summary-row__label">{t('report.authenticityScore')}</span>
              <span className="detail-summary-row__value">
                {authenticityScore != null ? (
                  <span className="report-details-page__score">{authenticityScore}</span>
                ) : (
                  <span className="report-details-page__unassessed">{t('common.notAvailable')}</span>
                )}
              </span>
            </div>
            {locationLabel && (
              <div className="detail-summary-row">
                <span className="detail-summary-row__label">{t('report.location')}</span>
                <span className="detail-summary-row__value">{locationLabel}</span>
              </div>
            )}
          </div>
        </div>

        <div className="report-details-page__section">
          <h3 className="report-details-page__section-title">{t('report.trustCorroboration')}</h3>
          <div className="detail-summary-card">
            <div className="detail-summary-row">
              <span className="detail-summary-row__label">{t('corroboration.label')}</span>
              <span className="detail-summary-row__value">
                <CorroborationBadge status={corroborationKey} />
              </span>
            </div>
            {hasTrustTier ? (
              <p className="report-details-page__helper">
                {getTrustTierDescription(t, trustResult.trustTier)}
              </p>
            ) : (
              <p className="report-details-page__helper">{t('report.trustTierPendingHelp')}</p>
            )}
            <p className="report-details-page__helper">{t(CORROBORATION_DESC_KEYS[corroborationKey])}</p>
          </div>
        </div>

        <div className="report-details-page__section">
          <h3 className="report-details-page__section-title">{t('report.incidentDescription')}</h3>
          <p className="report-details-page__description">{report.description}</p>
        </div>

        <div className="report-details-page__section">
          <h3 className="report-details-page__section-title">{t('report.evidenceVerification')}</h3>

          {primaryPhoto?.url && (
            <div className="report-details-page__hero-photo">
              <img src={primaryPhoto.url} alt={primaryPhoto.name || t('report.submittedPhoto')} />
            </div>
          )}

          <div className="detail-summary-card report-details-page__summary">
            {evidenceKey !== 'none' && (
              <div className="detail-summary-row">
                <span className="detail-summary-row__label">{t('report.evidenceType')}</span>
                <span className="detail-summary-row__value">
                  {t(`report.evidenceTypes.${evidenceKey}`)}
                </span>
              </div>
            )}
            <div className="detail-summary-row">
              <span className="detail-summary-row__label">{t('report.geoTagStatus')}</span>
              <span className="detail-summary-row__value">
                <VerificationStatusBadge state={geoStatus} />
              </span>
            </div>
            <div className="detail-summary-row">
              <span className="detail-summary-row__label">{t('report.authenticityReview')}</span>
              <span className="detail-summary-row__value">
                <VerificationStatusBadge state={authStatus} />
              </span>
            </div>
            <p className="report-details-page__helper">
              {t(VERIFICATION_DESC_KEYS[authStatus] || VERIFICATION_DESC_KEYS.pending)}
            </p>
          </div>

          <EvidenceVerificationList photos={report.photos} />

          {report.videos?.length > 0 && (
            <div className="report-details-page__evidence">
              {report.videos.map((video) => (
                <div key={video.id} className="report-details-page__evidence-item">
                  <div className="report-details-page__evidence-play">
                    <Play size={24} fill="white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasEvidence && (
            <p className="report-details-page__helper">{t('report.noEvidence')}</p>
          )}
        </div>

        <div className="report-details-page__section">
          <h3 className="report-details-page__section-title">{t('report.location')}</h3>
          <div className="report-details-page__location">
            <MapPin size={20} className="report-details-page__location-icon" />
            <div className="report-details-page__location-coords">
              <p className="report-details-page__location-coord">
                <strong>{t('report.latitude')}:</strong> {report.latitude?.toFixed(6)}
              </p>
              <p className="report-details-page__location-coord">
                <strong>{t('report.longitude')}:</strong> {report.longitude?.toFixed(6)}
              </p>
              <p className="report-details-page__location-source">{t('report.locationCaptured')}</p>
            </div>
            <a
              href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="report-details-page__map-btn"
              aria-label={t('common.openInMaps')}
            >
              <Map size={20} />
            </a>
          </div>
        </div>

        <div className="report-details-page__section">
          <h3 className="report-details-page__section-title">{t('report.statusTimeline')}</h3>
          <StatusTimeline report={report} />
        </div>
      </div>
    </div>
  );
}
