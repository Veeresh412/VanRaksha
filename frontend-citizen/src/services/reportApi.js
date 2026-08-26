/**
 * FastAPI report endpoints.
 * Keeps HTTP/API logic separate from local development fallbacks.
 */

import { mapBackendReportResponse } from '../utils/reportBuilder';

import { apiRequest } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

export async function createReportViaApi(reportData, user) {
  let photoUrl = null;

  if (reportData.photos && reportData.photos.length > 0) {
    const fileToUpload = reportData.photos[0].file;
    const formData = new FormData();
    formData.append('file', fileToUpload);
    
    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.url;
      }
    } catch (e) {
      console.error("Failed to upload photo locally:", e);
    }
  }

  const backendResponse = await apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify({
      photo_file_url: photoUrl,
      lat: reportData.latitude,
      lng: reportData.longitude,
      description: reportData.description,
      reporter_type: 'citizen',
      tier: Number(
        user?.trustStatus?.trustTier ??
        user?.tier ??
        user?.verificationTier ??
        (user?.accountType === 'organization' ? 3 : 1)
      ),
      authenticity_score: 0,
    }),
  });

  return mapBackendReportResponse(reportData, backendResponse, user);
}