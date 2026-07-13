import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import clsx from "clsx";

type StatusTone = "positive" | "caution" | "negative" | "info";

const styles: Record<StatusTone, string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  caution: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  negative: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
  info: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
};

const icons = { positive: CheckCircle2, caution: AlertTriangle, negative: XCircle, info: Info };

export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  const Icon = icons[tone];
  return <span className={clsx("inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", styles[tone], className)}><Icon size={14} aria-hidden="true" />{children}</span>;
}
