/**
 * Local report persistence for development and offline fallback.
 * Only stores reports created by the current user in this session/browser.
 */

import { buildReportRecord } from '../utils/reportBuilder';
import { getStoredUser } from './api';

const STORAGE_KEY = 'vanraksha_reports';

function readReports() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function getSessionUserId() {
  return getStoredUser()?.id || null;
}

export function getLocalReports(filters = {}) {
  const userId = getSessionUserId();
  let reports = readReports()
    .filter((report) => report.userId === userId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  if (filters.status && filters.status !== 'all') {
    reports = reports.filter((report) => report.status === filters.status);
  }

  return reports;
}

export function getLocalReportById(id) {
  const userId = getSessionUserId();
  const report = readReports().find((item) => item.id === id && item.userId === userId);

  if (!report) {
    throw new Error('Report not found.');
  }

  return report;
}

export function cacheLocalReport(report) {
  const existing = readReports();
  writeReports([report, ...existing.filter((item) => item.id !== report.id)]);
}

export function submitReportLocally(reportData) {
  const user = getStoredUser();
  const existing = readReports();
  const newReport = buildReportRecord(reportData, user, existing.length);
  cacheLocalReport(newReport);
  return newReport;
}
