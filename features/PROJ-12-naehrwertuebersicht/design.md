# PROJ-12 — Technisches Design: Nährwertübersicht

> Das WIE zu `spec.md`. Zwei Lesende: die Produktverantwortung (Freigabe) und `/build` (Umsetzung). Kein Code, aber so genau, dass nichts geraten werden muss.
> Der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Überblick

Eine kleine Erweiterung der Mahlzeiten aus PROJ-5: Jede Mahlzeit bekommt vier optionale Nährwerte, die nur gemeinsam vorhanden sein dürfen. Das Mahlzeiten-Detail zeigt sie am Ende in einem zugeklappten Abschnitt. Es gibt keine neue Seite, keine neue Navigation, keine persönlichen Daten und keine neuen Schreibrechte.

## Komponentenstruktur

```
/essen/[id] — Mahlzeiten-Detail (PROJ-5, geändert)
├── Kopfbereich, Beispielinhalt-Markierung, Eckdaten   (unverändert)
├── Zutaten, Zubereitung, „Noch einfacher“, Allergene  (unverändert)
└── NEU: Abschnitt „Nährwerte pro Portion“ — nur wenn die Mahlzeit Nährwerte hat
    ├── Auslöser (Knopf, ganze Breite, ≥ 48 px, aria-expanded, Pfeil-Symbol dreht sich nicht)
    └── Inhalt (zu Beginn verborgen)
        ├── Liste mit vier Zeilen: „Energie: 450 kcal“ · „Eiweiß: 22 g“ · „Kohlenhydrate: 55 g“ · „Fett: 14 g“
        └── Hinweis „Ungefähre Werte – sie hängen von den genauen Zutaten ab.“

Mahlzeitenliste, „Heute“, Abschlussfeedback, Wochenblick — unverändert, keine Nährwerte (AC-7)
```

## Code-Struktur

Neuer, kleiner Feature-Ordner `src/features/nutrition/` für Regeln und Darstellung; die Daten bleiben bei den Mahlzeiten (PROJ-5), weil sie Teil der Mahlzeit sind.

| Modul / Pfad | Aufgabe und Schnittstelle | Erlaubte Abhängigkeiten / Wiederverwendung |
| --- | --- | --- |
| `src/features/nutrition/nutrition.rules.ts` | Rein. Typ „Nährwerte“ (Energie in kcal, Eiweiß, Kohlenhydrate, Fett in g — ganze Zahlen); Grenzen (0–2000 kcal, 0–200 g); Zusammenbauen aus vier gelesenen Werten: alle vier gültig → Nährwerte, sonst keine; die vier Anzeigezeilen in fester Reihenfolge mit Beschriftung und Einheit („0 g“ bleibt „0 g“); Texte (Titel, Hinweis). | — |
| `src/features/nutrition/components/nutrition-section.tsx` | Client. Zugeklappter Abschnitt mit Auslöser und Inhalt; Zustand nur im Browser, beim Öffnen einer Seite immer zu (AC-5); ohne Animation (EC-5). | shadcn `collapsible`; `lucide-react`; `nutrition.rules`. |
| **Änderung PROJ-5:** `src/features/meals/meals.rules.ts` | Die Mahlzeit kennt „Nährwerte“ (vorhanden oder keine). | `nutrition.rules` (Typ). |
| **Änderung PROJ-5:** `src/features/meals/meals.data.ts` | Alle Mahlzeiten-Abfragen lesen die vier Spalten mit und setzen „Nährwerte“ über die Regel; fehlende oder ungültige Werte → keine Nährwerte (die Mahlzeit selbst bleibt sichtbar). | `nutrition.rules`. |
| **Änderung PROJ-5:** `src/features/meals/components/meal-detail.tsx` | Zeigt den Abschnitt am Ende, nur wenn die Mahlzeit Nährwerte hat (AC-1, AC-6). | `nutrition-section`. |

Liste (`meal-list.tsx`), „Heute“ (PROJ-6) und die übrigen Bereiche bleiben unverändert; sie lesen dieselbe Mahlzeit, zeigen die Nährwerte aber nicht (AC-7).

## Footprint

- **Code und Tests:** `src/features/nutrition/nutrition.rules.ts` und `components/nutrition-section.tsx`, jeweils mit Test; Änderungen mit Tests an `src/features/meals/meals.rules.ts`, `meals.data.ts`, `components/meal-detail.tsx`.
- **Migrationen, Tabellen und Zugriffsregeln:** eine neue Migration `supabase/migrations/<Zeitstempel>_meal_nutrition.sql`: vier Spalten an `meals`, die Regel „alle vier oder keine“ mit Wertebereichen, Beispielwerte für alle 17 Beispiel-Mahlzeiten. Zugriffsregeln und Rechte bleiben unverändert (nur Lesen für Angemeldete, angebotene Mahlzeiten).
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** keine neuen; geändert wird nur der Inhalt von `/essen/[id]`.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-1, AC-5 | Zahlen erst nach dem Aufklappen sichtbar; jede neue Seite beginnt zugeklappt. | Abschnitt startet geschlossen; Zustand wird nirgends gespeichert. | Komponententest: geschlossen, nach Klick offen, neu gerendert wieder geschlossen. |
| AC-2, AC-3, EC-1 | Genau vier ganze Zahlen mit Einheit, „0 g“ als Zahl; keine Prozente, Farben, Einordnungen. | Reine Funktion für die vier Zeilen; neutrale Textfarbe. | Unit-Test der Zeilen (inkl. 0); Komponententest auf fehlende wertende Texte. |
| AC-4, EC-5 | Tastatur (Enter/Leertaste), Zustand angesagt, ≥ 48 px; keine Animation. | Knopf als Auslöser mit `aria-expanded` und `aria-controls`; keine Übergänge am Inhalt. | Komponententest (Rolle, Zustand, Tastatur). |
| AC-6, AC-8 | Alle vier oder keiner; ohne Werte kein Abschnitt. | Datenbank lässt nur „alle vier“ oder „keiner“ zu; die Leseregel macht aus Unvollständigem „keine Nährwerte“. | Datenbank-Prüfung; Unit-Tests der Leseregel; Komponententest ohne Werte. |
| AC-11 | Nährwerte nur lesbar. | Bestehende Rechte an `meals`: nur Lesen für Angemeldete. | Live-Prüfung: Ändern durch Angemeldete wird abgelehnt. |
| EC-2, EC-3 | Nicht angebotene Mahlzeit → „Nicht gefunden“; Ladefehler → Fehlerzustand. | Unverändert aus PROJ-5. | Bestehende Tests; Live-Prüfung. |
| EC-4 | 375 px, aufgeklappt, ohne seitliches Scrollen. | Einfache Liste mit Umbruch, keine Tabelle mit festen Spalten. | Komponententest auf umbrechende Klassen; Sichtprüfung. |

**Fehlerarten:** Erwartet ist nur „keine Nährwerte“ (kein Abschnitt). Ein Lesefehler bleibt wie in PROJ-5 ein Fehler der ganzen Seite, nie ein stilles Weglassen (EC-3).

## Datenmodell

**Änderung an `meals` (PROJ-5, gemeinsam bereitgestellter Inhalt, keine persönlichen Daten)**
- `energy_kcal`: ganze Zahl oder leer; wenn gesetzt 0–2000.
- `protein_g`: ganze Zahl oder leer; wenn gesetzt 0–200.
- `carbs_g`: ganze Zahl oder leer; wenn gesetzt 0–200.
- `fat_g`: ganze Zahl oder leer; wenn gesetzt 0–200.
- **Regel „alle oder keine“:** Entweder sind alle vier Spalten gesetzt oder alle vier leer (AC-8). Die Datenbank lehnt alles andere ab.
- Bedeutung: Werte pro Portion für eine Person (wie die Zutatenmengen in PROJ-5).

**Beispielinhalt:** Die Migration setzt für alle 17 Beispiel-Mahlzeiten ungefähre Beispielwerte, aus den angegebenen Zutatenmengen grob abgeschätzt und gerundet (AC-10). Sie gelten über den Prüfstatus der Mahlzeit als „Beispielinhalt“ (AC-9).

**Zugriff:** unverändert — Angemeldete lesen angebotene Mahlzeiten; niemand schreibt über die App oder die API (AC-11). Gepflegt wird über Migrationen.

**Aufbewahrung:** nicht personenbezogen; Inhalt bleibt, bis die Redaktion ihn ändert.

**Datenmodell der App:** Die Mahlzeitenoption trägt optional Nährwerte pro Portion (Energie, Eiweiß, Kohlenhydrate, Fett; alle oder keine; PROJ-12). Das „Nährwertziel“ bleibt eine spätere Ergänzung (`docs/data-model.md`).

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Mahlzeiten-Detail laden | Angemeldet, Angaben vollständig (wie PROJ-5). | Mahlzeit mit oder ohne Nährwerte; nicht angeboten → „Nicht gefunden“; Lesefehler → Fehlerzustand. | AC-1, AC-6, EC-2, EC-3 |
| Abschnitt öffnen/schließen | Im Browser, ohne Server. | Zeigt oder verbirgt die vier Werte und den Hinweis. | AC-1, AC-2, AC-4, AC-5 |
| Nährwerte ändern | Niemand über App oder API. | Abgelehnt. | AC-11 |

## Abhängigkeiten

- Vorhanden: shadcn `collapsible`, `lucide-react`, Zod; `SampleContentBadge` (unverändert).
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Vier Spalten direkt an `meals` | Nährwerte gehören zur Mahlzeit, werden mit ihr gelesen, geprüft und angeboten; keine zusätzliche Abfrage. | Eigene Tabelle „Nährwerte je Mahlzeit“ | Die Mahlzeitentabelle wird etwas breiter. | 2026-11-27 |
| „Alle oder keine“ als Datenbankregel | AC-8 gilt auch für Inhalte, die direkt per Migration gepflegt werden. | Nur in der App prüfen | — | 2026-11-27 |
| Ganze Zahlen in der Datenbank | Angezeigt werden ohnehin ganze Zahlen; „ungefähr“ ist ehrlicher als Kommastellen. | Dezimalzahlen speichern, beim Anzeigen runden | Feinere Werte gehen verloren — gewollt. | 2026-11-27 |
| Eigener kleiner Ordner `nutrition` für Regeln und Abschnitt, Daten bleiben bei `meals` | Klare Zuständigkeit von PROJ-12, ohne eine zweite Mahlzeiten-Abfrage. | Alles in `meals` | Ein Ordner mehr; `meals` importiert aus `nutrition`. | 2026-11-27 |
| Unvollständige oder ungültige Werte → Mahlzeit ohne Nährwerte, nicht ausgeblendet | Ein Fehler in den Zahlen soll die Mahlzeit nicht verschwinden lassen. | Ganze Zeile verwerfen (wie andere ungültige Felder) | Ein Inhaltsfehler bleibt still — die Datenbankregel verhindert ihn ohnehin. | 2026-11-27 |
| Zugeklappt mit shadcn `collapsible`, Zustand nicht gespeichert | Barrierefreier Auslöser vorhanden; immer zu beim Öffnen (AC-5), keine Einstellung nötig. | `accordion`, `<details>` | — | 2026-11-27 |
| Keine Animation beim Auf- und Zuklappen | Ruhige Oberfläche; „Bewegung reduzieren“ ist damit ohne Sonderfall erfüllt (EC-5). | Animation mit Abschaltung | — | 2026-11-27 |
| Beispielwerte grob aus den Zutatenmengen geschätzt | Prototyp vollständig ausprobierbar (AC-10); fachliche Prüfung folgt vor Veröffentlichung. | Werte erst nach Fachprüfung | Werte sind bis dahin nur Platzhalter; durch „Beispielinhalt“ gekennzeichnet. | 2026-11-27 |

## Offene Fragen

Keine neuen; siehe `spec.md` (fachliche Prüfung, Quelle und Berechnungsweg der Werte).
