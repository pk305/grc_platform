import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import type { TextProps } from '@radix-ui/themes';

export type StatCardTone = 'primary' | 'success' | 'warning' | 'danger';

const toneColor: Record<StatCardTone, TextProps['color']> = {
  primary: undefined,
  success: 'green',
  warning: 'amber',
  danger: 'red'
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatCardTone;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'primary',
  href,
  onClick,
  selected
}: StatCardProps) {
  const content = (
    <Flex direction="column" gap="2">
      <Text as="p" size="2" color="gray" className="mb-1">
        {label}
      </Text>
      <Heading as="h3" size="6" className="mb-1">
        {value}
      </Heading>
      {hint && (
        <Text as="p" size="2" color={toneColor[tone]} className="mb-0">
          {hint}
        </Text>
      )}
    </Flex>
  );

  if (href) {
    return (
      <Card asChild size="2" style={{ background: 'var(--color-panel-solid)' }}>
        <NextLink href={href}>{content}</NextLink>
      </Card>
    );
  }

  if (onClick) {
    return (
      <Card
        size="2"
        style={{
          background: selected ? 'var(--accent-2)' : 'var(--color-panel-solid)',
          boxShadow: selected
            ? 'inset 0 0 0 1px var(--accent-9)'
            : 'var(--base-card-surface-box-shadow)'
        }}
      >
        <button
          type="button"
          onClick={onClick}
          aria-pressed={selected}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
            border: 'none',
            background: 'none',
            padding: 0,
            font: 'inherit',
            color: 'inherit'
          }}
        >
          {content}
        </button>
      </Card>
    );
  }

  return (
    <Card size="2" style={{ background: 'var(--color-panel-solid)' }}>
      {content}
    </Card>
  );
}
