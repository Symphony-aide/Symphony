# Implementation Plan

- [x] 1. Audit and prepare UI package
  - [x] 1.1 Audit existing UI components for completeness ✓
  - [x] 1.2 Create missing UI components if needed ✓
    - Updated Flex component to support `as` prop for semantic HTML

- [x] 2. Migrate ActivityBar component
  - [x] 2.1 Update ActivityBar.jsx to use UI components ✓
  - [x] 2.2 Update ActivityButton sub-component ✓
  - [x] 2.3 Update UserSection sub-component ✓
  - [x] 2.4 Write property test for ActivityBar UI component usage ✓

- [x] 3. Migrate StatusBar component
  - [x] 3.1 Update StatusBar.jsx to use UI components ✓
  - [x] 3.2 Update status item rendering ✓
  - [x] 3.3 Write property test for StatusBar UI component usage ✓

- [x] 4. Checkpoint - ActivityBar and StatusBar migrated

- [x] 5. Migrate FileExplorer component
  - [x] 5.1 Update FileExplorer.jsx main component ✓
  - [x] 5.2 Update Tabs section ✓
  - [x] 5.3 Update FileTreeNode sub-component ✓
  - [x] 5.4 Update FilterControls sub-component ✓
  - [x] 5.5 Update ContextMenu sub-component ✓
  - [x] 5.6 Update ActionButtons sub-component ✓
  - [x] 5.7 Write property test for FileExplorer UI component usage ✓

- [x] 6. Migrate TabBar component
  - [x] 6.1 Update TabBar main component ✓
  - [x] 6.2 Update Tab sub-component (close buttons) ✓
  - [x] 6.3 Update tab overflow handling (DropdownMenu) ✓
  - [x] 6.4 Write property test for TabBar UI component usage ✓

- [x] 7. Checkpoint - FileExplorer and TabBar migrated

- [x] 8. Migrate Header component
  - [x] 8.1 Update Header main component ✓
  - [x] 8.2 Update Logo sub-component ✓
  - [x] 8.3 Write property test for Header UI component usage






- [x] 9. Migrate Settings component
  - [x] 9.1 Update SettingsModal main component ✓
  - [x] 9.2 Update remaining settings sub-components ✓
    - [x] AutoSaveSettings - migrated to use Flex, Heading, Text components
    - [x] EditorThemeSettings - migrated to use Flex, Box, Select, Input, Label
    - [x] TerminalSettings - migrated to use Flex, Box, Select, Input, Label
    - [x] GlyphMarginSettings - migrated to use Card, Heading, Checkbox, Flex
    - [x] TabCompletionSettings - migrated to use Card, Heading, Text, Checkbox, Flex
    - [x] GlobalSearchReplace - migrated to use Flex, Input, Button
    - [x] ShortcutSettingsModal - migrated to use Flex, Text, Input, Button
    - [x] EnhancedThemeSettings - migrated to use Flex, Card, Heading, Box, Button
  - [x] 9.3 Update action buttons ✓
  - [x] 9.4 Write property test for Settings UI component usage ✓
    - Property 1: No Pure HTML Elements - tests all settings components
    - Property 5: Component Functionality Preservation - tests interactions






- [x] 10. Migrate CommandPalette component
  - [x] 10.1 Update CommandPalette main component ✓
    - Replaced `<div>` with `<Box>` and `<Flex>` components
    - Replaced `<span>` with `<Text>` component
    - Replaced `<p>` with `<Text size="xs">` component
  - [x] 10.2 Update keyboard shortcut display ✓
    - Replaced `<kbd>` with `<Code>` component
  - [x] 10.3 Write property test for CommandPalette UI component usage ✓
    - Property 1: No Pure HTML Elements - tests Box, Flex, Text, Code usage
    - Property 2: Layout Components Usage - tests Flex align/justify props
    - Property 3: Typography Components Usage - tests Text with size prop
    - Property 5: Component Functionality Preservation - tests interactions

- [x] 11. Checkpoint - Ensure Header, Settings, CommandPalette tests pass






- [x] 12. Migrate NotificationCenter component

  - [x] 12.1 Update NotificationCenter main component ✓
    - Replaced `<div>` with `<Box>` and `<Flex>` components
    - Replaced `<h3>` with `<Heading>` component
    - Replaced `<p>` with `<Text>` component
    - Updated NotificationItem to use Button, Flex, Box, Text components
  - [x] 12.2 Write property test for NotificationCenter UI component usage ✓
    - Property 1: No Pure HTML Elements - tests Box, Flex, Text, Heading usage
    - Property 2: Layout Components Usage - tests Flex align/justify props
    - Property 5: Component Functionality Preservation - tests interactions


- [x] 13. Migrate WelcomeScreen component
  - [x] 13.1 Update WelcomeScreen main component ✓
    - Replaced `<div>` with `<Flex>`, `<Box>`, `<Grid>` components
    - Replaced `<h1>` with `<Heading level={1}>` component
    - Replaced `<p>` with `<Text size="lg">` component
    - Replaced `<span>` with `<Text as="span">` component
    - Updated footer links to use Flex with gap prop
  - [x] 13.2 Write property test for WelcomeScreen UI component usage ✓
    - Property 1: No Pure HTML Elements - tests Flex, Box, Grid, Heading, Text usage
    - Property 2: Layout Components Usage - tests Flex align/justify and Grid cols props
    - Property 3: Typography Components Usage - tests Heading level and Text size props
    - Property 5: Component Functionality Preservation - tests all interactions


- [x] 14. Migrate remaining components

  - [x] 14.1 Migrate OutlineView component ✓
    - Replaced `<div>` with `<ScrollArea>`, `<Box>`, `<Flex>` components
    - Replaced `<h2>` with `<Heading as="h6">` component
    - Replaced `<p>` with `<Text>` component
    - Replaced `<ul>/<li>` with `<Flex direction="column">` components
    - Replaced `<span>` with `<Text as="span">` components
  - [x] 14.2 Migrate ModeSwitcher component ✓
    - Replaced `<div>` with `<Flex>` component
    - Already using ToggleGroup and ToggleGroupItem from UI
  - [x] 14.3 Migrate QuickActionCard component ✓
    - Replaced `<button>` with `<Button>` component
    - Replaced `<div>` with `<Flex>`, `<Box>` components
    - Replaced `<h3>` with `<Heading as="h6">` component
    - Replaced `<p>` with `<Text>` component
  - [x] 14.4 Migrate MusicalBackground component ✓
    - Replaced `<div>` with `<Box>` components
  - [x] 14.5 Write property tests for remaining components ✓
    - OutlineView: Property 1, 2, 3, 5 tests
    - ModeSwitcher: Property 1, 2, 4, 5 tests
    - QuickActionCard: Property 1, 2, 3, 4, 5 tests
    - MusicalBackground: Property 1, 2, 5 tests



- [x] 15. Final Checkpoint - Ensure all tests pass

  - All 210 property tests pass across 13 migrated components
  - Fixed missing vitest.config.js for file-explorer and tab-bar packages

- [x] 15.1 Migrate CodeEditor component (added)
  - [x] Update EditorPanel.jsx to use Flex, Box, Text, Button components
  - [x] Update Editor.jsx to use Flex, Box, Text components
  - [x] Update EditorTabs.jsx to use Flex, Text, Button components
  - [x] Update LayoutManager.jsx to use Flex, Box, Heading, Button components
  - [x] Write property tests for CodeEditor UI component usage (10 tests pass)

- [x] 15.2 Migrate SyntaxHighlighter component (added)
  - [x] Update SyntaxHighlighter.jsx to use Box, Flex, Text components
    - Replaced outer `<div>` with `<Box>` component
    - Replaced line container `<div>` with `<Flex align="start">` component
    - Replaced line number `<span>` with `<Text as="span">` component
    - Replaced token `<span>` with `<Text as="span">` component





- [x] 16. Update documentation





  - [x] 16.1 Update component README files
    - [x] TabBar README updated with UI component architecture
    - [x] NotificationCenter README updated with UI component architecture
    - [x] WelcomeScreen README updated with UI component architecture
  - [x] 16.2 Create migration guide
    - [x] TabBar MIGRATION_GUIDE.md created
