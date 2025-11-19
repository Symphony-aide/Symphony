# OutlineView Package Refactoring Documentation

## Overview
This document outlines the refactoring of the `@symphony/outlineview` package from a simple component to a clean **[Page, Feature, Component]** pattern.

## Refactoring Date
October 13, 2025

## Motivation
The original outlineview package had:
- Simple component with minimal functionality
- State management via Jotai atom
- No separation between outline parsing and display
- Limited features (only displays outline items)
- No code navigation capabilities
- Difficult to extend with new features

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
outlineview/
├── src/
│   ├── OutlineView.jsx          # Main component (32 lines)
│   └── outlineAtom.js            # Jotai atom for outline state
```

### Identified Features

#### 1. **OutlineTree Feature**
- Parse code to extract outline
- Build tree structure
- Filter and sort outline items
- Track outline state

#### 2. **CodeNavigation Feature**
- Navigate to code locations
- Jump to symbols
- Track navigation history
- Highlight current symbol

## New Structure

```
outlineview/
├── src/
│   ├── components/
│   │   ├── OutlineItem/
│   │   │   ├── OutlineItem.jsx           # Pure outline item UI
│   │   │   └── index.js
│   │   ├── OutlineList/
│   │   │   ├── OutlineList.jsx           # Pure list UI
│   │   │   └── index.js
│   │   └── OutlineSearch/
│   │       ├── OutlineSearch.jsx         # Pure search UI
│   │       └── index.js
│   └── index.js
```

## Features to Extract (to @symphony/features)

```
packages/features/src/
├── OutlineTree/
│   ├── OutlineTreeFeature.jsx
│   ├── hooks/
│   │   ├── useOutlineTree.js
│   │   ├── useOutlineParser.js
│   │   └── useOutlineFilter.js
│   ├── services/
│   │   ├── OutlineParser.js
│   │   └── TreeBuilder.js
│   ├── utils/
│   │   └── symbolTypes.js
│   └── index.js
└── CodeNavigation/
    ├── CodeNavigationFeature.jsx
    ├── hooks/
    │   ├── useCodeNavigation.js
    │   └── useNavigationHistory.js
    ├── services/
    │   └── NavigationService.js
    └── index.js
```

## Migration Map

### Old → New Structure

#### Components
| Old Location | New Location | Type |
|-------------|--------------|------|
| `OutlineView.jsx` | `components/OutlineList/OutlineList.jsx` | Component |
| N/A | `components/OutlineItem/OutlineItem.jsx` | Component |
| N/A | `components/OutlineSearch/OutlineSearch.jsx` | Component |

#### State → Features
| Old State | New Feature | Location |
|-----------|-------------|----------|
| `outlineAtom.js` | OutlineTree | `@symphony/features/OutlineTree` |
| N/A (new) | CodeNavigation | `@symphony/features/CodeNavigation` |

## Feature Boundaries

### OutlineTree Feature
**Responsibilities**:
- Parse code to extract symbols
- Build outline tree structure
- Filter outline by type/name
- Sort outline items
- Track outline state

**API**:
```javascript
const outlineTree = useOutlineTree({ code, language });
// outlineTree.outline
// outlineTree.parse(code)
// outlineTree.filter(term)
// outlineTree.sort(by)
// outlineTree.getSymbolAtLine(line)
```

### CodeNavigation Feature
**Responsibilities**:
- Navigate to code locations
- Jump to symbols
- Track navigation history
- Highlight active symbol

**API**:
```javascript
const navigation = useCodeNavigation({ onNavigate });
// navigation.goToSymbol(symbol)
// navigation.goToLine(line)
// navigation.goBack()
// navigation.goForward()
// navigation.history
```

## Benefits of New Architecture

### 1. **Clear Separation of Concerns**
- UI components focus only on presentation
- Features encapsulate business logic
- Pages orchestrate high-level flows

### 2. **Improved Testability**
- Components can be tested in isolation
- Features can be tested without UI
- Pages can be tested with mocked features

### 3. **Better Reusability**
- Components are pure and reusable
- Features can be used in different contexts
- Clear APIs make integration easier

### 4. **Easier Maintenance**
- Changes are localized to specific layers
- Dependencies are explicit
- Code is easier to understand

### 5. **Scalability**
- New features can be added independently
- Components can be shared across features
- Pages can be composed from features

## Migration Strategy

### Phase 1: Extract Features
1. Extract OutlineTree feature
2. Extract CodeNavigation feature

### Phase 2: Refactor Components
1. Extract pure UI components
2. Remove business logic
3. Create component APIs

### Phase 3: Update Dependencies
1. Update imports across codebase
2. Update documentation
3. Create migration examples

## Breaking Changes

### Import Paths
```javascript
// Old
import OutlineView from '@symphony/outlineview';
import { outlineAtom } from '@symphony/outlineview';

// New
import { OutlineList } from '@symphony/outlineview';
import { useOutlineTree } from '@symphony/features/OutlineTree';
import { useCodeNavigation } from '@symphony/features/CodeNavigation';
```

## Backward Compatibility

A compatibility layer will be maintained:

```javascript
// Deprecated but still works
export { OutlineList as default } from './components/OutlineList';
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
2. ⏳ Extract OutlineTree feature
3. ⏳ Extract CodeNavigation feature
4. ⏳ Refactor components layer
5. ⏳ Update workspace configuration
6. ⏳ Test and verify refactoring

---

**Last Updated**: October 13, 2025
**Author**: Symphony Development Team
