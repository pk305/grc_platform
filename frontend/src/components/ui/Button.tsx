'use client';

import { forwardRef } from 'react';
import { Button as RadixButton } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';

export type ButtonProps = ComponentPropsWithoutRef<typeof RadixButton>;

/**
 * App-wide entry point for Radix's Button — import this instead of
 * '@radix-ui/themes' directly so defaults live in one place.
 */
export const Button = forwardRef<ElementRef<typeof RadixButton>, ButtonProps>(
  function Button({ size = '3', ...props }, ref) {
    return <RadixButton ref={ref} size={size} {...props} />;
  }
);
