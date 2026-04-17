import { authHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const call = async (endpoint, options = {}) => {
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
    throw new Error(data.message || `HTTP error ${response.status}`);
  }

  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data;
};

export const fetchAssignmentChat = async (assignmentId) => {
  if (!assignmentId) return [];
  const data = await call(`/assignments/${assignmentId}/chat`);
  return Array.isArray(data) ? data : [];
};

export const sendAssignmentChatMessage = async (assignmentId, message) => {
  const data = await call(`/assignments/${assignmentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return data;
};
