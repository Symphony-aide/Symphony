# OutlineView Migration Guide
## [Page, Feature, Component] Architecture

## Overview
This guide helps you migrate from the simple outlineview component to the new OutlineTree and CodeNavigation features in `@symphony/features`.

## What Changed

The outlineview package now focuses on **UI components**, while **feature-level abstractions** have been extracted to `@symphony/features`.

### Component Package (`@symphony/outlineview`)
**Now contains**:
- Pure UI components for displaying outline
- No business logic
- Receives data via props

### New Features (`@symphony/features`)
**Now provides**:
- `OutlineTree` - Parse code and build outline tree
- `CodeNavigation` - Navigate to code locations

## Migration Examples

### Example 1: Basic Outline Display

#### Before
```javascript
import OutlineView from '@symphony/outlineview';
import { useAtom } from 'jotai';
import { outlineAtom } from '@symphony/outlineview';

function MyEditor() {
  const [outline, setOutline] = useAtom(outlineAtom);

  // Manually parse and set outline
  useEffect(() => {
    const parsed = parseCode(code);
    setOutline(parsed);
  }, [code]);

  return (
    <OutlineView onSelectItem={(item) => goToLine(item.line)} />
  );
}
```

#### After (Using Features)
```javascript
import { useOutlineTree } from '@symphony/features/OutlineTree';
import { useCodeNavigation } from '@symphony/features/CodeNavigation';
import { OutlineList } from '@symphony/outlineview';

function MyEditor() {
  const outlineTree = useOutlineTree({ code, language: 'javascript' });
  const navigation = useCodeNavigation({
    onNavigate: (location) => editorRef.current?.goToLine(location.line)
  });

  return (
    <OutlineList 
      outline={outlineTree.outline}
      onSelectItem={navigation.goToSymbol}
    />
  );
}
```

### Example 2: Outline with Search and Filter

#### New Pattern
```javascript
import { useOutlineTree } from '@symphony/features/OutlineTree';
import { OutlineList, OutlineSearch } from '@symphony/outlineview';

function MyOutlinePanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const outlineTree = useOutlineTree({
    code,
    language: 'javascript',
    searchTerm,
    typeFilter,
    sortBy: 'name'
  });

  return (
    <div>
      <OutlineSearch 
        value={searchTerm}
        onChange={setSearchTerm}
        types={outlineTree.availableTypes}
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
      />
      <OutlineList 
        outline={outlineTree.outline}
        isLoading={outlineTree.isLoading}
        error={outlineTree.error}
      />
    </div>
  );
}
```

### Example 3: Code Navigation with History

#### New Pattern
```javascript
import { useCodeNavigation } from '@symphony/features/CodeNavigation';

function MyEditor() {
  const navigation = useCodeNavigation({
    onNavigate: (location) => {
      if (location.type === 'symbol') {
        editorRef.current?.goToLine(location.symbol.line);
      } else if (location.type === 'line') {
        editorRef.current?.goToLine(location.line);
      }
    }
  });

  return (
    <div>
      <button onClick={navigation.goBack} disabled={!navigation.canGoBack}>
        Back
      </button>
      <button onClick={navigation.goForward} disabled={!navigation.canGoForward}>
        Forward
      </button>
      <div>History: {navigation.history.length} locations</div>
    </div>
  );
}
```

### Example 4: Feature Component Pattern

#### New Pattern (Render Prop)
```javascript
import { OutlineTreeFeature } from '@symphony/features/OutlineTree';
import { CodeNavigationFeature } from '@symphony/features/CodeNavigation';

function MyApp() {
  return (
    <OutlineTreeFeature code={code} language="javascript">
      {(outlineTree) => (
        <CodeNavigationFeature onNavigate={handleNavigate}>
          {(navigation) => (
            <div>
              <OutlineList 
                outline={outlineTree.outline}
                onSelectItem={navigation.goToSymbol}
              />
              <NavigationButtons navigation={navigation} />
            </div>
          )}
        </CodeNavigationFeature>
      )}
    </OutlineTreeFeature>
  );
}
```

## API Changes

### OutlineTree Feature

| Feature | Description |
|---------|-------------|
| `useOutlineTree()` | Parse code and manage outline tree |
| `useOutlineParser()` | Parse code to extract symbols |
| `useOutlineFilter()` | Filter and sort outline |
| `OutlineTreeFeature` | Render prop component |

### useOutlineTree API

```javascript
const outlineTree = useOutlineTree({
  code: 'function hello() {}',
  language: 'javascript',
  searchTerm: '',
  typeFilter: 'all',
  sortBy: 'line'
});

// State
outlineTree.outline          // Filtered outline array
outlineTree.rawOutline       // Unfiltered outline array
outlineTree.isLoading        // boolean
outlineTree.error            // string | null
outlineTree.availableTypes   // string[] - all symbol types
outlineTree.groupedOutline   // Object - grouped by type

// Operations
outlineTree.parse(code, language)     // Parse new code
outlineTree.getSymbolAtLine(line)     // Get symbol at line
outlineTree.getSymbolsByType(type)    // Get symbols by type
outlineTree.clear()                   // Clear outline
```

### CodeNavigation Feature

| Feature | Description |
|---------|-------------|
| `useCodeNavigation()` | Navigate code with history |
| `CodeNavigationFeature` | Render prop component |

### useCodeNavigation API

```javascript
const navigation = useCodeNavigation({
  onNavigate: (location) => console.log('Navigate to:', location)
});

// State
navigation.currentLocation   // Current location object
navigation.history          // Array of locations
navigation.historyIndex     // Current index in history
navigation.canGoBack        // boolean
navigation.canGoForward     // boolean

// Operations
navigation.goToSymbol(symbol)  // Navigate to symbol
navigation.goToLine(line)      // Navigate to line
navigation.goBack()            // Go back in history
navigation.goForward()         // Go forward in history
navigation.clearHistory()      // Clear navigation history
```

## Symbol Types

```javascript
import { SYMBOL_TYPES, getSymbolIcon, getSymbolColor } from '@symphony/features/OutlineTree';

// Available types
SYMBOL_TYPES.FUNCTION    // 'function'
SYMBOL_TYPES.CLASS       // 'class'
SYMBOL_TYPES.METHOD      // 'method'
SYMBOL_TYPES.VARIABLE    // 'variable'
SYMBOL_TYPES.CONSTANT    // 'constant'

// Utilities
getSymbolIcon('function')  // Returns icon string
getSymbolColor('function') // Returns Tailwind class
```

## Step-by-Step Migration

### Step 1: Install/Update Packages
```bash
pnpm install
```

### Step 2: Update Imports
```javascript
// Change this
import OutlineView from '@symphony/outlineview';
import { outlineAtom } from '@symphony/outlineview';

// To this
import { useOutlineTree } from '@symphony/features/OutlineTree';
import { useCodeNavigation } from '@symphony/features/CodeNavigation';
import { OutlineList } from '@symphony/outlineview';
```

### Step 3: Replace Atom with Hook
```javascript
// Old
const [outline, setOutline] = useAtom(outlineAtom);

// New
const outlineTree = useOutlineTree({ code, language });
```

### Step 4: Update Component Usage
```javascript
// Old
<OutlineView onSelectItem={handleSelect} />

// New
<OutlineList 
  outline={outlineTree.outline}
  onSelectItem={navigation.goToSymbol}
/>
```

## Common Issues

### Issue 1: Import Errors
**Problem**: `Cannot find module '@symphony/features/OutlineTree'`

**Solution**: Run `pnpm install` to ensure features package is installed.

### Issue 2: Outline Not Updating
**Problem**: Outline doesn't update when code changes

**Solution**: Ensure you're passing code to useOutlineTree:
```javascript
const outlineTree = useOutlineTree({ code, language });
```

### Issue 3: Navigation Not Working
**Problem**: Clicking outline items doesn't navigate

**Solution**: Provide onNavigate callback:
```javascript
const navigation = useCodeNavigation({
  onNavigate: (location) => editorRef.current?.goToLine(location.line)
});
```

## Benefits of New Architecture

### 1. **Cleaner Separation**
- UI components focus on display
- Features handle parsing and navigation
- Clear API boundaries

### 2. **Better Reusability**
- Use outline parsing in any component
- Share navigation across different views
- Compose features as needed

### 3. **Improved Testability**
- Test parsing logic independently
- Test navigation without UI
- Mock features for component tests

### 4. **Enhanced Flexibility**
- Filter and sort outline easily
- Track navigation history
- Customize parsing behavior

## Next Steps

1. ✅ Update imports to use OutlineTree feature
2. ✅ Replace atom with useOutlineTree hook
3. ✅ Add CodeNavigation for navigation
4. ⏳ Test outline parsing
5. ⏳ Test navigation history

---

**Last Updated**: October 13, 2025
