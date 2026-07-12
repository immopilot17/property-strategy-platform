"use client";

import { useState } from "react";
import { paymentPackages, type PackageCode } from "@/features/payments/packages";

export function PaymentPackages({ signedIn, credits }: { signedIn: boolean; credits: number }) {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  async function checkout(provider: "stripe" | "paypal", packageCode: PackageCode) {
    if (!signedIn) { window.location.href = "/login"; return; }
    setLoading(`${provider}-${packageCode}`);
    setMessage("");
    try {
      const response = await fetch(`/api/payments/${provider}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageCode })
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
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Optionale Erweiterungen</p><h1 className="mt-3 text-4xl font-bold">Die Immobilienanalyse bleibt kostenlos</h1><p className="mt-4 max-w-2xl text-slate-600">Bezahle nur für zusätzliche Unterstützung. Jedes höhere Paket enthält die Funktionen der vorherigen Stufe.</p></div>
        <div className="rounded-2xl bg-slate-950 px-6 py-4 text-white"><p className="text-xs uppercase tracking-wide text-slate-400">Guthaben</p><p className="text-2xl font-bold">{credits} Credits</p></div>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {paymentPackages.map((item) => (
          <article key={item.code} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">{item.name}</h2><p className="mt-3 text-4xl font-bold">{(item.priceCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p><p className="mt-2 text-slate-600">{item.credits} Credits für Zusatzfunktionen</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm leading-6 text-slate-600">{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <div className="mt-6 space-y-3">
              <button onClick={() => checkout("stripe", item.code)} disabled={Boolean(loading)} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50">Apple Pay / Google Pay</button>
              <button onClick={() => checkout("paypal", item.code)} disabled={Boolean(loading)} className="w-full rounded-xl border border-blue-700 px-4 py-3 font-bold text-blue-800 disabled:opacity-50">PayPal</button>
            </div>
          </article>
        ))}
      </div>
      {message ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{message}</p> : null}
      <p className="mt-8 text-sm leading-6 text-slate-500">Apple Pay und Google Pay werden abhängig von Gerät, Browser und Wallet-Konfiguration im sicheren Stripe-Checkout angezeigt.</p>
    </main>
  );
}
