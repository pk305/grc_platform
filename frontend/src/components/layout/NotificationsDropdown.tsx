'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useNavbarAdminAttentionQuery,
  useNavbarAttentionQuery
} from '@/features/navbar/__generated__/queries.generated';

type Tone = 'danger' | 'warning' | 'info';

export interface AttentionItem {
  key: string;
  icon: string;
  tone: Tone;
  title: string;
  detail: string;
  href: string;
}

const TONE_CLASS: Record<Tone, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info'
};

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Everything currently asking for the signed-in user's attention.
 *
 * Derived from the same summary counts the dashboard reads rather than from a
 * stored notification stream — so there is no read/unread state to drift out
 * of sync, and an item disappears exactly when the underlying work is done.
 */
export function useAttentionItems(): {
  items: AttentionItem[];
  loading: boolean;
} {
  const { user, isAdmin } = useAuth();
  const { data, loading } = useNavbarAttentionQuery({
    fetchPolicy: 'cache-and-network'
  });
  const { data: adminData } = useNavbarAdminAttentionQuery({
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network'
  });

  const items: AttentionItem[] = [];

  if (user && !user.mfaEnabled) {
    items.push({
      key: 'mfa',
      icon: 'fas fa-shield-alt',
      tone: 'warning',
      title: 'Two-factor authentication is off',
      detail: 'Add a second factor to protect your account.',
      href: '/profile#security'
    });
  }

  const overdueRisks = data?.riskSummary.overdueForReviewCount ?? 0;
  if (overdueRisks > 0) {
    items.push({
      key: 'risks-overdue',
      icon: 'fas fa-exclamation-triangle',
      tone: 'danger',
      title: `${plural(overdueRisks, 'risk')} overdue for review`,
      detail: 'Past the scheduled review date in the register.',
      href: '/risk-register'
    });
  }

  const overdueActions = data?.auditSummary.overdueCorrectiveActionsCount ?? 0;
  if (overdueActions > 0) {
    items.push({
      key: 'actions-overdue',
      icon: 'fas fa-clipboard-check',
      tone: 'danger',
      title: `${plural(overdueActions, 'corrective action')} overdue`,
      detail: 'Past the agreed completion date.',
      href: '/'
    });
  }

  const reviewsDue = data?.obligationSummary.reviewsDueSoonCount ?? 0;
  if (reviewsDue > 0) {
    items.push({
      key: 'obligations-due',
      icon: 'fas fa-gavel',
      tone: 'warning',
      title: `${plural(reviewsDue, 'obligation')} due for review`,
      detail: 'Scheduled within the next 30 days.',
      href: '/'
    });
  }

  const failures = adminData?.accessSummary.signInFailures24h ?? 0;
  if (isAdmin && failures > 0) {
    items.push({
      key: 'sign-in-failures',
      icon: 'fas fa-user-lock',
      tone: 'warning',
      title: `${plural(failures, 'failed sign-in')} in 24 hours`,
      detail: 'Review the access log for unfamiliar activity.',
      href: '/iam/audit-log'
    });
  }

  return { items, loading };
}

/**
 * `items` is passed in rather than read here: the bell's badge needs the same
 * list, and calling the hook in both places would run the queries twice.
 */
export default function NotificationsDropdown({
  items,
  loading
}: {
  items: AttentionItem[];
  loading: boolean;
}) {
  return (
    <div
      className="dropdown-menu dropdown-menu-end py-0 shadow border border-300"
      style={{ minWidth: '20rem' }}
      aria-labelledby="navbarDropdownNotification"
    >
      <div className="card position-relative border-0">
        <div className="card-header d-flex align-items-center justify-content-between border-bottom py-2 px-3">
          <h6 className="mb-0">Needs attention</h6>
          {items.length > 0 && (
            <span className="badge rounded-pill bg-primary text-white">
              {items.length}
            </span>
          )}
        </div>

        <div
          className="card-body p-0 overflow-auto scrollbar"
          style={{ maxHeight: '20rem' }}
        >
          {items.length === 0 ? (
            <p className="text-600 fs--1 text-center mb-0 px-3 py-4">
              {loading ? 'Checking…' : 'Nothing needs your attention.'}
            </p>
          ) : (
            <ul className="list-unstyled mb-0">
              {items.map(item => (
                <li key={item.key} className="border-bottom">
                  <Link
                    href={item.href}
                    className="d-flex gap-3 px-3 py-3 text-decoration-none hover-bg-200"
                  >
                    <span
                      className={`${item.icon} ${TONE_CLASS[item.tone]} mt-1`}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="d-block text-900 fs--1 fw-semi-bold">
                        {item.title}
                      </span>
                      <span className="d-block text-600 fs--2">
                        {item.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-footer border-top py-2 px-3 text-center">
          <Link href="/" className="fs--2 text-decoration-none">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
