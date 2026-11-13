# PROJ-4 — Aufgaben: Kurze Workouts

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration: Tabellen `exercises`, `workouts`, `workout_steps` mit Prüfregeln (Kurznamen, Textlängen, Dauer 5/10/15, Intensität, Orte, Ausstattungscodes, Prüfstatus, Modus und Menge je Schritt), Fremdschlüssel (Schritte mit dem Workout gelöscht, Übungen nicht löschbar solange genutzt), `updated_at`-Pflege; RLS: angemeldete Personen lesen Übungen und Schritte sowie nur angebotene Workouts; Anlegen, Ändern, Löschen für `anon` und `authenticated` entzogen. · files: `supabase/migrations/20261111170000_workouts.sql` · → AC-14; EC-2
- [x] T2 [P] Reine Workout-Regeln: Typen für Übung, Schritt und Workout; Beschriftungen für Intensität und Dauer; Ausstattung eines Workouts aus seinen Übungen; Passt-Regel nach Ort, Ausstattung zuhause und Erfahrung mit genau einem Grund bei Nicht-Passen; Filter nach Dauer; Auswahl „leichter“ aus der Adresse lesen und schreiben; mit Test. · files: `src/features/workouts/workouts.rules.ts`, `src/features/workouts/workouts.rules.test.ts` · → AC-1, AC-2, AC-3, AC-4, AC-5, AC-7; EC-1
- [x] T3 [P] Reine Timer-Rechnung: Restzeit aus Endzeitpunkt und Uhrzeit, Pausieren, Fortsetzen, abgelaufen; mit Test. · files: `src/features/workouts/timer.rules.ts`, `src/features/workouts/timer.rules.test.ts` · → AC-9; EC-4

## Stufe 2 — Inhalte, Datenzugriff, Grundbausteine

- [x] T4 [P] Beispielinhalte: etwa 25 einfache Übungen mit leichterer Variante und mindestens 10 Workouts mit `review_status = unreviewed`; Abdeckung je mindestens einmal 5/10/15 Minuten, zuhause/draußen/Studio, zuhause ohne Ausstattung sowie mit Matte, Kurzhanteln, Widerstandsband, sanft/mittel/kräftig; Abdeckung gegen die lokale Datenbank geprüft. · files: `supabase/migrations/20261111170100_workouts_sample_content.sql` · → AC-12, AC-13
- [x] T5 [P] Datenzugriff (`server-only`): alle angebotenen Workouts mit Schritten und Übungen in einer Abfrage, ein Workout per ID oder „nicht vorhanden“; Umwandlung in die Typen der Regeln; mit Test. · files: `src/features/workouts/workouts.data.ts`, `src/features/workouts/workouts.data.test.ts` · → AC-1, AC-6; EC-2
- [x] T6 [P] Hinweis „Beispielinhalt – noch nicht fachlich geprüft“ und Übungsanzeige (Name, Sekunden oder Wiederholungen, Anleitung) mit Schalter „Leichter“; mit Test. · files: `src/features/workouts/components/sample-content-badge.tsx`, `src/features/workouts/components/exercise-view.tsx`, `src/features/workouts/components/exercise-view.test.tsx` · → AC-7, AC-12

## Stufe 3 — Ansichten

- [x] T7 [P] Liste: Karten mit Titel, Dauer, Intensität, Orten, Ausstattung und ggf. Hinweis; Dauerfilter im Browser; „Alle Workouts anzeigen“ mit Grund; Leerzustand mit Ausweg; mit Test. · files: `src/features/workouts/components/workout-list.tsx`, `src/features/workouts/components/workout-list.test.tsx` · → AC-1, AC-3, AC-4, AC-5, AC-12
- [x] T8 [P] Detailansicht: Beschreibung, Eckdaten, Sicherheitshinweis, Übungsfolge mit „Leichter“, Hauptaktion „Los geht's“, die die Auswahl an die geführte Ansicht weitergibt; mit Test. · files: `src/features/workouts/components/workout-detail.tsx`, `src/features/workouts/components/workout-detail.test.tsx` · → AC-6, AC-7, AC-12
- [x] T9 [P] Geführte Durchführung: eine Übung pro Bildschirm mit „Übung X von Y“, Timer mit Start/Pause/Weiter zählen und ruhigem Ende ohne automatischen Wechsel, Wiederholungen, „Zurück“/„Weiter“/„Fertig“/„Beenden“, Ansagen für Screenreader, 400-ms-Sperre gegen Doppeltipps, nur Zahl ohne Animation, Abschluss „Geschafft. Gut gemacht.“; mit Test. · files: `src/features/workouts/components/guided-workout.tsx`, `src/features/workouts/components/guided-workout.test.tsx` · → AC-8, AC-9, AC-10, AC-11; EC-3, EC-4, EC-5, EC-6

## Stufe 4 — Seiten

- [ ] T10 [P] `/bewegung` ersetzt den Platzhalter aus PROJ-2: Workouts und Profilangaben laden, „passt / Grund“ auf dem Server berechnen, an die Liste übergeben. · files: `src/app/(protected)/(bereiche)/bewegung/page.tsx` · → AC-1, AC-2; EC-1
- [ ] T11 [P] `/bewegung/[id]`: Detailseite; unbekannte oder nicht angebotene ID zeigt „Dieses Workout gibt es nicht (mehr)“ mit Link „Zu Bewegung“. · files: `src/app/(protected)/(bereiche)/bewegung/[id]/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/[id]/not-found.tsx` · → AC-6; EC-2
- [ ] T12 [P] `/bewegung/[id]/los`: geführte Ansicht; liest die Auswahl „leichter“ aus der Adresse und ignoriert ungültige Positionen. · files: `src/app/(protected)/(bereiche)/bewegung/[id]/los/page.tsx` · → AC-8

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Inhalte, Datenzugriff, Grundbausteine (2) → Ansichten (3) → Seiten (4).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
