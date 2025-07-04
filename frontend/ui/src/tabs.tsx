import {
  Tabs as ChakraTabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  TabsProps as ChakraTabsProps,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Tab variants
 */
export type TabVariant = 'line' | 'enclosed' | 'enclosed-colored' | 'soft-rounded' | 'solid-rounded' | 'unstyled';

/**
 * Tab sizes
 */
export type TabSize = 'sm' | 'md' | 'lg';

/**
 * Tab orientations
 */
export type TabOrientation = 'horizontal' | 'vertical';

/**
 * Tab data
 */
export interface TabData {
  /** Tab key */
  key: string;
  /** Tab label */
  label: React.ReactNode;
  /** Tab content */
  content: React.ReactNode;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Tab icon */
  icon?: React.ReactElement;
  /** Tab badge */
  badge?: React.ReactNode;
}

/**
 * Performance optimization options for tabs
 */
export interface TabsPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle tab change events (ms) */
  throttleChange?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load tab content */
  lazyLoad?: boolean;
  /** Persist active tab */
  persistActiveTab?: boolean;
}

/**
 * Extended Tabs props with optimization features
 */
export interface TabsProps extends Omit<ChakraTabsProps, 'variant' | 'size' | 'orientation' | 'onChange'> {
  /** Tab variant */
  variant?: TabVariant;
  /** Tab size */
  size?: TabSize;
  /** Tab orientation */
  orientation?: TabOrientation;
  /** Tab data */
  tabs?: TabData[];
  /** Active tab key */
  activeTab?: string;
  /** Default active tab key */
  defaultActiveTab?: string;
  /** Custom tab change handler */
  onChange?: (tabKey: string, tabIndex: number) => void;
  /** Performance optimization settings */
  performance?: TabsPerformanceOptions;
  /** Storage key for active tab persistence */
  storageKey?: string;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

/**
 * Optimized tab change handler factory
 * @param originalOnChange
 * @param throttleMs
 * @param analytics
 */
const useOptimizedTabChangeHandler = (
  originalOnChange?: (tabKey: string, tabIndex: number) => void,
  throttleMs?: number,
  analytics?: TabsProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (tabKey: string, tabIndex: number) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'tabs_change', {
          event_category: analytics.category || 'tabs',
          event_label: `${analytics.label || 'tab'}_${tabKey}`,
          value: tabIndex,
        });
      }
      
      originalOnChange(tabKey, tabIndex);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnChange, throttleMs, analytics]);
};

/**
 * Animation variants for tab panels
 */
const tabPanelVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Optimized Tabs Component
 */
const TabsComponent = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      variant = 'line',
      size = 'md',
      orientation = 'horizontal',
      tabs = [],
      activeTab: controlledActiveTab,
      defaultActiveTab,
      onChange,
      performance = { 
        memoize: true, 
        throttleChange: 100, 
        enableAnimations: true,
        lazyLoad: false,
        persistActiveTab: false
      },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Active tab persistence
    const [persistedActiveTab, setPersistedActiveTab] = useLocalStorage<string>(
      storageKey || 'tabs-active',
      defaultActiveTab || tabs[0]?.key || ''
    );

    // Internal state
    const [internalActiveTab, setInternalActiveTab] = useState(
      controlledActiveTab ?? 
      (performance.persistActiveTab && storageKey ? persistedActiveTab : defaultActiveTab || tabs[0]?.key || '')
    );

    // Lazy loaded tabs state
    const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
      new Set(performance.lazyLoad ? [internalActiveTab] : tabs.map(tab => tab.key))
    );

    // Determine current active tab
    const currentActiveTab = controlledActiveTab ?? internalActiveTab;
    const activeTabIndex = tabs.findIndex(tab => tab.key === currentActiveTab);

    // Optimized tab change handler
    const optimizedChangeHandler = useOptimizedTabChangeHandler(
      onChange,
      performance.throttleChange,
      analytics
    );

    // Handle tab change
    const handleTabChange = useCallback((index: number) => {
      const tab = tabs[index];
      if (!tab || tab.disabled) return;

      if (controlledActiveTab === undefined) {
        setInternalActiveTab(tab.key);
      }

      if (performance.persistActiveTab && storageKey) {
        setPersistedActiveTab(tab.key);
      }

      if (performance.lazyLoad) {
        setLoadedTabs(prev => new Set([...prev, tab.key]));
      }

      optimizedChangeHandler?.(tab.key, index);
    }, [
      tabs,
      controlledActiveTab,
      optimizedChangeHandler,
      performance.persistActiveTab,
      performance.lazyLoad,
      storageKey,
      setPersistedActiveTab
    ]);

    // Memoized tab list
    const tabList = useMemo(() => (
      <TabList>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.key}
            isDisabled={tab.disabled}
            data-testid={`${testId}-tab-${tab.key}`}
          >
            {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span style={{ marginLeft: '8px' }}>{tab.badge}</span>}
          </Tab>
        ))}
      </TabList>
    ), [tabs, testId]);

    // Memoized tab panels
    const tabPanels = useMemo(() => {
      if (children) {
        return <TabPanels>{children}</TabPanels>;
      }

      return (
        <TabPanels>
          {tabs.map((tab, index) => {
            const isActive = index === activeTabIndex;
            const shouldLoad = !performance.lazyLoad || loadedTabs.has(tab.key);

            if (performance.enableAnimations) {
              const MotionTabPanel = motion(TabPanel);
              
              return (
                <TabPanel key={tab.key} p={0} data-testid={`${testId}-panel-${tab.key}`}>
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <MotionTabPanel
                        variants={tabPanelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        p={4}
                      >
                        {shouldLoad ? tab.content : null}
                      </MotionTabPanel>
                    )}
                  </AnimatePresence>
                </TabPanel>
              );
            }

            return (
              <TabPanel key={tab.key} data-testid={`${testId}-panel-${tab.key}`}>
                {shouldLoad ? tab.content : null}
              </TabPanel>
            );
          })}
        </TabPanels>
      );
    }, [
      children,
      tabs,
      activeTabIndex,
      performance.lazyLoad,
      performance.enableAnimations,
      loadedTabs,
      testId
    ]);

    // Memoized tabs props
    const tabsProps = useMemo(() => ({
      variant,
      size,
      orientation,
      index: activeTabIndex >= 0 ? activeTabIndex : 0,
      onChange: handleTabChange,
      'data-testid': testId,
      ...rest,
    }), [variant, size, orientation, activeTabIndex, handleTabChange, testId, rest]);

    return (
      <ChakraTabs ref={ref} {...tabsProps}>
        {tabList}
        {tabPanels}
      </ChakraTabs>
    );
  }
);

TabsComponent.displayName = 'OptimizedTabs';

/**
 * Memoized OptimizedTabs export
 */
export const OptimizedTabs = React.memo(TabsComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof TabsProps)[] = [
    'variant', 'size', 'orientation', 'tabs', 'activeTab', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'tabs') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedTabs;