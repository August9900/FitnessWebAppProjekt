# PROJ-7 — Technisches Design: Abschlussfeedback

> Technische Umsetzung von `spec.md`. Nach „Geschafft“ erscheinen in der bestehenden Bestätigungskarte auf „Heute“ zwei freiwillige Ein-Tipp-Fragen. Jede Antwort wird sofort gespeichert – nur für die jeweilige Person, genau eine Rückmeldung pro Aktion. Zwei Signale daraus fließen in die Auswahlregel aus PROJ-6: „Lieber nicht“ sortiert einen Inhalt ganz nach hinten, die jüngste Aufwand-Rückmeldung zu einem Workout verschiebt 14 Tage lang die angestrebte Intensität um eine Stufe. PROJ-7 ändert dafür gezielt Dateien von PROJ-6 (Regel, Vorschlag, Bestätigungskarte, Seite) und den Export aus PROJ-1.

## Komponentenstruktur

```text
Heute  /heute  (PROJ-6, unverändert im App-Rahmen)
├── Begonnen (PROJ-6)
│   ├── Letzte Markierung „Geschafft. Gut gemacht.“ · Titel · „Rückgängig“      (PROJ-6)
│   │   └── NEU: Rückmeldung (nur bei „Geschafft“, nicht bei „Heute nicht“)
│   │       ├── „Wie war der Aufwand?“   [Zu wenig] [Passte] [Zu viel]
│   │       ├── „Wieder vorschlagen?“    [Gern wieder] [Lieber nicht]
│   │       └── ggf. Fehler: „Das hat gerade nicht geklappt. …“ · „Nochmal versuchen“
│   └── Offene Aktionen (PROJ-6, unverändert)
└── Tagesentscheidung (PROJ-6)
    └── Vorschlag
        ├── Hauptvorschlag: Titel · Dauer · „Passt zu: …“
        │   └── NEU, nur wenn zutreffend: „Etwas sanfter, weil es letztes Mal zu viel war.“
        │                                 bzw. „Etwas kräftiger, weil es letztes Mal zu wenig war.“
        └── Alternativen (unverändert)
```

- Die Rückmeldung ist **keine** dominante Fläche: zurückhaltende Knöpfe (Umriss), mindestens 48 px hoch. Jede Frage ist eine benannte Gruppe. Die gewählte Antwort ist über `aria-pressed` und ein Häkchen erkennbar, nicht nur über die Farbe (AC-3). Es gibt keinen Absenden-Knopf und keine Dankesmeldung.
- Die Karte gehört weiter PROJ-6: Sie erscheint und verschwindet nach deren Regeln (bis zum nächsten Check-in, AC-7). PROJ-7 setzt nur den Rückmeldungs-Block hinein.
- Die Erklärungszeile steht direkt unter „Passt zu: …“ in gedämpfter Schrift.
- Keine neuen Seiten, keine neuen Navigationseinträge. `docs/app-shell.md` bleibt unverändert.

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/feedback/feedback.rules.ts` | Rein. Typen und Beschriftungen: Aufwand (`too_little` „Zu wenig“, `just_right` „Passte“, `too_much` „Zu viel“), „Wieder vorschlagen“ (`yes` „Gern wieder“, `no` „Lieber nicht“), Fragetitel. **Signale für die Auswahl** aus gespeicherten Rückmeldungen: die Liste der „Lieber nicht“-Inhalte je Art (je Inhalt zählt die zuletzt gespeicherte Antwort, AC-9, AC-10) und die Intensitätsverschiebung −1/0/+1 aus der jüngsten Aufwand-Rückmeldung zu einem Workout, höchstens 14 Tage alt (AC-11 bis AC-14, EC-8). Die aktuelle Zeit kommt als Eingabe. Außerdem die Texte der beiden Erklärungszeilen. | `features/today/today.rules` (Typ `Kind`), Zod. |
| `src/features/feedback/feedback.schema.ts` | Zod-Schema der Eingabe von `saveFeedback`: Aktions-ID (UUID), Frage (`effort` oder `suggestAgain`) und ein zur Frage passender Wert. Unbekannte Schlüssel werden abgelehnt. | Zod, Rules. |
| `src/features/feedback/feedback.data.ts` | `server-only`. **Antwort speichern** (eine Frage einer eigenen Aktion; Ergebnis „gespeichert“ oder „nicht mehr möglich“). **Rückmeldung einer Aktion lesen** (für die Vorauswahl, AC-5). **Signal-Rohdaten lesen** (eigene Rückmeldungen mit Art und Inhalt-ID der Aktion). **Alle eigenen Rückmeldungen für den Export** lesen. | `src/lib/supabase/server.ts`, Rules. |
| `src/features/feedback/feedback.actions.ts` | `'use server'`. `saveFeedback`: Sitzung prüfen, Eingabe prüfen, speichern. Liefert ein Ergebnis statt zu werfen: „gespeichert“, „nicht mehr möglich“ (dann wird `/heute` aktualisiert, EC-4), „ungültig“, „fehlgeschlagen“. Protokolliert nur Action-Name und Datenbankcode. | `features/account/account.data` (`requireUser`), Data, Schema. |
| `src/features/feedback/components/feedback-questions.tsx` | Client. Die zwei Fragen für **eine** Aktion, mit der gespeicherten Rückmeldung als Vorauswahl. Je Frage höchstens eine Speicherung gleichzeitig; ein weiterer Tipp währenddessen wird vorgemerkt und danach gesendet, nur der letzte vorgemerkte zählt (EC-1). Fehlerzustand mit „Nochmal versuchen“ (sendet die zuletzt getippte Antwort erneut); markiert bleibt die zuletzt gespeicherte Antwort (EC-3). | shadcn `button`; `lucide-react` `Check`; Actions, Rules; `TODAY_MESSAGES.failed` aus `today.rules`. |
| **Änderung PROJ-6:** `src/features/today/today.rules.ts` | `selectWorkouts` und `selectMeals` erhalten zusätzlich die Signale (Standard: keine Signale = Verhalten wie bisher). „Lieber nicht“ ist jeweils der **erste** Sortierschlüssel (bei Mahlzeiten vor der Stufe). Bei Workouts wird die angestrebte Intensität aus der Energie um die Verschiebung versetzt und auf sanft bis kräftig begrenzt, nur im Schlüssel „Abstand der Intensität“. Neue reine Funktion: Workout-Vorschlag **mit Erklärung**. Sie ermittelt die Auswahl mit und ohne Verschiebung und liefert die Erklärung nur, wenn sich der Hauptvorschlag unterscheidet (AC-15, EC-7). | wie bisher; `features/feedback/feedback.rules` (Texte, Typen). |
| **Änderung PROJ-6:** `src/features/today/today.actions.ts` | `requestSuggestion` lädt zusätzlich die Signal-Rohdaten, berechnet die Signale und gibt eine Erklärungszeile mit zurück (leer, wenn keine). | zusätzlich `features/feedback/feedback.data`, `feedback.rules`. |
| **Änderung PROJ-6:** `src/features/today/components/today-flow.tsx` | Zeigt die Erklärungszeile unter „Passt zu: …“, wenn vorhanden. | unverändert. |
| **Änderung PROJ-6:** `src/features/today/components/open-actions.tsx` | Setzt den Rückmeldungs-Block in die Bestätigungskarte, nur bei „Geschafft“; der Block wird je Aktion neu aufgebaut, damit eine neue Markierung ohne alte Auswahl beginnt. | zusätzlich `features/feedback/components/feedback-questions`. |
| **Änderung PROJ-6:** `src/app/(protected)/(bereiche)/heute/page.tsx` | Lädt zur letzten Markierung „Geschafft“ die gespeicherte Rückmeldung und übergibt sie (AC-5). | zusätzlich `features/feedback/feedback.data`. |
| **Änderung PROJ-1:** `src/features/account/account.data.ts`, `account.rules.ts` | Der Export bekommt einen Abschnitt `feedback` (AC-17); die übrigen Teile bleiben unverändert. | zusätzlich `features/feedback/feedback.data`. |

Abhängigkeitsrichtung: Die Module unter `features/feedback` dürfen `today.rules`, `today.data` und `account.data` benutzen. `today.actions`, `open-actions` und die Seite benutzen wiederum `features/feedback`. `today.rules` darf von `feedback.rules` nur Texte und Typen beziehen. So entsteht kein Kreis.

## Footprint

- **Code und Tests:** `src/features/feedback/**` mit Tests neben den Modulen. Änderungen mit angepassten bzw. neuen Tests an `src/features/today/today.rules.ts`, `today.actions.ts`, `components/today-flow.tsx`, `components/open-actions.tsx`, `src/app/(protected)/(bereiche)/heute/page.tsx`, `src/features/account/account.data.ts` und `account.rules.ts`.
- **Migrationen, Tabellen und Zugriffsregeln:** `supabase/migrations/<Zeitstempel>_action_feedback.sql` mit:
  - Tabelle `action_feedback` samt Prüfregeln und Indizes
  - Zeitstempel-Trigger
  - Lösch-Trigger an `actions`
  - RLS nur für die eigene Person mit aktiver Sitzung
  - Spaltenrechte
  Bestehende Migrationen werden nicht geändert.
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** keine neuen Routen. Genutzt werden `/heute` (Karte und Vorschlag) und `/profil/export` (erweitert). Keine Navigationseinträge, keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-9, AC-10, EC-5 | „Lieber nicht“ sortiert ganz nach hinten, schließt nie aus; je Inhalt zählt die zuletzt gespeicherte Antwort. | Reine Signal-Funktion in `feedback.rules`; erster Sortierschlüssel in `today.rules`. | Unit-Tests mit Tabellen (auch: alle Kandidaten „Lieber nicht“, Mahlzeiten mit Auffüllen). |
| AC-11 bis AC-14, EC-7, EC-8 | Verschiebung um genau eine Stufe, begrenzt; nur jüngste Workout-Aufwand-Rückmeldung, ≤ 14 Tage ab deren Speicherzeitpunkt; Mahlzeiten unberührt. | Datenbank setzt den Zeitpunkt je Frage beim Ändern des Werts; reine Funktionen berechnen Verschiebung und Sortierung. | Unit-Tests an den Grenzen (13,99 / 14 Tage, „wenig“ + „Zu viel“, „viel“ + „Zu wenig“, Mahlzeit jünger als Workout). |
| AC-15 | Erklärung nur bei verändertem Hauptvorschlag. | Auswahl mit und ohne Verschiebung vergleichen (rein). | Unit-Tests; Action-Test für die Rückgabe. |
| AC-8 | „Rückgängig“ löscht die Rückmeldung – auch wenn das Zurücknehmen von einem anderen Gerät kommt. | Datenbank-Trigger an `actions`: Verlässt eine Aktion den Zustand „geschafft“, wird ihre Rückmeldung in derselben Änderung gelöscht. | Live-Prüfung: Rückmeldung geben, zurücknehmen, Zeile ist weg. |
| EC-1 | Mehrfache schnelle Tipps: die zuletzt getippte Antwort gilt; höchstens eine Antwort je Frage und Aktion. | Eine Zeile pro Aktion (Primärschlüssel = Aktion); jede Frage schreibt nur ihre Spalte; die Oberfläche sendet je Frage nacheinander und merkt nur den letzten Tipp vor. | Komponententest mit verzögerter Action; Live-Prüfung zweier gleichzeitiger Speicherungen derselben Frage (eine Zeile). |
| EC-2 | Zwei Geräte: die zuletzt gespeicherte Antwort gilt. | Letzte Änderung gewinnt, je Frage getrennt – eine Antwort auf „Aufwand“ überschreibt nie „Wieder vorschlagen“. | Live-Prüfung: zwei Sitzungen, verschiedene Fragen und gleiche Frage. |
| EC-4, AC-7, AC-16 | Nach „Rückgängig“ auf einem anderen Gerät oder einem neuen Check-in wird nichts gespeichert. | RLS erlaubt Anlegen und Ändern nur, wenn die Aktion der Person gehört, „geschafft“ ist und seit ihrem Abschluss kein neuer Check-in der Person existiert. Eine Ablehnung wird zu „nicht mehr möglich“, die Seite zeigt den tatsächlichen Zustand. | Action-Test; Live-Prüfung mit neuem Check-in und mit „Rückgängig“. |
| EC-3 | Speicherfehler: Meldung mit „Nochmal versuchen“, markiert bleibt die zuletzt gespeicherte Antwort. | Ergebnis „fehlgeschlagen“; die Oberfläche nimmt die getippte Markierung zurück. | Komponententest. |

**Fehler an den Schnittstellen:**
- **Ungültige Eingabe** (manipulierte Anfrage, falscher Wert zur Frage): Ergebnis „ungültig“, nichts gespeichert, kein Protokoll mit Inhalt. Die Oberfläche zeigt die allgemeine Fehlermeldung.
- **Keine Sitzung:** `requireUser` leitet zur Anmeldung um (bestehendes Verhalten).
- **Nicht mehr möglich** (fremde oder unbekannte Aktion, nicht „geschafft“, neuerer Check-in): Ergebnis „nicht mehr möglich“, keine Fehlermeldung. `/heute` wird aktualisiert; die Karte verschwindet oder zeigt den aktuellen Zustand (EC-4).
- **Datenbank nicht erreichbar:** Ergebnis „fehlgeschlagen“ → EC-3. Protokoll: Action-Name und Fehlercode, keine Antworten, keine Nutzer-ID.
- **Signale nicht lesbar beim Vorschlag:** `requestSuggestion` liefert wie bisher „fehlgeschlagen“ (EC-9 aus PROJ-6). Es gibt keinen stillen Vorschlag ohne Signale, damit das Verhalten nachvollziehbar bleibt.
- **Rückmeldung nicht lesbar beim Laden von „Heute“:** Die Seite wirft; es greift die Fehlergrenze aus PROJ-2, wie beim übrigen Laden von „Heute“.

## Datenmodell

Eine neue Tabelle mit persönlichen Daten. Jede Zeile gehört genau einer Person und genau einer ihrer Aktionen.

**Abschlussfeedback `action_feedback`** – die Rückmeldung zu einer als geschafft markierten Aktion
- `action_id`: UUID, Primärschlüssel; verweist auf `actions`. Höchstens eine Rückmeldung pro Aktion. Wird mit der Aktion gelöscht.
- `user_id`: UUID, Pflicht; verweist auf das Konto und wird mit dem Konto gelöscht. Muss der Person der Aktion entsprechen (RLS).
- `effort`: Text, leer oder genau `too_little` („Zu wenig“), `just_right` („Passte“) bzw. `too_much` („Zu viel“).
- `effort_at`: Zeitpunkt, leer genau dann, wenn `effort` leer ist. Die Datenbank setzt ihn auf „jetzt“, sobald sich `effort` ändert. Ein erneutes Speichern desselben Werts ändert ihn nicht (EC-8).
- `suggest_again`: Text, leer oder genau `yes` („Gern wieder“) bzw. `no` („Lieber nicht“).
- `suggest_again_at`: Zeitpunkt, leer genau dann, wenn `suggest_again` leer ist; gleiche Regel wie `effort_at`.
- `created_at`: Zeitpunkt, automatisch.
- `updated_at`: Zeitpunkt, automatisch bei jeder Änderung (bestehende Hilfsfunktion). Das ist der „Zeitpunkt der letzten Änderung“ im Export.
- Mindestens eine der beiden Antworten ist gesetzt; eine leere Zeile gibt es nicht.
- Art und Inhalt (Workout oder Mahlzeit) stehen **nicht** doppelt in der Rückmeldung, sondern kommen aus der verknüpften Aktion.

**Abgeleitet, nicht gespeichert:**
- **„Lieber nicht“-Inhalte je Art:** Je Inhalt zählt die Rückmeldung mit dem jüngsten `suggest_again_at` über alle Aktionen zu diesem Inhalt. Ist sie `no`, gilt der Inhalt als „Lieber nicht“ (AC-9, AC-10).
- **Intensitätsverschiebung:** Die Rückmeldung mit dem jüngsten `effort_at` unter allen Aktionen der Art „Bewegen“. Ist sie höchstens 14 Tage alt, ergibt `too_much` −1, `too_little` +1 und `just_right` 0; sonst 0 (AC-11 bis AC-14).

**Automatik in der Datenbank:**
- **Zeitstempel je Frage:** Vor dem Anlegen und Ändern setzt die Datenbank `effort_at` bzw. `suggest_again_at`, wenn sich der jeweilige Wert ändert. Die Oberfläche und die Server Action übergeben keine Zeitpunkte.
- **Löschen beim Zurücknehmen:** Ändert sich der Zustand einer Aktion von `done` auf etwas anderes („Rückgängig“), löscht die Datenbank die zugehörige Rückmeldung in derselben Änderung (AC-8). Die dafür nötige Funktion läuft mit Eigentümerrechten, weil Personen selbst nicht löschen dürfen.

**Zugriff (RLS, nur `authenticated` mit aktiver Sitzung über `private.has_active_session`):**
- **Lesen:** nur eigene Zeilen.
- **Anlegen und Ändern:** nur eigene Zeilen. Zusätzlich muss die Aktion der Person gehören und den Zustand `done` haben, und seit ihrem `concluded_at` darf die Person keinen neuen Check-in angelegt haben (Karte noch sichtbar, AC-7, EC-4, AC-16).
- **Spaltenrechte:**
  - Anlegen nur mit `action_id`, `user_id`, `effort` und `suggest_again`
  - Ändern nur von `effort` und `suggest_again`
  - Zeitpunkte setzt ausschließlich die Datenbank
- **Löschen über die API:** nicht erlaubt; nur über den Trigger und die Kontolöschung.
- **`anon`:** keinerlei Rechte.

**Aufbewahrung:** Eine Rückmeldung bleibt bis zum „Rückgängig“ ihrer Aktion oder bis zur Kontolöschung bestehen (Kaskade über Konto und Aktion, AC-18). Eine kürzere Frist klärt `/dsgvo PROJ-7` vor dem ersten Deploy. Gespeichert werden keine Freitexte und keine Geräteangaben.

**Indizes:** nach Person und `suggest_again_at` (für „Lieber nicht“) und nach Person und `effort_at` (für die jüngste Aufwand-Rückmeldung). Der Primärschlüssel auf `action_id` deckt das Lesen für die Karte ab.

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| „Heute“ laden | Angemeldet, Angaben vollständig (Gate PROJ-3). | Ist die letzte Markierung „geschafft“, wird ihre Rückmeldung (oder keine) mitgeladen und vorausgewählt. | AC-1, AC-2, AC-5 |
| Antwort speichern (`saveFeedback`) | Angemeldet; Aktions-ID, Frage, Wert werden geprüft. | Legt die Rückmeldung mit dieser einen Antwort an. Gibt es sie schon, ändert es **nur** die Spalte dieser Frage. Eine gleichzeitige erste Speicherung von zwei Geräten führt nicht zu zwei Zeilen: Der zweite Versuch ändert dann die bestehende. Ablehnung durch die Zugriffsregel → „nicht mehr möglich“; Datenbankfehler → „fehlgeschlagen“. | AC-3, AC-6, AC-7, AC-16, EC-1 bis EC-4 |
| „Rückgängig“ (PROJ-6, unverändert) | wie bisher. | Die Datenbank löscht die Rückmeldung mit. | AC-8 |
| Vorschlag anfordern (`requestSuggestion`, PROJ-6) | wie bisher. | Lädt die eigenen Rückmeldungen der gewählten Art mit Inhalt-ID, berechnet die Signale und wendet sie an. Bei Workouts kommt ggf. die Erklärungszeile dazu. Gespeichert wird wie bisher die Rangfolge im Check-in. | AC-9 bis AC-15, EC-5, EC-7, EC-8 |
| Datenexport (PROJ-1) | Angemeldet. | Abschnitt `feedback`: je Rückmeldung Aktions-ID, Aufwand, „Wieder vorschlagen“, deren Zeitpunkte, Anlage- und letzter Änderungszeitpunkt. | AC-17 |
| Konto löschen (PROJ-1) | Angemeldet. | Rückmeldungen werden mit dem Konto gelöscht. | AC-18 |

## Abhängigkeiten

- `@supabase/ssr`, Zod, `lucide-react` (alle vorhanden).
- shadcn `button` (vorhanden).
- Aus PROJ-6: Auswahlregel, Bestätigungskarte, `TODAY_MESSAGES`, Aktionen; aus PROJ-1: `requireUser`, Export.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Eigene Tabelle `action_feedback` mit der Aktion als Primärschlüssel | Entspricht dem Datenmodell (Rückmeldung bezieht sich auf eine Aktion); höchstens eine Zeile pro Aktion ist durch die Datenbank garantiert (EC-1). | Spalten direkt in `actions` | `actions` hat bewusst nur Zustandsspalten als änderbar; ein Löschen beim „Rückgängig“ wäre dort ein Zurücksetzen mehrerer Spalten. | 2026-11-17 |
| Art und Inhalt nicht in der Rückmeldung wiederholen, sondern aus der Aktion lesen | Keine doppelten Angaben, die auseinanderlaufen könnten. | Inhalt-ID mitspeichern | Signale brauchen eine verknüpfte Abfrage; bei wenigen Zeilen pro Person unkritisch. | 2026-11-17 |
| Je Frage eigener Zeitpunkt, gesetzt von der Datenbank | „Jüngste Aufwand-Rückmeldung“ und „zuletzt gesagt“ hängen am Speicherzeitpunkt der jeweiligen Antwort, nicht an der Aktion; die Datenbank-Uhr ist nicht manipulierbar (EC-8). | Ein gemeinsamer `updated_at` | Zwei Zeitpunktspalten mehr. | 2026-11-17 |
| Jede Frage schreibt nur ihre eigene Spalte; anlegen, bei vorhandener Zeile ändern | Antworten auf verschiedene Fragen von zwei Geräten überschreiben sich nie gegenseitig; je Frage gilt die letzte (EC-2). Die Spaltenrechte können eng bleiben (Aktion und Person sind nicht änderbar). | „Upsert“ mit allen Spalten | Zwei Schritte im seltenen Fall „Zeile existiert schon“. | 2026-11-17 |
| Die Oberfläche sendet je Frage nacheinander und merkt nur den letzten Tipp vor | Garantiert „die zuletzt getippte Antwort gilt“, auch wenn Antworten in anderer Reihenfolge ankommen könnten (EC-1). | Knöpfe während des Speicherns sperren | Kurz sichtbare Markierung vor dem Speichern; bei Fehler wird sie zurückgenommen (EC-3). | 2026-11-17 |
| RLS prüft „geschafft“ und „kein neuerer Check-in“ | Garantiert EC-4 und AC-7 auch bei zwei Geräten und Umgehung der App (SEC-03); dieselbe Bedingung wie die sichtbare Karte. | Nur Prüfung in der Server Action | Etwas komplexere Zugriffsregel; Vergleich von Server- und Datenbankzeit (Abweichung im Millisekundenbereich, wie in PROJ-6). | 2026-11-17 |
| Löschen beim „Rückgängig“ per Datenbank-Trigger | Atomar mit der Zustandsänderung, gilt auch für „Rückgängig“ von einem anderen Gerät; Personen brauchen kein Löschrecht (AC-8). | Löschen in `undoConclusion` | Logik an zwei Stellen (Server Action und Datenbank); im Migrationskommentar dokumentiert. | 2026-11-17 |
| Signale als reine Funktionen, Auswahlregel bekommt sie als Eingabe | Nachvollziehbar und mit Tabellen testbar (PRD); PROJ-6-Tests bleiben gültig, weil „keine Signale“ das bisherige Verhalten ist. | Signale in der Datenbankabfrage berechnen | Alle eigenen Rückmeldungen einer Art werden pro Vorschlag geladen; bei wenigen Zeilen pro Person unkritisch. | 2026-11-17 |
| Erklärung durch Vergleich der Auswahl mit und ohne Verschiebung | Genau die Bedingung der Spec (AC-15, EC-7), ohne Sonderfälle für Begrenzungen. | Zeile immer, wenn eine Verschiebung aktiv ist | Die Auswahl wird zweimal berechnet; bei ≈ 30 Inhalten vernachlässigbar. | 2026-11-17 |
| Kein `revalidatePath` nach erfolgreichem Speichern, nur bei „nicht mehr möglich“ | Die Karte behält ihren eigenen Zustand; kein Neuladen der Seite bei jedem Tipp. Bei EC-4 zeigt die Aktualisierung den tatsächlichen Zustand. | Nach jedem Speichern aktualisieren | Ein zweites Gerät sieht neue Antworten erst beim nächsten Öffnen von „Heute“ (so in EC-2 vorgesehen). | 2026-11-17 |
| Zugriffsregeln verlangen eine aktive Sitzung | Gleiches Muster wie PROJ-1 und PROJ-6. | Nur `user_id` prüfen | Keiner. | 2026-11-17 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: Aufbewahrungsfrist der Rückmeldungen nach `/dsgvo PROJ-7` (bisher bis „Rückgängig“ oder Kontolöschung).
