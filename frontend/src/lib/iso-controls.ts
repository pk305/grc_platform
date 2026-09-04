/**
 * The ISO/IEC 27001:2022 Annex A controls the platform's own configuration
 * implements.
 *
 * Clause strings are spelled the same way as the `isoClause` values stored
 * against permissions (see the catalog in the backend's
 * `0005_seed_permissions` migration), so a clause shown next to a setting
 * reads identically to the one shown next to a permission.
 */
export const ISO_CONTROL_TITLE: Record<string, string> = {
  'A.5.1': 'Policies for information security',
  'A.5.15': 'Access control',
  'A.5.16': 'Identity management',
  'A.5.17': 'Authentication information',
  'A.5.18': 'Access rights',
  'A.5.34': 'Privacy and protection of PII',
  'A.8.2': 'Privileged access rights',
  'A.8.5': 'Secure authentication',
  'A.8.15': 'Logging',
  'A.8.16': 'Monitoring activities'
};

/** Full reference for a clause — the tooltip behind a bare clause number. */
export function isoControlLabel(clause: string): string {
  const title = ISO_CONTROL_TITLE[clause];
  return title
    ? `ISO/IEC 27001:2022 ${clause} — ${title}`
    : `ISO/IEC 27001:2022 ${clause}`;
}
