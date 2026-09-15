import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const REQUEST_TIMEOUT_MS = 15000;

// Carries only the HTTP status (null for network errors and timeouts).
// Pages show copy from the spec, never server messages.
export class ApiError extends Error {
  constructor(status) {
    super(status ? `Request failed with status ${status}` : 'Request failed without a response');
    this.name = 'ApiError';
    this.status = status;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// Register and log in adds a request interceptor here that attaches the JWT.

// Unwraps the { data, error } envelope.
api.interceptors.response.use(
  (response) => response.data.data,
  (error) => Promise.reject(new ApiError(error.response ? error.response.status : null)),
);

export default api;
