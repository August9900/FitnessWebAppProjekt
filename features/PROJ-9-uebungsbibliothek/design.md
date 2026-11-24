# PROJ-9 — Technisches Design: Übungsbibliothek

> Technische Umsetzung von `spec.md`. Die Übungsbibliothek ist eine reine Leseansicht über die gemeinsamen Inhalte aus PROJ-4. Sie braucht keine neue Tabelle und speichert nichts über die Person. Liste und Detail liegen als zwei Seiten unter `/bewegung/uebungen` und werden auf dem Server erzeugt. Filter sind Links mit einem Parameter in der Adresse; „Kommt vor in“ wird aus den angebotenen Workouts abgeleitet. PROJ-4 bekommt zwei kleine Ergänzungen: den Weg „Übungen nachschlagen“ und verlinkte Übungsnamen im Workout-Detail.

## Komponentenstruktur

```text
Bewegung  /bewegung  (PROJ-4)
├── … Workout-Liste (unverändert)
└── NEU: Weg „Übungen nachschlagen ›“ (zurückhaltender Link unter der Liste)

Übungen  /bewegung/uebungen?filter=ohne-ausstattung|zuhause   (Bereich „Bewegung“ bleibt markiert)
├── PageHeader „Übungen“
├── Filter (Links, gewählter mit aria-current und Häkchen): [Alle] [Ohne Ausstattung] [Passt zu meinem Zuhause]*
│   * nur wenn „Zuhause“ im Profil
├── Liste (alphabetisch): Name (Link zum Detail, Filter wird mitgegeben) · Ausstattung
└── Leer: „Keine Übung passt zu diesem Filter.“ · [Alle zeigen]

Übung  /bewegung/uebungen/[id]?filter=…
├── PageHeader: Name
├── Anleitung
├── „Leichter: <Name>“ · Anleitung der leichteren Variante
├── Ausstattung
├── Sicherheitshinweis „Hör auf deinen Körper. Bei Schmerzen hörst du auf.“
├── „Kommt vor in“: Workout-Titel (Link) · Dauer — oder „Gerade in keinem Workout.“
└── [‹ Alle Übungen] (mit dem Filter von vorher)

Workout-Detail  /bewegung/[id]  (PROJ-4)
└── NEU: Name jeder Übung ist ein Link auf /bewegung/uebungen/<Übung>
    (geführte Durchführung /bewegung/[id]/los: unverändert ohne Link)
```

- Die Seiten nutzen `PageHeader`, den Ladezustand des Bereichs (`(bereiche)/loading.tsx`) und die Fehlergrenze des geschützten Bereichs (EC-5).
- Die Filter sind normale Links und keine Knöpfe mit Zustand im Browser. Der gewählte Filter ist durch `aria-current` und ein Häkchen erkennbar, nicht nur durch Farbe (AC-6). Mit mindestens 48 px Höhe sind sie wie Schaltflächen gestaltet.
- Liste und „Kommt vor in“ sind semantische Listen. Namen und Ausstattung brechen um (EC-6).
- Keine neuen Navigationseinträge; `docs/app-shell.md` bleibt unverändert. Unterseiten von `/bewegung` markieren „Bewegung“ bereits als aktiven Bereich (PROJ-2, AC-1).

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/exercises/exercises.rules.ts` | Rein. Die Aufgaben im Einzelnen: <br>• **Filter:** `alle`, `ohne-ausstattung`, `zuhause` mit Beschriftungen. <br>• **Filter aus der Adresse lesen:** Unbekanntes ergibt `alle`; `zuhause` gilt nur, wenn „Zuhause“ zu den Profil-Orten gehört, sonst `alle` (EC-2, EC-4). <br>• **Angebotene Filter:** `zuhause` nur mit „Zuhause“ im Profil (AC-5). <br>• **Übungen filtern:** `ohne-ausstattung` heißt ohne jede Ausstattung; `zuhause` heißt, jede benötigte Ausstattung steht in der Ausstattung zuhause (AC-4, AC-5). <br>• **Sortieren:** nach Namen in deutscher Reihenfolge, Umlaute richtig einsortiert (AC-3). <br>• **Kommt vor in:** aus der Liste der angebotenen Workouts die, deren Schritte die Übung enthalten, in Angebotsreihenfolge, ohne Doppelte, mit Titel, Dauer und Adresse (AC-8, EC-3). <br>• **Adressen:** der Liste mit Filter; eines Details mit Filter. <br>• **Texte:** leerer Filter, „Gerade in keinem Workout.“, „Alle Übungen“, „Übungen nachschlagen“. | `features/workouts/workouts.rules` (Typen `Exercise`, `Workout`, `equipmentText`, `durationLabel`, `SAFETY_NOTE`); `features/profile/profile.rules` (Typ). |
| `src/features/exercises/components/exercise-library.tsx` | Darstellung der Liste (ohne Zustand, auf dem Server erzeugt): Filter-Links, alphabetische Liste mit Ausstattung, Leer-Zustand mit „Alle zeigen“. | `PageHeader`; shadcn `button`; `lucide-react` `Check`; `next/link`; Rules. |
| `src/features/exercises/components/exercise-detail.tsx` | Darstellung des Details (ohne Zustand): Name, Anleitung, leichtere Variante, Ausstattung, Sicherheitshinweis, „Kommt vor in“ oder Leer-Text, Link „Alle Übungen“. Kein Startknopf (AC-10). | `PageHeader`; shadcn `button`, `alert`; `next/link`; Rules. |
| **Änderung PROJ-4:** `src/features/workouts/workouts.data.ts` | Zwei neue Lesefunktionen: **alle Übungen** sowie **eine Übung nach ID** (oder nichts bei unbekannter oder ungültiger ID). Beide nutzen die bestehende Zeilenprüfung der Übungen; Lesefehler werfen (EC-5). | wie bisher. |
| **Änderung PROJ-4:** `src/features/workouts/components/exercise-view.tsx`, `workout-detail.tsx` | `ExerciseView` bekommt eine optionale Adresse für den Namen. Das Workout-Detail übergibt die Bibliotheksadresse der Übung, die geführte Durchführung übergibt nichts und bleibt ohne Link (AC-2). | zusätzlich `features/exercises/exercises.rules` (Adresse). |
| **Änderung PROJ-4:** `src/app/(protected)/(bereiche)/bewegung/page.tsx` | Unter der Workout-Liste der zurückhaltende Link „Übungen nachschlagen“ (AC-1). | zusätzlich `features/exercises/exercises.rules` (Text, Adresse). |
| `src/app/(protected)/(bereiche)/bewegung/uebungen/page.tsx` | Angaben der Person (Gate PROJ-3) und alle Übungen laden; Filter lesen und anwenden; `ExerciseLibrary` darstellen. | `features/exercises`, `features/workouts/workouts.data`, `features/profile/profile.data`. |
| `src/app/(protected)/(bereiche)/bewegung/uebungen/[id]/page.tsx`, `…/[id]/not-found.tsx` | Übung und angebotene Workouts parallel laden; unbekannte Übung → „Nicht gefunden“ mit Weg zur Bibliothek (EC-2); sonst `ExerciseDetail`. | wie oben. |

Abhängigkeitsrichtung: `features/exercises` benutzt die Regeln von PROJ-4. Umgekehrt beziehen die Workout-Komponenten aus `features/exercises` nur die Adresse und den Text. Ein Kreis entsteht nicht, weil `workouts.rules` `exercises.rules` nicht kennt.

## Footprint

- **Code und Tests:**
  - `src/features/exercises/exercises.rules.ts` mit Test
  - `src/features/exercises/components/exercise-library.tsx` und `exercise-detail.tsx`, jeweils mit Test
  - Änderungen mit Tests an `src/features/workouts/workouts.data.ts`, `components/exercise-view.tsx` und `components/workout-detail.tsx`
  - Seiten `bewegung/uebungen/page.tsx`, `bewegung/uebungen/[id]/page.tsx` und `not-found.tsx`; geändert wird `bewegung/page.tsx`
- **Migrationen, Tabellen und Zugriffsregeln:** keine. Gelesen werden `exercises` (für Angemeldete lesbar) sowie `workouts` und `workout_steps` (nur angebotene) aus PROJ-4.
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** neu `/bewegung/uebungen` und `/bewegung/uebungen/[id]` (Parameter `filter`). Geändert werden `/bewegung` (Link) und `/bewegung/[id]` (Übungsnamen verlinkt). Keine Navigationseinträge, keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-3 | Alphabetisch in deutscher Reihenfolge (Ä wie A). | Sortierung in den Regeln mit deutscher Vergleichsregel, unabhängig von der Datenbank-Sortierung. | Unit-Test mit „Übung“, „Unterarmstütz“, „Ausfallschritt“, „Arm …“. |
| AC-4, AC-5, EC-4 | Filter exakt nach Ausstattung, „Passt zu meinem Zuhause“ nach aktuellem Profil. | Reine Filterfunktion; das Profil wird bei jedem Aufruf frisch gelesen. | Unit-Tests: ohne Ausstattung, Teilmenge, „Nichts davon“, ohne „Zuhause“. |
| AC-6, AC-9 | Filter bleibt beim Zurückkehren erhalten. | Filter steht in der Adresse und wird in die Detail-Links und in „Alle Übungen“ übernommen. | Komponententests der Links. |
| AC-8, EC-3 | Nur angebotene Workouts, Angebotsreihenfolge, keine Doppelten. | Ableitung aus der bestehenden Abfrage der angebotenen Workouts. | Unit-Test (Übung zweimal im selben Workout, Workout nicht angeboten). |
| AC-2 | Links im Workout-Detail, nicht in der geführten Durchführung. | Optionale Adresse in `ExerciseView`, nur vom Detail übergeben. | Komponententests beider Ansichten. |
| EC-2 | Unbekannte Übung oder ungültige ID → „Nicht gefunden“; unbekannter Filter → alle. | ID-Prüfung vor der Abfrage; `notFound` der Seite; Filter-Lesefunktion. | Daten- und Regel-Tests; Live-Abruf. |
| EC-5 | Ladefehler sieht nicht wie eine leere Liste aus. | Lesefunktionen werfen; Fehlergrenze des Bereichs. | Daten-Test. |

**Fehler an den Schnittstellen:**
- **Ungültige ID** (nicht im Muster `a–z, 0–9, _`, 3–40 Zeichen): keine Abfrage, „Nicht gefunden“.
- **Keine Sitzung oder unvollständige Angaben:** Umleitung durch das Gate des Bereichs.
- **Datenbank nicht erreichbar:** Die Lesefunktion wirft, nur mit Datenbankcode; es greift die Fehlergrenze des Bereichs.
- **Eine Übungszeile passt nicht zur erwarteten Form:** Sie wird ausgelassen, statt die Seite zu brechen (wie bei Workouts).

## Datenmodell

Keine neuen Tabellen, Spalten oder Zugriffsregeln. Gelesen werden die gemeinsamen Inhalte aus PROJ-4:
- **Übung** (`exercises`): `id`, `name`, `instructions`, `easier_name`, `easier_instructions`, `equipment` (Liste aus `mat`, `dumbbells`, `resistance_band`, `pull_up_bar`, `kettlebell`; leer = ohne Ausstattung).
- **Kurzes Workout mit Schritten** (`workouts`, `workout_steps`): nur angebotene, über die bestehende Abfrage.

Aus PROJ-3 gelesen werden die Orte und die Ausstattung zuhause (`places`, `home_equipment`; `none` = nichts davon).

**Abgeleitet, nicht gespeichert:** Filterergebnis, Sortierung und „Kommt vor in“.

**Zugriff:** Übungen sind für alle Angemeldeten lesbar, Workouts und Schritte nur, wenn angeboten. Es gibt keine schreibenden Zugriffe. Personenbezogene Daten werden nur gelesen (Profilangaben für den Filter) und nirgends gespeichert oder protokolliert.

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Bibliothek öffnen | Angemeldet, Angaben vollständig. | Alle Übungen, gefiltert nach `filter`, alphabetisch; leerer Filter → Hinweis mit „Alle zeigen“. | AC-3 bis AC-6, EC-1, EC-2, EC-4 |
| Übung öffnen | wie oben. | Übung samt „Kommt vor in“; unbekannt → „Nicht gefunden“. | AC-7 bis AC-10, EC-2, EC-3 |
| Aus Bewegung / Workout-Detail | wie oben. | Link „Übungen nachschlagen“ bzw. verlinkter Übungsname. | AC-1, AC-2 |

## Abhängigkeiten

- Vorhanden: `next/link`, `next/navigation` (`notFound`); shadcn `button`, `alert`; `lucide-react`; `PageHeader`.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Keine Datenänderung; Bibliothek liest die PROJ-4-Inhalte | Die Spec verlangt nur vorhandene Merkmale; „Kommt vor in“ ergibt sich aus den Workout-Schritten. | Eigene Tabelle oder Merkmale für die Bibliothek | Keine. | 2026-11-24 |
| Lesefunktionen für Übungen im Datenmodul von PROJ-4 | Übungen gehören zu PROJ-4; dieselbe Zeilenprüfung, ein Ort pro Tabelle (wie PROJ-8 beim Aktionsverlauf). | Eigenes Datenmodul der Bibliothek | Kleine Änderung an einer PROJ-4-Datei. | 2026-11-24 |
| „Kommt vor in“ aus der bestehenden Abfrage der angebotenen Workouts | Eine erprobte Abfrage ohne N+1; berücksichtigt automatisch „nicht mehr angeboten“ (EC-3). | Eigene Abfrage über die Schritte je Übung | Lädt alle angebotenen Workouts (≈ 15) pro Detailaufruf; vernachlässigbar. | 2026-11-24 |
| Filter als Parameter in der Adresse, Filter-Links statt Zustand im Browser | Bleibt beim Zurückkehren und Neuladen erhalten (AC-6, AC-9); reine Server-Seiten. | Filter im Browser-Zustand wie die Workout-Liste | Jeder Filterwechsel lädt die Seite neu (schnell, kleine Liste). | 2026-11-24 |
| Sortierung in den Regeln mit deutscher Vergleichsregel | Gleiche Reihenfolge unabhängig von der Datenbank-Sortierung; Umlaute richtig. | Sortierung in der Abfrage | Keine. | 2026-11-24 |
| Optionale Adresse in `ExerciseView` | Eine Komponente bleibt für Detail und Durchführung zuständig; nur das Detail verlinkt (AC-2). | Eigene Namenszeile im Detail | Ein zusätzlicher Parameter an einer gemeinsamen Komponente. | 2026-11-24 |
| Bibliothek unter `/bewegung/uebungen` | Gehört zum Bereich „Bewegung“, der dadurch aktiv markiert bleibt. Feste Pfade haben Vorrang vor `/bewegung/[id]`, deshalb darf `uebungen` nie als Workout-ID verwendet werden (Hinweis für die Inhaltspflege). | Eigene Top-Level-Route | Reservierter Name im Workout-ID-Raum. | 2026-11-24 |

## Offene Fragen

- [ ] Aus der Spec übernommen: Prüfung der Übungen vor dem ersten Deploy; „Kurze Pause“ in der Bibliothek.
