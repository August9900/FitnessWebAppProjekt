# PROJ-8 — Aufgaben: Wochenblick

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben und keine Migration.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Reine Regeln:
  - Zeitzone prüfen (ungültig → `Europe/Berlin`); Ortsdatum eines Zeitpunkts; Montag einer Woche
  - Parameter `woche` streng als `JJJJ-MM-TT` lesen; ungültig, Zukunft oder vor der Woche der Kontoerstellung → laufende Woche
  - Abfragezeitraum mit einem Tag Puffer
  - Woche aufbauen: sieben Tage Mo–So mit „heute“; Einträge `done`/`started` nach Ortsdatum des Beginns, je Tag nach Beginn sortiert; `skipped` und Einträge außerhalb der Woche verworfen
  - Beschriftungen: Überschrift, Datumsbereich, Wochentag mit Datum, Zustand; Überblickssatz; vorige/nächste Woche mit Adressen
  - Tabellen-Tests: Berlin, Lissabon, Helsinki, Mitternacht, Wochengrenze, Sommer- und Winterzeit

  · files: `src/features/week/week.rules.ts`, `src/features/week/week.rules.test.ts` · → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15; EC-2, EC-6
- [x] T2 [P] Änderung PROJ-6, Datenzugriff: Lesefunktion für eigene Aktionen mit Zustand `started` oder `done`, deren Beginn im Zeitraum liegt; mit Titeln (leer, wenn nicht mehr angeboten), aufsteigend nach Beginn; wirft bei Lesefehlern ohne Personendaten; mit Test. · files: `src/features/today/today.data.ts`, `src/features/today/today.data.test.ts` · → AC-4, AC-5, AC-6, AC-16; EC-1, EC-4, EC-6
- [x] T3 [P] Änderung PROJ-6: Ersatztitel „Dein Workout“ / „Deine Mahlzeit“ in `today.rules`; `open-actions` nutzt sie von dort, Verhalten unverändert; mit Tests. · files: `src/features/today/today.rules.ts`, `src/features/today/today.rules.test.ts`, `src/features/today/components/open-actions.tsx`, `src/features/today/components/open-actions.test.tsx` · → EC-1

## Stufe 2 — Ansichten

- [x] T4 [P] Darstellung (Server-Komponente):
  - Wochenkopf mit Überschrift, Datumsbereich und ggf. Überblickssatz
  - Blätter-Links nur wo erlaubt
  - geordnete Tagesliste mit „heute“ als Text und Einträgen: Titel als Link zum Detail bzw. Ersatztitel ohne Link, Art, Zustand; „–“ bei leeren Tagen
  - Leer-Hinweis mit „Zu Heute“ nur in der laufenden Woche
  - keine Bedienelemente zum Markieren; umbrechende Titel, keine Kennzahlen
  - mit Test

  · files: `src/features/week/components/week-view.tsx`, `src/features/week/components/week-view.test.tsx` · → AC-1, AC-2, AC-3, AC-4, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14; EC-1, EC-5
- [x] T5 [P] Zeitzonen-Abgleich (Client, unsichtbar): Gerätezeitzone lesen; weicht sie vom übergebenen Cookie-Wert ab, Cookie `pulse_tz` setzen (Pfad `/`, SameSite=Lax, ein Jahr) und einmal neu laden; mit Test. · files: `src/features/week/components/time-zone-sync.tsx`, `src/features/week/components/time-zone-sync.test.tsx` · → AC-2, AC-4; EC-2

## Stufe 3 — Seite und Live-Prüfung

- [x] T6 `/wochenblick` ersetzt den Platzhalter:
  - Person mit vollständigen Angaben ermitteln (samt Kontozeitpunkt)
  - Cookie `pulse_tz` und Parameter `woche` lesen, Aktionen des Abfragezeitraums laden, Woche aufbauen
  - `WeekView` und den Zeitzonen-Abgleich darstellen
  - Anschließend Live-Prüfung mit zwei Testkonten: nur eigene Aktionen, ohne Sitzung zur Anmeldung, „heute nicht“ fehlt, nicht mehr angebotener Inhalt, aktueller Stand nach Markieren, Lissabon gegen Berlin nahe Mitternacht, ungültige und zukünftige Woche in der Adresse.

  · files: `src/app/(protected)/(bereiche)/wochenblick/page.tsx` · → AC-1, AC-15, AC-16; EC-1, EC-3, EC-4

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Ansichten (2) → Seite (3).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- AC-16, EC-1, EC-2, EC-3 und AC-15 werden nach Stufe 3 zusätzlich live gegen die lokale Datenbank und den Dev-Server geprüft.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
