"use client";
import { Info, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteGameDialog } from "@/components/games/DeleteGameDialog";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { humanTeachers } from "@/lib/data/humanTeachers";
import type { HumanTeacher, LessonBooking } from "@/lib/types/humanTeachers";
import { hydrateLessonBookingStore, useLessonBookingStore } from "@/store/useLessonBookingStore";
import { HumanTeacherNotice } from "./HumanTeacherNotice";
import { filterTeachers, initialTeacherFilters, type TeacherFilterState } from "./humanTeachers";
import { BookingSuccessDialog } from "./BookingSuccessDialog";
import { LessonBookingDialog } from "./LessonBookingDialog";
import { MyBookings } from "./MyBookings";
import { TeacherCard } from "./TeacherCard";
import { TeacherFilters } from "./TeacherFilters";
import { TeacherProfileDialog } from "./TeacherProfileDialog";
import { TeachersEmptyState } from "./TeachersEmptyState";

export function HumanTeachersContent() {
  const bookings = useLessonBookingStore((state) => state.bookings);
  const addBooking = useLessonBookingStore((state) => state.addBooking);
  const cancelBooking = useLessonBookingStore((state) => state.cancelBooking);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<"catalog" | "bookings">("catalog");
  const [filters, setFilters] = useState<TeacherFilterState>(initialTeacherFilters);
  const [profile, setProfile] = useState<HumanTeacher | null>(null);
  const [bookingTeacher, setBookingTeacher] = useState<HumanTeacher | null>(null);
  const [success, setSuccess] = useState<LessonBooking | null>(null);
  const [notice, setNotice] = useState("");
  const [cancelTarget, setCancelTarget] = useState<LessonBooking | null>(null);
  const catalogTabRef = useRef<HTMLButtonElement>(null);
  const bookingsTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { let active = true; void hydrateLessonBookingStore().finally(() => { if (active) setHydrated(true); }); return () => { active = false; }; }, []);
  const visible = useMemo(() => filterTeachers(humanTeachers, filters), [filters]);
  const book = (teacher: HumanTeacher) => { setProfile(null); setBookingTeacher(teacher); };
  const repeat = (booking: LessonBooking) => { const teacher = humanTeachers.find((item) => item.id === booking.teacherId); if (teacher) book(teacher); };
  const closeSuccess = () => { setSuccess(null); requestAnimationFrame(() => catalogTabRef.current?.focus({ preventScroll: true })); };
  const viewBookings = () => { setSuccess(null); setTab("bookings"); requestAnimationFrame(() => bookingsTabRef.current?.focus({ preventScroll: true })); };

  return <div className="space-y-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageTitle eyebrow="Aulas particulares" title="Professor humano" description="Encontre profissionais fictícios para explorar como funcionariam aulas particulares online no TeaChess."/><span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white"><Users size={14}/>Demonstração</span></div>
    <MockNotice>Todas as aulas desta demonstração são online. Nenhuma videochamada, contratação ou pagamento real será realizado. Professores, horários e valores são simulados.</MockNotice>
    <div role="tablist" aria-label="Áreas de Professor humano" className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">{([['catalog','Encontrar professores'],['bookings',`Meus agendamentos${bookings.length ? ` (${bookings.length})` : ''}`]] as const).map(([id,label]) => <button key={id} ref={id === "catalog" ? catalogTabRef : bookingsTabRef} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-11 rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus ${tab === id ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"}`}>{label}</button>)}</div>
    {notice && <div role="status" aria-live="polite" className="flex gap-2 rounded-xl border border-line bg-neutral-100 p-4 text-sm"><Info className="shrink-0" size={18}/><p>{notice}</p></div>}
    {tab === "catalog" ? <div className="grid min-w-0 gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]"><TeacherFilters filters={filters} onChange={setFilters} onClear={() => setFilters(initialTeacherFilters)}/><section aria-label={`${visible.length} professores encontrados`}>{visible.length ? <div className="grid gap-4 md:grid-cols-2">{visible.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} onProfile={() => setProfile(teacher)} onBooking={() => book(teacher)}/>)}</div> : <TeachersEmptyState onClear={() => setFilters(initialTeacherFilters)}/>}</section></div> : !hydrated ? <div role="status" className="rounded-2xl border border-line bg-white p-8">Carregando agendamentos locais…</div> : <MyBookings bookings={bookings} onCancel={setCancelTarget} onRepeat={repeat}/>}
    <HumanTeacherNotice/>
    <TeacherProfileDialog teacher={profile} onClose={() => setProfile(null)} onBooking={book} onUnavailable={setNotice}/>
    <LessonBookingDialog teacher={bookingTeacher} onClose={() => setBookingTeacher(null)} onConfirm={(value) => { addBooking(value); setBookingTeacher(null); setSuccess(value); }}/>
    <BookingSuccessDialog booking={success} onClose={closeSuccess} onViewBookings={viewBookings}/>
    <DeleteGameDialog open={Boolean(cancelTarget)} title="Cancelar demonstração?" description="O registro continuará no histórico com o status Cancelado localmente. Nenhuma agenda real será alterada." confirmLabel="Cancelar localmente" destructive onCancel={() => setCancelTarget(null)} onConfirm={() => { if (cancelTarget) cancelBooking(cancelTarget.id); setCancelTarget(null); }}/>
  </div>;
}
