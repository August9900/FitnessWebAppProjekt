# PROJ-8 — Technisches Design: Wochenblick

> Technische Umsetzung von `spec.md`. Der Wochenblick ist eine reine Leseansicht. Er speichert nichts Eigenes, sondern leitet die Woche bei jedem Öffnen aus dem Aktionsverlauf von PROJ-6 ab, mit dessen Zugriffsregeln. Die Seite wird vollständig auf dem Server erzeugt. Geblättert wird über normale Links, die angezeigte Woche steht in der Adresse. Die Ortszeit kommt aus der Zeitzone des Geräts, die der Browser in einem kleinen technischen Cookie mitteilt. Ohne dieses Cookie gilt deutsche Zeit.

## Komponentenstruktur

```text
Wochenblick  /wochenblick?woche=JJJJ-MM-TT   (Bereich im App-Rahmen, Gate aus PROJ-3)
├── Kopfbereich „Wochenblick“ (PageHeader)
├── Wochenkopf
│   ├── Überschrift: „Diese Woche“ / „Vorige Woche“ / nur Datumsbereich · „17.–23. Nov.“
│   ├── ggf. Überblickssatz „Diese Woche hast du etwas für dich getan.“
│   │   bzw. „In dieser Woche hast du etwas für dich getan.“
│   └── Blättern: [‹ Vorige Woche] (nicht in der Woche der Kontoerstellung)
│                 [Nächste Woche ›] (nicht in der laufenden Woche)
├── Tage (geordnete Liste Mo–So)
│   └── Tag: „Mo 17.“ · ggf. „heute“
│       ├── Einträge in Reihenfolge des Beginns:
│       │   Titel (Link zum Detail; ohne Link, wenn nicht mehr angeboten) · „Bewegen“/„Essen“ · „geschafft“/„angefangen“
│       └── oder „–“
├── Nur laufende Woche ohne Eintrag: „Für diese Woche gibt es noch nichts. Auf „Heute“ findest du
│   einen passenden nächsten Schritt.“ · [Zu Heute]
└── Zeitzonen-Abgleich (unsichtbar): teilt die Gerätezeitzone mit und lädt einmal neu, wenn sie sich ändert
```

- Die Seite verwendet `PageHeader`, den Ladezustand des Bereichs (`(bereiche)/loading.tsx`) und die Fehlergrenze des geschützten Bereichs (EC-4). Es gibt keinen eigenen Fehlerzustand, damit ein Ladefehler nie wie eine leere Woche aussieht.
- Die Tage sind eine geordnete Liste, die Einträge eines Tages eine Liste. Wochentag und Datum stehen als Text. „heute“, „geschafft“ und „angefangen“ sind ausgeschriebene Wörter (AC-2, übergreifende Anforderungen).
- Titel brechen um statt abgeschnitten zu werden. Es gibt keine Tabellen und kein Raster, das auf 375 px seitlich scrollen müsste (EC-5).
- Keine Zahlen, Fortschrittsbalken oder Animationen. Hervorgehoben ist nichts außer der Kennzeichnung „heute“.
- Keine neuen Navigationseinträge. Der Bereich „Wochenblick“ existiert bereits; die Seite ersetzt nur den Platzhalter. `docs/app-shell.md` bleibt unverändert.

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/week/week.rules.ts` | Rein. Arbeitet mit **Kalenderdaten** (Jahr, Monat, Tag ohne Uhrzeit) und Zeitpunkten; „jetzt“ und Zeitzone kommen als Eingabe. Die Aufgaben im Einzelnen: <br>• **Zeitzone prüfen:** gültiger IANA-Name, sonst `Europe/Berlin`. <br>• **Ortsdatum eines Zeitpunkts** in einer Zeitzone. <br>• **Montag einer Woche** zu einem Datum. <br>• **Adresse lesen:** `woche` streng als `JJJJ-MM-TT`; jedes gültige Datum steht für seine Woche. Eine ungültige Angabe, eine Woche nach der laufenden oder eine Woche vor der Woche der Kontoerstellung ergibt die laufende Woche (AC-15). <br>• **Abfragezeitraum:** UTC-Zeitpunkte, ein Tag Puffer vor und nach der Woche, damit jede Zeitzone abgedeckt ist. <br>• **Woche aufbauen:** sieben Tage Mo–So mit Kennzeichen „heute“; Einträge mit Zustand `started` oder `done` dem Ortsdatum ihres Beginns zuordnen, je Tag nach Beginn sortieren, `skipped` und Einträge außerhalb der Woche verwerfen (AC-1 bis AC-6, EC-2, EC-6). <br>• **Beschriftungen:** Überschrift, Datumsbereich, Wochentag mit Datum, Zustand. <br>• **Überblickssatz** (AC-9, AC-10). <br>• **Blättern:** ob es eine vorige bzw. nächste Woche gibt und deren Adressen (AC-12 bis AC-14). | `features/today/today.rules` (`Kind`, `KIND_LABELS`, `detailHref`, Typ `ActionStatus`); nur eingebaute Datums- und `Intl`-Funktionen. |
| `src/features/week/components/week-view.tsx` | Server-taugliche Darstellung ohne Zustand: bekommt die aufgebaute Woche und zeigt Wochenkopf, Überblick, Blättern (Links), Tage, Einträge und den Leer-Hinweis. | `PageHeader`; shadcn `button`; `next/link`; Rules. |
| `src/features/week/components/time-zone-sync.tsx` | Client, zeigt nichts an. Liest die Zeitzone des Geräts; weicht sie vom übergebenen Cookie-Wert ab, setzt sie das Cookie und lädt die Seite einmal neu (EC-2 auch außerhalb Deutschlands). | `next/navigation` (Router). |
| **Änderung PROJ-6:** `src/features/today/today.data.ts` | Neue Lesefunktion: eigene Aktionen mit Zustand `started` oder `done`, deren Beginn in einem Zeitraum liegt, mit Titeln, aufsteigend nach Beginn. Sie nutzt die bestehende Zeilenumwandlung samt Titel; bei nicht mehr angebotenem Inhalt ist der Titel leer. Der Aktionsverlauf hat damit weiter genau ein Datenmodul. | wie bisher. |
| **Änderung PROJ-6:** `src/features/today/today.rules.ts`, `src/features/today/components/open-actions.tsx` | Die Ersatztitel „Dein Workout“ / „Deine Mahlzeit“ wandern in die Regeln (zweiter Nutzer), `open-actions` verwendet sie von dort. | wie bisher. |
| `src/app/(protected)/(bereiche)/wochenblick/page.tsx` | Ersetzt den Platzhalter. Ablauf: <br>• angemeldete Person mit vollständigen Angaben ermitteln (`requireCompletedProfile`; liefert auch den Kontozeitpunkt) <br>• Zeitzone aus dem Cookie prüfen und die angefragte Woche bestimmen <br>• Aktionen des Abfragezeitraums laden und die Woche aufbauen <br>• `WeekView` und `TimeZoneSync` darstellen | `features/week`, `features/today/today.data`, `features/profile/profile.data`, `next/headers` (Cookies). |

Abhängigkeitsrichtung: `features/week` benutzt `features/today` (Regeln) und wird nur von der Seite benutzt. `features/today` kennt `features/week` nicht.

## Footprint

- **Code und Tests:**
  - `src/features/week/week.rules.ts` mit Test
  - `src/features/week/components/week-view.tsx` mit Test
  - `src/features/week/components/time-zone-sync.tsx` mit Test
  - Änderungen mit Tests an `src/features/today/today.data.ts`, `today.rules.ts` und `components/open-actions.tsx`
  - `src/app/(protected)/(bereiche)/wochenblick/page.tsx` ersetzt den Platzhalter
- **Migrationen, Tabellen und Zugriffsregeln:** keine. Gelesen wird `actions` (PROJ-6) mit eingebetteten Titeln aus `workouts` und `meals` (RLS: nur eigene, aktive Sitzung bzw. nur angebotene Inhalte).
- **Namen der Umgebungsvariablen:** keine.
- **Cookie:** `pulse_tz`, enthält nur den Namen der Gerätezeitzone (z. B. `Europe/Lisbon`). Gesetzt vom Browser, gültig für den ganzen Pfad, SameSite=Lax, ein Jahr, kein Personenbezug außer dieser Angabe.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** `/wochenblick` (ersetzt den Platzhalter) mit optionalem Parameter `woche`. Genutzt werden `/bewegung/[id]`, `/essen/[id]` und `/heute` als Ziele. Kein neuer Navigationseintrag, keine externen Dienste. Der Platzhaltertext für „Wochenblick“ in `area-placeholder.tsx` (PROJ-2) wird nicht mehr verwendet und bleibt dort unverändert.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-1, AC-2, AC-4, EC-2 | Tage und „heute“ nach Ortszeit des Geräts; eine Aktion steht am Ortsdatum ihres Beginns, auch über Mitternacht und die Wochengrenze. | Ortsdatum je Zeitpunkt über die Zeitzone; Abfrage mit einem Tag Puffer, danach Zuordnung nach Ortsdatum. | Unit-Tests mit Tabellen: Berlin, Lissabon, Helsinki; Sonntag 23:30 → Sonntag; Sommer- und Winterzeitwechsel. |
| AC-15 | Ungültige, zukünftige oder zu frühe Woche in der Adresse → laufende Woche. | Strenge Prüfung des Parameters in den Regeln, Grenzen über Kontoerstellung und „jetzt“. | Unit-Tests: Text, `2026-02-30`, nächste Woche, Woche vor der Kontoerstellung, beliebiger Tag einer gültigen Woche. |
| AC-5, AC-6, EC-6 | Nur `done` und `started`, unabhängig vom Alter. | Lesefunktion filtert auf beide Zustände; Regeln verwerfen `skipped` zusätzlich. | Daten-Test; Regel-Test. |
| EC-1 | Nicht mehr angebotener Inhalt: Ersatztitel, kein Link. | Titel kommt leer, weil die Inhalte nur angebotene Zeilen zeigen; die Ansicht setzt den Ersatztitel und lässt den Link weg. | Komponententest; Live-Prüfung mit vorübergehend nicht angebotenem Workout. |
| EC-3 | Aktueller Stand beim nächsten Öffnen. | Seite wird bei jeder Anfrage frisch erzeugt (sie liest Cookies und Sitzung); keine Zwischenspeicherung. | Live-Prüfung: markieren, Seite erneut abrufen. |
| EC-4 | Ladefehler sieht nie wie eine leere Woche aus. | Lesefehler werfen; es greift die Fehlergrenze des geschützten Bereichs mit „Erneut versuchen“. | Daten-Test (wirft); Sichtprüfung der bestehenden Fehlergrenze. |
| EC-5 | Viele Einträge auf 375 px ohne seitliches Scrollen. | Einspaltige Liste, umbrechende Titel. | Komponententest mit fünf Einträgen und langem Titel (Klassen); Sichtprüfung bei `/qa`. |
| AC-16 | Nur eigene Aktionen; ohne Anmeldung zur Anmeldung. | RLS auf `actions` (eigene, aktive Sitzung) plus Filter auf die eigene ID; Gate des Bereichs leitet um. | Live-Prüfung mit zweitem Testkonto und ohne Sitzung. |

**Fehler an den Schnittstellen:**
- **Ungültiger Parameter `woche`:** kein Fehler, die laufende Woche wird angezeigt (AC-15).
- **Ungültiges oder manipuliertes Cookie `pulse_tz`:** wird ignoriert, es gilt `Europe/Berlin`. Der Wert wird nie ungeprüft verwendet oder ausgegeben (SEC-02).
- **Keine Sitzung oder unvollständige Angaben:** Umleitung durch `requireCompletedProfile` bzw. das Gate (bestehendes Verhalten).
- **Datenbank nicht erreichbar:** Die Lesefunktion wirft mit Datenbankcode, ohne Personendaten; es greift die Fehlergrenze (EC-4).
- **Browser ohne Cookies oder JavaScript:** Es bleibt bei deutscher Zeit; sonst funktioniert alles.

## Datenmodell

Keine neuen Tabellen oder Spalten. Gelesen wird der **Aktionsverlauf** (`actions`, PROJ-6):
- `id`, `kind`, `workout_id` bzw. `meal_id`, `status`, `started_at`
- Titel aus `workouts` bzw. `meals`; leer, wenn der Inhalt nicht mehr angeboten wird

**Abgeleitet, nicht gespeichert:**
- **Woche:** Montag bis Sonntag als Kalenderdaten in der Zeitzone der Person.
- **Abfragezeitraum:** von Montag 00:00 UTC minus ein Tag bis zum folgenden Montag 00:00 UTC plus ein Tag. Das deckt jede Zeitzone ab; die genaue Zuordnung erfolgt danach über das Ortsdatum.
- **Laufende Woche:** die Woche, die das Ortsdatum von „jetzt“ enthält.
- **Früheste Woche:** die Woche, die das Ortsdatum der Kontoerstellung enthält.
- **Überblick:** „etwas geschafft“, wenn mindestens ein Eintrag der Woche `done` ist.

**Zeitzonen-Cookie `pulse_tz`:**
- Inhalt: nur ein Zeitzonenname, höchstens 64 Zeichen.
- Prüfung: Er wird nur verwendet, wenn die Laufzeitumgebung ihn als Zeitzone kennt.
- Gesetzt und gelesen: ausschließlich für die Anzeige des Wochenblicks. Gesetzt wird er im Browser, gelesen nur auf dem Server; er wird nirgends gespeichert und nicht protokolliert.
- Aufbewahrung: ein Jahr im Browser der Person.
- Datenschutz: Er wird bei `/dsgvo` vor dem ersten Deploy mitbetrachtet (offene Frage in der Spec).

**Indizes:** Der bestehende Index auf `actions` nach Person und Beginn deckt die Abfrage eines Zeitraums ab.

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Wochenblick laden | Angemeldet, Angaben vollständig (Gate PROJ-3). | Woche aus Parameter `woche` (oder laufende), Zeitzone aus Cookie (oder Berlin). Gelesen werden nur eigene Aktionen `started`/`done` im Abfragezeitraum mit Titeln. Fehler → Fehlergrenze. | AC-1 bis AC-16, EC-1 bis EC-6 |
| Blättern | wie oben. | Normale Links auf `/wochenblick?woche=<Montag>`; „Diese Woche“ ohne Parameter. | AC-12 bis AC-15 |
| Zeitzone mitteilen | Browser der Person. | Setzt `pulse_tz` bei Abweichung und lädt einmal neu; schreibt nichts in die Datenbank. | AC-2, AC-4, EC-2 |
| Titel antippen | wie oben. | Öffnet das Detail (PROJ-4/5); nichts wird begonnen. | AC-7 |

Es gibt keine schreibenden Abläufe und keine Server Actions (AC-8).

## Abhängigkeiten

- Vorhanden: `next/headers`, `next/navigation`, `next/link`; shadcn `button`; `PageHeader`.
- Datums- und Zeitzonenrechnung mit den eingebauten `Date`- und `Intl`-Funktionen.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Keine eigene Tabelle; Woche bei jedem Aufruf aus `actions` ableiten | Entspricht dem Datenmodell; immer aktuell (EC-3); keine doppelten Daten. | Gespeicherter Wochenstand | Eine Abfrage pro Aufruf; bei höchstens einigen Dutzend Aktionen pro Woche unkritisch. | 2026-11-24 |
| Gerätezeitzone per Cookie, Ersatz `Europe/Berlin` | Ortszeit der Person laut Spec, auch außerhalb Deutschlands; Seite bleibt vollständig auf dem Server erzeugt (Wunsch aus dem Gespräch). | Feste deutsche Zeit; Zeitzone im Profil; Darstellung nur im Browser | Erster Aufruf ohne Cookie zeigt kurz deutsche Zeit und lädt dann einmal neu; ein zusätzliches technisches Cookie. | 2026-11-24 |
| Rechnung mit Kalenderdaten und Abfrage mit einem Tag Puffer | Kein Zeitzonen-Paket nötig; Sommer-/Winterzeit wird über das Ortsdatum jedes Zeitpunkts korrekt behandelt. | Wochengrenzen als exakte UTC-Zeitpunkte je Zeitzone berechnen (mit Paket) | Bis zu zwei Tage mehr Zeilen gelesen, danach verworfen. | 2026-11-24 |
| Woche als Parameter `woche=JJJJ-MM-TT` (Montag), Blättern über Links | Neuladen, Zurück-Taste und geteilte Adresse zeigen dieselbe Woche (AC-15); kein Zustand im Browser nötig. | Wochennummer (`2026-W47`); Zustand im Client | Jedes gültige Datum wird auf seine Woche abgebildet, auch wenn es kein Montag ist. | 2026-11-24 |
| Darstellung als Server-Komponente | Reine Leseansicht ohne Interaktion; weniger Code im Browser, kein Ladeflackern. | Client-Komponente mit Datenabruf | Der Zeitzonen-Abgleich braucht trotzdem ein winziges Client-Stück. | 2026-11-24 |
| Lesefunktion im Datenmodul von PROJ-6 | Der Aktionsverlauf bleibt an einer Stelle mit derselben Zeilenumwandlung und Titel-Logik. | Eigenes Datenmodul im Wochenblick | Kleine Änderung an einer PROJ-6-Datei. | 2026-11-24 |
| Ersatztitel in die Regeln von PROJ-6 verschieben | Jetzt zwei Nutzer (offene Aktionen, Wochenblick); ein Text an einer Stelle. | Text doppelt halten | Kleine Änderung an `open-actions`. | 2026-11-24 |
| Keine eigene Fehleransicht, Fehlergrenze des Bereichs | Ein Ladefehler darf nie wie eine leere Woche aussehen (EC-4); das Muster aus PROJ-2 gibt es schon. | Eigener Fehlerzustand im Wochenblick | Keiner. | 2026-11-24 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: Cookie `pulse_tz` in `/dsgvo` und `docs/privacy.md` aufnehmen (technisch notwendig für die Anzeige, kein Tracking).
