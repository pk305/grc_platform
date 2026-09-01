'use client';

import type { ReactNode } from 'react';
import { Text } from '@radix-ui/themes';
import { STRENGTH_LABELS, scoreStrength } from '@/lib/password';

const STRENGTH_COLORS = [
  'bg-300',
  'bg-danger',
  'bg-warning',
  'bg-info',
  'bg-success'
];

/** Four-segment strength indicator for a password being chosen. */
export function PasswordStrengthMeter({
  value,
  className = 'mb-3'
}: {
  value: string;
  className?: string;
}) {
  const score = scoreStrength(value);

  return (
    <div className={className}>
      <div className="d-flex gap-1 mb-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`rounded-pill ${i < score ? STRENGTH_COLORS[score] : 'bg-300'}`}
            style={{ height: 4, flex: 1 }}
          />
        ))}
      </div>
      <Text size="1" color="gray">
        Strength: {STRENGTH_LABELS[score]}
      </Text>
    </div>
  );
}

/** One line of the password policy, ticked once the new password satisfies it. */
export function PasswordRequirement({
  met,
  children
}: {
  met: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={`d-flex align-items-start gap-2 ${met ? 'text-success' : 'text-700'}`}
    >
      <span
        className={met ? 'far fa-check-circle mt-1' : 'far fa-circle mt-1'}
        aria-hidden="true"
        style={{ fontSize: '0.75rem' }}
      />
      <span className="fs--1">{children}</span>
    </li>
  );
}
