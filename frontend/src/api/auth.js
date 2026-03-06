const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}). Please try again.`);
  }

  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

// ── Sign Up ──────────────────────────────────────────────────────────────────

/** Step 1: send OTP to email for new account */
export const signUpSendOtp = (userName, mobileNumber, emailId, role) =>
  post('/auth/signup/send-otp', { userName, mobileNumber, emailId, role });

/** Step 2: verify OTP and create account. Returns { data: AuthResponse } */
export const signUpVerify = (emailId, otp) =>
  post('/auth/signup/verify', { emailId, otp });

// ── Login ────────────────────────────────────────────────────────────────────

/** Step 1: send OTP to existing account's email */
export const loginSendOtp = (emailId) =>
  post('/auth/login/send-otp', { emailId });

/** Step 2: verify OTP and retrieve user. Returns { data: AuthResponse } */
export const loginVerify = (emailId, otp) =>
  post('/auth/login/verify', { emailId, otp });

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Persist the authenticated user (including JWT token) into localStorage.
 * @param {object} authData  The `data` field from an AuthResponse.
 */
export const saveSession = (authData) => {
  localStorage.setItem('token', authData.token);
  localStorage.setItem('user', JSON.stringify({
    userId:       authData.userId,
    userName:     authData.userName,
    emailId:      authData.emailId,
    mobileNumber: authData.mobileNumber,
    role:         authData.role,
  }));
};

/** Remove all auth data from localStorage (logout). */
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/** Returns the stored JWT token or null. */
export const getToken = () => localStorage.getItem('token');

/** Returns the stored user object or null. */
export const getUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

/** Returns true when a non-expired token is present. */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode payload (middle part of JWT) – no library needed
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Returns the Authorization header object to attach to fetch calls.
 * { Authorization: 'Bearer <token>' }
 */
export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
