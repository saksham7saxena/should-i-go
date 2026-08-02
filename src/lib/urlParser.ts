// URL Parser and Normalization Utilities V3

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();
    
    // Remove trailing slash safely
    let pathname = parsed.pathname.replace(/\/$/, '');
    if (!pathname) pathname = '';

    // Strip common tracking query parameters (utm_*, ref, fbclid, gclid) while preserving event ID parameters (id, event_id, e)
    const searchParams = new URLSearchParams(parsed.search);
    const keysToDelete: string[] = [];
    searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.startsWith('utm_') ||
        lowerKey === 'ref' ||
        lowerKey === 'fbclid' ||
        lowerKey === 'gclid' ||
        lowerKey === 'mc_cid' ||
        lowerKey === 'mc_eid'
      ) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((k) => searchParams.delete(k));

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    return `${parsed.protocol}//${hostname}${pathname}${queryString}`;
  } catch (_) {
    return rawUrl.trim().toLowerCase();
  }
}

export function formatEventDate(dateString: string | null): string {
  if (!dateString) return 'Date unlisted';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date unlisted';

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (_) {
    return 'Date unlisted';
  }
}

export function formatEventPrice(price: number | null, currency: string | null = 'USD'): string {
  if (price === null || price === undefined) return 'Price unlisted';
  if (price === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  } catch (_) {
    return `$${price}`;
  }
}
