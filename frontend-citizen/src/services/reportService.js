/**
 * Report service — UI entry point.
 * Reads and writes reports through FastAPI when configured.
 */

import { getStoredUser } from './api';

import {
  createReportViaApi,
  fetchReportByIdFromApi,
  fetchReportsFromApi,
  isApiConfigured,
} from './reportApi';

import { buildMockNotifications } from '../data/notificationMock';

function applyStatusFilter(reports, filters = {}) {
  if (filters.status && filters.status !== 'all') {
    return reports.filter((report) => report.status === filters.status);
  }

  return reports;
}

export async function getReports(filters = {}) {
  if (!isApiConfigured()) {
    return [];
  }

  const reports = await fetchReportsFromApi();
  return applyStatusFilter(reports, filters);
}

export async function getReportById(id) {
  if (!isApiConfigured()) {
    throw new Error('Report not found.');
  }

  return fetchReportByIdFromApi(id);
}

export async function getRecentReports(limit = 3) {
  const reports = await getReports();

  return reports.slice(0, limit);
}

export async function submitReport(reportData) {
  if (!isApiConfigured()) {
    throw new Error('Backend is not configured.');
  }

  const user = getStoredUser();

  return createReportViaApi(
    {
      ...reportData,
      tier: user.accountType === 'organization' ? 3 : 1,
    },
    user
  );
}

export async function getNotifications() {
  const reports = await getReports();

  return buildMockNotifications(reports);
}

export async function captureLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(error.message || 'Unable to capture location.'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
