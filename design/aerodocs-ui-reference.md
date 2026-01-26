# AeroDocs UI Reference Document

This document describes the UI structure and component hierarchy for the aircraft documentation web app. Use this as a reference when implementing the design with your app's existing styling system.

---

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR (fixed)                                                             │
│ [Logo] [Search Bar] [Find My Document Button] [Add Aircraft ▼] [User Menu]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ WIZARD PANEL (collapsible, opens below top bar when triggered)              │
│ Step-by-step document finder wizard                                         │
├────────────────┬────────────────────────────────────────────────────────────┤
│ SIDEBAR        │ MAIN CONTENT                                               │
│                │                                                            │
│ [My Docs]      │ Header: Title, doc count, [View Toggle] [Sort ▼]          │
│ [All Docs]     │                                                            │
│                │ Document List (Card or Table view)                         │
│ Aircraft ▼     │                                                            │
│ Category ▼     │                                                            │
│ Doc Type ▼     │                                                            │
│                │                                                            │
│ Quick Stats    │                                                            │
└────────────────┴────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### 1. Top Bar Component

```jsx
<TopBar>
  <Logo />
  
  <SearchBar 
    placeholder="Search documents, part numbers, ADs..."
    onSearch={handleSearch}
  />
  
  <FindMyDocumentButton onClick={openWizard} />
  
  <AddAircraftDropdown>
    {/* Dropdown with two options */}
    <DropdownItem onClick={openAddByPlatform}>
      Add by Platform & Generation
    </DropdownItem>
    <DropdownItem onClick={openAddBySerial}>
      Find by Serial Number
    </DropdownItem>
  </AddAircraftDropdown>
  
  <UserMenu />
</TopBar>
```

### 2. Find My Document Wizard (slides down from top bar)

```jsx
<WizardPanel isOpen={wizardOpen} onClose={closeWizard}>
  <WizardHeader>
    <Title>Find My Document</Title>
    <CloseButton onClick={closeWizard} />
  </WizardHeader>
  
  <WizardSteps currentStep={currentStep}>
    {/* Step 1: Select Platform */}
    <Step stepNumber={1} title="Select Platform">
      <PlatformSelector 
        options={platforms} 
        selected={selectedPlatform}
        onSelect={setSelectedPlatform}
      />
    </Step>
    
    {/* Step 2: Select Generation/Model */}
    <Step stepNumber={2} title="Select Generation">
      <GenerationSelector
        platform={selectedPlatform}
        options={generations}
        selected={selectedGeneration}
        onSelect={setSelectedGeneration}
      />
    </Step>
    
    {/* Step 3: Select Document Category */}
    <Step stepNumber={3} title="What are you looking for?">
      <CategorySelector
        options={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
    </Step>
    
    {/* Step 4: Select Document Type */}
    <Step stepNumber={4} title="Document Type">
      <DocumentTypeSelector
        options={documentTypes}
        selected={selectedDocType}
        onSelect={setSelectedDocType}
      />
    </Step>
  </WizardSteps>
  
  <WizardNavigation>
    <BackButton onClick={prevStep} disabled={currentStep === 1} />
    <StepIndicator current={currentStep} total={4} />
    <NextButton onClick={nextStep} />
  </WizardNavigation>
  
  <WizardResults documents={filteredDocuments} />
</WizardPanel>
```

### 3. Add Aircraft Modal/Dropdown Options

#### Option A: Add by Platform & Generation
```jsx
<AddByPlatformModal isOpen={addByPlatformOpen} onClose={closeModal}>
  <ModalHeader>Add Aircraft to My Account</ModalHeader>
  
  <FormField label="Platform/Manufacturer">
    <Select 
      options={platforms} 
      value={selectedPlatform}
      onChange={setSelectedPlatform}
      placeholder="Select manufacturer..."
    />
  </FormField>
  
  <FormField label="Model/Generation">
    <Select
      options={getModelsForPlatform(selectedPlatform)}
      value={selectedModel}
      onChange={setSelectedModel}
      placeholder="Select model..."
      disabled={!selectedPlatform}
    />
  </FormField>
  
  <FormField label="Tail Number (Registration)">
    <TextInput
      value={tailNumber}
      onChange={setTailNumber}
      placeholder="N12345"
    />
  </FormField>
  
  <FormField label="Serial Number (Optional)">
    <TextInput
      value={serialNumber}
      onChange={setSerialNumber}
      placeholder="Aircraft serial number"
    />
  </FormField>
  
  <ModalActions>
    <CancelButton onClick={closeModal} />
    <AddButton onClick={handleAddAircraft} disabled={!isFormValid} />
  </ModalActions>
</AddByPlatformModal>
```

#### Option B: Find by Serial Number
```jsx
<AddBySerialModal isOpen={addBySerialOpen} onClose={closeModal}>
  <ModalHeader>Find Aircraft by Serial Number</ModalHeader>
  
  <SearchField>
    <TextInput
      value={serialSearchQuery}
      onChange={setSerialSearchQuery}
      placeholder="Enter aircraft serial number..."
    />
    <SearchButton onClick={handleSerialSearch} />
  </SearchField>
  
  {searchResults && (
    <SearchResults>
      {searchResults.map(aircraft => (
        <AircraftResultCard
          key={aircraft.id}
          aircraft={aircraft}
          onSelect={() => handleSelectAircraft(aircraft)}
        >
          <AircraftInfo>
            <div>{aircraft.platform} {aircraft.model}</div>
            <div>Serial: {aircraft.serialNumber}</div>
          </AircraftInfo>
          <AddToAccountButton />
        </AircraftResultCard>
      ))}
    </SearchResults>
  )}
  
  <FormField label="Tail Number (Registration)">
    <TextInput
      value={tailNumber}
      onChange={setTailNumber}
      placeholder="N12345"
    />
  </FormField>
  
  <ModalActions>
    <CancelButton onClick={closeModal} />
    <AddButton onClick={handleAddAircraft} disabled={!selectedAircraft || !tailNumber} />
  </ModalActions>
</AddBySerialModal>
```

### 4. Sidebar Component

```jsx
<Sidebar collapsed={sidebarCollapsed}>
  <CollapseToggle onClick={toggleSidebar} />
  
  {!sidebarCollapsed && (
    <>
      {/* Section Toggle */}
      <SectionLabel>Documents</SectionLabel>
      <TabGroup>
        <Tab 
          active={activeSection === 'my'} 
          onClick={() => setActiveSection('my')}
        >
          My Docs
        </Tab>
        <Tab 
          active={activeSection === 'all'} 
          onClick={() => setActiveSection('all')}
        >
          All Docs
        </Tab>
      </TabGroup>
      
      {/* Aircraft Filter - Grouped for multi-aircraft owners */}
      <FilterGroup label="Aircraft">
        <Select value={selectedAircraft} onChange={setSelectedAircraft}>
          <OptGroup label="My Aircraft">
            <Option value="my-aircraft">All My Aircraft ({userAircraft.length})</Option>
            {userAircraft.map(aircraft => (
              <Option key={aircraft.id} value={aircraft.id}>
                {aircraft.tailNumber} - {aircraft.displayName}
              </Option>
            ))}
          </OptGroup>
          <OptGroup label="Other Aircraft">
            <Option value="all">All Aircraft</Option>
            {otherAircraft.map(aircraft => (
              <Option key={aircraft.id} value={aircraft.id}>
                {aircraft.tailNumber} - {aircraft.displayName}
              </Option>
            ))}
          </OptGroup>
        </Select>
        <HelpText>
          {getAircraftFilterHelpText(selectedAircraft)}
        </HelpText>
      </FilterGroup>
      
      {/* Category Filter */}
      <FilterGroup label="Category">
        <Select value={selectedCategory} onChange={setSelectedCategory}>
          <Option value="all">All Categories</Option>
          {categories.map(cat => (
            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
          ))}
        </Select>
      </FilterGroup>
      
      {/* Document Type Filter */}
      <FilterGroup label="Document Type">
        <Select value={selectedDocType} onChange={setSelectedDocType}>
          <Option value="all">All Types</Option>
          {documentTypes.map(type => (
            <Option key={type.id} value={type.id}>{type.name}</Option>
          ))}
        </Select>
      </FilterGroup>
      
      {/* Quick Stats */}
      <StatsPanel>
        <StatItem label="Total Documents" value={stats.total} />
        <StatItem label="My Aircraft Docs" value={stats.myAircraftDocs} />
        <StatItem label="Pinned" value={stats.pinned} />
        <StatItem label="New This Week" value={stats.newThisWeek} />
      </StatsPanel>
    </>
  )}
</Sidebar>
```

### 5. Main Content Area

```jsx
<MainContent sidebarCollapsed={sidebarCollapsed}>
  {/* Header */}
  <ContentHeader>
    <div>
      <PageTitle>
        {activeSection === 'my' ? 'My Documents' : 'All Documents'}
      </PageTitle>
      <DocumentCount>
        {filteredDocuments.length} documents found
        {selectedAircraft === 'my-aircraft' && ' across your aircraft'}
      </DocumentCount>
    </div>
    
    <HeaderActions>
      {/* View Toggle */}
      <ViewToggle>
        <ToggleButton 
          active={viewMode === 'card'} 
          onClick={() => setViewMode('card')}
          icon={<GridIcon />}
        >
          Cards
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'table'} 
          onClick={() => setViewMode('table')}
          icon={<ListIcon />}
        >
          Table
        </ToggleButton>
      </ViewToggle>
      
      {/* Sort Dropdown */}
      <SortDropdown value={sortBy} onChange={setSortBy}>
        <Option value="date-desc">Newest First</Option>
        <Option value="date-asc">Oldest First</Option>
        <Option value="name-asc">Name (A-Z)</Option>
        <Option value="name-desc">Name (Z-A)</Option>
      </SortDropdown>
    </HeaderActions>
  </ContentHeader>
  
  {/* Document List */}
  {viewMode === 'card' ? (
    <CardGrid>
      {filteredDocuments.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </CardGrid>
  ) : (
    <DocumentTable documents={filteredDocuments} />
  )}
</MainContent>
```

### 6. Document Card Component

```jsx
<DocumentCard document={doc} onClick={() => openDocument(doc.id)}>
  <CardHeader>
    <FileTypeIcon type={doc.fileType} />
    <BadgeGroup>
      {doc.isOwnedAircraft && <Badge variant="owned">My Aircraft</Badge>}
      {doc.isPinned && <Badge variant="pinned">Pinned</Badge>}
    </BadgeGroup>
  </CardHeader>
  
  <CardTitle>{doc.title}</CardTitle>
  
  <CardSubtitle>
    {doc.tailNumber && `${doc.tailNumber} • `}{doc.aircraftDisplayName}
  </CardSubtitle>
  
  <BadgeGroup>
    <Badge variant="category">{doc.category}</Badge>
    <Badge variant="type">{doc.documentType}</Badge>
  </BadgeGroup>
  
  <CardFooter>
    <PublicationDate>{formatDate(doc.publicationDate)}</PublicationDate>
    <ViewButton>View →</ViewButton>
  </CardFooter>
</DocumentCard>
```

### 7. Document Table Component

```jsx
<DocumentTable>
  <TableHeader>
    <HeaderCell>Document</HeaderCell>
    <HeaderCell>Aircraft</HeaderCell>
    <HeaderCell>Category</HeaderCell>
    <HeaderCell>Type</HeaderCell>
    <HeaderCell>Date</HeaderCell>
    <HeaderCell align="right">Status</HeaderCell>
  </TableHeader>
  
  <TableBody>
    {documents.map(doc => (
      <TableRow key={doc.id} onClick={() => openDocument(doc.id)}>
        <Cell>
          <DocumentCellContent>
            <FileTypeIcon type={doc.fileType} size="small" />
            <span>{doc.title}</span>
          </DocumentCellContent>
        </Cell>
        <Cell>
          <div>{doc.tailNumber || '—'}</div>
          <CellSubtext>{doc.aircraftDisplayName}</CellSubtext>
        </Cell>
        <Cell>
          <Badge variant="category">{doc.category}</Badge>
        </Cell>
        <Cell>
          <Badge variant="type">{doc.documentType}</Badge>
        </Cell>
        <Cell>{formatDate(doc.publicationDate)}</Cell>
        <Cell align="right">
          <BadgeGroup>
            {doc.isOwnedAircraft && <Badge variant="owned">My Aircraft</Badge>}
            {doc.isPinned && <Badge variant="pinned">Pinned</Badge>}
          </BadgeGroup>
        </Cell>
      </TableRow>
    ))}
  </TableBody>
</DocumentTable>
```

---

## State Management

```typescript
// Main page state
interface DocumentsPageState {
  // Filters
  activeSection: 'my' | 'all';
  selectedAircraft: string; // 'my-aircraft' | 'all' | specific aircraft ID
  selectedCategory: string;
  selectedDocType: string;
  sortBy: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
  searchQuery: string;
  
  // UI state
  viewMode: 'card' | 'table';
  sidebarCollapsed: boolean;
  
  // Wizard state
  wizardOpen: boolean;
  wizardStep: number;
  wizardSelections: {
    platform: string | null;
    generation: string | null;
    category: string | null;
    documentType: string | null;
  };
  
  // Add Aircraft modal state
  addAircraftModalOpen: boolean;
  addAircraftMode: 'platform' | 'serial' | null;
}

// User's aircraft
interface UserAircraft {
  id: string;
  tailNumber: string;
  platform: string;
  model: string;
  generation: string;
  serialNumber?: string;
  displayName: string; // e.g., "Cessna 172S"
}

// Document
interface Document {
  id: string;
  title: string;
  aircraftId: string | 'multiple';
  tailNumber?: string;
  aircraftDisplayName: string;
  category: string;
  documentType: string;
  publicationDate: string;
  fileType: 'pdf' | 'other';
  isPinned: boolean;
  isOwnedAircraft: boolean;
}
```

---

## Data Requirements

### API Endpoints Needed

```typescript
// Fetch user's registered aircraft
GET /api/user/aircraft
Response: UserAircraft[]

// Fetch all available aircraft (for service center view)
GET /api/aircraft
Response: Aircraft[]

// Fetch documents with filters
GET /api/documents
Query params: {
  aircraftId?: string;
  ownedOnly?: boolean;
  pinnedOnly?: boolean;
  category?: string;
  documentType?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}
Response: { documents: Document[], total: number }

// Fetch filter options
GET /api/documents/categories
Response: Category[]

GET /api/documents/types
Response: DocumentType[]

// Fetch platforms/generations for wizard and add aircraft
GET /api/aircraft/platforms
Response: Platform[]

GET /api/aircraft/platforms/:platformId/models
Response: Model[]

// Search aircraft by serial number
GET /api/aircraft/search?serial=:serialNumber
Response: Aircraft[]

// Add aircraft to user's account
POST /api/user/aircraft
Body: { tailNumber: string, aircraftId: string } OR
      { tailNumber: string, platformId: string, modelId: string, serialNumber?: string }

// Pin/unpin document
POST /api/documents/:id/pin
DELETE /api/documents/:id/pin

// Get stats
GET /api/documents/stats
Response: {
  total: number;
  myAircraftDocs: number;
  pinned: number;
  newThisWeek: number;
}
```

---

## Key UX Behaviors

### Wizard Behavior
1. "Find My Document" button in top bar opens wizard panel
2. Wizard slides down from below the top bar (pushes content down or overlays)
3. User progresses through steps: Platform → Generation → Category → Document Type
4. Results filter in real-time as selections are made
5. User can jump back to any previous step
6. Close button dismisses wizard

### Add Aircraft Dropdown
1. Dropdown in top bar with two options
2. "Add by Platform & Generation" opens modal with cascading selects
3. "Find by Serial Number" opens modal with search field
4. Tail number is optional
5. After adding, aircraft appears in "My Aircraft" group in sidebar filter

### Aircraft Filter
1. "My Aircraft" group at top shows user's registered planes
2. "All My Aircraft" option shows docs for entire fleet at once
3. "Other Aircraft" group shows all other aircraft in system
4. Service center users primarily use "All Aircraft" option
5. Documents from owned aircraft show "My Aircraft" badge

### View Toggle
1. Cards view: Visual grid, good for browsing
2. Table view: Dense rows, good for power users
3. Preference persists across sessions

### Sidebar
1. Collapsible to maximize document viewing area
2. Collapse state persists across sessions
3. Filters apply immediately (no "Apply" button needed)

---

## Component Checklist

- [ ] TopBar
  - [ ] Logo
  - [ ] SearchBar
  - [ ] FindMyDocumentButton
  - [ ] AddAircraftDropdown
  - [ ] UserMenu
- [ ] WizardPanel
  - [ ] WizardSteps
  - [ ] WizardNavigation
  - [ ] WizardResults
- [ ] AddAircraftModals
  - [ ] AddByPlatformModal
  - [ ] AddBySerialModal
- [ ] Sidebar
  - [ ] SectionTabs (My Docs / All Docs)
  - [ ] AircraftFilter (grouped select)
  - [ ] CategoryFilter
  - [ ] DocumentTypeFilter
  - [ ] StatsPanel
- [ ] MainContent
  - [ ] ContentHeader
  - [ ] ViewToggle
  - [ ] SortDropdown
  - [ ] CardGrid / DocumentCard
  - [ ] DocumentTable / TableRow
- [ ] Shared Components
  - [ ] Badge (variants: owned, pinned, category, type)
  - [ ] FileTypeIcon
  - [ ] Select / OptGroup
  - [ ] Modal
  - [ ] Button variants
