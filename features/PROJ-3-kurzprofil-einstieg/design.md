# PROJ-3 — Technisches Design: Kurzprofil & Einstieg

> Technische Umsetzung von `spec.md`. Die Angaben ergänzen das bestehende Kurzprofil aus PROJ-1 (`profiles`). Der Einstieg ist eine eigene, ruhige Seite außerhalb des App-Rahmens aus PROJ-2. Die Bereiche Heute, Bewegung, Essen und Wochenblick öffnen sich erst nach vollständigen Angaben.

## Komponentenstruktur

```text
Einstieg  /einstieg  (angemeldet, ohne App-Navigation)
├── Kopf: PULSE-Marke · „Konto verwalten“ (→ /profil) · „Abmelden“
├── Fortschritt „Frage X von Y“ (Y = 5, oder 4 ohne „Zuhause“)
├── Genau eine Frage
│   ├── 1 Ziel ───────── eine Auswahl aus 5
│   ├── 2 Erfahrung ──── eine Auswahl aus 3
│   ├── 3 Orte ───────── mindestens eine aus 3
│   ├── 4 Ausstattung ── nur mit „Zuhause“: mindestens eine aus 5 oder „Nichts davon“
│   └── 5 Essensweise ── eine Auswahl aus 3
├── Hinweis direkt an der Frage, wenn noch nichts gewählt ist
├── Fehlermeldung + „Erneut versuchen“, wenn Speichern scheitert (Auswahl bleibt)
└── „Zurück“ · „Weiter“ bzw. auf der letzten Frage „Fertig“
    └── danach kurze Bestätigung „Danke, das reicht schon.“ und weiter zu „Heute“

Geschützter Bereich (App-Rahmen aus PROJ-2)
├── Heute · Bewegung · Essen · Wochenblick ── nur mit vollständigen Angaben, sonst → /einstieg
└── Profil ── immer erreichbar
    ├── Konto (PROJ-1), Darstellung (PROJ-2)
    └── Neu: „Meine Angaben“
        ├── vollständig: Formular mit allen fünf Angaben, vorausgefüllt, „Speichern“ + Bestätigung
        └── unvollständig: Hinweis „Deine Angaben sind noch nicht vollständig“ + Link „Einstieg fortsetzen“
```

Die Antwortmöglichkeiten sind große Auswahlflächen: einfache Auswahl über shadcn `RadioGroup`, Mehrfachauswahl über shadcn `Checkbox`, jeweils ganz anklickbar und per Tastatur bedienbar. Es gibt keine Freitextfelder.

**Reihenfolge und Fortschritt:** Die Fragen kommen immer in der Reihenfolge Ziel, Erfahrung, Orte, Ausstattung, Essensweise. Die Ausstattungsfrage erscheint nur, wenn „Zuhause“ unter den Orten ist. „Y“ in „Frage X von Y“ wird aus den aktuellen Antworten berechnet und kann sich also ändern, sobald „Zuhause“ gewählt oder abgewählt wird.

**Fortsetzen nach Unterbrechung (EC-1):** Beim Öffnen von `/einstieg` ermittelt der Server die erste unbeantwortete Frage und beginnt dort. Die bereits gespeicherten Antworten sind vorausgewählt, auch beim Zurückgehen.

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/profile/profile.schema.ts` | Erlaubte Werte und deutsche Beschriftungen aller Angaben. Zod-Schemas für eine einzelne Antwort (je nach Frage) und für das vollständige Profil-Formular, mit den Regeln „Nichts davon schließt andere aus“ und „Ausstattung nur mit Zuhause“. | Zod (rein). |
| `src/features/profile/profile.rules.ts` | Reine Regeln: Liste der zu stellenden Fragen für gegebene Antworten, erste unbeantwortete Frage, „vollständig?“, Bereinigung (Ausstattung entfällt ohne „Zuhause“). | Schema-Modul (rein). |
| `src/features/profile/profile.data.ts` | `server-only`. Eigene Angaben lesen, eine einzelne Antwort speichern, alle Angaben zusammen speichern, `requireCompletedProfile` (Weiterleitung zum Einstieg). Alle Zugriffe laufen mit der Sitzung der Person durch RLS. | `src/lib/supabase/server.ts`, `features/account/account.data` (`requireUser`), Rules. |
| `src/features/profile/profile.actions.ts` | Server-Actions: `saveOnboardingAnswer` (eine Frage), `finishOnboarding` (letzte Frage + Weiterleitung), `updateProfileAnswers` (Profil-Formular). Jede prüft Sitzung und Eingabe auf dem Server. | Schema, Rules, Data. |
| `src/features/profile/components/onboarding-flow.tsx` | Client: der Einstieg mit Schrittzustand, Zurück/Weiter, Fortschritt, Hinweisen und Fehlermeldungen. | shadcn `radio-group`, `checkbox`, `button`, `alert`, `label`; Actions; Rules. |
| `src/features/profile/components/answers-form.tsx` | Client: Abschnitt „Meine Angaben“ im Profil (gleiche Auswahlflächen, ein Speichern-Knopf). | wie oben. |
| `src/features/profile/components/answer-options.tsx` | Gemeinsame Auswahlflächen für Einzel- und Mehrfachauswahl, genutzt von Einstieg und Profil-Formular. | shadcn `radio-group`, `checkbox`, `label`. |
| `src/app/(einstieg)/layout.tsx` | Eigene Route-Gruppe ohne App-Rahmen: Sitzung prüfen (`requireUser`), schlichter Kopf mit Marke, „Konto verwalten“, „Abmelden“. | `features/account`, `components/shell/brand-mark`. |
| `src/app/(einstieg)/einstieg/page.tsx` | Lädt die Angaben. Sind sie vollständig, geht es zu `/heute` (EC-4), sonst startet der Einstieg bei der ersten offenen Frage. | `features/profile`. |
| `src/app/(protected)/(bereiche)/layout.tsx` | Neue verschachtelte Route-Gruppe, die nur `requireCompletedProfile` ausführt. Die Seiten `heute`, `bewegung`, `essen` und `wochenblick` ziehen hierher um; ihre Adressen bleiben gleich. | `features/profile`. |
| `src/app/(protected)/profil/page.tsx` | Abschnitt „Meine Angaben“ einfügen. | `features/profile/components/answers-form`. |
| `src/features/account/account.data.ts`, `account.rules.ts` (PROJ-1) | Der Export liest und schreibt die neuen Felder mit (AC-15). | — |
| `src/proxy.ts` (PROJ-1/2) | `/einstieg` zu den geschützten Pfaden hinzufügen. | — |

Die Bereiche-Gruppe `(bereiche)` liegt innerhalb von `(protected)` und erbt damit Sitzungsprüfung, App-Rahmen sowie Lade- und Fehlerzustand. Das Profil liegt außerhalb von `(bereiche)` und bleibt deshalb auch mit unvollständigen Angaben erreichbar (AC-10).

## Footprint

- **Code und Tests:** `src/features/profile/**` mit Tests neben den Modulen; `src/app/(einstieg)/**`; `src/app/(protected)/(bereiche)/layout.tsx`, dazu das Umziehen der vier Bereichsseiten dorthin; Ergänzungen in `profil/page.tsx`, `account.data.ts`, `account.rules.ts` und `proxy.ts` samt deren Tests.
- **Migrationen, Tabellen und Zugriffsregeln:** eine neue Migration `supabase/migrations/<Zeitstempel>_profile_answers.sql`. Sie ergänzt `profiles` um fünf Spalten mit Prüfregeln und fügt eine Änderungsregel (RLS), spaltengenaue Änderungsrechte und die automatische Pflege von `updated_at` hinzu.
- **Namen der Umgebungsvariablen:** keine neuen.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** neue Route `/einstieg` außerhalb des App-Rahmens; neue Route-Gruppe `(bereiche)` ohne Änderung der Adressen; Abschnitt „Meine Angaben“ im Profil. Externe Dienste gibt es keine.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-11 | Höchstens 5 Fragen, keine Texteingabe, jede auf einem Bildschirm. | Die Fragenliste in `profile.rules.ts` ist die einzige Quelle; der Einstieg rendert nur Auswahlflächen. | Unit-Test der Fragenliste (4 bzw. 5); UI-Test ohne Texteingabefeld. |
| EC-1 | Fortsetzen nach Unterbrechung bei der ersten offenen Frage. | Jede Antwort wird beim „Weiter“ sofort gespeichert. Die Startfrage berechnet der Server aus den gespeicherten Antworten. | Unit-Test „erste offene Frage“; Live-Prüfung: Antworten teilweise speichern, Seite neu laden. |
| EC-2 | Gleichzeitige Änderungen auf zwei Geräten: die zuletzt gespeicherte Fassung gilt vollständig. | Das Profil-Formular schreibt alle fünf Angaben in **einer** Änderung derselben Zeile; die Datenbank ändert eine Zeile immer als Ganzes. | Live-Prüfung mit zwei aufeinanderfolgenden Speicherungen. |
| EC-3 | Mehrfaches Tippen auf „Fertig“ speichert einmal und leitet einmal weiter. | Der Knopf ist gesperrt, solange die Anfrage läuft. Das Speichern ist wiederholbar ohne Nebenwirkung: derselbe Wert wird nur erneut gesetzt, und eine Weiterleitung nach `/heute` ist bei vollständigen Angaben immer korrekt. | UI-Test: Knopf während der Anfrage gesperrt. |
| EC-5, AC-16 | Ungültige Werte oder fremde Zeilen werden abgelehnt, auch bei direkter Datenanfrage. | Zod in jeder Action **und** Prüfregeln in der Datenbank. RLS erlaubt nur das Ändern der eigenen Zeile mit aktiver Sitzung, und nur die fünf Angabenspalten sind änderbar. | Live-Prüfung direkt gegen die Datenbank mit ungültigen Werten, fremder Zeile und geschützter Spalte. |

**Fehler an den Schnittstellen:**
- **Ungültige Eingabe (erwartbar):** Die Action liefert einen Feldfehler. Die Frage bleibt stehen, und der Hinweis erscheint direkt an der Frage (AC-8). Es wird nichts gespeichert.
- **Keine Sitzung:** `requireUser` leitet zur Anmeldung um, wie in PROJ-1.
- **Datenbank nicht erreichbar oder Speichern abgelehnt:** Es erscheint „Deine Antwort konnte gerade nicht gespeichert werden. Bitte versuche es erneut.“ mit „Erneut versuchen“. Die Auswahl bleibt im Formular (AC-17). Ein automatischer erneuter Versuch findet nicht statt. Protokolliert wird einmal, mit Fehlercode, ohne Antworten.
- **Unerwarteter Fehler beim Laden:** Die Fehlergrenze zeigt ihre Meldung. Für `/einstieg` ist das die Standard-Fehlerseite von Next.js, für das Profil die Fehlergrenze aus PROJ-2.

## Datenmodell

Erweiterung der Tabelle `profiles` (eine Zeile je Konto, angelegt in PROJ-1). Alle neuen Felder sind zunächst leer und werden einzeln gefüllt.

| Feld | Typ und erlaubte Werte | Bedeutung (Beschriftung) |
| --- | --- | --- |
| `goal` | Text oder leer; genau einer von `move_more`, `fitness`, `strength`, `eat_better`, `wellbeing` | „Mich mehr bewegen“, „Fitter und ausdauernder werden“, „Kräftiger werden“, „Besser essen“, „Mich insgesamt wohler fühlen“ |
| `experience` | Text oder leer; genau einer von `beginner`, `occasional`, `regular` | „Ich fange gerade an“, „Ich bewege mich ab und zu“, „Ich trainiere regelmäßig“ |
| `places` | Liste von Texten oder leer; wenn gesetzt, mindestens ein Eintrag, nur aus `home`, `outdoors`, `gym`, ohne Doppelte | „Zuhause“, „Draußen“, „Fitnessstudio“ |
| `home_equipment` | Liste von Texten oder leer; wenn gesetzt, mindestens ein Eintrag, nur aus `mat`, `dumbbells`, `resistance_band`, `pull_up_bar`, `kettlebell`, `none`, ohne Doppelte; `none` steht immer allein | „Matte“, „Kurzhanteln“, „Widerstandsband“, „Klimmzugstange“, „Kettlebell“, „Nichts davon“ |
| `diet` | Text oder leer; genau einer von `omnivore`, `vegetarian`, `vegan` | „Ich esse alles“, „Vegetarisch“, „Vegan“ |

**Regel über mehrere Felder (in der Datenbank geprüft):** `home_equipment` darf nur gesetzt sein, wenn `places` den Eintrag `home` enthält. Fehlt `home`, muss das Feld leer sein (AC-14, EC-5).

**Vollständig** sind die Angaben, wenn `goal`, `experience`, `places` und `diet` gesetzt sind und, falls `places` den Eintrag `home` enthält, auch `home_equipment`. „Vollständig“ wird jedes Mal aus den Feldern berechnet und nicht extra gespeichert. Das Profil-Formular kann nur vollständige Angaben speichern, deshalb wird ein einmal vollständiges Profil nie wieder unvollständig, und der Einstieg erscheint nicht erneut (AC-9, EC-4).

**`updated_at`** wird bei jeder Änderung automatisch auf den aktuellen Zeitpunkt gesetzt.

**Zugriff:**
- **Lesen:** wie bisher nur die eigene Zeile mit aktiver Sitzung (Regel aus PROJ-1).
- **Ändern (neu):** nur die eigene Zeile mit aktiver Sitzung, und nur die Spalten `goal`, `experience`, `places`, `home_equipment` und `diet`. `user_id`, `age_band_at_signup`, `created_at` und `updated_at` bleiben für Nutzende unveränderbar.
- **Anlegen und Löschen:** weiterhin nicht durch Nutzende. Die Zeile entsteht mit dem Konto und verschwindet mit ihm.

**Aufbewahrung:** Die Angaben werden ersetzt, sobald die Person sie ändert, und mit dem Konto gelöscht (Löschweitergabe aus PROJ-1). Es gibt keinen Änderungsverlauf.

**Export (AC-15):** Der Abschnitt `profile` im Export aus PROJ-1 enthält zusätzlich `goal`, `experience`, `places`, `homeEquipment` und `diet` als gespeicherte Werte. Leere Felder werden als `null` ausgegeben.

## Abläufe und Zugriffe

| Ablauf | Zugang und Prüfung | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Bereich öffnen (Heute, Bewegung, Essen, Wochenblick) | Sitzung wie in PROJ-1; danach `requireCompletedProfile`. | Bei unvollständigen Angaben Weiterleitung nach `/einstieg`. | AC-1, EC-6 |
| Einstieg öffnen | Nur mit Sitzung. | Bei vollständigen Angaben Weiterleitung nach `/heute` (EC-4); sonst Start bei der ersten offenen Frage mit vorausgewählten Antworten. | AC-2, EC-1, EC-4 |
| Antwort speichern („Weiter“) | Nur mit Sitzung; Zod prüft Frage und Wert. Bei `places` ohne `home` wird `home_equipment` im selben Schritt geleert. `home_equipment` ohne `home` wird abgelehnt. | Gespeichert, danach nächste Frage; bei Fehler Hinweis bzw. „Erneut versuchen“. | AC-3 bis AC-8, AC-17, EC-5 |
| Einstieg abschließen („Fertig“) | Wie oben für die letzte Frage, danach Prüfung auf „vollständig“. | Vollständig: Bestätigung und Weiterleitung nach `/heute`. Fehlt noch etwas, z. B. weil eine Frage auf einem anderen Gerät geändert wurde: zurück zur ersten offenen Frage. | AC-9, EC-3 |
| Angaben im Profil ändern | Nur mit Sitzung; Zod prüft das vollständige Formular (inklusive Ausstattung bei „Zuhause“). | Alle fünf Felder werden in einer Änderung gespeichert; Bestätigung „Gespeichert.“ neben dem Abschnitt; bei Fehler Meldung und „Erneut versuchen“, das Formular behält die Auswahl. | AC-12 bis AC-14, AC-17, EC-2 |
| Daten exportieren / Konto löschen | Unverändert aus PROJ-1. | Der Export enthält die Angaben; die Löschung entfernt sie mit der Zeile. | AC-15 |

## Abhängigkeiten

- `zod`, `@supabase/ssr` (vorhanden).
- shadcn `radio-group`, `checkbox`, `label`, `button`, `alert` (vorhanden).
- Bausteine aus PROJ-2: `brand-mark`, `page-header`.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Angaben als Spalten im bestehenden `profiles` statt eigener Tabelle | Das Kurzprofil ist laut Datenmodell ein Ding je Konto; RLS, Löschweitergabe und Export aus PROJ-1 gelten sofort mit. | Eigene Tabelle `profile_answers` | `profiles` wächst mit jedem weiteren Profilfeld. | 2026-11-11 |
| Prüfregeln für Werte und Felderkombinationen auch in der Datenbank | Direkte Datenanfragen mit dem öffentlichen Schlüssel umgehen die App; nur die Datenbank lehnt sie dann noch ab (EC-5). | Nur Zod in den Actions | Erlaubte Werte stehen an zwei Stellen und müssen gemeinsam geändert werden. | 2026-11-11 |
| Spaltengenaue Änderungsrechte zusätzlich zur RLS-Regel | RLS entscheidet über Zeilen, nicht über Spalten; ohne Spaltenrechte könnte jemand die eigene Altersgruppe überschreiben. | Nur RLS | Jede neue änderbare Spalte braucht eine eigene Freigabe. | 2026-11-11 |
| „Vollständig“ wird berechnet statt als Zeitpunkt gespeichert | Weniger gespeicherte Daten; das Profil-Formular verhindert ohnehin unvollständige Angaben. | Spalte `onboarding_completed_at` | Ein späteres neues Pflichtfeld würde den Einstieg für alle wieder öffnen. Das wäre dann eine bewusste `/refine`-Entscheidung. | 2026-11-11 |
| Speichern pro Frage im Einstieg, aller fünf Felder auf einmal im Profil | Pro Frage: Fortsetzen nach Unterbrechung (EC-1). Im Profil: eine Änderung je Speichern ergibt „zuletzt gespeichert gilt vollständig“ (EC-2). | Alles erst am Ende des Einstiegs speichern | Mehr kleine Anfragen im Einstieg. | 2026-11-11 |
| Gate über die verschachtelte Route-Gruppe `(bereiche)` | Server-Layouts kennen den Pfad nicht. Eine eigene Gruppe trennt Bereiche und Profil ohne Datenbankabfrage im Proxy bei jeder Anfrage. | Prüfung im Proxy; Prüfung in jeder Seite | Vier Seiten ziehen in einen neuen Ordner um (Adressen bleiben). | 2026-11-11 |
| Einstieg als eigene Route-Gruppe `(einstieg)` ohne App-Rahmen | AC-10 verlangt keine Navigation; ein eigener schlichter Kopf hält Abmelden und Konto erreichbar. | Einstieg im App-Rahmen mit ausgeblendeter Navigation | Ein zweiter, schlichter Seitenkopf neben dem App-Rahmen; in `docs/app-shell.md` als Muster festgehalten. | 2026-11-11 |
| Fortschritt „Frage X von Y“ mit dynamischem Y | Ohne „Zuhause“ entfällt die Ausstattungsfrage; eine feste „5“ würde eine nie kommende Frage versprechen. | Immer „von 5“ und Ausstattung überspringen | Y kann sich während des Einstiegs ändern. | 2026-11-11 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-3` (siehe `spec.md`).
