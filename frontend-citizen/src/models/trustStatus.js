import { getTrustTierConfig } from './trustTier';

/**
 * Trust status shape consumed by the UI (translation keys + data values).
 * Backend can replace this object wholesale later via trustService.
 *
 * @typedef {Object} TrustStatus
 * @property {string} reporterTypeKey
 * @property {number} trustTier
 * @property {boolean} exifGpsVerified
 * @property {boolean} registeredOrganization
 * @property {string} verificationStatusKey
 * @property {string|null} [hintKey]
 */

export const VERIFIED_ORG_TYPES = ['ngo', 'forest_rights_committee'];

const REPORTER_TYPE_KEYS = {
  ngo: 'ngoOrganization',
  forest_rights_committee: 'forestRightsCommittee',
  community_organization: 'communityOrganization',
  other: 'organization',
};

/** @type {TrustStatus} */
export const COMMUNITY_MEMBER_DEFAULT = {
  reporterTypeKey: 'communityMember',
  trustTier: 1,
  exifGpsVerified: false,
  registeredOrganization: false,
  verificationStatusKey: 'notAssessed',
  hintKey: 'communityTier2',
};

export function isVerifiedOrganization(user) {
  return (
    user?.accountType === 'organization' &&
    user?.verified === true &&
    VERIFIED_ORG_TYPES.includes(user?.organizationType)
  );
}

export function isRegisteredOrganization(user) {
  return user?.accountType === 'organization';
}

export function getOrganizationReporterTypeKey(user) {
  return REPORTER_TYPE_KEYS[user?.organizationType] || 'ngoOrganization';
}

export function normalizeTrustStatus(status) {
  const tier = status.trustTier ?? null;

  return {
    reporterTypeKey: status.reporterTypeKey ?? 'communityMember',
    trustTier: tier,
    exifGpsVerified: status.exifGpsVerified ?? false,
    registeredOrganization: status.registeredOrganization ?? false,
    verificationStatusKey: status.verificationStatusKey ?? 'notAssessed',
    hintKey: status.hintKey ?? null,
  };
}

export function resolveTrustStatus(user, backendStatus = null) {
  if (backendStatus) {
    return normalizeTrustStatus(backendStatus);
  }

  if (user?.trustStatus) {
    return normalizeTrustStatus(user.trustStatus);
  }

  if (isRegisteredOrganization(user)) {
    if (isVerifiedOrganization(user)) {
      return normalizeTrustStatus({
        reporterTypeKey: getOrganizationReporterTypeKey(user),
        trustTier: 3,
        exifGpsVerified: false,
        registeredOrganization: true,
        verificationStatusKey: 'verified',
        hintKey: null,
      });
    }

    return normalizeTrustStatus({
      reporterTypeKey: getOrganizationReporterTypeKey(user),
      trustTier: 1,
      exifGpsVerified: false,
      registeredOrganization: true,
      verificationStatusKey: 'pending',
      hintKey: 'orgVerification',
    });
  }

  return normalizeTrustStatus(COMMUNITY_MEMBER_DEFAULT);
}

export const PENDING_REPORT_VERIFICATION = {
  trustTier: null,
  trustTierLabel: null,
  verificationStatus: 'Pending review',
  evidenceVerification: {
    geoTagStatus: 'pending',
    authenticityStatus: 'pending',
  },
};

export function resolveReportTrustResult(report) {
  if (!report) return PENDING_REPORT_VERIFICATION;

  return {
    trustTier: report.trustTier ?? null,
    trustTierLabel: report.trustTierLabel ?? null,
    verificationStatus: report.verificationStatus ?? 'Pending review',
    evidenceVerification: {
      geoTagStatus: report.evidenceVerification?.geoTagStatus ?? 'pending',
      authenticityStatus: report.evidenceVerification?.authenticityStatus ?? 'pending',
    },
  };
}

export function getTrustTierLabel(t, tier) {
  return t(`trust.tiers.${tier}`) || getTrustTierConfig(tier).label;
}

export function getTrustTierDescription(t, tier) {
  return t(`trust.tierDescriptions.${tier}`) || getTrustTierConfig(tier).description;
}
