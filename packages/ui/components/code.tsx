import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@symphony/shared';

const codeVariants = cva('font-mono', {
  variants: {
    variant: {
      inline: 'bg-muted px-1.5 py-0.5 rounded text-sm',
      block: 'bg-muted p-4 rounded-lg text-sm overflow-x-auto block whitespace-pre-wrap',
    },
  },
  defaultVariants: {
    variant: 'inline',
  },
});

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <code
        className={cn(codeVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Code.displayName = 'Code';

export { Code, codeVariants };
