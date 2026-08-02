// URL Validation and Utility Helpers

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function formatEventPrice(price: number | null): string {
  if (price === null) return 'Price Unspecified';
  if (price === 0) return 'Free';
  return `$${price.toLocaleString()}`;
}

export function formatEventDate(dateString: string | null): string {
  if (!dateString) return 'Date Unspecified';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (_) {
    return dateString;
  }
}
