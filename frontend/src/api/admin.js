const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const STORAGE_KEY = 'adminToken';


export const saveAdminToken  = (token) => sessionStorage.setItem(STORAGE_KEY, token);
export const clearAdminToken = ()      => sessionStorage.removeItem(STORAGE_KEY);
export const getAdminToken   = ()      => sessionStorage.getItem(STORAGE_KEY);

export const isAdminAuthenticated = () => {
    const token = getAdminToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now() && payload.role === 'ADMIN';
    } catch {
        return false;
    }
};

const adminHeader = () => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};


const call = async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...adminHeader(), ...options.headers },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
};

export const adminLogin = async (adminId, password) => {
    const res = await call('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ adminId, password }),
    });
    return res;
};

export const adminFetchZones = async () => {
    const res = await call('/admin/zones');
    if (res.success && res.data) return res.data;
    throw new Error('Invalid response');
};

export const adminUpdateZoneStatus = async (zoneId, status) => {
    const res = await call(`/admin/zones/${zoneId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return res;
};
