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

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button onClick={() => setMode("signin")} className={`rounded-lg px-3 py-2 font-bold ${mode === "signin" ? "bg-white shadow-sm" : ""}`}>Anmelden</button>
        <button onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2 font-bold ${mode === "signup" ? "bg-white shadow-sm" : ""}`}>Registrieren</button>
      </div>

      <label className="mt-6 block">
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
