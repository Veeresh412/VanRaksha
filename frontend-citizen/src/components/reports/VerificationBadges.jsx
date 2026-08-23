import { useTranslation } from '../../hooks/useTranslation';
import './VerificationBadges.css';

const VERIFICATION_STATE_KEYS = {
  verified: 'verification.evidenceVerified',
  failed: 'verification.verificationFailed',
  pending: 'verification.verificationPending',
  processing: 'verification.evidenceProcessing',
};

export function VerificationStatusBadge({ state }) {
  const { t } = useTranslation();
  const key = VERIFICATION_STATE_KEYS[state] || VERIFICATION_STATE_KEYS.pending;
  const className = `verification-badge verification-badge--${state || 'pending'}`;

  return <span className={className}>{t(key)}</span>;
}

export function TrustTierBadge({ tier, showFullLabel = false }) {
  const { t } = useTranslation();

  if (tier == null) {
    return (
      <span className="trust-tier-badge trust-tier-badge--unassigned">
        {t('profile.verificationPending')}
      </span>
    );
  }

  return (
    <span className={`trust-tier-badge trust-tier-badge--tier-${tier}`}>
      {showFullLabel ? t(`trust.tiers.${tier}`) : t('trust.tiers.short', { tier })}
    </span>
  );
}

export function CorroborationBadge({ status }) {
  const { t } = useTranslation();
  const key = status || 'awaiting';

  return (
    <span className={`corroboration-badge corroboration-badge--${key}`}>
      {t(`corroboration.${key}`)}
    </span>
  );
}
