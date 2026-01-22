# Feature: Document Filter Wizard - Phase 1: Database & Models

## Summary

Create the database infrastructure for the document filter wizard by adding 4 new tables (platforms, generations, document_categories, document_types) via Flyway migration with seed data, and corresponding SQLAlchemy models in techpubs-core. This establishes the data foundation for filtering documents by aircraft platform, generation, and document type.

## User Story

As a developer setting up the Tech Pubs project
I want to run `make db-migrate` and have all wizard tables and seed data created
So that the wizard API and UI have consistent reference data across all environments

## Problem Statement

The wizard feature requires structured reference data (platforms, generations, document categories, types) that must be:
1. Version-controlled for reproducibility
2. Identical across dev/staging/prod environments
3. Available via SQLAlchemy models for the API layer

## Solution Statement

Create a single Flyway migration (`V4__add_wizard_tables.sql`) containing all table definitions and seed data, then add corresponding SQLAlchemy models to `techpubs-core` following existing patterns exactly.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | database/migrations, packages/techpubs-core |
| Dependencies | Flyway 11, SQLAlchemy 2.0+, PostgreSQL |
| Estimated Tasks | 5 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  documents  │ ──FK──► │ categories  │         │aircraft_    │            ║
║   │             │ ──FK──► │             │         │models       │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   DATA_FLOW: Documents have category_id and aircraft_model_id FKs            ║
║   LIMITATION: No platform/generation hierarchy, no document types            ║
║   FILTERING: Only by aircraft model (sr22/sr20/sf50) and generic category    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  platforms  │◄──FK────│ generations │         │  document_  │            ║
║   │  (SR2X,SF50)│         │ (G1-G7+)    │         │  categories │            ║
║   └──────┬──────┘         └──────┬──────┘         └──────┬──────┘            ║
║          │                       │                       │                    ║
║          │    ┌──────────────────┼───────────────────────┘                    ║
║          │    │                  │                                            ║
║          ▼    ▼                  ▼                                            ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  documents  │──FK────►│ document_   │◄──FK────│  document_  │            ║
║   │  (3 new FKs)│         │ types       │         │  categories │            ║
║   └─────────────┘         │ (AMM,POH..) │         │(service,    │            ║
║                           └─────────────┘         │ pilot,..)   │            ║
║                                                   └─────────────┘            ║
║                                                                               ║
║   DATA_FLOW: Documents → platform_id → generations available                  ║
║              Documents → document_type_id → category determined               ║
║   VALUE: Hierarchical filtering: Platform → Generation → Category → Type      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Data Model Summary
| Table | Purpose | Relationships |
|-------|---------|---------------|
| platforms | SR2X, SF50 | Has many generations |
| generations | G1-G7+ per platform | Belongs to platform |
| document_categories | service, pilot, other, temp | Has many document_types |
| document_types | AMM, POH, etc. | Belongs to category |
| documents (modified) | +3 FK columns | platform, generation, document_type |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `database/migrations/V1__baseline.sql` | all | SQL style, table patterns, seed data format |
| P0 | `packages/techpubs-core/src/techpubs_core/models.py` | all | SQLAlchemy patterns to MIRROR exactly |
| P1 | `packages/techpubs-core/src/techpubs_core/__init__.py` | all | Export pattern for new models |
| P1 | `database/migrations/V2__split_ingestion_jobs.sql` | all | ALTER TABLE pattern |
| P2 | `init-wizard.md` | 245-456 | Complete migration SQL to use |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [SQLAlchemy 2.0 Mapped Column](https://docs.sqlalchemy.org/en/20/orm/mapped_attributes.html) | mapped_column | Type annotation patterns |
| [Flyway Migrations](https://documentation.red-gate.com/fd/migrations-184127470.html) | Versioned Migrations | Naming convention V{n}__ |

---

## Patterns to Mirror

**TABLE_CREATION** (V1__baseline.sql:7-13):
```sql
-- SOURCE: database/migrations/V1__baseline.sql:7-13
CREATE TABLE aircraft_models (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SEED_DATA_INSERT** (V1__baseline.sql:16-19):
```sql
-- SOURCE: database/migrations/V1__baseline.sql:16-19
INSERT INTO aircraft_models (code, name) VALUES
    ('sr22', 'SR22'),
    ('sr20', 'SR20'),
    ('sf50', 'SF50');
```

**FOREIGN_KEY_INLINE** (V1__baseline.sql:35-36):
```sql
-- SOURCE: database/migrations/V1__baseline.sql:35-36
category_id BIGINT REFERENCES categories(id),
aircraft_model_id BIGINT REFERENCES aircraft_models(id),
```

**INDEX_CREATION** (V1__baseline.sql:83-85):
```sql
-- SOURCE: database/migrations/V1__baseline.sql:83-85
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_guid ON documents(guid);
CREATE INDEX idx_documents_aircraft_model ON documents(aircraft_model_id);
```

**ALTER_TABLE** (V2__split_ingestion_jobs.sql:5-8):
```sql
-- SOURCE: database/migrations/V2__split_ingestion_jobs.sql:5-8
ALTER TABLE document_jobs
ADD COLUMN parent_job_id BIGINT REFERENCES document_jobs(id),
ADD COLUMN chunk_start_index INT,
ADD COLUMN chunk_end_index INT;
```

**SQLALCHEMY_MODEL** (models.py:14-22):
```python
# SOURCE: packages/techpubs-core/src/techpubs_core/models.py:14-22
class AircraftModel(Base):
    __tablename__ = "aircraft_models"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    documents: Mapped[list["Document"]] = relationship(back_populates="aircraft_model")
```

**OPTIONAL_FK_COLUMN** (models.py:43-44):
```python
# SOURCE: packages/techpubs-core/src/techpubs_core/models.py:43-44
aircraft_model_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("aircraft_models.id"), nullable=True)
category_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("categories.id"), nullable=True)
```

**RELATIONSHIP_BACK_POPULATES** (models.py:49-50):
```python
# SOURCE: packages/techpubs-core/src/techpubs_core/models.py:49-50
aircraft_model: Mapped[Optional["AircraftModel"]] = relationship(back_populates="documents")
category: Mapped[Optional["Category"]] = relationship(back_populates="documents")
```

**MODEL_EXPORT** (__init__.py:1-19):
```python
# SOURCE: packages/techpubs-core/src/techpubs_core/__init__.py:1-19
from techpubs_core.models import (
    AircraftModel,
    Base,
    Category,
    Document,
    ...
)

__all__ = [
    "AircraftModel",
    "Base",
    ...
]
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `database/migrations/V4__add_wizard_tables.sql` | CREATE | Flyway migration with schema + seed data |
| `packages/techpubs-core/src/techpubs_core/models.py` | UPDATE | Add Platform, Generation, DocumentCategory, DocumentType models + update Document |
| `packages/techpubs-core/src/techpubs_core/__init__.py` | UPDATE | Export new models |

---

## NOT Building (Scope Limits)

- **API endpoints** - Phase 2 handles this
- **UI components** - Phase 3 handles this
- **Data migration for existing documents** - Existing docs keep NULL for new FKs
- **Validation logic** - Service layer in Phase 2

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `database/migrations/V4__add_wizard_tables.sql`

- **ACTION**: CREATE new Flyway migration file
- **IMPLEMENT**: Full schema + seed data for wizard tables
- **CONTENT** (copy from init-wizard.md Flyway section, lines 266-427):

```sql
-- ============================================
-- V4__add_wizard_tables.sql
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

- **CONFIRMED**: Migration number is V4 (V1__baseline.sql, V2__split_ingestion_jobs.sql, V3__add_chapter_title.sql exist)
- **VALIDATE**: File exists at correct path with proper naming

### Task 2: UPDATE `packages/techpubs-core/src/techpubs_core/models.py` - Add Platform model

- **ACTION**: ADD Platform class after AircraftModel (line ~23)
- **IMPLEMENT**:

```python
class Platform(Base):
    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    generations: Mapped[list["Generation"]] = relationship(back_populates="platform")
    documents: Mapped[list["Document"]] = relationship(back_populates="platform")
```

- **MIRROR**: `models.py:14-22` (AircraftModel pattern)
- **IMPORTS**: Already available - line 6 has `Integer, String, Text` imported
- **VALIDATE**: `cd packages/techpubs-core && uv run python -c "from techpubs_core.models import Platform; print('OK')"`

### Task 3: UPDATE `packages/techpubs-core/src/techpubs_core/models.py` - Add Generation model

- **ACTION**: ADD Generation class after Platform
- **IMPLEMENT**:

```python
class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    platform_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("platforms.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    platform: Mapped["Platform"] = relationship(back_populates="generations")
    documents: Mapped[list["Document"]] = relationship(back_populates="generation")
```

- **MIRROR**: `models.py:43-44` for FK pattern
- **GOTCHA**: `platform_id` is NOT optional (nullable=False) - generations must have a platform
- **VALIDATE**: `cd packages/techpubs-core && uv run python -c "from techpubs_core.models import Generation; print('OK')"`

### Task 4: UPDATE `packages/techpubs-core/src/techpubs_core/models.py` - Add DocumentCategory and DocumentType models

- **ACTION**: ADD DocumentCategory and DocumentType classes
- **IMPLEMENT**:

```python
class DocumentCategory(Base):
    __tablename__ = "document_categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    document_types: Mapped[list["DocumentType"]] = relationship(back_populates="document_category")


class DocumentType(Base):
    __tablename__ = "document_types"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    document_category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("document_categories.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    document_category: Mapped["DocumentCategory"] = relationship(back_populates="document_types")
    documents: Mapped[list["Document"]] = relationship(back_populates="document_type")
```

- **MIRROR**: Same patterns as Platform/Generation
- **VALIDATE**: `cd packages/techpubs-core && uv run python -c "from techpubs_core.models import DocumentCategory, DocumentType; print('OK')"`

### Task 5: UPDATE `packages/techpubs-core/src/techpubs_core/models.py` - Update Document model

- **ACTION**: ADD 3 new FK columns and relationships to Document class
- **IMPLEMENT** (add after existing `category_id` around line 44):

```python
    # Add these columns after category_id
    platform_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("platforms.id"), nullable=True)
    generation_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("generations.id"), nullable=True)
    document_type_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("document_types.id"), nullable=True)

    # Add these relationships after existing relationships
    platform: Mapped[Optional["Platform"]] = relationship(back_populates="documents")
    generation: Mapped[Optional["Generation"]] = relationship(back_populates="documents")
    document_type: Mapped[Optional["DocumentType"]] = relationship(back_populates="documents")
```

- **MIRROR**: `models.py:43-44` and `models.py:49-50`
- **GOTCHA**: All 3 are OPTIONAL (nullable=True) - existing documents won't have values
- **VALIDATE**: `cd packages/techpubs-core && uv run python -c "from techpubs_core.models import Document; print(Document.platform_id); print('OK')"`

### Task 6: UPDATE `packages/techpubs-core/src/techpubs_core/__init__.py` - Export new models

- **ACTION**: ADD new model imports and exports
- **IMPLEMENT**:

```python
from techpubs_core.models import (
    AircraftModel,
    Base,
    Category,
    Document,
    DocumentCategory,  # NEW
    DocumentChunk,
    DocumentJob,
    DocumentType,      # NEW
    DocumentVersion,
    Generation,        # NEW
    Platform,          # NEW
)

__all__ = [
    "AircraftModel",
    "Base",
    "Category",
    "Document",
    "DocumentCategory",  # NEW
    "DocumentChunk",
    "DocumentJob",
    "DocumentType",      # NEW
    "DocumentVersion",
    "Generation",        # NEW
    "Platform",          # NEW
    ...
]
```

- **MIRROR**: Existing export pattern (alphabetical within import block)
- **VALIDATE**: `cd packages/techpubs-core && uv run python -c "from techpubs_core import Platform, Generation, DocumentCategory, DocumentType; print('OK')"`

---

## Testing Strategy

### Validation Tests

| Test | Command | Expected |
|------|---------|----------|
| Migration file exists | `ls database/migrations/V4__add_wizard_tables.sql` | File exists |
| Python imports work | `cd packages/techpubs-core && uv run python -c "from techpubs_core import Platform, Generation, DocumentCategory, DocumentType"` | Exit 0 |
| Models have relationships | `cd packages/techpubs-core && uv run python -c "from techpubs_core.models import Document; print(hasattr(Document, 'platform'))"` | True |

### Edge Cases Checklist

- [x] Existing documents have NULL for new FK columns (handled by nullable=True)
- [x] Generation has required platform_id (nullable=False enforces this)
- [x] DocumentType has required category_id (nullable=False enforces this)
- [x] Unique constraints prevent duplicate codes

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd packages/techpubs-core && uv run python -c "from techpubs_core.models import *; print('All models import OK')"
```

**EXPECT**: Exit 0, prints "All models import OK"

### Level 2: MIGRATION_SYNTAX

```bash
# Verify SQL syntax (dry run not available, but check file exists and is valid SQL)
cat database/migrations/V4__add_wizard_tables.sql | head -20
```

**EXPECT**: Shows migration header and CREATE TABLE statement

### Level 3: DATABASE_MIGRATION (requires DB connection)

```bash
make db-migrate
make db-info
```

**EXPECT**: Migration V4 shows as "Success" in db-info output

### Level 4: SEED_DATA_VERIFICATION (requires DB connection)

```bash
# After migration, verify seed data exists
cd app/api && uv run python -c "
from techpubs_core import get_session, Platform, Generation, DocumentCategory, DocumentType

with get_session() as session:
    platforms = session.query(Platform).all()
    print(f'Platforms: {len(platforms)}')  # Should be 2

    generations = session.query(Generation).all()
    print(f'Generations: {len(generations)}')  # Should be 10 (7 SR2X + 3 SF50)

    categories = session.query(DocumentCategory).all()
    print(f'Categories: {len(categories)}')  # Should be 4

    doc_types = session.query(DocumentType).all()
    print(f'Document Types: {len(doc_types)}')  # Should be 22
"
```

**EXPECT**: Platforms: 2, Generations: 10, Categories: 4, Document Types: 22

---

## Acceptance Criteria

- [ ] `V4__add_wizard_tables.sql` exists in `database/migrations/`
- [ ] Migration creates 4 tables: platforms, generations, document_categories, document_types
- [ ] Migration adds 3 columns to documents: platform_id, generation_id, document_type_id
- [ ] Migration creates 4 indexes on documents table
- [ ] Seed data inserted: 2 platforms, 10 generations, 4 categories, 22 document types
- [ ] SQLAlchemy models exist: Platform, Generation, DocumentCategory, DocumentType
- [ ] Document model has new FK columns and relationships
- [ ] All models exported from `techpubs_core` package
- [ ] `make db-migrate` succeeds without errors
- [ ] `make db-info` shows V4 as applied

---

## Completion Checklist

- [ ] Task 1: Migration file created
- [ ] Task 2: Platform model added
- [ ] Task 3: Generation model added
- [ ] Task 4: DocumentCategory and DocumentType models added
- [ ] Task 5: Document model updated with new FKs
- [ ] Task 6: New models exported from package
- [ ] Level 1 validation passes (Python imports)
- [ ] Level 3 validation passes (make db-migrate)
- [ ] Level 4 validation passes (seed data counts)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration number conflict | NONE | - | VERIFIED: V1, V2, V3 exist - V4 is correct |
| Circular import in models | LOW | MEDIUM | Use forward references with quoted strings (existing pattern) |
| Missing import in models.py | NONE | - | VERIFIED: Integer, Text already imported on line 6 |

---

## Notes

- Migration is V4 - CONFIRMED by `ls database/migrations/`: V1__baseline.sql, V2__split_ingestion_jobs.sql, V3__add_chapter_title.sql exist
- All new FK columns on documents are nullable to preserve existing data
- Generation.platform_id and DocumentType.document_category_id are NOT nullable - these relationships are required
- Seed data uses CROSS JOIN with VALUES for clean, readable inserts
- The composite index `idx_documents_wizard_filter` includes WHERE clause for soft-delete filtering
