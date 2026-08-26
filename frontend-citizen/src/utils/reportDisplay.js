/**
 * Display helpers for report list/detail UI.
 * Only formats values already present on the report object — no invented data.
 */

export function getReporterDisplayName(report) {
  return report?.submitterName || report?.reporterTrust || null;
}

export function formatLocationShort(report) {
  if (report?.latitude == null || report?.longitude == null) {
    return null;
  }

  return `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
}

export function hasAuthenticityScore(report) {
  return typeof report?.authenticityScore === 'number' && report.authenticityScore > 0;
}

export function formatAuthenticityScore(report) {
  if (!hasAuthenticityScore(report)) {
    return null;
  }

  return Math.round(report.authenticityScore);
}

export function getPrimaryPhoto(report) {
  return report?.photos?.find((photo) => photo.url) ?? null;
}
