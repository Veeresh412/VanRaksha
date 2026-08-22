export const TIMELINE_STEPS = ['submitted', 'processing', 'under_review', 'resolved'];

export function getStatusCounts(reports) {
  const counts = {
    total: reports.length,
    processing: 0,
    under_review: 0,
    submitted: 0,
    resolved: 0,
  };

  reports.forEach((report) => {
    if (counts[report.status] !== undefined) {
      counts[report.status] += 1;
    }
  });

  return counts;
}
