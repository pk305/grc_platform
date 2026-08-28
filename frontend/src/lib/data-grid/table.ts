import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures
} from '@tanstack/react-table';

/**
 * The one feature set every data grid in this app is built on. Registering
 * search, sort, pagination, and row selection here (and nothing else — no
 * grouping, pinning, etc.) keeps every grid's bundle and state surface
 * limited to what the product actually uses; add a feature here only when a
 * real grid needs it. Row selection is opt-in per grid via `DataGrid`'s
 * `enableRowSelection` prop — registering the feature here just makes the
 * checkbox column available.
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
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature
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
