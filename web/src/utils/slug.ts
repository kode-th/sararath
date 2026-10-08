// Thai has no word spaces to restore, so split on whitespace, drop punctuation
// (any script), and keep letters, numbers, and single hyphens.
export function slugify(value: string) {
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '');
}
