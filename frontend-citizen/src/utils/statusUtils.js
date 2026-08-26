export const TIMELINE_STEPS = ['submitted', 'processing', 'under_review', 'resolved'];

const TIMELINE_INDEX_BY_STATUS = {
  pending: 0,
  submitted: 0,
  processing: 1,
  under_review: 2,
  verified: 3,
  resolved: 3,
  rejected: 0,
};

export function getTimelineIndex(status) {
  return TIMELINE_INDEX_BY_STATUS[status] ?? 0;
}

export function getStatusCounts(reports) {
  const counts = {
    total: reports.length,
    processing: 0,
    under_review: 0,
    submitted: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    resolved: 0,
  };

  reports.forEach((report) => {
    if (counts[report.status] !== undefined) {
      counts[report.status] += 1;
    }
  });

  return counts;
}
