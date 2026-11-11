# PROJ-2 — Technisches Design: App-Rahmen & Navigation

> Technische Umsetzung von `spec.md`. PROJ-2 ist ein reines Oberflächen-Feature: keine Datenbank, keine neuen Server-Endpunkte, keine personenbezogenen Daten. Es baut auf dem geschützten Layout und der Sitzungsprüfung aus PROJ-1 auf.

## Komponentenstruktur

```text
Root-Layout (alle Seiten)
├── Schriften: Unbounded (Marke, kurze Überschriften) und Inter (Text), selbst ausgeliefert
├── Vor dem ersten Zeichnen: Farbschema und „Bewegung reduzieren“ aus dem Gerätespeicher setzen
└── Darstellungs-Provider (Farbschema-Umschaltung, Bewegungseinstellung)

Öffentliche Seiten (Einstieg, Anmelden, Registrieren, Passwort vergessen — aus PROJ-1)
└── PULSE-Marke (Wortmarke + statische Pulslinie), keine App-Navigation

Geschützter Bereich (nur angemeldet; Sitzungsprüfung aus PROJ-1)
└── App-Rahmen
    ├── Link „Zum Inhalt springen“ (erstes fokussierbares Element)
    ├── Seitenleiste (ab 1024 px): PULSE-Marke + 5 Bereiche
    ├── Untere Navigation (unter 1024 px): 5 Bereiche mit Symbol + Beschriftung
    └── Inhalt
        ├── Kopfbereich: Bereichstitel + höchstens eine Hauptaktion (vom jeweiligen Feature)
        ├── Heute ─────────── Platzhalter aus PROJ-1, bis PROJ-6 ihn ersetzt
        ├── Bewegung ──────── Platzhalter (bis PROJ-4)
        ├── Essen ─────────── Platzhalter (bis PROJ-5)
        ├── Wochenblick ───── Platzhalter (bis PROJ-8)
        ├── Profil ────────── Konto (PROJ-1) + neuer Abschnitt „Darstellung“
        │   └── Darstellung: Farbschema System / Hell / Dunkel, Schalter „Bewegung reduzieren“
        ├── Laden: ruhiger Platzhalter (Skelett) im Inhaltsbereich
        └── Fehler: Meldung + „Erneut versuchen“ im Inhaltsbereich

„Seite nicht gefunden“
├── angemeldet: im App-Rahmen, Weg zu „Heute“
└── nicht angemeldet: mit PULSE-Marke, ohne Navigation, Weg zum Einstieg
```

**Navigationseinträge** (feste Reihenfolge, gleiche Namen überall):

| Bereich | Pfad | Symbol (lucide) | aktiv, wenn der Pfad … |
| --- | --- | --- | --- |
| Heute | `/heute` | Sonne (`Sun`) | `/heute` ist oder damit beginnt |
| Bewegung | `/bewegung` | Aktivität (`Activity`) | `/bewegung` ist oder damit beginnt |
| Essen | `/essen` | Besteck (`UtensilsCrossed`) | `/essen` ist oder damit beginnt |
| Wochenblick | `/wochenblick` | Kalender (`CalendarRange`) | `/wochenblick` ist oder damit beginnt |
| Profil | `/profil` | Person (`UserRound`) | `/profil` ist oder damit beginnt |

„Beginnt damit“ heißt: der Pfad selbst oder ein Unterpfad nach `/`. `/profilbild` wäre also nicht „Profil“.

**Aktiver Eintrag:** Er wird nicht nur farblich markiert, sondern zusätzlich durch einen Balken an der Kante (Seitenleiste) bzw. oberhalb (untere Navigation) und eine kräftigere Schrift. Für Screenreader ist er als aktuelle Seite ausgezeichnet (AC-3).

**Untere Navigation:** Fünf gleich breite Felder, jeweils mindestens 64 px hoch, mit Symbol und 14-px-Beschriftung. „Wochenblick“ darf an einer weichen Trennstelle („Wochen-blick“) auf zwei Zeilen umbrechen, damit bei 320 px Breite alles ohne seitliches Scrollen passt (EC-4). Die Navigation ist fixiert. Der Inhalt bekommt unten genau so viel Abstand wie die Navigation hoch ist, plus den Sicherheitsabstand des Geräts (z. B. iPhone-Home-Leiste), damit nichts verdeckt wird (AC-2, EC-6).

**Kopfbereich:** Der Titel ist eine `h1` in Unbounded und bricht bei langen Titeln um (EC-5). Rechts daneben (mobil darunter) liegt ein optionaler Platz für genau eine Hauptaktion, die das jeweilige Feature mitgibt (AC-6).

**Platzhalter:** Eine gemeinsame Ansicht mit Titel, einem kurzen ermutigenden Satz, was hier entsteht, und einem Link „Zu Heute“ (AC-5). Die Texte stehen an einer Stelle und werden bei der Umsetzung festgelegt.

## Code-Struktur

Der Rahmen besteht aus **gemeinsamen Bausteinen**, die alle späteren Features verwenden. Er liegt deshalb unter `src/components/shell/`. Die Darstellungseinstellungen sind Feature-Logik und liegen unter `src/features/appearance/`.

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/components/shell/navigation.rules.ts` | Reine Regeln: Liste der fünf Bereiche (Name, Pfad, Symbolname) und die Prüfung „ist dieser Eintrag für Pfad X aktiv“. | Keine (rein). |
| `src/components/shell/brand-mark.tsx` | PULSE-Wortmarke in Unbounded mit statischer Pulslinie (SVG). Für die Seitenleiste, die öffentlichen Seiten und „Seite nicht gefunden“. | — |
| `src/components/shell/desktop-nav.tsx` | Client-Komponente: Seitenleiste ab 1024 px aus den shadcn-`Sidebar`-Bausteinen (nicht einklappbar), aktiver Eintrag nach aktuellem Pfad. | `components/ui/sidebar`, `navigation.rules`, `brand-mark`, `next/link`, `lucide-react`. |
| `src/components/shell/mobile-nav.tsx` | Client-Komponente: fixierte untere Navigation unter 1024 px. | `navigation.rules`, `next/link`, `lucide-react`. |
| `src/components/shell/app-shell.tsx` | Setzt den Rahmen zusammen: Sprunglink, Seitenleiste, untere Navigation und `main` (Sprungziel) mit Abständen. Erhält den Seiteninhalt. | Die drei Bausteine oben. |
| `src/components/shell/page-header.tsx` | Kopfbereich: Titel und optionaler Platz für eine Hauptaktion. Von jeder geschützten Seite verwendet. | — |
| `src/components/shell/area-placeholder.tsx` | Platzhalteransicht für noch leere Bereiche: Titel, Text, Link „Zu Heute“. | `page-header`, `components/ui/button`. |
| `src/features/appearance/appearance.rules.ts` | Reine Regeln: erlaubte Werte, Speicherschlüssel, Auslesen gespeicherter Werte mit Rückfall bei ungültigem Inhalt. | Keine (rein). |
| `src/features/appearance/appearance-provider.tsx` | Client: stellt das Farbschema über `next-themes` bereit und verwaltet „Bewegung reduzieren“ (Gerätespeicher, Attribut am `html`-Element, Geräteeinstellung lesen). | `next-themes`, `appearance.rules`. |
| `src/features/appearance/appearance-script.tsx` | Kleines Skript im Kopf des Dokuments, das „Bewegung reduzieren“ vor dem ersten Zeichnen setzt. Das Farbschema übernimmt `next-themes` mit seinem eigenen Skript. | `appearance.rules`. |
| `src/features/appearance/appearance-settings.tsx` | Client: Abschnitt „Darstellung“ im Profil. Farbschema als Auswahl System/Hell/Dunkel (shadcn `RadioGroup`), „Bewegung reduzieren“ als shadcn `Switch`. | `components/ui/*`, `appearance-provider`. |
| `src/app/layout.tsx` | Schriften laden, Sprache, Darstellungs-Provider und Skript einhängen. | `next/font/google`, `features/appearance`. |
| `src/app/globals.css` | PULSE-Farbtoken für Hell und Dunkel, Rundung 14 px, Schriftzuordnung, Regeln für reduzierte Bewegung. | — |
| `src/components/ui/button.tsx`, `src/components/ui/input.tsx` | Grundhöhe von Schaltflächen und Eingaben auf 48 px anheben (AC-9). Das ist eine Anpassung der vorhandenen shadcn-Bausteine, kein Nachbau. | — |
| `src/app/(protected)/layout.tsx` | Bestehendes PROJ-1-Layout: nach der Sitzungsprüfung den App-Rahmen um den Inhalt legen. | `components/shell/app-shell`, `features/account`. |
| `src/app/(protected)/loading.tsx`, `error.tsx` | Lade- und Fehlerzustand im Inhaltsbereich; die Navigation bleibt sichtbar (AC-17, AC-18). | `components/ui/skeleton`, `components/ui/button`, `page-header`. |
| `src/app/(protected)/{bewegung,essen,wochenblick}/page.tsx` | Platzhalterseiten der drei noch leeren Bereiche. | `area-placeholder`. |
| `src/app/(protected)/heute/page.tsx`, `profil/page.tsx` | Kopfbereich einsetzen. Doppelte Links („Zum Profil“, „Zu Heute“) entfallen, weil die Navigation sie ersetzt. Im Profil kommt der Abschnitt „Darstellung“ hinzu. | `page-header`, `appearance-settings`. |
| `src/app/not-found.tsx` | „Seite nicht gefunden“: angemeldet im App-Rahmen, sonst mit Marke ohne Navigation (AC-16). | `features/account` (aktuelle Person), `app-shell`, `brand-mark`. |
| Öffentliche Seiten aus PROJ-1 (`/`, `/anmelden`, `/registrieren`, `/passwort-vergessen`) | Den Schriftzug „PULSE“ durch die `brand-mark` ersetzen (AC-7, AC-10). | `brand-mark`. |

Gemeinsame Bausteine unter `src/components/shell/` importieren nie aus `src/features/`. `not-found.tsx` und die Layouts in `src/app/` dürfen beides einbinden.

## Footprint

- **Code und Tests:** `src/components/shell/**`, `src/features/appearance/**` mit Tests neben den Modulen, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/not-found.tsx`, `src/app/(protected)/{layout,loading,error}.tsx`, die drei Platzhalterseiten, Anpassungen an `heute`, `profil` und den vier öffentlichen Seiten aus PROJ-1, `src/components/ui/{button,input}.tsx`.
- **Migrationen, Tabellen und Zugriffsregeln:** keine.
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen. `next-themes`, `lucide-react` und `next/font` sind vorhanden.
- **Routen, Rahmen und externe Dienste:** neue Routen `/bewegung`, `/essen`, `/wochenblick`. Der Rahmen hängt im geschützten Layout. Externe Dienste zur Laufzeit gibt es keine; die Schriften lädt nur der Build einmal herunter.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-11 | Kontrast ≥ 4,5:1 für alle Textpaare in Hell und Dunkel. | Farbtoken exakt nach `docs/design-system.md` in `globals.css`. | Unit-Test liest die Token aus `globals.css` und berechnet den Kontrast aller Paare in beiden Schemata. |
| AC-12 | Kein Abruf von Schriften oder Ressourcen bei Drittanbietern. | `next/font/google` lädt die Schriften beim Build und liefert sie unter `/_next/static/media` aus. Es gibt keine Verweise auf `fonts.googleapis.com` oder `fonts.gstatic.com`. | QA: Netzwerkprotokoll beim Laden enthält nur die eigene Adresse; ausgelieferte HTML/CSS enthält keine Google-Font-Adresse. |
| EC-1 | Kein Aufblitzen des falschen Farbschemas. | `next-themes` setzt die Klasse vor dem ersten Zeichnen per Skript im Dokumentkopf. Beim Umschalten werden Übergänge kurz abgeschaltet. | QA: gespeichertes „Hell“ bei dunkler Geräteeinstellung → erstes Bild ist hell. |
| AC-15 | Keine nicht notwendige Bewegung bei Geräte- oder eigener Einstellung. | Eine zentrale CSS-Regel setzt Animationen und Übergänge auf praktisch null, wenn das Gerät reduzierte Bewegung meldet oder das Attribut `data-reduce-motion` am `html` steht. Ein Skript setzt das Attribut vor dem ersten Zeichnen. | Unit-Test der Speicherlogik; QA mit Geräteeinstellung und mit Schalter. |
| EC-2 | Gerätespeicher gesperrt. | Jeder Zugriff auf den Gerätespeicher ist abgefangen; die Wahl lebt dann nur im Zustand der Seite. Ungültige gespeicherte Werte gelten als „keine Wahl“. | Unit-Test mit werfendem Speicher. |
| AC-9 | Bedienflächen ≥ 48 px. | Grundhöhe in `button` und `input`, Navigationseinträge mit eigener Mindesthöhe. | QA misst bei 375 px und 1440 px. |
| EC-3 | Abgelaufene Sitzung beim Bereichswechsel. | Der Proxy aus PROJ-1 leitet mit `?weiter=<Pfad>` zur Anmeldung, die danach dorthin zurückführt. PROJ-2 ergänzt nur die neuen Pfade in der Liste der geschützten Bereiche. | Unit-Test des Proxys um die neuen Pfade erweitert. |

**Fehler an den Schnittstellen:**
- **Unerwarteter Fehler in einem Bereich:** Die Fehlergrenze des geschützten Bereichs zeigt „Da ist etwas schiefgelaufen. Bitte versuche es erneut.“ mit der Schaltfläche „Erneut versuchen“, die den Bereich neu lädt. Next.js protokolliert den Fehler einmal; die Ansicht zeigt keine technischen Details.
- **Gerätespeicher nicht verfügbar:** Das ist kein Fehler, sondern ein stiller Rückfall auf die Geräteeinstellung (EC-2).
- **Unbekannte Adresse:** „Seite nicht gefunden“ (AC-16), kein Fehlerprotokoll.

## Datenmodell

Es gibt keine Datenbank und keine Kontodaten. Nur zwei Werte liegen im Speicher des Browsers auf dem jeweiligen Gerät:

| Schlüssel | Werte | Bedeutung | Aufbewahrung |
| --- | --- | --- | --- |
| `pulse-theme` | `system`, `light` oder `dark`; fehlt = `system` | Gewähltes Farbschema | Bis die Person eine andere Wahl trifft oder die Browserdaten löscht. |
| `pulse-reduce-motion` | `on` oder `off`; fehlt = `off` | Eigene Einstellung „Bewegung reduzieren“. Sie kann Bewegung nur zusätzlich reduzieren: Meldet das Gerät reduzierte Bewegung, gilt diese immer. | Wie oben. |

Ungültige Werte werden ignoriert und wie „fehlt“ behandelt. Beide Werte sind Bedienvorlieben ohne Personenbezug. `docs/data-model.md` ändert sich nicht.

**Anzeige der Einstellung:** Meldet das Gerät bereits reduzierte Bewegung, steht der Schalter auf „an“, ist gesperrt und trägt den Hinweis „Dein Gerät reduziert Bewegung bereits.“

## Abhängigkeiten

- `next-themes` (vorhanden): Farbschema mit Systemeinstellung, Speicherung auf dem Gerät und Schutz vor Aufblitzen.
- `lucide-react` (vorhanden): Symbole der Navigation.
- `next/font` (Teil von Next.js): selbst ausgelieferte Schriften Unbounded und Inter.
- shadcn `sidebar`, `radio-group`, `switch`, `skeleton`, `button`, `alert` (vorhanden).
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Schriften über `next/font/google`, beim Build heruntergeladen und selbst ausgeliefert | Der Browser stellt keine Anfrage an Google (AC-12), ohne zusätzliches Paket und ohne Schriftdateien im Repository. Dazu kommt automatisches Subsetting und kein Layoutsprung. | Schriftdateien selbst ins Repository legen (`next/font/local`) oder Pakete wie Fontsource | Der Build braucht einmal Netzzugang zu Google. Fällt der aus, schlägt der Build fehl, nicht die laufende App. | 2026-11-11 |
| Farbschema mit `next-themes` (Klasse `dark` am `html`, Standard `system`, Schlüssel `pulse-theme`) | Bereits installiert. Es setzt das Schema vor dem ersten Zeichnen (EC-1), folgt der Systemeinstellung, fängt Speicherfehler ab (EC-2) und passt zur vorhandenen `dark`-Variante in `globals.css`. | Eigenes Skript und eigener Kontext | Externe Bibliothek für eine kleine Aufgabe; dafür ist sie erprobt. | 2026-11-11 |
| „Bewegung reduzieren“ als Attribut am `html`-Element plus eine zentrale CSS-Regel, zusammen mit der Geräteeinstellung | Eine Regel wirkt auf alle heutigen und künftigen Komponenten, ohne dass jedes Feature daran denken muss. | Jede Animation einzeln an eine Einstellung koppeln | Die globale Regel schaltet auch harmlose Übergänge ab; das ist bei dieser Zielgruppe gewollt. | 2026-11-11 |
| Seitenleiste aus den vorhandenen shadcn-`Sidebar`-Bausteinen, nicht einklappbar; untere Navigation als eigene Komposition | Die Projektregel verbietet Nachbauten installierter Bausteine. Für eine untere Navigation gibt es keinen shadcn-Baustein. | Eigene Seitenleiste; shadcn-Seitenleiste als mobiles Ausklappmenü | Der Sidebar-Baustein bringt mehr mit als nötig (Einklappen, Tastenkürzel); diese Teile bleiben ungenutzt. | 2026-11-11 |
| Rahmenbausteine unter `src/components/shell/`, Darstellungslogik unter `src/features/appearance/` | Alle Features nutzen den Rahmen; gemeinsame Module dürfen nicht aus Features importieren. Die Darstellung ist eigenständige Feature-Logik. | Alles unter `src/features/app-shell/` | Zwei Orte für ein Feature; dafür bleiben die Importregeln sauber. | 2026-11-11 |
| Grundhöhe von `button` und `input` in den shadcn-Dateien auf 48 px | AC-9 gilt app-weit. Eine zentrale Stelle verhindert, dass jedes Feature die Höhe einzeln setzt. | Höhe je Verwendung per Klasse | Weicht vom shadcn-Standard ab; spätere `shadcn add`-Aktualisierungen dieser Bausteine müssen die Anpassung erhalten. | 2026-11-11 |
| Umschaltpunkt Seitenleiste/untere Navigation bei 1024 px | Laut Spec; entspricht dem Tailwind-Breakpoint `lg`. | 768 px | — | 2026-11-11 |
| „Seite nicht gefunden“ prüft selbst, ob jemand angemeldet ist | Eine unbekannte Adresse gehört zu keinem Bereich. Nur so sehen Angemeldete den Rahmen und alle anderen die öffentliche Variante. | Immer die öffentliche Variante | Ein Server-Abgleich der Sitzung auch auf dieser Seite. | 2026-11-11 |
| Abmelden nur im Profil; der Abmelde-Knopf auf „Heute“ aus PROJ-1 entfällt | Laut Produktentscheidung kein Benutzermenü; eine Stelle reicht und hält „Heute“ ruhig. | Abmelden zusätzlich in der Seitenleiste | Ein Weg mehr bis zum Abmelden. | 2026-11-11 |

## Offene Fragen

- [x] AC-13 bei Browsern ohne gesetzte Vorliebe → PULSE folgt dem Gerät (`next-themes` mit Standard `system`); „dunkel“ gilt nur, wenn der Browser die Abfrage nicht unterstützt. Entschieden bei der Freigabe am 2026-11-11.

## Umsetzungsnotizen (`/build`, 2026-11-11)

- **`--accent` und Hover-Flächen:** `--accent` ist wie im Designsystem das PULSE-Pink. shadcn verwendet `accent` aber auch für dezente Hover- und Fokusflächen. In `button` (Varianten `outline` und `ghost`) und in der Seitenleiste (`--sidebar-accent`) nutzen Hover-Flächen deshalb die Sekundärfarbe. Andere shadcn-Bausteine, die `accent` für Fokus oder Hover nutzen (`dropdown-menu`, `select`, `command`), zeigen dort noch Pink. Das sollte das erste Feature anpassen, das sie verwendet.
- **Neuer Token `--primary-hover`:** Er trägt die Hover-Werte des Designsystems (Dunkel `#A7DB2E`, Hell `#415300`) und wird in `button` verwendet.
- **Seitenleistenbreite:** Die vorhandene shadcn-`sidebar.tsx` nutzt noch die Tailwind-v3-Schreibweise `w-[--sidebar-width]`, die Tailwind v4 nicht auswertet. `desktop-nav.tsx` setzt die Breite deshalb ausdrücklich (`w-64`).
- **Gemeinsame Symbole:** `src/components/shell/nav-icons.tsx` ist eine kleine zusätzliche Datei, die die Symbole beider Navigationen an einer Stelle zuordnet. Die Regeln in `navigation.rules.ts` bleiben dadurch frei von UI-Imports.
- **Fehlerzustand:** `error.tsx` nutzt `retry()` aus Next.js 16. Das lädt den Bereich neu, statt nur den Fehlerzustand zurückzusetzen.
- **Ladezustand:** Das shadcn-`Skeleton` pulsiert standardmäßig. Im Ladezustand ist das abgeschaltet (`animate-none`), damit keine Dauerbewegung entsteht (AC-17).
- **Farbschema-Skript:** `next-themes` setzt sein Skript als erstes Element in den `body`, vor jeden sichtbaren Inhalt. Das blockiert den Aufbau, bis das Schema gesetzt ist (EC-1). Das Skript für „Bewegung reduzieren“ steht im `head`.
- **Tests und `localStorage`:** Node 26 überdeckt das `localStorage` von jsdom mit einem eigenen, unkonfigurierten Speicher. Die Darstellungstests setzen deshalb einen Speicher im Arbeitsspeicher ein.
- **Tastenkürzel:** Der shadcn-`SidebarProvider` belegt Strg/⌘+B zum Einklappen der Leiste. Weil die Leiste nicht einklappbar ist, hat das keine sichtbare Wirkung, blockiert aber im Browser das Kürzel für die Lesezeichen-Leiste.
