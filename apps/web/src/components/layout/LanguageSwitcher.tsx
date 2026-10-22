import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type LanguageCode } from '@/i18n';
import { cn } from '@/lib/cn';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5', className)} role="group" aria-label={t('common.language')}>
      <Languages className="ml-1.5 h-4 w-4 text-slate-400" aria-hidden />
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code satisfies LanguageCode)}
          aria-pressed={i18n.language === code}
          title={label}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors',
            i18n.language === code ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
