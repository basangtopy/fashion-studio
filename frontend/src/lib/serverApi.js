
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

/**
 * Fetch data from the backend in a server component.
 * Uses Next.js fetch() which supports { next: { revalidate } } for ISR.
 *
 * @param {string} path       - e.g. "/styles"
 * @param {object} params     - query params object e.g. { isFeatured: true, limit: 4 }
 * @param {object} fetchOpts  - Next.js fetch options e.g. { next: { revalidate: 3600 } }
 */
export async function serverFetch(path, params = {}, fetchOpts = {}) {
  const url = new URL(`${BACKEND_URL}/api${path}`);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, String(val));
    }
  });

  try {
    const res = await fetch(url.toString(), {
      // Default: revalidate every hour. Callers can override.
      next: { revalidate: 3600 },
      ...fetchOpts,
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    // Network error or backend down during build/request — return null
    // so the client-side useQuery fallback handles it gracefully
    return null;
  }
}