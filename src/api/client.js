/**
 * API client for the Freebox TV API
 * @module api/client
 */

import { API_BASE_URL } from '@/utils/constants';

export class AuthError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Fetch wrapper for the Freebox API
 * Handles base URL, credentials, and response unwrapping
 * @param {string} path - API path (e.g., "/tv/channels/")
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<*>} Unwrapped API result
 * @throws {AuthError} If the API returns 403 (session expired)
 * @throws {Error} If the API returns success: false or network error
 */
const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'X-FBX-FREEBOX0S': '1',
      ...options.headers,
    },
  });

  if (response.status === 403) {
    throw new AuthError('Session expired');
  }

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
