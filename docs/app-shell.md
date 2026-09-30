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

- **Desktop-Navigation:** PULSE-Marke und die fünf Hauptbereiche in einer gemeinsamen Seitenleiste; der aktuelle Bereich ist erkennbar.
- **Mobilnavigation:** Dieselben fünf Bereiche in einer knappen unteren Navigation mit zugänglichen Namen; der aktuelle Bereich ist erkennbar.
- **Kopfbereich:** Titel des aktuellen Bereichs und, falls erforderlich, genau eine wichtigste Aktion.
- **Inhalt:** Der aktuelle Schritt oder die aktuelle Aufgabe steht im Vordergrund; ergänzende Informationen bleiben nachgeordnet.

## Wiederkehrendes Seitenmuster

- Jede Ansicht beginnt mit einem verständlichen Titel und einer kurzen Orientierung, wenn sie nötig ist.
- Ladezustände reservieren den Platz des erwarteten Inhalts und lenken nicht mit dauernder Bewegung ab.
- Leere Zustände benennen den nächsten möglichen Schritt, etwa den ersten Check-in.
- Fehler benennen das Problem und eine konkrete Möglichkeit zum erneuten Versuch.
- Bestätigungen erscheinen nahe der ausgelösten Aktion und verwenden dieselben Begriffe wie die zugehörigen Bedienelemente.

## Anmeldestatus

- **Ohne Anmeldung:** Nur Einstieg und Konto-Zugang sind erreichbar; persönliche Bereiche und Daten bleiben geschützt.
- **Angemeldet:** Die fünf Hauptbereiche sind erreichbar; Einstiegspunkt ist „Heute“.
- **Weitere Rollen:** Für die erste Version sind keine zusätzlichen Nutzendenrollen festgelegt. Berechtigungen für die Pflege geprüfter Inhalte werden in den betreffenden Feature-Designs entschieden.

## Gemeinsame Bausteine

Seitenleiste, Mobilnavigation, Kopfbereich sowie Lade-, Leer- und Fehlerzustände werden als gemeinsame Bausteine von PROJ-2 geplant. Konkrete Komponenten und Dateipfade legt `/architecture PROJ-2` fest.
