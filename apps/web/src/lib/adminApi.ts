/**
 * Admin dashboard HTTP client. Same credentialed axios instance as `api`
 * (`lum_admin` + session cookies are sent to `VITE_API_URL`).
 * Use this import in `/admin` code so cross-origin cookie behavior stays obvious.
 */
export { api as adminApi } from "./api";
