# PROJ-10 — Aufgaben: Eigene Trainingspläne

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration `custom_workouts`:
  - Tabelle (ID, Person, Name 2–40 getrimmt, Folge 1–12 Schritte mit Übung, Art `time`/`reps`, Wert je Art und 5er-Schritte bei Sekunden, `created_at`, `updated_at`)
  - Prüffunktion für die Folge
  - Trigger: Übungen existieren; höchstens 20 je Person mit kurzer Sperre und eigenem Fehlercode; `updated_at`-Pflege
  - Index nach Person
  - RLS nur eigene Zeilen mit aktiver Sitzung für Lesen, Anlegen, Ändern, Löschen; Spaltenrechte (anlegen `id`, `user_id`, `name`, `steps`; ändern `name`, `steps`); nichts für `anon`
  - lokal angewendet und live geprüft: zwei Konten und anonym, ungültige Werte, gleichzeitiges 20. Workout, Doppelanlage mit gleicher ID

  · files: `supabase/migrations/20261125120000_custom_workouts.sql` · → AC-6, AC-11, AC-12, AC-14; EC-1, EC-3, EC-4, EC-7
- [x] T2 [P] Reine Regeln:
  - Grenzen und Texte; neuer Schritt mit 30 Sekunden
  - Folge bearbeiten: hinzufügen, nach oben, nach unten, entfernen, Art wechseln, Wert setzen
  - Übersicht alphabetisch mit „N Übungen“
  - Folge für die Durchführung samt Ausstattung
  - Adressen (neu, Detail, Bearbeiten, Durchführung mit „leichter“)
  - mit Tests

  · files: `src/features/custom-workouts/custom-workouts.rules.ts`, `src/features/custom-workouts/custom-workouts.rules.test.ts` · → AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-11; EC-7
- [x] T3 [P] Eingabeprüfung für Speichern (ID, Name, Folge) und Löschen (ID), mit Feldhinweisen in der Sprache der Spec; unbekannte Schlüssel abgelehnt; mit Test. · files: `src/features/custom-workouts/custom-workouts.schema.ts`, `src/features/custom-workouts/custom-workouts.schema.test.ts` · → AC-6, AC-12
- [x] T4 [P] Änderung PROJ-4: `GuidedWorkout` nimmt Titel, Folge und die Adresse für „Beenden“ (bisheriges Verhalten unverändert); die bestehende Durchführungsseite übergibt `/bewegung/<id>`; mit Tests. · files: `src/features/workouts/components/guided-workout.tsx`, `src/features/workouts/components/guided-workout.test.tsx`, `src/app/(protected)/(bereiche)/bewegung/[id]/los/page.tsx` · → AC-8

## Stufe 2 — Datenzugriff

- [x] T5 [P] Datenzugriff (`server-only`):
  - eigene auflisten (ID, Name, Anzahl Schritte); eines lesen (oder nichts, ungültige IDs ohne Abfrage)
  - anlegen mit vorgegebener ID: gleiche eigene ID gilt als schon gespeichert, Grenze als eigener Fehler, unbekannte Übung als ungültig
  - ersetzen von Name und Folge in einer Änderung; keine Zeile geändert → „nicht gefunden“
  - löschen; schon gelöscht gilt als erledigt
  - Export-Zeilen
  - mit Test

  · files: `src/features/custom-workouts/custom-workouts.data.ts`, `src/features/custom-workouts/custom-workouts.data.test.ts` · → AC-1, AC-5, AC-9, AC-10, AC-11, AC-12, AC-13; EC-1, EC-2, EC-3, EC-4, EC-6

## Stufe 3 — Server Actions und Export

- [ ] T6 [P] Server Actions `saveCustomWorkout` und `deleteCustomWorkout`: Sitzung und Eingabe prüfen; Ergebnisse gespeichert (mit ID), ungültig (mit Feldhinweisen), gibt es nicht mehr, Grenze erreicht, fehlgeschlagen; `/bewegung` aktualisieren; Protokoll ohne Personendaten; mit Test. · files: `src/features/custom-workouts/custom-workouts.actions.ts`, `src/features/custom-workouts/custom-workouts.actions.test.ts` · → AC-5, AC-6, AC-9, AC-10, AC-11; EC-2, EC-3, EC-4, EC-5
- [ ] T7 [P] Änderung PROJ-1: Export-Abschnitt `customWorkouts` (ID, Name, Folge, Anlage, letzte Änderung); übrige Teile unverändert; mit Tests. · files: `src/features/account/account.data.ts`, `src/features/account/account.rules.ts`, `src/features/account/account.data.test.ts`, `src/features/account/account.rules.test.ts` · → AC-13

## Stufe 4 — Ansichten

- [ ] T8 [P] Abschnitt „Deine Workouts“: alphabetische Liste mit „N Übungen“, Leer-Zustand, „Neues Workout“; mit Test. · files: `src/features/custom-workouts/components/custom-workout-list.tsx`, `src/features/custom-workouts/components/custom-workout-list.test.tsx` · → AC-1; EC-7
- [ ] T9 [P] Editor:
  - Name und Folge mit Art, Wert, „Nach oben“, „Nach unten“, „Entfernen“
  - Prüfung im Browser, Hinweise am Feld
  - Sperre während des Speicherns
  - „gibt es nicht mehr“ mit „Als neues Workout speichern“; Grenze und Fehler behalten die Eingaben
  - 375 px bedienbar
  - mit Test

  · files: `src/features/custom-workouts/components/custom-workout-editor.tsx`, `src/features/custom-workouts/components/custom-workout-editor.test.tsx` · → AC-2, AC-3, AC-5, AC-6, AC-9, AC-11; EC-2, EC-3, EC-4, EC-5, EC-8
- [ ] T10 [P] Auswahl-Dialog „Übung hinzufügen“: Filter wie in der Bibliothek, alphabetische Liste mit Ausstattung, „Hinzufügen“ mehrfach möglich, Dialog bleibt offen; mit Test. · files: `src/features/custom-workouts/components/exercise-picker.tsx`, `src/features/custom-workouts/components/exercise-picker.test.tsx` · → AC-2, AC-4
- [ ] T11 [P] Detail:
  - Ausstattung, Sicherheitshinweis, Folge mit „Leichter“ und Links zur Bibliothek
  - „Los geht's“ mit „leichter“-Auswahl, „Bearbeiten“
  - „Löschen“ mit Bestätigung, Sperre und Fehlermeldung
  - mit Test

  · files: `src/features/custom-workouts/components/custom-workout-detail.tsx`, `src/features/custom-workouts/components/custom-workout-detail.test.tsx` · → AC-7, AC-8, AC-10; EC-4, EC-5

## Stufe 5 — Seiten und Live-Prüfung

- [ ] T12 `/bewegung` lädt die eigenen Workouts und zeigt „Deine Workouts“ unter dem Angebot; Seiten `/bewegung/eigene/neu` und `/bewegung/eigene/[id]/bearbeiten` (Übungen und Profil für den Editor laden; fremd oder unbekannt → „Nicht gefunden“). · files: `src/app/(protected)/(bereiche)/bewegung/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/eigene/neu/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/eigene/[id]/bearbeiten/page.tsx` · → AC-1, AC-2, AC-9
- [ ] T13 Seiten:
  - `/bewegung/eigene/[id]` und `/bewegung/eigene/[id]/los` samt „Dieses Workout gibt es nicht (mehr)“ mit Weg zu „Bewegung“
  - Anschließend Live-Prüfung mit zwei Konten: anlegen, ändern, löschen, Grenze 20, zweite Sitzung, fremde und unbekannte Adresse, Durchführung, Export, Kontolöschung.

  · files: `src/app/(protected)/(bereiche)/bewegung/eigene/[id]/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/eigene/[id]/los/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/eigene/[id]/not-found.tsx` · → AC-7, AC-8, AC-12, AC-13, AC-14; EC-1, EC-2, EC-3, EC-6

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Datenzugriff (2) → Server Actions und Export (3) → Ansichten (4) → Seiten (5).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- Stufe 1 hat vier `[P]`-Aufgaben und läuft in zwei Wellen (höchstens drei gleichzeitig).
- T12 und T13 laufen nacheinander, damit die Live-Prüfung alle Seiten sieht.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
