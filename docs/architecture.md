# Architektur

## Schichten
1. Presentation Layer: Next.js App Router
2. Application Layer: Use Cases und Orchestrator
3. Domain Layer: Berechnungen und Entscheidungsregeln
4. Infrastructure Layer: Supabase, Payment, KI, Karten, externe Daten

## Agenten
- Financing Agent
- Property Agent
- Funding Agent
- Tax Agent
- Location Agent
- Risk Agent
- Recommendation Agent

## Kostenregel
1. Cache
2. Datenbank
3. deterministische Berechnung
4. regelbasierte Entscheidung
5. kleine KI
6. großes Modell nur für komplexe Synthese

## Skalierung
Die erste Version ist für 1.000–10.000 Nutzer ausgelegt. Rechenintensive Dienste werden später separat skaliert.
