import { Box, Card, Flex, Grid } from '@radix-ui/themes';
import { Skeleton } from '@/components/ui';

const STAT_CARDS = Array.from({ length: 4 });
const TABLE_ROWS = Array.from({ length: 8 });

export default function AppLoading() {
  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <Flex direction="column" gap="5">
        <Box>
          <Skeleton width="220px" height="28px" mb="2" />
          <Skeleton width="340px" height="16px" />
        </Box>

        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          {STAT_CARDS.map((_, i) => (
            <Card key={i} size="2">
              <Skeleton width="60%" height="14px" mb="3" />
              <Skeleton width="40%" height="24px" />
            </Card>
          ))}
        </Grid>

        <Card size="2">
          <Flex direction="column" gap="4">
            <Flex justify="between" gap="3">
              <Skeleton width="160px" height="20px" />
              <Skeleton width="280px" height="32px" />
            </Flex>

            <Flex direction="column" gap="3">
              {TABLE_ROWS.map((_, i) => (
                <Skeleton key={i} width="100%" height="20px" />
              ))}
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}
