export const PUBLIC_APP_URL = normalizeUrl(
  import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin,
);

function normalizeUrl(value) {
  try {
    return new URL(value).origin;
  } catch {
    return window.location.origin;
  }
}
