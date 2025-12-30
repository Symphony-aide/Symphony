/**
 * FeedbackThemeContext - Theme context for feedback components
 *
 * Provides global theme configuration for all feedback components.
 * Integrates with Symphony's theme system for consistent styling.
 *
 * @module feedback/FeedbackThemeContext
 *
 * **Validates: Requirements 7.3**
 */

import * as React from 'react';
import type { FeedbackTheme } from './types';
import { DEFAULT_FEEDBACK_THEME } from './types';

/**
 * Context value interface for feedback theme.
 */
interface FeedbackThemeContextValue {
  /** Current theme configuration */
  theme: FeedbackTheme;
  /** Update theme configuration */
  setTheme: (theme: Partial<FeedbackTheme>) => void;
  /** Reset theme to defaults */
  resetTheme: () => void;
}

/**
 * Context for feedback theme configuration.
 */
const FeedbackThemeContext = React.createContext<FeedbackThemeContextValue | undefined>(
  undefined
);

/**
 * Props for FeedbackThemeProvider component.
 */
export interface FeedbackThemeProviderProps {
  /** Children to render */
  children: React.ReactNode;
  /** Initial theme configuration */
  initialTheme?: Partial<FeedbackTheme>;
}

/**
 * Provider component for feedback theme configuration.
 *
 * Wraps components to provide global theme configuration for all
 * feedback components within the tree.
 *
 * @example
 * ```tsx
 * // Basic usage with default theme
 * <FeedbackThemeProvider>
 *   <App />
 * </FeedbackThemeProvider>
 *
 * // With custom initial theme
 * <FeedbackThemeProvider
 *   initialTheme={{
 *     color: 'primary',
 *     size: 'lg',
 *     animationSpeed: 'fast',
 *   }}
 * >
 *   <App />
 * </FeedbackThemeProvider>
 * ```
 */
export function FeedbackThemeProvider({
  children,
  initialTheme,
}: FeedbackThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = React.useState<FeedbackTheme>(() => ({
    ...DEFAULT_FEEDBACK_THEME,
    ...initialTheme,
  }));

  const setTheme = React.useCallback((newTheme: Partial<FeedbackTheme>) => {
    setThemeState((prev) => ({ ...prev, ...newTheme }));
  }, []);

  const resetTheme = React.useCallback(() => {
    setThemeState(DEFAULT_FEEDBACK_THEME);
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, resetTheme }),
    [theme, setTheme, resetTheme]
  );

  return (
    <FeedbackThemeContext.Provider value={value}>
      {children}
    </FeedbackThemeContext.Provider>
  );
}

/**
 * Hook to access feedback theme configuration.
 *
 * Returns the current theme and functions to update it.
 * Falls back to default theme if used outside provider.
 *
 * @returns Theme context value with theme, setTheme, and resetTheme
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme } = useFeedbackTheme();
 *
 *   return (
 *     <button onClick={() => setTheme({ color: 'secondary' })}>
 *       Change Color
 *     </button>
 *   );
 * }
 * ```
 */
export function useFeedbackTheme(): FeedbackThemeContextValue {
  const context = React.useContext(FeedbackThemeContext);

  if (!context) {
    // Return default theme if used outside provider
    return {
      theme: DEFAULT_FEEDBACK_THEME,
      setTheme: () => {
        console.warn(
          '[FeedbackTheme] useFeedbackTheme called outside FeedbackThemeProvider. Theme changes will not persist.'
        );
      },
      resetTheme: () => {
        console.warn(
          '[FeedbackTheme] useFeedbackTheme called outside FeedbackThemeProvider. Theme changes will not persist.'
        );
      },
    };
  }

  return context;
}

/**
 * Merges component-level theme with global theme.
 *
 * Component-level theme takes precedence over global theme.
 *
 * @param globalTheme - Theme from context
 * @param componentTheme - Theme passed to component
 * @returns Merged theme configuration
 */
export function mergeThemes(
  globalTheme: FeedbackTheme,
  componentTheme?: Partial<FeedbackTheme>
): FeedbackTheme {
  if (!componentTheme) {
    return globalTheme;
  }
  return { ...globalTheme, ...componentTheme };
}

/**
 * Gets CSS classes for animation speed.
 *
 * @param speed - Animation speed variant
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns CSS class string for animation
 */
export function getAnimationClass(
  speed: FeedbackTheme['animationSpeed'],
  reducedMotion?: boolean
): string {
  if (reducedMotion || speed === 'none') {
    return 'animate-none';
  }

  switch (speed) {
    case 'slow':
      return 'duration-1000';
    case 'fast':
      return 'duration-300';
    case 'normal':
    default:
      return 'duration-500';
  }
}

/**
 * Gets CSS classes for spinner animation based on theme.
 *
 * @param theme - Feedback theme configuration
 * @returns CSS class string for spinner animation
 */
export function getSpinnerAnimationClass(theme: FeedbackTheme): string {
  if (theme.reducedMotion || theme.animationSpeed === 'none') {
    return '';
  }

  switch (theme.animationSpeed) {
    case 'slow':
      return 'animate-[spin_1.5s_linear_infinite]';
    case 'fast':
      return 'animate-[spin_0.5s_linear_infinite]';
    case 'normal':
    default:
      return 'animate-spin';
  }
}

/**
 * Gets CSS classes for border radius based on theme.
 *
 * @param borderRadius - Border radius variant
 * @returns CSS class string for border radius
 */
export function getBorderRadiusClass(
  borderRadius: FeedbackTheme['borderRadius']
): string {
  switch (borderRadius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-sm';
    case 'lg':
      return 'rounded-lg';
    case 'full':
      return 'rounded-full';
    case 'md':
    default:
      return 'rounded-md';
  }
}

export { FeedbackThemeContext };
