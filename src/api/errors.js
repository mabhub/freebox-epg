/**
 * Authentication error thrown when the API returns 403, signalling that
 * the Freebox session has expired and the UI should redirect to login.
 * Lives in its own module so client.js can keep a single class definition.
 * @module api/errors
 */

class AuthError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AuthError';
  }
}

export default AuthError;
