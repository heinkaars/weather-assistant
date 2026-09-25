/**
 * Builds a matcher for ALLOWED_ORIGINS entries.
 *
 * Entries are exact origins, except that `*` matches one or more of [a-z0-9-].
 * That covers the variable part of a hostname label (e.g. Vercel preview URLs,
 * `https://app-*-team.vercel.app`) but can never span a `.`, `/` or `:`, so a
 * wildcard entry cannot be satisfied by a different domain, path or port.
 */
export function createOriginMatcher(allowed: readonly string[]): (origin: string) => boolean {
  const exact = new Set<string>();
  const patterns: RegExp[] = [];

  for (const entry of allowed) {
    const normalized = entry.trim().replace(/\/$/, '').toLowerCase();
    if (!normalized) continue;

    if (normalized.includes('*')) {
      const source = normalized
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[a-z0-9-]+');
      patterns.push(new RegExp(`^${source}$`));
    } else {
      exact.add(normalized);
    }
  }

  return (origin) => {
    const normalized = origin.replace(/\/$/, '').toLowerCase();
    return exact.has(normalized) || patterns.some((pattern) => pattern.test(normalized));
  };
}
