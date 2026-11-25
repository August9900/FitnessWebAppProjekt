# PROJ-10: Eigene Trainingspläne

> In PULSE heißt ein eigener Trainingsplan **„eigenes Workout“**: eine selbst zusammengestellte, benannte Übungsfolge ohne Wochentage oder Termine.

## Abhängigkeiten

- Benötigt: PROJ-9 (Übungsbibliothek) — die Übungen, aus denen ein eigenes Workout zusammengestellt wird, und deren Detailansicht; Pausen wie „Kurze Pause“ stehen nicht in der Bibliothek, sind hier aber wählbar (PROJ-9 AC-11).
- Benötigt: PROJ-4 (Kurze Workouts) — Darstellung einer Übungsfolge mit „Leichter“, Sicherheitshinweis und die geführte Durchführung. **Änderung an PROJ-4:** Die geführte Durchführung kann auch ein eigenes Workout abspielen; der Bereich „Bewegung“ zeigt die eigenen Workouts.
- Benötigt: PROJ-1 (Konto & Anmeldung) — persönliche Speicherung, Datenexport und Kontolöschung.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — liegt im Bereich „Bewegung“; keine neue Navigation.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — der Bereich ist erst mit vollständigen Angaben erreichbar.

## User Stories

- Als Person mit einer Lieblingsabfolge möchte ich mir aus den Übungen der Bibliothek ein eigenes Workout zusammenstellen und speichern, damit ich es nicht jedes Mal neu suchen muss.
- Als Person, die gern selbst bestimmt, möchte ich für jede Übung festlegen, wie lange oder wie oft ich sie mache.
- Als Person, die loslegen will, möchte ich mein eigenes Workout mit einem Tipp in der geführten Durchführung starten, wie ein normales Workout.
- Als Person, deren Gewohnheiten sich ändern, möchte ich ein eigenes Workout umbenennen, ändern oder löschen können.
- Als Person möchte ich sicher sein, dass nur ich meine eigenen Workouts sehe, dass sie in meinem Datenexport enthalten sind und mit meinem Konto gelöscht werden.

## Nicht enthalten

- Trainingstage, Wochentage, Termine, Wiederholungspläne oder Erinnerungen.
- Vorschläge eigener Workouts auf „Heute“ (PROJ-6) — Vorschläge kommen weiter nur aus dem geprüften Angebot.
- Eintrag in den Aktionsverlauf oder den Wochenblick (PROJ-8); „Geschafft“-Markierung für eigene Workouts.
- Abschlussfeedback (PROJ-7) zu eigenen Workouts.
- Eigene Übungen anlegen; nur Übungen aus der Bibliothek.
- Teilen eigener Workouts mit anderen Personen; Vorlagen anderer.
- Vorlage aus einem angebotenen Workout kopieren.
- Automatisch erzeugte oder KI-gestützte Pläne (PRD-Nichtziel).
- Zwischenspeichern eines halb fertigen Workouts; Warnung beim Verlassen mit ungespeicherten Änderungen.
- Prüfhinweis „Beispielinhalt …“ an eigenen Workouts.

## Acceptance Criteria

### Übersicht

- [ ] **AC-1** — Angenommen eine Person mit vollständigen Angaben öffnet „Bewegung“, wenn die Seite angezeigt wird, dann sieht sie einen Abschnitt „Deine Workouts“ mit ihren eigenen Workouts (Name und Anzahl Übungen, alphabetisch) und dem Weg „Neues Workout“; ohne eigene Workouts steht dort „Stell dir ein eigenes Workout aus den Übungen zusammen.“ mit „Neues Workout“.

### Zusammenstellen

- [ ] **AC-2** — Angenommen die Person wählt „Neues Workout“, wenn der Editor angezeigt wird, dann gibt sie einen Namen ein und fügt über „Übung hinzufügen“ Übungen aus der Bibliothek hinzu; jede neu hinzugefügte Übung steht am Ende der Folge mit 30 Sekunden.
- [ ] **AC-3** — Angenommen eine Übung steht in der Folge, wenn die Person sie bearbeitet, dann kann sie zwischen „Sekunden“ und „Wiederholungen“ wählen, den Wert ändern, die Übung nach oben oder unten verschieben oder entfernen — alles per Tastatur bedienbar, ohne Ziehen.
- [ ] **AC-4** — Angenommen die Person wählt „Übung hinzufügen“, wenn die Auswahl angezeigt wird, dann sieht sie alle Übungen der Bibliothek und zusätzlich die Pausen (derzeit „Kurze Pause“) alphabetisch mit Ausstattung und kann mit „Ohne Ausstattung“ bzw. „Passt zu meinem Zuhause“ filtern (wie PROJ-9; eine Pause braucht keine Ausstattung); dieselbe Übung darf mehrfach in der Folge stehen.
- [ ] **AC-5** — Angenommen die Person wählt „Speichern“, wenn Name und Übungen gültig sind, dann ist das eigene Workout gespeichert und sie sieht seine Detailansicht.
- [ ] **AC-6** — Angenommen die Eingaben sind ungültig, wenn die Person speichern will, dann wird nicht gespeichert und sie sieht beim betroffenen Feld einen Hinweis: Name fehlt oder ist kürzer als 2 bzw. länger als 40 Zeichen; keine Übung; mehr als 12 Übungen; Sekunden außerhalb von 10 bis 180 oder nicht in 5er-Schritten; Wiederholungen außerhalb von 1 bis 30.

### Ansehen und Starten

- [ ] **AC-7** — Angenommen die Person öffnet ein eigenes Workout, wenn die Detailansicht angezeigt wird, dann sieht sie Name, benötigte Ausstattung, den Sicherheitshinweis (PROJ-4) und die Übungsfolge mit Sekunden bzw. Wiederholungen, Anleitung und „Leichter“; jeder Übungsname führt zur Übung in der Bibliothek (PROJ-9), ausgenommen Pausen — ihr Name steht ohne Link (PROJ-9 AC-11).
- [ ] **AC-8** — Angenommen die Detailansicht wird angezeigt, wenn die Person „Los geht's“ wählt, dann öffnet sich die geführte Durchführung aus PROJ-4 mit genau dieser Folge und der gewählten „Leichter“-Auswahl; dabei wird nichts gespeichert oder gezählt.

### Ändern und Löschen

- [ ] **AC-9** — Angenommen die Detailansicht wird angezeigt, wenn die Person „Bearbeiten“ wählt, dann öffnet sich der Editor mit Name und Folge; „Speichern“ ersetzt das Workout als Ganzes, „Abbrechen“ verwirft die Änderungen.
- [ ] **AC-10** — Angenommen die Detailansicht wird angezeigt, wenn die Person „Löschen“ wählt, dann fragt eine Bestätigung „Workout „<Name>“ löschen?“ mit „Löschen“ und „Abbrechen“; nach „Löschen“ ist es entfernt und sie kehrt zu „Bewegung“ zurück.

### Grenzen

- [ ] **AC-11** — Angenommen die Person hat bereits 20 eigene Workouts, wenn sie ein weiteres anlegen will, dann sieht sie „Du hast schon 20 eigene Workouts. Lösch eines, um ein neues anzulegen.“ und es wird keines angelegt.

### Daten und Zugriff

- [ ] **AC-12** — Angenommen eigene Workouts einer Person sind gespeichert, wenn eine andere angemeldete Person oder ein nicht angemeldeter Besucher sie lesen, anlegen, ändern oder löschen will, dann wird das abgelehnt; die Adresse eines fremden Workouts zeigt „Dieses Workout gibt es nicht (mehr)“.
- [ ] **AC-13** — Angenommen eine Person lädt ihren Datenexport herunter (PROJ-1), wenn er erstellt wird, dann enthält er ihre eigenen Workouts mit Name, Übungsfolge (Übung, Sekunden bzw. Wiederholungen) und den Zeitpunkten von Anlage und letzter Änderung.
- [ ] **AC-14** — Angenommen eine Person löscht ihr Konto (PROJ-1), wenn die Löschung ausgeführt wird, dann werden auch alle ihre eigenen Workouts gelöscht.

## Edge Cases

- [ ] **EC-1** — Angenommen dasselbe eigene Workout ist auf zwei Geräten zum Bearbeiten offen, wenn beide nacheinander speichern, dann gilt das zuletzt Gespeicherte vollständig (Name und Folge), ohne Vermischung.
- [ ] **EC-2** — Angenommen ein eigenes Workout wurde auf einem anderen Gerät gelöscht, wenn die Person es danach speichern will, dann sieht sie „Dieses Workout gibt es nicht mehr.“ und kann ihre Eingaben mit „Als neues Workout speichern“ behalten.
- [ ] **EC-3** — Angenommen die Person hat 19 eigene Workouts, wenn auf zwei Geräten gleichzeitig ein neues gespeichert wird, dann entsteht nur eines; das andere Gerät sieht den Hinweis aus AC-11 und behält seine Eingaben.
- [ ] **EC-4** — Angenommen die Person tippt „Speichern“ oder „Löschen“ mehrfach schnell hintereinander, wenn die Eingaben ankommen, dann entsteht genau ein Workout bzw. genau eine Änderung oder Löschung.
- [ ] **EC-5** — Angenommen das Speichern oder Löschen schlägt fehl (z. B. keine Verbindung), wenn die Person es versucht, dann sieht sie „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“ und ihre Eingaben bleiben erhalten.
- [ ] **EC-6** — Angenommen die Adresse nennt ein unbekanntes eigenes Workout, wenn sie aufgerufen wird, dann erscheint „Dieses Workout gibt es nicht (mehr)“ mit Weg zu „Bewegung“.
- [ ] **EC-7** — Angenommen zwei eigene Workouts tragen denselben Namen, wenn sie gespeichert werden, dann ist das erlaubt; beide erscheinen in der Übersicht.
- [ ] **EC-8** — Angenommen der Editor wird auf einem Smartphone (375 px Breite) bedient, wenn zwölf Übungen in der Folge stehen, dann bleiben alle Bedienelemente erreichbar und mindestens 48 px hoch, ohne seitliches Scrollen.

## Übergreifende Anforderungen

- Texte sind kurz, in du-Form; keine Bewertung von Umfang oder Leistung.
- Alle Bedienelemente sind per Tastatur erreichbar; das Verschieben geht über Knöpfe „Nach oben“/„Nach unten“; Fehlermeldungen sind dem jeweiligen Feld zugeordnet.
- Eigene Workouts werden in der Übersicht und im Detail nicht als „geprüft“ oder „Beispielinhalt“ gekennzeichnet.

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-10` — Name eines eigenen Workouts ist ein Freitext, den Personen mit Angaben über sich füllen können; Aufbewahrung (bisher bis zur Löschung durch die Person oder Kontolöschung).
- [ ] Bei der Produktvalidierung prüfen, ob „Geschafft“ für eigene Workouts und ein Eintrag im Wochenblick vermisst werden (bewusst ausgelassen, mögliche spätere Erweiterung über `/refine PROJ-8`).

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Eigener Trainingsplan = „eigenes Workout“: eine benannte Übungsfolge ohne Tage oder Termine | PRD: nächster machbarer Schritt statt perfektem Wochenplan; nutzt Bibliothek und geführte Durchführung. | 2026-11-25 |
| Eigenständig im Bereich „Bewegung“, nicht in Tagesvorschlägen, Aktionsverlauf oder Wochenblick | Vorschläge bleiben bei geprüften Inhalten; keine Änderung an PROJ-6/7/8. | 2026-11-25 |
| Grenzen: Name 2–40 Zeichen, 1–12 Übungen, Sekunden 10–180 in 5er-Schritten, Wiederholungen 1–30, höchstens 20 eigene Workouts | Passt zum Kurz-Prinzip der Workouts aus PROJ-4. | 2026-11-25 |
| Beim Bearbeiten gilt das zuletzt Gespeicherte als Ganzes | Einfach und ohne Zusatzschritt; wie beim Profil (PROJ-3). | 2026-11-25 |
| Neue Übung startet mit 30 Sekunden; Verschieben über Knöpfe statt Ziehen | Schnell und ohne Feinmotorik; per Tastatur bedienbar. | 2026-11-25 |
| Löschen mit Bestätigung | Nicht umkehrbar. | 2026-11-25 |
| Starten speichert und zählt nichts | Eigenständig; kein Verlauf außerhalb des Aktionsverlaufs. | 2026-11-25 |
| Gleiche Namen erlaubt | Keine unnötige Hürde; die Übersicht zeigt zusätzlich die Anzahl der Übungen. | 2026-11-25 |
| Pausen im Auswahl-Dialog wählbar, im Detail ohne Bibliotheks-Link (Wortlaut AC-4, AC-7 an PROJ-9 AC-11 angeglichen) | Pausen sind kein Nachschlage-Inhalt, gehören aber in eine selbst gebaute Folge; Verhalten unverändert, nur genauer beschrieben. | 2026-11-25 |
