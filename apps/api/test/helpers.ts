import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { prisma } from '../src/core/db';

export const uniquePhone = () => `05${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

export async function createTestApp() {
  const app = await buildApp({ logger: false });
  const email = `admin-${randomUUID()}@test.local`;
  await prisma.user.create({
    data: { email, name: 'Test Admin', passwordHash: await bcrypt.hash('secret123', 4) },
  });

  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password: 'secret123' } });
  const setCookie = login.headers['set-cookie'];
  const cookie = String(Array.isArray(setCookie) ? setCookie[0] : setCookie).split(';')[0];
  return { app, cookie };
}

/** Small JSON client bound to an authenticated session. */
export function client(app: FastifyInstance, cookie: string) {
  const call = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') => (url: string, payload?: object) =>
    app.inject({ method, url, payload, headers: { cookie } });
  return { get: call('GET'), post: call('POST'), put: call('PUT'), patch: call('PATCH'), delete: call('DELETE') };
}

export async function createFixtures(api: ReturnType<typeof client>) {
  const service = (await api.post('/api/services', { name: 'Kesim', durationMin: 60, priceCents: 50_000 })).json();
  const otherService = (await api.post('/api/services', { name: 'Boya', durationMin: 30, priceCents: 20_000 })).json();
  const staffA = (await api.post('/api/staff', { fullName: 'Ayşe', serviceIds: [service.id] })).json();
  const staffB = (await api.post('/api/staff', { fullName: 'Mehmet', serviceIds: [service.id] })).json();
  const customer1 = (await api.post('/api/customers', { fullName: 'Ali Veli', phone: uniquePhone() })).json();
  const customer2 = (await api.post('/api/customers', { fullName: 'Ece Can', phone: uniquePhone(), email: 'ece@example.com' })).json();
  return { service, otherService, staffA, staffB, customer1, customer2 };
}
