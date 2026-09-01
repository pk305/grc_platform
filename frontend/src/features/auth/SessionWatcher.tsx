'use client';

import { useToast } from '@/components/common/Toast';
import { useAuth } from './AuthContext';
import { useSessionInvalidatedSubscription } from './__generated__/queries.generated';

/**
 * Reacts to `sessionInvalidated` (see backend/domains/iam/graphql/
 * subscriptions.py) — fired when a sign-in elsewhere evicts this browser's
 * session. The session is already gone server-side at that point; a full
 * navigation is what clears the Apollo cache and every open subscription in
 * one step, then lands on a sign-in page that already has no session to
 * bounce off of.
 */
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
      // A full navigation, not router.push — this needs to tear down the
      // Apollo cache and every open subscription along with it, not just
      // change the route.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/auth/login?reason=concurrent-session');
    }
  });

  return null;
}
