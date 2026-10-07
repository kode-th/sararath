import { Select as SelectPrimitive } from '@base-ui/react/select';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export const {
  Root: SelectRoot,
  Portal: SelectPortal,
  Value: SelectValue,
  ItemText: SelectItemText,
} = SelectPrimitive;

export function SelectTrigger({
  className,
  children,
  ...props
}: Readonly<ComponentProps<typeof SelectPrimitive.Trigger>>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-9 items-center gap-2 border-2 border-foreground bg-card px-3 font-display text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-accent/40',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown aria-hidden="true" className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectPositioner({
  className,
  alignItemWithTrigger = false,
  ...props
}: Readonly<ComponentProps<typeof SelectPrimitive.Positioner>>) {
  return (
    <SelectPrimitive.Positioner
      className={cn('z-50', className)}
      alignItemWithTrigger={alignItemWithTrigger}
      {...props}
    />
  );
}

export function SelectPopup({
  className,
  ...props
}: Readonly<ComponentProps<typeof SelectPrimitive.Popup>>) {
  return (
    <SelectPrimitive.Popup
      className={cn('min-w-(--anchor-width) border-2 border-foreground bg-card', className)}
      {...props}
    />
  );
}

export function SelectList({
  className,
  ...props
}: Readonly<ComponentProps<typeof SelectPrimitive.List>>) {
  return <SelectPrimitive.List className={cn('max-h-80 overflow-y-auto', className)} {...props} />;
}

export function SelectItem({
  className,
  ...props
}: Readonly<ComponentProps<typeof SelectPrimitive.Item>>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'cursor-default px-3 py-2 text-sm text-foreground data-highlighted:bg-foreground data-highlighted:text-primary-foreground',
        className,
      )}
      {...props}
    />
  );
}
