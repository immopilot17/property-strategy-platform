import Link from "next/link";
import { House } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3 rounded-lg text-ink dark:text-white" aria-label="Property Strategy Startseite">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-teal/25 bg-mint text-teal dark:border-teal-300/25 dark:bg-teal-950 dark:text-teal-200">
        <House size={22} strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span className={compact ? "hidden sm:block" : "block"}>
        <span className="block text-base font-extrabold leading-none tracking-[-0.02em]">Property Strategy</span>
        {!compact ? <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Klar entscheiden</span> : null}
      </span>
    </Link>
  );
}
