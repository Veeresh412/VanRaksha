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
  const backendResponse = await apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify({
      photo_file_url: null,
      lat: reportData.latitude,
      lng: reportData.longitude,
      description: reportData.description,
      reporter_type: 'citizen',
      tier: 1,
      authenticity_score: 0,
    }),
  });

  return mapBackendReportResponse(reportData, backendResponse, user);
}
