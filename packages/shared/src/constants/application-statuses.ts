export interface ApplicationStatus {
  id: string;
  label: string;
  color: string;
  order: number;
}

export const APPLICATION_STATUSES = {
  saved: {
    id: 'saved',
    label: 'Saved',
    color: '#6B7280',
    order: 0,
  },
  applied: {
    id: 'applied',
    label: 'Applied',
    color: '#3B82F6',
    order: 1,
  },
  screening: {
    id: 'screening',
    label: 'Screening',
    color: '#F59E0B',
    order: 2,
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    color: '#8B5CF6',
    order: 3,
  },
  offer: {
    id: 'offer',
    label: 'Offer',
    color: '#10B981',
    order: 4,
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected',
    color: '#EF4444',
    order: 5,
  },
  withdrawn: {
    id: 'withdrawn',
    label: 'Withdrawn',
    color: '#9CA3AF',
    order: 6,
  },
} as const;

export type ApplicationStatusId = keyof typeof APPLICATION_STATUSES;

export const APPLICATION_STATUS_IDS: ApplicationStatusId[] = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];

/**
 * Returns statuses sorted by their pipeline order.
 */
export function getOrderedStatuses(): ApplicationStatus[] {
  return APPLICATION_STATUS_IDS.map(
    (id) => APPLICATION_STATUSES[id] as unknown as ApplicationStatus,
  );
}

/**
 * Returns true if the given status is a terminal state (offer, rejected, withdrawn).
 */
export function isTerminalStatus(status: ApplicationStatusId): boolean {
  return status === 'offer' || status === 'rejected' || status === 'withdrawn';
}
