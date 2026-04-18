const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const backendOrigin = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
})();

export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  const url = rawUrl.trim();
  if (!url) return url;

  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  if (!backendOrigin) {
    return url;
  }

  return url.startsWith('/') ? `${backendOrigin}${url}` : `${backendOrigin}/${url}`;
};
