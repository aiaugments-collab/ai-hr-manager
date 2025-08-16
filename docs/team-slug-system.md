# Team Slug System

This system transforms ugly UUID-based team URLs into human-readable slugs.

## Before & After

**Before:**
```
http://localhost:3000/dashboard/0aeb81b5-a930-4c70-a9a7-11850f3c339d
```

**After:**
```
http://localhost:3000/dashboard/acme-corp
http://localhost:3000/dashboard/tech-startup
http://localhost:3000/dashboard/hr-team
```

## How It Works

### 1. Slug Generation
- Automatically generated from team display name
- Example: "Acme Corporation" → "acme-corporation"
- Ensures uniqueness by appending numbers if needed
- Validates format (lowercase letters, numbers, hyphens only)

### 2. Backward Compatibility
- Original UUID URLs still work
- System resolves both slugs and UUIDs
- No breaking changes for existing links

### 3. Frontend Integration
- New `useTeamSlug()` hook resolves team identifiers
- `useTeamUrls()` hook generates slug-based URLs
- Automatic navigation updates

### 4. API Resolution
- All API endpoints accept both slugs and UUIDs
- `ApiTeamResolver` handles conversion transparently
- No changes needed in business logic

## Usage Examples

### Creating a Team Slug
```typescript
import { TeamSlugService } from '@/lib/services/team-slug-service';

// Create slug for new team
const result = await TeamSlugService.createOrUpdateTeamSlug(teamId, {
  displayName: 'Acme Corporation',
  preferredSlug: 'acme-corp' // optional
});

if (result.success) {
  console.log('Slug created:', result.slug); // 'acme-corp'
}
```

### Using in Components
```typescript
import { useTeamSlug, useTeamUrls } from '@/lib/hooks/use-team-slug';

function MyComponent() {
  const { teamId, teamSlug, isLoading } = useTeamSlug();
  const urls = useTeamUrls();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Team: {teamSlug}</p>
      <a href={urls.candidates()}>View Candidates</a>
      <a href={urls.documents()}>View Documents</a>
    </div>
  );
}
```

### API Endpoint Usage
```typescript
// API route automatically resolves slug to UUID
export async function GET(request: NextRequest) {
  const teamId = await ApiTeamResolver.getResolvedTeamId(request);
  // teamId is now the UUID regardless of whether slug or UUID was passed
}
```

## Migration

For existing teams without slugs, use the migration utility:

```typescript
import { TeamSlugMigration } from '@/lib/utils/migrate-team-slugs';

// For a single team
const slug = await TeamSlugMigration.ensureTeamHasSlug(teamId, displayName);

// For multiple teams
const results = await TeamSlugMigration.migrateTeams([
  { id: 'uuid1', displayName: 'Team A' },
  { id: 'uuid2', displayName: 'Team B' }
]);
```

## Reserved Slugs

The following slugs are reserved and cannot be used:
- `api`, `www`, `admin`, `dashboard`, `app`
- `team`, `teams`, `user`, `users`, `account`
- `settings`, `config`, `help`, `support`, `docs`

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Database      │
│                 │    │                 │    │                 │
│ - useTeamSlug() │───▶│ ApiTeamResolver │───▶│ team_slugs      │
│ - useTeamUrls() │    │ - resolveTeamId │    │ collection      │
│                 │    │ - getSlugFromId │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The system maintains a mapping table in Firestore:
```typescript
interface TeamSlug {
  id: string;        // Stack Auth team UUID
  slug: string;      // Human-readable slug
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Features

✅ **Human-readable URLs** - Easy to share and remember  
✅ **Backward compatibility** - Old UUID links still work  
✅ **Automatic generation** - Slugs created from team names  
✅ **Uniqueness enforcement** - No duplicate slugs  
✅ **Reserved word protection** - Prevents conflicts  
✅ **Type-safe hooks** - Full TypeScript support  
✅ **Transparent API resolution** - Works with existing code
