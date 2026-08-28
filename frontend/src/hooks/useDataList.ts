'use client';

import { useEffect } from 'react';

const togglePaginationButtonDisable = (button, disabled) => {
  // eslint-disable-next-line no-param-reassign
  button.disabled = disabled;
  button.classList[disabled ? 'add' : 'remove']('disabled');
};

/**
 * Ported from src/scripts/theme/list.js's `listInit`, scoped to one
 * container ref instead of scanning the whole document for `[data-list]`.
 */
export default function useDataList(containerRef, options) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let list;
    let cancelled = false;

    import('list.js').then(({ default: List }) => {
      if (cancelled || !el) return;

      const paginationButtonNext = el.querySelector(
        '[data-list-pagination="next"]'
      );
      const paginationButtonPrev = el.querySelector(
        '[data-list-pagination="prev"]'
      );
      const viewAll = el.querySelector('[data-list-view="*"]');
      const viewLess = el.querySelector('[data-list-view="less"]');
      const listInfo = el.querySelector('[data-list-info]');

      list = new List(el, options);

      const totalItem = list.items.length;
      const itemsPerPage = options.page;
      let pageQuantity = Math.ceil(totalItem / itemsPerPage);
      let numberOfcurrentItems = list.visibleItems.length;
      let pageCount = 1;

      const updateListControls = () => {
        if (listInfo) {
          listInfo.innerHTML = `${list.i} to ${numberOfcurrentItems} <span class='text-600'> Items of </span> ${totalItem}`;
        }
        if (paginationButtonPrev)
          togglePaginationButtonDisable(paginationButtonPrev, pageCount === 1);
        if (paginationButtonNext)
          togglePaginationButtonDisable(
            paginationButtonNext,
            pageCount === pageQuantity
          );

        if (pageCount > 1 && pageCount < pageQuantity) {
          if (paginationButtonNext)
            togglePaginationButtonDisable(paginationButtonNext, false);
          if (paginationButtonPrev)
            togglePaginationButtonDisable(paginationButtonPrev, false);
        }
      };
      updateListControls();

      const onNext = e => {
        e.preventDefault();
        pageCount += 1;
        const nextInitialIndex = list.i + itemsPerPage;
        if (nextInitialIndex <= list.size())
          list.show(nextInitialIndex, itemsPerPage);
        numberOfcurrentItems += list.visibleItems.length;
        updateListControls();
      };
      const onPrev = e => {
        e.preventDefault();
        pageCount -= 1;
        numberOfcurrentItems -= list.visibleItems.length;
        const prevItem = list.i - itemsPerPage;
        if (prevItem > 0) list.show(prevItem, itemsPerPage);
        updateListControls();
      };
      const toggleViewBtn = () => {
        viewLess?.classList.toggle('d-none');
        viewAll?.classList.toggle('d-none');
      };
      const onViewAll = () => {
        list.show(1, totalItem);
        pageQuantity = 1;
        pageCount = 1;
        numberOfcurrentItems = totalItem;
        updateListControls();
        toggleViewBtn();
      };
      const onViewLess = () => {
        list.show(1, itemsPerPage);
        pageQuantity = Math.ceil(totalItem / itemsPerPage);
        pageCount = 1;
        numberOfcurrentItems = list.visibleItems.length;
        updateListControls();
        toggleViewBtn();
      };

      paginationButtonNext?.addEventListener('click', onNext);
      paginationButtonPrev?.addEventListener('click', onPrev);
      viewAll?.addEventListener('click', onViewAll);
      viewLess?.addEventListener('click', onViewLess);

      // eslint-disable-next-line consistent-return
      return () => {
        paginationButtonNext?.removeEventListener('click', onNext);
        paginationButtonPrev?.removeEventListener('click', onPrev);
        viewAll?.removeEventListener('click', onViewAll);
        viewLess?.removeEventListener('click', onViewLess);
      };
    });

    return () => {
      cancelled = true;
      list?.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
