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
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'primary',
  href
}: StatCardProps) {
  const content = (
    <Flex direction="column" gap="2">
      <Text as="p" size="2" color="gray">
        {label}
      </Text>
      <Heading as="h3" size="6">
        {value}
      </Heading>
      {hint && (
        <Text as="p" size="2" color={toneColor[tone]}>
          {hint}
        </Text>
      )}
    </Flex>
  );

  return href ? (
    <Card asChild size="2">
      <NextLink href={href}>{content}</NextLink>
    </Card>
  ) : (
    <Card size="2">{content}</Card>
  );
}
