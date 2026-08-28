/**
 * Risk criteria (ISO 31000 §6.3.4) — likelihood × impact, both 1-5.
 * Must stay in lockstep with backend/domains/risk/scoring.py.
 */
export function levelForScore(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 16) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export const RISK_LEVEL_COLOR: Record<
  string,
  'red' | 'orange' | 'blue' | 'green' | 'gray'
> = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'green'
};

export function riskLevelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export const LIKELIHOOD_LABELS = [
  '',
  'Rare',
  'Unlikely',
  'Possible',
  'Likely',
  'Almost certain'
];

export const IMPACT_LABELS = [
  '',
  'Negligible',
  'Minor',
  'Moderate',
  'Major',
  'Severe'
];

export const RISK_STATUS_LABEL: Record<string, string> = {
  identified: 'Identified',
  assessed: 'Assessed',
  treatment_planned: 'Treatment planned',
  treated: 'Treated',
  accepted: 'Accepted',
  closed: 'Closed'
};
