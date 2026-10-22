import type { AppointmentStatus, NotificationChannel, NotificationKind } from './constants';

/** API response shapes. Dates are ISO strings once serialized to JSON. */

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerDTO {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListItemDTO extends CustomerDTO {
  appointmentCount: number;
  lastAppointmentAt: string | null;
}

export interface ServiceDTO {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffDTO {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  serviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDTO {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priceCents: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; fullName: string; phone: string };
  service: { id: string; name: string; durationMin: number };
  staff: { id: string; fullName: string } | null;
}

export interface CustomerDetailDTO extends CustomerDTO {
  appointments: AppointmentDTO[];
  stats: {
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
    totalSpentCents: number;
  };
}

export interface NotificationLogDTO {
  id: string;
  appointmentId: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  recipient: string;
  subject: string | null;
  body: string;
  sentAt: string;
  appointment: { id: string; startAt: string; customer: { id: string; fullName: string } };
}

export interface ReportBucket {
  key: string;
  total: number;
  completed: number;
  active: number;
  cancelled: number;
}

export interface ReportSummaryDTO {
  range: { from: string; to: string };
  totals: Record<AppointmentStatus, number> & { all: number };
  revenue: { realizedCents: number; expectedCents: number };
  /** One bucket per local day in the range (key: YYYY-MM-DD). */
  daily: ReportBucket[];
  /** One bucket per local hour 0-23 (key: "00".."23"). */
  hourly: ReportBucket[];
  byService: { serviceId: string; name: string; count: number; completed: number; revenueCents: number }[];
  upcoming: AppointmentDTO[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
