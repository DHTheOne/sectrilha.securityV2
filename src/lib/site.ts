/**
 * Canonical public origin used for metadata, the sitemap and robots.
 * Override per environment with NEXT_PUBLIC_SITE_URL (see .env.example).
 * The localhost fallback keeps local builds working; production deploys
 * MUST set NEXT_PUBLIC_SITE_URL so canonical/OpenGraph/sitemap URLs are correct.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
