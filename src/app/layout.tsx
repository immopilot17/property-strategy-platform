import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Chatbot } from "@/components/chat/chatbot";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: {
    default: "Property Strategy Platform",
    template: "%s | Property Strategy Platform"
  },
  description: "Anfängerfreundliche Immobilienentscheidungen mit transparenten Berechnungen, Förderinformationen und nachvollziehbaren KI-Erklärungen.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem("property-strategy-theme");
    const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();`
          }}
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[80] rounded-xl bg-white px-4 py-3 font-bold text-ink shadow-lg focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-teal-200 dark:bg-slate-900 dark:text-white dark:focus:ring-teal-900"
        >
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Chatbot />
        <SiteFooter />
      </body>
    </html>
  );
}
