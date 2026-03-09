import { authHeader } from './auth';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// API client with error handling (JSON)
const apiClient = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Fetch paginated food listings
export const fetchFoodPage = async (page = 0, size = 5) => {
  try {
    const response = await apiClient(`/food/feed?page=${page}&size=${size}`);

    // The backend returns: { success: true, data: { items, currentPage, totalPages, totalItems, hasMore } }
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch food page:', error);
    throw error;
  }
};

// Claim a food listing
export const claimFood = async (foodId) => {
  try {
    // For now, sending a hardcoded volunteerId
    // In production, this should come from authenticated user session
    const response = await apiClient(`/food/${foodId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ volunteerId: 1 }),
    });

    if (response.success) {
      return response;
    }

    throw new Error(response.message || 'Failed to claim food');
  } catch (error) {
    console.error('Failed to claim food:', error);
    throw error;
  }
};

// Get specific food listing details
export const getFoodDetails = async (foodId) => {
  try {
    const response = await apiClient(`/food/${foodId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch food details:', error);
    throw error;
  }
};

// Add a new food listing (multipart/form-data with optional image)
export const addFood = async (formData) => {
  try {
    const body = new FormData();
    body.append('vegetarian', formData.vegetarian);
    body.append('packed', formData.packed);
    body.append('description', formData.description);
    body.append('quantity', formData.quantity);
    body.append('expiryTime', formData.expiryTime);
    body.append('location', formData.location);
    body.append('latitude', formData.latitude);
    body.append('longitude', formData.longitude);
    if (formData.image) {
      body.append('image', formData.image);
    }
    // userId is now extracted server-side from the JWT token

    const response = await fetch(`${API_BASE_URL}/food`, {
      method: 'POST',
      headers: { ...authHeader() },
      body,
      // Do NOT set Content-Type — browser sets it automatically with boundary for multipart
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to add food listing');
  } catch (error) {
    console.error('Failed to add food listing:', error);
    throw error;
  }
};

// Cancel (delete) a food listing owned by the current user
export const deleteFood = async (foodId) => {
  try {
    const response = await apiClient(`/food/${foodId}`, { method: 'DELETE' });
    if (response.success) {
      return response;
    }
    throw new Error(response.message || 'Failed to cancel food listing');
  } catch (error) {
    console.error('Failed to cancel food listing:', error);
    throw error;
  }
};
