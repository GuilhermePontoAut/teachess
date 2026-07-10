import { ArrowRight, BookOpen, Camera, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";

const quickActions = [
  { href: "/jogar", label: "Iniciar partida", detail: "Pratique em um tabuleiro simulado", icon: Play },
  { href: "/enviar-imagem", label: "Enviar imagem", detail: "Prepare uma posição para revisão", icon: Camera },
  { href: "/treinamento", label: "Continuar estudo", detail: "Retome sua trilha de aprendizado", icon: BookOpen },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Visão geral" title="Olá, enxadrista!" description="Seu espaço para aprender, praticar e acompanhar sua evolução no xadrez." />

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Sparkles size={14} aria-hidden="true" /> Jornada TeaChess
          </span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cada lance é uma nova oportunidade de aprender.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Explore as áreas do protótipo e construa sua rotina de estudos no seu ritmo.</p>
          <Link href="/treinamento" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
            Explorar treinamento <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="section-kicker">Comece agora</p><h2 id="quick-actions-title" className="text-xl font-semibold text-slate-900">Ações rápidas</h2></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map(({ href, label, detail, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100"><Icon size={21} aria-hidden="true" /></span>
              <span className="flex items-center justify-between gap-3 font-semibold text-slate-900">{label}<ArrowRight size={17} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" aria-hidden="true" /></span>
              <span className="mt-1 block text-sm leading-5 text-slate-500">{detail}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
