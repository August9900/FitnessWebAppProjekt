# PROJ-5 — Aufgaben: Einfache Mahlzeiten

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration: Tabelle `meals` mit Prüfregeln (Kurzname, Textlängen, Essensweise, Aufwandsstufe mit passenden Minuten, 1–6 Zutaten und 1–5 Schritte mit Längen je Eintrag, „Noch einfacher“-Hinweis, Allergencodes ohne Standardwert und ohne Doppelte, Stimmigkeit Essensweise ↔ Allergene, Prüfstatus, Angebot, Reihenfolge), Hilfsfunktion für Textlängen in Listen, `updated_at`-Pflege, Index für die Reihenfolge angebotener Mahlzeiten; RLS: angemeldete Personen lesen nur angebotene Mahlzeiten; Anlegen, Ändern, Löschen für `anon` und `authenticated` entzogen; gegen die lokale Datenbank angewendet und mit einem ungültigen Eintrag geprüft. · files: `supabase/migrations/20261113120000_meals.sql` · → AC-3, AC-7, AC-10; EC-2, EC-4
- [x] T2 [P] Reine Mahlzeiten-Regeln: Typen für Mahlzeit, Essensweise der Mahlzeit, Aufwandsstufe und Allergen; Beschriftungen (Essensweise, Aufwandsstufe, „X Min“, 14 Allergene); Passt-Regel aus Essensweise der Person und der Mahlzeit; Aufwandsfilter; Allergentext „Enthält: …“ bzw. „Enthält keines der 14 Hauptallergene.“; mit Test über alle Kombinationen. · files: `src/features/meals/meals.rules.ts`, `src/features/meals/meals.rules.test.ts` · → AC-1, AC-2, AC-3, AC-5, AC-7; EC-3, EC-4
- [x] T3 [P] Gemeinsamer Hinweis „Beispielinhalt – noch nicht fachlich geprüft“ für ungeprüfte Inhalte, nichts für geprüfte; mit Test. · files: `src/components/content/sample-content-badge.tsx`, `src/components/content/sample-content-badge.test.tsx` · → AC-8

## Stufe 2 — Inhalte, Datenzugriff, Umstellung PROJ-4

- [ ] T4 [P] Beispielinhalte: mindestens 15 Mahlzeiten mit `review_status = unreviewed`; in jeder Aufwandsstufe mindestens eine vegane, insgesamt mindestens drei vegetarische (nicht vegane) und drei mit Fleisch oder Fisch; je höchstens 6 Zutaten aus dem normalen Supermarkt, höchstens 5 Schritte, „Noch einfacher“-Hinweis und Allergenangaben; einfache Sätze, du-Form, keine Nährwerte oder Wertungen; Abdeckung gegen die lokale Datenbank geprüft. · files: `supabase/migrations/20261113120100_meals_sample_content.sql` · → AC-9
- [ ] T5 [P] Datenzugriff (`server-only`): alle angebotenen Mahlzeiten nach Reihenfolge in einer Abfrage, eine Mahlzeit per ID oder „nicht vorhanden“ (auch bei ungültiger ID); Umwandlung in die Typen der Regeln, unpassende Zeilen werden ausgelassen; mit Test. · files: `src/features/meals/meals.data.ts`, `src/features/meals/meals.data.test.ts` · → AC-1, AC-5; EC-2
- [ ] T6 [P] PROJ-4 auf den gemeinsamen Hinweis umstellen: Importe in Liste, Detail und geführter Ansicht ändern, alten Baustein und `SAMPLE_CONTENT_LABEL` entfernen, Hinweis-Tests aus dem Übungs-Test herausnehmen; Verhalten unverändert, bestehende Tests der drei Ansichten bleiben grün. · files: `src/features/workouts/components/workout-list.tsx`, `src/features/workouts/components/workout-detail.tsx`, `src/features/workouts/components/guided-workout.tsx`, `src/features/workouts/components/exercise-view.test.tsx`, `src/features/workouts/workouts.rules.ts`, `src/features/workouts/components/sample-content-badge.tsx` (entfernt) · → AC-8

## Stufe 3 — Ansichten

- [ ] T7 [P] Liste: Karten mit Titel, Aufwandsstufe, „X Min“, Essensweise und ggf. Hinweis „Beispielinhalt“, Link zum Detail; Aufwandsfilter („Alle“, „Ohne Kochen“, „Schnell gekocht“, „Bis 20 Min“) im Browser; Leerzustand für den Filter mit „Alle Aufwandsstufen anzeigen“, Leerzustand ohne passende Mahlzeit mit „Zu Heute“; Anzahl für Screenreader; mit Test. · files: `src/features/meals/components/meal-list.tsx`, `src/features/meals/components/meal-list.test.tsx` · → AC-1, AC-3, AC-4, AC-8
- [ ] T8 [P] Detailansicht (Server-Komponente): Kopfbereich mit Titel, Hinweis „Beispielinhalt“, ggf. „Passt nicht zu deiner Essensweise“, Eckdaten, Zutatenliste, nummerierte Schritte, „Noch einfacher: …“, Allergene mit Verpackungssatz; mit Test. · files: `src/features/meals/components/meal-detail.tsx`, `src/features/meals/components/meal-detail.test.tsx` · → AC-5, AC-6, AC-7, AC-8; EC-3, EC-4

## Stufe 4 — Seiten

- [ ] T9 [P] `/essen` ersetzt den Platzhalter aus PROJ-2: Mahlzeiten und Essensweise laden, auf dem Server auf passende filtern, an die Liste übergeben. · files: `src/app/(protected)/(bereiche)/essen/page.tsx` · → AC-1, AC-2; EC-1
- [ ] T10 [P] `/essen/[id]`: Detailseite mit „passt“ aus der Essensweise; unbekannte oder nicht angebotene ID zeigt „Diese Mahlzeit gibt es nicht (mehr)“ mit Link „Zu Essen“. · files: `src/app/(protected)/(bereiche)/essen/[id]/page.tsx`, `src/app/(protected)/(bereiche)/essen/[id]/not-found.tsx` · → AC-5; EC-2, EC-3

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Inhalte, Datenzugriff, Umstellung PROJ-4 (2) → Ansichten (3) → Seiten (4).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- AC-10 und EC-1 werden nach Stufe 4 zusätzlich live gegen die lokale Datenbank geprüft (Schreibversuche, Essensweise ändern).
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
