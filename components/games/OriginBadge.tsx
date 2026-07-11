import type { GameOrigin } from "@/lib/types/chess";

const styles: Record<GameOrigin, string> = {
  platform: "border-neutral-300 bg-neutral-100 text-neutral-800",
  external: "border-blue-200 bg-blue-50 text-blue-800",
};

export function OriginBadge({ origin }: { origin: GameOrigin }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[origin]}`}>{origin === "platform" ? "Plataforma" : "Externa"}</span>;
}
