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
  description: "Anfängerfreundliche Immobilienentscheidungen mit transparenten Berechnungen, Förderinformationen und nachvollziehbaren KI-Erklärungen."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        {children}
        <Chatbot />
        <SiteFooter />
      </body>
    </html>
  );
}
