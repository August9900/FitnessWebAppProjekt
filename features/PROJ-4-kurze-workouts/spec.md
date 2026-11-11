# PROJ-4: Kurze Workouts

## Abhängigkeiten

- Benötigt: PROJ-2 (App-Rahmen & Navigation) — Bereich „Bewegung“, gemeinsame Bausteine.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — Orte, Ausstattung zuhause und Erfahrung bestimmen, welche Workouts passen; der Bereich ist erst mit vollständigen Angaben erreichbar.
- Wird genutzt von: PROJ-6 (Tagesentscheidung) — wählt aus diesem Angebot und nutzt die geführte Durchführung; PROJ-9 (Übungsbibliothek) — baut auf denselben Übungen auf.

## User Stories

- Als Person mit wenig Zeit oder Energie möchte ich sofort sehen, welche kurzen Workouts zu meinem Ort und meiner Ausstattung passen, damit ich nicht erst suchen und abwägen muss.
- Als Person, die sich leicht ablenken lässt, möchte ich ein Workout Schritt für Schritt geführt machen — eine Übung pro Bildschirm mit Timer —, damit ich nicht den Faden verliere.
- Als Person an einem schwierigen Tag möchte ich jede Übung leichter machen können, ohne das ganze Workout abzubrechen.
- Als Person, die zwischendurch aufhören muss, möchte ich ein Workout jederzeit beenden können, ohne dass mir etwas angerechnet oder vorgehalten wird.
- Als Person, die zuhause, draußen oder im Studio trainiert, möchte ich auch Workouts für andere Orte ansehen können, wenn ich gerade woanders bin.

## Nicht enthalten

- Speichern, ob ein Workout begonnen oder abgeschlossen wurde, Verlauf und Wochenansicht — gehören zu PROJ-6, PROJ-7 und PROJ-8.
- Die Auswahl eines einzelnen Vorschlags für heute anhand von Zeit und Energie — gehört zu PROJ-6.
- Nachschlagen einzelner Übungen unabhängig von einem Workout — gehört zu PROJ-9.
- Eigene Workouts oder Trainingspläne zusammenstellen — gehört zu PROJ-10.
- Übungen austauschen, Workouts insgesamt kürzen, eigene Wiederholungszahlen.
- Bilder, Videos, Ton- oder Sprachausgabe und Vibration während des Workouts.
- Eine Redaktionsoberfläche zum Pflegen der Inhalte; Inhalte werden im Prototyp vom Team bereitgestellt.
- Streaks, Punkte, Kalorienangaben oder Vergleiche mit anderen.

## Acceptance Criteria

### Übersicht

- [ ] **AC-1** — Angenommen eine Person mit vollständigen Angaben öffnet „Bewegung“, wenn die Übersicht angezeigt wird, dann sieht sie die für sie passenden Workouts mit Titel, Dauer in Minuten, Intensität („sanft“, „mittel“ oder „kräftig“), Orten und benötigter Ausstattung.
- [ ] **AC-2** — Angenommen ein Workout wird für eine Person geprüft, wenn entschieden wird, ob es passt, dann passt es genau dann, wenn (a) es an mindestens einem Ort der Person machbar ist — zuhause nur, wenn die benötigte Ausstattung zu ihrer Ausstattung zuhause gehört, draußen und im Studio ohne Ausstattungsprüfung — und (b) seine Intensität zur Erfahrung passt: „Ich fange gerade an“ → sanft; „Ich bewege mich ab und zu“ → sanft oder mittel; „Ich trainiere regelmäßig“ → alle.
- [ ] **AC-3** — Angenommen die Übersicht wird angezeigt, wenn die Person nach Dauer filtert („Alle“, „5 Min“, „10 Min“, „15 Min“), dann zeigt die Liste sofort nur Workouts dieser Dauer.
- [ ] **AC-4** — Angenommen die Person wählt „Alle Workouts anzeigen“, wenn die Liste erscheint, dann sieht sie auch nicht passende Workouts, jeweils mit einem kurzen Grund (z. B. „braucht Kurzhanteln“, „nur im Fitnessstudio“, „kräftige Intensität“).
- [ ] **AC-5** — Angenommen für die Person oder den gewählten Filter passt kein Workout, wenn die Übersicht angezeigt wird, dann sieht sie einen ruhigen Hinweis und eine Möglichkeit, alle Workouts bzw. alle Dauern anzuzeigen — keine leere Seite.

### Detail

- [ ] **AC-6** — Angenommen die Person öffnet ein Workout, wenn die Detailansicht angezeigt wird, dann sieht sie Beschreibung, Dauer, Intensität, Orte, benötigte Ausstattung und die Abfolge der Übungen mit Name, Dauer in Sekunden oder Anzahl Wiederholungen und einer kurzen Anleitung in einfachen Sätzen, dazu den Hinweis „Hör auf deinen Körper. Bei Schmerzen hörst du auf.“ und die Schaltfläche „Los geht's“.
- [ ] **AC-7** — Angenommen eine Übung wird angezeigt (Detail oder geführte Ansicht), wenn die Person „Leichter“ wählt, dann sieht sie stattdessen die leichtere Variante dieser Übung mit eigener Anleitung; die Wahl gilt für diesen Durchgang und lässt sich zurücknehmen.

### Geführte Durchführung

- [ ] **AC-8** — Angenommen die Person startet ein Workout mit „Los geht's“, wenn die geführte Ansicht angezeigt wird, dann steht genau eine Übung auf dem Bildschirm mit „Übung X von Y“, Name, Anleitung und — je nach Übung — einem Timer oder der Anzahl Wiederholungen, dazu „Zurück“ und „Weiter“.
- [ ] **AC-9** — Angenommen eine Übung hat eine Dauer, wenn die Person den Timer startet, dann zählt er sichtbar herunter, lässt sich pausieren und fortsetzen, und an seinem Ende erscheint ein ruhiger Hinweis „Geschafft – weiter, wenn du bereit bist.“; die nächste Übung beginnt erst, wenn die Person „Weiter“ wählt.
- [ ] **AC-10** — Angenommen die Person ist in der geführten Ansicht, wenn sie „Beenden“ wählt, dann verlässt sie das Workout ohne Rückfrage, Vorwurf oder Hinweis auf Verlorenes und landet in der Detailansicht.
- [ ] **AC-11** — Angenommen die Person schließt die letzte Übung mit „Weiter“ ab, wenn das Ende erreicht ist, dann sieht sie einen kurzen, neutralen Abschluss („Geschafft. Gut gemacht.“) und einen Weg zurück zu „Bewegung“; es wird nichts gespeichert, gezählt oder verglichen.

### Inhalte

- [ ] **AC-12** — Angenommen ein Workout ist noch nicht als fachlich geprüft markiert, wenn es in der Übersicht, im Detail oder in der geführten Ansicht erscheint, dann trägt es sichtbar den Hinweis „Beispielinhalt – noch nicht fachlich geprüft“.
- [ ] **AC-13** — Angenommen das Angebot wird im Prototyp bereitgestellt, wenn die Übersicht mit „Alle Workouts anzeigen“ geöffnet wird, dann gibt es mindestens 10 Workouts, darunter je mindestens eines mit 5, 10 und 15 Minuten, für jeden Ort, für zuhause ohne Ausstattung sowie mit Matte, Kurzhanteln und Widerstandsband, und in jeder Intensität; jede Übung hat eine leichtere Variante.
- [ ] **AC-14** — Angenommen eine angemeldete Person sendet eine direkte Anfrage, die Workouts oder Übungen anlegen, ändern oder löschen will, wenn sie verarbeitet wird, dann wird sie abgelehnt; Inhalte sind für alle Nutzenden nur lesbar.

## Edge Cases

- [ ] **EC-1** — Angenommen eine Person ändert im Profil ihre Orte, Ausstattung oder Erfahrung, wenn sie danach „Bewegung“ öffnet, dann entspricht die Liste der passenden Workouts den neuen Angaben.
- [ ] **EC-2** — Angenommen eine Person ruft die Adresse eines Workouts auf, das es nicht gibt oder das nicht mehr angeboten wird, wenn die Seite angezeigt wird, dann sieht sie „Dieses Workout gibt es nicht (mehr)“ mit einem Weg zurück zu „Bewegung“.
- [ ] **EC-3** — Angenommen eine Person verlässt die geführte Ansicht mittendrin (anderer Bereich, Tab geschlossen, Neuladen), wenn sie das Workout wieder startet, dann beginnt es bei der ersten Übung; es entsteht kein Fehler und nichts wird gespeichert.
- [ ] **EC-4** — Angenommen ein Timer läuft und das Gerät wechselt in den Hintergrund oder der Bildschirm geht aus, wenn die Person zurückkehrt, dann zeigt der Timer die tatsächlich verbleibende Zeit bzw. das Ende an.
- [ ] **EC-5** — Angenommen die Person tippt in der geführten Ansicht mehrfach schnell auf „Weiter“, wenn die Eingaben ankommen, dann rückt die Ansicht pro Tipp höchstens eine Übung vor und überspringt keine unbemerkt.
- [ ] **EC-6** — Angenommen reduzierte Bewegung ist aktiv (PROJ-2), wenn ein Timer läuft, dann wird die Zeit nur als Zahl angezeigt, ohne animierte Kreise oder Balken.

## Übergreifende Anforderungen

- Anleitungen sind kurz, in einfachen Sätzen, du-Form, ohne Fachsprache; jede Übung höchstens drei Sätze.
- Alle Bedienelemente der geführten Ansicht sind per Tastatur erreichbar und mindestens 48 px hoch (PROJ-2). Der Timer kündigt Start und Ende für Screenreader an, nicht jede Sekunde.
- Keine Bewertung der Leistung, keine Kalorien, keine Rangfolgen, keine Streaks.

## Offene Fragen

- [ ] Vor dem ersten Deploy: Sport-Fachleute prüfen alle Workouts und Übungen einschließlich der leichteren Varianten; ungeprüfte Inhalte dürfen öffentlich nicht angezeigt werden.
- [ ] Vor dem ersten Deploy: Klären, ob für 12- bis 15-Jährige Inhalte mit „kräftiger“ Intensität angeboten werden dürfen (fachliche Prüfung).
- [ ] Ob Ton oder Vibration am Timer-Ende hilft oder stört, wird bei der Produktvalidierung mit der Zielgruppe geklärt.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| PROJ-4 umfasst Übersicht, Detail und geführte Durchführung, aber kein Speichern | Im Prototyp lässt sich ein Workout wirklich machen; Verlauf und Abschluss gehören laut Datenmodell zum Tagesvorschlag (PROJ-6 bis PROJ-8). | 2026-11-11 |
| „Anpassbar“ heißt: leichtere Variante je Übung | Einfach, hilft an energiearmen Tagen, ohne zusätzliche Entscheidungen; Austauschen und Kürzen erzeugen mehr Wahlmöglichkeiten. | 2026-11-11 |
| Passend nach Orten, Ausstattung zuhause und Erfahrung; Intensität nach festen Stufen | Nachvollziehbare Regel statt Empfehlungsalgorithmus (PRD); man sieht nur, was gerade machbar ist. | 2026-11-11 |
| „Alle Workouts anzeigen“ mit Grund für nicht passende | Wer gerade woanders ist, findet trotzdem etwas; der Grund erklärt, warum es normalerweise nicht passt. | 2026-11-11 |
| Kein automatisches Weiterschalten nach dem Timer | Ruhiger; niemand wird mitgezogen, wenn eine Pause nötig ist. | 2026-11-11 |
| Beenden jederzeit ohne Rückfrage oder Vorwurf; kein Fortsetzen eines abgebrochenen Durchgangs | Keine Nachholpflicht (PRD); ein kurzes Workout neu zu beginnen ist zumutbar. | 2026-11-11 |
| Etwa 10 Beispiel-Workouts, sichtbar als „noch nicht fachlich geprüft“ markiert | Der Prototyp braucht Inhalte; die Markierung verhindert, dass ungeprüfte Inhalte unbemerkt als geprüft gelten. | 2026-11-11 |
| Nur Text, keine Bilder, Videos oder Töne in der ersten Fassung | Kleiner Umfang; Medien brauchen eigene Prüfung und Produktion. | 2026-11-11 |
