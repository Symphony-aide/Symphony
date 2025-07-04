import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Box, Flex, IconButton, Button } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Carousel orientation
 */
export type CarouselOrientation = 'horizontal' | 'vertical';

/**
 * Carousel autoplay direction
 */
export type CarouselAutoplayDirection = 'forward' | 'backward';

/**
 * Performance optimization options for carousel
 */
export interface CarouselPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle navigation events (ms) */
  throttleNavigation?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load slides */
  lazyLoad?: boolean;
  /** Preload adjacent slides */
  preloadAdjacent?: boolean;
}

/**
 * Carousel autoplay options
 */
export interface CarouselAutoplayOptions {
  /** Enable autoplay */
  enabled?: boolean;
  /** Autoplay interval (ms) */
  interval?: number;
  /** Autoplay direction */
  direction?: CarouselAutoplayDirection;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Pause on focus */
  pauseOnFocus?: boolean;
}

/**
 * Carousel props
 */
export interface CarouselProps {
  /** Carousel items */
  children: React.ReactNode[];
  /** Current slide index */
  index?: number;
  /** Default slide index */
  defaultIndex?: number;
  /** Carousel orientation */
  orientation?: CarouselOrientation;
  /** Enable infinite loop */
  loop?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Show dots indicator */
  showDots?: boolean;
  /** Slides per view */
  slidesPerView?: number;
  /** Space between slides */
  spaceBetween?: number;
  /** Custom slide change handler */
  onSlideChange?: (index: number) => void;
  /** Autoplay options */
  autoplay?: CarouselAutoplayOptions;
  /** Performance optimization settings */
  performance?: CarouselPerformanceOptions;
  /** Storage key for state persistence */
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
 * Optimized navigation handler factory
 */
const useOptimizedNavigationHandler = (
  originalHandler?: (direction: 'prev' | 'next') => void,
  throttleMs?: number,
  analytics?: CarouselProps['analytics']
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = (direction: 'prev' | 'next') => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'carousel_navigate', {
          event_category: analytics.category || 'carousel',
          event_label: `${analytics.label || 'navigation'}_${direction}`,
        });
      }
      
      originalHandler(direction);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalHandler, throttleMs, analytics]);
};

/**
 * Autoplay hook
 */
const useAutoplay = (
  currentIndex: number,
  totalSlides: number,
  onNext: () => void,
  onPrev: () => void,
  options?: CarouselAutoplayOptions
) => {
  const [isPlaying, setIsPlaying] = useState(options?.enabled || false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const startAutoplay = useCallback(() => {
    if (!options?.enabled) return;
    
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      if (options.direction === 'backward') {
        onPrev();
      } else {
        onNext();
      }
    }, options.interval || 3000);
  }, [options, onNext, onPrev]);

  const stopAutoplay = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (options?.enabled) {
      startAutoplay();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [options?.enabled, startAutoplay]);

  return { isPlaying, startAutoplay, stopAutoplay };
};

/**
 * Slide animation variants
 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

/**
 * Optimized Carousel Component
 */
const CarouselComponent = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      children,
      index: controlledIndex,
      defaultIndex = 0,
      orientation = 'horizontal',
      loop = true,
      showArrows = true,
      showDots = true,
      slidesPerView = 1,
      spaceBetween = 16,
      onSlideChange,
      autoplay,
      performance = { memoize: true, throttleNavigation: 200, enableAnimations: true },
      storageKey,
      testId,
      analytics,
    },
    ref
  ) => {
    // State persistence
    const [persistedIndex, setPersistedIndex] = useLocalStorage<number>(
      storageKey || 'carousel-index',
      defaultIndex
    );

    // Internal state
    const [currentIndex, setCurrentIndex] = useState(
      controlledIndex ?? (performance.persistState && storageKey ? persistedIndex : defaultIndex)
    );
    const [direction, setDirection] = useState(0);

    const totalSlides = children.length;

    // Navigation handlers
    const goToNext = useCallback(() => {
      setDirection(1);
      const nextIndex = loop ? (currentIndex + 1) % totalSlides : Math.min(currentIndex + 1, totalSlides - 1);
      setCurrentIndex(nextIndex);
      
      if (performance.persistState && storageKey) {
        setPersistedIndex(nextIndex);
      }
      
      onSlideChange?.(nextIndex);
    }, [currentIndex, totalSlides, loop, onSlideChange, performance.persistState, storageKey, setPersistedIndex]);

    const goToPrev = useCallback(() => {
      setDirection(-1);
      const prevIndex = loop ? (currentIndex - 1 + totalSlides) % totalSlides : Math.max(currentIndex - 1, 0);
      setCurrentIndex(prevIndex);
      
      if (performance.persistState && storageKey) {
        setPersistedIndex(prevIndex);
      }
      
      onSlideChange?.(prevIndex);
    }, [currentIndex, totalSlides, loop, onSlideChange, performance.persistState, storageKey, setPersistedIndex]);

    const goToSlide = useCallback((index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      
      if (performance.persistState && storageKey) {
        setPersistedIndex(index);
      }
      
      onSlideChange?.(index);
    }, [currentIndex, onSlideChange, performance.persistState, storageKey, setPersistedIndex]);

    // Optimized navigation handlers
    const optimizedNavigationHandler = useOptimizedNavigationHandler(
      (dir: 'prev' | 'next') => dir === 'next' ? goToNext() : goToPrev(),
      performance.throttleNavigation,
      analytics
    );

    // Autoplay
    const { isPlaying, startAutoplay, stopAutoplay } = useAutoplay(
      currentIndex,
      totalSlides,
      goToNext,
      goToPrev,
      autoplay
    );

    // Handle controlled index changes
    useEffect(() => {
      if (controlledIndex !== undefined && controlledIndex !== currentIndex) {
        setCurrentIndex(controlledIndex);
      }
    }, [controlledIndex, currentIndex]);

    // Memoized navigation arrows
    const navigationArrows = useMemo(() => {
      if (!showArrows) return null;

      return (
        <>
          <IconButton
            aria-label="Previous slide"
            icon={<ChevronLeft size={20} />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            size="sm"
            variant="solid"
            colorScheme="blackAlpha"
            isDisabled={!loop && currentIndex === 0}
            onClick={() => optimizedNavigationHandler?.('prev')}
            data-testid={`${testId}-prev-arrow`}
          />
          <IconButton
            aria-label="Next slide"
            icon={<ChevronRight size={20} />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            size="sm"
            variant="solid"
            colorScheme="blackAlpha"
            isDisabled={!loop && currentIndex === totalSlides - 1}
            onClick={() => optimizedNavigationHandler?.('next')}
            data-testid={`${testId}-next-arrow`}
          />
        </>
      );
    }, [showArrows, loop, currentIndex, totalSlides, optimizedNavigationHandler, testId]);

    // Memoized dots indicator
    const dotsIndicator = useMemo(() => {
      if (!showDots) return null;

      return (
        <Flex
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          gap={2}
          zIndex={2}
        >
          {Array.from({ length: totalSlides }, (_, index) => (
            <Button
              key={index}
              size="xs"
              variant={index === currentIndex ? 'solid' : 'outline'}
              colorScheme="blackAlpha"
              borderRadius="full"
              w={2}
              h={2}
              minW={2}
              p={0}
              onClick={() => goToSlide(index)}
              data-testid={`${testId}-dot-${index}`}
            />
          ))}
        </Flex>
      );
    }, [showDots, totalSlides, currentIndex, goToSlide, testId]);

    // Memoized slides
    const slides = useMemo(() => {
      if (!performance.enableAnimations) {
        return (
          <Box
            transform={`translateX(-${currentIndex * (100 / slidesPerView)}%)`}
            transition="transform 0.3s ease-in-out"
            display="flex"
            width={`${(totalSlides * 100) / slidesPerView}%`}
          >
            {children.map((child, index) => (
              <Box
                key={index}
                flex={`0 0 ${100 / slidesPerView}%`}
                px={spaceBetween / 2}
                data-testid={`${testId}-slide-${index}`}
              >
                {child}
              </Box>
            ))}
          </Box>
        );
      }

      return (
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
            data-testid={`${testId}-slide-${currentIndex}`}
          >
            {children[currentIndex]}
          </motion.div>
        </AnimatePresence>
      );
    }, [
      performance.enableAnimations,
      currentIndex,
      direction,
      children,
      slidesPerView,
      spaceBetween,
      totalSlides,
      testId
    ]);

    // Handle autoplay pause/resume
    const handleMouseEnter = useCallback(() => {
      if (autoplay?.pauseOnHover) {
        stopAutoplay();
      }
    }, [autoplay?.pauseOnHover, stopAutoplay]);

    const handleMouseLeave = useCallback(() => {
      if (autoplay?.pauseOnHover && autoplay?.enabled) {
        startAutoplay();
      }
    }, [autoplay?.pauseOnHover, autoplay?.enabled, startAutoplay]);

    return (
      <Box
        ref={ref}
        position="relative"
        overflow="hidden"
        data-testid={testId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        h="400px" // Default height, can be overridden
      >
        {slides}
        {navigationArrows}
        {dotsIndicator}
      </Box>
    );
  }
);

CarouselComponent.displayName = 'OptimizedCarousel';

/**
 * Memoized OptimizedCarousel export
 */
export const OptimizedCarousel = React.memo(CarouselComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CarouselProps)[] = [
    'index', 'orientation', 'loop', 'showArrows', 'showDots', 'slidesPerView', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedCarousel;