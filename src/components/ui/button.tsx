import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-teal text-white shadow-soft hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400",
  secondary: "border border-slate-300 bg-white text-ink hover:border-teal hover:text-teal dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-teal-300 dark:hover:text-teal-200",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-ink dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
  danger: "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base"
};

export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return clsx("inline-flex items-center justify-center gap-2 rounded-xl font-bold transition focus-visible:outline-none disabled:opacity-45", variants[variant], sizes[size], className);
}

export function ButtonLink({ href, children, variant, size, className }: { href: string; children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  return <Link href={href} className={buttonStyles({ variant, size, className })}>{children}</Link>;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
