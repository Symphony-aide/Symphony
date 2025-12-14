/**
 * @fileoverview UI Primitives Registration Module
 * @module @symphony/primitives/registration
 *
 * Provides centralized registration of UI components with the primitive system.
 * Maps primitive type strings to actual React components from packages/ui.
 */

import {
  registerComponent,
  getRegisteredComponent,
  getRegisteredTypes,
} from '../renderers/PrimitiveRenderer.jsx';

// Import UI components
import {
  // Layout
  Box,
  Card,
  Separator,
  ResizablePanel,
  // Interactive
  Button,
  Input,
  Checkbox,
  Switch,
  Slider,
  Toggle,
  RadioGroup,
  // Complex
  DropdownMenu,
  Tabs,
  Popover,
  Sheet,
  Accordion,
  // Display
  Badge,
  Avatar,
  Progress,
  Skeleton,
  Alert,
  // Navigation
  NavigationMenu,
  Breadcrumb,
  Pagination,
  Menubar,
  ContextMenu,
  // Form
  Label,
  Textarea,
  // Data Display
  Table,
  ScrollArea,
} from 'ui';

// Import wrappers
import {
  ContainerWrapper,
  FlexWrapper,
  GridWrapper,
  TextWrapper,
  SelectWrapper,
  TooltipWrapper,
  DialogWrapper,
  ListWrapper,
  FormWrapper,
} from './wrappers.jsx';

/**
 * @typedef {import('./types.js').RegistrationOptions} RegistrationOptions
 * @typedef {import('./types.js').RegistrationResult} RegistrationResult
 */

/**
 * Complete mapping of primitive types to UI components.
 * @type {Array<[string, React.ComponentType<any>]>}
 */
const UI_COMPONENT_MAP = [
  // Layout Components
  ['Box', Box],
  ['Container', ContainerWrapper],
  ['Flex', FlexWrapper],
  ['Grid', GridWrapper],
  ['Panel', Card],
  ['Divider', Separator],
  ['ResizablePanel', ResizablePanel],

  // Interactive Components
  ['Button', Button],
  ['Input', Input],
  ['Checkbox', Checkbox],
  ['Select', SelectWrapper],
  ['Switch', Switch],
  ['Slider', Slider],
  ['Toggle', Toggle],
  ['RadioGroup', RadioGroup],


  // Complex Components
  ['Dialog', DialogWrapper],
  ['Modal', DialogWrapper], // Alias for Dialog
  ['Dropdown', DropdownMenu],
  ['Tabs', Tabs],
  ['Tooltip', TooltipWrapper],
  ['Popover', Popover],
  ['Sheet', Sheet],
  ['Accordion', Accordion],

  // Display Components
  ['Text', TextWrapper],
  ['Badge', Badge],
  ['Avatar', Avatar],
  ['Progress', Progress],
  ['Skeleton', Skeleton],
  ['Alert', Alert],
  ['Card', Card],

  // Navigation Components
  ['NavigationMenu', NavigationMenu],
  ['Breadcrumb', Breadcrumb],
  ['Pagination', Pagination],
  ['Menubar', Menubar],
  ['ContextMenu', ContextMenu],

  // Form Components
  ['Label', Label],
  ['Textarea', Textarea],
  ['Form', FormWrapper],

  // Data Display Components
  ['Table', Table],
  ['List', ListWrapper],
  ['ScrollArea', ScrollArea],
];

/**
 * Gets the list of expected UI component types.
 * @returns {string[]} Array of expected type names
 */
export function getExpectedUITypes() {
  return UI_COMPONENT_MAP.map(([type]) => type);
}

/**
 * Gets the list of registered UI component types.
 * @returns {string[]} Array of registered type names from the expected list
 */
export function getRegisteredUITypes() {
  const expectedTypes = getExpectedUITypes();
  const registeredTypes = getRegisteredTypes();
  return expectedTypes.filter((type) => registeredTypes.includes(type));
}

/**
 * Checks if all expected UI components are registered.
 * @returns {boolean} True if all components are registered
 */
export function isFullyRegistered() {
  const expectedTypes = getExpectedUITypes();
  const registeredTypes = getRegisteredTypes();
  return expectedTypes.every((type) => registeredTypes.includes(type));
}

/**
 * Registers all UI components with the primitive system.
 *
 * @param {RegistrationOptions} [options={}] - Registration options
 * @returns {RegistrationResult} Result of the registration
 *
 * @example
 * // Register all components
 * const result = registerAllUIComponents();
 * console.log(`Registered: ${result.registered.length} components`);
 *
 * @example
 * // Override existing registrations
 * const result = registerAllUIComponents({ override: true });
 *
 * @example
 * // Silent mode (no warnings)
 * const result = registerAllUIComponents({ silent: true });
 */
export function registerAllUIComponents(options = {}) {
  const { override = false, silent = false } = options;

  /** @type {RegistrationResult} */
  const result = {
    registered: [],
    skipped: [],
    failed: [],
  };

  for (const [type, component] of UI_COMPONENT_MAP) {
    try {
      // Check if component is valid
      if (!component) {
        if (!silent) {
          console.warn(
            `[UI Registration] Invalid component for type "${type}"`
          );
        }
        result.failed.push(type);
        continue;
      }

      // Check if already registered
      const existing = getRegisteredComponent(type);
      if (existing && !override) {
        if (!silent) {
          console.warn(
            `[UI Registration] Type "${type}" already registered, skipping`
          );
        }
        result.skipped.push(type);
        continue;
      }

      // Register the component
      registerComponent(type, component);
      result.registered.push(type);
    } catch (error) {
      if (!silent) {
        console.error(
          `[UI Registration] Failed to register "${type}":`,
          error
        );
      }
      result.failed.push(type);
    }
  }

  return result;
}

// Re-export types
export * from './types.js';

// Re-export wrappers for customization
export {
  ContainerWrapper,
  FlexWrapper,
  GridWrapper,
  TextWrapper,
  SelectWrapper,
  TooltipWrapper,
  DialogWrapper,
  ListWrapper,
  FormWrapper,
} from './wrappers.jsx';
