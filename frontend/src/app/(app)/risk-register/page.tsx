'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Select,
  Switch,
  Text,
  TextField
} from '@radix-ui/themes';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { createAppColumnHelper } from '@/lib/data-grid/table';
import {
  useRiskRegisterOwnersQuery,
  useRiskRegisterRisksQuery
} from '@/features/risk-register/__generated__/queries.generated';
import type { RiskRegisterRisksQuery } from '@/features/risk-register/__generated__/queries.generated';
import { RiskRiskStatusEnum } from '@/gql/graphql-types';
import {
  RISK_LEVEL_COLOR,
  RISK_STATUS_LABEL,
  levelForScore,
  riskLevelLabel
} from '@/lib/risk-level';
import { RiskMatrix, type RiskMatrixCell } from './RiskMatrix';
import { NewRiskDialog, type RiskOwnerOption } from './NewRiskDialog';

type RiskRow = RiskRegisterRisksQuery['risks'][number];

function effectiveLikelihoodImpact(risk: RiskRow): {
  likelihood: number;
  impact: number;
} {
  if (risk.residualLikelihood && risk.residualImpact) {
    return { likelihood: risk.residualLikelihood, impact: risk.residualImpact };
  }
  return { likelihood: risk.inherentLikelihood, impact: risk.inherentImpact };
}

function isOverdue(risk: RiskRow): boolean {
  if (risk.status === RiskRiskStatusEnum.Closed || !risk.nextReviewDate)
    return false;
  return new Date(String(risk.nextReviewDate)) < new Date();
}

function LevelBadge({
  likelihood,
  impact
}: {
  likelihood: number | null;
  impact: number | null;
}) {
  if (!likelihood || !impact) {
    return (
      <Text size="2" color="gray">
        not assessed
      </Text>
    );
  }
  const level = levelForScore(likelihood, impact);
  return (
    <Flex align="center" gap="2">
      <Badge color={RISK_LEVEL_COLOR[level]} variant="soft">
        {riskLevelLabel(level)}
      </Badge>
      <Text size="1" color="gray">
        {likelihood}×{impact}
      </Text>
    </Flex>
  );
}

const EMPTY_RISKS: RiskRow[] = [];
const EMPTY_OWNERS: RiskOwnerOption[] = [];

const columnHelper = createAppColumnHelper<RiskRow>();

const columns = columnHelper.columns([
  columnHelper.accessor('reference', {
    header: 'Ref',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => (
      <Text style={{ fontFamily: 'monospace' }}>{getValue()}</Text>
    )
  }),
  columnHelper.accessor('title', { header: 'Risk', sortFn: 'alphanumeric' }),
  columnHelper.accessor(
    row => (row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '—'),
    { id: 'owner', header: 'Owner' }
  ),
  columnHelper.display({
    id: 'inherent',
    header: 'Inherent',
    cell: ({ row }) => (
      <LevelBadge
        likelihood={row.original.inherentLikelihood}
        impact={row.original.inherentImpact}
      />
    )
  }),
  columnHelper.display({
    id: 'residual',
    header: 'Residual',
    cell: ({ row }) => (
      <LevelBadge
        likelihood={row.original.residualLikelihood}
        impact={row.original.residualImpact}
      />
    )
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge color="gray" variant="outline">
        {RISK_STATUS_LABEL[getValue()] ?? getValue()}
      </Badge>
    )
  }),
  columnHelper.accessor('nextReviewDate', {
    header: 'Next review',
    sortFn: 'datetime',
    cell: ({ row, getValue }) => {
      const value = getValue();
      if (!value) {
        return (
          <Text size="2" color="gray">
            —
          </Text>
        );
      }
      const overdue = isOverdue(row.original);
      return (
        <Text
          size="2"
          color={overdue ? 'red' : undefined}
          weight={overdue ? 'bold' : undefined}
        >
          {String(value)}
          {overdue ? ' ⚠' : ''}
        </Text>
      );
    }
  })
]);

export default function RiskRegisterPage() {
  const { data, loading, refetch } = useRiskRegisterRisksQuery();
  const { data: ownersData } = useRiskRegisterOwnersQuery();
  const risks = data?.risks ?? EMPTY_RISKS;
  const owners = ownersData?.users ?? EMPTY_OWNERS;

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [matrixCell, setMatrixCell] = useState<RiskMatrixCell | null>(null);

  const nonClosedRisks = useMemo(
    () => risks.filter(r => r.status !== RiskRiskStatusEnum.Closed),
    [risks]
  );

  const matrixPoints = useMemo(
    () => nonClosedRisks.map(effectiveLikelihoodImpact),
    [nonClosedRisks]
  );

  const visibleRisks = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return risks.filter(risk => {
      if (
        searchLower &&
        !`${risk.title} ${risk.reference}`.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
      const effective = effectiveLikelihoodImpact(risk);
      if (
        level &&
        levelForScore(effective.likelihood, effective.impact) !== level
      ) {
        return false;
      }
      if (status && risk.status !== status) return false;
      if (overdueOnly && !isOverdue(risk)) return false;
      if (
        matrixCell &&
        !(
          effective.likelihood === matrixCell.likelihood &&
          effective.impact === matrixCell.impact
        )
      ) {
        return false;
      }
      return true;
    });
  }, [risks, search, level, status, overdueOnly, matrixCell]);

  function exportCsv() {
    const header = [
      'reference',
      'title',
      'owner',
      'inherent_likelihood',
      'inherent_impact',
      'inherent_level',
      'residual_likelihood',
      'residual_impact',
      'residual_level',
      'status',
      'next_review'
    ];
    const lines = [header.join(',')].concat(
      visibleRisks.map(risk =>
        [
          risk.reference,
          `"${risk.title.replace(/"/g, '""')}"`,
          risk.owner ? `"${risk.owner.firstName} ${risk.owner.lastName}"` : '',
          risk.inherentLikelihood,
          risk.inherentImpact,
          risk.inherentLevel,
          risk.residualLikelihood ?? '',
          risk.residualImpact ?? '',
          risk.residualLevel ?? '',
          risk.status,
          risk.nextReviewDate ? String(risk.nextReviewDate) : ''
        ].join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Risk Register
            </Heading>
            <Text as="p" color="gray">
              Risk assessment and treatment per ISO 31000:2018 §6.4–6.5.
            </Text>
          </Box>
          <Flex gap="2">
            <Button variant="soft" color="gray" onClick={exportCsv}>
              Export CSV
            </Button>
            <NewRiskDialog owners={owners} onCreated={() => refetch()} />
          </Flex>
        </Flex>

        <Grid columns={{ initial: '1', lg: '2' }} gap="3">
          <RiskMatrix
            risks={matrixPoints}
            selected={matrixCell}
            onSelect={setMatrixCell}
          />

          <Card size="2">
            <Flex direction="column" gap="3">
              <TextField.Root
                placeholder="Search title or reference"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Grid columns="2" gap="2">
                <Select.Root
                  value={level || 'all'}
                  onValueChange={v => setLevel(v === 'all' ? '' : v)}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="all">All levels</Select.Item>
                    <Select.Item value="critical">Critical</Select.Item>
                    <Select.Item value="high">High</Select.Item>
                    <Select.Item value="medium">Medium</Select.Item>
                    <Select.Item value="low">Low</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Select.Root
                  value={status || 'all'}
                  onValueChange={v => setStatus(v === 'all' ? '' : v)}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="all">All statuses</Select.Item>
                    {Object.entries(RISK_STATUS_LABEL).map(([value, label]) => (
                      <Select.Item key={value} value={value}>
                        {label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Grid>
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <Switch
                    checked={overdueOnly}
                    onCheckedChange={setOverdueOnly}
                    size="1"
                  />
                  Overdue reviews only
                </Flex>
              </Text>
              <Text size="1" color="gray">
                {visibleRisks.length} of {risks.length} risks shown
                {matrixCell &&
                  ` · matrix cell L${matrixCell.likelihood}×I${matrixCell.impact}`}
              </Text>
            </Flex>
          </Card>
        </Grid>

        <DataGrid
          data={visibleRisks}
          columns={columns}
          getRowId={risk => risk.id}
          isLoading={loading}
          enableGlobalFilter={false}
          emptyMessage="No risks match the current filters."
        />

        <Text size="1" color="gray">
          Levels derive from the 5×5 matrix using the organisation&apos;s risk
          criteria (ISO 31000 §6.3.4). Overdue reviews are highlighted in red.
        </Text>
      </Flex>
    </Box>
  );
}
