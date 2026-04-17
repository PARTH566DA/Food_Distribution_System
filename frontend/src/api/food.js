import { authHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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

export const fetchFoodPage = async (page = 0, size = 5) => {
  try {
    const response = await apiClient(`/food/feed?page=${page}&size=${size}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch food page:', error);
    throw error;
  }
};

export const claimFood = async (foodId, options = {}) => {
  try {
    const payload = {
      userId: options.userId ?? options.volunteerId ?? null,
      needyZoneId: options.needyZoneId ?? null,
    };

    const response = await apiClient(`/food/${foodId}/claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
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

    const response = await fetch(`${API_BASE_URL}/food`, {
      method: 'POST',
      headers: { ...authHeader() },
      body,
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

export const fetchPostedHistory = async () => {
  try {
    const response = await apiClient('/food/history/posted');
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch posted history:', error);
    throw error;
  }
};

export const fetchAcceptedHistory = async () => {
  try {
    const response = await apiClient('/food/history/accepted');
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch accepted history:', error);
    throw error;
  }
};

export const updateAcceptedOrderProgress = async (foodId, action) => {
  try {
    const response = await apiClient(`/food/${foodId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update order progress');
  } catch (error) {
    console.error('Failed to update accepted order progress:', error);
    throw error;
  }
};
