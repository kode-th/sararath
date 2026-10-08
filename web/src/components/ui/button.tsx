import { Button as ButtonPrimitive } from '@base-ui/react/button';

import { cn } from '@/lib/cn';

type ButtonVariant = 'default' | 'solid';
type ButtonSize = 'default' | 'icon';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 border-2 font-display text-sm font-semibold whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  default:
    'border-foreground bg-card text-foreground hover:bg-foreground hover:text-primary-foreground',
  solid:
    'border-transparent bg-foreground text-primary-foreground hover:bg-foreground/90 hover:text-primary-foreground',
};

const SIZES: Record<ButtonSize, string> = {
  default: 'h-11 px-6',
  icon: 'size-10 p-0',
};

function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: Readonly<ButtonPrimitive.Props & { variant?: ButtonVariant; size?: ButtonSize }>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        typeof className === 'string' ? className : undefined,
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
