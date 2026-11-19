/**
 * Parses and validates numeric text input for nutrition, workout, and body metrics.
 * Rejects non-numeric strings (e.g. "12abc"), NaN, Infinity, and values below min.
 */
export function parseNumericInput(raw, options = {}) {
  const {
    allowEmpty = false,
    emptyValue = 0,
    min = 0,
    allowZero = true,
    integer = false,
  } = options;

  const trimmed = String(raw ?? '').trim();
  if (trimmed === '') {
    if (allowEmpty) {
      return { valid: true, value: emptyValue, isEmpty: true };
    }
    return { valid: false, value: null, isEmpty: true };
  }

  // Normalize comma decimal separator if entered, and ensure the full token is numeric.
  const normalized = trimmed.replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return { valid: false, value: null, isEmpty: false };
  }

  const parsed = integer ? Number.parseInt(normalized, 10) : Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return { valid: false, value: null, isEmpty: false };
  }

  if (parsed < min || (!allowZero && parsed === 0)) {
    return { valid: false, value: parsed, isEmpty: false };
  }

  return { valid: true, value: parsed, isEmpty: false };
}

/**
 * Validates an external image URL or image data URI for progress photos.
 */
export function isValidImageUrl(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return false;
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
