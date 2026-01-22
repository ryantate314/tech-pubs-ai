# Feature: Document Filter Wizard

## Overview

A multi-step wizard interface that guides aircraft owners through selecting their aircraft configuration and desired document type. The wizard progressively narrows down available documents based on sequential selections: Platform → Generation → Document Category → Document Type.

---

## Problem Statement

Aircraft owners need to find specific technical publications for their aircraft. Currently, all documents are displayed in a single list without filtering, making it difficult to locate the relevant documentation. Owners need a guided experience that understands aircraft variants and document hierarchies.

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Select Platform                                        │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │    SR2X      │  │    SF50      │                            │
│  │  (SR20/SR22) │  │  (Vision Jet)│                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Select Generation                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────┐     │
│  │ G1 │ │ G2 │ │ G3 │ │ G4 │ │ G5 │ │ G6 │ │ G7 │ │ G7+ │     │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └─────┘     │
│  (Available options depend on selected platform)                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Select Document Category                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Service    │  │    Pilot     │  │    Other     │          │
│  │ Publications │  │ Publications │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐                                               │
│  │  Temporary   │                                               │
│  │  Revisions   │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Select Document Type                                   │
│  (Options depend on selected category)                          │
│                                                                 │
│  Example for "Service Publications":                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ AMM │ │ IPC │ │ WM  │ │ SB  │ │ SA  │ │CCMM │ │ FIM │...   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Results: Filtered Documents List                               │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Document Name          │ Type │ Updated    │ Actions       ││
│  │ SR22 G6 AMM Rev 12     │ AMM  │ 2024-01-15 │ [View] [DL]   ││
│  │ SR22 G6 AMM Rev 11     │ AMM  │ 2023-09-20 │ [View] [DL]   ││
│  └────────────────────────────────────────────────────────────┘│
│  [← Back to Wizard] [Clear Filters]                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model Changes

### New Tables

#### 1. `platforms` table
Represents aircraft platform families (SR2X covers SR20/SR22 series).

```sql
CREATE TABLE platforms (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,     -- 'SR2X', 'SF50'
    name VARCHAR(100) NOT NULL,           -- 'SR2X (SR20/SR22)', 'SF50 (Vision Jet)'
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO platforms (code, name, description, display_order) VALUES
    ('SR2X', 'SR2X (SR20/SR22)', 'Cirrus SR20 and SR22 piston aircraft family', 1),
    ('SF50', 'SF50 (Vision Jet)', 'Cirrus SF50 Vision Jet', 2);
```

#### 2. `generations` table
Represents aircraft generations, linked to platforms.

```sql
CREATE TABLE generations (
    id BIGSERIAL PRIMARY KEY,
    platform_id BIGINT NOT NULL REFERENCES platforms(id),
    code VARCHAR(10) NOT NULL,            -- 'G1', 'G2', ..., 'G7+'
    name VARCHAR(50) NOT NULL,            -- 'Generation 1', 'Generation 7+'
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_id, code)
);

-- Seed data for SR2X
INSERT INTO generations (platform_id, code, name, display_order)
SELECT p.id, g.code, g.name, g.display_order
FROM platforms p
CROSS JOIN (VALUES
    ('G1', 'Generation 1', 1),
    ('G2', 'Generation 2', 2),
    ('G3', 'Generation 3', 3),
    ('G4', 'Generation 4', 4),
    ('G5', 'Generation 5', 5),
    ('G6', 'Generation 6', 6),
    ('G7', 'Generation 7', 7)
) AS g(code, name, display_order)
WHERE p.code = 'SR2X';

-- Seed data for SF50
INSERT INTO generations (platform_id, code, name, display_order)
SELECT p.id, g.code, g.name, g.display_order
FROM platforms p
CROSS JOIN (VALUES
    ('G1', 'Generation 1', 1),
    ('G2', 'Generation 2', 2),
    ('G2+', 'Generation 2+', 3)
) AS g(code, name, display_order)
WHERE p.code = 'SF50';
```

#### 3. `document_categories` table
Replaces/enhances the existing `categories` table with wizard-specific categories.

```sql
CREATE TABLE document_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,     -- 'service', 'pilot', 'other', 'temp'
    name VARCHAR(100) NOT NULL,           -- 'Service Publications', etc.
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO document_categories (code, name, description, display_order) VALUES
    ('service', 'Service Publications', 'Maintenance and service documentation', 1),
    ('pilot', 'Pilot Publications', 'Pilot operating documentation', 2),
    ('other', 'Other', 'Miscellaneous documentation', 3),
    ('temp', 'Temporary Revisions', 'Temporary revision documents', 4);
```

#### 4. `document_types` table
Specific document types within each category.

```sql
CREATE TABLE document_types (
    id BIGSERIAL PRIMARY KEY,
    document_category_id BIGINT NOT NULL REFERENCES document_categories(id),
    code VARCHAR(10) NOT NULL UNIQUE,     -- 'AMM', 'IPC', 'POH', etc.
    name VARCHAR(100) NOT NULL,           -- 'Airplane Maintenance Manual', etc.
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Publications
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('AMM', 'Airplane Maintenance Manual', 1),
    ('IPC', 'Illustrated Parts Catalog', 2),
    ('WM', 'Wiring Manual', 3),
    ('SB', 'Service Bulletin', 4),
    ('SA', 'Service Advisory', 5),
    ('CCMM', 'CAPS CMM', 6),
    ('FIM', 'Fault Isolation Manual', 7),
    ('LAG', 'Labor Allowance Guide', 8)
) AS dt(code, name, display_order)
WHERE dc.code = 'service';

-- Pilot Publications
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('POH', 'Pilot''s Operating Handbook', 1),
    ('AFM', 'Airplane Flight Manual', 2),
    ('PIM', 'Pilot''s Information Manual', 3),
    ('AC', 'Abbreviated Checklist', 4),
    ('EC', 'Electronic Checklist', 5),
    ('SS', 'Startup Screen', 6)
) AS dt(code, name, display_order)
WHERE dc.code = 'pilot';

-- Other
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('MISC', 'Miscellaneous', 1),
    ('SAPP', 'Supplement AFM/PIM/POH', 2)
) AS dt(code, name, display_order)
WHERE dc.code = 'other';

-- Temporary Revisions
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('TRAMM', 'Temporary Revision - AMM', 1),
    ('TRIPC', 'Temporary Revision - IPC', 2),
    ('TRWM', 'Temporary Revision - WM', 3),
    ('TRCC', 'Temporary Revision - CCMM', 4),
    ('TRF', 'Temporary Revision - FIM', 5),
    ('TRAPP', 'Temporary Revision - APP', 6)
) AS dt(code, name, display_order)
WHERE dc.code = 'temp';
```

### Modify Existing `documents` Table

Add foreign keys to link documents to the new classification system:

```sql
ALTER TABLE documents
    ADD COLUMN platform_id BIGINT REFERENCES platforms(id),
    ADD COLUMN generation_id BIGINT REFERENCES generations(id),
    ADD COLUMN document_type_id BIGINT REFERENCES document_types(id);

CREATE INDEX idx_documents_platform ON documents(platform_id);
CREATE INDEX idx_documents_generation ON documents(generation_id);
CREATE INDEX idx_documents_document_type ON documents(document_type_id);

-- Composite index for wizard filtering
CREATE INDEX idx_documents_wizard_filter
    ON documents(platform_id, generation_id, document_type_id)
    WHERE deleted_at IS NULL;
```

---

## Flyway Migrations

All schema changes and seed data **must** be included in Flyway migration files so that any developer can run `make db-migrate` and get an identical database state. This ensures reproducibility across local development environments.

### Migration File Structure

Create a new migration file in `database/migrations/`:

```
database/migrations/
├── V1__initial_schema.sql          # Existing
├── V2__add_wizard_tables.sql       # NEW - Schema + Seed Data
```

### Migration File: `V2__add_wizard_tables.sql`

This single migration should contain:

1. **Table Creation** (DDL) - All new tables in dependency order
2. **Seed Data** (DML) - All reference data that every environment needs

```sql
-- ============================================
-- V2__add_wizard_tables.sql
-- Adds document filter wizard tables and seed data
-- ============================================

-- ---------------------------------------------
-- 1. PLATFORMS
-- ---------------------------------------------
CREATE TABLE platforms (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platforms (code, name, description, display_order) VALUES
    ('SR2X', 'SR2X (SR20/SR22)', 'Cirrus SR20 and SR22 piston aircraft family', 1),
    ('SF50', 'SF50 (Vision Jet)', 'Cirrus SF50 Vision Jet', 2);

-- ---------------------------------------------
-- 2. GENERATIONS (depends on platforms)
-- ---------------------------------------------
CREATE TABLE generations (
    id BIGSERIAL PRIMARY KEY,
    platform_id BIGINT NOT NULL REFERENCES platforms(id),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_id, code)
);

-- SR2X generations
INSERT INTO generations (platform_id, code, name, display_order)
SELECT p.id, g.code, g.name, g.display_order
FROM platforms p
CROSS JOIN (VALUES
    ('G1', 'Generation 1', 1),
    ('G2', 'Generation 2', 2),
    ('G3', 'Generation 3', 3),
    ('G4', 'Generation 4', 4),
    ('G5', 'Generation 5', 5),
    ('G6', 'Generation 6', 6),
    ('G7', 'Generation 7', 7)
) AS g(code, name, display_order)
WHERE p.code = 'SR2X';

-- SF50 generations
INSERT INTO generations (platform_id, code, name, display_order)
SELECT p.id, g.code, g.name, g.display_order
FROM platforms p
CROSS JOIN (VALUES
    ('G1', 'Generation 1', 1),
    ('G2', 'Generation 2', 2),
    ('G2+', 'Generation 2+', 3)
) AS g(code, name, display_order)
WHERE p.code = 'SF50';

-- ---------------------------------------------
-- 3. DOCUMENT CATEGORIES
-- ---------------------------------------------
CREATE TABLE document_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO document_categories (code, name, description, display_order) VALUES
    ('service', 'Service Publications', 'Maintenance and service documentation', 1),
    ('pilot', 'Pilot Publications', 'Pilot operating documentation', 2),
    ('other', 'Other', 'Miscellaneous documentation', 3),
    ('temp', 'Temporary Revisions', 'Temporary revision documents', 4);

-- ---------------------------------------------
-- 4. DOCUMENT TYPES (depends on document_categories)
-- ---------------------------------------------
CREATE TABLE document_types (
    id BIGSERIAL PRIMARY KEY,
    document_category_id BIGINT NOT NULL REFERENCES document_categories(id),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Publications
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('AMM', 'Airplane Maintenance Manual', 1),
    ('IPC', 'Illustrated Parts Catalog', 2),
    ('WM', 'Wiring Manual', 3),
    ('SB', 'Service Bulletin', 4),
    ('SA', 'Service Advisory', 5),
    ('CCMM', 'CAPS CMM', 6),
    ('FIM', 'Fault Isolation Manual', 7),
    ('LAG', 'Labor Allowance Guide', 8)
) AS dt(code, name, display_order)
WHERE dc.code = 'service';

-- Pilot Publications
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('POH', 'Pilot''s Operating Handbook', 1),
    ('AFM', 'Airplane Flight Manual', 2),
    ('PIM', 'Pilot''s Information Manual', 3),
    ('AC', 'Abbreviated Checklist', 4),
    ('EC', 'Electronic Checklist', 5),
    ('SS', 'Startup Screen', 6)
) AS dt(code, name, display_order)
WHERE dc.code = 'pilot';

-- Other
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('MISC', 'Miscellaneous', 1),
    ('SAPP', 'Supplement AFM/PIM/POH', 2)
) AS dt(code, name, display_order)
WHERE dc.code = 'other';

-- Temporary Revisions
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('TRAMM', 'Temporary Revision - AMM', 1),
    ('TRIPC', 'Temporary Revision - IPC', 2),
    ('TRWM', 'Temporary Revision - WM', 3),
    ('TRCC', 'Temporary Revision - CCMM', 4),
    ('TRF', 'Temporary Revision - FIM', 5),
    ('TRAPP', 'Temporary Revision - APP', 6)
) AS dt(code, name, display_order)
WHERE dc.code = 'temp';

-- ---------------------------------------------
-- 5. ALTER DOCUMENTS TABLE
-- ---------------------------------------------
ALTER TABLE documents
    ADD COLUMN platform_id BIGINT REFERENCES platforms(id),
    ADD COLUMN generation_id BIGINT REFERENCES generations(id),
    ADD COLUMN document_type_id BIGINT REFERENCES document_types(id);

CREATE INDEX idx_documents_platform ON documents(platform_id);
CREATE INDEX idx_documents_generation ON documents(generation_id);
CREATE INDEX idx_documents_document_type ON documents(document_type_id);

-- Composite index for wizard filtering
CREATE INDEX idx_documents_wizard_filter
    ON documents(platform_id, generation_id, document_type_id)
    WHERE deleted_at IS NULL;
```

### Developer Workflow

Any developer setting up the project locally should:

```bash
# 1. Start local PostgreSQL (or connect to dev instance)
# 2. Configure database/.env with connection string

# 3. Run all migrations (schema + seed data)
make db-migrate

# 4. Verify migration status
make db-info
```

This ensures every developer has:
- Identical table schemas
- Same reference data (platforms, generations, categories, types)
- Consistent foreign key relationships

### Important Notes

1. **Seed data is NOT optional** - The wizard UI depends on this reference data existing
2. **Order matters** - Tables must be created before their dependents (platforms → generations)
3. **Idempotent inserts** - Using `UNIQUE` constraints prevents duplicate seed data if migration is somehow re-run
4. **No environment-specific data** - Only include data that ALL environments need (dev, staging, prod)

---

## API Endpoints

### New Endpoints

#### GET `/api/platforms`
Returns all platforms.

**Response:**
```json
{
  "platforms": [
    { "id": 1, "code": "SR2X", "name": "SR2X (SR20/SR22)" },
    { "id": 2, "code": "SF50", "name": "SF50 (Vision Jet)" }
  ]
}
```

#### GET `/api/platforms/{platform_id}/generations`
Returns generations for a specific platform.

**Response:**
```json
{
  "generations": [
    { "id": 1, "code": "G1", "name": "Generation 1" },
    { "id": 2, "code": "G2", "name": "Generation 2" },
    ...
  ]
}
```

#### GET `/api/document-categories`
Returns all document categories.

**Response:**
```json
{
  "categories": [
    { "id": 1, "code": "service", "name": "Service Publications" },
    { "id": 2, "code": "pilot", "name": "Pilot Publications" },
    ...
  ]
}
```

#### GET `/api/document-categories/{category_id}/types`
Returns document types for a specific category.

**Response:**
```json
{
  "types": [
    { "id": 1, "code": "AMM", "name": "Airplane Maintenance Manual" },
    { "id": 2, "code": "IPC", "name": "Illustrated Parts Catalog" },
    ...
  ]
}
```

#### GET `/api/documents` (Enhanced)
Add query parameters for wizard filtering:

**Query Parameters:**
- `platform_id` (optional): Filter by platform
- `generation_id` (optional): Filter by generation
- `document_category_id` (optional): Filter by category
- `document_type_id` (optional): Filter by type

**Response:** Same as current, but filtered results.

---

## UI Components

### New Components

#### 1. `WizardContainer` (`components/wizard/WizardContainer.tsx`)
Main wizard orchestration component.

```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 'results';
  platformId: number | null;
  generationId: number | null;
  categoryId: number | null;
  typeId: number | null;
}

// Features:
// - Step indicator showing progress
// - Back/Next navigation
// - State persistence (localStorage)
// - Animated transitions between steps
```

#### 2. `WizardStep` (`components/wizard/WizardStep.tsx`)
Reusable step wrapper with consistent styling.

```typescript
interface WizardStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}
```

#### 3. `PlatformSelector` (`components/wizard/steps/PlatformSelector.tsx`)
Step 1: Large clickable cards for platform selection.

```typescript
// Displays platform options as visual cards
// Shows aircraft silhouette/icon for each platform
// Highlights selected option
// Auto-advances to next step on selection
```

#### 4. `GenerationSelector` (`components/wizard/steps/GenerationSelector.tsx`)
Step 2: Generation selection grid.

```typescript
// Fetches generations based on selected platform
// Displays as horizontal button group or grid
// Shows generation code prominently (G1, G2, etc.)
// Disabled options for generations with no documents (future enhancement)
```

#### 5. `CategorySelector` (`components/wizard/steps/CategorySelector.tsx`)
Step 3: Document category cards.

```typescript
// Displays categories with icons:
// - Service: wrench icon
// - Pilot: airplane/cockpit icon
// - Other: folder icon
// - Temp Revisions: clock/warning icon
```

#### 6. `TypeSelector` (`components/wizard/steps/TypeSelector.tsx`)
Step 4: Document type selection.

```typescript
// Fetches types based on selected category
// Displays as list with code and full name
// Example: "AMM - Airplane Maintenance Manual"
```

#### 7. `WizardResults` (`components/wizard/WizardResults.tsx`)
Results display with active filters.

```typescript
// Shows filter summary bar: "SR2X > G6 > Service > AMM"
// Displays filtered documents table
// Quick actions: Clear filters, Modify filters (goes back to relevant step)
// Empty state when no documents match
```

#### 8. `StepIndicator` (`components/wizard/StepIndicator.tsx`)
Visual progress indicator.

```typescript
// Shows steps: Platform → Generation → Category → Type → Results
// Highlights current step
// Clickable to jump to completed steps
// Shows checkmarks for completed steps
```

---

## Page Structure

### New Page: `/app/wizard/page.tsx`
Main wizard page for end users.

```typescript
// Server component that renders WizardContainer
// Prefetches initial data (platforms, categories)
// Sets page metadata
```

### Route: `/wizard`
- Primary entry point for aircraft owners
- Mobile-responsive design
- Full-screen wizard experience

---

## State Management

### Wizard State (React Context or URL State)

Option A: **URL State** (Recommended)
```
/wizard?platform=SR2X&generation=G6&category=service&type=AMM
```
- Shareable links
- Browser back/forward works naturally
- SEO-friendly (if needed)
- Easy to bookmark specific configurations

Option B: **React Context + localStorage**
```typescript
const WizardContext = createContext<WizardContextType>(null);

// Persist selections in localStorage for returning users
// Restore state on page load
```

---

## UI/UX Specifications

### Visual Design

1. **Step Cards**
   - Large, touch-friendly targets (min 48px)
   - Clear hover/focus states
   - Selected state with accent color
   - Subtle shadows for depth

2. **Progress Indicator**
   - Horizontal stepper at top
   - Current step highlighted
   - Completed steps show checkmark
   - Future steps grayed out

3. **Transitions**
   - Slide animation between steps (left/right based on direction)
   - Fade in for new content
   - Smooth height transitions

4. **Mobile Responsiveness**
   - Full-width cards on mobile
   - Stacked layout for selections
   - Bottom navigation on mobile
   - Touch-optimized spacing

### Accessibility

- Keyboard navigation (Tab, Enter, Arrow keys)
- ARIA labels for all interactive elements
- Focus management between steps
- Screen reader announcements for step changes
- High contrast mode support

---

## Implementation Phases

### Phase 1: Database & API
1. Create Flyway migration `V2__add_wizard_tables.sql` in `database/migrations/`
   - Schema creation (tables, indexes, constraints)
   - Seed data (platforms, generations, categories, types)
   - Documents table alterations (new foreign keys)
2. Run `make db-migrate` to apply migration locally
3. Verify with `make db-info` that migration succeeded
4. Add SQLAlchemy models to `techpubs-core` (`Platform`, `Generation`, `DocumentCategory`, `DocumentType`)
5. Create API endpoints for platforms, generations, categories, types
6. Enhance `/api/documents` with filter parameters

### Phase 2: UI Foundation
1. Create wizard page and routing
2. Build `WizardContainer` with step management
3. Implement `StepIndicator` component
4. Create `WizardStep` wrapper component
5. Add basic navigation (back/next)

### Phase 3: Step Components
1. Build `PlatformSelector` with platform cards
2. Build `GenerationSelector` with dynamic loading
3. Build `CategorySelector` with category cards
4. Build `TypeSelector` with type list
5. Wire up API calls for each step

### Phase 4: Results & Polish
1. Build `WizardResults` with filtered document list
2. Add URL state management for shareable links
3. Add localStorage persistence for returning users
4. Implement animations and transitions
5. Mobile responsiveness pass
6. Accessibility audit and fixes

### Phase 5: Admin Integration
1. Update upload form to use new classification fields
2. Add document type selection to FileUploader
3. Update document list to show new classification

---

## Out of Scope (Future Considerations)

- **User Profiles**: Saving aircraft configuration per user account
- **Document Availability**: Showing only categories/types that have documents
- **Multi-Aircraft**: Owners with multiple aircraft selecting different configs
- **Search Integration**: Combining wizard filters with semantic search
- **Favorites**: Bookmarking frequently accessed document types
- **Notifications**: Alerting users to new documents matching their config

---

## Success Criteria

1. User can navigate through all 4 wizard steps
2. Each step shows only relevant options based on previous selections
3. Filtered results display correct documents
4. URL state allows sharing specific configurations
5. Mobile experience is fully functional
6. All document types from requirements are seeded in database
7. Admin can upload documents with new classification fields
