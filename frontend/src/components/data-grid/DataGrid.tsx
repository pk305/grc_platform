'use client';

import type { ReactNode } from 'react';
import type { ColumnDef, ExternalAtoms, RowData } from '@tanstack/react-table';
import {
  Button,
  Flex,
  Spinner,
  Table,
  Text,
  TextField
} from '@radix-ui/themes';
import {
  dataGridFeatures,
  useAppTable,
  type DataGridFeatures
} from '@/lib/data-grid/table';

export interface DataGridProps<TData extends RowData> {
  data: TData[];
  columns: ColumnDef<DataGridFeatures, TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  /** Column-sort interactions. Registered by default; set false to disable table-wide. */
  enableSorting?: boolean;
  /** Show the search box. The grid is always registered for global filtering; this only toggles the control. */
  enableGlobalFilter?: boolean;
  /** Show pagination controls. When false, all rows render on one page. */
  enablePagination?: boolean;
  pageSize?: number;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  isLoading?: boolean;
  /**
   * External TanStack Store atoms for state slices the app must own itself —
   * e.g. pagination synced to the URL, or a filter shared with another
   * component. Leave unset for grids that only need the table's own state.
   */
  atoms?: ExternalAtoms<DataGridFeatures>;
}

export function DataGrid<TData extends RowData>({
  data,
  columns,
  getRowId,
  enableSorting = true,
  enableGlobalFilter = true,
  enablePagination = true,
  pageSize = 20,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results.',
  isLoading = false,
  atoms
}: DataGridProps<TData>) {
  const table = useAppTable({
    data,
    columns,
    getRowId,
    enableSorting,
    atoms,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: enablePagination ? pageSize : Math.max(data.length, 1)
      }
    }
  });

  const columnCount = table.getAllLeafColumns().length;

  return (
    <Flex direction="column" gap="3">
      {enableGlobalFilter && (
        <table.Subscribe selector={state => state.globalFilter}>
          {globalFilter => (
            <TextField.Root
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={e => table.setGlobalFilter(e.target.value)}
              style={{ maxWidth: 280 }}
            />
          )}
        </table.Subscribe>
      )}

      <Table.Root variant="surface">
        <Table.Header>
          {table.getHeaderGroups().map(headerGroup => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <Table.ColumnHeaderCell
                    key={header.id}
                    colSpan={header.colSpan}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : canSort
                            ? 'none'
                            : undefined
                    }
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <Button
                        variant="ghost"
                        color="gray"
                        highContrast
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: 'pointer' }}
                      >
                        <table.FlexRender header={header} />
                        {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : ''}
                      </Button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </Table.ColumnHeaderCell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row>
              <Table.Cell colSpan={columnCount}>
                <Flex align="center" justify="center" py="4">
                  <Spinner size="2" />
                </Flex>
              </Table.Cell>
            </Table.Row>
          ) : (
            <>
              {table.getRowModel().rows.map(row => (
                <Table.Row key={row.id}>
                  {row.getAllCells().map(cell => (
                    <Table.Cell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={columnCount}>
                    <Text align="center" color="gray" as="p" my="4">
                      {emptyMessage}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </>
          )}
        </Table.Body>
      </Table.Root>

      {enablePagination && (
        <table.Subscribe selector={state => state.pagination}>
          {pagination => (
            <Flex align="center" justify="between">
              <Text size="2" color="gray">
                Page {pagination.pageIndex + 1} of{' '}
                {Math.max(table.getPageCount(), 1)}
              </Text>
              <Flex gap="2">
                <Button
                  variant="soft"
                  color="gray"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
          )}
        </table.Subscribe>
      )}
    </Flex>
  );
}

export { dataGridFeatures };
export { createAppColumnHelper } from '@/lib/data-grid/table';
