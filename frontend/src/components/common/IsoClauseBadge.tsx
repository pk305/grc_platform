'use client';

import { Badge, Flex } from '@radix-ui/themes';
import { isoControlLabel } from '@/lib/iso-controls';

/**
 * A bare Annex A clause number, with the control's title in its tooltip.
 * Keeps a card header short while still naming what the settings inside it
 * are there to satisfy.
 */
export function IsoClauseBadge({ clause }: { clause: string }) {
  return (
    <Badge variant="soft" color="gray" title={isoControlLabel(clause)}>
      {clause}
    </Badge>
  );
}

/** The clause set a section implements, laid out as one wrapping row. */
export function IsoClauseBadges({ clauses }: { clauses: readonly string[] }) {
  return (
    <Flex gap="1" wrap="wrap" justify="end">
      {clauses.map(clause => (
        <IsoClauseBadge key={clause} clause={clause} />
      ))}
    </Flex>
  );
}
