"use client";

import { useState } from "react";
import { Check, CreditCard, LockKeyhole, Sparkles, WalletCards } from "lucide-react";
import clsx from "clsx";
import { paymentPackages, type PackageCode } from "@/features/payments/packages";

const tokens = (value: number) => new Intl.NumberFormat("de-DE").format(value);

export function PaymentPackages({ signedIn, tokenBalance }: { signedIn: boolean; tokenBalance: number }) {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  async function checkout(provider: "stripe" | "paypal", packageCode: PackageCode) {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    setLoading(`${provider}-${packageCode}`);
    setMessage("");
    try {
      const response = await fetch(`/api/payments/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageCode })
      });
      const data = await response.json() as { url?: string; message?: string };
      if (!response.ok || !data.url) throw new Error(data.message ?? "Checkout konnte nicht gestartet werden.");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout konnte nicht gestartet werden.");
      setLoading("");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Pakete und API-Nutzung</p>
          <h1 className="text-balance mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Die Immobilienanalyse bleibt kostenlos.</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Wähle nur dann ein Paket, wenn du KI-Erklärungen, Finanzierungsalternativen, Förderrecherche oder einen vollständigen PDF-Bericht brauchst.</p>
        </div>
        <div className="rounded-2xl bg-ink px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dein API-Budget</p>
          <p className="mt-1 text-2xl font-black">{tokens(tokenBalance)} Tokens</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300"><LockKeyhole size={13} aria-hidden="true" />{signedIn ? "Mit deinem Konto verknüpft" : "Anmeldung beim Kauf erforderlich"}</p>
        </div>
      </header>

      <section className="mt-8 flex items-start gap-4 rounded-3xl border border-teal-200 bg-mint p-5 dark:border-teal-800 dark:bg-teal-950/60 sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal text-white"><Sparkles size={21} aria-hidden="true" /></span>
        <div><p className="font-bold text-ink dark:text-white">Immer kostenlos: deterministische Grundanalyse</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">Kaufnebenkosten, Haushaltsbelastung, Finanzierungsgrundlagen und Risiken verbrauchen keine Tokens. Verbrauch entsteht erst bei klar gekennzeichneten KI-Aufgaben.</p></div>
      </section>

      <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Kaufpakete">
        {paymentPackages.map((item) => {
          const premium = item.code === "premium";
          const stripeLoading = loading === `stripe-${item.code}`;
          const paypalLoading = loading === `paypal-${item.code}`;
          return (
            <article key={item.code} className={clsx("relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900", premium ? "border-teal ring-2 ring-teal/15 dark:border-teal-500" : "border-slate-200 dark:border-slate-700")}>
              {premium ? <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-black text-teal dark:bg-teal-950 dark:text-teal-200"><Sparkles size={13} aria-hidden="true" />Alles inklusive</span> : null}
              <h2 className="text-xl font-bold text-ink dark:text-white">{item.name}</h2>
              <p className="mt-3 text-4xl font-black tracking-tight text-ink dark:text-white">{(item.priceCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
              <p className="mt-2 text-sm font-bold text-teal dark:text-teal-300">{tokens(item.tokenAllowance)} API-Tokens</p>
              <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.audience}</p>
              <div className="mt-4 rounded-xl bg-cloud p-3 text-sm font-semibold leading-6 text-ink dark:bg-slate-800 dark:text-white"><span className="text-slate-500 dark:text-slate-400">Ergebnis: </span>{item.outcome}</div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-1 shrink-0 text-teal" size={15} strokeWidth={2.5} aria-hidden="true" />{feature}</li>)}
              </ul>
              <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">{item.bestFor}</p>
              <div className="mt-5 space-y-2">
                <button type="button" onClick={() => void checkout("stripe", item.code)} disabled={Boolean(loading)} className={clsx("flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50", premium ? "bg-teal text-white hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950" : "bg-ink text-white hover:bg-slate-800")}><WalletCards size={17} aria-hidden="true" />{stripeLoading ? "Checkout wird geöffnet …" : "Apple Pay / Google Pay"}</button>
                <button type="button" onClick={() => void checkout("paypal", item.code)} disabled={Boolean(loading)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-[#0070ba] hover:text-[#0070ba] disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-white"><CreditCard size={17} aria-hidden="true" />{paypalLoading ? "PayPal wird geöffnet …" : "Mit PayPal kaufen"}</button>
              </div>
            </article>
          );
        })}
      </section>

      {message ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100" role="alert">{message}</p> : null}
      <p className="mt-8 text-sm leading-6 text-slate-500 dark:text-slate-400">Der tatsächliche Verbrauch wird nach jedem API-Aufruf anhand der gemeldeten Ein- und Ausgabe-Tokens abgerechnet. Apple Pay und Google Pay erscheinen abhängig von Gerät und eingerichteter Wallet im sicheren Stripe-Checkout.</p>
    </main>
  );
}
