import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@symphony/shared';

const flexVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
      column: 'flex-col',
      'column-reverse': 'flex-col-reverse',
    },
    justify: {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    align: {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    wrap: {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse',
    },
    gap: {
      none: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      sm: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      md: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      lg: 'gap-6',
      8: 'gap-8',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    direction: 'row',
    justify: 'start',
    align: 'stretch',
    wrap: 'nowrap',
    gap: 'none',
  },
});

type FlexElement = 'div' | 'aside' | 'section' | 'header' | 'footer' | 'nav' | 'main' | 'article';

export interface FlexProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof flexVariants> {
  as?: FlexElement;
}

const Flex = React.forwardRef<HTMLElement, FlexProps>(
  ({ className, direction, justify, align, wrap, gap, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        className={cn(flexVariants({ direction, justify, align, wrap, gap, className }))}
        ref={ref as React.Ref<HTMLDivElement>}
        {...props}
      />
    );
  }
);
Flex.displayName = 'Flex';

export { Flex, flexVariants };
