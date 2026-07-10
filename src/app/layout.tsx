import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Strategy Platform",
  description: "Deine persönliche Strategie für den Immobilienkauf."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
