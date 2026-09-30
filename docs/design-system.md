# Designsystem: PULSE

> Verbindliche visuelle Grundlage für die Weiterentwicklung. Ausgangspunkt ist `docs/product/style.css`; die tägliche Oberfläche wird gegenüber dem Prototyp ruhiger. Die Werte werden bei der Umsetzung in `src/app/globals.css` und die vorhandenen shadcn/ui-Komponenten übertragen.

## Visuelle Richtung

PULSE behält seine warme, dunkle Aubergine-Basis, das Limettengrün und die charakteristische Pulslinie. Die Pulslinie ist das wiedererkennbare Motiv; im Produkt bleibt sie überwiegend statisch. Auf „Heute“ erhält die nächste machbare Aktion die stärkste visuelle Betonung. Zwei Alternativen und ergänzende Informationen bleiben sichtbar, ohne mit ihr zu konkurrieren. Die Oberfläche verwendet keine Ansammlung gleich gewichteter Kennzahlenkarten.

## Farben

Die Spalten enthalten die HSL-Werte für die vorhandenen CSS-Variablen in `src/app/globals.css`; Hexwerte dienen der leichteren Prüfung. Dunkel ist die PULSE-Ausgangsansicht, Hell eine voll definierte Alternative. Beide Ansichten dürfen nach Systemeinstellung oder eigener Auswahl verwendet werden.

| Rolle / CSS-Variable | Dunkel | Hell | Verwendung |
|----------------------|--------|------|------------|
| Hintergrund `--background` | `270 20% 8%` (`#141018`) | `276 26% 96%` (`#F6F3F8`) | Grundfläche |
| Text `--foreground` | `264 26% 96%` (`#F5F3F8`) | `268 22% 14%` (`#221B2A`) | Lesetext und Überschriften |
| Fläche `--card` | `263 21% 12%` (`#1E1926`) | `280 43% 99%` (`#FCFAFD`) | Aufgaben- und Inhaltsflächen |
| Sekundär `--secondary` | `268 17% 17%` (`#2B2433`) | `273 21% 92%` (`#EAE5EE`) | Zurückhaltende Bedienelemente |
| Gedämpfter Text `--muted-foreground` | `270 14% 77%` (`#C5BDCD`) | `272 8% 35%` (`#5A5261`) | Ergänzende Information |
| Primär `--primary` | `78 100% 62%` (`#C6FF3D`) | `72 100% 20%` (`#536800`) | Wichtigste Aktion und aktiver Fokus |
| Primärtext `--primary-foreground` | `84 33% 6%` (`#10140A`) | `60 33% 96%` (`#F9F9F3`) | Text auf primären Flächen |
| Akzent `--accent` | `336 100% 62%` (`#FF3D8A`) | `334 54% 43%` (`#A83265`) | Sparsamer Markenakzent |
| Akzenttext `--accent-foreground` | `84 33% 6%` (`#10140A`) | `276 20% 97%` (`#F9F7FA`) | Text auf Akzentflächen |
| Fehler `--destructive` | `353 100% 75%` (`#FF8291`) | `353 57% 41%` (`#A52D3C`) | Fehler und destruktive Aktionen |
| Fehlertext `--destructive-foreground` | `84 33% 6%` (`#10140A`) | `276 20% 97%` (`#F9F7FA`) | Text auf Fehlerflächen |
| Grenze `--border` | `270 12% 29%` (`#4B4254`) | `273 13% 74%` (`#BDB3C5`) | Eingaben und Flächentrennung |

`--card-foreground` und `--popover-foreground` übernehmen `--foreground`; `--popover` übernimmt `--card`. `--muted` übernimmt `--secondary`, `--secondary-foreground` übernimmt `--foreground`, `--input` übernimmt `--border`, `--ring` übernimmt `--primary`. Die Seitenleisten-Tokens folgen denselben Rollen. Für primäre Aktionen erhält Dunkel einen Hover-Wert von `#A7DB2E`, Hell von `#415300`; der aktive Zustand wird zusätzlich durch Form oder Beschriftung erkennbar. Große Farbverläufe und dauerhaft leuchtende Flächen entfallen.

Die vorgesehenen Paare für Haupttext, gedämpften Text und Text auf Primär-, Akzent- und Fehlerflächen erreichen nach Berechnung jeweils mindestens 4,5:1 Kontrast. Konkrete Kombinationen werden bei der Umsetzung erneut geprüft.

## Schrift

- **Unbounded:** PULSE-Wortmarke und kurze, prägnante Überschriften; Gewicht 700. Kein längerer Fließtext.
- **Inter:** Navigation, Fragen, Aktionsbeschriftungen und Fließtext; Gewicht 400, 500 oder 600.
- **JetBrains Mono:** Nur für kurze Zahlen oder Zeitangaben, falls deren Vergleich das Verständnis verbessert. Keine durchgängigen Großbuchstaben-Labels.
- **Größen:** 14 px ergänzend, 16 px Standardtext, 20 px Abschnittstitel, 28 px Seitenüberschrift, bis 40 px für einen einzelnen Einstiegssatz. Fließtext mit mindestens 1,5 Zeilenhöhe und höchstens ungefähr 70 Zeichen je Zeile.

## Form, Abstand und Tiefe

- `--radius: 14px` als gemeinsame Grundlage für Karten, Eingaben und Schaltflächen. Vollständig runde Formen nur für echte Statuspunkte oder kompakte Auswahlchips.
- Abstände folgen 4, 8, 12, 16, 24 und 32 px. Zusammengehörige Angaben stehen näher beieinander als getrennte Entscheidungen.
- Grenzen und Flächenunterschiede trennen Inhalte. Schatten bleiben der jeweils wichtigsten Aktionsfläche vorbehalten; keine Leuchtrahmen um jede Karte.
- Inhalte werden links ausgerichtet. Eine Empfehlung bildet den visuellen Mittelpunkt, ohne die gesamte Seite mit gleichrangigen Karten zu füllen.

## Komponenten und Zustände

- Vorhandene shadcn/ui-Bausteine werden verwendet und mit den PULSE-Tokens gestaltet. Primäre Schaltflächen und Eingaben sind mindestens 48 px hoch; mobile Bedienflächen bleiben gut erreichbar.
- Pro Ansicht gibt es höchstens eine visuell dominante primäre Aktion. Sekundäre Aktionen bleiben erkennbar, aber zurückhaltend.
- Jede Interaktion hat einen sichtbaren Hover- und Tastatur-Fokuszustand. Fokus erhält einen mindestens 2 px starken Ring mit Abstand zum Element; Farbe allein trägt keine Zustandsinformation.
- Ladezustände halten Platz frei und bleiben ruhig. Leere Zustände schlagen eine konkrete erste Handlung vor. Fehlermeldungen sagen, was passiert ist und wie es weitergeht.
- Bedienwörter sind kurz, deutsch und durchgängig gleich: Eine Schaltfläche „Aktion starten“ führt zu einer Rückmeldung „Aktion gestartet“.

## Bewegung und Anpassbarkeit

Eine kurze Rückmeldung auf eine ausgelöste Aktion ist möglich; automatische Daueranimationen, pulsierende Hintergründe und gestaffelte Karteneintritte entfallen. Bei `prefers-reduced-motion: reduce` werden nicht notwendige Übergänge entfernt. Eine manuelle Einstellung zur Bewegungsreduktion wird im betreffenden Feature geklärt. Die Gestaltung kann in Hell und Dunkel genutzt werden, ohne Informationen oder Bedienbarkeit zu verlieren.
