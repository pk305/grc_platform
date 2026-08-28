'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import feather from 'feather-icons';
import AnchorJS from 'anchor-js';

/**
 * Re-runs the theme's DOM-driven initializers (tooltips, popovers, toasts,
 * feather icons, anchor links) after every client-side navigation, since
 * Next.js swaps page content without a full reload.
 *
 * Bootstrap's JS bundle touches `window`/`document` as soon as it's
 * evaluated, so it's loaded lazily here inside the effect rather than as a
 * top-level import — that keeps this component itself SSR-safe, so it can
 * be rendered directly instead of behind a `next/dynamic({ ssr: false })`
 * boundary, which was producing duplicate chunks on a fresh page load and
 * silently failing to mount.
 */
export default function ThemeInit() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    import('bootstrap/dist/js/bootstrap.bundle.min').then(
      ({ Tooltip, Popover, Toast }) => {
        if (cancelled) return;

        document
          .querySelectorAll('[data-bs-toggle="tooltip"]')
          .forEach(el => new Tooltip(el, { trigger: 'hover' }));

        document
          .querySelectorAll('[data-bs-toggle="popover"]')
          .forEach(el => new Popover(el));

        document.querySelectorAll('.toast').forEach(el => new Toast(el));
      }
    );

    feather.replace({ width: '16px', height: '16px' });

    new AnchorJS({ icon: '#' }).add('[data-anchor]');

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    // Some nav content (e.g. the sidebar behind AuthGuard) mounts after an
    // async check resolves, later than first paint and without a pathname
    // change — the effect above misses those icons entirely. Watch for new
    // [data-feather] nodes and replace them as they show up.
    let frame: number | null = null;
    const observer = new MutationObserver(() => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (document.querySelector('[data-feather]')) {
          feather.replace({ width: '16px', height: '16px' });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
