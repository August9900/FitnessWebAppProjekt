# Feature-Übersicht

> Zentrale Übersicht aller Features. Die Workflow-Skills halten sie aktuell.

## Statusübersicht

- **Roadmap** – Feature festgelegt, noch keine Spezifikation.
- **Mapped** – bereits vorhandenes Feature, dessen Verhalten noch rekonstruiert werden muss.
- **Spec'd** – bestehendes Verhalten beschrieben, noch nicht durch `/qa` geprüft.
- **Planned** – vollständige Spezifikation durch `/write-spec` erstellt.
- **Architected** – technisches Design durch `/architecture` freigegeben.
- **Tasked** – Aufgabenliste durch `/tasks` freigegeben.
- **In Progress** – Umsetzung durch `/build` läuft oder wartet auf QA.
- **In Review** – Prüfung durch `/qa` läuft.
- **Approved** – QA bestanden, bereit für den Deploy.
- **Deployed** – produktiv veröffentlicht.
- **Merged** – Spezifikation durch `/refine` in ein anderes Feature aufgenommen; der Ordner liegt unter `features/archive/`.

## Features

> Die Spalte **Spec** verweist nach `/write-spec` auf den Feature-Ordner mit `spec.md`, `design.md`, `tasks.md` und `qa-report.md`. Namen und Beschreibungen bleiben kurz; Priorität und Abhängigkeiten stehen ausschließlich in der Baureihenfolge.

| ID | Feature | Beschreibung | Status | Spec | Erstellt |
|----|---------|--------------|--------|------|----------|
| PROJ-1 | Konto & Anmeldung | Nutzende können ein Konto erstellen, sich anmelden und ihre persönlichen Daten geräteübergreifend geschützt nutzen. | Tasked | [Spec](PROJ-1-konto-anmeldung/) | 2026-09-23 |
| PROJ-2 | App-Rahmen & Navigation | Ein gemeinsamer, ruhiger Rahmen verbindet die Bereiche der App auf Desktop und Mobilgeräten. | Roadmap | — | 2026-09-23 |
| PROJ-3 | Kurzprofil & Einstieg | Nutzende erfassen mit wenigen Angaben ihr Ziel und ihre praktischen Trainingsmöglichkeiten. | Roadmap | — | 2026-09-23 |
| PROJ-4 | Kurze Workouts | Ein fachlich geprüftes Angebot enthält kurze, anpassbare Bewegungsoptionen. | Roadmap | — | 2026-09-23 |
| PROJ-5 | Einfache Mahlzeiten | Ein fachlich geprüftes Angebot enthält schnell umsetzbare Essensoptionen. | Roadmap | — | 2026-09-23 |
| PROJ-6 | Tagesentscheidung | Ein kurzer Check-in führt zu einer passenden Aktion und verständlichen Alternativen. | Roadmap | — | 2026-09-23 |
| PROJ-7 | Abschlussfeedback | Nach einer Aktion können Nutzende melden, ob Aufwand und Inhalt gepasst haben. | Roadmap | — | 2026-09-23 |
| PROJ-8 | Wochenblick | Nutzende sehen ihre begonnenen und abgeschlossenen Aktionen ohne Streak-Strafe oder Nachholpflicht. | Roadmap | — | 2026-09-23 |
| PROJ-9 | Übungsbibliothek | Nutzende können Übungen mit ihren Eigenschaften und Einsatzmöglichkeiten nachschlagen. | Roadmap | — | 2026-09-23 |
| PROJ-10 | Eigene Trainingspläne | Nutzende können Trainingspläne selbst zusammenstellen und speichern. | Roadmap | — | 2026-09-23 |
| PROJ-11 | Gewichtsverlauf | Nutzende können Gewichtseinträge und deren Verlauf einsehen. | Roadmap | — | 2026-09-23 |
| PROJ-12 | Nährwertübersicht | Nutzende können berechnete Kalorien- und Makrowerte einsehen. | Roadmap | — | 2026-09-23 |
| PROJ-13 | Rangsystem | Persönliche Bestleistungen können in ein optionales, positiv gestaltetes Rangsystem einfließen. | Roadmap | — | 2026-09-23 |
| PROJ-14 | KI-Trainer | Ein späterer, gesondert geprüfter Coach kann frei formulierte Fragen beantworten. | Roadmap | — | 2026-09-23 |

**Baureihenfolge:** P0 (erste Version): PROJ-1 → PROJ-2 → PROJ-3; PROJ-4 und PROJ-5 nach PROJ-2; PROJ-6 nach PROJ-3, PROJ-4 und PROJ-5 → PROJ-7 → PROJ-8 · P1: PROJ-9 nach PROJ-4 → PROJ-10 · P2: PROJ-11 und PROJ-12 nach PROJ-3; PROJ-13 nach PROJ-8 und erneuter Produktprüfung; PROJ-14 nach PROJ-6 und gesonderter Prüfung.

<!-- Add features above this line -->

## Deployments

> `/deploy` ergänzt pro Veröffentlichung eine Zeile mit Tag, Datum, Produktionsadresse und enthaltenen Features. Vor der ersten Veröffentlichung bleibt dieser Abschnitt leer.

## Next Available ID: PROJ-15
