# UI-System

Die Oberfläche folgt vier verbindlichen Mustern:

- **Eine Hauptaufgabe:** Jeder Einstieg und Wizard-Schritt besitzt genau eine dominante Aktion.
- **Progressive Disclosure:** Detailannahmen, Fachauswertungen und Premium-Funktionen starten eingeklappt.
- **Entscheidung zuerst:** Ergebnisse zeigen Status, Zusammenfassung, Empfehlung und drei Kernzahlen vor allen Details.
- **Nachvollziehbare KI:** Datenquelle, Aktualität, Vertrauensniveau, Fakten, Annahmen und Interpretation werden getrennt dargestellt.

Wiederverwendbare Bausteine liegen unter `src/components/ui`. Farben, Abstände, Fokuszustände, Dark Mode und reduzierte Animationen werden zentral über Tailwind und `src/app/globals.css` gesteuert.
