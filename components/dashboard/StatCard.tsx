import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
}

export function StatCard({ label, value, icon: Icon, detail }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">{value}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
      {detail && <p className="mt-3 text-xs text-muted">{detail}</p>}
    </article>
  );
}
