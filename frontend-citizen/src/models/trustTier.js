/** Display labels and descriptions for trust tiers — UI only, not computed here. */
export const TRUST_TIERS = {
  1: {
    tier: 1,
    label: 'Tier 1 — Basic',
    shortLabel: 'Basic',
    description: 'Photo evidence with manually captured location.',
  },
  2: {
    tier: 2,
    label: 'Tier 2 — Geo-tagged',
    shortLabel: 'Geo-tagged',
    description: 'Photo retains intact EXIF GPS metadata verified by the backend.',
  },
  3: {
    tier: 3,
    label: 'Tier 3 — Verified Reporter',
    shortLabel: 'Verified Reporter',
    description: 'Registered and verified NGO or Forest Rights Committee account.',
  },
};

export function getTrustTierConfig(tier) {
  return TRUST_TIERS[tier] || TRUST_TIERS[1];
}
