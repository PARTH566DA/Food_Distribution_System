const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const normalizeToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return null;
  return rawToken.replace(/^Bearer\s+/i, '').trim() || null;
};

const decodeBase64Url = (value) => {
  // JWT payload uses base64url; normalize to standard base64 before decoding.
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
};

const post = async (endpoint, body) => {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  let data;
  const responseText = await res.text();
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    if (!res.ok) {
      throw new Error(responseText || `Server error (${res.status}). Please try again.`);
    }
    throw new Error(`Server error (${res.status}). Please try again.`);
  }

  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

const patchAuth = async (endpoint, body) => {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  let data;
  const responseText = await res.text();
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    if (!res.ok) {
      throw new Error(responseText || `Server error (${res.status}). Please try again.`);
    }
    throw new Error(`Server error (${res.status}). Please try again.`);
  }

  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};


export const signUpSendOtp = (userName, mobileNumber, emailId, role) =>
  post('/auth/signup/send-otp', { userName, mobileNumber, emailId, role });

export const signUpVerify = (emailId, otp) =>
  post('/auth/signup/verify', { emailId, otp });


export const loginSendOtp = (emailId) =>
  post('/auth/login/send-otp', { emailId });

export const loginVerify = (emailId, otp) =>
  post('/auth/login/verify', { emailId, otp });

export const updateProfile = (userName, mobileNumber) =>
  patchAuth('/auth/profile', { userName, mobileNumber });

export const saveSession = (authData) => {
  const token = normalizeToken(
    authData?.token
    ?? authData?.accessToken
    ?? authData?.jwtToken
  );
  if (!token) throw new Error('Login response did not include a valid token.');

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({
    userId:       authData?.userId,
    userName:     authData?.userName,
    emailId:      authData?.emailId,
    mobileNumber: authData?.mobileNumber,
    role:         authData?.role,
    lastKnownLatitude: typeof authData?.lastKnownLatitude === 'number' ? authData.lastKnownLatitude : null,
    lastKnownLongitude: typeof authData?.lastKnownLongitude === 'number' ? authData.lastKnownLongitude : null,
  }));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getToken = () => normalizeToken(localStorage.getItem('token'));

export const getUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const updateSessionUser = (patch) => {
  const existingUser = getUser();
  if (!existingUser) return null;

  const nextUser = { ...existingUser, ...patch };
  localStorage.setItem('user', JSON.stringify(nextUser));
  return nextUser;
};

const getCurrentPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Geolocation is not supported in this browser.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => resolve(pos),
    (err) => reject(err),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
});

export const requestAndStoreCurrentLocation = async () => {
  try {
    const pos = await getCurrentPosition();
    const latitude = pos?.coords?.latitude;
    const longitude = pos?.coords?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { granted: false, latitude: null, longitude: null };
    }

    updateSessionUser({
      lastKnownLatitude: latitude,
      lastKnownLongitude: longitude,
    });

    return { granted: true, latitude, longitude };
  } catch {
    return { granted: false, latitude: null, longitude: null };
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Trust expiry claim as milliseconds by converting standard JWT seconds -> ms.
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
