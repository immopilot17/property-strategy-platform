"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("property-strategy-theme");
    const enabled = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", enabled);
    setDark(enabled);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("property-strategy-theme", next ? "dark" : "light");
  }

  return (
    <button type="button" onClick={toggleTheme} aria-label={dark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"} aria-pressed={dark} className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
      {mounted && dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>
  );
}
