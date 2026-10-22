import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/** Friendly fallback for unexpected render errors (instead of React Router's developer screen). */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 rounded-full bg-rose-50 p-3">
        <TriangleAlert className="h-6 w-6 text-rose-500" />
      </div>
      <p className="font-medium text-slate-800">{t('errors.UNKNOWN')}</p>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        {t('common.reload')}
      </Button>
    </div>
  );
}
