export function buildMockNotifications(reports = []) {
  return reports
    .map((report) => ({
      id: `notif-${report.id}`,
      reportId: report.id,
      status: report.status,
      titleKey: `notifications.titles.${report.status}`,
      messageKey: `notifications.messages.${report.status}`,
      createdAt: report.submittedAt || new Date().toISOString(),
      read: false,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
