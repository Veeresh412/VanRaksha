/**
 * Report service — UI entry point.
 * Tries FastAPI when configured; falls back to localStorage when the backend is offline.
 * Demo users also receive read-only demo reports from demoData (service layer only).
 */

import { getStoredUser } from './api';
import {
  cacheLocalReport,
  getLocalReportById,
  getLocalReports,
  submitReportLocally,
} from './localReportStore';
import { createReportViaApi, isApiConfigured } from './reportApi';
import { getDemoReportById, getDemoReportsForUser } from '../data/demoData';
import { buildMockNotifications } from '../data/notificationMock';
import { isBackendUnavailableError } from '../utils/networkErrors';

function mergeReports(localReports, demoReports, filters = {}) {
  const byId = new Map();

  localReports.forEach((report) => byId.set(report.id, report));
  demoReports.forEach((report) => {
    if (!byId.has(report.id)) {
      byId.set(report.id, report);
    }
  });

  let merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  if (filters.status && filters.status !== 'all') {
    merged = merged.filter((report) => report.status === filters.status);
  }

  return merged;
}

function getDemoReportsForCurrentUser() {
  const user = getStoredUser();
  if (!user?.isDemo) return [];
  return getDemoReportsForUser(user.id);
}

export async function getReports(filters = {}) {
  const localReports = getLocalReports();
  const demoReports = getDemoReportsForCurrentUser();

  if (!demoReports.length) {
    return getLocalReports(filters);
  }

  return mergeReports(localReports, demoReports, filters);
}

export async function getReportById(id) {
  try {
    return getLocalReportById(id);
  } catch (error) {
    const user = getStoredUser();
    if (!user?.isDemo) {
      throw error;
    }

    const demoReport = getDemoReportById(id);
    if (demoReport && demoReport.userId === user.id) {
      return demoReport;
    }

    throw error;
  }
}

export async function getRecentReports(limit = 3) {
  const reports = await getReports();
  return reports.slice(0, limit);
}

export async function submitReport(reportData) {
  if (isApiConfigured()) {
    try {
      const user = getStoredUser();
      const report = await createReportViaApi(reportData, user);
      cacheLocalReport(report);
      return report;
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        return submitReportLocally(reportData);
      }
      throw error;
    }
  }

  return submitReportLocally(reportData);
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
