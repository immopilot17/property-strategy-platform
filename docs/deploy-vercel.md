Ver deploy auf Vercel (Kurzleitfaden)

Ziel
- Die App ausschließlich über Vercel betreiben (Preview + Production). Lokale Dev-Server werden gestoppt.

Schritte
1) Repository verbinden
   - In Vercel einloggen → New Project → Import Git Repository (immopilot17/property-strategy-platform)
   - Branch auswählen (z.B. main)

2) Build & Run Einstellungen
   - Framework Preset: Next.js
   - Build Command: npm run build
   - Output Directory: .next
   - Install Command: npm ci (oder npm install)

3) Environment-Variablen (wichtig)
   - NEXT_PUBLIC_SUPABASE_URL = https://... (Supabase Projekt-URL)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_xxx
   - SUPABASE_SERVICE_ROLE_KEY (optional, für serverseitige Admin-Tasks) — nicht öffentlich freigeben
   - NEXT_PUBLIC_APP_URL = https://your-vercel-domain.vercel.app (optional)
   - OPENAI_API_KEY (optional)
   - STRIPE_SECRET_KEY, PAYPAL_* (optional)
   - CRON_SECRET (optional, falls Cron-Funktionen geplant)

   Hinweis: Trage diese Werte im Vercel Dashboard unter Settings → Environment Variables ein. Lege sie für Preview und Production entsprechend an.

4) Storage & Buckets
   - Supabase Storage: Stelle sicher, dass der Bucket "documents" existiert (wird von /api/upload erwartet).

5) Domains & Redirects
   - Optional eigene Domain in Vercel konfigurieren.

6) Secrets & Sicherheit
   - Verwende nur die Service-Role-Key in serverseitigen Contexts. Niemals Service-Role-Key im Browser.
   - Aktivere Vercel Environment Protection (Production only) falls verfügbar.

7) Testing nach Deployment
   - Nach Deploy: /login → Registrierung / Anmeldung testen → /dashboard/properties testen (Property anlegen)
   - Prüfe Sentry (falls konfiguriert) und Supabase Logs für Fehler

8) Pause der lokalen Arbeit
   - Lokaler Dev-Server wurde gestoppt. Weiterentwicklung pausiert, bis du wieder Arbeit anforderst.

Troubleshooting
- 401 Unauthorized bei API-Requests: Prüfe, ob Auth-Session-Cookies korrekt gesetzt werden (Client-Flow: /login). Serverseitige Endpunkte erwarten eine Supabase-Session aus Cookies.
- Signed Upload errors: Prüfe, ob der Bucket-Name "documents" existiert und die Storage-Policies korrekt sind.

Kontakt / Nächste Schritte
- Wenn du möchtest, kann ich:
  - die Vercel-Umgebung konfigurieren (sofern du mir Zugang gibst), oder
  - nach dem ersten erfolgreichen Deploy Smoke-Tests (E2E) ausführen.

(Erstellt automatisch vom lokalen Scaffolding-Task.)
