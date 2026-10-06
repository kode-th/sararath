import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 border-2 font-display text-sm font-semibold whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'border-foreground bg-card text-foreground hover:bg-foreground hover:text-primary-foreground',
        solid:
          'border-transparent bg-foreground text-primary-foreground hover:bg-foreground/90 hover:text-primary-foreground',
      },
      size: {
        default: 'h-11 px-6',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: Readonly<ButtonPrimitive.Props & VariantProps<typeof buttonVariants>>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
