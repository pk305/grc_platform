'use client';

import type { ReactNode } from 'react';
import type { ColumnDef, ExternalAtoms, RowData } from '@tanstack/react-table';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Select,
  Table,
  Text,
  TextField
} from '@radix-ui/themes';
import { Skeleton } from '@/components/ui';
import {
  dataGridFeatures,
  useAppTable,
  type DataGridFeatures
} from '@/lib/data-grid/table';

export interface DataGridProps<TData extends RowData> {
  data: TData[];
  columns: ColumnDef<DataGridFeatures, TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  /** Optional heading rendered above the table, to the left of the search box. */
  title?: ReactNode;
  /** Optional caption rendered under the title, in muted text. Ignored if `title` is not set. */
  subtitle?: ReactNode;
  /** Column-sort interactions. Registered by default; set false to disable table-wide. */
  enableSorting?: boolean;
  /** Show a leading checkbox column with per-row and select-all checkboxes. Off by default. */
  enableRowSelection?: boolean;
  /**
   * Renders a contextual bar in place of the title/search row whenever at
   * least one row is selected — e.g. "N selected" plus bulk-action buttons.
   * Only takes effect when `enableRowSelection` is set.
   */
  renderBulkActions?: (params: {
    selectedRows: TData[];
    clearSelection: () => void;
  }) => ReactNode;
  /** Show the search box. The grid is always registered for global filtering; this only toggles the control. */
  enableGlobalFilter?: boolean;
  /** Show pagination controls, the "Show N entries" menu, and the entry count. When false, all rows render on one page. */
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

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
const SKELETON_ROW_COUNT = 8;

/** DataTables' classic "N page buttons around the current page" windowing. */
function buildPageItems(
  current: number,
  pageCount: number
): (number | 'ellipsis')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }
  const keep = new Set<number>([0, pageCount - 1, current]);
  if (current - 1 >= 0) keep.add(current - 1);
  if (current + 1 <= pageCount - 1) keep.add(current + 1);
  const sorted = Array.from(keep).sort((a, b) => a - b);

  const items: (number | 'ellipsis')[] = [];
  let previous: number | null = null;
  for (const page of sorted) {
    if (previous !== null && page - previous > 1) items.push('ellipsis');
    items.push(page);
    previous = page;
  }
  return items;
}

function SortIndicator({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  return (
    <Flex
      direction="column"
      align="center"
      aria-hidden
      style={{ lineHeight: '0.6em', fontSize: '0.65em', marginLeft: 2 }}
    >
      <span style={{ opacity: sorted === 'asc' ? 1 : 0.35 }}>▲</span>
      <span style={{ opacity: sorted === 'desc' ? 1 : 0.35 }}>▼</span>
    </Flex>
  );
}

export function DataGrid<TData extends RowData>({
  data,
  columns,
  getRowId,
  title,
  subtitle,
  enableSorting = true,
  enableRowSelection = false,
  renderBulkActions,
  enableGlobalFilter = true,
  enablePagination = true,
  pageSize = 15,
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
    enableRowSelection,
    atoms,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: enablePagination ? pageSize : Infinity
      }
    }
  });

  const columnCount =
    table.getAllLeafColumns().length + (enableRowSelection ? 1 : 0);
  const pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS.includes(pageSize)
    ? DEFAULT_PAGE_SIZE_OPTIONS
    : [...DEFAULT_PAGE_SIZE_OPTIONS, pageSize].sort((a, b) => a - b);

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        {(title || enableGlobalFilter) && (
          <table.Subscribe selector={state => state.rowSelection}>
            {() => {
              const selectedRows =
                enableRowSelection && renderBulkActions
                  ? table.getSelectedRowModel().rows.map(row => row.original)
                  : [];

              if (selectedRows.length > 0) {
                return (
                  <Flex
                    align="center"
                    gap="3"
                    wrap="wrap"
                    px="3"
                    py="2"
                    style={{
                      background: 'var(--accent-a3)',
                      borderRadius: 'var(--radius-3)'
                    }}
                  >
                    <Text size="2" weight="medium" highContrast>
                      {selectedRows.length} selected
                    </Text>
                    {renderBulkActions?.({
                      selectedRows,
                      clearSelection: () => table.toggleAllRowsSelected(false)
                    })}
                  </Flex>
                );
              }

              return (
                <Flex justify="between" align="end" wrap="wrap" gap="3">
                  {title ? (
                    <Box>
                      {typeof title === 'string' ? (
                        <Heading
                          as="h3"
                          size="4"
                          weight="medium"
                          mb={subtitle ? '1' : '0'}
                        >
                          {title}
                        </Heading>
                      ) : (
                        title
                      )}
                      {subtitle && (
                        <Text as="p" size="2" color="gray">
                          {subtitle}
                        </Text>
                      )}
                    </Box>
                  ) : (
                    <span />
                  )}

                  {enableGlobalFilter && (
                    <table.Subscribe selector={state => state.globalFilter}>
                      {globalFilter => (
                        <TextField.Root
                          placeholder={searchPlaceholder}
                          value={globalFilter ?? ''}
                          onChange={e => table.setGlobalFilter(e.target.value)}
                          style={{ flex: '1 1 320px', maxWidth: 480 }}
                        />
                      )}
                    </table.Subscribe>
                  )}
                </Flex>
              );
            }}
          </table.Subscribe>
        )}

        <Table.Root variant="ghost" className="dt-table">
          <Table.Header>
            {table.getHeaderGroups().map(headerGroup => (
              <Table.Row key={headerGroup.id}>
                {enableRowSelection && (
                  <Table.ColumnHeaderCell style={{ width: 32 }}>
                    <table.Subscribe selector={state => state.rowSelection}>
                      {() => (
                        <Checkbox
                          checked={
                            table.getIsAllRowsSelected()
                              ? true
                              : table.getIsSomeRowsSelected()
                                ? 'indeterminate'
                                : false
                          }
                          onCheckedChange={checked =>
                            table.toggleAllRowsSelected(checked === true)
                          }
                          aria-label="Select all rows"
                        />
                      )}
                    </table.Subscribe>
                  </Table.ColumnHeaderCell>
                )}
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
                          <SortIndicator sorted={sorted} />
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
              <>
                {Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
                  <Table.Row key={rowIndex}>
                    {Array.from({ length: columnCount }, (_, colIndex) => (
                      <Table.Cell key={colIndex}>
                        <Skeleton
                          height="16px"
                          width={`${60 + ((rowIndex * columnCount + colIndex) % 4) * 10}%`}
                        />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </>
            ) : (
              <>
                {table.getRowModel().rows.map(row => (
                  <Table.Row key={row.id}>
                    {enableRowSelection && (
                      <Table.Cell style={{ width: 32 }}>
                        <table.Subscribe
                          selector={state => state.rowSelection[row.id]}
                        >
                          {() => (
                            <Checkbox
                              checked={row.getIsSelected()}
                              onCheckedChange={checked =>
                                row.toggleSelected(checked === true)
                              }
                              aria-label="Select row"
                            />
                          )}
                        </table.Subscribe>
                      </Table.Cell>
                    )}
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
          <Flex
            align="center"
            justify="between"
            wrap="wrap"
            gap="3"
            pt="3"
            style={{ borderTop: '1px solid var(--gray-a5)' }}
          >
            <Flex align="center" gap="5" wrap="wrap">
              <table.Subscribe selector={state => state.pagination}>
                {pagination => {
                  const total = table.getRowCount();
                  const start =
                    total === 0
                      ? 0
                      : pagination.pageIndex * pagination.pageSize + 1;
                  const end = Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    total
                  );
                  return (
                    <Text
                      size="2"
                      color="gray"
                      highContrast
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Showing <strong>{start}</strong>&ndash;
                      <strong>{end}</strong> of <strong>{total}</strong>
                    </Text>
                  );
                }}
              </table.Subscribe>

              <table.Subscribe selector={state => state.pagination.pageSize}>
                {currentPageSize => (
                  <Flex align="center" gap="2">
                    <Text
                      size="2"
                      color="gray"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Rows per page
                    </Text>
                    <Select.Root
                      value={String(currentPageSize)}
                      onValueChange={v => table.setPageSize(Number(v))}
                    >
                      <Select.Trigger variant="soft" style={{ minWidth: 68 }} />
                      <Select.Content>
                        {pageSizeOptions.map(n => (
                          <Select.Item key={n} value={String(n)}>
                            {n}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                )}
              </table.Subscribe>
            </Flex>

            <table.Subscribe selector={state => state.pagination.pageIndex}>
              {pageIndex => {
                const pageCount = Math.max(table.getPageCount(), 1);
                const items = buildPageItems(pageIndex, pageCount);
                return (
                  <Flex align="center" gap="1">
                    <Button
                      variant="ghost"
                      color="gray"
                      size="1"
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                    >
                      Previous
                    </Button>
                    {items.map((item, index) =>
                      item === 'ellipsis' ? (
                        <Text
                          key={`ellipsis-${index}`}
                          size="2"
                          color="gray"
                          mx="1"
                        >
                          …
                        </Text>
                      ) : (
                        <Button
                          key={item}
                          variant={item === pageIndex ? 'solid' : 'ghost'}
                          color="gray"
                          highContrast={item !== pageIndex}
                          size="1"
                          onClick={() => table.setPageIndex(item)}
                        >
                          {item + 1}
                        </Button>
                      )
                    )}
                    <Button
                      variant="ghost"
                      color="gray"
                      size="1"
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                    >
                      Next
                    </Button>
                  </Flex>
                );
              }}
            </table.Subscribe>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

export { dataGridFeatures };
export { createAppColumnHelper } from '@/lib/data-grid/table';
