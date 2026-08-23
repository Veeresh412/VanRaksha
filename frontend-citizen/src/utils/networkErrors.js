/**
 * Detect network-level failures when the FastAPI backend is unreachable.
 * Used to trigger local development fallbacks without surfacing raw fetch errors.
 */
export function isBackendUnavailableError(error) {
  if (!error) return false;

  const message = error.message || '';

  // HTTP responses from apiRequest are real API errors, not connectivity failures.
  if (message.startsWith('Request failed:')) {
    return false;
  }

  if (error.name === 'TypeError' && message.toLowerCase().includes('fetch')) {
    return true;
  }

  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Network request failed') ||
    message.includes('Load failed')
  );
}
