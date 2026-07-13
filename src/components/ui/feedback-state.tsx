import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

const icons = { loading: LoaderCircle, empty: Inbox, error: AlertCircle };

export function FeedbackState({ kind, title, description }: { kind: keyof typeof icons; title: string; description?: string }) {
  const Icon = icons[kind];
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/60" role={kind === "error" ? "alert" : "status"}>
      <Icon className={kind === "loading" ? "mx-auto animate-spin text-teal" : "mx-auto text-slate-400"} size={26} aria-hidden="true" />
      <p className="mt-3 font-bold text-ink dark:text-white">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p> : null}
    </div>
  );
}
