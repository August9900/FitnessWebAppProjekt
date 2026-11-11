# PROJ-4 — Technisches Design: Kurze Workouts

> Technische Umsetzung von `spec.md`. Workouts und Übungen sind gemeinsame, nur lesbare Inhalte in der Datenbank; im Prototyp kommen etwa zehn Beispiel-Workouts über eine Migration ins Projekt. Ob ein Workout passt, entscheidet eine reine, nachvollziehbare Regel aus den Profilangaben von PROJ-3. Die geführte Durchführung läuft vollständig im Browser und speichert nichts.

## Komponentenstruktur

```text
Bewegung  /bewegung  (Bereich im App-Rahmen, nur mit vollständigen Angaben — Gate aus PROJ-3)
├── Kopfbereich „Bewegung“
├── Filter: Dauer (Alle · 5 Min · 10 Min · 15 Min) · Schalter „Alle Workouts anzeigen“
├── Liste der Workout-Karten
│   └── Karte: Titel · Dauer · Intensität · Orte · Ausstattung · ggf. „Beispielinhalt …“
│       └── bei „Alle anzeigen“ und nicht passend: kurzer Grund („braucht Kurzhanteln“)
└── Leer: ruhiger Hinweis + „Alle Workouts anzeigen“ bzw. „Alle Dauern anzeigen“

Workout-Detail  /bewegung/[id]
├── Kopfbereich: Titel · Hauptaktion „Los geht's“
├── Beschreibung · Dauer · Intensität · Orte · Ausstattung · ggf. „Beispielinhalt …“
├── Hinweis „Hör auf deinen Körper. Bei Schmerzen hörst du auf.“
├── Übungsfolge: je Übung Name · Sekunden oder Wiederholungen · Anleitung · Schalter „Leichter“
└── nicht vorhanden: „Dieses Workout gibt es nicht (mehr)“ + „Zu Bewegung“

Geführte Durchführung  /bewegung/[id]/los
├── „Übung X von Y“ · ggf. „Beispielinhalt …“
├── Name · Anleitung · Schalter „Leichter“
├── Timer (bei Sekunden): Restzeit · „Start“/„Pause“/„Weiter zählen“ · Ende: „Geschafft – weiter, wenn du bereit bist.“
│   oder Wiederholungen: „10 Wiederholungen“
├── „Zurück“ · „Weiter“ (auf der letzten Übung „Fertig“) · „Beenden“
└── Abschluss: „Geschafft. Gut gemacht.“ + „Zu Bewegung“
```

Alle drei Ansichten liegen im App-Rahmen von PROJ-2 und verwenden `PageHeader`, die Lade- und Fehlerzustände sowie die Navigation unverändert. Die Intensität wird als Text angezeigt („sanft“, „mittel“, „kräftig“), nicht nur als Farbe. Der Hinweis „Beispielinhalt – noch nicht fachlich geprüft“ ist ein schlichtes Textlabel (shadcn `Badge`, Variante `outline`).

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/workouts/workouts.rules.ts` | Reine Regeln: Typen für Workout, Schritt und Übung; Beschriftungen für Intensität und Dauer; Ausstattung eines Workouts (aus seinen Übungen); **Passt-Regel** mit Gründen bei Nicht-Passen (AC-2, AC-4); Filter nach Dauer; Auswahl „leichter“ aus der Adresse lesen und schreiben. | `features/profile/profile.schema` (Werte und Beschriftungen für Orte und Ausstattung), `features/profile/profile.rules` (Typ `ProfileAnswers`). |
| `src/features/workouts/timer.rules.ts` | Reine Timer-Rechnung: Restzeit aus Endzeitpunkt und Uhrzeit, Pausieren, Fortsetzen, abgelaufen? (EC-4). | Keine. |
| `src/features/workouts/workouts.data.ts` | `server-only`. Alle angebotenen Workouts mit Schritten und Übungen in einer Abfrage lesen; ein Workout per ID lesen (oder „nicht vorhanden“). Wandelt Datenbankzeilen in die Typen der Regeln um. | `src/lib/supabase/server.ts`, Rules. |
| `src/features/workouts/components/workout-list.tsx` | Client: Filter und Liste; filtert die vom Server gelieferten Workouts sofort im Browser (AC-3, AC-4, AC-5). | shadcn `tabs` oder `toggle`-artige Buttons (`button`), `switch`, `card`, `badge`; Rules. |
| `src/features/workouts/components/exercise-view.tsx` | Anzeige einer Übung (Name, Menge, Anleitung) mit Schalter „Leichter“; genutzt von Detail und geführter Ansicht (AC-7). | shadcn `switch`, `label`; Rules. |
| `src/features/workouts/components/workout-detail.tsx` | Client: Detailansicht mit Übungsfolge und „Leichter“-Auswahl; „Los geht's“ übergibt die Auswahl an die geführte Ansicht. | `exercise-view`, `components/shell/page-header`, shadcn `button`, `badge`. |
| `src/features/workouts/components/guided-workout.tsx` | Client: geführte Durchführung mit Schrittzustand, Timer, Ansage für Screenreader, Schutz gegen Mehrfachtippen, Abschluss (AC-8 bis AC-11, EC-3 bis EC-6). | `exercise-view`, `timer.rules`, shadcn `button`, `alert`. |
| `src/features/workouts/components/sample-content-badge.tsx` | Hinweis „Beispielinhalt – noch nicht fachlich geprüft“ (AC-12). | shadcn `badge`. |
| `src/app/(protected)/(bereiche)/bewegung/page.tsx` | Ersetzt den Platzhalter aus PROJ-2: lädt Workouts und Profilangaben (`requireCompletedProfile`), berechnet „passt / Grund“ auf dem Server, übergibt an die Liste. | `features/workouts`, `features/profile`. |
| `src/app/(protected)/(bereiche)/bewegung/[id]/page.tsx` | Detailseite; unbekannte ID → `not-found` dieses Segments. | `features/workouts`. |
| `src/app/(protected)/(bereiche)/bewegung/[id]/not-found.tsx` | „Dieses Workout gibt es nicht (mehr)“ mit Link „Zu Bewegung“ (EC-2). | `page-header`, shadcn `button`. |
| `src/app/(protected)/(bereiche)/bewegung/[id]/los/page.tsx` | Geführte Ansicht; liest Workout und Auswahl „leichter“ aus der Adresse. | `features/workouts`. |

Die Seiten liegen in der Gruppe `(bereiche)` und erben damit Sitzungsprüfung, Gate für vollständige Angaben, App-Rahmen, Lade- und Fehlerzustand.

## Footprint

- **Code und Tests:** `src/features/workouts/**` mit Tests neben den Modulen; drei Seiten und eine `not-found.tsx` unter `src/app/(protected)/(bereiche)/bewegung/`; die bisherige Platzhalterseite `bewegung/page.tsx` wird ersetzt.
- **Migrationen, Tabellen und Zugriffsregeln:** `supabase/migrations/<Zeitstempel>_workouts.sql` (Tabellen `exercises`, `workouts`, `workout_steps`, Prüfregeln, RLS nur lesend) und `supabase/migrations/<Zeitstempel>_workouts_sample_content.sql` (Beispielinhalte).
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen. shadcn `badge`, `switch`, `card`, `button`, `alert`, `label` sind vorhanden.
- **Routen, Rahmen und externe Dienste:** `/bewegung` (ersetzt Platzhalter), `/bewegung/[id]`, `/bewegung/[id]/los`; keine neuen Navigationseinträge; keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-2, AC-4 | Passt-Regel exakt wie in der Spec, mit Grund bei Nicht-Passen. | Eine reine Funktion in `workouts.rules.ts`, die der Server für jedes Workout aufruft. | Unit-Tests mit Kombinationen aus Orten, Ausstattung und Erfahrung. |
| AC-3 | Filter wirkt sofort. | Alle angebotenen Workouts (≈ 10) werden einmal geladen; der Filter läuft im Browser ohne neue Anfrage. | UI-Test: Filter ändert die Liste ohne Server-Aufruf. |
| EC-4 | Timer stimmt nach Hintergrund/Bildschirm aus. | Der Timer merkt sich den **Endzeitpunkt** statt Sekunden zu zählen; die Anzeige berechnet die Restzeit aus der aktuellen Uhrzeit, auch beim Zurückkehren auf die Seite. | Unit-Test der Timer-Rechnung mit vorgespulter Uhrzeit. |
| EC-5 | Mehrfachtippen überspringt nichts unbemerkt. | Nach jedem Wechsel nimmt „Weiter“ 400 ms lang keine weitere Eingabe an; jeder angenommene Tipp rückt genau eine Übung vor. | UI-Test mit schnellen Doppelklicks. |
| EC-6 | Bei reduzierter Bewegung nur eine Zahl. | Der Timer zeigt grundsätzlich nur Zahl und Text; es gibt keine Kreis- oder Balkenanimation (auch nicht ohne Reduktion). | UI-Test: keine animierten Elemente. |
| AC-14 | Inhalte für Nutzende nur lesbar. | RLS erlaubt angemeldeten Personen nur das Lesen; Anlegen, Ändern, Löschen sind für `anon` und `authenticated` entzogen. | Live-Prüfung über die öffentliche Schnittstelle mit Schreibversuchen. |
| AC-13 | Mindestumfang der Beispielinhalte. | Die Inhalts-Migration enthält die geforderte Abdeckung. | Test, der die Abdeckung gegen die lokale Datenbank zählt. |

**Fehler an den Schnittstellen:**
- **Workouts können nicht geladen werden:** Die Seite wirft; die Fehlergrenze aus PROJ-2 zeigt „Da ist etwas schiefgelaufen“ mit „Erneut versuchen“.
- **Unbekannte oder nicht mehr angebotene ID:** `notFound()` → eigene Ansicht „Dieses Workout gibt es nicht (mehr)“ (EC-2), kein Fehlerprotokoll.
- **Ungültige Auswahl „leichter“ in der Adresse** (z. B. Positionen, die es nicht gibt): wird stillschweigend ignoriert.
- **Abbruch der geführten Ansicht:** kein Fehler; es gibt nichts zu speichern (EC-3).

## Datenmodell

Drei Tabellen gemeinsamer Inhalte. Sie gehören niemandem persönlich, enthalten keine personenbezogenen Daten und werden vom Team über Migrationen gepflegt.

**Übung `exercises`**
- `id` — Text, Kurzname wie `wall_push_up`, Kleinbuchstaben/Ziffern/Unterstrich, 3–40 Zeichen, Primärschlüssel.
- `name` — Text, 2–60 Zeichen, Pflicht.
- `instructions` — Text, 10–300 Zeichen, Pflicht (höchstens drei kurze Sätze).
- `easier_name` — Text, 2–60 Zeichen, Pflicht (Name der leichteren Variante).
- `easier_instructions` — Text, 10–300 Zeichen, Pflicht.
- `equipment` — Liste von Texten, darf leer sein (= keine Ausstattung); nur Werte aus `mat`, `dumbbells`, `resistance_band`, `pull_up_bar`, `kettlebell` (dieselben Codes wie in PROJ-3, ohne `none`); keine Doppelten.
- `created_at`, `updated_at` — Zeitpunkte.

**Workout `workouts`**
- `id` — Text, Kurzname wie `morgen_mobil_5`, gleiche Regeln wie oben, Primärschlüssel; erscheint in der Adresse.
- `title` — Text, 2–60 Zeichen, Pflicht.
- `description` — Text, 10–240 Zeichen, Pflicht.
- `duration_minutes` — ganze Zahl, genau 5, 10 oder 15.
- `intensity` — Text, genau `gentle` („sanft“), `moderate` („mittel“) oder `vigorous` („kräftig“).
- `places` — Liste von Texten, mindestens ein Eintrag, nur `home`, `outdoors`, `gym`, keine Doppelten.
- `review_status` — Text, genau `unreviewed` oder `reviewed`; Standard `unreviewed`.
- `is_offered` — Wahrheitswert, Standard wahr; nicht angebotene Workouts sind unsichtbar (EC-2).
- `sort_order` — ganze Zahl ≥ 0, bestimmt die Reihenfolge in der Liste.
- `created_at`, `updated_at` — Zeitpunkte.

**Workout-Schritt `workout_steps`**
- `workout_id` — verweist auf ein Workout; wird mit dem Workout gelöscht.
- `position` — ganze Zahl 1–30; Reihenfolge; zusammen mit `workout_id` eindeutig (Primärschlüssel).
- `exercise_id` — verweist auf eine Übung; eine Übung kann nicht gelöscht werden, solange ein Schritt sie nutzt.
- `mode` — Text, genau `time` (Sekunden) oder `reps` (Wiederholungen).
- `amount` — ganze Zahl; bei `time` 10–300 Sekunden, bei `reps` 1–50 Wiederholungen.

**Abgeleitet, nicht gespeichert:** Die benötigte Ausstattung eines Workouts ist die Vereinigung der Ausstattung seiner Übungen. So können Workout und Übungen nicht widersprüchlich werden.

**Passt-Regel (AC-2)**, für eine Person mit Angaben aus PROJ-3:
1. **Ort:** passt, wenn mindestens einer gilt — `home` in den Orten der Person und des Workouts **und** jede benötigte Ausstattung ist in ihrer Ausstattung zuhause (bei „Nichts davon“ nur Workouts ohne Ausstattung); `outdoors` in beiden; `gym` in beiden.
2. **Intensität:** `beginner` → nur `gentle`; `occasional` → `gentle` oder `moderate`; `regular` → alle.
3. **Grund bei Nicht-Passen (AC-4),** höchstens einer, in dieser Reihenfolge: „nur im Fitnessstudio“ / „nur draußen“ / „nur zuhause“ (kein gemeinsamer Ort) → „braucht <Ausstattung>“ (nur zuhause möglich, Ausstattung fehlt; mehrere mit „und“) → „<Intensität> Intensität“.

**Zugriff:** Lesen dürfen nur angemeldete Personen; bei `workouts` nur Einträge mit `is_offered = wahr`. Schritte und Übungen sind lesbar, Schritte nicht angebotener Workouts sind über die Workout-Regel ohnehin nicht erreichbar. Anlegen, Ändern und Löschen sind für `anon` und `authenticated` nicht erlaubt. Nicht angemeldete Besucher lesen nichts.

**Aufbewahrung:** Inhalte bleiben, bis das Team sie über eine neue Migration ändert oder aus dem Angebot nimmt (`is_offered = falsch`).

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Übersicht laden | Angemeldet, Angaben vollständig (Gate PROJ-3). Liest alle angebotenen Workouts samt Schritten und Übungen in einer Abfrage, dazu die eigenen Angaben. | Liste mit „passt“ und Grund je Workout, sortiert nach `sort_order`; Filter im Browser. | AC-1 bis AC-5, EC-1 |
| Detail laden | Wie oben, ein Workout per ID. | Detailansicht oder „gibt es nicht (mehr)“. | AC-6, AC-7, AC-12, EC-2 |
| Geführte Durchführung | Wie oben; Auswahl „leichter“ kommt als Positionsliste in der Adresse mit (`?leichter=2,4`), sonst keine Daten. | Läuft vollständig im Browser; nichts wird gesendet oder gespeichert. | AC-8 bis AC-11, EC-3 bis EC-6 |
| Inhalte ändern | Niemand über die App; das Team über eine neue Migration. | Direkte Schreibanfragen werden von der Datenbank abgelehnt. | AC-14 |

**Geführte Ansicht im Detail:**
- **Zustand:** aktuelle Position, Auswahl „leichter“ je Position, Timer (Endzeitpunkt oder pausierte Restzeit), Abschluss erreicht ja/nein — alles nur im Browser.
- **Timer:** startet erst auf „Start“; Pause friert die Restzeit ein; „Weiter zählen“ setzt einen neuen Endzeitpunkt; bei Restzeit 0 erscheint der Hinweis „Geschafft – weiter, wenn du bereit bist.“ — kein automatischer Wechsel. Die Anzeige aktualisiert sich etwa viermal pro Sekunde und sofort, wenn die Seite wieder sichtbar wird.
- **Wechsel der Übung** setzt den Timer zurück. „Zurück“ auf die vorige Übung zeigt deren Timer wieder auf voller Länge.
- **Screenreader:** Ein unauffälliger Ansagebereich meldet „Übung X von Y: <Name>“ beim Wechsel und „Zeit abgelaufen“ am Timer-Ende — nicht jede Sekunde.
- **„Beenden“** führt ohne Rückfrage zur Detailansicht (AC-10). Neu laden oder erneut starten beginnt bei Übung 1 (EC-3).

## Beispielinhalte (Prototyp)

Die Inhalts-Migration legt etwa 25 einfache Übungen (Körpergewicht, Matte, Kurzhanteln, Widerstandsband, Klimmzugstange, Kettlebell, eine „Kurze Pause“) mit je einer leichteren Variante an, dazu mindestens 10 Workouts mit `review_status = unreviewed`. Abdeckung (AC-13): je mindestens ein Workout mit 5, 10 und 15 Minuten; je mindestens eines für zuhause, draußen und Studio; zuhause ohne Ausstattung sowie mit Matte, Kurzhanteln und Widerstandsband; je mindestens eines sanft, mittel und kräftig. Die Inhalte sind allgemein gehalten, ohne medizinische Versprechen, und tragen in der App den Hinweis „Beispielinhalt – noch nicht fachlich geprüft“.

## Abhängigkeiten

- `@supabase/ssr` (vorhanden).
- shadcn `badge`, `switch`, `card`, `button`, `alert`, `label` (vorhanden).
- Bausteine aus PROJ-2 (`page-header`, App-Rahmen, Lade- und Fehlerzustand) und Daten aus PROJ-3 (`requireCompletedProfile`, Werte für Orte und Ausstattung).
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Inhalte als Tabellen in Postgres, Pflege über Migrationen | Laut Datenmodell gemeinsame Inhalte; PROJ-6 kann per Fremdschlüssel auf Workouts verweisen, PROJ-9 nutzt dieselben Übungen; Migrationen erreichen später auch die Produktion. | Inhalte als Daten-Datei im Code | Jede inhaltliche Änderung braucht eine neue Migration, bis es eine Redaktionsoberfläche gibt. | 2026-11-11 |
| Leichtere Variante als Felder der Übung (1:1) | Jede Übung hat genau eine leichtere Variante (AC-7, AC-13); keine eigene Tabelle nötig. | Eigene Tabelle für Varianten | Mehr als eine Variante je Übung wäre eine Schemaänderung. | 2026-11-11 |
| Ausstattung eines Workouts wird aus seinen Übungen abgeleitet | Kein Widerspruch zwischen Workout- und Übungsangaben möglich. | Ausstattung zusätzlich am Workout speichern | Etwas Rechenarbeit beim Laden (bei ≈ 10 Workouts vernachlässigbar). | 2026-11-11 |
| Prüfstatus `review_status` am Workout | Fachleute prüfen ein Workout als Ganzes mit seinen Übungen; der Hinweis (AC-12) hängt direkt daran. | Prüfstatus an jeder Übung | Eine geprüfte Übung in einem ungeprüften Workout wird weiterhin als Beispielinhalt markiert. | 2026-11-11 |
| Passt-Regel als reine Funktion, auf dem Server ausgewertet | Nachvollziehbar, testbar, PRD verlangt nachvollziehbare Regeln; PROJ-6 kann dieselbe Funktion nutzen. | Regel in der Datenbank (Abfrage mit Bedingungen) | Alle angebotenen Workouts werden geladen und in der App gefiltert; bei sehr vielen Inhalten müsste das in die Datenbank wandern. | 2026-11-11 |
| Filter im Browser statt über die Adresse | Wirkt sofort ohne Seitenwechsel (AC-3); die Datenmenge ist klein. | Filter als Adressparameter mit Server-Neuladen | Der Filterzustand geht beim Neuladen verloren. | 2026-11-11 |
| Timer über Endzeitpunkt statt Sekundenzähler | Bleibt richtig, wenn der Browser den Tab im Hintergrund drosselt (EC-4). | Intervall zählt Sekunden herunter | Keine. | 2026-11-11 |
| Geführte Ansicht ohne Speichern, „leichter“ über die Adresse | PROJ-4 speichert nichts (Spec); die Adresse trägt nur Positionsnummern, keine Personendaten. | Auswahl im Gerätespeicher | Nach „Beenden“ und Neustart ist die Auswahl weg, wenn man nicht über die Detailansicht geht. | 2026-11-11 |
| Sperre von 400 ms nach jedem Übungswechsel | Doppeltipps überspringen keine Übung unbemerkt (EC-5). | Keine Sperre | Sehr schnelle, bewusste Tipps werden kurz ignoriert. | 2026-11-11 |
| Vor dem Deploy: Lesen nur noch für `reviewed`-Workouts | PRD: ungeprüfte Inhalte nicht öffentlich. Umsetzung als eigene Migration vor dem ersten Deploy, nicht schon im Prototyp. | Schon jetzt filtern | Im Prototyp sind ungeprüfte Inhalte sichtbar (mit Hinweis). | 2026-11-11 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: Migration, die das Lesen auf `review_status = reviewed` beschränkt, und fachliche Prüfung aller Inhalte (siehe `spec.md`).
