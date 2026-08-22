import { Camera } from 'lucide-react';
import { VerificationStatusBadge } from './VerificationBadges';
import { useTranslation } from '../../hooks/useTranslation';
import './EvidenceVerificationList.css';

const VERIFICATION_DESC_KEYS = {
  verified: 'verification.evidenceVerified',
  failed: 'verification.couldNotConfirm',
  pending: 'verification.verificationPending',
  processing: 'verification.evidenceProcessing',
};

function photoGeoStatus(photo) {
  return photo.geoTagStatus || photo.geoTag || 'pending';
}

function photoAuthenticityStatus(photo) {
  return photo.authenticityStatus || photo.authenticity || 'pending';
}

export default function EvidenceVerificationList({ photos = [] }) {
  const { t } = useTranslation();

  if (!photos.length) {
    return (
      <p className="evidence-verification-list__empty">{t('report.noPhotoEvidence')}</p>
    );
  }

  return (
    <div className="evidence-verification-list">
      {photos.map((photo) => {
        const authenticity = photoAuthenticityStatus(photo);
        return (
          <div key={photo.id} className="evidence-verification-list__item">
            <div className="evidence-verification-list__thumb">
              {photo.url ? (
                <img src={photo.url} alt={photo.name} />
              ) : (
                <Camera size={20} color="var(--color-text-muted)" />
              )}
            </div>

            <div className="evidence-verification-list__content">
              <p className="evidence-verification-list__name">{photo.name}</p>

              <div className="evidence-verification-list__checks">
                <div className="evidence-verification-list__check">
                  <span className="evidence-verification-list__check-label">
                    {t('verification.geoTag')}
                  </span>
                  <VerificationStatusBadge state={photoGeoStatus(photo)} />
                </div>
                <div className="evidence-verification-list__check">
                  <span className="evidence-verification-list__check-label">
                    {t('verification.authenticity')}
                  </span>
                  <VerificationStatusBadge state={authenticity} />
                </div>
              </div>

              <p className="evidence-verification-list__hint">
                {t(VERIFICATION_DESC_KEYS[authenticity] || VERIFICATION_DESC_KEYS.pending)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
