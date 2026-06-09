export const getApiUrl = (path: string): string => {
  // If VITE_API_URL is configured (e.g. in Vercel env), use it.
  // Otherwise, default to localhost:3000 if we are on localhost, else relative path.
  const baseUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');
  return `${baseUrl}${path}`;
};
