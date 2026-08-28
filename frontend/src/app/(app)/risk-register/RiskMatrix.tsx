'use client';

import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import {
  IMPACT_LABELS,
  LIKELIHOOD_LABELS,
  levelForScore
} from '@/lib/risk-level';

export interface RiskMatrixCell {
  likelihood: number;
  impact: number;
}

export interface RiskMatrixProps {
  risks: RiskMatrixCell[];
  selected: RiskMatrixCell | null;
  onSelect: (cell: RiskMatrixCell | null) => void;
}

const CELL_BG: Record<string, string> = {
  critical: 'var(--red-4)',
  high: 'var(--orange-4)',
  medium: 'var(--blue-4)',
  low: 'var(--green-4)'
};

const LIKELIHOOD_ROWS = [5, 4, 3, 2, 1];
const IMPACT_COLUMNS = [1, 2, 3, 4, 5];

export function RiskMatrix({ risks, selected, onSelect }: RiskMatrixProps) {
  const counts = new Map<string, number>();
  for (const risk of risks) {
    const key = `${risk.likelihood}-${risk.impact}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <Card size="2">
      <Heading as="h3" size="4" mb="3">
        Risk matrix (5×5)
      </Heading>
      <Flex direction="column" align="center" gap="2">
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {LIKELIHOOD_ROWS.map(likelihood => (
              <tr key={likelihood}>
                <th
                  scope="row"
                  title={LIKELIHOOD_LABELS[likelihood]}
                  style={{
                    width: 24,
                    height: 34,
                    fontSize: 12,
                    fontWeight: 400,
                    color: 'var(--gray-9)'
                  }}
                >
                  {likelihood}
                </th>
                {IMPACT_COLUMNS.map(impact => {
                  const count = counts.get(`${likelihood}-${impact}`) ?? 0;
                  const level = levelForScore(likelihood, impact);
                  const isSelected =
                    selected?.likelihood === likelihood &&
                    selected?.impact === impact;
                  return (
                    <td key={impact} style={{ padding: 2 }}>
                      <button
                        type="button"
                        onClick={() =>
                          onSelect(isSelected ? null : { likelihood, impact })
                        }
                        aria-label={`Likelihood ${LIKELIHOOD_LABELS[likelihood]}, impact ${IMPACT_LABELS[impact]}: ${count} risks`}
                        style={{
                          width: 36,
                          height: 34,
                          background: CELL_BG[level],
                          border: isSelected
                            ? '2px solid var(--accent-9)'
                            : '1px solid var(--gray-a5)',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--gray-12)'
                        }}
                      >
                        {count || ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th />
              {IMPACT_COLUMNS.map(impact => (
                <td key={impact} style={{ textAlign: 'center' }}>
                  <Text size="1" color="gray">
                    {impact}
                  </Text>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <Text size="1" color="gray" align="center">
          Impact →, likelihood ↑. Click a cell to filter.
        </Text>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-11)',
              cursor: 'pointer',
              fontSize: 12,
              padding: 0
            }}
          >
            Clear matrix filter
          </button>
        )}
      </Flex>
    </Card>
  );
}
