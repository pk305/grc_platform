'use client';

import { useToast } from '@/components/common/Toast';
import { useAuth } from './AuthContext';
import { useSessionInvalidatedSubscription } from './__generated__/queries.generated';

export default function SessionWatcher() {
  const { isAuthenticated } = useAuth();
  const showToast = useToast();

  useSessionInvalidatedSubscription({
    skip: !isAuthenticated,
    onData: () => {
      showToast(
        'You were signed out because your account signed in from another browser.',
        'error'
      );
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/auth/login?reason=concurrent-session');
    }
  });

  return null;
}
