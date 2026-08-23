import { PENDING_REPORT_VERIFICATION } from '../models/trustStatus';

export function mapBackendReportResponse(reportData, backendResponse, user) {
  const id = `VR-${String(backendResponse.id).padStart(4, '0')}`;

  return {
    id,
    backendId: backendResponse.id,
    title: reportData.description,
    description: reportData.description,
    photos: [],
    videos: [],
    latitude: reportData.latitude,
    longitude: reportData.longitude,
    locationSource: 'device_capture',
    submittedAt: new Date().toISOString(),
    userId: user?.id,
    submitterName: user?.name,
    reporterType: 'citizen',
    status: 'submitted',
    corroborationStatus: 'awaiting',
    trustTier: backendResponse.tier ?? 1,
    trustTierLabel: null,
    verificationStatus: 'pending',
    evidenceVerification: {
      geoTagStatus: 'pending',
      authenticityStatus: 'pending',
    },
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
