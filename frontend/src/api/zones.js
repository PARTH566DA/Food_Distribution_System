import { authHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/** Custom error that carries the existing zone's ID when a duplicate is detected. */
export class DuplicateZoneError extends Error {
  constructor(message, existingZoneId) {
    super(message);
    this.name = 'DuplicateZoneError';
    this.existingZoneId = existingZoneId;
  }
}

const apiClient = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // 409 = nearby zone already exists; surface existingZoneId to the caller
    if (response.status === 409) {
      throw new DuplicateZoneError(
        data.message || 'A nearby zone already exists.',
        data.data?.needyZoneId ?? null
      );
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

/** Fetch all needy zones for the map */
export const fetchAllZones = async () => {
  const response = await apiClient('/zones');
  if (response.success && response.data) return response.data;
  throw new Error('Invalid response format');
};

/** Mark a new needy zone (requires auth). Throws DuplicateZoneError on conflict. */
export const createNeedyZone = async ({ name, latitude, longitude, tagReason }) => {
  const response = await apiClient('/zones', {
    method: 'POST',
    body: JSON.stringify({ name, latitude, longitude, tagReason }),
  });
  if (response.success) return response;
  throw new Error(response.message || 'Failed to create zone');
};

/**
 * Report / flag a needy zone (requires auth).
 * A user can only report a given zone once.
 * @returns {number} updated report count
 */
export const reportZone = async (zoneId, reason = '') => {
  const response = await apiClient(`/zones/${zoneId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (response.success) return response.data; // report count
  throw new Error(response.message || 'Failed to submit report');
};
