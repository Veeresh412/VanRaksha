import { PENDING_REPORT_VERIFICATION } from '../models/trustStatus';

const BACKEND_STATUS_MAP = {
  Unverified: 'pending',
  'Under Review': 'under_review',
  Verified: 'verified',
  Rejected: 'rejected',
  Resolved: 'resolved',
};

export function mapBackendStatus(status) {
  return BACKEND_STATUS_MAP[status] || 'submitted';
}

export function parseReportApiId(id) {
  if (typeof id === 'string' && id.startsWith('VR-')) {
    return parseInt(id.slice(3), 10);
  }

  return parseInt(id, 10);
}

export function mapBackendReportListItem(backendResponse, user) {
  const id = `VR-${String(backendResponse.id).padStart(4, '0')}`;

  return {
    id,
    backendId: backendResponse.id,
    title: backendResponse.description || '',
    description: backendResponse.description || '',
    photos: backendResponse.photo_url
      ? [
          {
            id: `photo-${backendResponse.id}`,
            name: 'Evidence photo',
            url: backendResponse.photo_url,
          },
        ]
      : [],
    videos: [],
    latitude: backendResponse.lat,
    longitude: backendResponse.lng,
    locationSource: 'device_capture',
    submittedAt: backendResponse.created_at,
    userId: user?.id,
    submitterName: user?.name,
    reporterTrust: backendResponse.reporter_trust ?? null,
    reporterType: backendResponse.reporter_trust || 'citizen',
    authenticityScore:
      typeof backendResponse.authenticity_score === 'number'
        ? backendResponse.authenticity_score
        : null,
    backendStatus: backendResponse.status ?? null,
    status: mapBackendStatus(backendResponse.status),
    corroborationStatus: 'awaiting',
    trustTier: backendResponse.tier ?? null,
    trustTierLabel: null,
    verificationStatus: 'pending',
    evidenceVerification: {
      geoTagStatus: 'pending',
      authenticityStatus: 'pending',
    },
  };
}

export function mapBackendReportResponse(reportData, backendResponse, user) {
  const mapped = mapBackendReportListItem(backendResponse, user);

  return {
    ...mapped,
    title: reportData.description,
    description: reportData.description,
    latitude: reportData.latitude,
    longitude: reportData.longitude,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Build a storable report object from form input.
 * Trust tier and evidence verification are assigned by the backend after upload.
 */
export function buildReportRecord(reportData, user, existingCount = 0) {
  const photos = (reportData.photos || []).map((photo, index) => ({
    id: photo.id || `photo-${Date.now()}-${index}`,
    name: photo.name,
    url: photo.preview || null,
    geoTagStatus: 'pending',
    authenticityStatus: 'pending',
  }));

  const videos = (reportData.videos || []).map((video, index) => ({
    id: video.id || `video-${Date.now()}-${index}`,
    name: video.name,
    url: video.preview || null,
  }));

  return {
    id: `VR-${String(existingCount + 1).padStart(4, '0')}`,
    title: reportData.description,
    description: reportData.description,
    photos,
    videos,
    latitude: reportData.latitude,
    longitude: reportData.longitude,
    locationSource: 'device_capture',
    submittedAt: new Date().toISOString(),
    userId: user?.id,
    submitterName: user?.name,
    reporterType: user?.accountType === 'organization' ? 'organization' : 'citizen',
    status: 'submitted',
    corroborationStatus: 'awaiting',
    trustTier: PENDING_REPORT_VERIFICATION.trustTier,
    trustTierLabel: PENDING_REPORT_VERIFICATION.trustTierLabel,
    verificationStatus: PENDING_REPORT_VERIFICATION.verificationStatus,
    evidenceVerification: { ...PENDING_REPORT_VERIFICATION.evidenceVerification },
  };
}
