import { useTranslation } from '../../hooks/useTranslation';
import { TrustTierBadge } from './VerificationBadges';
import './TrustTierStatusCard.css';

export default function TrustTierStatusCard({ status }) {
  const { t } = useTranslation();
  if (!status) return null;

  const tierLabel = status.registeredOrganization
    ? t('trust.trustTier')
    : t('trust.currentTrustTier');

  return (
    <div className="trust-tier-status-card">
      <div className="trust-tier-status-card__row">
        <span className="trust-tier-status-card__label">{t('trust.reporterType')}</span>
        <span className="trust-tier-status-card__value">
          {t(`trust.reporterTypes.${status.reporterTypeKey}`)}
        </span>
      </div>

      <div className="trust-tier-status-card__row">
        <span className="trust-tier-status-card__label">{tierLabel}</span>
        <span className="trust-tier-status-card__value">
          <TrustTierBadge tier={status.trustTier} showFullLabel />
        </span>
      </div>

      {status.hintKey && (
        <p className="trust-tier-status-card__hint">{t(`trust.hints.${status.hintKey}`)}</p>
      )}
    </div>
  );
}
