# PROJ-5 — Technisches Design: Einfache Mahlzeiten

> Technische Umsetzung von `spec.md`. Mahlzeiten sind gemeinsame, nur lesbare Inhalte in der Datenbank – nach demselben Muster wie die Workouts aus PROJ-4. Im Prototyp kommen mindestens 15 Beispielmahlzeiten über eine Migration ins Projekt. Ob eine Mahlzeit passt, entscheidet eine reine Regel aus der Essensweise (PROJ-3). Es wird nichts Persönliches gespeichert.

## Komponentenstruktur

```text
Essen  /essen  (Bereich im App-Rahmen, nur mit vollständigen Angaben — Gate aus PROJ-3)
├── Kopfbereich „Essen“ mit kurzer Orientierung
├── Filter: Aufwand (Alle · Ohne Kochen · Schnell gekocht · Bis 20 Min)
├── Liste der Mahlzeiten-Karten (nur passende)
│   └── Karte: Titel · Aufwandsstufe · „X Min“ · Essensweise · ggf. „Beispielinhalt …“
└── Leer:
    ├── für den Filter nichts: ruhiger Hinweis + „Alle Aufwandsstufen anzeigen“
    └── für die Essensweise nichts: ruhiger Hinweis + „Zu Heute“

Mahlzeit-Detail  /essen/[id]
├── Kopfbereich: Titel (keine Hauptaktion)
├── ggf. „Beispielinhalt …“ · ggf. „Passt nicht zu deiner Essensweise“ (EC-3)
├── Eckdaten: Aufwandsstufe · Zubereitungszeit · Essensweise
├── Zutaten (Liste, Mengen für eine Person)
├── Zubereitung (nummerierte Schritte)
├── Hinweis „Noch einfacher: …“
├── Allergene: „Enthält: …“ oder „Enthält keines der 14 Hauptallergene.“ + Verpackungssatz
└── nicht vorhanden: „Diese Mahlzeit gibt es nicht (mehr)“ + „Zu Essen“
```

Beide Ansichten liegen im App-Rahmen von PROJ-2 und verwenden `PageHeader`, Lade- und Fehlerzustand sowie die Navigation unverändert. Essensweise und Aufwandsstufe stehen als Text, nicht nur als Farbe oder Symbol. Die Detailansicht hat keine Bedienelemente und braucht deshalb keinen Browser-Code.

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/meals/meals.rules.ts` | Reine Regeln: Typen für Mahlzeit, Essensweise der Mahlzeit, Aufwandsstufe und Allergen; Beschriftungen (Essensweise, Aufwandsstufe, „X Min“, Allergene); **Passt-Regel** aus Essensweise der Person und der Mahlzeit (AC-2); Aufwandsfilter (AC-3); Allergentext inkl. „keines“ (AC-7, EC-4). | `features/profile/profile.schema` (Typ und Werte der Essensweise der Person). |
| `src/features/meals/meals.data.ts` | `server-only`. Alle angebotenen Mahlzeiten lesen (sortiert); eine Mahlzeit per ID lesen oder „nicht vorhanden“. Wandelt Datenbankzeilen in die Typen der Regeln um; Zeilen, die nicht passen, werden ausgelassen. | `src/lib/supabase/server.ts`, Rules, Zod. |
| `src/features/meals/components/meal-list.tsx` | Client: Aufwandsfilter und Liste; filtert die vom Server gelieferten, bereits passenden Mahlzeiten sofort im Browser; beide Leerzustände (AC-1, AC-3, AC-4, AC-8). | shadcn `button`, `card`; `SampleContentBadge`; Rules. |
| `src/features/meals/components/meal-detail.tsx` | Server-Komponente: Detailansicht mit Eckdaten, Zutaten, Schritten, „Noch einfacher“, Allergenen, Prüfhinweis und ggf. „Passt nicht zu deiner Essensweise“ (AC-5 bis AC-8, EC-3, EC-4). | `components/shell/page-header`, shadcn `alert`; `SampleContentBadge`; Rules. |
| `src/components/content/sample-content-badge.tsx` | **Verschoben aus PROJ-4** (`src/features/workouts/components/sample-content-badge.tsx`): Hinweis „Beispielinhalt – noch nicht fachlich geprüft“ für ungeprüfte Inhalte. Nimmt den Prüfstatus `unreviewed` / `reviewed` entgegen; der Text liegt in diesem Baustein. | shadcn `badge`. Importiert nichts aus Features. |
| `src/app/(protected)/(bereiche)/essen/page.tsx` | Ersetzt den Platzhalter aus PROJ-2: lädt Mahlzeiten und Profilangaben (`requireCompletedProfile`), behält nur passende (Regel auf dem Server), übergibt an die Liste. | `features/meals`, `features/profile`. |
| `src/app/(protected)/(bereiche)/essen/[id]/page.tsx` | Detailseite; unbekannte oder nicht angebotene ID → `not-found` dieses Segments; berechnet „passt“ für EC-3. | `features/meals`, `features/profile`. |
| `src/app/(protected)/(bereiche)/essen/[id]/not-found.tsx` | „Diese Mahlzeit gibt es nicht (mehr)“ mit Link „Zu Essen“ (EC-2). | `page-header`, shadcn `button`. |

**Änderung an PROJ-4 durch die Verschiebung:** Liste, Detail und geführte Ansicht von Bewegung importieren den Hinweis vom neuen Ort; `SAMPLE_CONTENT_LABEL` wandert aus `workouts.rules.ts` in den Baustein; der bestehende Test des Hinweises zieht mit. Das Verhalten von PROJ-4 ändert sich nicht.

## Footprint

- **Code und Tests:** `src/features/meals/**` mit Tests neben den Modulen; zwei Seiten und eine `not-found.tsx` unter `src/app/(protected)/(bereiche)/essen/`; die Platzhalterseite `essen/page.tsx` wird ersetzt; `src/components/content/sample-content-badge.tsx` (verschoben) mit Test; Importe in `src/features/workouts/**` angepasst.
- **Migrationen, Tabellen und Zugriffsregeln:** `supabase/migrations/<Zeitstempel>_meals.sql` (Tabelle `meals`, Prüfregeln, Hilfsfunktion für Textlängen in Listen, RLS nur lesend) und `supabase/migrations/<Zeitstempel>_meals_sample_content.sql` (Beispielinhalte).
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** `/essen` (ersetzt Platzhalter), `/essen/[id]`; keine neuen Navigationseinträge; keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-2 | Passt-Regel exakt wie in der Spec. | Eine reine Funktion in `meals.rules.ts`, die der Server für jede Mahlzeit aufruft. | Unit-Test über alle 3 × 3 Kombinationen. |
| AC-3 | Filter wirkt sofort. | Alle passenden Mahlzeiten (≈ 15) werden einmal geladen; der Filter läuft im Browser ohne neue Anfrage. | UI-Test: Filter ändert die Liste ohne Server-Aufruf. |
| AC-3 | Aufwandsstufe und Minuten widersprechen sich nie. | Die Datenbank erlaubt „Ohne Kochen“ und „Schnell gekocht“ nur mit 1–10 Minuten, „Bis 20 Min“ nur mit 11–20 Minuten. | Prüfung der Regel gegen die lokale Datenbank (ein ungültiger Eintrag wird abgelehnt). |
| AC-7, EC-4 | Allergenangabe fehlt nie stillschweigend. | Pflichtfeld ohne Standardwert; eine leere Liste bedeutet ausdrücklich „keines“ und wird als „Enthält keines der 14 Hauptallergene.“ angezeigt. | Unit-Test des Allergentextes; UI-Test beider Fälle. |
| AC-9 | Mindestumfang und Grenzen der Beispielinhalte. | Die Inhalts-Migration enthält die geforderte Abdeckung; Grenzen (≤ 6 Zutaten, ≤ 5 Schritte) setzt die Datenbank durch. | Test, der die Abdeckung gegen die lokale Datenbank zählt. |
| AC-10 | Inhalte für Nutzende nur lesbar. | RLS erlaubt angemeldeten Personen nur das Lesen angebotener Mahlzeiten; Anlegen, Ändern, Löschen sind für `anon` und `authenticated` entzogen. | Live-Prüfung über die öffentliche Schnittstelle mit Schreibversuchen. |
| EC-1 | Liste folgt geänderter Essensweise. | Die Seite wird bei jedem Aufruf auf dem Server neu berechnet (keine Zwischenspeicherung). | Live-Prüfung: Essensweise ändern, Liste neu laden. |

**Fehler an den Schnittstellen:**
- **Mahlzeiten können nicht geladen werden:** Die Seite wirft; die Fehlergrenze aus PROJ-2 zeigt „Da ist etwas schiefgelaufen“ mit „Erneut versuchen“.
- **Unbekannte, ungültige oder nicht mehr angebotene ID:** `notFound()` → eigene Ansicht „Diese Mahlzeit gibt es nicht (mehr)“ (EC-2), kein Fehlerprotokoll. Wie bei PROJ-4 antwortet sie wegen des vorab gesendeten Ladezustands mit Status 200.
- **Datenbankzeile, die nicht zu den Regeln passt:** wird ausgelassen statt die Ansicht zu brechen (Datenbank-Prüfregeln machen das praktisch unmöglich).

## Datenmodell

Eine Tabelle gemeinsamer Inhalte. Sie gehört niemandem persönlich, enthält keine personenbezogenen Daten und wird vom Team über Migrationen gepflegt.

**Mahlzeit `meals`**
- `id` — Text, Kurzname wie `hummus_brot`, Kleinbuchstaben/Ziffern/Unterstrich, 3–40 Zeichen, Primärschlüssel; erscheint in der Adresse.
- `title` — Text, 2–60 Zeichen, Pflicht.
- `diet` — Text, genau `vegan` („vegan“), `vegetarian` („vegetarisch“) oder `meat_fish` („mit Fleisch oder Fisch“).
- `effort` — Text, genau `no_cook` („Ohne Kochen“), `quick` („Schnell gekocht“) oder `up_to_20` („Bis 20 Min“).
- `minutes` — ganze Zahl; bei `no_cook` und `quick` 1–10, bei `up_to_20` 11–20.
- `ingredients` — Liste von Texten, 1–6 Einträge, je 2–80 Zeichen, eine Zeile mit Menge und Zutat für eine Person (z. B. „1 Dose Kichererbsen (400 g)“); keine Doppelten.
- `steps` — Liste von Texten, 1–5 Einträge, je 5–200 Zeichen (höchstens zwei kurze Sätze), in Reihenfolge.
- `easier_hint` — Text, 10–200 Zeichen, Pflicht; der Satz nach „Noch einfacher:“.
- `allergens` — Liste von Texten, Pflicht **ohne Standardwert**, darf leer sein (= keines der 14 Hauptallergene); nur Werte aus `gluten` („Gluten“), `crustaceans` („Krebstiere“), `eggs` („Eier“), `fish` („Fisch“), `peanuts` („Erdnüsse“), `soy` („Soja“), `milk` („Milch“), `nuts` („Schalenfrüchte“), `celery` („Sellerie“), `mustard` („Senf“), `sesame` („Sesam“), `sulphites` („Sulfite“), `lupin` („Lupinen“), `molluscs` („Weichtiere“); keine Doppelten.
- **Stimmigkeit Essensweise ↔ Allergene:** eine vegane Mahlzeit enthält weder `milk`, `eggs`, `fish`, `crustaceans` noch `molluscs`; eine vegetarische weder `fish`, `crustaceans` noch `molluscs`. Die Datenbank lehnt Widersprüche ab.
- `review_status` — Text, genau `unreviewed` oder `reviewed`; Standard `unreviewed`.
- `is_offered` — Wahrheitswert, Standard wahr; nicht angebotene Mahlzeiten sind unsichtbar (EC-2).
- `sort_order` — ganze Zahl ≥ 0, bestimmt die Reihenfolge in der Liste.
- `created_at`, `updated_at` — Zeitpunkte; `updated_at` wird bei Änderungen automatisch gesetzt (bestehende Hilfsfunktion).

Für die Längenprüfung einzelner Listeneinträge kommt eine kleine Hilfsfunktion neben die bestehende `private.array_is_distinct` (Prüfregeln dürfen keine Unterabfragen enthalten).

**Passt-Regel (AC-2)**, für die Essensweise der Person aus PROJ-3:
- `omnivore` („Ich esse alles“) → `vegan`, `vegetarian`, `meat_fish`
- `vegetarian` → `vegan`, `vegetarian`
- `vegan` → `vegan`

**Zugriff:** Lesen dürfen nur angemeldete Personen, und nur Einträge mit `is_offered = wahr`. Anlegen, Ändern und Löschen sind für `anon` und `authenticated` nicht erlaubt. Nicht angemeldete Besucher lesen nichts.

**Aufbewahrung:** Inhalte bleiben, bis das Team sie über eine neue Migration ändert oder aus dem Angebot nimmt (`is_offered = falsch`). Personenbezogene Daten entstehen nicht; die Essensweise wird nur gelesen.

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Übersicht laden | Angemeldet, Angaben vollständig (Gate PROJ-3). Liest alle angebotenen Mahlzeiten in einer Abfrage, dazu die eigene Essensweise. | Nur passende Mahlzeiten, sortiert nach `sort_order`; Aufwandsfilter im Browser. | AC-1 bis AC-4, AC-8, EC-1 |
| Detail laden | Wie oben, eine Mahlzeit per ID, dazu die eigene Essensweise. | Detailansicht – bei nicht passender Essensweise mit Hinweis – oder „gibt es nicht (mehr)“. | AC-5 bis AC-8, EC-2 bis EC-4 |
| Inhalte ändern | Niemand über die App; das Team über eine neue Migration. | Direkte Schreibanfragen werden von der Datenbank abgelehnt. | AC-10 |

## Beispielinhalte (Prototyp)

Die Inhalts-Migration legt mindestens 15 Mahlzeiten mit `review_status = unreviewed` an. Abdeckung (AC-9): in jeder Aufwandsstufe mindestens eine vegane; insgesamt mindestens drei vegetarische (nicht vegane) und mindestens drei mit Fleisch oder Fisch. Je Mahlzeit höchstens 6 Zutaten aus dem normalen Supermarkt, höchstens 5 Schritte, ein „Noch einfacher“-Hinweis und Allergenangaben. Die Inhalte sind allgemein gehalten, ohne Gesundheitsversprechen und ohne Wertung (Nährwerte ergänzt PROJ-12 mit eigener Migration); sie tragen in der App den Hinweis „Beispielinhalt – noch nicht fachlich geprüft“.

## Abhängigkeiten

- `@supabase/ssr` (vorhanden).
- shadcn `badge`, `card`, `button`, `alert` (vorhanden).
- Bausteine aus PROJ-2 (`page-header`, App-Rahmen, Lade- und Fehlerzustand) und Daten aus PROJ-3 (`requireCompletedProfile`, Werte der Essensweise).
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Mahlzeiten als Tabelle in Postgres, Pflege über Migrationen | Gleiches Muster wie PROJ-4; PROJ-6 kann per Fremdschlüssel auf eine Mahlzeit verweisen; Migrationen erreichen später auch die Produktion. | Inhalte als Daten-Datei im Code | Jede inhaltliche Änderung braucht eine neue Migration, bis es eine Redaktionsoberfläche gibt. | 2026-11-13 |
| Eine Tabelle; Zutaten und Schritte als Textlisten an der Mahlzeit | Eine Zutat ist im Prototyp nur eine Zeile mit Menge; Grenzen (≤ 6, ≤ 5) setzt die Datenbank direkt durch; eine Abfrage lädt alles. | Eigene Tabellen für Zutaten und Schritte | Keine strukturierte Menge/Einheit je Zutat; Einkaufslisten oder Tauschtipps bräuchten später eine Schemaänderung. | 2026-11-13 |
| Allergene als Codes der 14 EU-Hauptallergene, Pflicht ohne Standardwert | „Keines“ ist eine bewusste Angabe statt einer vergessenen (EC-4); feste Codes erlauben einheitliche Beschriftung. | Freitext „Enthält …“ | Weitere Unverträglichkeiten (z. B. Fruktose) sind nicht abbildbar – gewollt, siehe Spec. | 2026-11-13 |
| Datenbank prüft Essensweise gegen Allergene | Ein Inhaltsfehler wie „vegan mit Milch“ wird beim Einspielen abgelehnt, nicht erst von Nutzenden entdeckt. | Nur fachliche Prüfung | Prüft nur offensichtliche Widersprüche, keine Zutatenlisten. | 2026-11-13 |
| Passt-Regel als reine Funktion, auf dem Server ausgewertet; nur passende Mahlzeiten gehen an den Browser | Nachvollziehbar und testbar; PROJ-6 kann dieselbe Funktion nutzen; ohne „Alle anzeigen“ braucht der Browser keine unpassenden Mahlzeiten. | Regel in der Datenbankabfrage | Alle angebotenen Mahlzeiten werden geladen und in der App gefiltert; bei sehr vielen Inhalten müsste das in die Abfrage wandern. | 2026-11-13 |
| Aufwandsfilter im Browser | Wirkt sofort ohne Seitenwechsel (AC-3); kleine Datenmenge. | Filter als Adressparameter | Filterzustand geht beim Neuladen verloren. | 2026-11-13 |
| Detailansicht als Server-Komponente | Keine Bedienelemente, also kein Browser-Code nötig; weniger JavaScript. | Client-Komponente wie bei PROJ-4 | Spätere Interaktion (z. B. Favoriten) braucht einen kleinen Client-Teil. | 2026-11-13 |
| Hinweis „Beispielinhalt“ wird ein gemeinsamer Baustein (`src/components/content/`) | Jetzt gibt es zwei Nutzer (Bewegung und Essen); ein Feature soll nicht die Komponente eines anderen importieren. | Import aus `features/workouts` | Kleine Änderung an PROJ-4-Dateien (nur Importe und Ort, kein Verhalten). | 2026-11-13 |
| Vor dem Deploy: Lesen nur noch für `reviewed`-Mahlzeiten | PRD: ungeprüfte Inhalte nicht öffentlich. Eigene Migration vor dem ersten Deploy, gemeinsam mit der für PROJ-4. | Schon jetzt filtern | Im Prototyp sind ungeprüfte Inhalte sichtbar (mit Hinweis). | 2026-11-13 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: Migration, die das Lesen auf `review_status = reviewed` beschränkt, und fachliche Prüfung aller Inhalte (siehe `spec.md`).

## Umsetzungsnotizen (`/build`, 2026-11-13)

- **Beispielinhalte:** 17 Mahlzeiten, je drei vegane pro Aufwandsstufe, vier vegetarische und vier mit Fleisch oder Fisch; zwei ohne Hauptallergene. Allergenangaben für Gemüsebrühe (Sellerie), Sojasoße (Soja, Gluten), Hummus (Sesam) und Senf beruhen auf typischen Supermarktprodukten und gehören zur fachlichen Prüfung vor dem Deploy.
- **Hilfsfunktion:** `private.array_lengths_between` prüft die Länge jedes Eintrags von Zutaten und Schritten, weil Prüfregeln keine Unterabfragen enthalten dürfen.
- **Leerzustand ohne passende Mahlzeit:** Ohne passende Mahlzeit entfällt auch der Aufwandsfilter; es bleibt der Hinweis „Zu deiner Essensweise gibt es gerade keine Mahlzeit.“ mit „Zu Heute“.
- **Kopfbereich „Essen“:** Orientierung „Einfache Mahlzeiten, die zu deiner Essensweise passen.“
- **Status der Seite „gibt es nicht (mehr)“:** wie bei PROJ-4 HTTP 200 statt 404, weil der Ladezustand vorab gesendet wird.
