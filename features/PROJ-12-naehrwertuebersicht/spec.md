# PROJ-12: Nährwertübersicht

> Jede Mahlzeit aus dem Angebot (PROJ-5) kann ihre ungefähren Nährwerte pro Portion zeigen — zurückhaltend, zugeklappt im Detail, ohne Bewertung und ohne persönliche Ziele.

## Abhängigkeiten

- Benötigt: PROJ-5 (Einfache Mahlzeiten) — die Mahlzeiten, ihre Detailansicht und ihr Prüfstatus. **Änderung an PROJ-5:** Eine Mahlzeit kann Nährwerte tragen; das Detail zeigt sie in einem zugeklappten Abschnitt. PROJ-5 hatte Nährwerte bisher ausdrücklich ausgeschlossen und auf PROJ-12 verwiesen.
- Benötigt: PROJ-2 (App-Rahmen & Navigation) — liegt im Bereich „Essen“; keine neue Navigation.

## User Stories

- Als Person, die wissen möchte, wie sättigend oder eiweißreich eine Mahlzeit ungefähr ist, möchte ich ihre Nährwerte pro Portion nachsehen können.
- Als Person, die Zahlen zum Essen unter Druck setzen, möchte ich diese Werte nicht sehen müssen, wenn ich sie nicht aufrufe.
- Als Person, die eine Mahlzeit auswählt, möchte ich verstehen, dass die Werte ungefähr sind und von den genauen Zutaten abhängen.
- Als Person möchte ich keine Bewertung meines Essens durch Farben, Prozentangaben oder Wörter wie „viel“ oder „wenig“.

## Nicht enthalten

- Persönlicher Tagesbedarf oder Nährwertziele aus Gewicht, Größe, Alter oder Geschlecht; das „Nährwertziel“ im Datenmodell bleibt eine spätere Ergänzung.
- Tagessummen, Protokoll gegessener Mahlzeiten, Kalorien- oder Makrotracking (PRD-Nichtziel).
- Nährwerte in der Mahlzeitenliste, auf „Heute“, in Tagesvorschlägen (PROJ-6), im Abschlussfeedback (PROJ-7) oder im Wochenblick (PROJ-8).
- Prozent vom Tagesbedarf, Ampelfarben, Labels wie „gesund“, „leicht“, „proteinreich“, Ranglisten.
- Weitere Werte wie Zucker, gesättigte Fettsäuren, Ballaststoffe, Salz, Vitamine; Kilojoule.
- Filtern oder Sortieren nach Nährwerten; Vorschläge nach Nährwerten.
- Anpassen der Portion oder Umrechnen auf andere Mengen.
- Ein eigener Prüfstatus nur für die Nährwerte; ein Hinweis „Nährwerte fehlen noch“.
- Eine Einstellung zum Ein- oder Ausblenden der Nährwerte.

## Acceptance Criteria

### Anzeige im Detail

- [ ] **AC-1** — Angenommen eine Mahlzeit hat Nährwerte, wenn ihre Detailansicht (PROJ-5) angezeigt wird, dann gibt es unter Zutaten, Schritten und Hinweisen einen zugeklappten Abschnitt „Nährwerte pro Portion“; die Zahlen sind erst nach dem Aufklappen sichtbar.
- [ ] **AC-2** — Angenommen der Abschnitt wird aufgeklappt, wenn er angezeigt wird, dann stehen dort genau vier Werte pro Portion, jeweils als ganze Zahl: „Energie: <x> kcal“, „Eiweiß: <x> g“, „Kohlenhydrate: <x> g“, „Fett: <x> g“, dazu der Hinweis „Ungefähre Werte – sie hängen von den genauen Zutaten ab.“
- [ ] **AC-3** — Angenommen die Nährwerte werden angezeigt, wenn die Person sie liest, dann gibt es keine Prozentangaben vom Tagesbedarf, keine wertenden Farben und keine Einordnung wie „viel“, „wenig“, „gesund“ oder „leicht“.
- [ ] **AC-4** — Angenommen der Abschnitt ist zugeklappt oder aufgeklappt, wenn die Person ihn per Tastatur oder Screenreader bedient, dann lässt er sich mit Enter oder Leertaste öffnen und schließen, sein Zustand (auf/zu) wird angesagt, und der Auslöser ist mindestens 48 px hoch.
- [ ] **AC-5** — Angenommen die Person öffnet eine andere Mahlzeit oder lädt die Seite neu, wenn das Detail angezeigt wird, dann ist der Abschnitt wieder zugeklappt.

### Ohne Werte und an anderen Stellen

- [ ] **AC-6** — Angenommen eine Mahlzeit hat keine Nährwerte, wenn ihre Detailansicht angezeigt wird, dann gibt es keinen Abschnitt „Nährwerte pro Portion“ und keinen Hinweis darauf, dass Werte fehlen.
- [ ] **AC-7** — Angenommen die Mahlzeitenliste (PROJ-5), „Heute“ mit Tagesvorschlägen (PROJ-6), das Abschlussfeedback (PROJ-7) oder der Wochenblick (PROJ-8) wird angezeigt, wenn eine Mahlzeit dort erscheint, dann stehen dort keine Nährwerte.

### Inhalt und Prüfung

- [ ] **AC-8** — Angenommen eine Mahlzeit hat Nährwerte, wenn sie gespeichert ist, dann hat sie alle vier Werte (Energie, Eiweiß, Kohlenhydrate, Fett) — nie nur einige —, jeweils als ganze Zahl ab 0 (Energie höchstens 2000 kcal, jeder Grammwert höchstens 200 g).
- [ ] **AC-9** — Angenommen eine Mahlzeit ist noch nicht als fachlich geprüft markiert (PROJ-5 AC-8), wenn ihre Nährwerte angezeigt werden, dann gilt die Markierung „Beispielinhalt“ der Mahlzeit auch für die Werte; die Nährwerte erhalten keinen eigenen Hinweis.
- [ ] **AC-10** — Angenommen das Angebot wird im Prototyp bereitgestellt, wenn es vollständig betrachtet wird, dann haben alle angebotenen Beispiel-Mahlzeiten Beispiel-Nährwerte.
- [ ] **AC-11** — Angenommen eine angemeldete Person sendet eine direkte Anfrage, die Nährwerte einer Mahlzeit anlegen, ändern oder löschen will, wenn sie verarbeitet wird, dann wird sie abgelehnt; Nährwerte sind wie alle Mahlzeiteninhalte nur lesbar (wie PROJ-5 AC-10).

## Edge Cases

- [ ] **EC-1** — Angenommen ein Wert ist 0 (z. B. „Fett: 0 g“), wenn der Abschnitt angezeigt wird, dann steht dort „0 g“, nicht ein leeres Feld oder „–“.
- [ ] **EC-2** — Angenommen eine Mahlzeit wurde aus dem Angebot genommen, wenn ihre Adresse aufgerufen wird, dann erscheint wie bisher „Nicht gefunden“ (PROJ-5) — auch ihre Nährwerte sind nicht abrufbar.
- [ ] **EC-3** — Angenommen das Laden einer Mahlzeit schlägt fehl, wenn das Detail angezeigt werden soll, dann sieht die Person wie bisher den Fehlerzustand des App-Rahmens — nicht ein Detail ohne Nährwerte, das wie „keine Werte“ aussieht.
- [ ] **EC-4** — Angenommen das Detail wird auf einem Smartphone (375 px Breite) angezeigt, wenn der Abschnitt aufgeklappt ist, dann bleiben alle vier Werte und der Hinweis lesbar, ohne seitliches Scrollen.
- [ ] **EC-5** — Angenommen die Person hat „Bewegung reduzieren“ eingeschaltet oder ihr Gerät meldet es (PROJ-2), wenn sie den Abschnitt öffnet oder schließt, dann geschieht das ohne Animation.

## Übergreifende Anforderungen

- Texte sind kurz, in du-Form und neutral; dieselben Begriffe in allen Mahlzeiten.
- Die Nährwerte sind gemeinsam bereitgestellter Inhalt; das Feature speichert nichts über die Person.

## Offene Fragen

- [ ] Vor einer Veröffentlichung: Ernährungsfachleute prüfen die Nährwerte zusammen mit den Mahlzeiten (PRD); Quelle und Berechnungsweg der Werte festhalten.
- [ ] Bei der Produktvalidierung prüfen, ob schon zugeklappte Zahlen für Teile der Zielgruppe belastend sind.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Nährwerte je Mahlzeit statt persönlichem Tagesbedarf | Keine Körperdaten nötig, nichts über die Person gespeichert, für alle Altersgruppen unbedenklich; passt zum PRD-Nichtziel „kein Kalorientracking“. | 2026-11-27 |
| Nur im Detail, zugeklappt; keine Zahlen in Liste, „Heute“, Vorschlägen | Wer sie sucht, findet sie; wer Zahlen meiden will, begegnet ihnen nicht. Keine Einstellung nötig. | 2026-11-27 |
| Vier Werte (kcal, Eiweiß, Kohlenhydrate, Fett), ganze Zahlen, Hinweis „Ungefähre Werte“ | Genug zur Orientierung, kurz und prüfbar; Genauigkeit wird nicht vorgetäuscht. | 2026-11-27 |
| Keine Prozentangaben, Ampeln oder Einordnungen | PROJ-5: Zahlen und Bewertungen erzeugen Druck; ruhige Oberfläche laut PRD. | 2026-11-27 |
| Ohne Werte kein Abschnitt; nur alle vier oder keiner | Kein „fehlt noch“-Gefühl; keine halben Angaben. | 2026-11-27 |
| Prüfung über den Prüfstatus der Mahlzeit, kein eigener | Werte gehören zum Inhalt der Mahlzeit; ein zweiter Status verdoppelt Pflege und Hinweise. | 2026-11-27 |
| Beispiel-Nährwerte für alle Beispiel-Mahlzeiten im Prototyp | Das Feature lässt sich vollständig ausprobieren; fachliche Prüfung vor Veröffentlichung. | 2026-11-27 |
