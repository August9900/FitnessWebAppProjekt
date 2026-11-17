# PROJ-6 — Aufgaben: Tagesentscheidung

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration: Tabellen `check_ins` (Art, Zeit, Energie, Ort, Aufwand je nach Art, Vorschlag als Rangliste 0–3 ohne Doppelte) und `actions` (Check-in eindeutig, Art, Workout bzw. Mahlzeit je nach Art, Zustand `started`/`done`/`skipped`, `concluded_at` leer genau bei `started`, Zeitpunkte, `updated_at`-Pflege); Fremdschlüssel (Konto mit Löschung, Check-in mit Löschung, Inhalte nicht löschbar); Indizes; RLS nur eigene Zeilen mit aktiver Sitzung — `check_ins` lesen/anlegen, `actions` lesen/anlegen (nur eigener Check-in, gleiche Art, Inhalt im Vorschlag und angeboten)/ändern nur `status` und `concluded_at`; kein Löschen über die API; keine Rechte für `anon`; lokal angewendet und mit zwei Testkonten sowie anonym geprüft. · files: `supabase/migrations/20261113150000_today.sql` · → AC-11, AC-17, AC-19; EC-4, EC-5
- [x] T2 [P] Reine Regeln: Typen und Beschriftungen (Art, Zeit, Energie, Ort, Aufwand, Zustand); Auswahl Bewegen und Essen (Kandidaten, Sortierung, Plätze 1–3); Zeile „Passt zu: …“; Zusammenfassung „Wie letztes Mal“ und Gültigkeit gegen das aktuelle Profil; offene Aktionen (12 Stunden); zurücknehmbare Markierung (kein neuerer Check-in); Zeit als Eingabe; mit Tabellen-Tests. · files: `src/features/today/today.rules.ts`, `src/features/today/today.rules.test.ts` · → AC-5, AC-7, AC-8, AC-9, AC-13, AC-15; EC-1, EC-2, EC-3, EC-7, EC-8
- [x] T3 [P] Eingabeprüfung der Server Actions: Check-in Bewegen (Zeit, Energie, Ort) bzw. Essen (Aufwand), Aktion beginnen (Check-in-ID, Inhalt-ID), markieren (Aktions-ID, `done`/`skipped`), zurücknehmen (Aktions-ID); mit Test. · files: `src/features/today/today.schema.ts`, `src/features/today/today.schema.test.ts` · → AC-2, AC-3, AC-12, AC-14, AC-15

## Stufe 2 — Datenzugriff

- [x] T4 Datenzugriff (`server-only`): Check-in mit Vorschlag anlegen; letzte Antworten je Art; in den letzten 72 Stunden begonnene Inhalte; Aktion anlegen bzw. bestehende des Check-ins liefern; bedingt markieren (nur wenn `started`) mit tatsächlichem Zustand als Ergebnis; zurücknehmen nur ohne neueren Check-in; offene Aktionen und letzte Markierung mit Titeln; alle eigenen Check-ins und Aktionen für den Export; mit Test. · files: `src/features/today/today.data.ts`, `src/features/today/today.data.test.ts` · → AC-5, AC-11, AC-12, AC-13, AC-14, AC-15, AC-18; EC-4, EC-5, EC-8

## Stufe 3 — Server Actions und Export

- [x] T5 [P] Server Actions `requestSuggestion`, `startAction`, `concludeAction`, `undoConclusion`: Sitzung und Eingabe prüfen, Profil, Inhalte und Verlauf laden, Regel anwenden, speichern; Ergebnisse „leer“, „gibt es nicht mehr“, „nicht mehr möglich“, „fehlgeschlagen“; Ziel-Adresse nach dem Start; Protokoll ohne Personendaten; mit Test. · files: `src/features/today/today.actions.ts`, `src/features/today/today.actions.test.ts` · → AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-14, AC-15; EC-1, EC-4, EC-5, EC-6, EC-9
- [x] T6 [P] Datenexport (PROJ-1) um den Abschnitt „Tagesentscheidung“ mit Check-ins und Aktionen erweitern; übrige Exportteile unverändert; mit Tests. · files: `src/features/account/account.data.ts`, `src/features/account/account.rules.ts`, `src/features/account/account.data.test.ts`, `src/features/account/account.rules.test.ts` · → AC-18

## Stufe 4 — Ansichten

- [ ] T7 [P] Tagesentscheidung (Client): Wahl „Bewegen“/„Essen“; je eine Frage pro Bildschirm mit Vorauswahl, „Wie letztes Mal“, „Zurück“, Ortsfrage nur bei mehreren Profil-Orten, Fokus auf die neue Frage; Vorschlag mit Hauptvorschlag, „Passt zu“, Hinweis „Beispielinhalt“, bis zu zwei Alternativen mit „Stattdessen das“, Titel als Link zum Detail; Leer- und Fehlerzustand mit „Nochmal versuchen“; „gibt es nicht mehr“ mit neuem Vorschlag; Sperre während laufender Actions; Weiterleitung nach dem Start; Test zählt die Tipps bis zum Start. · files: `src/features/today/components/today-flow.tsx`, `src/features/today/components/today-flow.test.tsx` · → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-10, AC-12; EC-1, EC-2, EC-4, EC-6, EC-7, EC-9
- [ ] T8 [P] Offene Aktionen (Client): Karten mit „Weitermachen“, „Geschafft“, „Heute nicht“; Bestätigungen „Geschafft. Gut gemacht.“ / „Okay. Vielleicht ein andermal.“ mit „Rückgängig“; tatsächlicher Zustand nach Markierung auf anderem Gerät; Fehlermeldung mit „Nochmal versuchen“; Sperre während laufender Actions; mit Test. · files: `src/features/today/components/open-actions.tsx`, `src/features/today/components/open-actions.test.tsx` · → AC-13, AC-14, AC-15, AC-16; EC-4, EC-5, EC-8, EC-9

## Stufe 5 — Seite

- [ ] T9 `/heute` ersetzt den Platzhalter aus PROJ-2: Profil, letzte Antworten je Art, offene Aktionen und letzte Markierung laden und an beide Komponenten übergeben; anschließend Live-Prüfung mit zwei Testkonten (Zugriff, Doppeltipps, zwei Markierungen, Export, Kontolöschung). · files: `src/app/(protected)/(bereiche)/heute/page.tsx` · → AC-1, AC-5, AC-13, AC-15, AC-16; EC-7, EC-8

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Datenzugriff (2) → Server Actions und Export (3) → Ansichten (4) → Seite (5).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- AC-17, AC-19, EC-4 und EC-5 werden nach Stufe 5 zusätzlich live gegen die lokale Datenbank geprüft.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
