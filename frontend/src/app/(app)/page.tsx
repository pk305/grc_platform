'use client';

import {
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Spinner,
  Text
} from '@radix-ui/themes';
import { StatCard } from '@/components/dashboard/StatCard';
import { RiskProfileBar } from '@/components/dashboard/RiskProfileBar';
import {
  useDashboardAccessSummaryQuery,
  useDashboardAuditSummaryQuery,
  useDashboardIncidentSummaryQuery,
  useDashboardMeQuery,
  useDashboardObligationSummaryQuery,
  useDashboardRiskSummaryQuery,
  useDashboardSoaSummaryQuery
} from '@/features/dashboard/__generated__/queries.generated';

export default function DashboardPage() {
  const { data: meData, loading: meLoading } = useDashboardMeQuery();
  const me = meData?.me;

  const { data: riskData, loading: riskLoading } =
    useDashboardRiskSummaryQuery();
  const riskSummary = riskData?.riskSummary;

  const { data: soaData, loading: soaLoading } = useDashboardSoaSummaryQuery();
  const soaSummary = soaData?.soaSummary;

  const { data: auditData, loading: auditLoading } =
    useDashboardAuditSummaryQuery();
  const auditSummary = auditData?.auditSummary;

  const { data: incidentData, loading: incidentLoading } =
    useDashboardIncidentSummaryQuery();
  const incidentSummary = incidentData?.incidentSummary;

  const { data: obligationData, loading: obligationLoading } =
    useDashboardObligationSummaryQuery();
  const obligationSummary = obligationData?.obligationSummary;

  const { data: accessData, loading: accessLoading } =
    useDashboardAccessSummaryQuery();
  const accessSummary = accessData?.accessSummary;

  if (meLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Box px={{ initial: '4', lg: '6' }} className="box-wrapper">
      <Flex direction="column" gap="5">
        <Box>
          <Heading as="h2" size="6" mb="0">
            Dashboard
          </Heading>
          <Text as="p" color="gray" className="mb-0">
            Welcome back{me?.firstName ? `, ${me.firstName}` : ''}.
          </Text>
        </Box>

        <Grid columns={{ initial: '1', sm: '2', xl: '4' }} gap="3">
          <StatCard
            label="Open risks"
            value={riskLoading ? '…' : (riskSummary?.openCount ?? 0)}
            hint={
              !riskLoading &&
              `${riskSummary?.overdueForReviewCount ?? 0} overdue for review`
            }
            tone={
              (riskSummary?.overdueForReviewCount ?? 0) > 0
                ? 'warning'
                : 'primary'
            }
          />
          <StatCard
            label="SoA implemented"
            value={
              soaLoading
                ? '…'
                : `${(soaSummary?.implementedPercentage ?? 0).toFixed(1)}%`
            }
            hint={
              !soaLoading &&
              `${soaSummary?.controlsInScope ?? 0} controls in scope`
            }
            tone="success"
          />
          <StatCard
            label="Open audit findings"
            value={auditLoading ? '…' : (auditSummary?.openFindingsCount ?? 0)}
            hint={
              !auditLoading &&
              `${auditSummary?.overdueCorrectiveActionsCount ?? 0} corrective actions overdue`
            }
            tone={
              (auditSummary?.overdueCorrectiveActionsCount ?? 0) > 0
                ? 'danger'
                : 'primary'
            }
          />
          <StatCard
            label="Open incidents"
            value={incidentLoading ? '…' : (incidentSummary?.openCount ?? 0)}
            hint={
              !accessLoading &&
              `${accessSummary?.signInFailures24h ?? 0} sign-in failures in 24h`
            }
            tone={
              (accessSummary?.signInFailures24h ?? 0) > 0 ? 'danger' : 'primary'
            }
          />
        </Grid>

        <Grid columns={{ initial: '1', lg: '2' }} gap="3">
          <Card size="2">
            <Heading as="h3" size="4" mb="3">
              Risk profile (residual)
            </Heading>
            {riskLoading ? (
              <Spinner size="2" />
            ) : (
              <RiskProfileBar profile={riskSummary?.profile ?? []} />
            )}
          </Card>

          <Card size="2">
            <Heading as="h3" size="4" mb="3">
              Compliance and access
            </Heading>
            <Flex direction="column" gap="2">
              {[
                [
                  'Obligations registered',
                  obligationLoading ? '…' : obligationSummary?.registeredCount
                ],
                [
                  'Obligation reviews due ≤ 30 days',
                  obligationLoading
                    ? '…'
                    : obligationSummary?.reviewsDueSoonCount
                ],
                [
                  'Active users',
                  accessLoading ? '…' : accessSummary?.activeUsersCount
                ],
                [
                  'Deactivated users',
                  accessLoading ? '…' : accessSummary?.deactivatedUsersCount
                ],
                [
                  'Signing in with Entra ID',
                  accessLoading ? '…' : accessSummary?.ssoUsersCount
                ],
                [
                  'Successful sign-ins (24h)',
                  accessLoading ? '…' : accessSummary?.successfulSignIns24h
                ]
              ].map(([label, value]) => (
                <Flex key={label} justify="between">
                  <Text size="2" color="gray">
                    {label}
                  </Text>
                  <Text size="2" weight="bold">
                    {value}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>
        </Grid>
      </Flex>
    </Box>
  );
}
