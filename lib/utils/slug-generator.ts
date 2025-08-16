/**
 * Utility functions for generating and validating team slugs
 */

export function generateSlugFromName(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Ensure it's not empty
    || 'team';
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 2) {
    return { valid: false, error: 'Slug must be at least 2 characters long' };
  }

  if (slug.length > 50) {
    return { valid: false, error: 'Slug must be no more than 50 characters long' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' };
  }

  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }

  // Reserved slugs that shouldn't be used
  const reservedSlugs = [
    'api', 'www', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog',
    'help', 'support', 'docs', 'status', 'assets', 'static', 'cdn',
    'team', 'teams', 'user', 'users', 'account', 'settings', 'config'
  ];

  if (reservedSlugs.includes(slug)) {
    return { valid: false, error: 'This slug is reserved and cannot be used' };
  }

  return { valid: true };
}

export function generateUniqueSlug(
  baseSlug: string, 
  existingSlugs: string[]
): string {
  const validation = validateSlug(baseSlug);
  if (!validation.valid) {
    baseSlug = generateSlugFromName(baseSlug);
  }

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
