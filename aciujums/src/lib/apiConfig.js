// Central API base URL.
// NEXT_PUBLIC_API_URL is injected by SST at build time.
// Fallback keeps the old API working during the transition before re-deploy.
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
    'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api';
