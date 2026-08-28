'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Dialog,
  Flex,
  Grid,
  Select,
  Text,
  TextArea,
  TextField
} from '@radix-ui/themes';
import { useRiskRegisterCreateRiskMutation } from '@/features/risk-register/__generated__/queries.generated';
import {
  IMPACT_LABELS,
  LIKELIHOOD_LABELS,
  RISK_LEVEL_COLOR,
  levelForScore,
  riskLevelLabel
} from '@/lib/risk-level';

export interface RiskOwnerOption {
  id: string;
  firstName: string;
  lastName: string;
}

export interface NewRiskDialogProps {
  owners: RiskOwnerOption[];
  onCreated: () => void;
}

const LIKELIHOOD_OPTIONS = [1, 2, 3, 4, 5];
const IMPACT_OPTIONS = [1, 2, 3, 4, 5];

export function NewRiskDialog({ owners, onCreated }: NewRiskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [event, setEvent] = useState('');
  const [consequence, setConsequence] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const [createRisk, { loading }] = useRiskRegisterCreateRiskMutation();

  function reset() {
    setTitle('');
    setDescription('');
    setSource('');
    setEvent('');
    setConsequence('');
    setOwnerId('');
    setNextReviewDate('');
    setLikelihood(3);
    setImpact(3);
    setError(null);
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !ownerId) {
      setError('Title, description and risk owner are required.');
      return;
    }
    setError(null);

    const result = await createRisk({
      variables: {
        data: {
          title: title.trim(),
          description: description.trim(),
          source: source.trim(),
          event: event.trim(),
          consequence: consequence.trim(),
          ownerId,
          inherentLikelihood: likelihood,
          inherentImpact: impact,
          nextReviewDate: nextReviewDate || null
        }
      },
      refetchQueries: ['RiskRegisterRisks']
    });

    const payload = result.data?.createRisk;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }

    setOpen(false);
    reset();
    onCreated();
  }

  const level = levelForScore(likelihood, impact);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Dialog.Trigger>
        <Button>New risk</Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>New risk</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Record a new risk for assessment and treatment.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Title *
            </Text>
            <TextField.Root
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Unpatched internet-facing services"
            />
          </label>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Description *
            </Text>
            <TextArea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </label>

          <Grid columns="3" gap="2">
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Risk source
              </Text>
              <TextField.Root
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Delayed patching process"
              />
            </label>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Event
              </Text>
              <TextField.Root
                value={event}
                onChange={e => setEvent(e.target.value)}
                placeholder="Exploitation of known CVE"
              />
            </label>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Consequence
              </Text>
              <TextField.Root
                value={consequence}
                onChange={e => setConsequence(e.target.value)}
                placeholder="Data breach, service outage"
              />
            </label>
          </Grid>

          <Grid columns="2" gap="2">
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Risk owner *
              </Text>
              <Select.Root value={ownerId} onValueChange={setOwnerId}>
                <Select.Trigger
                  placeholder="Select owner…"
                  style={{ width: '100%' }}
                />
                <Select.Content>
                  {owners.map(owner => (
                    <Select.Item key={owner.id} value={owner.id}>
                      {owner.firstName} {owner.lastName}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Next review date
              </Text>
              <TextField.Root
                type="date"
                value={nextReviewDate}
                onChange={e => setNextReviewDate(e.target.value)}
              />
            </label>
          </Grid>

          <Flex
            direction="column"
            gap="2"
            p="3"
            style={{
              border: '1px solid var(--gray-a5)',
              borderRadius: 'var(--radius-3)'
            }}
          >
            <Text size="2" weight="medium">
              Inherent assessment
            </Text>
            <Grid columns="3" gap="2" align="end">
              <label>
                <Text as="div" size="2" mb="1">
                  Likelihood
                </Text>
                <Select.Root
                  value={String(likelihood)}
                  onValueChange={v => setLikelihood(Number(v))}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {LIKELIHOOD_OPTIONS.map(value => (
                      <Select.Item key={value} value={String(value)}>
                        {LIKELIHOOD_LABELS[value]}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
              <label>
                <Text as="div" size="2" mb="1">
                  Impact
                </Text>
                <Select.Root
                  value={String(impact)}
                  onValueChange={v => setImpact(Number(v))}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {IMPACT_OPTIONS.map(value => (
                      <Select.Item key={value} value={String(value)}>
                        {IMPACT_LABELS[value]}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
              <Flex direction="column" align="center" gap="1">
                <Text size="1" color="gray">
                  Level
                </Text>
                <Badge color={RISK_LEVEL_COLOR[level]} size="2">
                  {riskLevelLabel(level)} ({likelihood * impact})
                </Badge>
              </Flex>
            </Grid>
            <Text size="1" color="gray">
              Score = likelihood × impact; thresholds match the API&apos;s risk
              criteria.
            </Text>
          </Flex>

          {error && (
            <Callout.Root color="amber" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleSubmit} loading={loading}>
            Create risk
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
