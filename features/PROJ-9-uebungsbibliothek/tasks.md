# PROJ-9 — Aufgaben: Übungsbibliothek

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben und keine Migration.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Reine Regeln:
  - Filter `alle` / `ohne-ausstattung` / `zuhause` mit Beschriftungen
  - Filter aus der Adresse lesen: Unbekanntes sowie `zuhause` ohne „Zuhause“ im Profil ergeben `alle`; angebotene Filter
  - Übungen filtern (ohne Ausstattung; Ausstattung vollständig in der Ausstattung zuhause); nach deutscher Reihenfolge sortieren
  - „Kommt vor in“ aus den angebotenen Workouts: Angebotsreihenfolge, ohne Doppelte, mit Titel, Dauer und Adresse
  - Adressen von Liste und Detail mit Filter; Texte
  - Tabellen-Tests

  · files: `src/features/exercises/exercises.rules.ts`, `src/features/exercises/exercises.rules.test.ts` · → AC-3, AC-4, AC-5, AC-6, AC-8, AC-9; EC-1, EC-2, EC-3, EC-4
- [x] T2 [P] Änderung PROJ-4, Datenzugriff: alle Übungen; eine Übung nach ID (ungültige oder unbekannte ID → nichts); bestehende Zeilenprüfung wiederverwenden; Lesefehler werfen ohne Personendaten; mit Test. · files: `src/features/workouts/workouts.data.ts`, `src/features/workouts/workouts.data.test.ts` · → AC-3, AC-7; EC-2, EC-5

## Stufe 2 — Ansichten

- [x] T3 [P] Listenansicht:
  - Filter-Links mit `aria-current` und Häkchen, mindestens 48 px; „Passt zu meinem Zuhause“ nur wenn angeboten
  - alphabetische Liste mit Ausstattung; Detail-Links mit Filter
  - Leer-Zustand „Keine Übung passt zu diesem Filter.“ mit „Alle zeigen“
  - umbrechende Texte
  - mit Test

  · files: `src/features/exercises/components/exercise-library.tsx`, `src/features/exercises/components/exercise-library.test.tsx` · → AC-3, AC-4, AC-5, AC-6; EC-1, EC-6
- [x] T4 [P] Detailansicht:
  - Name, Anleitung, leichtere Variante, Ausstattung, Sicherheitshinweis
  - „Kommt vor in“ mit Links oder „Gerade in keinem Workout.“
  - „Alle Übungen“ mit Filter; kein Startknopf
  - mit Test

  · files: `src/features/exercises/components/exercise-detail.tsx`, `src/features/exercises/components/exercise-detail.test.tsx` · → AC-7, AC-8, AC-9, AC-10; EC-6
- [x] T5 [P] Änderung PROJ-4: `ExerciseView` mit optionaler Adresse für den Namen; das Workout-Detail übergibt die Bibliotheksadresse der Übung, die geführte Durchführung nichts; mit Tests. · files: `src/features/workouts/components/exercise-view.tsx`, `src/features/workouts/components/exercise-view.test.tsx`, `src/features/workouts/components/workout-detail.tsx`, `src/features/workouts/components/workout-detail.test.tsx` · → AC-2

## Stufe 3 — Seiten und Live-Prüfung

- [x] T6 Seiten:
  - `/bewegung/uebungen`: Angaben der Person und Übungen laden, Filter lesen und anwenden
  - `/bewegung/uebungen/[id]`: Übung und angebotene Workouts parallel laden; unbekannte Übung → „Nicht gefunden“ mit Weg zur Bibliothek
  - Link „Übungen nachschlagen“ unter der Workout-Liste
  - Anschließend Live-Prüfung gegen die lokale Datenbank und den Dev-Server: Liste und Filter (mit und ohne „Zuhause“), Detail mit „Kommt vor in“, Workout aus dem Angebot genommen, unbekannte Übung und unbekannter Filter, verlinkte Namen im Workout-Detail und keine Links in der Durchführung.

  · files: `src/app/(protected)/(bereiche)/bewegung/uebungen/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/uebungen/[id]/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/uebungen/[id]/not-found.tsx`, `src/app/(protected)/(bereiche)/bewegung/page.tsx` · → AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9; EC-2, EC-3, EC-4, EC-5

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Ansichten (2) → Seiten (3).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- AC-1, AC-2, EC-2, EC-3 und EC-4 werden nach Stufe 3 zusätzlich live gegen die lokale Datenbank und den Dev-Server geprüft.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
