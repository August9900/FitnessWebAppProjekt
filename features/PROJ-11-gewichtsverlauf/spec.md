# PROJ-11: Gewichtsverlauf

> Ein eigener, ruhiger Bereich „Gewicht“ für Personen ab 16: eigene Einträge als Liste und Kurve — ohne Ziel, ohne Bewertung, ohne Erinnerungen.

## Abhängigkeiten

- Benötigt: PROJ-1 (Konto & Anmeldung) — persönliche Speicherung, die bei der Registrierung festgelegte Altersgruppe, Datenexport und Kontolöschung.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — **Änderung an PROJ-2:** ein sechster Hauptbereich „Gewicht“ zwischen „Wochenblick“ und „Profil“, der nur für die Altersgruppe „ab 16“ erscheint und sich ausblenden lässt.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — der Bereich ist wie Bewegung und Essen erst mit vollständigen Angaben erreichbar. **Änderung am Profil:** ein Abschnitt mit dem Schalter „Gewicht in der Navigation zeigen“ (nur ab 16).

## User Stories

- Als Person ab 16, die ihr Gewicht im Blick behalten möchte, möchte ich schnell einen Wert für heute oder einen früheren Tag eintragen.
- Als Person ab 16 möchte ich meine Einträge als Liste und als einfache Kurve über einen gewählten Zeitraum sehen, ohne dass die App sie bewertet.
- Als Person, die sich vertippt hat, möchte ich einen Eintrag ändern oder löschen können.
- Als Person, die Zahlen zum Körper belasten, möchte ich den Bereich ausblenden können, ohne meine Einträge zu verlieren.
- Als Person möchte ich sicher sein, dass nur ich meine Gewichtseinträge sehe, dass ich sie vollständig löschen kann, dass sie in meinem Datenexport enthalten sind und mit meinem Konto gelöscht werden.

## Nicht enthalten

- Nutzung durch die Altersgruppe „12–15“ — kein Bereich, kein Eintrag, kein Hinweis.
- Zielgewicht, BMI, Körpergröße, Einordnungen wie „Normalgewicht“, Trendpfeile, Prognosen.
- Farben oder Texte, die eine Veränderung als gut oder schlecht bewerten; Lob, Warnungen, Ranglisten, Streaks.
- Erinnerungen oder Aufforderungen zum Wiegen.
- Anzeige des Gewichts auf „Heute“, im Wochenblick oder in Vorschlägen; Einfluss auf Tagesvorschläge (PROJ-6).
- Berechnete Kalorien- oder Nährwertziele aus dem Gewicht — gehört gegebenenfalls zu PROJ-12.
- Mehrere Einträge pro Tag, Uhrzeiten, andere Einheiten als kg (z. B. lb, st).
- Import von Waagen, Wearables oder anderen Apps; Körperfett und andere Körpermaße.
- Teilen des Verlaufs mit anderen Personen.

## Acceptance Criteria

### Zugang

- [ ] **AC-1** — Angenommen eine angemeldete Person mit der Altersgruppe „ab 16“ und vollständigen Angaben hat „Gewicht in der Navigation zeigen“ eingeschaltet (Standard), wenn die Navigation angezeigt wird, dann steht dort der Bereich „Gewicht“ zwischen „Wochenblick“ und „Profil“ — auf dem Desktop in der Seitenleiste wie auf dem Smartphone in der unteren Leiste — und führt zum Gewichtsverlauf.
- [ ] **AC-2** — Angenommen eine Person hat die Altersgruppe „12–15“, wenn sie die App nutzt, dann gibt es für sie keinen Bereich „Gewicht“ in der Navigation und keinen Schalter im Profil; ruft sie die Adresse des Bereichs direkt auf, erscheint „Nicht gefunden“ ohne Hinweis auf das Alter, und jeder Versuch, Einträge zu lesen, anzulegen, zu ändern oder zu löschen, wird abgelehnt.
- [ ] **AC-3** — Angenommen eine Person ab 16 hat noch unvollständige Angaben, wenn sie den Bereich „Gewicht“ aufruft, dann führt er wie Bewegung und Essen zum Einstieg (PROJ-3).

### Eintragen

- [ ] **AC-4** — Angenommen der Bereich wird angezeigt, wenn die Person „Eintragen“ wählt, dann gibt sie ein Gewicht in kg ein (Komma oder Punkt, höchstens eine Nachkommastelle) und ein Datum, das mit heute vorausgefüllt ist; nach „Speichern“ steht der Eintrag in Liste und Kurve.
- [ ] **AC-5** — Angenommen die Eingaben sind ungültig, wenn die Person speichern will, dann wird nicht gespeichert und sie sieht beim betroffenen Feld einen Hinweis: Gewicht fehlt, ist keine Zahl, hat mehr als eine Nachkommastelle oder liegt außerhalb von 30,0 bis 300,0 kg; Datum fehlt oder liegt in der Zukunft.
- [ ] **AC-6** — Angenommen für das gewählte Datum gibt es schon einen Eintrag, wenn die Person speichern will, dann fragt die App „Für diesen Tag gibt es schon einen Eintrag (<Wert> kg). Ersetzen?“ mit „Ersetzen“ und „Abbrechen“; nach „Ersetzen“ gibt es für diesen Tag genau einen Eintrag mit dem neuen Wert, nach „Abbrechen“ bleibt der alte und die Eingaben bleiben erhalten.

### Verlauf ansehen

- [ ] **AC-7** — Angenommen es gibt Einträge, wenn der Bereich angezeigt wird, dann sieht die Person eine Kurve mit Datum und kg für den gewählten Zeitraum „1 Monat“, „3 Monate“ (voreingestellt) oder „1 Jahr“; die Kurve hat keine Zielmarken, Trendpfeile oder wertenden Farben, und die gewählte Zeitraum-Option ist nicht nur an der Farbe erkennbar.
- [ ] **AC-8** — Angenommen im gewählten Zeitraum gibt es weniger als zwei Einträge, wenn die Kurve angezeigt werden soll, dann steht an ihrer Stelle „Zu wenige Einträge für eine Kurve.“; die Liste bleibt vollständig.
- [ ] **AC-9** — Angenommen es gibt Einträge, wenn der Bereich angezeigt wird, dann sieht die Person unter der Kurve alle Einträge als Liste, neueste zuerst, jeweils mit Datum und Wert in kg (deutsches Format, z. B. „72,4 kg“) und den Wegen „Ändern“ und „Löschen“; die Liste ist die Textfassung der Kurve.
- [ ] **AC-10** — Angenommen die Person hat keine Einträge, wenn der Bereich angezeigt wird, dann steht dort „Hier siehst du deinen Verlauf, sobald du etwas einträgst.“ mit „Eintragen“ — keine leere Kurve.

### Ändern und Löschen

- [ ] **AC-11** — Angenommen die Person wählt bei einem Eintrag „Ändern“, wenn sie Gewicht oder Datum ändert und speichert, dann gelten dieselben Regeln wie beim Eintragen (AC-5, AC-6) und der Eintrag zeigt danach die neuen Werte.
- [ ] **AC-12** — Angenommen die Person wählt bei einem Eintrag „Löschen“, wenn die Bestätigung „Eintrag vom <Datum> löschen?“ mit „Löschen“ bestätigt wird, dann ist der Eintrag aus Liste und Kurve entfernt; „Abbrechen“ lässt ihn stehen.
- [ ] **AC-13** — Angenommen es gibt Einträge, wenn die Person „Alle Einträge löschen“ wählt und die Bestätigung „Alle Gewichtseinträge löschen? Das lässt sich nicht rückgängig machen.“ bestätigt, dann sind alle ihre Gewichtseinträge gelöscht und der Bereich zeigt den leeren Zustand (AC-10).

### Ausblenden

- [ ] **AC-14** — Angenommen eine Person ab 16 schaltet im Profil „Gewicht in der Navigation zeigen“ aus, wenn sie danach die App nutzt — auch auf einem anderen Gerät —, dann erscheint „Gewicht“ nicht mehr in der Navigation und die Adresse des Bereichs zeigt „Nicht gefunden“; ihre Einträge bleiben gespeichert und sind nach dem Wiedereinschalten unverändert da.

### Daten und Zugriff

- [ ] **AC-15** — Angenommen Gewichtseinträge einer Person sind gespeichert, wenn eine andere angemeldete Person oder ein nicht angemeldeter Besucher sie lesen, anlegen, ändern oder löschen will, dann wird das abgelehnt.
- [ ] **AC-16** — Angenommen eine Person lädt ihren Datenexport herunter (PROJ-1), wenn er erstellt wird, dann enthält er alle ihre Gewichtseinträge mit Datum und Wert sowie die Einstellung „Gewicht in der Navigation zeigen“ — auch wenn der Bereich gerade ausgeblendet ist.
- [ ] **AC-17** — Angenommen eine Person löscht ihr Konto (PROJ-1), wenn die Löschung ausgeführt wird, dann werden auch alle ihre Gewichtseinträge gelöscht.

## Edge Cases

- [ ] **EC-1** — Angenommen auf zwei Geräten wird gleichzeitig ein Eintrag für denselben Tag gespeichert, wenn beide ankommen, dann gibt es für diesen Tag genau einen Eintrag mit dem zuletzt gespeicherten Wert — nie zwei.
- [ ] **EC-2** — Angenommen die Person tippt „Speichern“, „Löschen“ oder „Alle Einträge löschen“ mehrfach schnell hintereinander, wenn die Eingaben ankommen, dann entsteht genau ein Eintrag bzw. genau eine Änderung oder Löschung.
- [ ] **EC-3** — Angenommen ein Eintrag wurde auf einem anderen Gerät gelöscht, wenn die Person ihn danach ändern will, dann sieht sie „Diesen Eintrag gibt es nicht mehr.“ und der Verlauf wird aktualisiert.
- [ ] **EC-4** — Angenommen Speichern oder Löschen schlägt fehl (z. B. keine Verbindung), wenn die Person es versucht, dann sieht sie „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“ und ihre Eingaben bleiben erhalten.
- [ ] **EC-5** — Angenommen „heute“ wird bestimmt, wenn das Datum vorausgefüllt oder auf „nicht in der Zukunft“ geprüft wird, dann gilt der Kalendertag in der Zeitzone des Geräts (wie im Wochenblick, PROJ-8).
- [ ] **EC-6** — Angenommen das Laden der Einträge schlägt fehl, wenn der Bereich angezeigt werden soll, dann sieht die Person den Fehlerzustand des App-Rahmens mit „Erneut versuchen“, nicht einen leeren Verlauf.
- [ ] **EC-7** — Angenommen der Bereich wird auf einem Smartphone (375 px Breite) angezeigt, wenn die untere Navigation sechs Bereiche zeigt und die Liste viele Einträge hat, dann bleiben alle Navigationspunkte mit Symbol und Beschriftung lesbar, alle Bedienelemente mindestens 48 px hoch und es gibt kein seitliches Scrollen.

## Übergreifende Anforderungen

- Texte sind kurz, in du-Form und neutral; keine Bewertung von Gewicht, Veränderung oder Häufigkeit des Eintragens.
- Alle Bedienelemente sind per Tastatur erreichbar; Fehlermeldungen sind dem jeweiligen Feld zugeordnet; die Kurve ist für Screenreader durch die Liste ersetzbar.
- Der Bereich speichert nur Datum und Gewicht je Eintrag sowie die Einstellung zum Ausblenden; keine Körpergröße, kein Geschlecht, keine Notizen.

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-11` — Körpergewicht ist eine Körper- und möglicherweise Gesundheitsangabe (strenge Datenschutzhaltung laut PRD): Rechtsgrundlage, gegebenenfalls ausdrückliche Einwilligung vor dem ersten Eintrag, Aufbewahrung (bisher bis zur Löschung durch die Person oder Kontolöschung). Im lokalen Prototyp nur mit Testdaten.
- [ ] Bei der Produktvalidierung prüfen, ob ein sichtbarer Bereich „Gewicht“ für Teile der Zielgruppe belastend ist und ob er zunächst ausgeblendet sein sollte (derzeit: sichtbar, im Profil ausblendbar).
- [ ] Fachliche Prüfung vor Veröffentlichung, ob die Grenzen 30,0 bis 300,0 kg passen.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Nur für die Altersgruppe „ab 16“; 12–15 sehen nichts davon | Körperdaten Minderjähriger und erhöhtes Risiko für gestörtes Essverhalten in der Zielgruppe; vorsichtigster Weg. | 2026-11-25 |
| Nur eigene Einträge als Liste und Kurve; kein Ziel, kein BMI, keine Bewertung, keine Erinnerungen | PRD: ruhige Oberfläche ohne Druck; Bewertungen sind auch bei Mahlzeiten bewusst ausgelassen. | 2026-11-25 |
| Eigener Hauptbereich „Gewicht“ zwischen Wochenblick und Profil | Wunsch aus dem Interview: leicht erreichbar statt im Profil versteckt. | 2026-11-25 |
| Adresse für Unbefugte und bei ausgeblendetem Bereich zeigt „Nicht gefunden“ ohne Altershinweis | Kein Hinweis auf ein Feature, das die Person nicht nutzen soll oder will. | 2026-11-25 |
| Gewicht 30,0–300,0 kg, höchstens eine Nachkommastelle; Datum ab heute rückwärts | Fängt Tippfehler ab, ohne realistische Werte auszuschließen. | 2026-11-25 |
| Ein Eintrag pro Tag; ein zweiter ersetzt ihn nach Rückfrage | Einfache, eindeutige Kurve; keine Uhrzeiten nötig. | 2026-11-25 |
| Zeiträume 1 Monat / 3 Monate (Standard) / 1 Jahr; Kurve ab zwei Einträgen | Kurz genug für den Überblick, ohne Analyse-Werkzeug zu werden. | 2026-11-25 |
| Bereich standardmäßig sichtbar, im Profil ausblendbar; Einträge bleiben erhalten | Selbstbestimmung für Personen, die Zahlen zum Körper belasten. | 2026-11-25 |
| Einstellung zum Ausblenden gilt für das Konto, auf allen Geräten | Wer den Bereich ausblendet, soll ihm auch auf einem anderen Gerät nicht begegnen. | 2026-11-25 |
| „Alle Einträge löschen“ mit Bestätigung, zusätzlich zum Einzellöschen | Volle Kontrolle über die eigenen Körperdaten, ohne das Konto zu löschen. | 2026-11-25 |
