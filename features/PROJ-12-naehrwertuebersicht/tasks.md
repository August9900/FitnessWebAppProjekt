# PROJ-12 — Aufgaben: Nährwertübersicht

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben. Änderungen an PROJ-5 sind als solche gekennzeichnet.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration:
  - vier Spalten an `meals`: `energy_kcal` (0–2000), `protein_g`, `carbs_g`, `fat_g` (je 0–200), ganze Zahlen oder leer
  - Regel „alle vier oder keine“
  - Beispielwerte für alle 17 Beispiel-Mahlzeiten, grob aus den Zutatenmengen geschätzt und gerundet
  - Rechte und Zugriffsregeln unverändert; lokal anwenden
  - Datenbank-Prüfung: Regel „alle oder keine“, Grenzen, alle 17 mit Werten, Angemeldete können nicht ändern

  · files: `supabase/migrations/<Zeitstempel>_meal_nutrition.sql` · → AC-8, AC-10, AC-11
- [x] T2 [P] Nährwert-Regeln:
  - Typ „Nährwerte“ (kcal, Eiweiß, Kohlenhydrate, Fett — ganze Zahlen); Grenzen
  - aus vier gelesenen Werten zusammensetzen: alle gültig → Nährwerte, sonst keine
  - die vier Anzeigezeilen in fester Reihenfolge mit Beschriftung und Einheit, „0 g“ bleibt „0 g“
  - Titel „Nährwerte pro Portion“ und Hinweis „Ungefähre Werte – sie hängen von den genauen Zutaten ab.“
  - Tabellen-Tests

  · files: `src/features/nutrition/nutrition.rules.ts`, `src/features/nutrition/nutrition.rules.test.ts` · → AC-2, AC-3, AC-6, AC-8; EC-1

## Stufe 2 — Daten und Abschnitt

- [ ] T3 [P] Änderung PROJ-5: Die Mahlzeit kennt optional ihre Nährwerte (bestehende Testdaten bleiben gültig); alle Mahlzeiten-Abfragen lesen die vier Spalten mit; unvollständige oder ungültige Werte → Mahlzeit ohne Nährwerte, die Mahlzeit bleibt sichtbar; mit Test. · files: `src/features/meals/meals.rules.ts`, `src/features/meals/meals.data.ts`, `src/features/meals/meals.data.test.ts` · → AC-6, AC-8; EC-2, EC-3
- [ ] T4 [P] Abschnitt „Nährwerte pro Portion“: zugeklappt (shadcn `collapsible`), Auslöser als Knopf mit `aria-expanded`, mindestens 48 px; beim Öffnen einer Seite immer zu; ohne Animation; vier Werte und Hinweis, umbrechend; keine wertenden Farben oder Texte; mit Test. · files: `src/features/nutrition/components/nutrition-section.tsx`, `src/features/nutrition/components/nutrition-section.test.tsx` · → AC-1, AC-2, AC-3, AC-4, AC-5; EC-1, EC-4, EC-5

## Stufe 3 — Detail und Live-Prüfung

- [ ] T5 Änderung PROJ-5: Mahlzeiten-Detail zeigt den Abschnitt am Ende, nur mit Werten; mit Test. Anschließend Live-Prüfung gegen lokale Datenbank und Produktions-Build: Detail mit zugeklapptem Abschnitt und weiter vorhandener Beispielinhalt-Markierung, Mahlzeit ohne Werte ohne Abschnitt, keine Nährwerte in `/essen` und auf `/heute`, nicht angebotene Mahlzeit → „Nicht gefunden“. · files: `src/features/meals/components/meal-detail.tsx`, `src/features/meals/components/meal-detail.test.tsx` · → AC-1, AC-6, AC-7, AC-9, AC-11; EC-2, EC-3, EC-4

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Daten und Abschnitt (2) → Detail und Live-Prüfung (3). Für Stufe 1 muss Docker laufen.
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- AC-7, AC-9, AC-11 und EC-2 werden nach Stufe 3 zusätzlich live geprüft.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
