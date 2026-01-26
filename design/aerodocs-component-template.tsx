/**
 * AeroDocs - Document Browser Page
 * 
 * This is a structural reference component for Claude Code.
 * - No inline styles (use your app's styling system)
 * - No hardcoded data (fetch from API)
 * - Placeholder class names for styling hooks
 * 
 * Implement with your app's:
 * - Component library (e.g., shadcn, MUI, custom)
 * - Styling approach (Tailwind, CSS modules, styled-components)
 * - State management (React Query, SWR, Redux, etc.)
 * - API layer
 */

import React, { useState, useEffect } from 'react';

// =============================================================================
// TYPES - Adjust to match your API response shapes
// =============================================================================

interface Aircraft {
  id: string;
  tailNumber: string;
  platform: string;
  model: string;
  generation: string;
  serialNumber?: string;
  displayName: string;
}

interface Document {
  id: string;
  title: string;
  aircraftId: string | 'multiple';
  tailNumber?: string;
  aircraftDisplayName: string;
  category: string;
  documentType: string;
  publicationDate: string;
  fileType: 'pdf' | string;
  isPinned: boolean;
  isOwnedAircraft: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface DocumentType {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  platformId: string;
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function DocumentsPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  
  // Filter state
  const [activeSection, setActiveSection] = useState<'my' | 'all'>('all');
  const [selectedAircraft, setSelectedAircraft] = useState('my-aircraft');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI state
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardPlatform, setWizardPlatform] = useState<string | null>(null);
  const [wizardGeneration, setWizardGeneration] = useState<string | null>(null);
  const [wizardCategory, setWizardCategory] = useState<string | null>(null);
  const [wizardDocType, setWizardDocType] = useState<string | null>(null);
  
  // Add Aircraft modal state
  const [addAircraftOpen, setAddAircraftOpen] = useState(false);
  const [addAircraftMode, setAddAircraftMode] = useState<'platform' | 'serial' | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching - Replace with your data fetching approach
  // ---------------------------------------------------------------------------
  
  const [userAircraft, setUserAircraft] = useState<Aircraft[]>([]);
  const [allAircraft, setAllAircraft] = useState<Aircraft[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch initial data
    // - GET /api/user/aircraft -> setUserAircraft
    // - GET /api/aircraft -> setAllAircraft
    // - GET /api/documents/categories -> setCategories
    // - GET /api/documents/types -> setDocumentTypes
    // - GET /api/aircraft/platforms -> setPlatforms
    // - GET /api/documents -> setDocuments
  }, []);

  useEffect(() => {
    // TODO: Refetch documents when filters change
    // GET /api/documents with query params
  }, [activeSection, selectedAircraft, selectedCategory, selectedDocType, sortBy, searchQuery]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
  
  const otherAircraft = allAircraft.filter(
    a => !userAircraft.some(ua => ua.id === a.id)
  );

  const filteredDocuments = documents; // Filtering handled by API

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openWizard = () => {
    setWizardOpen(true);
    setWizardStep(1);
    setWizardPlatform(null);
    setWizardGeneration(null);
    setWizardCategory(null);
    setWizardDocType(null);
  };

  const closeWizard = () => {
    setWizardOpen(false);
  };

  const openAddAircraft = (mode: 'platform' | 'serial') => {
    setAddAircraftMode(mode);
    setAddAircraftOpen(true);
  };

  const closeAddAircraft = () => {
    setAddAircraftOpen(false);
    setAddAircraftMode(null);
  };

  const handleAddAircraft = async (aircraftData: Partial<Aircraft>) => {
    // TODO: POST /api/user/aircraft
    // Then refetch user aircraft
    closeAddAircraft();
  };

  const openDocument = (documentId: string) => {
    // TODO: Navigate to document viewer or open PDF
  };

  const togglePinDocument = async (documentId: string, isPinned: boolean) => {
    // TODO: POST or DELETE /api/documents/:id/pin
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="documents-page">
      {/* Top Bar - Fixed at top */}
      <TopBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onOpenWizard={openWizard}
        onAddAircraft={openAddAircraft}
      />

      {/* Wizard Panel - Slides down from top bar */}
      {wizardOpen && (
        <FindMyDocumentWizard
          isOpen={wizardOpen}
          onClose={closeWizard}
          currentStep={wizardStep}
          onStepChange={setWizardStep}
          platforms={platforms}
          selectedPlatform={wizardPlatform}
          onPlatformSelect={setWizardPlatform}
          selectedGeneration={wizardGeneration}
          onGenerationSelect={setWizardGeneration}
          categories={categories}
          selectedCategory={wizardCategory}
          onCategorySelect={setWizardCategory}
          documentTypes={documentTypes}
          selectedDocType={wizardDocType}
          onDocTypeSelect={setWizardDocType}
        />
      )}

      <div className="documents-page__layout">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userAircraft={userAircraft}
          otherAircraft={otherAircraft}
          selectedAircraft={selectedAircraft}
          onAircraftChange={setSelectedAircraft}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          documentTypes={documentTypes}
          selectedDocType={selectedDocType}
          onDocTypeChange={setSelectedDocType}
        />

        {/* Main Content */}
        <main className={`documents-page__main ${sidebarCollapsed ? 'documents-page__main--expanded' : ''}`}>
          <ContentHeader
            title={activeSection === 'my' ? 'My Documents' : 'All Documents'}
            documentCount={filteredDocuments.length}
            showAircraftNote={selectedAircraft === 'my-aircraft'}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {viewMode === 'card' ? (
            <DocumentCardGrid
              documents={filteredDocuments}
              onOpenDocument={openDocument}
              onTogglePin={togglePinDocument}
            />
          ) : (
            <DocumentTable
              documents={filteredDocuments}
              onOpenDocument={openDocument}
              onTogglePin={togglePinDocument}
            />
          )}
        </main>
      </div>

      {/* Add Aircraft Modal */}
      {addAircraftOpen && addAircraftMode === 'platform' && (
        <AddByPlatformModal
          isOpen={addAircraftOpen}
          onClose={closeAddAircraft}
          platforms={platforms}
          onSubmit={handleAddAircraft}
        />
      )}

      {addAircraftOpen && addAircraftMode === 'serial' && (
        <AddBySerialModal
          isOpen={addAircraftOpen}
          onClose={closeAddAircraft}
          onSubmit={handleAddAircraft}
        />
      )}
    </div>
  );
}

// =============================================================================
// TOP BAR COMPONENT
// =============================================================================

interface TopBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onOpenWizard: () => void;
  onAddAircraft: (mode: 'platform' | 'serial') => void;
}

function TopBar({ searchQuery, onSearch, onOpenWizard, onAddAircraft }: TopBarProps) {
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);

  return (
    <header className="top-bar">
      {/* Logo */}
      <div className="top-bar__logo">
        <span className="top-bar__logo-icon">✈</span>
        <span className="top-bar__logo-text">AeroDocs</span>
      </div>

      {/* Search */}
      <div className="top-bar__search">
        <input
          type="text"
          className="top-bar__search-input"
          placeholder="Search documents, part numbers, ADs..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Find My Document Button */}
      <button className="top-bar__wizard-btn" onClick={onOpenWizard}>
        Find My Document
      </button>

      {/* Add Aircraft Dropdown */}
      <div className="top-bar__add-aircraft">
        <button
          className="top-bar__add-aircraft-trigger"
          onClick={() => setAddDropdownOpen(!addDropdownOpen)}
        >
          Add Aircraft ▼
        </button>
        
        {addDropdownOpen && (
          <div className="top-bar__add-aircraft-dropdown">
            <button
              className="top-bar__add-aircraft-option"
              onClick={() => {
                onAddAircraft('platform');
                setAddDropdownOpen(false);
              }}
            >
              Add by Platform & Generation
            </button>
            <button
              className="top-bar__add-aircraft-option"
              onClick={() => {
                onAddAircraft('serial');
                setAddDropdownOpen(false);
              }}
            >
              Find by Serial Number
            </button>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="top-bar__user-menu">
        <button className="top-bar__user-avatar">
          {/* User initials or avatar */}
        </button>
      </div>
    </header>
  );
}

// =============================================================================
// FIND MY DOCUMENT WIZARD
// =============================================================================

interface FindMyDocumentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  platforms: Platform[];
  selectedPlatform: string | null;
  onPlatformSelect: (id: string | null) => void;
  selectedGeneration: string | null;
  onGenerationSelect: (id: string | null) => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (id: string | null) => void;
  documentTypes: DocumentType[];
  selectedDocType: string | null;
  onDocTypeSelect: (id: string | null) => void;
}

function FindMyDocumentWizard({
  isOpen,
  onClose,
  currentStep,
  onStepChange,
  platforms,
  selectedPlatform,
  onPlatformSelect,
  selectedGeneration,
  onGenerationSelect,
  categories,
  selectedCategory,
  onCategorySelect,
  documentTypes,
  selectedDocType,
  onDocTypeSelect,
}: FindMyDocumentWizardProps) {
  const [models, setModels] = useState<Model[]>([]);

  // Fetch models when platform is selected
  useEffect(() => {
    if (selectedPlatform) {
      // TODO: GET /api/aircraft/platforms/:platformId/models -> setModels
    }
  }, [selectedPlatform]);

  const goNext = () => {
    if (currentStep < 4) onStepChange(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 1) onStepChange(currentStep - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="wizard-panel">
      <div className="wizard-panel__header">
        <h2 className="wizard-panel__title">Find My Document</h2>
        <button className="wizard-panel__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="wizard-panel__content">
        {/* Step 1: Platform */}
        {currentStep === 1 && (
          <div className="wizard-step">
            <h3 className="wizard-step__title">Select Platform</h3>
            <div className="wizard-step__options">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  className={`wizard-step__option ${selectedPlatform === platform.id ? 'wizard-step__option--selected' : ''}`}
                  onClick={() => onPlatformSelect(platform.id)}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Generation/Model */}
        {currentStep === 2 && (
          <div className="wizard-step">
            <h3 className="wizard-step__title">Select Generation/Model</h3>
            <div className="wizard-step__options">
              {models.map((model) => (
                <button
                  key={model.id}
                  className={`wizard-step__option ${selectedGeneration === model.id ? 'wizard-step__option--selected' : ''}`}
                  onClick={() => onGenerationSelect(model.id)}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Category */}
        {currentStep === 3 && (
          <div className="wizard-step">
            <h3 className="wizard-step__title">What are you looking for?</h3>
            <div className="wizard-step__options">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`wizard-step__option ${selectedCategory === category.id ? 'wizard-step__option--selected' : ''}`}
                  onClick={() => onCategorySelect(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Document Type */}
        {currentStep === 4 && (
          <div className="wizard-step">
            <h3 className="wizard-step__title">Document Type</h3>
            <div className="wizard-step__options">
              {documentTypes.map((type) => (
                <button
                  key={type.id}
                  className={`wizard-step__option ${selectedDocType === type.id ? 'wizard-step__option--selected' : ''}`}
                  onClick={() => onDocTypeSelect(type.id)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-panel__navigation">
        <button
          className="wizard-panel__nav-btn wizard-panel__nav-btn--back"
          onClick={goBack}
          disabled={currentStep === 1}
        >
          Back
        </button>
        
        <div className="wizard-panel__step-indicator">
          Step {currentStep} of 4
        </div>
        
        <button
          className="wizard-panel__nav-btn wizard-panel__nav-btn--next"
          onClick={goNext}
          disabled={currentStep === 4}
        >
          {currentStep === 4 ? 'View Results' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: 'my' | 'all';
  onSectionChange: (section: 'my' | 'all') => void;
  userAircraft: Aircraft[];
  otherAircraft: Aircraft[];
  selectedAircraft: string;
  onAircraftChange: (id: string) => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  documentTypes: DocumentType[];
  selectedDocType: string;
  onDocTypeChange: (id: string) => void;
}

function Sidebar({
  collapsed,
  onToggleCollapse,
  activeSection,
  onSectionChange,
  userAircraft,
  otherAircraft,
  selectedAircraft,
  onAircraftChange,
  categories,
  selectedCategory,
  onCategoryChange,
  documentTypes,
  selectedDocType,
  onDocTypeChange,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <button className="sidebar__collapse-toggle" onClick={onToggleCollapse}>
        {collapsed ? '→' : '←'}
      </button>

      {!collapsed && (
        <>
          {/* Section Tabs */}
          <div className="sidebar__section">
            <label className="sidebar__label">Documents</label>
            <div className="sidebar__tabs">
              <button
                className={`sidebar__tab ${activeSection === 'my' ? 'sidebar__tab--active' : ''}`}
                onClick={() => onSectionChange('my')}
              >
                ⭐ My Docs
              </button>
              <button
                className={`sidebar__tab ${activeSection === 'all' ? 'sidebar__tab--active' : ''}`}
                onClick={() => onSectionChange('all')}
              >
                📄 All Docs
              </button>
            </div>
          </div>

          {/* Aircraft Filter */}
          <div className="sidebar__section">
            <label className="sidebar__label">Aircraft</label>
            <select
              className="sidebar__select"
              value={selectedAircraft}
              onChange={(e) => onAircraftChange(e.target.value)}
            >
              <optgroup label="My Aircraft">
                <option value="my-aircraft">
                  ✈ All My Aircraft ({userAircraft.length})
                </option>
                {userAircraft.map((aircraft) => (
                  <option key={aircraft.id} value={aircraft.id}>
                    {aircraft.tailNumber} - {aircraft.displayName}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Aircraft">
                <option value="all">All Aircraft</option>
                {otherAircraft.map((aircraft) => (
                  <option key={aircraft.id} value={aircraft.id}>
                    {aircraft.tailNumber} - {aircraft.displayName}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="sidebar__help-text">
              {selectedAircraft === 'my-aircraft'
                ? 'Showing documents for all your registered aircraft'
                : selectedAircraft === 'all'
                ? 'Showing documents for all aircraft in the system'
                : 'Showing documents for selected aircraft only'}
            </p>
          </div>

          {/* Category Filter */}
          <div className="sidebar__section">
            <label className="sidebar__label">Category</label>
            <select
              className="sidebar__select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Filter */}
          <div className="sidebar__section">
            <label className="sidebar__label">Document Type</label>
            <select
              className="sidebar__select"
              value={selectedDocType}
              onChange={(e) => onDocTypeChange(e.target.value)}
            >
              <option value="all">All Types</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Panel - TODO: Fetch from API */}
          <div className="sidebar__stats">
            <label className="sidebar__label">Quick Stats</label>
            <div className="sidebar__stat">
              <span>Total Documents</span>
              <span className="sidebar__stat-value">—</span>
            </div>
            <div className="sidebar__stat">
              <span>My Aircraft Docs</span>
              <span className="sidebar__stat-value">—</span>
            </div>
            <div className="sidebar__stat">
              <span>Pinned</span>
              <span className="sidebar__stat-value">—</span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

// =============================================================================
// CONTENT HEADER
// =============================================================================

interface ContentHeaderProps {
  title: string;
  documentCount: number;
  showAircraftNote: boolean;
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

function ContentHeader({
  title,
  documentCount,
  showAircraftNote,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
}: ContentHeaderProps) {
  return (
    <div className="content-header">
      <div className="content-header__info">
        <h1 className="content-header__title">{title}</h1>
        <p className="content-header__count">
          {documentCount} documents found
          {showAircraftNote && ' across your aircraft'}
        </p>
      </div>

      <div className="content-header__actions">
        {/* View Toggle */}
        <div className="view-toggle">
          <button
            className={`view-toggle__btn ${viewMode === 'card' ? 'view-toggle__btn--active' : ''}`}
            onClick={() => onViewModeChange('card')}
          >
            Cards
          </button>
          <button
            className={`view-toggle__btn ${viewMode === 'table' ? 'view-toggle__btn--active' : ''}`}
            onClick={() => onViewModeChange('table')}
          >
            Table
          </button>
        </div>

        {/* Sort */}
        <div className="content-header__sort">
          <label>Sort:</label>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DOCUMENT CARD GRID
// =============================================================================

interface DocumentCardGridProps {
  documents: Document[];
  onOpenDocument: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

function DocumentCardGrid({ documents, onOpenDocument, onTogglePin }: DocumentCardGridProps) {
  return (
    <div className="document-grid">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="document-card"
          onClick={() => onOpenDocument(doc.id)}
        >
          <div className="document-card__header">
            <div className="document-card__icon">PDF</div>
            <div className="document-card__badges">
              {doc.isOwnedAircraft && (
                <span className="badge badge--owned">My Aircraft</span>
              )}
              {doc.isPinned && (
                <span className="badge badge--pinned">Pinned</span>
              )}
            </div>
          </div>

          <h3 className="document-card__title">{doc.title}</h3>

          <p className="document-card__subtitle">
            {doc.tailNumber && `${doc.tailNumber} • `}
            {doc.aircraftDisplayName}
          </p>

          <div className="document-card__tags">
            <span className="badge badge--category">{doc.category}</span>
            <span className="badge badge--type">{doc.documentType}</span>
          </div>

          <div className="document-card__footer">
            <span className="document-card__date">{doc.publicationDate}</span>
            <button className="document-card__view-btn">View →</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// DOCUMENT TABLE
// =============================================================================

interface DocumentTableProps {
  documents: Document[];
  onOpenDocument: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

function DocumentTable({ documents, onOpenDocument, onTogglePin }: DocumentTableProps) {
  return (
    <table className="document-table">
      <thead className="document-table__head">
        <tr>
          <th>Document</th>
          <th>Aircraft</th>
          <th>Category</th>
          <th>Type</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody className="document-table__body">
        {documents.map((doc) => (
          <tr
            key={doc.id}
            className="document-table__row"
            onClick={() => onOpenDocument(doc.id)}
          >
            <td>
              <div className="document-table__doc-cell">
                <span className="document-table__icon">PDF</span>
                <span>{doc.title}</span>
              </div>
            </td>
            <td>
              <div>{doc.tailNumber || '—'}</div>
              <div className="document-table__subtext">{doc.aircraftDisplayName}</div>
            </td>
            <td>
              <span className="badge badge--category">{doc.category}</span>
            </td>
            <td>
              <span className="badge badge--type">{doc.documentType}</span>
            </td>
            <td>{doc.publicationDate}</td>
            <td>
              <div className="document-table__badges">
                {doc.isOwnedAircraft && (
                  <span className="badge badge--owned">My Aircraft</span>
                )}
                {doc.isPinned && (
                  <span className="badge badge--pinned">Pinned</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// =============================================================================
// ADD AIRCRAFT MODALS
// =============================================================================

interface AddByPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: Platform[];
  onSubmit: (data: Partial<Aircraft>) => void;
}

function AddByPlatformModal({ isOpen, onClose, platforms, onSubmit }: AddByPlatformModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [tailNumber, setTailNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    if (selectedPlatform) {
      // TODO: Fetch models for platform
      // GET /api/aircraft/platforms/:platformId/models
    }
  }, [selectedPlatform]);

  const handleSubmit = () => {
    onSubmit({
      platform: selectedPlatform,
      model: selectedModel,
      tailNumber,
      serialNumber: serialNumber || undefined,
    });
  };

  const isValid = selectedPlatform && selectedModel && tailNumber;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Add Aircraft to My Account</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__content">
          <div className="form-field">
            <label>Platform/Manufacturer</label>
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setSelectedModel('');
              }}
            >
              <option value="">Select manufacturer...</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Model/Generation</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedPlatform}
            >
              <option value="">Select model...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Tail Number (Registration) *</label>
            <input
              type="text"
              value={tailNumber}
              onChange={(e) => setTailNumber(e.target.value)}
              placeholder="N12345"
            />
          </div>

          <div className="form-field">
            <label>Serial Number (Optional)</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Aircraft serial number"
            />
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Add Aircraft
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddBySerialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Aircraft>) => void;
}

function AddBySerialModal({ isOpen, onClose, onSubmit }: AddBySerialModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [tailNumber, setTailNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    // TODO: GET /api/aircraft/search?serial=:searchQuery
    // setSearchResults(results)
    setIsSearching(false);
  };

  const handleSubmit = () => {
    if (!selectedAircraft || !tailNumber) return;
    onSubmit({
      ...selectedAircraft,
      tailNumber,
    });
  };

  const isValid = selectedAircraft && tailNumber;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Find Aircraft by Serial Number</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__content">
          <div className="form-field">
            <label>Serial Number Search</label>
            <div className="search-field">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter aircraft serial number..."
              />
              <button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <label>Search Results</label>
              {searchResults.map((aircraft) => (
                <div
                  key={aircraft.id}
                  className={`search-result ${selectedAircraft?.id === aircraft.id ? 'search-result--selected' : ''}`}
                  onClick={() => setSelectedAircraft(aircraft)}
                >
                  <div className="search-result__info">
                    <strong>{aircraft.platform} {aircraft.model}</strong>
                    <span>Serial: {aircraft.serialNumber}</span>
                  </div>
                  <button className="search-result__select">
                    {selectedAircraft?.id === aircraft.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedAircraft && (
            <div className="form-field">
              <label>Tail Number (Registration) *</label>
              <input
                type="text"
                value={tailNumber}
                onChange={(e) => setTailNumber(e.target.value)}
                placeholder="N12345"
              />
            </div>
          )}
        </div>

        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Add Aircraft
          </button>
        </div>
      </div>
    </div>
  );
}
