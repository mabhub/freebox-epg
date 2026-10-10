/**
 * Freebox OS authentication API
 *
 * Hashing algorithm (from Freebox OS login.min.js):
 *   h_pass = SHA1(password_salt + password)
 *   hash   = HMAC-SHA1(challenge, h_pass)   // challenge = message, h_pass = key
 *
 * @module api/auth
 */

import { API_BASE_URL } from '@/utils/constants';

const FBX_HEADERS = { 'X-FBX-FREEBOX0S': '1' };

const hexFromBuffer = (buffer) =>
  [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const sha1Hex = async (text) => {
  const encoded = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-1', encoded);
  return hexFromBuffer(hash);
};

const hmacSha1Hex = async (key, message) => {
  const encodedKey = new TextEncoder().encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encodedKey,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encodedMessage);
  return hexFromBuffer(signature);
};

const hashPassword = async (password, challenge, passwordSalt) => {
  const hPass = await sha1Hex(passwordSalt + password);
  return hmacSha1Hex(hPass, challenge);
};

/**
 * Resolve the challenge value from the API.
 * When not logged in, the API returns an array of obfuscated JS fragments
 * that each evaluate to a single character. This mirrors the getchallenge()
 * function from Freebox OS login.min.js.
 * @param {string|string[]} challenge - Challenge string or array of JS fragments
 * @returns {string} Resolved challenge string
 */
const resolveChallenge = (challenge) =>
  Array.isArray(challenge)
    // eslint-disable-next-line no-eval
    ? challenge.map((fragment) => String((0, eval)(fragment))).join('')
    : challenge;

/**
 * Parse a Freebox auth response. The Freebox answers JSON even on errors
 * (e.g. a wrong password), so only a body that is not JSON means the box
 * itself was not reached (proxy 502/504 page, captive portal).
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed Freebox payload
 * @throws {Error} When the body is not JSON
 */
const readPayload = async (response) => {
  try {
    return await response.json();
  } catch {
    throw new Error(`La Freebox ne répond pas (HTTP ${response.status})`);
  }
};

export const checkAuth = async () => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    credentials: 'include',
    headers: FBX_HEADERS,
  });

  const data = await readPayload(response);

  if (!data.success) {
    throw new Error(data.msg ?? 'Failed to check auth status');
  }

  return data.result;
};

export const login = async (password) => {
  const { challenge, password_salt } = await checkAuth();

  const hash = await hashPassword(
    password,
    resolveChallenge(challenge),
    password_salt,
  );

  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: 'POST',
    credentials: 'include',
    headers: FBX_HEADERS,
    body: new URLSearchParams({ login: 'freebox', password: hash }),
  });

  const data = await readPayload(response);

  if (!data.success) {
    const error = new Error(data.msg ?? 'Identifiants invalides');
    error.code = data.error_code;
    throw error;
  }

  return data.result;
};

export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/login/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: FBX_HEADERS,
  });

  const data = await readPayload(response);

  if (!data.success) {
    throw new Error(data.msg ?? 'Logout failed');
  }
};
