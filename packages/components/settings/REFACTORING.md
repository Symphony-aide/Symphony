# Settings Package Refactoring Documentation

## Overview
This document outlines the refactoring of the `@symphony/settings` package from a component-heavy architecture to a clean **[Page, Feature, Component]** pattern.

## Refactoring Date
October 13, 2025

## Motivation
The original settings package had:
- Multiple setting components with mixed concerns
- Settings state management via props drilling
- No validation or schema system
- Settings modal orchestrating everything
- Difficult to reuse settings in different contexts
- No clear separation between UI and business logic

## Current Status
✅ **Settings Feature Already Extracted**: The core Settings feature was extracted earlier to `@symphony/features/Settings` with:
- `useSettings()` hook for settings management
- `SettingsFeature` component
- Settings persistence
- Modal state management

## Architecture Pattern: [Page, Feature, Component]

### 🔵 Components Layer
**Purpose**: Pure, reusable UI components with no business logic

**Characteristics**:
- Receive data via props
- Emit events via callbacks
- No direct state management
- No API calls or side effects
- Highly reusable across features

### 🟡 Features Layer
**Purpose**: Self-contained business logic modules

**Characteristics**:
- Manage their own state
- Contain business logic and side effects
- Compose UI components
- Expose clean APIs to pages
- Can be used independently

### 🔴 Pages Layer
**Purpose**: High-level orchestration and routing

**Characteristics**:
- Compose multiple features
- Handle page-level routing
- Minimal business logic
- Coordinate feature interactions
- Provide page-level context

## Current Structure Analysis

### Existing Structure
```
settings/
├── src/
│   ├── SettingsModal.jsx              # Main modal (218 lines)
│   ├── AutoSaveSettings.jsx           # Auto-save UI
│   ├── TabCompletionSettings.jsx      # Tab completion UI
│   ├── GlyphMarginSettings.jsx        # Glyph margin UI
│   ├── EditorThemeSettings.jsx        # Theme UI
│   ├── EnhancedThemeSettings.jsx      # Enhanced theme UI
│   ├── TerminalSettings.jsx           # Terminal UI
│   ├── GlobalSearchReplace.jsx        # Search/replace UI
│   ├── ProjectSettingsStatus.jsx      # Project settings UI
│   ├── ShortcutSettingsModal.jsx      # Shortcuts UI
│   ├── shortcutsAtom.js               # Jotai atom
│   └── utils/
│       └── storageService.js          # Storage abstraction
```

### Identified Features

#### 1. **SettingsValidation Feature** (New)
- Validate settings values
- Schema-based validation
- Type checking
- Range validation
- Custom validators

#### 2. **SettingsImportExport Feature** (New)
- Export settings to JSON
- Import settings from JSON
- Settings migration
- Version compatibility

#### 3. **ProjectSettings Feature** (New)
- Project-specific settings
- Settings inheritance (global → project)
- Project settings persistence
- Settings overrides

## New Structure

```
settings/
├── src/
│   ├── pages/
│   │   └── SettingsPage/
│   │       ├── SettingsPage.jsx           # Main settings page
│   │       └── index.js
│   ├── components/
│   │   ├── SettingGroup/
│   │   │   ├── SettingGroup.jsx           # Pure setting group UI
│   │   │   └── index.js
│   │   ├── SettingItem/
│   │   │   ├── SettingItem.jsx            # Pure setting item UI
│   │   │   └── index.js
│   │   ├── ToggleSetting/
│   │   │   ├── ToggleSetting.jsx          # Pure toggle UI
│   │   │   └── index.js
│   │   ├── SelectSetting/
│   │   │   ├── SelectSetting.jsx          # Pure select UI
│   │   │   └── index.js
│   │   └── NumberSetting/
│   │       ├── NumberSetting.jsx          # Pure number input UI
│   │       └── index.js
│   └── index.js
```

## Features to Extract (to @symphony/features)

```
packages/features/src/
├── Settings/                          # ✅ Already exists
│   ├── SettingsFeature.jsx
│   ├── hooks/
│   │   └── useSettings.js
│   └── index.js
├── SettingsValidation/                # New
│   ├── SettingsValidationFeature.jsx
│   ├── hooks/
│   │   ├── useSettingsValidation.js
│   │   └── useSettingsSchema.js
│   ├── services/
│   │   ├── ValidationService.js
│   │   └── SchemaBuilder.js
│   └── index.js
├── SettingsImportExport/              # New
│   ├── SettingsImportExportFeature.jsx
│   ├── hooks/
│   │   ├── useSettingsExport.js
│   │   └── useSettingsImport.js
│   ├── services/
│   │   ├── ExportService.js
│   │   └── ImportService.js
│   └── index.js
└── ProjectSettings/                   # New
    ├── ProjectSettingsFeature.jsx
    ├── hooks/
    │   ├── useProjectSettings.js
    │   └── useSettingsInheritance.js
    ├── services/
    │   └── ProjectSettingsService.js
    └── index.js
```

## Migration Map

### Old → New Structure

#### Components
| Old Location | New Location | Type |
|-------------|--------------|------|
| `SettingsModal.jsx` | `pages/SettingsPage/SettingsPage.jsx` | Page |
| `AutoSaveSettings.jsx` | `components/ToggleSetting/` | Component |
| `TabCompletionSettings.jsx` | `components/ToggleSetting/` | Component |
| `GlyphMarginSettings.jsx` | `components/ToggleSetting/` | Component |
| `EditorThemeSettings.jsx` | `components/SelectSetting/` | Component |
| `TerminalSettings.jsx` | `components/SettingGroup/` | Component |
| `ShortcutSettingsModal.jsx` | `components/ShortcutEditor/` | Component |

#### State → Features
| Old State | New Feature | Location |
|-----------|-------------|----------|
| Props drilling | Settings | `@symphony/features/Settings` (exists) |
| N/A | SettingsValidation | `@symphony/features/SettingsValidation` (new) |
| N/A | SettingsImportExport | `@symphony/features/SettingsImportExport` (new) |
| N/A | ProjectSettings | `@symphony/features/ProjectSettings` (new) |

## Feature Boundaries

### Settings Feature (✅ Already Exists)
**Responsibilities**:
- Manage all settings state
- Persist settings to storage
- Provide settings API
- Handle modal state

**API**:
```javascript
const settings = useSettingsFeature();
// settings.autoSave, theme, terminal, shortcuts
// settings.setAutoSave(), setTheme(), etc.
// settings.openSettings(), closeSettings(), resetSettings()
```

### SettingsValidation Feature (New)
**Responsibilities**:
- Validate settings values
- Schema-based validation
- Type checking
- Range validation

**API**:
```javascript
const validation = useSettingsValidation({ schema });
// validation.validate(key, value)
// validation.errors
// validation.isValid
```

### SettingsImportExport Feature (New)
**Responsibilities**:
- Export settings to JSON
- Import settings from JSON
- Settings migration
- Version compatibility

**API**:
```javascript
const importExport = useSettingsImportExport();
// importExport.exportSettings()
// importExport.importSettings(json)
// importExport.exportToFile()
// importExport.importFromFile()
```

### ProjectSettings Feature (New)
**Responsibilities**:
- Project-specific settings
- Settings inheritance
- Project settings persistence
- Settings overrides

**API**:
```javascript
const projectSettings = useProjectSettings({ projectPath });
// projectSettings.settings
// projectSettings.overrides
// projectSettings.setOverride(key, value)
// projectSettings.clearOverride(key)
```

## Benefits of New Architecture

### 1. **Clear Separation of Concerns**
- UI components focus only on presentation
- Features encapsulate business logic
- Pages orchestrate high-level flows

### 2. **Improved Testability**
- Components can be tested in isolation
- Features can be tested without UI
- Validation logic can be tested independently

### 3. **Better Reusability**
- Components are pure and reusable
- Features can be used in different contexts
- Settings can be managed programmatically

### 4. **Easier Maintenance**
- Changes are localized to specific layers
- Dependencies are explicit
- Code is easier to understand

### 5. **Scalability**
- New settings can be added easily
- Validation rules can be extended
- Import/export can support new formats

## Migration Strategy

### Phase 1: Extract New Features
1. Extract SettingsValidation feature
2. Extract SettingsImportExport feature
3. Extract ProjectSettings feature

### Phase 2: Refactor Components
1. Extract pure UI components
2. Remove business logic
3. Create component APIs

### Phase 3: Create Settings Page
1. Create SettingsPage
2. Compose features
3. Simplify orchestration

### Phase 4: Update Dependencies
1. Update imports across codebase
2. Update documentation
3. Create migration examples

## Breaking Changes

### Import Paths
```javascript
// Old
import SettingsModal from '@symphony/settings';
import { shortcutsAtom } from '@symphony/settings';

// New
import { SettingsPage } from '@symphony/settings';
import { useSettingsFeature } from '@symphony/features/Settings';
import { useSettingsValidation } from '@symphony/features/SettingsValidation';
```

## Backward Compatibility

A compatibility layer will be maintained:

```javascript
// Deprecated but still works
export { SettingsPage as default } from './pages/SettingsPage';
```

## Testing Strategy

### Component Tests
- Unit tests for each component
- Storybook stories for visual testing
- Accessibility tests

### Feature Tests
- Integration tests for feature logic
- Mock external dependencies
- Test feature APIs

### Validation Tests
- Schema validation tests
- Type checking tests
- Range validation tests

## Performance Considerations

### Code Splitting
- Features can be lazy-loaded
- Components are tree-shakeable
- Reduced initial bundle size

### Memoization
- Components use React.memo where appropriate
- Feature hooks use useMemo/useCallback
- Prevent unnecessary re-renders

## Next Steps

1. ✅ Create documentation
2. ⏳ Extract SettingsValidation feature
3. ⏳ Extract SettingsImportExport feature
4. ⏳ Extract ProjectSettings feature
5. ⏳ Refactor components layer
6. ⏳ Create SettingsPage
7. ⏳ Update workspace configuration
8. ⏳ Test and verify refactoring

---

**Last Updated**: October 13, 2025
**Author**: Symphony Development Team
