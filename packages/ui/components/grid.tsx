import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@symphony/shared';

const gridVariants = cva('grid', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    },
    rows: {
      1: 'grid-rows-1',
      2: 'grid-rows-2',
      3: 'grid-rows-3',
      4: 'grid-rows-4',
      5: 'grid-rows-5',
      6: 'grid-rows-6',
    },
    gap: {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    alignItems: {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      stretch: 'items-stretch',
    },
    justifyItems: {
      start: 'justify-items-start',
      end: 'justify-items-end',
      center: 'justify-items-center',
      stretch: 'justify-items-stretch',
    },
  },
  defaultVariants: {
    columns: 1,
    gap: 'none',
    alignItems: 'stretch',
    justifyItems: 'stretch',
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, columns, rows, gap, alignItems, justifyItems, ...props }, ref) => {
    return (
      <div
        className={cn(gridVariants({ columns, rows, gap, alignItems, justifyItems, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Grid.displayName = 'Grid';

export { Grid, gridVariants };
