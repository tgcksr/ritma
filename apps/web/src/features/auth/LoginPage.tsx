import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck2, BellRing, ChartNoAxesColumn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { loginSchema } from '@ritma/shared';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/errors';
import { useLogin, useSession } from './api';

const DEMO = { email: 'admin@ritma.local', password: 'admin123' };

export default function LoginPage() {
  const { t } = useTranslation();
  const { data: user } = useSession();
  const login = useLogin();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: import.meta.env.DEV ? DEMO : { email: '', password: '' },
  });

  if (user) return <Navigate to={from} replace />;

  const features = [
    { icon: CalendarCheck2, text: t('nav.calendar') },
    { icon: BellRing, text: t('nav.notifications') },
    { icon: ChartNoAxesColumn, text: t('nav.dashboard') },
  ];

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold">{t('app.name')}</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold">{t('auth.heroTitle')}</h2>
          <p className="mt-4 text-indigo-100">{t('auth.heroText')}</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
                <Icon className="h-4 w-4" /> {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-indigo-200">{t('app.tagline')}</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo />
            <span className="font-semibold">{t('app.name')}</span>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t('auth.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.subtitle')}</p>

          <form className="mt-8 space-y-4" noValidate onSubmit={handleSubmit((values) => login.mutate(values))}>
            {login.error && <Alert>{getErrorMessage(login.error)}</Alert>}
            <Field label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="username" autoFocus aria-invalid={!!errors.email} {...register('email')} />
            </Field>
            <Field label={t('auth.password')} htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
            </Field>
            <Button type="submit" className="w-full" loading={login.isPending}>
              {t('auth.submit')}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <p className="mt-6 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
              {t('auth.demoHint', DEMO)}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
