import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@symphony/shared';

const spinnerVariants = cva(
  'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
      },
      color: {
        default: 'text-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'default',
    },
  }
);

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(spinnerVariants({ size, color, className }))}
        {...props}
      />
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants };
