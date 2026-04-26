import { authHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class DuplicateZoneError extends Error {
  constructor(message, existingZoneId) {
    super(message);
    this.name = 'DuplicateZoneError';
    this.existingZoneId = existingZoneId;
  }
}

const apiClient = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
        headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
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

export const fetchAllZones = async () => {
  const response = await apiClient('/zones');
  if (response.success && response.data) return response.data;
  throw new Error('Invalid response format');
};

export const createNeedyZone = async ({ name, latitude, longitude, tagReason }) => {
  const response = await apiClient('/zones', {
    method: 'POST',
    body: JSON.stringify({ name, latitude, longitude, tagReason }),
  });
  if (response.success) return response;
  throw new Error(response.message || 'Failed to create zone');
};
export const reportZone = async (zoneId, reason = '') => {
  const response = await apiClient(`/zones/${zoneId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (response.success) return response.data;
  throw new Error(response.message || 'Failed to submit report');
};
