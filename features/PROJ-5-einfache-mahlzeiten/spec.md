# PROJ-5: Einfache Mahlzeiten

## Abhängigkeiten

- Benötigt: PROJ-2 (App-Rahmen & Navigation) — Bereich „Essen“, gemeinsame Bausteine.
- Benötigt: PROJ-3 (Kurzprofil & Einstieg) — die Essensweise bestimmt, welche Mahlzeiten passen; der Bereich ist erst mit vollständigen Angaben erreichbar.
- Wird genutzt von: PROJ-6 (Tagesentscheidung) — wählt aus diesem Angebot eine Mahlzeit als Vorschlag.
- Erweitert durch: PROJ-12 (Nährwertübersicht) — ungefähre Nährwerte pro Portion, zugeklappt im Detail.

## User Stories

- Als Person, die hungrig ist und gerade keine Kraft zum Planen hat, möchte ich sofort sehen, welche einfachen Mahlzeiten zu meiner Essensweise passen, damit ich nicht erst suchen und abwägen muss.
- Als Person mit wenig Zeit oder Energie möchte ich nach Aufwand filtern — ganz ohne Kochen, schnell gekocht oder etwas mehr Zeit —, damit ich nur sehe, was ich gerade schaffe.
- Als Person, die sich beim Kochen leicht verzettelt, möchte ich wenige Zutaten und wenige kurze Schritte sehen, damit ich nicht den Faden verliere.
- Als Person an einem schwierigen Tag möchte ich einen Hinweis sehen, wie es noch einfacher geht, damit ich trotzdem etwas esse statt aufzugeben.
- Als Person mit einer Allergie möchte ich sehen, welche Hauptallergene eine Mahlzeit enthält, ohne meine Allergie angeben zu müssen.

## Nicht enthalten

- Speichern, ob eine Mahlzeit gegessen oder zubereitet wurde, Verlauf und Wochenansicht — gehören zu PROJ-6, PROJ-7 und PROJ-8.
- Die Auswahl einer einzelnen Mahlzeit für heute anhand von Zeit und Energie — gehört zu PROJ-6.
- Geführte Zubereitung Schritt für Schritt, Timer.
- Bewertungen wie „gesund“ / „ungesund“. Ungefähre Nährwerte pro Portion zeigt PROJ-12 — nur zugeklappt im Detail; in der Übersicht und in Vorschlägen stehen keine.
- „Alle Mahlzeiten anzeigen“ für Mahlzeiten, die nicht zur Essensweise passen.
- Kategorien nach Tageszeit (Frühstück, Mittag, Abend, Snack).
- Filter nach Küchenausstattung (Herd, Mikrowelle) oder nach Allergenen; Allergien oder Unverträglichkeiten im Profil.
- Tauschtipps je Zutat, eigene Mahlzeiten, Favoriten, Portionsrechner, Einkaufslisten.
- Bilder, Videos oder Ton.
- Eine Redaktionsoberfläche zum Pflegen der Inhalte; Inhalte werden im Prototyp vom Team bereitgestellt.

## Acceptance Criteria

### Übersicht

- [ ] **AC-1** — Angenommen eine Person mit vollständigen Angaben öffnet „Essen“, wenn die Übersicht angezeigt wird, dann sieht sie die zu ihrer Essensweise passenden Mahlzeiten, jeweils mit Titel, Aufwandsstufe, Zubereitungszeit in Minuten und Essensweise der Mahlzeit („vegan“, „vegetarisch“ oder „mit Fleisch oder Fisch“).
- [ ] **AC-2** — Angenommen eine Mahlzeit wird für eine Person geprüft, wenn entschieden wird, ob sie passt, dann passt sie genau dann, wenn ihre Essensweise zur Essensweise der Person passt: „Ich esse alles“ → alle Mahlzeiten; „Vegetarisch“ → vegetarische und vegane; „Vegan“ → nur vegane.
- [ ] **AC-3** — Angenommen jede Mahlzeit gehört zu genau einer Aufwandsstufe — „Ohne Kochen“ (nur zusammenstellen, weder Herd noch Mikrowelle, höchstens 10 Minuten), „Schnell gekocht“ (warm, höchstens 10 Minuten) oder „Bis 20 Min“ (warm, 11 bis 20 Minuten) —, wenn die Person nach Aufwand filtert („Alle“, „Ohne Kochen“, „Schnell gekocht“, „Bis 20 Min“), dann zeigt die Liste sofort nur Mahlzeiten dieser Stufe.
- [ ] **AC-4** — Angenommen für den gewählten Filter passt keine Mahlzeit, wenn die Übersicht angezeigt wird, dann sieht sie einen ruhigen Hinweis und eine Möglichkeit, alle Aufwandsstufen anzuzeigen; passt für ihre Essensweise überhaupt keine Mahlzeit, sieht sie einen ruhigen Hinweis mit einem Weg zu „Heute“ — keine leere Seite.

### Detail

- [ ] **AC-5** — Angenommen die Person öffnet eine Mahlzeit, wenn die Detailansicht angezeigt wird, dann sieht sie Titel, Aufwandsstufe, Zubereitungszeit, Essensweise der Mahlzeit, die Zutaten mit Mengen für eine Person und die Zubereitungsschritte in einfachen Sätzen.
- [ ] **AC-6** — Angenommen die Detailansicht wird angezeigt, wenn die Person sie liest, dann sieht sie einen Hinweis „Noch einfacher: …“ mit einem kurzen Satz, wie die Mahlzeit an einem Tag ohne Kraft noch weniger Aufwand macht.
- [ ] **AC-7** — Angenommen die Detailansicht wird angezeigt, wenn die Mahlzeit Hauptallergene enthält, dann steht dort „Enthält: …“ mit den betroffenen Allergenen aus den 14 EU-Hauptallergenen (z. B. „Gluten, Milch, Schalenfrüchte“), dazu immer der Satz „Bei Allergien prüfe bitte auch die Angaben auf der Verpackung deiner Zutaten.“

### Inhalte

- [ ] **AC-8** — Angenommen eine Mahlzeit ist noch nicht als fachlich geprüft markiert, wenn sie in der Übersicht oder im Detail erscheint, dann trägt sie sichtbar den Hinweis „Beispielinhalt – noch nicht fachlich geprüft“.
- [ ] **AC-9** — Angenommen das Angebot wird im Prototyp bereitgestellt, wenn es vollständig betrachtet wird, dann gibt es mindestens 15 Mahlzeiten, darunter in jeder Aufwandsstufe mindestens eine vegane, insgesamt mindestens drei vegetarische (nicht vegane) und mindestens drei mit Fleisch oder Fisch; jede Mahlzeit hat höchstens 6 Zutaten aus dem normalen Supermarkt, höchstens 5 Schritte, einen „Noch einfacher“-Hinweis und Allergenangaben.
- [ ] **AC-10** — Angenommen eine angemeldete Person sendet eine direkte Anfrage, die Mahlzeiten anlegen, ändern oder löschen will, wenn sie verarbeitet wird, dann wird sie abgelehnt; Inhalte sind für alle Nutzenden nur lesbar.

## Edge Cases

- [ ] **EC-1** — Angenommen eine Person ändert im Profil ihre Essensweise, wenn sie danach „Essen“ öffnet, dann entspricht die Liste der passenden Mahlzeiten der neuen Essensweise.
- [ ] **EC-2** — Angenommen eine Person ruft die Adresse einer Mahlzeit auf, die es nicht gibt oder die nicht mehr angeboten wird, wenn die Seite angezeigt wird, dann sieht sie „Diese Mahlzeit gibt es nicht (mehr)“ mit einem Weg zurück zu „Essen“.
- [ ] **EC-3** — Angenommen eine Person ruft direkt die Adresse einer Mahlzeit auf, die nicht zu ihrer Essensweise passt (z. B. über einen geteilten Link), wenn die Detailansicht angezeigt wird, dann sieht sie die Mahlzeit vollständig mit dem kurzen Hinweis „Passt nicht zu deiner Essensweise“.
- [ ] **EC-4** — Angenommen eine Mahlzeit enthält keines der 14 Hauptallergene, wenn die Detailansicht angezeigt wird, dann steht dort „Enthält keines der 14 Hauptallergene.“ und der Satz zur Verpackung — die Angabe fehlt nie stillschweigend.

## Übergreifende Anforderungen

- Texte sind kurz, in einfachen Sätzen, du-Form, ohne Fachsprache; jeder Schritt höchstens zwei Sätze.
- Keine Kalorien oder anderen Nährwerte in der Übersicht; im Detail nur zugeklappt und ohne Bewertung (PROJ-12). Keine Bewertung von Lebensmitteln oder Essverhalten, keine Rangfolgen, keine Streaks.
- Bedienelemente sind per Tastatur erreichbar und mindestens 48 px hoch (PROJ-2); die Essensweise und die Aufwandsstufe stehen als Text da, nicht nur als Farbe oder Symbol.

## Offene Fragen

- [ ] Vor dem ersten Deploy: Ernährungsfachleute prüfen alle Mahlzeiten einschließlich „Noch einfacher“-Hinweisen und Allergenangaben; ungeprüfte Inhalte dürfen öffentlich nicht angezeigt werden.
- [ ] Vor dem ersten Deploy: Rechtlich klären, ob und wie die Allergenangaben in einer App Haftungs- oder Kennzeichnungspflichten auslösen und ob der Verpackungshinweis ausreicht (`/dsgvo` bzw. Rechtsberatung).
- [ ] Vor dem ersten Deploy: Fachlich klären, ob Mahlzeiten für 12- bis 15-Jährige Hinweise zu Herd, Messer oder heißen Flüssigkeiten brauchen.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| PROJ-5 umfasst Übersicht und Detail, keine geführte Zubereitung | Klein und ruhig; eine Mahlzeit mit höchstens 5 Schritten lässt sich ohne Führung umsetzen; PROJ-6 kann das Angebot direkt nutzen. | 2026-11-13 |
| Passend nur nach Essensweise, Filter nur nach Aufwand | Nachvollziehbare Regel (PRD); keine Kategorien nach Tageszeit, weil feste Mahlzeitenzeiten an unruhigen Tagen und bei Schichtarbeit nicht passen. | 2026-11-13 |
| Kein „Alle Mahlzeiten anzeigen“ | Die Essensweise ist eine feste Grenze, anders als der Ort beim Training; wer anders essen will, ändert die Essensweise im Profil. | 2026-11-13 |
| Drei feste Aufwandsstufen „Ohne Kochen“, „Schnell gekocht“, „Bis 20 Min“ | Eine Entscheidung statt zwei (Zeit und Kochen); „Ohne Kochen“ ist die wichtigste Rettung an Tagen ohne Kraft. | 2026-11-13 |
| „Noch einfacher“-Hinweis je Mahlzeit statt Tauschtipps je Zutat | Hilft an energiearmen Tagen wie „Leichter“ bei Bewegung, ohne zusätzlichen Pflege- und Prüfaufwand für viele Alternativen. | 2026-11-13 |
| Keine Nährwerte, Mengen für eine Person | Nichtziel im PRD; Zahlen und Bewertungen erzeugen Druck; Nährwerte folgen gegebenenfalls in PROJ-12. | 2026-11-13 |
| Nährwerte jetzt durch PROJ-12: ungefähr, pro Portion, nur zugeklappt im Detail, ohne Bewertung; Übersicht weiter ohne Zahlen (Wortlaut angeglichen) | PROJ-12 hat die zurückgestellten Nährwerte so umgesetzt, dass niemand ihnen ungewollt begegnet; die Regel „keine Bewertung“ bleibt. | 2026-11-27 |
| Mindestens 15 Beispielmahlzeiten, höchstens 6 Zutaten und 5 Schritte | Auch eine vegane Person findet in jeder Stufe etwas; enge Grenzen halten den Entscheidungs- und Einkaufsaufwand klein. | 2026-11-13 |
| Allergene als Hinweis im Detail, ohne Filter und ohne Profilangabe | Personen mit Allergien können selbst entscheiden; es werden keine Gesundheitsdaten erhoben (PROJ-3). | 2026-11-13 |
| Nicht passende Mahlzeit per direkter Adresse wird angezeigt, mit Hinweis | Kein Fehler bei geteilten Links; der Hinweis verhindert ein Missverständnis. | 2026-11-13 |
