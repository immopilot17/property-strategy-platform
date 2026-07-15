"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { readLocalAnalyses } from "@/lib/storage/analyses";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Erkläre mir meine Finanzierung einfach.",
  "Welche Risiken sollte ich zuerst prüfen?",
  "Welche Angaben fehlen für Förderungen?"
];

export function Chatbot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const isAnalysisPage = pathname.startsWith("/analyse");

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function ask(content: string) {
    const question = content.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const latestAnalysis = readLocalAnalyses()[0];
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          analysis: latestAnalysis ? { input: latestAnalysis.input, result: latestAnalysis.result } : undefined
        })
      });
      const data = await response.json() as { answer?: string; message?: string };
      setMessages((current) => [...current, { role: "assistant", content: data.answer ?? data.message ?? "Dazu ist gerade keine Erklärung verfügbar." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Der Analyse-Assistent ist gerade nicht erreichbar. Deine gespeicherten Berechnungen bleiben erhalten." }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className={`fixed inset-x-3 z-[60] pointer-events-none print:hidden sm:inset-x-auto sm:right-5 ${isAnalysisPage ? "bottom-24 sm:bottom-5" : "bottom-3 sm:bottom-5"}`}>
      {open ? (
        <section role="dialog" aria-modal="true" aria-labelledby="assistant-title" className={`pointer-events-auto mb-3 flex w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-[400px] ${isAnalysisPage ? "h-[min(540px,calc(100svh-10rem))]" : "h-[min(620px,calc(100svh-6rem))]"}`}>
          <header className="flex items-center justify-between gap-4 bg-ink px-5 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal text-white"><Bot size={21} aria-hidden="true" /></span>
              <div className="min-w-0"><h2 id="assistant-title" className="truncate font-bold">Analyse-Assistent</h2><p className="truncate text-xs text-slate-300">Erklärt konkrete Entscheidungen</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Assistent schließen"><X size={20} aria-hidden="true" /></button>
          </header>

          <div ref={messageListRef} className="flex-1 overflow-y-auto p-4" aria-live="polite">
            {!messages.length ? (
              <div>
                <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white"><Sparkles size={17} className="text-teal" aria-hidden="true" />Wobei brauchst du Hilfe?</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Ich erkläre Finanzierung, Risiken, Förderungen oder Steuern anhand deiner letzten gespeicherten Analyse.</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void ask(suggestion)} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold leading-5 text-slate-700 transition hover:border-teal hover:text-teal dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-200">{suggestion}</button>)}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-teal px-4 py-3 text-sm leading-6 text-white" : "max-w-[92%] rounded-2xl rounded-bl-md bg-cloud px-4 py-3 text-sm leading-6 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}>{message.content}</div>
                ))}
                {loading ? <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-teal" />Erklärung wird erstellt …</p> : null}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 p-3 dark:border-slate-700">
            <div className="flex gap-2">
              <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} aria-label="Frage zur Analyse" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-4 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950" />
              <button disabled={loading || !input.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal text-white transition hover:bg-teal-800 disabled:opacity-40 dark:bg-teal-500 dark:text-slate-950" aria-label="Frage senden"><Send size={18} aria-hidden="true" /></button>
            </div>
            <p className="mt-2 px-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">KI-Interpretation · Zahlen stammen aus der Berechnung · Keine Beratung</p>
          </form>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="pointer-events-auto ml-auto flex min-h-14 items-center gap-2 rounded-full bg-teal px-4 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-800 focus-visible:outline-none dark:bg-teal-500 dark:text-slate-950" aria-label={open ? "Analyse-Assistent schließen" : "Analyse-Assistent öffnen"}><MessageCircle size={22} aria-hidden="true" /><span className="text-sm font-bold sm:hidden">Frage stellen</span></button>
    </div>
  );
}
