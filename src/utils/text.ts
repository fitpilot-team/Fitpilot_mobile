const REMOTE_MOJIBAKE_PATTERN =
  /\u00c3|\u00c2|\u00e2|\u00ef\u00bf\u00bd|\ufffd/;

const REMOTE_MOJIBAKE_REPLACEMENTS: [string, string][] = [
  ['\u00e2\u20ac\u00a2', '\u2022'],
  ['\u00e2\u20ac\u201c', '\u2013'],
  ['\u00e2\u20ac\u201d', '\u2014'],
  ['\u00e2\u20ac\u02dc', '\u2018'],
  ['\u00e2\u20ac\u2122', '\u2019'],
  ['\u00e2\u20ac\u0153', '\u201c'],
  ['\u00e2\u20ac\u009d', '\u201d'],
  ['\u00e2\u20ac\u00a6', '\u2026'],
  ['\u00c3\u00a1', '\u00e1'],
  ['\u00c3\u00a9', '\u00e9'],
  ['\u00c3\u00ad', '\u00ed'],
  ['\u00c3\u00b3', '\u00f3'],
  ['\u00c3\u00ba', '\u00fa'],
  ['\u00c3\u0081', '\u00c1'],
  ['\u00c3\u0089', '\u00c9'],
  ['\u00c3\u008d', '\u00cd'],
  ['\u00c3\u0093', '\u00d3'],
  ['\u00c3\u009a', '\u00da'],
  ['\u00c3\u00b1', '\u00f1'],
  ['\u00c3\u0091', '\u00d1'],
  ['\u00c3\u00bc', '\u00fc'],
  ['\u00c3\u009c', '\u00dc'],
  ['\u00c2\u00a1', '\u00a1'],
  ['\u00c2\u00bf', '\u00bf'],
];

/**
 * Attempt to fix latin1-as-UTF8 mojibake by re-decoding the string.
 * When a UTF-8 string is read as latin1 and then encoded back to UTF-8,
 * characters like í (U+00ED) become Ã­ (C3 AD read as two latin1 chars).
 * This function reverses that process.
 */
const tryFixLatin1AsUtf8 = (value: string): string => {
  try {
    const bytes = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      // Only valid if all chars fit in a single byte (latin1 range)
      if (code > 255) {
        return value;
      }
      bytes[i] = code;
    }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Only accept the result if it's shorter (multi-byte sequences collapse)
    // and doesn't have replacement characters
    if (decoded.length < value.length && !decoded.includes('\ufffd')) {
      return decoded;
    }
  } catch {
    // Not valid UTF-8 byte sequence, return original
  }
  return value;
};

export const normalizeRemoteText = (value: string): string => {
  // Replace the Unicode replacement character with nothing
  let result = value.replace(/\ufffd/g, '');

  if (!REMOTE_MOJIBAKE_PATTERN.test(result)) {
    return result;
  }

  // First pass: known character-pair substitutions
  result = REMOTE_MOJIBAKE_REPLACEMENTS.reduce(
    (currentValue, [from, to]) => currentValue.split(from).join(to),
    result,
  ).replace(/\u00c2/g, '');

  // Second pass: if mojibake markers remain, try full latin1→UTF8 re-decode
  if (REMOTE_MOJIBAKE_PATTERN.test(result)) {
    result = tryFixLatin1AsUtf8(result);
  }

  return result;
};

export const normalizeOptionalRemoteText = (
  value: string | null | undefined,
): string | null => {
  const trimmedValue = value?.trim() ?? '';
  return trimmedValue ? normalizeRemoteText(trimmedValue) : null;
};

export const normalizeComparableText = (
  value: string | null | undefined,
): string | null => {
  const normalizedValue = normalizeOptionalRemoteText(value);
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};
