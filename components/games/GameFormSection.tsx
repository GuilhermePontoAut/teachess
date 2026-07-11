export function GameFormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
    <div className="border-b border-line pb-4"><h2 className="text-lg font-semibold text-neutral-950">{title}</h2><p className="mt-1 text-sm leading-6 text-muted">{description}</p></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
  </section>;
}
