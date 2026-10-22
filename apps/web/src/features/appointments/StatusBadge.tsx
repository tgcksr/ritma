import { CheckCircle2, CircleDashed, CircleX, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppointmentStatus } from '@ritma/shared';
import { Badge } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';

const STYLES: Record<AppointmentStatus, { className: string; icon: typeof Clock }> = {
  PENDING: { className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', icon: Clock },
  CONFIRMED: { className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', icon: CircleDashed },
  COMPLETED: { className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 },
  CANCELLED: { className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', icon: CircleX },
};

/** Status is always shown as icon + label, never color alone. */
export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const { t } = useTranslation();
  const { className: tone, icon: Icon } = STYLES[status];
  return (
    <Badge className={cn(tone, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(`status.${status}`)}
    </Badge>
  );
}
