import { useEffect, useState } from 'react';
import { Building2, User, BadgeCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/dateUtils';
import { getUserTrustStatus } from '../../services/trustService';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import ProfileSection from '../../components/profile/ProfileSection';
import ProfileInfoRow from '../../components/profile/ProfileInfoRow';
import { TrustTierBadge } from '../../components/reports/VerificationBadges';
import './Profile.css';

function displayValue(value) {
  return value || '—';
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [trustStatus, setTrustStatus] = useState(null);
  const isOrganization = user?.accountType === 'organization';

  useEffect(() => {
    getUserTrustStatus(user).then(setTrustStatus);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const AvatarIcon = isOrganization ? Building2 : User;
  const accountTypeLabel = isOrganization
    ? t('profile.accountTypes.organization')
    : t('profile.accountTypes.individual');
  const tierLabel = trustStatus?.registeredOrganization
    ? t('trust.trustTier')
    : t('trust.currentTrustTier');

  return (
    <div className="profile-page">
      <Header title={t('profile.title')} showLanguage />

      <div className="profile-page__body">
        <section className="profile-page__identity card">
          <div className="profile-page__avatar">
            <AvatarIcon size={28} strokeWidth={1.75} />
          </div>

          <div className="profile-page__identity-content">
            <p className="profile-page__account-type">{accountTypeLabel}</p>
            <h2 className="profile-page__name">{displayValue(user?.name)}</h2>
            <p className="profile-page__identifier">
              {isOrganization ? displayValue(user?.organizationId) : displayValue(user?.email)}
            </p>

            <div className="profile-page__status-row">
              <span
                className={`profile-page__status ${
                  user?.verified ? 'profile-page__status--verified' : 'profile-page__status--pending'
                }`}
              >
                {user?.verified ? (
                  <>
                    <BadgeCheck size={14} />
                    {t('profile.verified')}
                  </>
                ) : (
                  t('profile.verificationPending')
                )}
              </span>
              {trustStatus && <TrustTierBadge tier={trustStatus.trustTier} />}
            </div>
          </div>
        </section>

        <ProfileSection title={t('profile.reporterStatus')}>
          <ProfileInfoRow
            label={t('trust.reporterType')}
            value={
              trustStatus
                ? t(`trust.reporterTypes.${trustStatus.reporterTypeKey}`)
                : t('common.notAvailable')
            }
          />
          <ProfileInfoRow label={t('profile.accountType')} value={accountTypeLabel} />
          <ProfileInfoRow
            label={tierLabel}
            value={
              trustStatus?.trustTier != null
                ? t(`trust.tiers.${trustStatus.trustTier}`)
                : t('profile.verificationPending')
            }
          />
          <ProfileInfoRow
            label={t('trust.exifGpsVerified')}
            value={trustStatus?.exifGpsVerified ? t('common.yes') : t('common.no')}
          />
          <ProfileInfoRow
            label={t('trust.registeredOrganization')}
            value={trustStatus?.registeredOrganization ? t('common.yes') : t('common.no')}
          />
          <ProfileInfoRow
            label={t('trust.verificationStatusLabel')}
            value={
              trustStatus
                ? t(`trust.verificationStatus.${trustStatus.verificationStatusKey}`)
                : t('common.notAvailable')
            }
          />
          {trustStatus?.hintKey && (
            <p className="profile-page__tier-note">{t(`trust.hints.${trustStatus.hintKey}`)}</p>
          )}
        </ProfileSection>

        <ProfileSection title={t('profile.accountInformation')}>
          <ProfileInfoRow label={t('profile.email')} value={displayValue(user?.email)} />
          <ProfileInfoRow label={t('profile.phone')} value={displayValue(user?.phone)} />
          <ProfileInfoRow
            label={t('profile.memberSince')}
            value={user?.registeredAt ? formatDate(user.registeredAt) : t('common.notAvailable')}
          />
        </ProfileSection>

        {isOrganization ? (
          <ProfileSection title={t('profile.organizationInformation')}>
            <ProfileInfoRow label={t('profile.organizationName')} value={displayValue(user?.name)} />
            <ProfileInfoRow
              label={t('profile.registrationNumber')}
              value={displayValue(user?.organizationId)}
            />
            <ProfileInfoRow
              label={t('profile.organizationType')}
              value={
                user?.organizationType
                  ? t(`registration.orgTypes.${user.organizationType}`)
                  : t('common.notAvailable')
              }
            />
            <ProfileInfoRow
              label={t('profile.contactPerson')}
              value={displayValue(user?.contactPersonName)}
            />
            <ProfileInfoRow label={t('profile.district')} value={displayValue(user?.district)} />
            <ProfileInfoRow label={t('profile.state')} value={displayValue(user?.state)} />
          </ProfileSection>
        ) : (
          <ProfileSection title={t('profile.location')}>
            <ProfileInfoRow
              label={t('profile.villageLocality')}
              value={displayValue(user?.village)}
            />
            <ProfileInfoRow label={t('profile.district')} value={displayValue(user?.district)} />
            <ProfileInfoRow label={t('profile.state')} value={displayValue(user?.state)} />
          </ProfileSection>
        )}

        <section className="profile-page__actions">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut size={18} />
            {t('common.logout')}
          </Button>
        </section>
      </div>
    </div>
  );
}
