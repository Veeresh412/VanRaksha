export const CORROBORATION_STATUSES = {
  awaiting: {
    label: 'Awaiting corroboration',
    className: 'corroboration-badge--awaiting',
    description: 'No matching community reports have been linked yet.',
  },
  partial: {
    label: 'Partially corroborated',
    className: 'corroboration-badge--partial',
    description: 'Some community reports reference a similar incident.',
  },
  corroborated: {
    label: 'Corroborated',
    className: 'corroboration-badge--corroborated',
    description: 'Multiple community reports support this incident.',
  },
};

export function getCorroborationConfig(status) {
  return CORROBORATION_STATUSES[status] || CORROBORATION_STATUSES.awaiting;
}
