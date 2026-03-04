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
