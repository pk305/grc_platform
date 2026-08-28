'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex } from '@radix-ui/themes';
import { Skeleton } from '@/components/ui';
import { useAuth } from './AuthContext';

function AppShellSkeleton() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Flex
        align="center"
        gap="4"
        px="4"
        style={{ height: 56, borderBottom: '1px solid var(--gray-a4)' }}
      >
        <Skeleton width="120px" height="20px" />
        <Box style={{ marginLeft: 'auto' }}>
          <Skeleton
            width="32px"
            height="32px"
            style={{ borderRadius: '50%' }}
          />
        </Box>
      </Flex>
      <Flex flexGrow="1">
        <Flex
          direction="column"
          gap="3"
          p="4"
          style={{ width: 240, borderRight: '1px solid var(--gray-a4)' }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} width="100%" height="16px" />
          ))}
        </Flex>
        <Box p="6" style={{ flex: 1 }}>
          <Skeleton width="220px" height="28px" mb="4" />
          <Flex direction="column" gap="3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} width="100%" height="16px" />
            ))}
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <AppShellSkeleton />;
  }

  return <>{children}</>;
}
