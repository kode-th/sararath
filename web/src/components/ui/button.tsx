import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 border-2 border-foreground bg-card px-6 font-display text-sm font-semibold text-foreground whitespace-nowrap transition-colors duration-150 hover:bg-foreground hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-60',
);

function Button({ className, ...props }: Readonly<ButtonPrimitive.Props>) {
  return (
    <ButtonPrimitive data-slot="button" className={cn(buttonVariants(), className)} {...props} />
  );
}

export { Button, buttonVariants };
