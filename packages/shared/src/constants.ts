export const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that still occupy a slot in the calendar and can be edited. */
export const ACTIVE_STATUSES: readonly AppointmentStatus[] = ['PENDING', 'CONFIRMED'];

/** Statuses that block the time slot for conflict detection. */
export const BLOCKING_STATUSES: readonly AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

const STATUS_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'COMPLETED', 'CANCELLED'],
  CONFIRMED: ['PENDING', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function allowedTransitions(from: AppointmentStatus): readonly AppointmentStatus[] {
  return STATUS_TRANSITIONS[from];
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function isEditableStatus(status: AppointmentStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

export const NOTIFICATION_CHANNELS = ['SMS', 'EMAIL'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_KINDS = ['REMINDER_24H', 'REMINDER_1H'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const AUTH_COOKIE = 'ritma_session';
