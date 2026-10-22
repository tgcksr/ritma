const TURKISH_FOLD: Record<string, string> = {
  ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
};

/**
 * Folds text into an accent-insensitive, case-insensitive search key.
 * SQLite's LIKE only folds ASCII case, so we persist this key and search against it.
 */
export function normalizeSearch(value: string): string {
  return value
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (char) => TURKISH_FOLD[char] ?? char)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, '');
}
