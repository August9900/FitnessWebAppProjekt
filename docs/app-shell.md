# App-Rahmen und Navigation

> Gemeinsame Struktur aller Bereiche. Farben, Schriften und Komponentenstile stehen in `docs/design-system.md`; Einzelheiten einer Ansicht gehören in das jeweilige Feature-Design.

## Verantwortliches Feature

**PROJ-2 – App-Rahmen & Navigation.** Änderungen am gemeinsamen Rahmen laufen nach der Spezifikation über `/refine PROJ-2`.

## Hauptbereiche der ersten Version

| Bereich | Aufgabe | Sichtbar für | Inhaltlich verantwortliches Feature |
|---------|---------|--------------|------------------------------------|
| Heute | Tages-Check-in, passender Vorschlag und nächste Aktion. | Angemeldete Nutzende | PROJ-6 |
| Bewegung | Kurze, geprüfte Workouts ansehen. | Angemeldete Nutzende | PROJ-4 |
| Essen | Einfache, geprüfte Mahlzeitenoptionen ansehen. | Angemeldete Nutzende | PROJ-5 |
| Wochenblick | Begonnene und abgeschlossene Aktionen ohne Streak-Strafe überblicken. | Angemeldete Nutzende | PROJ-8 |
| Profil | Eigene Angaben und Kontoeinstellungen ansehen und anpassen. | Angemeldete Nutzende | PROJ-3 für Angaben; PROJ-1 für das Konto |

Nach der Anmeldung öffnet sich **Heute**. PROJ-7 ergänzt die Rückmeldung nach einer Aktion im Tagesablauf, ohne einen weiteren Hauptbereich zu erzeugen. Spätere Features erhalten erst bei ihrer Architekturentscheidung einen Platz in der Navigation.

## Layoutbereiche

- **Desktop-Navigation (ab 1024 px Breite):** PULSE-Marke und die fünf Hauptbereiche in einer gemeinsamen, nicht einklappbaren Seitenleiste; der aktuelle Bereich ist erkennbar, nicht nur durch Farbe.
- **Mobilnavigation (unter 1024 px Breite):** Dieselben fünf Bereiche in einer fixierten unteren Navigation mit Symbol und sichtbarer Beschriftung; der aktuelle Bereich ist erkennbar.
- **Kopfbereich:** Titel des aktuellen Bereichs und, falls erforderlich, genau eine wichtigste Aktion.
- **Inhalt:** Der aktuelle Schritt oder die aktuelle Aufgabe steht im Vordergrund; ergänzende Informationen bleiben nachgeordnet. Ein Link „Zum Inhalt springen“ ist das erste fokussierbare Element.

## Wiederkehrendes Seitenmuster

- Jede Ansicht beginnt mit einem verständlichen Titel und einer kurzen Orientierung, wenn sie nötig ist.
- Ladezustände reservieren den Platz des erwarteten Inhalts und lenken nicht mit dauernder Bewegung ab.
- Leere Zustände benennen den nächsten möglichen Schritt, etwa den ersten Check-in.
- Fehler benennen das Problem und eine konkrete Möglichkeit zum erneuten Versuch.
- Bestätigungen erscheinen nahe der ausgelösten Aktion und verwenden dieselben Begriffe wie die zugehörigen Bedienelemente.
- Bereiche ohne Inhalt zeigen einen ruhigen Platzhalter mit einem Weg zu „Heute“, bis ihr Feature sie füllt.
- Eine unbekannte Adresse zeigt „Seite nicht gefunden“: angemeldet im Rahmen, sonst ohne Navigation.

## Anmeldestatus

- **Ohne Anmeldung:** Nur Einstieg und Konto-Zugang sind erreichbar; sie zeigen die PULSE-Marke, aber keine App-Navigation. Persönliche Bereiche und Daten bleiben geschützt.
- **Angemeldet, Angaben unvollständig:** Heute, Bewegung, Essen und Wochenblick führen zum Einstieg (`/einstieg`, PROJ-3). Der Einstieg ist eine schlichte Seite ohne App-Navigation mit PULSE-Marke, „Konto verwalten“ und „Abmelden“. Das Profil bleibt erreichbar.
- **Angemeldet, Angaben vollständig:** Die fünf Hauptbereiche sind erreichbar; Einstiegspunkt ist „Heute“.
- **Weitere Rollen:** Für die erste Version sind keine zusätzlichen Nutzendenrollen festgelegt. Berechtigungen für die Pflege geprüfter Inhalte werden in den betreffenden Feature-Designs entschieden.

## Gemeinsame Bausteine

Festgelegt durch `/architecture PROJ-2`. Features verwenden diese Bausteine und bauen keine eigenen nach:

| Baustein | Ort | Verwendung |
|----------|-----|------------|
| App-Rahmen (Sprunglink, Seitenleiste, untere Navigation, Inhaltsbereich) | `src/components/shell/app-shell.tsx` | Liegt im geschützten Layout `src/app/(protected)/layout.tsx`; Features fügen nur Seiten darunter hinzu. |
| Navigationseinträge | `src/components/shell/navigation.rules.ts` | Einzige Liste der Hauptbereiche; ein neuer Eintrag ist eine Änderung an PROJ-2. |
| Kopfbereich | `src/components/shell/page-header.tsx` | Jede geschützte Seite beginnt damit: Titel und optional genau eine Hauptaktion. |
| Platzhalter für leere Bereiche | `src/components/shell/area-placeholder.tsx` | Für Bereiche, deren Feature noch fehlt. |
| PULSE-Marke | `src/components/shell/brand-mark.tsx` | Seitenleiste, öffentliche Seiten, „Seite nicht gefunden“. |
| Gate für Hauptbereiche | `src/app/(protected)/(bereiche)/layout.tsx` (PROJ-3) | Seiten von Heute, Bewegung, Essen und Wochenblick liegen in dieser Gruppe und öffnen sich erst mit vollständigen Angaben; das Profil liegt außerhalb. |
| Lade- und Fehlerzustand | `src/app/(protected)/loading.tsx`, `error.tsx` | Gelten automatisch für alle geschützten Seiten; Features können eigene, feinere Zustände ergänzen. |

## Darstellung

- Das Farbschema folgt der Geräteeinstellung; im Profil lässt sich unter „Darstellung“ System, Hell oder Dunkel wählen.
- Reduzierte Bewegung gilt, wenn das Gerät sie meldet oder die Person sie im Profil einschaltet. Sie wirkt app-weit über eine zentrale Regel, Features müssen dafür nichts tun.
- Beide Einstellungen liegen nur auf dem jeweiligen Gerät.
