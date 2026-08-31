'use client';

import Link from 'next/link';
import {
  useClearAllNotificationsMutation,
  useClearNotificationMutation,
  useNotificationsQuery,
  NotificationsDocument,
  type NotificationsQuery
} from '@/features/navbar/__generated__/queries.generated';

export type NotificationItem = NotificationsQuery['notifications'][number];

/** Falls back to a neutral icon so a new server-side key still renders. */
const ICON_BY_KEY: Record<string, string> = {
  mfa: 'fas fa-shield-alt',
  'risks-overdue': 'fas fa-exclamation-triangle',
  'actions-overdue': 'fas fa-clipboard-check',
  'obligations-due': 'fas fa-gavel',
  'sign-in-failures': 'fas fa-user-lock'
};
const FALLBACK_ICON = 'fas fa-info-circle';

const TONE_CLASS: Record<string, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info'
};

/**
 * The bell's contents. Alerts are built and worded by the server; clearing one
 * writes a dismissal against the caller's account, so it stays cleared across
 * devices and sessions — and comes back if the situation it describes changes.
 */
export function useNotifications() {
  const { data, loading } = useNotificationsQuery({
    fetchPolicy: 'cache-and-network'
  });

  const [clearOneMutation, { loading: clearingOne }] =
    useClearNotificationMutation();
  const [clearAllMutation, { loading: clearingAll }] =
    useClearAllNotificationsMutation();

  // Both mutations return the alerts that remain, so writing that straight
  // into the Notifications query keeps the badge and the panel in step in one
  // round trip, with no refetch.
  const clearOne = (key: string) =>
    clearOneMutation({
      variables: { key },
      update: (cache, { data: result }) => {
        if (!result) return;
        cache.writeQuery({
          query: NotificationsDocument,
          data: { notifications: result.clearNotification }
        });
      }
    });

  const clearAll = () =>
    clearAllMutation({
      update: (cache, { data: result }) => {
        if (!result) return;
        cache.writeQuery({
          query: NotificationsDocument,
          data: { notifications: result.clearAllNotifications }
        });
      }
    });

  return {
    items: data?.notifications ?? [],
    loading,
    clearOne,
    clearAll,
    clearing: clearingOne || clearingAll
  };
}

export default function NotificationsDropdown({
  items,
  loading,
  clearOne,
  clearAll,
  clearing
}: {
  items: NotificationItem[];
  loading: boolean;
  clearOne: (key: string) => void;
  clearAll: () => void;
  clearing: boolean;
}) {
  return (
    <div
      className="dropdown-menu dropdown-menu-end py-0 shadow border border-300"
      style={{ minWidth: '21rem' }}
      aria-labelledby="navbarDropdownNotification"
    >
      <div className="card position-relative border-0">
        <div className="card-header d-flex align-items-center justify-content-between border-bottom py-2 px-3">
          <h6 className="mb-0">Needs attention</h6>
          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 fs--2 text-decoration-none"
              // Bootstrap closes an open dropdown from a document-level click
              // handler; keeping the event off document leaves the panel open
              // so several alerts can be cleared in a row.
              onClick={event => {
                event.stopPropagation();
                clearAll();
              }}
              disabled={clearing}
            >
              Clear all
            </button>
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
                <li
                  key={item.key}
                  className="border-bottom d-flex align-items-start"
                >
                  <Link
                    href={item.href}
                    className="d-flex gap-3 flex-grow-1 px-3 py-3 text-decoration-none hover-bg-200"
                  >
                    <span
                      className={`${ICON_BY_KEY[item.key] ?? FALLBACK_ICON} ${
                        TONE_CLASS[item.tone] ?? 'text-info'
                      } mt-1`}
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
                  <button
                    type="button"
                    className="btn btn-link text-600 px-2 py-3 border-0 shadow-none"
                    aria-label={`Clear: ${item.title}`}
                    disabled={clearing}
                    onClick={event => {
                      event.stopPropagation();
                      clearOne(item.key);
                    }}
                  >
                    <span className="fas fa-times fs--1" aria-hidden="true" />
                  </button>
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
