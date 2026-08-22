export const VERIFICATION_STATES = {
  verified: {
    label: 'Verified',
    className: 'verification-badge--verified',
    description: 'Verification completed by the backend.',
  },
  failed: {
    label: 'Not verified',
    className: 'verification-badge--failed',
    description: 'Verification could not be confirmed.',
  },
  pending: {
    label: 'Pending review',
    className: 'verification-badge--pending',
    description: 'Awaiting backend verification.',
  },
};

export function getVerificationStateConfig(state) {
  return VERIFICATION_STATES[state] || VERIFICATION_STATES.pending;
}

/** Map backend geo-tag summary values to display config. */
export function getGeoTagSummaryConfig(status) {
  const map = {
    verified: { label: 'Geo-tag verified', state: 'verified' },
    failed: { label: 'Geo-tag not found', state: 'failed' },
    pending: { label: 'Pending review', state: 'pending' },
    none: { label: 'No photo evidence', state: 'pending' },
  };
  return map[status] || map.pending;
}
