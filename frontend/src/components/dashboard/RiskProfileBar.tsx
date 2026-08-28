import { Box, Flex, Text } from '@radix-ui/themes';

export interface RiskProfileLevel {
  level: string;
  count: number;
}

const LEVEL_META: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'var(--red-9)' },
  high: { label: 'High', color: 'var(--orange-9)' },
  medium: { label: 'Medium', color: 'var(--blue-9)' },
  low: { label: 'Low', color: 'var(--green-9)' }
};

export interface RiskProfileBarProps {
  profile: RiskProfileLevel[];
}

export function RiskProfileBar({ profile }: RiskProfileBarProps) {
  const total = profile.reduce((sum, row) => sum + row.count, 0);

  return (
    <Flex direction="column" gap="3">
      <Flex
        height="10px"
        width="100%"
        overflow="hidden"
        style={{ borderRadius: 'var(--radius-2)' }}
      >
        {profile.map(row => {
          const meta = LEVEL_META[row.level];
          const width = total > 0 ? (row.count / total) * 100 : 0;
          if (width === 0) return null;
          return (
            <Box
              key={row.level}
              style={{ width: `${width}%`, backgroundColor: meta?.color }}
            />
          );
        })}
      </Flex>

      <Flex gap="4" wrap="wrap">
        {profile.map(row => {
          const meta = LEVEL_META[row.level];
          return (
            <Flex key={row.level} align="center" gap="2">
              <Box
                width="8px"
                height="8px"
                style={{ borderRadius: '50%', backgroundColor: meta?.color }}
              />
              <Text size="2" color="gray">
                {meta?.label ?? row.level}
              </Text>
              <Text size="2" weight="bold">
                {row.count}
              </Text>
            </Flex>
          );
        })}
      </Flex>

      <Text size="1" color="gray">
        Levels use the organisation&apos;s risk criteria (ISO 31000 §6.3.4).
        Residual level shown where assessed, otherwise inherent.
      </Text>
    </Flex>
  );
}
