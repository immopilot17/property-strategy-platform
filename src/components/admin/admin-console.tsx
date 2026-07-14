"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, Crown, Database, Flag, Search, ShieldCheck, Users } from "lucide-react";
import type { AppRole } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";
import { FeedbackState } from "@/components/ui/feedback-state";

type AdminUser = { id: string; email: string; role: AppRole; createdAt: string; lastSignInAt: string | null };
type FeatureFlag = { key: string; label: string; description: string; enabled: boolean; environment: string; updated_at: string };
type AuditEvent = { id: string; action: string; target_type: string; target_id: string | null; created_at: string };
type Overview = {
  viewer: { id: string; email?: string; role: AppRole };
  counts: { users: number; analyses: number; properties: number };
  users: AdminUser[];
  flags: FeatureFlag[];
  auditEvents: AuditEvent[];
  services: { database: boolean; ai: boolean; payments: boolean };
};

const sections = [
  { id: "overview", label: "Übersicht", icon: Activity },
  { id: "users", label: "Nutzer & Rollen", icon: Users },
  { id: "flags", label: "Feature-Flags", icon: Flag },
  { id: "system", label: "System & Audit", icon: Database }
] as const;

export function AdminConsole() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("overview");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "Admin-Konsole konnte nicht geladen werden.");
        setData(body);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Admin-Konsole konnte nicht geladen werden."));
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? data?.users.filter((user) => user.email.toLowerCase().includes(query) || user.role.includes(query)) ?? [] : data?.users ?? [];
  }, [data?.users, search]);

  async function changeRole(userId: string, role: AppRole) {
    setBusy(`role:${userId}`);
    setMessage("");
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const body = await response.json();
    if (response.ok) {
      setData((current) => current ? { ...current, users: current.users.map((user) => user.id === userId ? { ...user, role } : user) } : current);
      setMessage("Rolle wurde sicher aktualisiert.");
    } else setMessage(body.message ?? "Rolle konnte nicht aktualisiert werden.");
    setBusy("");
  }

  async function toggleFlag(flag: FeatureFlag) {
    setBusy(`flag:${flag.key}`);
    setMessage("");
    const response = await fetch(`/api/admin/feature-flags/${flag.key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !flag.enabled })
    });
    const body = await response.json();
    if (response.ok) {
      setData((current) => current ? { ...current, flags: current.flags.map((item) => item.key === flag.key ? { ...item, enabled: !item.enabled } : item) } : current);
      setMessage(`${flag.label} ist jetzt ${flag.enabled ? "deaktiviert" : "aktiv"}.`);
    } else setMessage(body.message ?? "Feature-Flag konnte nicht aktualisiert werden.");
    setBusy("");
  }

  if (error) return <main className="mx-auto max-w-6xl px-4 py-12"><FeedbackState kind="error" title="Admin-Konsole nicht verfügbar" description={error} /></main>;
  if (!data) return <main className="mx-auto max-w-6xl px-4 py-12"><FeedbackState kind="loading" title="Sichere Admin-Daten werden geladen" description="Rollen, Nutzer und Systemstatus werden geprüft." /></main>;

  return (
    <main className="min-h-[calc(100svh-72px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-slate-200 px-2 pb-4 dark:border-slate-700"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950"><Crown size={20} /></span><div><p className="font-black text-ink dark:text-white">Founder-Konsole</p><p className="text-xs text-slate-500">{data.viewer.email}</p></div></div>
          <nav className="mt-3 grid gap-1" aria-label="Admin-Bereiche">
            {sections.map((section) => { const Icon = section.icon; return <button key={section.id} type="button" onClick={() => setActive(section.id)} className={active === section.id ? "flex items-center gap-3 rounded-xl bg-mint px-3 py-3 text-left text-sm font-bold text-teal dark:bg-teal-950 dark:text-teal-200" : "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}><Icon size={18} />{section.label}</button>; })}
          </nav>
          <div className="mt-4 rounded-2xl bg-ink p-4 text-white"><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-200">Rollen-Hierarchie</p><p className="mt-3 text-sm font-bold">Founder › Admin › User</p><p className="mt-2 text-xs leading-5 text-slate-300">Founder besitzt den vollständigen, serverseitig geprüften Zugriff.</p></div>
        </aside>

        <div className="min-w-0">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-teal">Plattformverwaltung</p><h1 className="mt-1 text-3xl font-black tracking-tight text-ink dark:text-white">{sections.find((section) => section.id === active)?.label}</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Was passiert: Du verwaltest produktive Zugriffe. Warum wichtig: Jede Änderung wird geprüft und protokolliert. Als Nächstes: Wähle den gewünschten Bereich.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-sm font-bold text-teal dark:bg-teal-950 dark:text-teal-200"><ShieldCheck size={16} />{roleLabels[data.viewer.role]}</span></header>
          {message ? <div className="mt-5 rounded-2xl border border-teal-200 bg-mint px-4 py-3 text-sm font-bold text-teal" role="status">{message}</div> : null}

          {active === "overview" ? <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Live-Übersicht">
            {[{ label: "Nutzer", value: data.counts.users, icon: Users }, { label: "Analysen", value: data.counts.analyses, icon: Bot }, { label: "Immobilien", value: data.counts.properties, icon: Database }].map((item) => { const Icon = item.icon; return <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><Icon className="text-teal" size={20} /><p className="mt-5 text-sm text-slate-500">{item.label}</p><p className="mt-1 text-3xl font-black text-ink dark:text-white">{item.value}</p></article>; })}
          </section> : null}

          {active === "users" ? <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-ink dark:text-white">Nutzer und Rollen</h2><p className="mt-1 text-sm text-slate-500">Nur Founder können Rollen ändern.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2"><Search size={17} className="text-slate-400" /><span className="sr-only">Nutzer suchen</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nutzer suchen" className="min-w-0 bg-transparent text-sm outline-none" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800"><tr><th className="px-5 py-3">E-Mail</th><th className="px-5 py-3">Rolle</th><th className="px-5 py-3">Letzte Anmeldung</th><th className="px-5 py-3">Zugriff</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-semibold text-ink dark:text-white">{user.email}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800">{roleLabels[user.role]}</span></td><td className="px-5 py-4 text-slate-500">{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("de-DE") : "Noch nie"}</td><td className="px-5 py-4"><select aria-label={`Rolle für ${user.email}`} value={user.role} disabled={data.viewer.role !== "founder" || user.id === data.viewer.id || busy === `role:${user.id}`} onChange={(event) => changeRole(user.id, event.target.value as AppRole)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950"><option value="user">User</option><option value="admin">Admin</option><option value="founder">Founder</option></select></td></tr>)}</tbody></table></div></section> : null}

          {active === "flags" ? <section className="mt-6 grid gap-3">{data.flags.map((flag) => <article key={flag.key} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-black text-ink dark:text-white">{flag.label}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800">{flag.environment}</span></div><p className="mt-2 text-sm text-slate-500">{flag.description}</p></div><button type="button" role="switch" aria-checked={flag.enabled} disabled={busy === `flag:${flag.key}`} onClick={() => toggleFlag(flag)} className={flag.enabled ? "relative h-7 w-12 rounded-full bg-teal transition disabled:opacity-50" : "relative h-7 w-12 rounded-full bg-slate-300 transition disabled:opacity-50"}><span className={flag.enabled ? "absolute left-6 top-1 h-5 w-5 rounded-full bg-white shadow transition" : "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition"} /></button></article>)}</section> : null}

          {active === "system" ? <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black text-ink dark:text-white">Produktive Dienste</h2><div className="mt-4 grid gap-3">{[{ label: "Datenbank", ok: data.services.database }, { label: "KI-Service", ok: data.services.ai }, { label: "Zahlungen", ok: data.services.payments }].map((service) => <div key={service.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800"><span className="font-semibold">{service.label}</span><span className={service.ok ? "text-sm font-bold text-teal" : "text-sm font-bold text-amber-700"}>{service.ok ? "Online" : "Nicht konfiguriert"}</span></div>)}</div></section><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black text-ink dark:text-white">Letzte Audit-Ereignisse</h2><ol className="mt-4 grid gap-3">{data.auditEvents.map((event) => <li key={event.id} className="border-l-2 border-teal pl-3"><p className="text-sm font-bold text-ink dark:text-white">{event.action}</p><p className="mt-1 text-xs text-slate-500">{event.target_type} · {event.target_id ?? "System"} · {new Date(event.created_at).toLocaleString("de-DE")}</p></li>)}</ol></section></div> : null}
        </div>
      </div>
    </main>
  );
}

