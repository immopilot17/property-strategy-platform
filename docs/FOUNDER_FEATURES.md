# Gründer-Features Dokumentation

Diese Dokumentation beschreibt die Implementierung und Verwendung des Gründer-Tiers auf der ImmoPilot-Plattform.

## Überblick

Das Gründer-Tier bietet:

- ✅ **Unbegrenzte Analysen** - Keine Limits bei der Nutzung
- ✅ **Alle Features kostenlos** - Voller Zugriff auf alle Plattform-Features
- ✅ **Prioritärer Support** - Dedizierte Unterstützung
- ✅ **Beta-Features** - Früher Zugriff auf neue Funktionen
- ✅ **Admin-Dashboard** - Verwaltung der Plattform
- ✅ **Export und Reports** - Unbegrenzte Exporte

## Datenbankänderungen

### Migration: `20260714_founder_tier.sql`

Die Migration fügt folgende Komponenten hinzu:

1. **`founder_users` Tabelle** - Verzeichnis aller verifizierten Gründer
2. **`user_tier` Spalte** - Neue Spalte in `profiles` für Tier-Verwaltung
3. **`is_unlimited` Spalte** - Credit-Unlimited-Flag
4. **RLS Policies** - Row-Level Security für Gründer-Daten
5. **PL/pgSQL Funktionen**:
   - `grant_founder_status()` - Gründer-Status verleihen
   - `is_founder()` - Gründer-Status überprüfen
   - `get_user_tier()` - Benutzer-Tier auslesen
   - `has_analysis_credits()` - Überprüfung mit Gründer-Logik

## API Endpoints

### POST `/api/admin/founder-status`

Gründer-Status für einen Benutzer verleihen.

**Header:**
```
Authorization: Bearer YOUR_ADMIN_SECRET_KEY
```

**Body:**
```json
{
  "email": "founder@example.com",
  "name": "Founder Name"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Founder status granted to founder@example.com",
  "email": "founder@example.com",
  "name": "Founder Name"
}
```

### GET `/api/admin/founder-status`

Liste alle Gründer auf oder überprüfe einen bestimmten Benutzer.

**Header:**
```
Authorization: Bearer YOUR_ADMIN_SECRET_KEY
```

**Query Parameter (optional):**
- `userId` - UUID des Benutzers zur Überprüfung

**Response - Liste aller Gründer (200):**
```json
{
  "success": true,
  "count": 2,
  "founders": [
    {
      "id": "uuid-1",
      "email": "founder1@example.com",
      "name": "Founder One",
      "verified_at": "2026-07-14T00:00:00Z"
    },
    {
      "id": "uuid-2",
      "email": "founder2@example.com",
      "name": "Founder Two",
      "verified_at": "2026-07-14T01:00:00Z"
    }
  ]
}
```

**Response - Einzelnen Benutzer überprüfen (200):**
```json
{
  "userId": "user-uuid",
  "isFounder": true
}
```

### DELETE `/api/admin/founder-status`

Gründer-Status von einem Benutzer entfernen.

**Header:**
```
Authorization: Bearer YOUR_ADMIN_SECRET_KEY
```

**Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Founder status removed",
  "userId": "user-uuid"
}
```

## TypeScript Utilities

Datei: `src/lib/supabase/founder.ts`

### Verfügbare Funktionen

```typescript
import {
  grantFounderStatus,
  isFounder,
  getUserTier,
  hasAnalysisCredits,
  getFounderBenefits,
  listFounders,
  removeFounderStatus
} from '@/lib/supabase/founder';

// Gründer-Status verleihen (Admin)
await grantFounderStatus('founder@example.com', 'Founder Name');

// Überprüfen, ob Benutzer Gründer ist
const isUserFounder = await isFounder('user-uuid');

// Benutzer-Tier auslesen (returns: 'free' | 'starter' | 'plus' | 'pro' | 'premium' | 'founder')
const tier = await getUserTier('user-uuid');

// Überprüfen, ob Benutzer Credits hat (Gründer haben immer unbegrenzte)
const hasCredits = await hasAnalysisCredits('user-uuid', 5);

// Gründer-Vorteile abrufen
const benefits = await getFounderBenefits('user-uuid');

// Alle Gründer auflisten (Admin)
const founders = await listFounders();

// Gründer-Status entfernen (Admin)
await removeFounderStatus('user-uuid');
```

## React Komponenten

Datei: `src/components/founder/founder-badge.tsx`

### Verfügbare Komponenten

```typescript
import {
  FounderBadge,
  FounderBenefitsBanner,
  AccessTierIndicator,
  TierFeatures
} from '@/components/founder/founder-badge';

// Gründer-Badge anzeigen
<FounderBadge isFounder={true} />

// Mit Icon nur (kein Text)
<FounderBadge isFounder={true} showText={false} />

// Gründer-Vorteile Banner
<FounderBenefitsBanner />

// Tier-Indikator
<AccessTierIndicator tier="founder" />

// Tier-Features auflisten
<TierFeatures tier="founder" />
```

## Setup & Verwendung

### 1. Environment Variable setzen

Füge in `.env.local` hinzu:

```
ADMIN_SECRET_KEY=your-secret-admin-key-here
```

### 2. Migration zu Supabase pushen

```bash
supabase db push
```

Oder manuell:
- Gehe zu Supabase Dashboard
- Kopiere den Inhalt von `supabase/migrations/20260714_founder_tier.sql`
- Führe den SQL-Code in der SQL Editor durch

### 3. Gründer-Status verleihen

**Option A: Über Script**
```bash
npx ts-node scripts/grant-founder-status.ts "founder@example.com" "Your Name"
```

**Option B: API Call**
```bash
curl -X POST http://localhost:3000/api/admin/founder-status \
  -H "Authorization: Bearer your-admin-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@example.com",
    "name": "Your Name"
  }'
```

**Option C: Über TypeScript**
```typescript
import { grantFounderStatus } from '@/lib/supabase/founder';

await grantFounderStatus('founder@example.com', 'Your Name');
```

### 4. Gründer-Status überprüfen

```bash
curl -X GET "http://localhost:3000/api/admin/founder-status?userId=user-uuid" \
  -H "Authorization: Bearer your-admin-secret-key"
```

## Frontend-Integration

### Gründer-Badge im Header anzeigen

```typescript
import { FounderBadge } from '@/components/founder/founder-badge';
import { isFounder } from '@/lib/supabase/founder';

export async function UserProfile() {
  const user = useUser();
  const isUserFounder = await isFounder(user.id);
  
  return (
    <div className="flex items-center gap-2">
      <span>{user.name}</span>
      <FounderBadge isFounder={isUserFounder} />
    </div>
  );
}
```

### Gründer-spezifische Features anzeigen

```typescript
import { getUserTier } from '@/lib/supabase/founder';
import { hasTier } from '@/features/payments/packages';

export async function Dashboard() {
  const user = useUser();
  const tier = await getUserTier(user.id);
  
  return (
    <div>
      {hasTier(tier, 'founder') && (
        <div>
          {/* Nur Gründer sehen dies */}
          <AdminPanel />
          <BetaFeatures />
        </div>
      )}
    </div>
  );
}
```

## Payment Integration

Die Payment-Packages wurden aktualisiert, um das Gründer-Tier zu unterstützen:

```typescript
import { getPaymentPackage, hasTier } from '@/features/payments/packages';

// Gründer-Paket abrufen
const founderPackage = getPaymentPackage('founder');

// Überprüfen, ob Benutzer ein bestimmtes Tier hat
const hasFounderAccess = hasTier(currentTier, 'founder');
```

## Credit-System

Das Credit-System wurde aktualisiert, um Gründer automatisch unbegrenzte Credits zu geben:

- **Nicht-Gründer**: `has_analysis_credits()` überprüft echte Gutschriften
- **Gründer**: `has_analysis_credits()` gibt immer `true` zurück

Der `is_unlimited` Flag wird automatisch gesetzt, wenn Gründer-Status verliehen wird.

## Sicherheit

- Admin-APIs sind durch `ADMIN_SECRET_KEY` geschützt
- RLS Policies verhindern unbefugte Zugriffe
- PL/pgSQL Funktionen mit `security definer` für sichere Operationen
- Alle Admin-Operationen werden protokolliert

## Troubleshooting

### Problem: "Invalid admin secret"

**Lösung:** Stelle sicher, dass `ADMIN_SECRET_KEY` in `.env.local` gesetzt ist und der Authorization Header den korrekten Wert enthält.

### Problem: "User not found"

**Lösung:** Der Benutzer muss sich zuerst registriert und angemeldet haben, damit sein Konto in der Auth-Tabelle existiert.

### Problem: Migration schlägt fehl

**Lösung:** Stelle sicher, dass die Supabase-Verbindung funktioniert und die vorherigen Migrations erfolgreich angewendet wurden.

## Nächste Schritte

1. **Tests schreiben** - Unit Tests für Founder-Funktionen
2. **Admin-Dashboard** - UI zum Verwalten von Gründern
3. **Audit-Logging** - Protokollierung aller Gründer-Operationen
4. **Email-Notifications** - Benachrichtigungen wenn Gründer-Status verliehen/entfernt wird
5. **Analytics** - Tracking von Gründer-Aktivitäten
