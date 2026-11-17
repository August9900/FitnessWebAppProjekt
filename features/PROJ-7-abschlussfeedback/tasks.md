# PROJ-7 — Aufgaben: Abschlussfeedback

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration `action_feedback`:
  - Tabelle mit Aktion als Primärschlüssel, Person, Aufwand und „Wieder vorschlagen“ (jeweils mit Zeitpunkt), `created_at`, `updated_at`
  - Prüfregeln: erlaubte Werte, Zeitpunkt leer genau bei leerem Wert, mindestens eine Antwort
  - Zeitstempel-Trigger je Frage (nur bei geändertem Wert) und `updated_at`-Pflege
  - Lösch-Trigger an `actions`, wenn der Zustand `done` verlassen wird
  - Indizes nach Person und je Zeitpunkt; Fremdschlüssel auf Aktion und Konto, beide mit Löschung
  - RLS nur eigene Zeilen mit aktiver Sitzung: lesen; anlegen und ändern nur bei eigener Aktion im Zustand `done` ohne neueren Check-in
  - Spaltenrechte: anlegen nur Aktion, Person und die beiden Antworten; ändern nur die Antworten; kein Löschen über die API; keine Rechte für `anon`
  - lokal angewendet und mit zwei Testkonten sowie anonym geprüft

  · files: `supabase/migrations/20261117120000_action_feedback.sql` · → AC-7, AC-8, AC-16, AC-18; EC-1, EC-2, EC-4, EC-6, EC-8
- [x] T2 [P] Reine Regeln:
  - Typen und Beschriftungen für Aufwand und „Wieder vorschlagen“, dazu die Fragetitel
  - Signale: „Lieber nicht“-Inhalte je Art (je Inhalt zählt die zuletzt gespeicherte Antwort); Intensitätsverschiebung −1/0/+1 aus der jüngsten Workout-Aufwand-Rückmeldung, höchstens 14 Tage alt; Zeit als Eingabe
  - Texte der beiden Erklärungszeilen
  - mit Tabellen-Tests

  · files: `src/features/feedback/feedback.rules.ts`, `src/features/feedback/feedback.rules.test.ts` · → AC-1, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14; EC-6, EC-8
- [x] T3 [P] Eingabeprüfung von `saveFeedback`: Aktions-ID, Frage `effort` bzw. `suggestAgain` und ein zur Frage passender Wert; unbekannte Schlüssel werden abgelehnt; mit Test. · files: `src/features/feedback/feedback.schema.ts`, `src/features/feedback/feedback.schema.test.ts` · → AC-3, AC-16

## Stufe 2 — Datenzugriff und Auswahlregel

- [x] T4 [P] Datenzugriff (`server-only`):
  - Antwort speichern: anlegen, bei bestehender Zeile nur die Spalte dieser Frage ändern; Ablehnung oder keine geänderte Zeile → „nicht mehr möglich“
  - Rückmeldung einer eigenen Aktion lesen
  - eigene Rückmeldungen einer Art mit Inhalt-ID der Aktion lesen (Signal-Rohdaten)
  - alle eigenen Rückmeldungen für den Export lesen
  - mit Test

  · files: `src/features/feedback/feedback.data.ts`, `src/features/feedback/feedback.data.test.ts` · → AC-3, AC-5, AC-6, AC-7, AC-16, AC-17; EC-1, EC-2, EC-4
- [x] T5 [P] Änderung PROJ-6, Auswahlregel:
  - `selectWorkouts` und `selectMeals` bekommen die Signale als Eingabe; ohne Signale bleibt das Verhalten unverändert
  - „Lieber nicht“ ist der erste Sortierschlüssel, bei Mahlzeiten auch vor den aufgefüllten Stufen
  - verschobene, begrenzte Ziel-Intensität nur im Schlüssel „Abstand der Intensität“
  - Workout-Vorschlag mit Erklärung durch Vergleich der Auswahl mit und ohne Verschiebung
  - bestehende Tests grün, neue Tabellen-Tests

  · files: `src/features/today/today.rules.ts`, `src/features/today/today.rules.test.ts` · → AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15; EC-5, EC-7

## Stufe 3 — Server Actions und Export

- [ ] T6 [P] Server Action `saveFeedback`:
  - Sitzung und Eingabe prüfen, speichern
  - Ergebnisse „gespeichert“, „nicht mehr möglich“ (mit Aktualisierung von `/heute`), „ungültig“, „fehlgeschlagen“
  - Protokoll ohne Personendaten
  - mit Test

  · files: `src/features/feedback/feedback.actions.ts`, `src/features/feedback/feedback.actions.test.ts` · → AC-3, AC-6, AC-7, AC-16; EC-3, EC-4
- [ ] T7 [P] Änderung PROJ-6: `requestSuggestion` lädt die Signal-Rohdaten der gewählten Art, berechnet und wendet die Signale an und liefert die Erklärungszeile (leer, wenn keine); Lesefehler → „fehlgeschlagen“; mit Test. · files: `src/features/today/today.actions.ts`, `src/features/today/today.actions.test.ts` · → AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15
- [ ] T8 [P] Änderung PROJ-1: Datenexport um den Abschnitt `feedback` erweitern (Aktions-ID, Aufwand, „Wieder vorschlagen“, Zeitpunkte, Anlage und letzte Änderung); übrige Exportteile unverändert; mit Tests. · files: `src/features/account/account.data.ts`, `src/features/account/account.rules.ts`, `src/features/account/account.data.test.ts`, `src/features/account/account.rules.test.ts` · → AC-17

## Stufe 4 — Ansichten

- [ ] T9 [P] Fragen-Block (Client):
  - „Wie war der Aufwand?“ und „Wieder vorschlagen?“ als benannte Gruppen
  - Vorauswahl aus der gespeicherten Rückmeldung; Markierung über `aria-pressed` und Häkchen; mindestens 48 px hohe, zurückhaltende Knöpfe
  - je Frage nacheinander senden, nur den letzten Tipp vormerken
  - Fehler mit „Nochmal versuchen“; markiert bleibt die zuletzt gespeicherte Antwort
  - keine Dankesmeldung, keine Erinnerung
  - mit Test

  · files: `src/features/feedback/components/feedback-questions.tsx`, `src/features/feedback/components/feedback-questions.test.tsx` · → AC-1, AC-3, AC-4, AC-6; EC-1, EC-3
- [ ] T10 [P] Änderung PROJ-6: Erklärungszeile in gedämpfter Schrift unter „Passt zu: …“ im Hauptvorschlag, nur wenn vorhanden; mit Test. · files: `src/features/today/components/today-flow.tsx`, `src/features/today/components/today-flow.test.tsx` · → AC-15

## Stufe 5 — Einbau und Live-Prüfung

- [ ] T11 Änderung PROJ-6, Einbau:
  - Die Bestätigungskarte zeigt den Fragen-Block nur bei „Geschafft“, je Aktion neu aufgebaut.
  - `/heute` lädt zur letzten Markierung „Geschafft“ die gespeicherte Rückmeldung und übergibt sie.
  - Anschließend Live-Prüfung mit zwei Testkonten: fremder und anonymer Zugriff, gleichzeitige Speicherungen derselben und verschiedener Fragen, „Rückgängig“ löscht, neuer Check-in sperrt, Inhalt nicht mehr im Angebot, Export, Kontolöschung.

  · files: `src/features/today/components/open-actions.tsx`, `src/features/today/components/open-actions.test.tsx`, `src/app/(protected)/(bereiche)/heute/page.tsx` · → AC-1, AC-2, AC-5, AC-7, AC-8, AC-16, AC-17, AC-18; EC-2, EC-4, EC-6

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Datenzugriff und Auswahlregel (2) → Server Actions und Export (3) → Ansichten (4) → Einbau (5).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- AC-8, AC-16, AC-18, EC-1, EC-2, EC-4 und EC-6 werden nach Stufe 5 zusätzlich live gegen die lokale Datenbank geprüft.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
