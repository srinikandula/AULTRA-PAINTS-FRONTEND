// Read import.meta.env once and re-export a typed object. Vite injects these
// at build time based on .env / .env.<mode> files.
type Env = {
  apiUrl: string;
};

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4300/api/';

export const env: Env = { apiUrl };
