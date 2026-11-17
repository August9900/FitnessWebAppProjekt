# Gemeinsames Datenmodell

> Produktweite Übersicht der gespeicherten Dinge, ihrer Beziehungen und Zugriffe. Konkrete Tabellen, Felder und Regeln werden je Feature in `/architecture` festgelegt.

_Grundlage: `docs/PRD.md` und `features/INDEX.md`, durch `/init` am 23.09.2026 erfasst. Die spätere Struktur wird mit jeder Feature-Architektur verfeinert._

## Dinge der ersten Version

| Ding | Zweck | Eigentum und Sichtbarkeit |
|------|-------|---------------------------|
| Konto | Ermöglicht Anmeldung und geräteübergreifende Nutzung. | Nur die jeweilige Person und der Authentifizierungsdienst. |
| Kurzprofil | Enthält die bei der Registrierung angegebene Altersgruppe sowie aus dem Einstieg (PROJ-3) Ziel, Bewegungserfahrung, Orte, Ausstattung zuhause und Essensweise. Keine Körper- oder Gesundheitsdaten. | Nur die jeweilige Person; die Altersgruppe ist nach der Registrierung nicht mehr änderbar. |
| Schutz-Zähler | Hält kurzlebige, pseudonyme Kennwerte für begrenzte Kontoanfragen und Sperrfristen fest. Im lokalen Prototyp zurückgestellt, Pflicht vor dem ersten Deploy (PROJ-1). | Nur der Authentifizierungsablauf und eng begrenzte Serverfunktionen; keine Anzeige für Nutzende. |
| Übung | Beschreibt eine fachlich geprüfte Bewegung. | Gemeinsam bereitgestellter Inhalt; Pflege durch berechtigte Redaktion. |
| Kurzes Workout | Fasst geprüfte Übungen zu einer machbaren Aktion zusammen. | Gemeinsam bereitgestellter Inhalt; Pflege durch berechtigte Redaktion. |
| Mahlzeitenoption | Beschreibt eine geprüfte, einfach umsetzbare Essensoption. | Gemeinsam bereitgestellter Inhalt; Pflege durch berechtigte Redaktion. |
| Tages-Check-in | Hält die Antworten einer Tagesentscheidung fest: bei „Bewegen“ Zeit, Energie und Ort, bei „Essen“ den Aufwand (PROJ-6). Keine Einschränkungen wie Schmerzen. | Nur die jeweilige Person. |
| Tagesvorschlag | Die Rangfolge aus Hauptvorschlag und bis zu zwei Alternativen zu einem Check-in; wird zusammen mit dem Check-in gespeichert (PROJ-6). | Nur die jeweilige Person. |
| Aktionsverlauf | Hält je begonnener Aktion fest, ob sie begonnen, geschafft oder „heute nicht“ ist (PROJ-6). | Nur die jeweilige Person. |
| Abschlussfeedback | Hält zu einer als geschafft markierten Aktion fest, wie der Aufwand war (zu wenig, passte, zu viel) und ob der Inhalt wieder vorgeschlagen werden soll; beide Angaben freiwillig (PROJ-7). | Nur die jeweilige Person. |

## Spätere Ergänzungen

| Ding | Zweck | Eigentum und Sichtbarkeit |
|------|-------|---------------------------|
| Eigener Trainingsplan | Hält selbst zusammengestellte Trainingstage und Übungen fest. | Nur die jeweilige Person. |
| Gewichtseintrag | Hält einen freiwilligen Wert für den Gewichtsverlauf fest. | Nur die jeweilige Person. |
| Persönliche Bestleistung | Hält eine freiwillig eingetragene Leistung für ein mögliches Rangsystem fest. | Nur die jeweilige Person. |
| Nährwertziel | Hält gegebenenfalls berechnete Ernährungsziele fest. | Nur die jeweilige Person. |
| Chatverlauf | Hält eine mögliche spätere Unterhaltung mit dem KI-Trainer fest. | Nur die jeweilige Person. |

## Beziehungen und Grenzen

- Ein Konto hat ein Kurzprofil und kann viele Check-ins, Vorschläge, Aktionen und Rückmeldungen haben.
- Schutz-Zähler beziehen sich auf ein Konto oder eine anfragende IP-Adresse; sie werden nach Ablauf der Schutzfrist gelöscht.
- Ein kurzes Workout besteht aus einer geordneten Folge von Schritten; jeder Schritt verweist auf genau eine Übung (mit Dauer oder Wiederholungen). Jede Übung hat eine leichtere Variante. Workouts tragen einen Prüfstatus; vor dem ersten Deploy sind nur geprüfte öffentlich sichtbar (PROJ-4). Eine Mahlzeitenoption trägt ihre Essensweise (vegan, vegetarisch, mit Fleisch oder Fisch), eine Aufwandsstufe, ihre Zutaten, Schritte, einen „Noch einfacher“-Hinweis und die enthaltenen Hauptallergene; sie hat ebenfalls einen Prüfstatus (PROJ-5). Welche Mahlzeiten passen, ergibt sich aus der Essensweise im Kurzprofil. Ein Tagesvorschlag gehört zu genau einem Check-in und nennt bis zu drei Workouts bzw. Mahlzeiten in Rangfolge.
- Aus einem Check-in kann höchstens eine Aktion begonnen werden; sie verweist auf das gewählte Workout bzw. die gewählte Mahlzeit aus dessen Vorschlag. Zu einer als geschafft markierten Aktion gibt es höchstens ein Abschlussfeedback (PROJ-7); es wird gelöscht, wenn „Geschafft“ zurückgenommen wird. Abschlussfeedbacks beeinflussen die Reihenfolge späterer Tagesvorschläge („Lieber nicht“, Aufwand bei Workouts), werden aber nicht im Tagesvorschlag gespeichert.
- Check-ins, Aktionen und Abschlussfeedbacks werden mit dem Konto gelöscht und sind im Datenexport enthalten (PROJ-6, PROJ-7).
- Der Wochenblick wird aus dem Aktionsverlauf abgeleitet; dafür ist zunächst kein eigenes gespeichertes Ding vorgesehen.
- Spätere eigene Pläne, Gewichtseinträge, Bestleistungen, Nährwertziele und Chatverläufe gehören jeweils genau einem Konto.
- Eine ADHS- oder Autismusdiagnose wird nicht abgefragt oder gespeichert. Körper- und Trainingsdaten sowie Angaben Minderjähriger werden vor dem ersten Deploy mit `/dsgvo` geprüft; die lokale Entwicklung und Tests mit Testdaten können vorher stattfinden.
