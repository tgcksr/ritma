import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { client, createFixtures, createTestApp } from './helpers';

let app: FastifyInstance;
let api: ReturnType<typeof client>;
let f: Awaited<ReturnType<typeof createFixtures>>;

// A fixed future day so tests are independent of "now".
const at = (hhmm: string, day = '2030-03-12') => new Date(`${day}T${hhmm}:00.000Z`).toISOString();

beforeAll(async () => {
  const ctx = await createTestApp();
  app = ctx.app;
  api = client(app, ctx.cookie);
  f = await createFixtures(api);
});

afterAll(() => app.close());

describe('auth', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/customers' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('rejects wrong credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@test.local', password: 'nope' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('appointment conflict detection', () => {
  it('creates an appointment and computes the end time from the service duration', async () => {
    const res = await api.post('/api/appointments', {
      customerId: f.customer1.id,
      serviceId: f.service.id,
      staffId: f.staffA.id,
      startAt: at('10:00'),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.endAt).toBe(at('11:00'));
    expect(body.status).toBe('PENDING');
    expect(body.priceCents).toBe(50_000);
  });

  it('blocks a double booking for the same staff member', async () => {
    const res = await api.post('/api/appointments', {
      customerId: f.customer2.id,
      serviceId: f.service.id,
      staffId: f.staffA.id,
      startAt: at('10:30'),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('STAFF_BUSY');
  });

  it('blocks a double booking for the same customer with another staff member', async () => {
    const res = await api.post('/api/appointments', {
      customerId: f.customer1.id,
      serviceId: f.service.id,
      staffId: f.staffB.id,
      startAt: at('10:45'),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CUSTOMER_BUSY');
  });

  it('allows back-to-back appointments', async () => {
    const res = await api.post('/api/appointments', {
      customerId: f.customer2.id,
      serviceId: f.service.id,
      staffId: f.staffA.id,
      startAt: at('11:00'),
    });
    expect(res.statusCode).toBe(201);
  });

  it('frees the slot when an appointment is cancelled', async () => {
    const first = (
      await api.post('/api/appointments', {
        customerId: f.customer1.id,
        serviceId: f.service.id,
        staffId: f.staffB.id,
        startAt: at('14:00'),
      })
    ).json();
    await api.patch(`/api/appointments/${first.id}/status`, { status: 'CANCELLED' });

    const res = await api.post('/api/appointments', {
      customerId: f.customer2.id,
      serviceId: f.service.id,
      staffId: f.staffB.id,
      startAt: at('14:15'),
    });
    expect(res.statusCode).toBe(201);
  });

  it('ignores the appointment itself when rescheduling', async () => {
    const appt = (
      await api.post('/api/appointments', {
        customerId: f.customer1.id,
        serviceId: f.service.id,
        staffId: f.staffA.id,
        startAt: at('16:00'),
      })
    ).json();
    const res = await api.put(`/api/appointments/${appt.id}`, {
      customerId: f.customer1.id,
      serviceId: f.service.id,
      staffId: f.staffA.id,
      startAt: at('16:30'),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().endAt).toBe(at('17:30'));
  });

  it('rejects staff who do not provide the service', async () => {
    const res = await api.post('/api/appointments', {
      customerId: f.customer1.id,
      serviceId: f.otherService.id,
      staffId: f.staffA.id,
      startAt: at('09:00', '2030-03-13'),
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('STAFF_NOT_QUALIFIED');
  });
});

describe('appointment status', () => {
  it('enforces the status lifecycle', async () => {
    const appt = (
      await api.post('/api/appointments', {
        customerId: f.customer2.id,
        serviceId: f.otherService.id,
        startAt: at('09:00', '2030-03-14'),
      })
    ).json();

    expect((await api.patch(`/api/appointments/${appt.id}/status`, { status: 'CONFIRMED' })).statusCode).toBe(200);
    expect((await api.patch(`/api/appointments/${appt.id}/status`, { status: 'COMPLETED' })).statusCode).toBe(200);

    const back = await api.patch(`/api/appointments/${appt.id}/status`, { status: 'PENDING' });
    expect(back.statusCode).toBe(422);
    expect(back.json().error.code).toBe('INVALID_TRANSITION');

    const edit = await api.put(`/api/appointments/${appt.id}`, {
      customerId: f.customer2.id,
      serviceId: f.otherService.id,
      startAt: at('10:00', '2030-03-14'),
    });
    expect(edit.json().error.code).toBe('NOT_EDITABLE');
  });
});

describe('customers', () => {
  it('rejects duplicate phone numbers', async () => {
    const res = await api.post('/api/customers', { fullName: 'Kopya', phone: f.customer1.phone });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('PHONE_TAKEN');
  });

  it('searches ignoring Turkish characters and case', async () => {
    await api.post('/api/customers', { fullName: 'Şükrü Işıkçı', phone: '05559998877' });
    const res = await api.get('/api/customers?q=sukru%20isik');
    expect(res.json().items.map((c: { fullName: string }) => c.fullName)).toContain('Şükrü Işıkçı');
  });

  it('returns profile with history and stats', async () => {
    const res = await api.get(`/api/customers/${f.customer2.id}`);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.appointments.length).toBeGreaterThan(0);
    expect(body.stats.completed).toBe(1);
    expect(body.stats.totalSpentCents).toBe(20_000);
  });

  it('validates input with translatable messages', async () => {
    const res = await api.post('/api/customers', { fullName: '', phone: 'x' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.details.fieldErrors.phone).toContain('validation.phone');
  });
});

describe('services & staff', () => {
  it('prevents deleting a service that has appointments', async () => {
    const res = await api.delete(`/api/services/${f.service.id}`);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('SERVICE_IN_USE');
  });
});
