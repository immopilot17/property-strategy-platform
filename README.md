# Property Strategy Platform

Eigenständige KI-gestützte Immobilien-Strategieplattform für Erstkäufer und private Investoren.

## Kernnutzen
Die Plattform zeigt Nutzern nicht nur, ob eine Immobilie finanzierbar ist, sondern entwickelt mehrere realistische Kaufstrategien inklusive Finanzierung, Förderung, Steuerhinweisen, Lage, Risiken und nächsten Schritten.

## Stack
- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + Storage
- Stripe / später PayPal
- regelbasierte Analyse-Engine
- KI nur für hochwertige Erklärung und Empfehlung

## Start
1. `.env.example` nach `.env.local` kopieren
2. Supabase-Projekt erstellen
3. `supabase/schema.sql` ausführen
4. `npm install`
5. `npm run dev`

## Architekturprinzipien
- Alle Zahlen werden deterministisch berechnet
- KI erklärt, priorisiert und empfiehlt
- Jede Empfehlung trennt Fakten, Annahmen und Prognosen
- RLS schützt Nutzerdaten
- Agenten sind als Services organisiert und später erweiterbar
