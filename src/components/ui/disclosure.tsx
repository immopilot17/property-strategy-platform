import { ChevronDown } from "lucide-react";

export function Disclosure({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <details id={id} className="group scroll-mt-28 border-b border-slate-200 last:border-b-0 dark:border-slate-700">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-4 font-bold text-ink transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800/70 sm:px-5">
        <span>
          <span className="block">{title}</span>
          {description ? <span className="mt-1 block text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">{description}</span> : null}
        </span>
        <ChevronDown className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" size={20} aria-hidden="true" />
      </summary>
      <div className="px-4 pb-6 sm:px-5">{children}</div>
    </details>
  );
}
