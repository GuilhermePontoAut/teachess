"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { LessonBooking } from "@/lib/types/humanTeachers";

interface BookingSuccessDialogProps {
  booking: LessonBooking | null;
  onClose: () => void;
  onViewBookings: () => void;
}

export function BookingSuccessDialog({ booking, onClose, onViewBookings }: BookingSuccessDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (booking && !dialog?.open) dialog?.showModal();
    if (!booking && dialog?.open) dialog.close();
  }, [booking]);

  if (!booking) return <dialog ref={dialogRef} />;

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-success-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-black/60"
    >
      <div className="relative p-6 pt-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar confirmação de agendamento"
          className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-lg hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-focus"
        >
          <X aria-hidden="true" />
        </button>
        <div className="pr-10">
          <CheckCircle2 size={32} aria-hidden="true" />
          <h2 id="booking-success-title" className="mt-4 text-xl font-semibold">Agendamento simulado salvo</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">A aula online com {booking.teacherName} foi registrada apenas neste navegador. Nenhuma videochamada, reserva real, mensagem ou pagamento foi criado.</p>
        <button type="button" autoFocus onClick={onViewBookings} className="mt-5 min-h-11 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-focus">Ver meus agendamentos</button>
      </div>
    </dialog>
  );
}
