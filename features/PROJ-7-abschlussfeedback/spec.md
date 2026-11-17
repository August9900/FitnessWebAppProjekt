# PROJ-7: Abschlussfeedback

## Abhängigkeiten

- Benötigt: PROJ-6 (Tagesentscheidung) — Aktionen mit „Geschafft“, Bestätigungskarte mit „Rückgängig“ bis zum nächsten Check-in, Auswahlregel für Bewegen und Essen, Datenexport-Abschnitt.
- Benötigt: PROJ-4 (Kurze Workouts) — Intensitätsstufen sanft, mittel, kräftig.
- Benötigt: PROJ-5 (Einfache Mahlzeiten) — Mahlzeiten als bewertbare Inhalte.
- Benötigt: PROJ-1 (Konto & Anmeldung) — persönliche Speicherung, Datenexport und Kontolöschung.
- Wird genutzt von: PROJ-8 (Wochenblick) — kann die Rückmeldungen später anzeigen.

## User Stories

- Als Person, die gerade etwas geschafft hat, möchte ich mit einem Tipp sagen können, ob der Aufwand gepasst hat, damit der nächste Vorschlag besser zu mir passt.
- Als Person, der ein Workout oder eine Mahlzeit nicht gefallen hat, möchte ich „Lieber nicht“ sagen können, damit sie mir nur noch vorgeschlagen wird, wenn sonst wenig passt.
- Als Person, die sich nach dem Training nicht noch mit Fragen beschäftigen will, möchte ich die Rückmeldung einfach weglassen können, ohne dass etwas fehlt oder nachgefragt wird.
- Als Person, die sich vertippt hat, möchte ich meine Rückmeldung ändern können, solange die Bestätigung noch auf „Heute“ steht.
- Als Person, die wissen will, warum ihr etwas vorgeschlagen wird, möchte ich sehen, wenn meine letzte Rückmeldung den Vorschlag verändert hat.
- Als Person möchte ich sicher sein, dass nur ich meine Rückmeldungen sehe, dass sie in meinem Datenexport enthalten sind und mit meinem Konto gelöscht werden.

## Nicht enthalten

- Rückmeldung nach „Heute nicht“ — bewusst keine Frage, damit „Heute nicht“ entlastend bleibt.
- Nachträgliche Rückmeldung, nachdem die Bestätigungskarte verschwunden ist, etwa aus dem Wochenblick — höchstens später über `/refine PROJ-8`.
- Einfluss der Aufwand-Rückmeldung auf Mahlzeiten-Vorschläge — sie wird gespeichert, ändert die Vorschläge aber nicht.
- Bevorzugung von Inhalten mit „Gern wieder“ — die Abwechslung aus PROJ-6 bleibt unverändert.
- Freitext, Sterne, Punkte, Schulnoten oder eine Bewertung der Person.
- Eine Verwaltung aller „Lieber nicht“-Inhalte (Liste, Zurücksetzen).
- Rückmeldung zu einzelnen Übungen statt zum ganzen Workout.
- Weitergabe der Rückmeldungen an die Redaktion oder zur Bewertung der Inhalte.

## Acceptance Criteria

### Rückmeldung geben

- [ ] **AC-1** — Angenommen die Person hat eine Aktion auf „Heute“ als „Geschafft“ markiert, wenn die Bestätigung „Geschafft. Gut gemacht.“ angezeigt wird, dann stehen darunter „Wie war der Aufwand?“ mit „Zu wenig“, „Passte“, „Zu viel“ und „Wieder vorschlagen?“ mit „Gern wieder“, „Lieber nicht“ — für Workouts und Mahlzeiten gleich.
- [ ] **AC-2** — Angenommen eine Aktion wurde als „Heute nicht“ markiert, wenn die Bestätigung „Okay. Vielleicht ein andermal.“ angezeigt wird, dann erscheint keine Rückmeldungsfrage.
- [ ] **AC-3** — Angenommen die Rückmeldungsfragen werden angezeigt, wenn die Person eine Antwort antippt, dann ist sie ohne weitere Bestätigung gespeichert und sichtbar als gewählt markiert, nicht nur durch Farbe; beide Fragen lassen sich unabhängig voneinander beantworten.
- [ ] **AC-4** — Angenommen die Person beantwortet eine oder beide Fragen nicht, wenn sie „Heute“ verlässt oder einen neuen Check-in beginnt, dann wird nichts nachgefragt, nichts angemahnt und es gibt keinen Hinweis auf eine fehlende Rückmeldung.
- [ ] **AC-5** — Angenommen die Person hat eine Rückmeldung gegeben, wenn sie „Heute“ später erneut öffnet und die Bestätigungskarte noch angezeigt wird, dann sind ihre gewählten Antworten weiterhin markiert.

### Ändern und zurücknehmen

- [ ] **AC-6** — Angenommen die Bestätigungskarte wird angezeigt, wenn die Person bei einer Frage eine andere Antwort antippt, dann ersetzt diese die bisherige Antwort.
- [ ] **AC-7** — Angenommen die Person hat seit dem „Geschafft“ einen neuen Check-in begonnen, wenn sie „Heute“ öffnet, dann ist die Bestätigungskarte mit den Fragen verschwunden (wie in PROJ-6) und die Rückmeldung lässt sich nicht mehr ändern.
- [ ] **AC-8** — Angenommen die Person hat eine Rückmeldung gegeben, wenn sie mit „Rückgängig“ das „Geschafft“ zurücknimmt, dann wird die Rückmeldung zu dieser Aktion gelöscht; wird die Aktion danach erneut als geschafft markiert, erscheinen die Fragen ohne Vorauswahl.

### Einfluss auf Vorschläge

- [ ] **AC-9** — Angenommen die Person hat bei einem Workout oder einer Mahlzeit zuletzt „Lieber nicht“ gewählt, wenn ein Vorschlag ermittelt wird, für den dieser Inhalt in Frage kommt, dann steht er hinter allen anderen passenden Inhalten; er erscheint nur noch, wenn ohne ihn weniger als drei passende Inhalte übrig bleiben. Bei Mahlzeiten steht er auch hinter den aufgefüllten Mahlzeiten aus einfacheren Stufen (PROJ-6, AC-8).
- [ ] **AC-10** — Angenommen die Person hat einen Inhalt mit „Lieber nicht“ bewertet und gibt ihm bei einer späteren Aktion „Gern wieder“, wenn danach ein Vorschlag ermittelt wird, dann gilt für diesen Inhalt nur noch die Regel aus PROJ-6; „Gern wieder“ bevorzugt nichts.
- [ ] **AC-11** — Angenommen die jüngste Aufwand-Rückmeldung der Person zu einem Workout ist „Zu viel“ und höchstens 14 Tage alt, wenn ein Bewegungs-Vorschlag ermittelt wird, dann wird bei der Sortierung nach Intensität (PROJ-6, AC-7, Schritt 2) eine Stufe sanfter angestrebt, als die Energie nahelegt („viel“ → mittel, „mittel“ → sanft, „wenig“ bleibt sanft); welche Workouts überhaupt in Frage kommen, ändert sich nicht.
- [ ] **AC-12** — Angenommen die jüngste Aufwand-Rückmeldung der Person zu einem Workout ist „Zu wenig“ und höchstens 14 Tage alt, wenn ein Bewegungs-Vorschlag ermittelt wird, dann wird bei der Sortierung nach Intensität eine Stufe kräftiger angestrebt („wenig“ → mittel, „mittel“ → kräftig, „viel“ bleibt kräftig); Intensitäten, die Energie oder Erfahrung nicht erlauben, bleiben ausgeschlossen.
- [ ] **AC-13** — Angenommen die jüngste Aufwand-Rückmeldung zu einem Workout ist „Passte“ oder älter als 14 Tage, oder es gibt keine, wenn ein Bewegungs-Vorschlag ermittelt wird, dann gilt die Sortierung aus PROJ-6 unverändert.
- [ ] **AC-14** — Angenommen die Person gibt eine Aufwand-Rückmeldung zu einer Mahlzeit, wenn danach ein Mahlzeiten-Vorschlag ermittelt wird, dann ändert diese Rückmeldung den Vorschlag nicht und ersetzt auch nicht die jüngste Aufwand-Rückmeldung zu einem Workout.
- [ ] **AC-15** — Angenommen die Verschiebung aus AC-11 bzw. AC-12 hat dazu geführt, dass ein anderer Hauptvorschlag erscheint als ohne sie, wenn der Vorschlag angezeigt wird, dann steht unter „Passt zu: …“ die Zeile „Etwas sanfter, weil es letztes Mal zu viel war.“ bzw. „Etwas kräftiger, weil es letztes Mal zu wenig war.“; ändert sich der Hauptvorschlag nicht, erscheint keine Zeile. „Lieber nicht“ wird nie erwähnt.

### Daten und Zugriff

- [ ] **AC-16** — Angenommen Rückmeldungen einer Person sind gespeichert, wenn eine andere angemeldete Person oder ein nicht angemeldeter Besucher sie lesen, anlegen, ändern oder löschen will, dann wird das abgelehnt; Rückmeldungen gibt es nur zu eigenen, als geschafft markierten Aktionen.
- [ ] **AC-17** — Angenommen eine Person lädt ihren Datenexport herunter (PROJ-1), wenn er erstellt wird, dann enthält er ihre Rückmeldungen mit Aufwand, „Wieder vorschlagen“, der zugehörigen Aktion und dem Zeitpunkt der letzten Änderung.
- [ ] **AC-18** — Angenommen eine Person löscht ihr Konto (PROJ-1), wenn die Löschung ausgeführt wird, dann werden auch alle ihre Rückmeldungen gelöscht.

## Edge Cases

- [ ] **EC-1** — Angenommen die Person tippt dieselbe oder verschiedene Antworten einer Frage mehrfach schnell hintereinander, wenn die Eingaben ankommen, dann gilt die zuletzt getippte Antwort, und es gibt zu jeder Frage höchstens eine gespeicherte Antwort pro Aktion.
- [ ] **EC-2** — Angenommen dieselbe Bestätigungskarte ist auf zwei Geräten offen, wenn auf beiden verschiedene Antworten getippt werden, dann gilt die zuletzt gespeicherte; das andere Gerät zeigt sie beim nächsten Öffnen von „Heute“, ohne Fehler.
- [ ] **EC-3** — Angenommen das Speichern einer Antwort schlägt fehl (z. B. keine Verbindung), wenn die Person eine Antwort antippt, dann sieht sie „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“ mit „Nochmal versuchen“, und als gewählt markiert bleibt die zuletzt gespeicherte Antwort.
- [ ] **EC-4** — Angenommen auf einem anderen Gerät wurde „Rückgängig“ gewählt oder ein neuer Check-in begonnen, wenn die Person danach auf der noch offenen Karte eine Antwort antippt, dann wird nichts gespeichert und „Heute“ zeigt den tatsächlichen Zustand, ohne Fehlermeldung.
- [ ] **EC-5** — Angenommen alle passenden Inhalte sind mit „Lieber nicht“ bewertet, wenn ein Vorschlag ermittelt wird, dann gibt es trotzdem einen Vorschlag aus diesen Inhalten — „Lieber nicht“ ändert nur die Reihenfolge, nie die Auswahl.
- [ ] **EC-6** — Angenommen der bewertete Inhalt wurde inzwischen aus dem Angebot genommen, wenn die Bestätigungskarte angezeigt wird, dann lässt sich die Rückmeldung trotzdem geben; kommt der Inhalt später zurück, gilt ein „Lieber nicht“ weiter.
- [ ] **EC-7** — Angenommen die Person hat „Zu viel“ gewählt und die Energie „wenig“ angegeben, wenn der Vorschlag ermittelt wird, dann bleibt die Sortierung wie ohne Rückmeldung (sanfter als sanft gibt es nicht) und es erscheint keine Erklärungszeile.
- [ ] **EC-8** — Angenommen die Person gibt zu mehreren Workouts nacheinander Aufwand-Rückmeldungen, wenn ein Bewegungs-Vorschlag ermittelt wird, dann zählt nur die zuletzt gespeicherte, und die 14 Tage aus AC-11 und AC-12 rechnen ab deren Speicherzeitpunkt.

## Übergreifende Anforderungen

- Texte sind kurz, in du-Form und bewerten weder die Person noch ihre Leistung; „Zu wenig“ und „Zu viel“ beschreiben den Inhalt, nicht die Person.
- Antwortknöpfe sind mindestens 48 px hoch und per Tastatur bedienbar; die gewählte Antwort ist für Screenreader als gewählt erkennbar.
- Die Fragen treten hinter den Hauptvorschlag zurück; sie sind keine visuell dominante Aktion auf „Heute“ (Designsystem).

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-7` — ob Aufwand-Rückmeldungen zu Workouts als Gesundheitsdaten gelten, Aufbewahrungsfrist (bisher bis zur Kontolöschung), Angaben von 12- bis 15-Jährigen.
- [ ] Bei der Produktvalidierung prüfen, ob die zwei Fragen nach „Geschafft“ als hilfreich oder als lästig empfunden werden, und wie oft sie beantwortet werden.
- [ ] Bei der Produktvalidierung prüfen, ob 14 Tage für die Wirkung der Aufwand-Rückmeldung passen.
- [ ] Fachlich prüfen lassen, ob „Zu wenig“ eine kräftigere Intensität anstreben darf, besonders bei Minderjährigen und Einsteigern (die Grenzen aus Energie und Erfahrung bleiben bestehen).

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Rückmeldung nur nach „Geschafft“, nicht nach „Heute nicht“ | „Heute nicht“ soll entlasten und nicht nach Rechtfertigung klingen (PRD: keine Nachholpflicht). | 2026-11-17 |
| Zwei getrennte Ein-Tipp-Fragen: Aufwand (Zu wenig / Passte / Zu viel) und „Wieder vorschlagen?“ (Gern wieder / Lieber nicht) | Entspricht dem Datenmodell (Aufwand und Inhalt); je ein Tipp, beide freiwillig, kein Absenden-Knopf. | 2026-11-17 |
| Die Fragen stehen in der bestehenden Bestätigungskarte aus PROJ-6 | Keine neue Ansicht, kein zusätzlicher Schritt; verschwindet mit dem nächsten Check-in wie die Karte. | 2026-11-17 |
| Änderbar, solange die Karte angezeigt wird; „Rückgängig“ löscht die Rückmeldung | Fehltipps lassen sich korrigieren; die Rückmeldung gehört zu „Geschafft“. | 2026-11-17 |
| „Lieber nicht“ sortiert den Inhalt ganz nach hinten, schließt ihn aber nie aus; gilt bis zu einem späteren „Gern wieder“ | Es gibt weiterhin immer einen Vorschlag, wenn etwas passt; kein Verwaltungsbildschirm nötig. | 2026-11-17 |
| „Gern wieder“ bevorzugt nichts | Die Abwechslung aus PROJ-6 bleibt; „Gern wieder“ hebt nur ein „Lieber nicht“ auf. | 2026-11-17 |
| Aufwand bei Workouts verschiebt die angestrebte Intensität um eine Stufe, 14 Tage lang, nur die jüngste Rückmeldung zählt | Wirkt auch auf andere Workouts, bleibt nachvollziehbar; die harten Grenzen aus Energie und Erfahrung bleiben. | 2026-11-17 |
| Aufwand bei Mahlzeiten wird nur gespeichert | Die Person wählt den Aufwand beim Essens-Check-in jedes Mal selbst. | 2026-11-17 |
| Erklärungszeile nur, wenn die Rückmeldung den Hauptvorschlag tatsächlich verändert hat | Nachvollziehbare Regeln (PRD), ohne bei jedem Vorschlag eine Zeile mehr zu zeigen. | 2026-11-17 |
| Gewählte Antwort bleibt markiert, keine zusätzliche Dankesmeldung | Die Markierung bestätigt das Speichern; weniger Text auf „Heute“. | 2026-11-17 |
