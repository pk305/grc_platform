'use client';

import type { ReactNode } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';

export interface SectionCardProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

/** Titled panel used for every block on the profile page. */
export function SectionCard({
  title,
  description,
  action,
  children
}: SectionCardProps) {
  return (
    <Card size="2" style={{ background: 'var(--color-panel-solid)' }}>
      <Flex justify="between" align="start" gap="3" mb="3">
        <Box>
          <Text as="div" weight="medium">
            {title}
          </Text>
          {description && (
            <Text as="div" size="1" color="gray" mt="1">
              {description}
            </Text>
          )}
        </Box>
        {action}
      </Flex>
      {children}
    </Card>
  );
}
