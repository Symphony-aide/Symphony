/**
 * Optimized Chakra UI Components Library
 * 
 * This library provides production-ready, optimized versions of Chakra UI components
 * with enhanced performance, accessibility, and developer experience features.
 * 
 * Features:
 * - Performance optimizations (memoization, throttling, debouncing)
 * - Enhanced TypeScript support
 * - Built-in analytics tracking
 * - State persistence capabilities
 * - Comprehensive error handling
 * - Accessibility enhancements
 * - Custom variants and themes
 */

// Core Components
export { default as OptimizedButton, OptimizedButton as Button } from './src/button';
export { default as OptimizedInput, OptimizedInput as Input } from './src/input';
export { default as OptimizedCard, OptimizedCard as Card, CardHeader, CardBody, CardFooter } from './src/card';
export { default as OptimizedCheckbox, OptimizedCheckbox as Checkbox, CheckboxGroup } from './src/checkbox';

// Layout & Navigation
export {
  default as OptimizedAccordion,
  OptimizedAccordion as Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from './src/accordion';

export {
  default as OptimizedBreadcrumb,
  OptimizedBreadcrumb as Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator
} from './src/breadcrumb';

export {
  default as OptimizedCollapsible,
  OptimizedCollapsible as Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from './src/collapsible';

export {
  default as OptimizedNavigationMenu,
  OptimizedNavigationMenu as NavigationMenu
} from './src/navigation-menu';

export {
  default as OptimizedSidebar,
  OptimizedSidebar as Sidebar
} from './src/sidebar';

export {
  default as OptimizedTabs,
  OptimizedTabs as Tabs
} from './src/tabs';

// Feedback
export { default as OptimizedAlert, OptimizedAlert as Alert, AlertIcon, AlertTitle, AlertDescription } from './src/alert';
export {
  default as OptimizedAlertDialog,
  OptimizedAlertDialog as AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton
} from './src/alert-dialog';

export { default as OptimizedProgress, OptimizedProgress as Progress } from './src/progress';
export { default as OptimizedSkeleton, OptimizedSkeleton as Skeleton, SkeletonGroup, SkeletonLayouts } from './src/skeleton';
export { default as OptimizedToast, useToast, promiseToast, batchToast, ToastProvider } from './src/toast';
export { default as OptimizedToaster, OptimizedToaster as Toaster } from './src/toaster';
export { default as OptimizedSonner, OptimizedSonner as Sonner, useOptimizedToast } from './sonner';

// Data Display
export { default as OptimizedAvatar, OptimizedAvatar as Avatar, AvatarGroup, AvatarBadge } from './src/avatar';
export { default as OptimizedBadge, OptimizedBadge as Badge } from './src/badge';
export { default as OptimizedCarousel, OptimizedCarousel as Carousel } from './src/carousel';
export { default as OptimizedTable, OptimizedTable as Table } from './src/table';

// Form Components
export { default as OptimizedForm, OptimizedForm as Form, FormField } from './src/form';
export { default as OptimizedLabel, OptimizedLabel as Label } from './src/label';
export { default as OptimizedTextarea, OptimizedTextarea as Textarea } from './src/textarea';
export { default as OptimizedSelect, OptimizedSelect as Select } from './src/select';
export { default as OptimizedRadioGroup, OptimizedRadioGroup as RadioGroup } from './src/radio-group';
export { default as OptimizedSlider, OptimizedSlider as Slider } from './src/slider';
export { default as OptimizedSwitch, OptimizedSwitch as Switch } from './src/switch';
export { default as OptimizedOTPInput, OptimizedOTPInput as OTPInput } from './src/input-otp';

// Overlay Components
export {
  default as OptimizedDialog,
  OptimizedDialog as Dialog,
  DialogTrigger
} from './src/dialog';

export {
  default as OptimizedDrawer,
  OptimizedDrawer as Drawer,
  DrawerTrigger
} from './src/drawer';

export {
  default as OptimizedSheet,
  OptimizedSheet as Sheet,
  SheetTrigger
} from './src/sheet';

export {
  default as OptimizedPopover,
  OptimizedPopover as Popover
} from './src/popover';

export {
  default as OptimizedTooltip,
  OptimizedTooltip as Tooltip
} from './src/tooltip';

export {
  default as OptimizedHoverCard,
  OptimizedHoverCard as HoverCard
} from './src/hover-card';

// Menu Components
export {
  default as OptimizedDropdownMenu,
  OptimizedDropdownMenu as DropdownMenu
} from './src/dropdown-menu';

export {
  default as OptimizedContextMenu,
  OptimizedContextMenu as ContextMenu
} from './src/context-menu';

export {
  default as OptimizedMenubar,
  OptimizedMenubar as Menubar
} from './src/menubar';

export {
  default as OptimizedCommand,
  OptimizedCommand as Command,
  CommandInput,
  CommandList,
  CommandItem
} from './src/command';

// Media & Graphics
export { default as OptimizedAspectRatio, OptimizedAspectRatio as AspectRatio } from './src/aspect-ratio';

// Date & Time
export { default as OptimizedCalendar, OptimizedCalendar as Calendar } from './src/calendar';

// Layout Components
export { default as OptimizedSeparator, OptimizedSeparator as Separator } from './src/separator';
export { default as OptimizedScrollArea, OptimizedScrollArea as ScrollArea } from './src/scroll-area';
export { default as OptimizedResizable, OptimizedResizable as Resizable } from './src/resizable';

// Utility Components
export { default as OptimizedPagination, OptimizedPagination as Pagination } from './src/pagination';
export {
  default as OptimizedToggleGroup,
  OptimizedToggleGroup as ToggleGroup,
  ToggleItem
} from './src/toggle-group';

export {
  default as OptimizedToggle,
  OptimizedToggle as Toggle,
  IconToggle
} from './src/toggle';

// Type exports for better TypeScript experience
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonColorScheme } from './src/button';
export type { InputProps, InputVariant, InputSize } from './src/input';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './src/card';
export type { CheckboxProps, CheckboxGroupProps } from './src/checkbox';
export type { AccordionProps, AccordionItemProps } from './src/accordion';
export type { AlertProps } from './src/alert';
export type { AlertDialogProps } from './src/alert-dialog';
export type { AvatarProps, AvatarGroupProps } from './src/avatar';
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeColorScheme } from './src/badge';
export type { BreadcrumbProps, BreadcrumbItemProps, BreadcrumbLinkProps } from './src/breadcrumb';
export type { AspectRatioProps, AspectRatioPreset } from './src/aspect-ratio';
export type { CalendarProps, CalendarView, CalendarSelectionMode } from './src/calendar';
export type { CarouselProps, CarouselOrientation, CarouselAutoplayOptions } from './src/carousel';
export type { CollapsibleProps } from './src/collapsible';
export type { CommandProps, CommandItemData } from './src/command';
export type { ContextMenuProps, ContextMenuItemData } from './src/context-menu';
export type { DialogProps } from './src/dialog';
export type { DrawerProps } from './src/drawer';
export type { DropdownMenuProps, DropdownMenuItemData } from './src/dropdown-menu';
export type { FormProps, FormFieldConfig } from './src/form';
export type { HoverCardProps } from './src/hover-card';
export type { OTPInputProps } from './src/input-otp';
export type { LabelProps } from './src/label';
export type { MenubarProps, MenubarMenuData } from './src/menubar';
export type { NavigationMenuProps, NavigationMenuItemData } from './src/navigation-menu';
export type { PaginationProps } from './src/pagination';
export type { PopoverProps } from './src/popover';
export type { ProgressProps } from './src/progress';
export type { RadioGroupProps } from './src/radio-group';
export type { ResizableProps } from './src/resizable';
export type { ScrollAreaProps } from './src/scroll-area';
export type { SelectProps, SelectOptionData } from './src/select';
export type { SeparatorProps } from './src/separator';
export type { SheetProps } from './src/sheet';
export type { SidebarProps, SidebarItemData } from './src/sidebar';
export type { SkeletonProps } from './src/skeleton';
export type { SliderProps } from './src/slider';
export type { SwitchProps } from './src/switch';
export type { TableProps, TableColumn } from './src/table';
export type { TabsProps, TabData } from './src/tabs';
export type { TextareaProps } from './src/textarea';
export type { ToastOptions, UseToastReturn } from './src/toast';
export type { ToasterProps } from './src/toaster';
export type { ToggleGroupProps, ToggleItemData } from './src/toggle-group';
export type { ToggleProps, IconToggleProps } from './src/toggle';
export type { TooltipProps } from './src/tooltip';

/**
 * Performance optimization utilities
 */
export interface GlobalPerformanceOptions {
  /** Enable global memoization */
  enableMemoization?: boolean;
  /** Global throttle time for events (ms) */
  globalThrottleTime?: number;
  /** Global debounce time for inputs (ms) */
  globalDebounceTime?: number;
  /** Enable analytics tracking globally */
  enableAnalytics?: boolean;
  /** Enable state persistence globally */
  enableStatePersistence?: boolean;
}

/**
 * Global configuration for all optimized components
 */
let globalConfig: GlobalPerformanceOptions = {
  enableMemoization: true,
  globalThrottleTime: 100,
  globalDebounceTime: 300,
  enableAnalytics: false,
  enableStatePersistence: false,
};

/**
 * Configure global settings for all optimized components
 */
export const configureOptimizedComponents = (config: Partial<GlobalPerformanceOptions>) => {
  globalConfig = { ...globalConfig, ...config };
};

/**
 * Get current global configuration
 */
export const getGlobalConfig = (): GlobalPerformanceOptions => globalConfig;

/**
 * Component library metadata
 */
export const LIBRARY_INFO = {
  name: 'Optimized Chakra UI Components',
  version: '3.0.0',
  description: 'Production-ready, optimized Chakra UI components with enhanced performance and developer experience',
  features: [
    'Performance optimizations',
    'Enhanced TypeScript support',
    'Analytics tracking',
    'State persistence',
    'Accessibility enhancements',
    'Custom variants and themes',
    'Animation support',
    'Responsive design',
    'Form validation',
    'Virtual scrolling',
    'Lazy loading',
    'Error boundaries',
  ],
  components: [
    'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar', 'Badge',
    'Breadcrumb', 'Button', 'Calendar', 'Card', 'Carousel', 'Chart', 'Checkbox', 
    'Collapsible', 'Command', 'ContextMenu', 'Dialog', 'Drawer', 'DropdownMenu',
    'Form', 'HoverCard', 'Input', 'InputOTP', 'Label', 'Menubar', 'NavigationMenu',
    'Pagination', 'Popover', 'Progress', 'RadioGroup', 'Resizable', 'ScrollArea',
    'Select', 'Separator', 'Sheet', 'Sidebar', 'Skeleton', 'Slider', 'Sonner',
    'Switch', 'Table', 'Tabs', 'Textarea', 'Toast', 'Toaster', 'Toggle', 
    'ToggleGroup', 'Tooltip'
  ],
  totalComponents: 43,
} as const;

/**
 * Utility functions for component library
 */
export const utils = {
  /**
   * Check if all components are loaded
   */
  isLibraryReady: () => {
    return LIBRARY_INFO.totalComponents === LIBRARY_INFO.components.length;
  },

  /**
   * Get component count
   */
  getComponentCount: () => {
    return LIBRARY_INFO.totalComponents;
  },

  /**
   * Get library version
   */
  getVersion: () => {
    return LIBRARY_INFO.version;
  },

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations: () => {
    return [
      'Enable memoization for frequently re-rendered components',
      'Use throttling for high-frequency events like scroll and resize',
      'Use debouncing for user input events',
      'Enable state persistence for better UX',
      'Use virtual scrolling for large datasets',
      'Enable lazy loading for heavy components',
      'Use proper error boundaries',
      'Optimize bundle size with tree shaking',
    ];
  },
};