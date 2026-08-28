import { Box } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef } from 'react';

export type SkeletonProps = ComponentPropsWithoutRef<typeof Box>;

/**
 * Shimmering placeholder block for content that hasn't loaded yet. Size it
 * with `width`/`height` (props or `style`) to match what it's standing in
 * for — a line of text, a card, a table row.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <Box
      className={['skeleton', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
