# PROJ-6: Tagesentscheidung

## Abhängigkeiten

- Benötigt: PROJ-1 (Konto & Anmeldung) — persönliche Speicherung, Datenexport und Kontolöschung.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — Bereich „Heute“, gemeinsame Bausteine.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — Orte, Ausstattung, Erfahrung und Essensweise; „Heute“ ist erst mit vollständigen Angaben erreichbar.
- Benötigt: PROJ-4 (Kurze Workouts) — Angebot, Passt-Regel, Detail und geführte Durchführung.
- Benötigt: PROJ-5 (Einfache Mahlzeiten) — Angebot, Passt-Regel und Detail.
- Wird genutzt von: PROJ-7 (Abschlussfeedback) — Rückmeldung zu einer Aktion; PROJ-8 (Wochenblick) — begonnene und geschaffte Aktionen.

## User Stories

- Als Person, die vor lauter Möglichkeiten nicht anfängt, möchte ich auf „Heute“ nur sagen, ob ich mich bewegen oder etwas essen will, und dann genau einen passenden Vorschlag bekommen, damit ich nicht selbst abwägen muss.
- Als Person mit schwankender Energie möchte ich in wenigen Tipps angeben, wie viel Zeit und Kraft ich gerade habe, damit der Vorschlag zu diesem Moment passt und nicht zu einem idealen Tag.
- Als Person, der der erste Vorschlag nicht zusagt, möchte ich zwei Alternativen sehen und mit einem Tipp wechseln können, ohne den Check-in neu zu machen.
- Als Person, die oft unterbrochen wird, möchte ich auf „Heute“ sehen, was ich begonnen habe, und es mit einem Tipp als geschafft oder „heute nicht“ markieren können — ohne Vorwurf und ohne Nachholpflicht.
- Als Person, die jeden Tag ähnliche Angaben macht, möchte ich mit „Wie letztes Mal“ sofort zum Vorschlag kommen, damit der Start unter 30 Sekunden bleibt.
- Als Person möchte ich sicher sein, dass nur ich meine Check-ins und Aktionen sehe und dass sie in meinem Datenexport enthalten sind und mit meinem Konto gelöscht werden.

## Nicht enthalten

- Rückmeldung, ob Aufwand und Inhalt gepasst haben, und deren Einfluss auf spätere Vorschläge — gehört zu PROJ-7.
- Wochen- oder Verlaufsansicht der Aktionen — gehört zu PROJ-8.
- Ein gemeinsamer Check-in mit Bewegungs- und Mahlzeitenvorschlag zugleich; eine automatische Entscheidung „Bewegen oder Essen“ durch die App.
- Einschränkungen wie Schmerzen, Verletzungen oder Zyklus — wären Gesundheitsdaten; ebenso Stimmung oder Schlaf.
- Automatisches Markieren als geschafft nach „Fertig“ in der geführten Ansicht (würde eine Änderung an PROJ-4 brauchen).
- Erinnerungen, Benachrichtigungen, Streaks, Punkte, Vergleiche.
- Zufallsauswahl, frei generierte oder KI-gestützte Vorschläge.
- Nachträgliches Eintragen von Aktionen, die nicht aus einem Vorschlag begonnen wurden.

## Acceptance Criteria

### Einstieg auf „Heute“

- [ ] **AC-1** — Angenommen eine Person mit vollständigen Angaben öffnet „Heute“, wenn die Seite angezeigt wird, dann sieht sie die Frage „Was brauchst du gerade?“ mit den zwei großen Auswahlmöglichkeiten „Bewegen“ und „Essen“.

### Check-in

- [ ] **AC-2** — Angenommen die Person wählt „Bewegen“, wenn der Check-in angezeigt wird, dann beantwortet sie nacheinander, je eine Frage pro Bildschirm, „Wie viel Zeit hast du?“ („5 Min“, „10 Min“, „15 Min“), „Wie viel Energie hast du?“ („wenig“, „mittel“, „viel“) und „Wo bist du?“ (nur die Orte aus ihrem Profil); hat ihr Profil nur einen Ort, entfällt die Ortsfrage.
- [ ] **AC-3** — Angenommen die Person wählt „Essen“, wenn der Check-in angezeigt wird, dann beantwortet sie genau eine Frage „Wie viel geht gerade?“ mit „Gar nicht kochen“, „Kurz kochen“ oder „Bis 20 Min“ (entspricht den Aufwandsstufen „Ohne Kochen“, „Schnell gekocht“, „Bis 20 Min“ aus PROJ-5).
- [ ] **AC-4** — Angenommen eine Frage des Check-ins wird angezeigt, wenn die Person eine Antwort antippt, dann geht es ohne weitere Bestätigung zur nächsten Frage bzw. zum Vorschlag; mit „Zurück“ kann sie die vorige Frage ändern, ohne dass bereits gegebene Antworten verloren gehen.
- [ ] **AC-5** — Angenommen die Person hat für „Bewegen“ bzw. „Essen“ schon einmal einen Check-in gemacht, wenn sie diese Wahl erneut trifft, dann sind ihre letzten Antworten sichtbar vorausgewählt und sie sieht „Wie letztes Mal“ mit einer kurzen Zusammenfassung (z. B. „10 Min · wenig Energie · Zuhause“), das sie mit einem Tipp direkt zum Vorschlag führt.
- [ ] **AC-6** — Angenommen die Person öffnet „Heute“, wenn sie eine Aktion so schnell wie möglich starten will, dann braucht sie ohne Texteingabe höchstens 5 Tipps bis zum Start eines Workouts (mit „Wie letztes Mal“ höchstens 3) und höchstens 3 Tipps bis zum Start einer Mahlzeit.

### Vorschlag

- [ ] **AC-7** — Angenommen die Person hat den Bewegungs-Check-in beantwortet, wenn der Vorschlag ermittelt wird, dann kommen nur Workouts in Frage, die laut PROJ-4-Regel zu ihrem Profil passen, am gewählten Ort machbar sind (zuhause nur mit der Ausstattung aus dem Profil), höchstens die gewählte Zeit dauern und deren Intensität zur Energie passt („wenig“ → sanft; „mittel“ → sanft oder mittel; „viel“ → alle, soweit die Erfahrung sie erlaubt); sortiert wird nach (1) Dauer gleich der gewählten Zeit vor kürzeren, (2) Intensität näher an der Energie, (3) nicht in den letzten 72 Stunden von ihr begonnen vor kürzlich begonnenen, (4) Reihenfolge des Angebots.
- [ ] **AC-8** — Angenommen die Person hat den Essens-Check-in beantwortet, wenn der Vorschlag ermittelt wird, dann kommen nur Mahlzeiten in Frage, die zu ihrer Essensweise passen und zur gewählten Aufwandsstufe gehören; gibt es so weniger als drei, wird mit Mahlzeiten der jeweils einfacheren Stufen aufgefüllt („Bis 20 Min“ → „Schnell gekocht“ → „Ohne Kochen“); sortiert wird nach (1) gewählte Stufe vor aufgefüllten, (2) nicht in den letzten 72 Stunden von ihr begonnen vor kürzlich begonnenen, (3) Reihenfolge des Angebots.
- [ ] **AC-9** — Angenommen ein Vorschlag wurde ermittelt, wenn er angezeigt wird, dann steht der erste Platz als Hauptvorschlag deutlich im Vordergrund — mit Titel, Dauer bzw. Aufwand, einer Zeile „Passt zu: …“ mit ihren Angaben (z. B. „10 Min · wenig Energie · Zuhause“), ggf. dem Hinweis „Beispielinhalt – noch nicht fachlich geprüft“ und der Hauptaktion „Los geht's“ (Workout) bzw. „Das mach ich“ (Mahlzeit) —, darunter zurückhaltend bis zu zwei Alternativen (Plätze 2 und 3) mit Titel, Dauer bzw. Aufwand und „Stattdessen das“.
- [ ] **AC-10** — Angenommen ein Vorschlag wird angezeigt, wenn die Person den Titel eines Workouts oder einer Mahlzeit antippt, dann öffnet sich dessen Detailansicht aus PROJ-4 bzw. PROJ-5, ohne dass etwas als begonnen gilt.
- [ ] **AC-11** — Angenommen ein Vorschlag wird angezeigt, wenn er erscheint, dann sind Check-in-Antworten und Vorschlag (Hauptvorschlag und Alternativen) für die Person gespeichert; ein abgebrochener Check-in ohne angezeigten Vorschlag hinterlässt nichts.

### Aktion beginnen und abschließen

- [ ] **AC-12** — Angenommen ein Vorschlag wird angezeigt, wenn die Person „Los geht's“, „Das mach ich“ oder bei einer Alternative „Stattdessen das“ wählt, dann gilt genau dieses Workout bzw. diese Mahlzeit als begonnen, und es öffnet sich die geführte Durchführung des Workouts (PROJ-4, ohne Auswahl „leichter“) bzw. die Detailansicht der Mahlzeit (PROJ-5).
- [ ] **AC-13** — Angenommen die Person hat in den letzten 12 Stunden eine Aktion begonnen und noch nicht abgeschlossen, wenn sie „Heute“ öffnet, dann sieht sie diese Aktion oben mit Titel und den Möglichkeiten „Weitermachen“ (öffnet wieder die geführte Durchführung bzw. das Mahlzeit-Detail, ohne erneut zu beginnen), „Geschafft“ und „Heute nicht“; darunter bleibt „Was brauchst du gerade?“ erreichbar.
- [ ] **AC-14** — Angenommen eine begonnene Aktion wird angezeigt, wenn die Person „Geschafft“ wählt, dann gilt sie als geschafft und sie sieht ruhig „Geschafft. Gut gemacht.“; wählt sie „Heute nicht“, gilt sie als „heute nicht“ und sie sieht „Okay. Vielleicht ein andermal.“ — jeweils ohne Punkte, Streaks, Zähler oder Vorwurf.
- [ ] **AC-15** — Angenommen die Person hat eine Aktion als geschafft oder „heute nicht“ markiert, wenn sie danach noch keinen neuen Check-in begonnen hat, dann kann sie mit „Rückgängig“ die Markierung zurücknehmen und die Aktion gilt wieder als begonnen.
- [ ] **AC-16** — Angenommen eine Aktion ist begonnen, wenn die Person einen neuen Check-in macht und eine weitere Aktion beginnt, dann bleiben beide erhalten; die frühere bleibt „begonnen“, ohne Hinweis oder Vorwurf.

### Daten und Zugriff

- [ ] **AC-17** — Angenommen Check-ins, Vorschläge und Aktionen einer Person sind gespeichert, wenn eine andere angemeldete Person oder ein nicht angemeldeter Besucher sie direkt abfragen, ändern oder löschen will, dann wird das abgelehnt; jede Person liest und ändert nur ihre eigenen.
- [ ] **AC-18** — Angenommen eine Person lädt ihren Datenexport herunter (PROJ-1), wenn er erstellt wird, dann enthält er ihre Check-ins mit Antworten und Zeitpunkt, die Vorschläge und ihre Aktionen mit Zustand und Zeitpunkten.
- [ ] **AC-19** — Angenommen eine Person löscht ihr Konto (PROJ-1), wenn die Löschung ausgeführt wird, dann werden auch alle ihre Check-ins, Vorschläge und Aktionen gelöscht.

## Edge Cases

- [ ] **EC-1** — Angenommen für die Angaben gibt es kein passendes Workout bzw. keine passende Mahlzeit, wenn der Vorschlag angezeigt werden soll, dann sieht die Person einen ruhigen Hinweis „Gerade passt nichts genau.“ mit „Andere Angaben wählen“ (zurück zum Check-in) und einem Weg zu „Bewegung“ bzw. „Essen“ — keine leere Seite.
- [ ] **EC-2** — Angenommen es gibt nur einen oder zwei passende Inhalte, wenn der Vorschlag angezeigt wird, dann erscheinen nur so viele Alternativen wie vorhanden, ohne leere Plätze.
- [ ] **EC-3** — Angenommen alle passenden Inhalte wurden in den letzten 72 Stunden begonnen, wenn der Vorschlag ermittelt wird, dann gibt es trotzdem einen Vorschlag; die Abwechslung ändert nur die Reihenfolge.
- [ ] **EC-4** — Angenommen die Person tippt „Los geht's“, „Stattdessen das“, „Geschafft“ oder „Heute nicht“ mehrfach schnell hintereinander, wenn die Eingaben ankommen, dann entsteht genau eine begonnene Aktion bzw. genau eine Zustandsänderung.
- [ ] **EC-5** — Angenommen dieselbe Aktion ist auf zwei Geräten offen, wenn auf dem einen „Geschafft“ und auf dem anderen danach „Heute nicht“ gewählt wird, dann gilt die erste Markierung; das zweite Gerät zeigt den tatsächlichen Zustand, ohne Fehler.
- [ ] **EC-6** — Angenommen das vorgeschlagene Workout oder die Mahlzeit wird zwischen Anzeige und Start aus dem Angebot genommen, wenn die Person sie beginnen will, dann sieht sie „Das gibt es leider nicht mehr.“ und kann einen neuen Vorschlag mit denselben Angaben bekommen.
- [ ] **EC-7** — Angenommen die Person hat ihr Profil geändert, sodass eine letzte Antwort nicht mehr möglich ist (z. B. Ort entfernt), wenn der Check-in angezeigt wird, dann ist diese Antwort nicht vorausgewählt und „Wie letztes Mal“ wird nicht angeboten.
- [ ] **EC-8** — Angenommen eine begonnene Aktion ist älter als 12 Stunden, wenn die Person „Heute“ öffnet, dann wird sie dort nicht mehr angezeigt und nicht angemahnt; sie bleibt „begonnen“ gespeichert.
- [ ] **EC-9** — Angenommen das Speichern schlägt fehl (z. B. keine Verbindung), wenn die Person einen Vorschlag anfordert, eine Aktion beginnt oder markiert, dann sieht sie „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“ mit „Nochmal versuchen“; ihre Check-in-Antworten bleiben erhalten.

## Übergreifende Anforderungen

- Texte sind kurz, in einfachen Sätzen, du-Form; keine Bewertung von Leistung, Energie oder Essverhalten.
- Antwortknöpfe sind groß, mindestens 48 px hoch, per Tastatur bedienbar; die gewählte Antwort ist nicht nur an der Farbe erkennbar. Der Wechsel zur nächsten Frage wird Screenreadern angesagt.
- Der Hauptvorschlag ist die einzige visuell dominante Aktion auf „Heute“ (Designsystem).

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-6` — ob Energieangaben als Gesundheitsdaten gelten, Zweck und Aufbewahrungsfrist von Check-ins und Aktionen (bisher: bis zur Kontolöschung), Angaben von 12- bis 15-Jährigen.
- [ ] Bei der Produktvalidierung prüfen, ob 12 Stunden für offene Aktionen auf „Heute“ zu Schichtarbeit und unruhigen Tagen passen.
- [ ] Bei der Produktvalidierung prüfen, ob „Heute nicht“ als entlastend oder als Scheitern empfunden wird.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Erst „Bewegen“ oder „Essen“ wählen, dann ein Vorschlag mit zwei Alternativen | Eine Entscheidung pro Moment; passt auch zu Hunger mitten am Tag; die App rät nicht, was gerade gebraucht wird. | 2026-11-13 |
| Bewegen fragt Zeit, Energie und Ort; Essen nur den Aufwand | So wenige Fragen wie möglich; Ausstattung, Erfahrung und Essensweise kommen aus dem Profil. | 2026-11-13 |
| Keine Abfrage von Einschränkungen wie Schmerzen | Wären Gesundheitsdaten; die Energieangabe deckt schwierige Tage ab. | 2026-11-13 |
| Gespeichert werden Check-in, Vorschlag und Aktion (begonnen, geschafft, heute nicht) | Grundlage für Wochenblick (PROJ-8) und Erfolgsmessung im PRD. | 2026-11-13 |
| „Geschafft“ wird auf „Heute“ markiert, nicht automatisch nach dem Workout | Gleich für Bewegung und Essen; keine Änderung an PROJ-4 nötig. | 2026-11-13 |
| Feste, nachvollziehbare Regel mit Abwechslung über 72 Stunden | PRD verlangt nachvollziehbare Regeln; Abwechslung verhindert Eintönigkeit, ändert aber nur die Reihenfolge. | 2026-11-13 |
| Ein Tipp pro Frage, letzte Antworten vorausgewählt, „Wie letztes Mal“ | Zielwert unter 30 Sekunden bis zum Start (PRD). | 2026-11-13 |
| Mehrere Check-ins pro Tag, „Rückgängig“ bis zum nächsten Check-in | Erst Essen, später Bewegen ist normal; ein Fehltipp lässt sich korrigieren. | 2026-11-13 |
| Offene Aktionen erscheinen 12 Stunden lang auf „Heute“, ältere werden nicht angemahnt | Keine Nachholpflicht (PRD); 12 Stunden statt Kalendertag passt auch zu Nachtschichten. | 2026-11-13 |
| Tipp auf den Titel öffnet nur das Detail; erst die Hauptaktion beginnt | Ansehen ohne Verpflichtung; begonnen zählt nur, was wirklich gestartet wurde. | 2026-11-13 |
