import { useMemo, useState } from 'react';
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import trLocale from '@fullcalendar/core/locales/tr';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { APPOINTMENT_STATUSES, isEditableStatus, type AppointmentDTO } from '@ritma/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/feedback';
import { Select } from '@/components/ui/form';
import { useStaff } from '@/features/staff/api';
import { getErrorMessage } from '@/lib/errors';
import { useMediaQuery } from '@/lib/hooks';
import { useAppointments, useSaveAppointment } from './api';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import { StatusBadge } from './StatusBadge';

type DialogState = { appointment: AppointmentDTO } | { start?: Date } | null;

// Stable option objects: FullCalendar re-applies options (and re-fires datesSet) when references change.
const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin];
const LOCALES = [trLocale];
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', hour12: false } as const;
const MOBILE_HEADER = { left: 'prev,next', center: 'title', right: 'today' };
const MOBILE_FOOTER = { center: 'listWeek,timeGridDay,dayGridMonth' };
const DESKTOP_HEADER = { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' };

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [staffId, setStaffId] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: staff = [] } = useStaff();
  const { data: appointments = [], isFetching } = useAppointments(range && { ...range, staffId: staffId || undefined });
  const reschedule = useSaveAppointment();

  const events = useMemo<EventInput[]>(
    () =>
      appointments.map((a) => ({
        id: a.id,
        title: `${a.customer.fullName} · ${a.service.name}${a.staff ? ` (${a.staff.fullName})` : ''}`,
        start: a.startAt,
        end: a.endAt,
        classNames: [`fc-status-${a.status.toLowerCase()}`],
        editable: isEditableStatus(a.status),
        extendedProps: { appointment: a },
      })),
    [appointments],
  );

  const onEventDrop = ({ event, revert }: EventDropArg) => {
    const appointment = event.extendedProps.appointment as AppointmentDTO;
    reschedule.mutate(
      {
        id: appointment.id,
        data: {
          customerId: appointment.customerId,
          serviceId: appointment.serviceId,
          staffId: appointment.staffId,
          startAt: event.start!.toISOString(),
          notes: appointment.notes,
        },
      },
      {
        onSuccess: () => toast.success(t('appointments.updated')),
        onError: (error) => {
          revert();
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title={t('appointments.title')}
        description={t('appointments.subtitle')}
        actions={
          <>
            {isFetching && <Spinner className="h-4 w-4" />}
            <Select value={staffId} onChange={(event) => setStaffId(event.target.value)} className="w-auto min-w-40" aria-label={t('appointments.staff')}>
              <option value="">{t('appointments.allStaff')}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
            <Button onClick={() => setDialog({})}>
              <Plus className="h-4 w-4" /> {t('appointments.new')}
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {APPOINTMENT_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>

      <Card className="p-3 sm:p-4">
        <FullCalendar
          // Remount when switching layouts: initialView/toolbar only apply on mount.
          key={isMobile ? 'mobile' : 'desktop'}
          plugins={PLUGINS}
          locales={LOCALES}
          locale={i18n.language}
          initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
          headerToolbar={isMobile ? MOBILE_HEADER : DESKTOP_HEADER}
          footerToolbar={isMobile ? MOBILE_FOOTER : undefined}
          firstDay={1}
          height="auto"
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          nowIndicator
          dayMaxEvents={3}
          eventDurationEditable={false}
          eventTimeFormat={TIME_FORMAT}
          slotLabelFormat={TIME_FORMAT}
          events={events}
          datesSet={(arg: DatesSetArg) => {
            const next = { from: arg.start.toISOString(), to: arg.end.toISOString() };
            setRange((prev) => (prev?.from === next.from && prev.to === next.to ? prev : next));
          }}
          dateClick={(arg: DateClickArg) => {
            const start = new Date(arg.date);
            if (arg.allDay) start.setHours(9, 0, 0, 0); // month view: default to opening time
            setDialog({ start });
          }}
          eventClick={(arg: EventClickArg) => setDialog({ appointment: arg.event.extendedProps.appointment as AppointmentDTO })}
          eventDrop={onEventDrop}
        />
      </Card>

      <AppointmentFormDialog
        open={dialog !== null}
        appointment={dialog && 'appointment' in dialog ? dialog.appointment : null}
        defaultStart={dialog && 'start' in dialog ? dialog.start : undefined}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
