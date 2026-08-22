/**
 * Derive evidence type label key from report evidence arrays.
 * Display only — values come from submitted report data.
 */
export function getEvidenceTypeKey(report) {
  const hasPhoto = (report?.photos?.length ?? 0) > 0;
  const hasVideo = (report?.videos?.length ?? 0) > 0;

  if (hasPhoto && hasVideo) return 'photoAndVideo';
  if (hasVideo) return 'video';
  if (hasPhoto) return 'photo';
  return 'none';
}

export function getReportTitle(report) {
  return report?.title || report?.description || '';
}
