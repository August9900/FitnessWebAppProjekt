# PROJ-9: Übungsbibliothek

## Abhängigkeiten

- Benötigt: PROJ-4 (Kurze Workouts) — die Übungen mit Anleitung, leichterer Variante und Ausstattung, die Workouts und ihre Schritte, der Sicherheitshinweis. **Änderung an PROJ-4:** ein Weg „Übungen nachschlagen“ auf der Workout-Liste und verlinkte Übungsnamen im Workout-Detail.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — die Bibliothek liegt im Bereich „Bewegung“; keine neue Navigation.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — Ausstattung zuhause für den Filter „Passt zu meinem Zuhause“; der Bereich ist erst mit vollständigen Angaben erreichbar.

## User Stories

- Als Person, die eine Übung aus einem Workout nicht mehr genau weiß, möchte ich sie nachschlagen können, mit Anleitung und leichterer Variante.
- Als Person ohne Geräte möchte ich mit einem Tipp nur die Übungen sehen, die ich ohne Ausstattung oder mit meiner Ausstattung zuhause machen kann.
- Als Person, der eine Übung gefällt, möchte ich sehen, in welchen Workouts sie vorkommt, und eines davon direkt öffnen.
- Als Person, die gerade ein Workout ansieht, möchte ich auf eine Übung tippen und mehr über sie erfahren.

## Nicht enthalten

- Körperbereich, Muskelgruppe oder Schwierigkeit als Merkmal oder Filter — dafür müssten neue Inhalte erstellt und fachlich geprüft werden.
- Eigener Navigationspunkt „Übungen“.
- Ein Prüfhinweis „Beispielinhalt …“ an Übungen.
- Textsuche, Favoriten, eigene Notizen zu Übungen.
- Eine Übung einzeln „starten“ oder als Aktion beginnen — begonnen wird weiterhin nur über ein Workout (PROJ-6).
- Bilder, Videos oder Animationen zu Übungen.
- Links zur Bibliothek aus der geführten Durchführung (PROJ-4) — dort soll nichts vom Training ablenken.
- Eigene Trainingspläne aus Übungen zusammenstellen — gehört zu PROJ-10.

## Acceptance Criteria

### Erreichbarkeit

- [ ] **AC-1** — Angenommen eine Person mit vollständigen Angaben sieht die Workout-Liste im Bereich „Bewegung“, wenn die Liste angezeigt wird, dann gibt es dort zurückhaltend einen Weg „Übungen nachschlagen“, der zur Übungsbibliothek führt; in der Navigation bleibt „Bewegung“ als aktueller Bereich markiert.
- [ ] **AC-2** — Angenommen die Detailansicht eines Workouts wird angezeigt (PROJ-4), wenn die Person auf den Namen einer Übung tippt, dann öffnet sich das Detail dieser Übung in der Bibliothek; die geführte Durchführung enthält keine solchen Links.

### Liste

- [ ] **AC-3** — Angenommen die Person öffnet die Übungsbibliothek, wenn sie angezeigt wird, dann sieht sie unter der Überschrift „Übungen“ alle Übungen alphabetisch nach Namen, jeweils mit Name und benötigter Ausstattung („Ohne Ausstattung“ bzw. z. B. „Matte, Kurzhanteln“).
- [ ] **AC-4** — Angenommen die Liste wird angezeigt, wenn die Person „Ohne Ausstattung“ wählt, dann sieht sie nur Übungen, die keine Ausstattung brauchen; mit „Alle“ wieder alle.
- [ ] **AC-5** — Angenommen das Profil der Person enthält den Ort „Zuhause“, wenn sie „Passt zu meinem Zuhause“ wählt, dann sieht sie nur Übungen, deren gesamte Ausstattung in ihrer Ausstattung zuhause enthalten ist (Übungen ohne Ausstattung eingeschlossen); ohne den Ort „Zuhause“ im Profil wird dieser Filter nicht angeboten.
- [ ] **AC-6** — Angenommen ein Filter ist gewählt, wenn die Person ein Übungsdetail öffnet und zurückkehrt, dann ist derselbe Filter weiterhin gewählt; die gewählte Filteroption ist nicht nur an der Farbe erkennbar.

### Detail

- [ ] **AC-7** — Angenommen die Person tippt in der Liste auf eine Übung, wenn das Detail angezeigt wird, dann sieht sie Name, Anleitung, die leichtere Variante mit Name und Anleitung, die benötigte Ausstattung und den Sicherheitshinweis „Hör auf deinen Körper. Bei Schmerzen hörst du auf.“ (PROJ-4).
- [ ] **AC-8** — Angenommen das Übungsdetail wird angezeigt, wenn die Übung in angebotenen Workouts vorkommt, dann steht darunter „Kommt vor in“ mit jedem dieser Workouts (Titel und Dauer, in der Reihenfolge des Angebots), jeweils als Link zum Workout-Detail (PROJ-4); kommt sie in keinem angebotenen Workout vor, steht dort „Gerade in keinem Workout.“
- [ ] **AC-9** — Angenommen das Übungsdetail wird angezeigt, wenn die Person „Alle Übungen“ wählt, dann kehrt sie zur Liste zurück (mit dem zuvor gewählten Filter).
- [ ] **AC-10** — Angenommen ein Übungsdetail wird angezeigt, wenn es erscheint, dann gibt es dort keine Möglichkeit, die Übung zu starten oder als Aktion zu beginnen.

## Edge Cases

- [ ] **EC-1** — Angenommen ein Filter ergibt keine Übung, wenn die Liste angezeigt wird, dann sieht die Person „Keine Übung passt zu diesem Filter.“ mit „Alle zeigen“ — keine leere Seite.
- [ ] **EC-2** — Angenommen die Adresse nennt eine unbekannte Übung oder einen unbekannten Filter, wenn sie aufgerufen wird, dann erscheint für die Übung die bekannte Ansicht „Nicht gefunden“ mit Weg zurück zur Bibliothek; ein unbekannter Filter zeigt alle Übungen.
- [ ] **EC-3** — Angenommen ein Workout wurde aus dem Angebot genommen, wenn das Detail einer seiner Übungen angezeigt wird, dann erscheint dieses Workout nicht unter „Kommt vor in“; die Übung selbst bleibt in der Bibliothek.
- [ ] **EC-4** — Angenommen die Person hat ihre Ausstattung zuhause im Profil geändert, wenn sie danach „Passt zu meinem Zuhause“ wählt, dann richtet sich der Filter nach den aktuellen Angaben; wurde „Zuhause“ entfernt, wird der Filter nicht mehr angeboten und die Liste zeigt alle Übungen.
- [ ] **EC-5** — Angenommen das Laden der Übungen schlägt fehl, wenn die Bibliothek angezeigt werden soll, dann sieht die Person den Fehlerzustand des App-Rahmens mit „Erneut versuchen“, nicht eine leere Liste.
- [ ] **EC-6** — Angenommen die Bibliothek wird auf einem Smartphone (375 px Breite) angezeigt, wenn Namen und Ausstattung lang sind, dann bleibt alles lesbar, ohne seitliches Scrollen.

## Übergreifende Anforderungen

- Texte sind kurz, in du-Form; keine Bewertung der Übungen als „leicht“ oder „schwer“.
- Filter und Links sind per Tastatur bedienbar, mindestens 48 px hoch; Listen sind semantisch als Listen erkennbar.
- Die Bibliothek speichert nichts über die Person; der Filter „Passt zu meinem Zuhause“ liest nur die vorhandenen Profilangaben.

## Offene Fragen

- [ ] Vor dem ersten Deploy: Wie wird sichergestellt, dass die in der Bibliothek gezeigten Übungen fachlich geprüft sind (PRD: Prüfung vor öffentlicher Veröffentlichung), obwohl Übungen keinen eigenen Prüfstatus und keinen Hinweis haben?
- [ ] Gehört „Kurze Pause“ als Übung in die Bibliothek, oder soll sie dort fehlen? (Derzeit erscheint sie wie jede andere Übung.)

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Nur vorhandene Merkmale (Anleitung, leichtere Variante, Ausstattung) plus „Kommt vor in“ | Keine neuen Inhalte, die erst erstellt und geprüft werden müssten; „Kommt vor in“ verbindet Nachschlagen und Tun. | 2026-11-24 |
| Filter „Alle“, „Ohne Ausstattung“, „Passt zu meinem Zuhause“ | Ausstattung ist das praktische Hindernis; das Profil kennt die Ausstattung zuhause bereits. | 2026-11-24 |
| Bibliothek im Bereich „Bewegung“, erreichbar über „Übungen nachschlagen“ | Navigation bleibt bei fünf ruhigen Bereichen; keine Änderung am App-Rahmen. | 2026-11-24 |
| Kein Prüfhinweis an Übungen | Wunsch aus dem Interview; Übungen haben keinen eigenen Prüfstatus. Die Prüfung vor Veröffentlichung bleibt offene Frage. | 2026-11-24 |
| Übungsnamen im Workout-Detail verlinken, nicht in der geführten Durchführung | Mehr erfahren beim Ansehen, keine Ablenkung beim Trainieren. | 2026-11-24 |
| Alphabetische Liste, Sicherheitshinweis im Detail | Schnell auffindbar; derselbe Hinweis wie bei Workouts. | 2026-11-24 |
| Keine Möglichkeit, eine Übung einzeln zu starten | Begonnen wird über Workouts und die Tagesentscheidung; der Aktionsverlauf bleibt eindeutig. | 2026-11-24 |
