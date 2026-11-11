# PROJ-3: Kurzprofil & Einstieg

## Abhängigkeiten

- Benötigt: PROJ-1 (Konto & Anmeldung) — Konto, Kurzprofil mit Altersgruppe, Sitzung, Datenexport und Kontolöschung.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — geschützter Rahmen, Profilbereich, gemeinsame Bausteine.
- Wird genutzt von: PROJ-4 (Kurze Workouts) und PROJ-6 (Tagesentscheidung) für Ziel, Erfahrung, Orte und Ausstattung; PROJ-5 (Einfache Mahlzeiten) für die Essensweise.

## User Stories

- Als neu registrierte Person möchte ich in wenigen Klicks angeben, was ich erreichen will und wo ich mich bewegen kann, damit PULSE mir von Anfang an passende Vorschläge macht.
- Als Person, die bei vielen Fragen schnell abbricht, möchte ich immer nur eine Frage mit wenigen festen Antworten sehen und wissen, wie viele noch kommen, damit ich den Einstieg zu Ende bringe.
- Als Person, die oft unterbrochen wird, möchte ich nach einer Unterbrechung dort weitermachen, wo ich aufgehört habe, statt von vorn zu beginnen.
- Als Person, deren Situation sich ändert (Umzug, neue Hanteln, anderes Ziel), möchte ich meine Angaben im Profil jederzeit ändern können.
- Als Person ab 12 Jahren möchte ich keine Fragen zu Körper, Gewicht oder Gesundheit beantworten müssen, damit ich PULSE ohne Druck nutzen kann.

## Nicht enthalten

- Körperdaten (Größe, Gewicht, Geschlecht), Zielgewicht oder Zieldatum, Vorname — kein Teil von PULSE in der ersten Version (PRD-Nichtziel). Gewichtsverlauf bleibt PROJ-11.
- Gesundheitsangaben: Allergien, Unverträglichkeiten, Verletzungen, Diagnosen. Tagesbezogene Einschränkungen fragt der Check-in in PROJ-6 ab.
- Zeit, Energie und Ort des jeweiligen Tages — gehören zum Tages-Check-in (PROJ-6).
- Wochenrhythmus, Trainingstage oder Trainingsdauer als Vorgabe — kein fester Plan, keine Nachholpflicht (PRD).
- Freitextfelder jeder Art.
- Die Vorschläge selbst: Workouts (PROJ-4), Mahlzeiten (PROJ-5), Tagesentscheidung (PROJ-6).

## Acceptance Criteria

### Einstieg

- [ ] **AC-1** — Angenommen eine angemeldete Person hat ihre Angaben noch nicht vollständig gemacht, wenn sie „Heute“, „Bewegung“, „Essen“ oder „Wochenblick“ öffnet, dann wird sie zum Einstieg geführt; nach dem Abschluss landet sie in „Heute“.
- [ ] **AC-2** — Angenommen eine Person ist im Einstieg, wenn eine Frage angezeigt wird, dann steht nur diese eine Frage mit festen Antwortmöglichkeiten auf dem Bildschirm, zusammen mit dem Fortschritt „Frage X von Y“, und sie kann zur vorherigen Frage zurückgehen, ohne dass Antworten verloren gehen.
- [ ] **AC-3** — Angenommen die Frage nach dem Ziel wird angezeigt, wenn die Person antwortet, dann wählt sie genau eines von: „Mich mehr bewegen“, „Fitter und ausdauernder werden“, „Kräftiger werden“, „Besser essen“, „Mich insgesamt wohler fühlen“.
- [ ] **AC-4** — Angenommen die Frage nach der Erfahrung wird angezeigt, wenn die Person antwortet, dann wählt sie genau eines von: „Ich fange gerade an“, „Ich bewege mich ab und zu“, „Ich trainiere regelmäßig“.
- [ ] **AC-5** — Angenommen die Frage nach den Orten wird angezeigt, wenn die Person antwortet, dann wählt sie mindestens einen von: „Zuhause“, „Draußen“, „Fitnessstudio“.
- [ ] **AC-6** — Angenommen die Person hat „Zuhause“ als Ort gewählt, wenn die Frage nach der Ausstattung zuhause angezeigt wird, dann wählt sie mindestens eines von: „Matte“, „Kurzhanteln“, „Widerstandsband“, „Klimmzugstange“, „Kettlebell“ — oder „Nichts davon“, das jede andere Auswahl ausschließt. Ohne „Zuhause“ wird diese Frage nicht gestellt, und der Fortschritt zählt eine Frage weniger.
- [ ] **AC-7** — Angenommen die Frage nach der Essensweise wird angezeigt, wenn die Person antwortet, dann wählt sie genau eines von: „Ich esse alles“, „Vegetarisch“, „Vegan“.
- [ ] **AC-8** — Angenommen eine Frage ist noch nicht beantwortet, wenn die Person auf „Weiter“ geht, dann bleibt sie bei dieser Frage und sieht direkt dort einen verständlichen Hinweis, was noch fehlt.
- [ ] **AC-9** — Angenommen die Person beantwortet die letzte Frage, wenn sie den Einstieg abschließt, dann sind alle Angaben gespeichert, sie sieht eine kurze Bestätigung und landet in „Heute“; der Einstieg erscheint danach nicht wieder.
- [ ] **AC-10** — Angenommen eine Person ist im Einstieg, wenn er angezeigt wird, dann gibt es keine App-Navigation, aber einen Weg zum Abmelden; das Profil mit Datenexport und Kontolöschung bleibt direkt erreichbar.
- [ ] **AC-11** — Angenommen der Einstieg wird angezeigt, wenn eine Person ihn vollständig durchläuft, dann besteht er aus höchstens fünf Fragen ohne Texteingabe, und jede lässt sich mit Auswahlen auf einem einzigen Bildschirm beantworten.

### Angaben im Profil

- [ ] **AC-12** — Angenommen eine Person hat den Einstieg abgeschlossen, wenn sie das Profil öffnet, dann sieht sie im Abschnitt „Meine Angaben“ Ziel, Erfahrung, Orte, Ausstattung zuhause (falls „Zuhause“ gewählt) und Essensweise.
- [ ] **AC-13** — Angenommen eine Person ändert im Profil eine oder mehrere Angaben, wenn sie speichert, dann gelten die neuen Angaben sofort, sie sieht eine Bestätigung neben dem Abschnitt, und dieselben Regeln wie im Einstieg gelten (AC-3 bis AC-7).
- [ ] **AC-14** — Angenommen eine Person wählt im Profil „Zuhause“ ab, wenn sie speichert, dann wird die Ausstattung zuhause entfernt; wählt sie „Zuhause“ wieder, muss sie die Ausstattung erneut angeben, bevor sie speichern kann.

### Daten und Zugriff

- [ ] **AC-15** — Angenommen eine Person hat Angaben gemacht, wenn sie „Meine Daten herunterladen“ auslöst (PROJ-1), dann enthält der Export alle ihre Angaben aus Einstieg und Profil; löscht sie ihr Konto, werden die Angaben mit gelöscht.
- [ ] **AC-16** — Angenommen zwei Konten haben Angaben gemacht, wenn eines die Angaben des anderen über die Oberfläche oder eine direkte Datenanfrage lesen oder ändern will, dann wird der Zugriff verweigert.
- [ ] **AC-17** — Angenommen das Speichern einer Antwort oder einer Änderung schlägt fehl, wenn die Person speichert, dann sieht sie eine verständliche Meldung mit „Erneut versuchen“, und ihre Auswahl bleibt auf dem Bildschirm erhalten.

## Edge Cases

- [ ] **EC-1** — Angenommen eine Person bricht den Einstieg nach einigen Fragen ab (Tab geschlossen, Verbindung weg, anderes Gerät), wenn sie PULSE wieder öffnet, dann geht der Einstieg bei der ersten unbeantworteten Frage weiter, und die bisherigen Antworten sind erhalten.
- [ ] **EC-2** — Angenommen eine Person ändert ihre Angaben gleichzeitig auf zwei Geräten, wenn beide speichern, dann gilt die zuletzt gespeicherte Fassung vollständig; es entsteht keine Mischung aus beiden.
- [ ] **EC-3** — Angenommen eine Person tippt beim Abschließen mehrfach schnell hintereinander, wenn die Anfragen ankommen, dann werden die Angaben einmal gespeichert und sie landet einmal in „Heute“.
- [ ] **EC-4** — Angenommen eine Person hat den Einstieg abgeschlossen, wenn sie die Adresse des Einstiegs direkt aufruft, dann wird sie zu „Heute“ geführt; Änderungen erfolgen nur im Profil.
- [ ] **EC-5** — Angenommen eine Anfrage enthält einen nicht vorgesehenen Wert (z. B. ein unbekanntes Ziel, „Nichts davon“ zusammen mit Kurzhanteln oder Ausstattung ohne „Zuhause“), wenn sie verarbeitet wird, dann wird sie abgelehnt und nichts gespeichert.
- [ ] **EC-6** — Angenommen ein Konto existiert schon aus der Zeit vor PROJ-3 und hat keine Angaben, wenn sich die Person anmeldet, dann durchläuft sie den Einstieg wie ein neues Konto.

## Übergreifende Anforderungen

- Fragen und Antworten sind kurz, deutsch und für Menschen ab 12 Jahren verständlich; keine Wertung („richtig“, „besser“) in den Antworten.
- Jede Antwortmöglichkeit ist eine ausreichend große, per Tastatur bedienbare Auswahl (Rahmen und Bedienregeln aus PROJ-2).
- Der Einstieg kommt ohne Animationen aus, die über eine kurze Rückmeldung hinausgehen.

## Offene Fragen

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-3` prüft Ziel, Erfahrung und Essensweise von 12- bis 15-Jährigen (Zweckbindung, Aufbewahrung) und ob die Essensweise besondere Sorgfalt braucht.
- [ ] Die genaue Formulierung der Fragen und Antworten wird bei der Produktvalidierung mit Menschen mit ADHS und Autismus geprüft und kann sich danach ändern.
- [ ] Ob die Ausstattungsliste ausreicht, klären die Sport-Fachleute bei der Prüfung der Workouts (PROJ-4).

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Einstieg fragt nur Ziel, Erfahrung, Orte, Ausstattung zuhause und Essensweise | Das reicht für passende Vorschläge in PROJ-4 bis PROJ-6; jede weitere Frage senkt die Chance, dass der Einstieg zu Ende gebracht wird. | 2026-11-11 |
| Keine Körperdaten, kein Gewicht, keine Gesundheitsangaben, keine Freitexte | PRD-Nichtziele; schützt Minderjährige und vermeidet besonders schutzbedürftige Daten. | 2026-11-11 |
| Fünf Ziele ohne Gewichtsbezug, genau eines wählbar | Ein Hauptziel ist eine leichtere Entscheidung und gibt PROJ-6 eine klare Richtung; Gewichtsziele widersprechen dem PRD. | 2026-11-11 |
| Essensweise nur „alles / vegetarisch / vegan“, keine Allergien | Reicht für passende Mahlzeitenideen; Allergien und Unverträglichkeiten wären Gesundheitsdaten. | 2026-11-11 |
| Einstieg ist Pflicht vor „Heute“, alle Fragen müssen beantwortet sein, jede hat eine einfache Antwort | Vorschläge passen dann von Anfang an; leichte Antworten („Ich fange gerade an“, „Ich esse alles“, „Nichts davon“) halten die Hürde niedrig. | 2026-11-11 |
| Eine Frage pro Bildschirm mit Fortschrittsanzeige und Zurück | Weniger auf einmal zu entscheiden; man sieht, wie viel noch kommt. | 2026-11-11 |
| Antworten werden pro Frage gespeichert; nach Unterbrechung weiter bei der ersten offenen Frage | Unterbrechungen sind bei der Zielgruppe häufig; von vorn beginnen führt zum Abbruch. | 2026-11-11 |
| Ausstattungsfrage nur bei „Zuhause“; Abwahl von „Zuhause“ entfernt die Ausstattung | Draußen und im Studio ist die Ausstattung keine sinnvolle Frage; veraltete Angaben würden Vorschläge verfälschen. | 2026-11-11 |
| Während des Einstiegs bleiben Abmelden, Datenexport und Kontolöschung erreichbar | Kontorechte dürfen nicht von einem Pflichtschritt abhängen. | 2026-11-11 |
| Bei gleichzeitigen Änderungen gilt die zuletzt gespeicherte Fassung | Einfach nachvollziehbar; Angaben ändern sich selten. | 2026-11-11 |
