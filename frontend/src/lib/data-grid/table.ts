import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures
} from '@tanstack/react-table';

/**
 * The one feature set every data grid in this app is built on. Registering
 * search, sort, and pagination here (and nothing else — no row selection,
 * grouping, pinning, etc.) keeps every grid's bundle and state surface
 * limited to what the product actually uses; add a feature here only when a
 * real grid needs it.
 */
export const dataGridFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel()
});

export type DataGridFeatures = typeof dataGridFeatures;

/**
 * App-wide table factory. `useAppTable`/`createAppColumnHelper` bind
 * `dataGridFeatures` once so every grid shares the same state shape and
 * typed instance APIs; individual grids still supply their own `data` and
 * `columns`.
 */
export const { useAppTable, createAppColumnHelper, useTableContext } =
  createTableHook({
    features: dataGridFeatures
  });
