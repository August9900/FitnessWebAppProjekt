# PROJ-8: Wochenblick

## Abhängigkeiten

- Benötigt: PROJ-6 (Tagesentscheidung) — Aktionsverlauf mit „begonnen“, „geschafft“, „heute nicht“ und Beginn-Zeitpunkt.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — Bereich „Wochenblick“ ersetzt den Platzhalter; Seitenmuster mit Lade-, Leer- und Fehlerzustand.
- Benötigt: PROJ-4 (Kurze Workouts) und PROJ-5 (Einfache Mahlzeiten) — Titel und Detailansichten der Inhalte.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — der Bereich ist wie „Heute“ erst mit vollständigen Angaben erreichbar.
- Benötigt: PROJ-1 (Konto & Anmeldung) — nur die eigene Person sieht ihren Verlauf.

## User Stories

- Als Person, die oft unterbrochen wird, möchte ich auf einen Blick sehen, was ich diese Woche schon für mich getan habe, damit ich merke, dass auch kleine Schritte zählen.
- Als Person, die nach einer Pause zurückkommt, möchte ich meine Woche ohne Lücken-Markierungen, Streaks oder Nachholaufforderungen sehen, damit der Wiedereinstieg leicht bleibt.
- Als Person, die ein Workout oder eine Mahlzeit wiederholen möchte, möchte ich es im Wochenblick antippen und direkt die Detailansicht öffnen.
- Als Person, die sich an letzte Woche erinnern will, möchte ich zu früheren Wochen zurückblättern.
- Als Person möchte ich sicher sein, dass nur ich meinen Wochenblick sehe.

## Nicht enthalten

- Zähler, Prozentwerte, Wochenziele, Streaks, Punkte, Vergleiche zwischen Wochen oder mit anderen Personen.
- Aktionen mit „heute nicht“ — sie erscheinen bewusst nicht im Rückblick.
- Markieren, Bearbeiten oder Löschen von Aktionen im Wochenblick; nachträgliches „Geschafft“ für ältere angefangene Aktionen — das bleibt auf „Heute“ (PROJ-6).
- Anzeige der Rückmeldungen aus PROJ-7 (Aufwand, „Lieber nicht“).
- Monats- oder Jahresansicht, Diagramme, Kalender-Export.
- Erinnerungen oder Benachrichtigungen.
- Ein eigener gespeicherter Wochenstand — der Wochenblick wird bei jedem Öffnen aus dem Aktionsverlauf abgeleitet.

## Acceptance Criteria

### Woche und Tage

- [ ] **AC-1** — Angenommen eine Person mit vollständigen Angaben öffnet „Wochenblick“, wenn die Seite angezeigt wird, dann sieht sie die laufende Kalenderwoche (Montag bis Sonntag) mit der Überschrift „Diese Woche“ und dem Datumsbereich (z. B. „17.–23. Nov.“) und darunter alle sieben Tage in der Reihenfolge Montag bis Sonntag, jeweils mit Wochentag und Datum.
- [ ] **AC-2** — Angenommen die laufende Woche wird angezeigt, wenn ein Tag der heutige ist, dann trägt er sichtbar den Hinweis „heute“, nicht nur durch Farbe.
- [ ] **AC-3** — Angenommen ein Tag hat keine anzuzeigende Aktion, wenn die Woche angezeigt wird, dann steht bei diesem Tag nur ein ruhiger Strich („–“), ohne Hinweis auf eine Lücke; Tage nach heute sehen genauso aus.

### Einträge

- [ ] **AC-4** — Angenommen die Person hat in der angezeigten Woche Aktionen begonnen, wenn die Woche angezeigt wird, dann erscheint jede Aktion mit dem Zustand „geschafft“ oder „begonnen“ an dem Tag, an dem sie begonnen wurde (Ortszeit der Person), mit Titel des Workouts bzw. der Mahlzeit, der Art („Bewegen“ bzw. „Essen“) und dem Zustand „geschafft“ bzw. „angefangen“; mehrere Aktionen eines Tages stehen in der Reihenfolge ihres Beginns.
- [ ] **AC-5** — Angenommen eine Aktion ist als „heute nicht“ markiert, wenn die Woche angezeigt wird, dann erscheint sie nicht.
- [ ] **AC-6** — Angenommen eine Aktion ist begonnen und seit mehr als 12 Stunden nicht markiert, wenn die Woche angezeigt wird, dann erscheint sie neutral als „angefangen“, ohne Aufforderung, sie abzuschließen.
- [ ] **AC-7** — Angenommen ein Eintrag wird angezeigt, wenn die Person seinen Titel antippt, dann öffnet sich die Detailansicht des Workouts (PROJ-4) bzw. der Mahlzeit (PROJ-5), ohne dass etwas als begonnen gilt.
- [ ] **AC-8** — Angenommen ein Eintrag wird angezeigt, wenn er erscheint, dann gibt es dort keine Möglichkeit zum Markieren, Ändern oder Löschen.

### Überblick

- [ ] **AC-9** — Angenommen in der angezeigten Woche ist mindestens eine Aktion „geschafft“, wenn die Woche angezeigt wird, dann steht unter der Überschrift der Satz „Diese Woche hast du etwas für dich getan.“ (für eine frühere Woche: „In dieser Woche hast du etwas für dich getan.“) — ohne Zahl, Ziel oder Vergleich.
- [ ] **AC-10** — Angenommen in der angezeigten Woche ist keine Aktion „geschafft“, wenn die Woche angezeigt wird, dann erscheint kein Überblickssatz und kein wertender Hinweis.
- [ ] **AC-11** — Angenommen die laufende Woche enthält keinen Eintrag, wenn sie angezeigt wird, dann sieht die Person unter den Tagen „Für diese Woche gibt es noch nichts. Auf „Heute“ findest du einen passenden nächsten Schritt.“ mit einem Weg zu „Heute“; eine frühere Woche ohne Eintrag zeigt nur die Tage mit Strich.

### Blättern

- [ ] **AC-12** — Angenommen eine Woche wird angezeigt, wenn die Person „Vorige Woche“ wählt, dann sieht sie die Kalenderwoche davor nach denselben Regeln, mit der Überschrift „Vorige Woche“ bzw. ab zwei Wochen zurück nur mit dem Datumsbereich.
- [ ] **AC-13** — Angenommen eine frühere Woche wird angezeigt, wenn die Person „Nächste Woche“ wählt, dann sieht sie die folgende Woche; in der laufenden Woche gibt es „Nächste Woche“ nicht.
- [ ] **AC-14** — Angenommen die angezeigte Woche ist die Woche, in der das Konto erstellt wurde, wenn sie angezeigt wird, dann gibt es „Vorige Woche“ nicht.
- [ ] **AC-15** — Angenommen die Person hat zu einer früheren Woche geblättert, wenn sie die Seite neu lädt oder die Adresse teilt, dann wird dieselbe Woche wieder angezeigt; eine ungültige, zukünftige oder vor der Kontoerstellung liegende Woche in der Adresse führt zur laufenden Woche.

### Daten und Zugriff

- [ ] **AC-16** — Angenommen eine Person öffnet ihren Wochenblick, wenn die Einträge geladen werden, dann sieht sie ausschließlich ihre eigenen Aktionen; nicht angemeldete Besucher werden zur Anmeldung geleitet.

## Edge Cases

- [ ] **EC-1** — Angenommen der Inhalt einer Aktion wurde aus dem Angebot genommen, wenn die Woche angezeigt wird, dann erscheint der Eintrag weiter mit „Dein Workout“ bzw. „Deine Mahlzeit“ statt des Titels und ohne Link.
- [ ] **EC-2** — Angenommen eine Aktion wurde kurz vor Mitternacht begonnen und nach Mitternacht als geschafft markiert, wenn die Woche angezeigt wird, dann steht sie am Tag ihres Beginns — auch über eine Wochengrenze hinweg (Sonntag → Montag).
- [ ] **EC-3** — Angenommen die Person markiert auf „Heute“ oder einem anderen Gerät eine Aktion, während der Wochenblick offen ist, wenn sie den Wochenblick erneut öffnet oder neu lädt, dann zeigt er den aktuellen Zustand.
- [ ] **EC-4** — Angenommen das Laden schlägt fehl (z. B. keine Verbindung), wenn der Wochenblick angezeigt werden soll, dann sieht die Person den Fehlerzustand des App-Rahmens mit einer Möglichkeit, es erneut zu versuchen — keine leere Woche, die wie „nichts getan“ aussieht.
- [ ] **EC-5** — Angenommen ein Tag hat viele Einträge (z. B. fünf), wenn die Woche auf einem Smartphone (375 px Breite) angezeigt wird, dann bleiben alle Einträge lesbar, ohne seitliches Scrollen und ohne abgeschnittene Titel.
- [ ] **EC-6** — Angenommen eine Aktion wurde mit „Rückgängig“ (PROJ-6) wieder auf „begonnen“ gesetzt, wenn die Woche angezeigt wird, dann erscheint sie als „angefangen“.

## Übergreifende Anforderungen

- Texte sind kurz, in du-Form; keine Bewertung von Leistung, Häufigkeit oder Lücken; keine Ausrufe wie „Super!“ oder „Weiter so!“.
- Die Woche ist als Liste von Tagen semantisch erkennbar und per Tastatur bedienbar; Zustände sind als Text lesbar, nicht nur als Symbol oder Farbe.
- Ruhige Darstellung ohne Animationen, Fortschrittsbalken oder hervorgehobene Kennzahlen (Designsystem).

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo` für die Projektgesamtheit — der Wochenblick liest Aktionsdaten (PROJ-6), speichert aber nichts Neues.
- [ ] Vor dem ersten Deploy: das technische Cookie mit der Gerätezeitzone (aus `/architecture`) in `/dsgvo` mitbetrachten.
- [ ] Bei der Produktvalidierung prüfen, ob „angefangen“ im Rückblick als neutral oder als unerledigt empfunden wird.
- [ ] Bei der Produktvalidierung prüfen, ob der Überblickssatz als ermutigend oder als belanglos empfunden wird.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Laufende Kalenderwoche Montag bis Sonntag, zurückblätterbar | Vertrauter Rahmen, passt zum Namen; Rückblick auf frühere Wochen möglich. | 2026-11-24 |
| Der heutige Tag ist mit „heute“ markiert | Orientierung in der Woche (Wunsch aus dem Interview). | 2026-11-24 |
| Nur „geschafft“ und „begonnen“, nicht „heute nicht“ | „Heute nicht“ ist eine bewusste Entlastung und soll im Rückblick nicht als Ausfall stehen. | 2026-11-24 |
| „Begonnen“ heißt im Wochenblick „angefangen“, ohne Aufforderung | Neutral und ohne Nachholpflicht (PRD). | 2026-11-24 |
| Überblickssatz ohne Zahl, nur wenn etwas geschafft wurde | Keine Zähler oder Vergleiche, die Druck erzeugen; leere Wochen werden nicht kommentiert. | 2026-11-24 |
| Nur ansehen; Titel öffnet die Detailansicht | Markieren bleibt an einer Stelle („Heute“); Wiederholen ist mit einem Tipp möglich. | 2026-11-24 |
| Leere Tage mit ruhigem Strich, auch zukünftige Tage | Keine Lücken-Markierung; die Woche bleibt vollständig sichtbar. | 2026-11-24 |
| Zurückblättern bis zur Woche der Kontoerstellung | Davor kann es keine Einträge geben. | 2026-11-24 |
| Zuordnung zum Tag nach dem Beginn der Aktion in Ortszeit | Eindeutig und passend zu „begonnen“; Nachtschichten bleiben an einem Tag. | 2026-11-24 |
| Rückmeldungen aus PROJ-7 werden nicht angezeigt | Der Wochenblick bleibt ruhig; Rückmeldungen wirken über die Vorschläge. | 2026-11-24 |
| Die angezeigte Woche steht in der Adresse | Neuladen und Zurück-Taste des Browsers zeigen dieselbe Woche. | 2026-11-24 |
