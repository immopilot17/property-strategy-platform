"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        setMessage(error ? error.message : "Registrierung erstellt. Bitte E-Mail bestätigen.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: { access_type: "offline", prompt: "consent" }
        }
      });
      if (error) setMessage(error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google-Anmeldung fehlgeschlagen.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button onClick={() => setMode("signin")} className={`rounded-lg px-3 py-2 font-bold ${mode === "signin" ? "bg-white shadow-sm" : ""}`}>Anmelden</button>
        <button onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2 font-bold ${mode === "signup" ? "bg-white shadow-sm" : ""}`}>Registrieren</button>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={signInWithGoogle}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-40"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.62A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.32-1.93V7.45H3.05A10 10 0 0 0 2 12c0 1.61.38 3.13 1.05 4.55l3.35-2.62Z" />
          <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.95 5.45l3.35 2.62C7.19 7.7 9.4 5.94 12 5.94Z" />
        </svg>
        Mit Google {mode === "signup" ? "registrieren" : "anmelden"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>oder mit E-Mail</span><span className="h-px flex-1 bg-slate-200" /></div>

      <label className="block">
        <span className="text-sm font-bold">E-Mail</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-bold">Passwort</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
      </label>
      <button
        type="button"
        disabled={loading || !email || password.length < 6}
        onClick={submit}
        className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-40"
      >
        {loading ? "Bitte warten…" : mode === "signin" ? "Anmelden" : "Konto erstellen"}
      </button>
      {message ? <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p> : null}
    </div>
  );
}
