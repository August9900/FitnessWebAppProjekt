# PROJ-10 — Technisches Design: Eigene Trainingspläne

> Technische Umsetzung von `spec.md`. Ein eigenes Workout ist **eine** Zeile in einer neuen Tabelle. Sie enthält Name und Übungsfolge, nur für die jeweilige Person. Weil Name und Folge immer zusammen gespeichert werden, ist jedes Speichern ein vollständiger Ersatz in einem Schritt (EC-1). Die Datenbank prüft die Grenzen (Name, 1–12 Schritte, Werte, höchstens 20 pro Person) und dass jede Übung existiert. Übersicht, Detail, Editor und Durchführung liegen im Bereich „Bewegung“ unter `/bewegung/eigene`. Die geführte Durchführung aus PROJ-4 wird so geöffnet, dass sie auch eine eigene Folge abspielt.

## Komponentenstruktur

```text
Bewegung  /bewegung  (PROJ-4)
├── … Workout-Liste, „Übungen nachschlagen ›“ (PROJ-9)
└── NEU: Abschnitt „Deine Workouts“
    ├── Liste (alphabetisch): Name (Link) · „3 Übungen“
    ├── leer: „Stell dir ein eigenes Workout aus den Übungen zusammen.“
    └── [Neues Workout]

Neues Workout  /bewegung/eigene/neu        Bearbeiten  /bewegung/eigene/[id]/bearbeiten
└── Editor
    ├── Name (Textfeld, Hinweis am Feld)
    ├── Übungsfolge (geordnete Liste), je Schritt:
    │   Name · [Sekunden | Wiederholungen] · Wert · [Nach oben] [Nach unten] [Entfernen]
    ├── [Übung hinzufügen] → Auswahl-Dialog: Filter (Alle / Ohne Ausstattung / Passt zu meinem Zuhause),
    │   alphabetische Liste mit Ausstattung, je Übung [Hinzufügen]
    ├── Hinweise: am Feld bzw. über der Liste; Speicherfehler; Grenze 20; „gibt es nicht mehr“ + [Als neues Workout speichern]
    └── [Speichern]  [Abbrechen]

Eigenes Workout  /bewegung/eigene/[id]
├── PageHeader: Name · Hauptaktion [Los geht's]
├── Ausstattung · Sicherheitshinweis
├── Übungsfolge mit ExerciseView (Sekunden/Wdh., Anleitung, „Leichter“, Name → Bibliothek)
└── [Bearbeiten]  [Löschen] → Bestätigung „Workout „<Name>“ löschen?“ [Löschen] [Abbrechen]

Durchführung  /bewegung/eigene/[id]/los?leichter=…
└── GuidedWorkout (PROJ-4) mit der eigenen Folge; „Beenden“ führt zum eigenen Workout
```

- Alles liegt im Bereich „Bewegung“, der dabei aktiv markiert bleibt; keine neue Navigation. `docs/app-shell.md` bleibt unverändert.
- **Editor:** Jedes Bedienelement ist mindestens 48 px hoch und per Tastatur erreichbar.
  - Verschieben geht nur über Knöpfe; am Anfang bzw. Ende der Liste sind sie deaktiviert.
  - Hinweise sind dem Feld per `aria-describedby` zugeordnet (AC-3, AC-6, EC-8).
  - Auf schmalen Bildschirmen stehen die Steuerelemente eines Schritts untereinander.
- **Auswahl-Dialog:** shadcn `dialog` mit Fokusfalle; schließt nach „Hinzufügen“ nicht, damit mehrere Übungen nacheinander hinzugefügt werden können.
- **Löschen:** shadcn `alert-dialog` mit Bestätigung, wie beim Konto-Löschen (PROJ-1).
- Ladezustand und Fehlergrenze kommen aus dem Bereich (PROJ-2).

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/custom-workouts/custom-workouts.rules.ts` | Rein. Die Aufgaben im Einzelnen: <br>• **Grenzen und Texte:** Name 2–40, 1–12 Schritte, Sekunden 10–180 in 5er-Schritten, Wiederholungen 1–30, höchstens 20; alle Hinweise und Meldungen der Spec. <br>• **Neuer Schritt:** 30 Sekunden. <br>• **Folge bearbeiten** (rein, für den Editor): Schritt hinzufügen, nach oben, nach unten, entfernen, Art wechseln, Wert setzen. <br>• **Übersicht:** alphabetisch nach Name (deutsche Reihenfolge), Text „N Übungen“. <br>• **Durchführung:** eigenes Workout plus Übungen → Folge in der Form, die `GuidedWorkout` und `ExerciseView` brauchen; benötigte Ausstattung. <br>• **Adressen:** neu, Detail, Bearbeiten, Durchführung (mit „leichter“). | `features/workouts/workouts.rules` (Typen, `EASIER_PARAM`, `workoutEquipment`, `amountLabel`); `features/exercises/exercises.rules` (Filter, Sortierung, Adresse). |
| `src/features/custom-workouts/custom-workouts.schema.ts` | Zod-Schemas der Eingaben: **Speichern** (ID als UUID, Name getrimmt 2–40, Schritte 1–12 mit Übungs-ID im Muster `a–z0–9_`, Art `time`/`reps`, Wert je Art in den Grenzen); **Löschen** (ID). Unbekannte Schlüssel werden abgelehnt. Feldhinweise in der Sprache der Spec, wiederverwendet vom Editor (Prüfung schon im Browser) und von der Server Action. | Zod, Rules. |
| `src/features/custom-workouts/custom-workouts.data.ts` | `server-only`. **Eigene auflisten** (ID, Name, Anzahl Schritte). **Eines lesen** (oder nichts). **Anlegen mit vorgegebener ID:** Existiert die ID schon als eigene, gilt das als bereits gespeichert (EC-4); die Grenze 20 meldet die Datenbank als eigenen Fehler. **Ersetzen:** Name und Folge in einer Änderung; „nicht gefunden“, wenn keine Zeile geändert wurde (EC-2). **Löschen:** schon gelöscht gilt als erledigt. **Export-Zeilen.** | `src/lib/supabase/server.ts`, Rules, Schema. |
| `src/features/custom-workouts/custom-workouts.actions.ts` | `'use server'`. `saveCustomWorkout` (neu oder ersetzen) und `deleteCustomWorkout`: Sitzung und Eingabe prüfen, speichern bzw. löschen, `/bewegung` aktualisieren. Ergebnisse: <br>• gespeichert, mit ID <br>• ungültig, mit Feldhinweisen <br>• gibt es nicht mehr <br>• Grenze erreicht <br>• fehlgeschlagen <br>Protokoll nur mit Action-Name und Datenbankcode. | `features/account/account.data` (`requireUser`), Data, Schema. |
| `src/features/custom-workouts/components/custom-workout-list.tsx` | Abschnitt „Deine Workouts“ auf „Bewegung“ (ohne Zustand): Liste, Leer-Zustand, „Neues Workout“. | `next/link`, shadcn `button`, Rules. |
| `src/features/custom-workouts/components/custom-workout-editor.tsx` | Client. Name und Folge im Browser-Zustand; Auswahl-Dialog mit Filtern (Bibliotheksregeln); Prüfung mit dem Schema vor dem Senden; während des Speicherns gesperrt (EC-4). Nach Erfolg geht es zum Detail. Bei „gibt es nicht mehr“ wird „Als neues Workout speichern“ angeboten: neue ID, dieselben Eingaben. Bei Grenze und Fehler bleiben die Eingaben erhalten (EC-3, EC-5). Die ID eines neuen Workouts wird beim Öffnen des Editors einmal im Browser erzeugt. | shadcn `input`, `label`, `button`, `select`, `dialog`, `alert`; Actions, Schema, Rules. |
| `src/features/custom-workouts/components/custom-workout-detail.tsx` | Client. Ausstattung, Sicherheitshinweis, Folge mit `ExerciseView` (Name → Bibliothek, „Leichter“); „Los geht's“ mit „leichter“-Auswahl; „Bearbeiten“; „Löschen“ mit Bestätigung, gesperrt während der Action. Nach Erfolg geht es zu `/bewegung`, bei Fehler erscheint die Meldung. | shadcn `button`, `alert`, `alert-dialog`; `ExerciseView`; `PageHeader`; Actions, Rules. |
| **Änderung PROJ-4:** `src/features/workouts/components/guided-workout.tsx` | Nimmt statt eines ganzen Workouts nur Titel und Folge sowie die Adresse für „Beenden“. Das Verhalten bleibt unverändert, die PROJ-4-Seite übergibt die bisherige Adresse. | wie bisher. |
| **Änderung PROJ-4:** `src/app/(protected)/(bereiche)/bewegung/[id]/los/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/page.tsx` | Durchführung übergibt `/bewegung/<id>` als „Beenden“-Adresse; „Bewegung“ lädt zusätzlich die eigenen Workouts und zeigt `CustomWorkoutList` unter dem Angebot. | zusätzlich `features/custom-workouts`. |
| Seiten `src/app/(protected)/(bereiche)/bewegung/eigene/neu/page.tsx`, `…/eigene/[id]/page.tsx`, `…/[id]/bearbeiten/page.tsx`, `…/[id]/los/page.tsx`, `…/[id]/not-found.tsx` | Angaben der Person (Gate) und Übungen bzw. das eigene Workout laden. Unbekannt oder fremd → „Dieses Workout gibt es nicht (mehr)“ mit Weg zu „Bewegung“ (AC-12, EC-6). | `features/custom-workouts`, `features/workouts/workouts.data` (Übungen), `features/profile/profile.data`. |
| **Änderung PROJ-1:** `src/features/account/account.data.ts`, `account.rules.ts` | Export-Abschnitt `customWorkouts` (AC-13); übrige Teile unverändert. | zusätzlich `features/custom-workouts/custom-workouts.data`. |

Abhängigkeitsrichtung: `features/custom-workouts` nutzt die Regeln und Komponenten von PROJ-4 und PROJ-9. Umgekehrt kennen nur die Seiten `features/custom-workouts`; die Regeln von PROJ-4 und PROJ-9 bleiben ohne Abhängigkeit darauf.

## Footprint

- **Code und Tests:**
  - `src/features/custom-workouts/**` mit Tests neben den Modulen
  - Seiten unter `src/app/(protected)/(bereiche)/bewegung/eigene/**`
  - Änderungen mit Tests an `guided-workout.tsx`, `bewegung/[id]/los/page.tsx`, `bewegung/page.tsx` und den Export-Dateien von PROJ-1
- **Migrationen, Tabellen und Zugriffsregeln:** `supabase/migrations/<Zeitstempel>_custom_workouts.sql` mit:
  - Tabelle `custom_workouts` mit Prüfregeln
  - Prüffunktion für die Folge
  - Trigger: Übungen existieren, Grenze 20 je Person, `updated_at`
  - RLS nur für die eigene Person mit aktiver Sitzung
  - Spaltenrechte
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** neu `/bewegung/eigene/neu`, `/bewegung/eigene/[id]`, `…/bearbeiten`, `…/los`. Geändert werden `/bewegung` (Abschnitt) und `/bewegung/[id]/los` (Übergabe). Der Datenexport `/profil/export` wird erweitert. Keine Navigationseinträge, keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-6 | Grenzen werden immer eingehalten, auch bei Umgehung der App. | Gleiches Zod-Schema im Browser und in der Server Action; die Datenbank prüft Name, Anzahl, Art, Werte und 5er-Schritte zusätzlich und lässt nur existierende Übungen zu. | Schema-Tests an den Grenzen; Live-Prüfung direkter Schreibversuche mit ungültigen Werten. |
| EC-1 | Zwei Geräte: das zuletzt Gespeicherte gilt vollständig. | Eine Zeile pro Workout; Name und Folge werden in **einer** Änderung ersetzt — keine Teilaktualisierung. | Data-Test; Live-Prüfung zweier Sitzungen. |
| EC-2 | Gelöschtes Workout speichern → „gibt es nicht mehr“, Eingaben bleiben. | Ersetzen, das keine Zeile ändert, liefert „nicht gefunden“; der Editor bietet „Als neues Workout speichern“ mit neuer ID. | Action- und Komponententest; Live-Prüfung. |
| AC-11, EC-3 | Nie mehr als 20, auch bei gleichzeitigem Anlegen. | Trigger vor dem Anlegen sperrt kurz je Person und zählt; ab 20 lehnt die Datenbank mit eigenem Fehlercode ab → „Grenze erreicht“. | Live-Prüfung: 19 vorhanden, zwei gleichzeitige Anlagen → genau eine. |
| EC-4 | Doppeltipps: genau ein Workout bzw. eine Änderung oder Löschung. | Neue Workouts tragen eine im Editor erzeugte ID; ein zweites Anlegen mit derselben ID gilt als „schon gespeichert“. Ersetzen ist wiederholbar, Löschen von Gelöschtem gilt als erledigt. Zusätzlich sperrt die Oberfläche während der Action. | Data-/Action-Tests; Komponententests; Live-Prüfung zweier gleichzeitiger Anlagen mit derselben ID. |
| EC-5 | Fehler: Meldung, Eingaben bleiben. | Ergebnis „fehlgeschlagen“; der Editor behält seinen Zustand. | Komponententest. |
| AC-12, EC-6 | Fremd oder unbekannt → „gibt es nicht (mehr)“. | RLS liefert fremde Zeilen nicht aus; ungültige IDs werden nicht abgefragt; die Seite zeigt „Nicht gefunden“. | Live-Prüfung mit zweitem Konto und anonym. |
| EC-8 | 12 Schritte auf 375 px bedienbar. | Steuerelemente je Schritt umbrechend, 48 px. | Komponententest (Klassen), Sichtprüfung bei `/qa`. |

**Fehler an den Schnittstellen:**
- **Ungültige Eingabe:** Ergebnis „ungültig“ mit Feldhinweisen, nichts gespeichert.
- **Unbekannte oder nicht mehr vorhandene Übung in der Folge:** Die Datenbank lehnt ab, das Ergebnis ist „ungültig“ mit dem allgemeinen Hinweis „Eine Übung gibt es nicht mehr. Bitte entferne sie.“
- **Keine Sitzung:** Umleitung zur Anmeldung.
- **Grenze 20:** Ergebnis „Grenze erreicht“ mit dem Text aus AC-11.
- **Datenbank nicht erreichbar:** Ergebnis „fehlgeschlagen“ (EC-5); Protokoll nur mit Action-Name und Code, ohne Namen, Folge oder Nutzer-ID.
- **Laden einer Seite schlägt fehl:** Fehlergrenze des Bereichs.

## Datenmodell

Eine neue Tabelle mit persönlichen Daten.

**Eigenes Workout `custom_workouts`**
- `id`: UUID, Primärschlüssel. Beim Anlegen vom Editor vorgegeben (Schutz gegen Doppeltipps); wird nie geändert.
- `user_id`: UUID, Pflicht; verweist auf das Konto und wird mit dem Konto gelöscht. Nicht änderbar.
- `name`: Text, Pflicht, ohne führende oder folgende Leerzeichen 2–40 Zeichen. Freitext; gleiche Namen sind erlaubt (EC-7).
- `steps`: geordnete Liste, Pflicht, 1–12 Einträge. Jeder Eintrag enthält:
  - `exercise_id`: Text im Muster der Übungs-IDs, muss eine vorhandene Übung sein
  - `mode`: genau `time` oder `reps`
  - `amount`: ganze Zahl; bei `time` 10–180 und durch 5 teilbar, bei `reps` 1–30
  - Weitere Felder sind nicht erlaubt.
- `created_at`, `updated_at`: Zeitpunkte, automatisch (`updated_at` bei jeder Änderung).

**Automatik in der Datenbank:**
- **Form der Folge:** Eine Prüffunktion stellt Anzahl, Felder und Werte sicher.
- **Übungen existieren:** Ein Trigger vor Anlegen und Ändern stellt sicher, dass jede `exercise_id` in `exercises` vorkommt. Gelesen wird die Bibliothek, die für Angemeldete ohnehin lesbar ist.
- **Höchstens 20 je Person:** Ein Trigger vor dem Anlegen nimmt eine kurze Sperre je Person, zählt die vorhandenen Workouts und lehnt ab 20 mit eigenem Fehlercode ab. Die Funktion läuft mit Eigentümerrechten, damit das Zählen nicht von den Zugriffsregeln abhängt.

**Zugriff (RLS, nur `authenticated` mit aktiver Sitzung über `private.has_active_session`):**
- Lesen, Anlegen, Ändern und Löschen nur eigener Zeilen (`user_id` = angemeldete Person).
- Spaltenrechte: Anlegen nur mit `id`, `user_id`, `name` und `steps`; Ändern nur von `name` und `steps`.
- **`anon`:** keinerlei Rechte.

**Aufbewahrung:** bis die Person das Workout löscht oder ihr Konto löscht (AC-14). Eine kürzere Frist klärt `/dsgvo PROJ-10` vor dem ersten Deploy.

**Indizes:** nach Person (Übersicht, Zählen für die Grenze).

**Datenmodell der App:** „Eigener Trainingsplan“ wird von „Spätere Ergänzungen“ zu „Dinge“ verschoben und als „eigenes Workout“ beschrieben: eine benannte Übungsfolge ohne Tage, die auf Übungen verweist (`docs/data-model.md`).

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| „Bewegung“ laden | Angemeldet, Angaben vollständig. | Eigene Workouts alphabetisch mit Anzahl Übungen; leer → Hinweis. | AC-1 |
| Neu anlegen (`saveCustomWorkout`) | Angemeldet; vollständige Eingabe mit neuer ID. | Gespeichert → Detail. Bei gleicher ID → das bestehende gilt als gespeichert. Bei 20 → Grenze. Ungültig → Hinweise. Fehler → Meldung. | AC-2 bis AC-6, AC-11, EC-3 bis EC-5 |
| Ersetzen (`saveCustomWorkout`) | Angemeldet; eigene ID. | Name und Folge in einem Schritt ersetzt. Keine Zeile geändert → „gibt es nicht mehr“. | AC-9, EC-1, EC-2 |
| Löschen (`deleteCustomWorkout`) | Angemeldet; eigene ID. | Gelöscht (oder schon weg) → `/bewegung`. Fehler → Meldung. | AC-10, EC-4, EC-5 |
| Detail / Durchführung | Angemeldet. | Eigenes Workout mit seinen Übungen; fremd oder unbekannt → „Nicht gefunden“. Die Durchführung speichert nichts. | AC-7, AC-8, AC-12, EC-6 |
| Datenexport (PROJ-1) | Angemeldet. | Abschnitt `customWorkouts`: ID, Name, Folge (Übung, Art, Wert), Anlage, letzte Änderung. | AC-13 |
| Konto löschen (PROJ-1) | Angemeldet. | Eigene Workouts werden mit dem Konto gelöscht. | AC-14 |

## Abhängigkeiten

- Vorhanden: Zod; shadcn `input`, `label`, `button`, `select`, `dialog`, `alert`, `alert-dialog`; `lucide-react`; `ExerciseView`, `GuidedWorkout`, `PageHeader`.
- Keine neuen Pakete. Für den Editor wird wie in den anderen Features Browser-Zustand mit Zod-Prüfung verwendet, kein Formular-Paket.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Folge als geordnete Liste in derselben Zeile wie der Name | Speichern ersetzt alles in einem Schritt (EC-1), ohne Transaktion über zwei Tabellen; Export und Lesen einfach. | Eigene Tabelle für Schritte wie bei PROJ-4 | Kein Fremdschlüssel je Schritt; die Existenz der Übungen prüft ein Trigger. | 2026-11-25 |
| Grenzen und Übungsexistenz in der Datenbank | Gilt auch bei Umgehung der App (SEC-02, SEC-03). | Nur Prüfung in App und Action | Etwas mehr Logik in der Migration. | 2026-11-25 |
| Grenze 20 per Trigger mit kurzer Sperre je Person | Garantiert EC-3 bei gleichzeitigem Anlegen auf zwei Geräten. | Zählen nur in der Server Action | Eine Sperre pro Anlegen; vernachlässigbar. | 2026-11-25 |
| ID eines neuen Workouts im Editor erzeugt | Doppeltipps auf „Speichern“ legen nie zwei Workouts an (EC-4); dieselbe Eingabe ist wiederholbar. | Nur Knopfsperre | Die ID ist schon vor dem Speichern bekannt; ohne Bedeutung, da nur eigene Zeilen lesbar sind. | 2026-11-25 |
| Ersetzen statt Feld-für-Feld | Spec verlangt „Ganzes ersetzt“ (AC-9, EC-1). | Teilaktualisierung | Gleichzeitige Änderungen werden nicht zusammengeführt (bewusst). | 2026-11-25 |
| `GuidedWorkout` nimmt Titel, Folge und Beenden-Adresse | Wiederverwendung der geführten Durchführung ohne Kopie; PROJ-4 verhält sich unverändert. | Eigene Durchführung für eigene Workouts | Kleine Änderung an einer PROJ-4-Komponente samt Seite. | 2026-11-25 |
| Seiten unter `/bewegung/eigene/…` | Bereich „Bewegung“ bleibt markiert; feste Pfade haben Vorrang vor `/bewegung/[id]`. `eigene` darf daher nie als Workout-ID verwendet werden (wie `uebungen`, Hinweis für die Inhaltspflege). | Eigene Top-Level-Route | Ein weiterer reservierter Name. | 2026-11-25 |
| Editor mit Browser-Zustand und Zod, ohne Formular-Paket | Wie die übrigen Features des Projekts; eine dynamische Liste ist mit einfachem Zustand gut abbildbar. | react-hook-form | Etwas mehr eigener Code für Feldhinweise. | 2026-11-25 |
| Zugriffsregeln verlangen eine aktive Sitzung | Gleiches Muster wie PROJ-1, PROJ-6, PROJ-7. | Nur `user_id` prüfen | Keiner. | 2026-11-25 |

## Offene Fragen

- [ ] Aus der Spec übernommen: `/dsgvo PROJ-10` (Freitext im Namen, Aufbewahrung).

## Umsetzungshinweise (/build, 2026-11-25)

- **Wechsel zwischen Sekunden und Wiederholungen** setzt den Wert auf den Standard der neuen Art (30 Sekunden bzw. 10 Wiederholungen), statt die Zahl zu übernehmen. So ist der Schritt nach dem Wechsel immer gültig.
- **Art als zwei Knöpfe:** Sekunden und Wiederholungen sind zwei große Knöpfe mit `aria-pressed` und Häkchen statt einer Auswahlliste. Das ist leichter zu treffen und per Tastatur bedienbar.
- **ID eines neuen Workouts:** Die Seite `/bewegung/eigene/neu` erzeugt sie einmal pro Aufruf auf dem Server statt im Browser. Die Wirkung ist dieselbe: Ein doppeltes „Speichern“ legt nur ein Workout an. Hydrations-Abweichungen sind so ausgeschlossen.
- **„Übung hinzufügen“** ist bei 12 Übungen gesperrt. Wird der Dialog vorher geöffnet und darüber hinaus hinzugefügt, greift der Hinweis „Höchstens 12 Übungen.“ beim Speichern.
- **Fehler beim Löschen** erscheint im Bestätigungsdialog, der dabei offen bleibt.
- **Fehlercodes der Datenbank:** `PW001` = unbekannte Übung (wird in der Folge als Hinweis „Eine Übung gibt es nicht mehr. Bitte entferne sie.“ gezeigt), `PW002` = Grenze von 20. Trifft die Grenze ein Workout, das mit derselben ID schon existiert (Doppeltipp beim 20.), gilt es als gespeichert.
- **„Nicht gefunden“ mit Status 200** wegen des gestreamten Ladezustands, wie bei PROJ-4 und PROJ-9.
- **Bau ohne Subagenten:** Die Stufen wurden nacheinander im Hauptkontext gebaut.
- **Live-Prüfung:**
  - Tabelle und Zugriff mit zwei Konten und anonym: 27/27, darunter alle ungültigen Werte, unbekannte Übung, gleiche ID, gleichzeitiges 20. Workout und Kontolöschung.
  - Seiten mit echter Sitzung: 17/17 (Übersicht, Editor, Detail, Durchführung, Bearbeiten, fremd, unbekannt und ungültig, zwei Geräte, Export, Löschen auf anderem Gerät, Kontolöschung).
  - Die Server Actions selbst und die Bedienung des Editors sind durch Action- und Komponententests belegt, nicht durch einen Browserdurchlauf.
