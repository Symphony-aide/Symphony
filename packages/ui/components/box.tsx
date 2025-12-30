import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@symphony/shared';

const boxVariants = cva('', {
  variants: {
    padding: {
      none: 'p-0',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    margin: {
      none: 'm-0',
      sm: 'm-2',
      md: 'm-4',
      lg: 'm-6',
      xl: 'm-8',
    },
    display: {
      block: 'block',
      inline: 'inline',
      'inline-block': 'inline-block',
      flex: 'flex',
      'inline-flex': 'inline-flex',
      grid: 'grid',
    },
  },
  defaultVariants: {
    padding: 'none',
    margin: 'none',
    display: 'block',
  },
});

export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boxVariants> {
  as?: React.ElementType;
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, padding, margin, display, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        className={cn(boxVariants({ padding, margin, display, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Box.displayName = 'Box';

export { Box, boxVariants };
