import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addMinutes, normalizeSearch } from '@ritma/shared';
import type { AppointmentStatus } from '@ritma/shared';

try {
  process.loadEnvFile();
} catch {
  // optional
}

const prisma = new PrismaClient();

// Deterministic pseudo-random generator so the demo data is the same on every seed.
let state = 42;
const random = () => ((state = (state * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];

const SERVICES = [
  { key: 'cut', name: 'Saç Kesimi', durationMin: 45, priceCents: 35_000 },
  { key: 'color', name: 'Saç Boyama', durationMin: 90, priceCents: 120_000 },
  { key: 'beard', name: 'Sakal Tıraşı', durationMin: 30, priceCents: 20_000 },
  { key: 'nails', name: 'Manikür', durationMin: 45, priceCents: 40_000 },
  { key: 'skin', name: 'Cilt Bakımı', durationMin: 60, priceCents: 80_000 },
] as const;

const STAFF = [
  { fullName: 'Ayşe Yılmaz', phone: '+905321000001', email: 'ayse@ritma.local', services: ['cut', 'color'] },
  { fullName: 'Mehmet Demir', phone: '+905321000002', email: 'mehmet@ritma.local', services: ['cut', 'beard'] },
  { fullName: 'Zeynep Kaya', phone: '+905321000003', email: 'zeynep@ritma.local', services: ['nails', 'skin'] },
];

const CUSTOMERS = [
  ['Elif Şahin', '05301112233', 'elif.sahin@example.com', 'Kısa kesim tercih ediyor.'],
  ['Can Öztürk', '05302223344', null, null],
  ['Selin Arslan', '05303334455', 'selin@example.com', 'Amonyaksız boya kullanılmalı.'],
  ['Burak Çelik', '05304445566', 'burak.celik@example.com', null],
  ['Deniz Aydın', '05305556677', null, 'Hafta sonu randevularını tercih ediyor.'],
  ['Gizem Koç', '05306667788', 'gizem.koc@example.com', null],
  ['Emre Kurt', '05307778899', 'emre@example.com', null],
  ['Ceren Yıldız', '05308889900', null, 'Cilt hassasiyeti var.'],
  ['Oğuz Polat', '05309990011', 'oguz.polat@example.com', null],
  ['İrem Güneş', '05310001122', 'irem@example.com', 'Doğum günü: 14 Mart'],
  ['Kaan Erdem', '05311112233', null, null],
  ['Melis Aksoy', '05312223344', 'melis.aksoy@example.com', null],
] as const;

const SLOTS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'];

async function main() {
  await prisma.notificationLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.customer.deleteMany();

  const email = (process.env.ADMIN_EMAIL ?? 'admin@ritma.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: process.env.ADMIN_NAME ?? 'Yönetici', passwordHash: await bcrypt.hash(password, 12) },
  });

  const services = new Map<string, { id: string; durationMin: number; priceCents: number }>();
  for (const { key, ...data } of SERVICES) services.set(key, await prisma.service.create({ data }));

  const staff = [];
  for (const { services: keys, ...data } of STAFF) {
    const member = await prisma.staff.create({
      data: { ...data, services: { create: keys.map((key) => ({ serviceId: services.get(key)!.id })) } },
    });
    staff.push({ ...member, serviceKeys: keys });
  }

  const customers = [];
  for (const [fullName, phone, mail, notes] of CUSTOMERS) {
    customers.push(
      await prisma.customer.create({
        data: { fullName, phone, email: mail, notes, searchKey: normalizeSearch(`${fullName} ${phone} ${mail ?? ''}`) },
      }),
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;

  for (let dayOffset = -21; dayOffset <= 10; dayOffset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + dayOffset);
    if (day.getDay() === 0) continue; // closed on Sundays

    for (const slot of SLOTS) {
      // Different staff at the same time always get different customers, so seed data never conflicts.
      const available = [...customers];
      for (const member of staff) {
        if (random() < 0.45) continue;
        const [h, m] = slot.split(':').map(Number);
        const start = new Date(day);
        start.setHours(h, m, 0, 0);

        const service = services.get(pick(member.serviceKeys))!;
        const customer = available.splice(Math.floor(random() * available.length), 1)[0];
        const isPast = start < new Date();
        const roll = random();
        const status: AppointmentStatus = isPast
          ? roll < 0.85 ? 'COMPLETED' : 'CANCELLED'
          : roll < 0.55 ? 'CONFIRMED' : roll < 0.92 ? 'PENDING' : 'CANCELLED';

        await prisma.appointment.create({
          data: {
            customerId: customer.id,
            serviceId: service.id,
            staffId: member.id,
            startAt: start,
            endAt: addMinutes(start, service.durationMin),
            status,
            priceCents: service.priceCents,
          },
        });
        count++;
      }
    }
  }

  console.log(`Seed complete: ${services.size} services, ${staff.length} staff, ${customers.length} customers, ${count} appointments.`);
  console.log(`Admin login: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
