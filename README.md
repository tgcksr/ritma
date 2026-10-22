# Ritma — Randevu ve Müşteri Takip Sistemi

> 📘 Kurulum, ekran ekran kullanım ve projenin nasıl yapıldığının ayrıntılı anlatımı: **[docs/KULLANIM-KILAVUZU.md](docs/KULLANIM-KILAVUZU.md)**

Hizmet sağlayıcılar (kuaför, güzellik merkezi, klinik, danışmanlık vb.) için randevu, müşteri (CRM), hizmet/personel yönetimi, hatırlatma ve raporlama uygulaması. Arayüz **Türkçe / İngilizce** seçilebilir.

## Hızlı başlangıç

Gereksinim: **Node.js 22+**

```bash
npm run setup     # bağımlılıklar + veritabanı migration + örnek veri
npm run dev       # API (http://127.0.0.1:3001) + Web (http://localhost:5173)
```

Giriş: `admin@ritma.local` / `admin123` (`apps/api/.env` içinden değiştirilebilir).

| Komut | Açıklama |
|---|---|
| `npm test` | Ortak paket + API testleri (çakışma, durum geçişleri, hatırlatma, arama, yetki) |
| `npm run typecheck` | Tüm paketlerde TypeScript kontrolü |
| `npm run build` then `npm start` | Üretim: API, derlenmiş arayüzü de tek süreçten sunar |
| `npm run db:reset -w @ritma/api` | Veritabanını sıfırla ve örnek verileri yeniden yükle |
| `npm run db:studio -w @ritma/api` | Prisma Studio ile verilere göz at |

## Mimari

```
apps/api        Fastify + Prisma (SQLite → PostgreSQL'e tek satırla geçiş)
  src/core      config, db, hata yönetimi, oturum doğrulama
  src/modules   auth · customers · services · staff · appointments · notifications · reports
                (her modül: *.routes → *.service → *.repository)
apps/web        React + Vite + Tailwind + TanStack Query + FullCalendar + Recharts + i18next
  src/features  özellik bazlı klasörler (api.ts hook'ları + sayfalar + formlar)
packages/shared Zod şemaları, tipler, durum makinesi — API ve arayüz aynı kuralları kullanır
```

### Önemli kurallar
- **Çakışma kontrolü** (`appointments.service.ts`): Bitiş saati hizmet süresinden hesaplanır. Aynı **personelin** ya da aynı **müşterinin** iptal edilmemiş randevularıyla örtüşme `409 STAFF_BUSY / CUSTOMER_BUSY` döner. Arka arkaya randevular (10:00–11:00, 11:00–12:00) serbesttir. Kontrol ve kayıt tek bir *serializable* transaction içinde yapılır.
- **Durum makinesi** (`packages/shared/src/constants.ts`): Bekliyor ⇄ Onaylandı → Tamamlandı / İptal Edildi. Tamamlanan ve iptal edilen randevular kesinleşmiştir ve düzenlenemez.
- **Fiyat** randevu anında kopyalanır (`priceCents`, kuruş cinsinden tam sayı). Böylece sonradan yapılan fiyat değişiklikleri geçmişi bozmaz.
- **Hatırlatmalar**: Arka plan görevi her dakika tarar ve 24 saat ile 1 saat kala SMS/e-posta gönderir. Her (randevu, kanal, tür) için en fazla bir kez gönderim, veritabanındaki benzersiz kısıtla garanti edilir. Randevu yeniden zamanlanırsa hatırlatmalar sıfırlanır. Gerçek bir sağlayıcı eklemek için `NotificationProvider` arayüzünü uygulayıp `app.ts` içinde mock sağlayıcının yerine kaydetmek yeterlidir.
- **Güvenlik**: bcrypt ile şifre özeti, JWT `httpOnly` + `SameSite=Lax` çerezi, giriş denemelerinde hız sınırı, tüm girdilerde Zod doğrulaması, Prisma ile parametreli sorgular.

### PostgreSQL'e geçiş
`apps/api/prisma/schema.prisma` → `provider = "postgresql"`, `.env` → `DATABASE_URL="postgresql://..."`, ardından `npx prisma migrate dev`.
