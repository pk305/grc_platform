'use client';

import { forwardRef } from 'react';
import { IconButton as RadixIconButton } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';

export type IconButtonProps = ComponentPropsWithoutRef<typeof RadixIconButton>;

/**
 * App-wide entry point for Radix's IconButton, defaulted to the quiet
 * "utility button" look (ghost/gray) used for things like field adornments.
 */
export const IconButton = forwardRef<
  ElementRef<typeof RadixIconButton>,
  IconButtonProps
>(function IconButton(
  { size = '2', variant = 'ghost', color = 'gray', ...props },
  ref
) {
  return (
    <RadixIconButton
      ref={ref}
      size={size}
      variant={variant}
      color={color}
      {...props}
    />
  );
});
