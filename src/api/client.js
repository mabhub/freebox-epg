/**
 * API client for the Freebox TV API
 * @module api/client
 */

const BASE_URL = '/api/latest';

/**
 * Fetch wrapper for the Freebox API
 * Handles base URL, credentials, and response unwrapping
 * @param {string} path - API path (e.g., "/tv/channels/")
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<*>} Unwrapped API result
 * @throws {Error} If the API returns success: false or network error
 */
const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.msg ?? `API error: ${data.error_code ?? 'unknown'}`);
  }

  return data.result;
};

export default apiFetch;
