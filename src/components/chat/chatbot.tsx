"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { readLocalAnalyses } from "@/lib/storage/analyses";

type Message = { role: "user" | "assistant"; content: string };

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Hallo! Ich helfe dir bei Fragen zur Immobilienanalyse, Finanzierung, Förderung und steuerlichen Orientierung." }]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const latestAnalysis = readLocalAnalyses()[0];
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, analysis: latestAnalysis ? { input: latestAnalysis.input, result: latestAnalysis.result } : undefined }) });
      const data = await response.json() as { answer?: string; message?: string };
      setMessages((current) => [...current, { role: "assistant", content: data.answer ?? data.message ?? "Keine Antwort verfügbar." }]);
    } catch { setMessages((current) => [...current, { role: "assistant", content: "Der Assistent ist gerade nicht erreichbar." }]); }
    finally { setLoading(false); }
  }

  return <div className="fixed bottom-5 right-5 z-[60]">
    {open ? <section className="mb-3 flex h-[min(560px,75vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white"><div><p className="font-bold">Analyse-Assistent</p><p className="text-xs text-slate-300">Unverbindliche Orientierung</p></div><button onClick={() => setOpen(false)} aria-label="Chat schließen"><X size={20} /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((message, index) => <p key={index} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"}`}>{message.content}</p>)}{loading ? <p className="text-sm text-slate-500">Antwort wird erstellt…</p> : null}</div>
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} aria-label="Frage" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600" /><button disabled={loading || !input.trim()} className="rounded-xl bg-emerald-600 p-3 text-white disabled:opacity-40" aria-label="Senden"><Send size={18} /></button></form>
    </section> : null}
    <button onClick={() => setOpen((value) => !value)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl" aria-label="Analyse-Assistent öffnen"><MessageCircle /></button>
  </div>;
}
