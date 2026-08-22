import { resolveTrustStatus, resolveReportTrustResult } from '../models/trustStatus';
import { getReportById } from './reportService';

/**
 * Trust service — frontend display layer only.
 * Backend trust endpoints are not wired yet; values come from stored report/user data.
 */

export async function getUserTrustStatus(user) {
  return resolveTrustStatus(user);
}

export async function getReportTrustResult(reportId) {
  const report = await getReportById(reportId);
  return resolveReportTrustResult(report);
}
