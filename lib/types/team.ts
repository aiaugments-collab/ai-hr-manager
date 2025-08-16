export interface TeamSlug {
  id: string; // Stack Auth team UUID
  slug: string; // Human-readable slug like 'acme-corp'
  displayName: string; // Team display name
  createdAt: Date;
  updatedAt: Date;
}

export interface SlugGenerationOptions {
  displayName: string;
  preferredSlug?: string;
}
