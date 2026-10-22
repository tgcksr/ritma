import { normalizePhone, normalizeSearch } from '@ritma/shared';
import type { CustomerInput, CustomerListQuery } from '@ritma/shared';
import { customerListQuerySchema } from '@ritma/shared';
import { conflict, notFound } from '../../core/errors';
import { customersRepository } from './customers.repository';

const buildSearchKey = (input: CustomerInput) =>
  normalizeSearch([input.fullName, input.phone, input.email ?? ''].join(' '));

async function assertPhoneAvailable(phone: string, exceptId?: string) {
  const existing = await customersRepository.findByPhone(phone);
  if (existing && existing.id !== exceptId) {
    throw conflict('PHONE_TAKEN', 'Phone number belongs to another customer', { customerId: existing.id });
  }
}

async function getOrThrow(id: string) {
  const customer = await customersRepository.findById(id);
  if (!customer) throw notFound('Customer');
  return customer;
}

export const customersService = {
  async list(rawQuery: CustomerListQuery) {
    const { q, page, pageSize } = customerListQuerySchema.parse(rawQuery);
    const digits = q ? normalizePhone(q) : '';
    const { rows, total } = await customersRepository.list({
      searchKey: q ? normalizeSearch(q) : undefined,
      phone: /^\+?\d{3,}$/.test(digits) ? digits : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = rows.map(({ _count, appointments, searchKey: _searchKey, ...customer }) => ({
      ...customer,
      appointmentCount: _count.appointments,
      lastAppointmentAt: appointments[0]?.startAt ?? null,
    }));
    return { items, total, page, pageSize };
  },

  async getDetail(id: string) {
    const customer = await customersRepository.findWithHistory(id);
    if (!customer) throw notFound('Customer');

    const now = Date.now();
    const { searchKey: _searchKey, appointments, ...profile } = customer;
    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const stats = {
      total: appointments.length,
      completed: completed.length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
      upcoming: appointments.filter(
        (a) => a.startAt.getTime() > now && (a.status === 'PENDING' || a.status === 'CONFIRMED'),
      ).length,
      totalSpentCents: completed.reduce((sum, a) => sum + a.priceCents, 0),
    };
    return { ...profile, appointments, stats };
  },

  async create(input: CustomerInput) {
    await assertPhoneAvailable(input.phone);
    const { searchKey: _searchKey, ...customer } = await customersRepository.create({
      ...input,
      searchKey: buildSearchKey(input),
    });
    return customer;
  },

  async update(id: string, input: CustomerInput) {
    await getOrThrow(id);
    await assertPhoneAvailable(input.phone, id);
    const { searchKey: _searchKey, ...customer } = await customersRepository.update(id, {
      ...input,
      searchKey: buildSearchKey(input),
    });
    return customer;
  },

  async remove(id: string) {
    await getOrThrow(id);
    await customersRepository.delete(id);
  },
};
