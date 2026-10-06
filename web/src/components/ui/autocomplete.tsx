import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export const {
  Root: AutocompleteRoot,
  Input: AutocompleteInput,
  Portal: AutocompletePortal,
  Group: AutocompleteGroup,
  Collection: AutocompleteCollection,
} = AutocompletePrimitive;

export function AutocompletePositioner({
  className,
  ...props
}: Readonly<ComponentProps<typeof AutocompletePrimitive.Positioner>>) {
  return <AutocompletePrimitive.Positioner className={cn('z-50', className)} {...props} />;
}

export function AutocompletePopup({
  className,
  ...props
}: Readonly<ComponentProps<typeof AutocompletePrimitive.Popup>>) {
  return (
    <AutocompletePrimitive.Popup
      className={cn('w-(--anchor-width) border-2 border-foreground bg-card', className)}
      {...props}
    />
  );
}

export function AutocompleteList({
  className,
  ...props
}: Readonly<ComponentProps<typeof AutocompletePrimitive.List>>) {
  return (
    <AutocompletePrimitive.List
      className={cn('max-h-80 overflow-y-auto py-1 data-empty:hidden', className)}
      {...props}
    />
  );
}

export function AutocompleteGroupLabel({
  className,
  ...props
}: Readonly<ComponentProps<typeof AutocompletePrimitive.GroupLabel>>) {
  return (
    <AutocompletePrimitive.GroupLabel
      className={cn(
        'block px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground select-none',
        className,
      )}
      {...props}
    />
  );
}

export function AutocompleteItem({
  className,
  ...props
}: Readonly<ComponentProps<typeof AutocompletePrimitive.Item>>) {
  return (
    <AutocompletePrimitive.Item
      className={cn(
        'cursor-default px-3 py-2 text-sm text-foreground data-highlighted:bg-foreground data-highlighted:text-primary-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function AutocompleteStatus({
  className,
  ...props
}: Readonly<ComponentProps<typeof AutocompletePrimitive.Status>>) {
  return (
    <AutocompletePrimitive.Status
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
