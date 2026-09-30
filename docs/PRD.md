# Produktanforderungen: PULSE

## Vision

PULSE hilft Menschen ab 12 Jahren mit ADHS, Autismus oder ähnlichen Schwierigkeiten bei Planung und Entscheidungen, auch an unruhigen Tagen eine machbare Bewegung oder Mahlzeit zu finden. Statt einen perfekten Wochenplan einzuhalten, können sie schnell den nächsten passenden Schritt beginnen. Eine Diagnose ist weder Voraussetzung noch Teil der Abfrage.

## Zielgruppe

Menschen ab 12 Jahren in Deutschland und der EU, die ihre Fitness und Ernährung verbessern möchten, aber an Planung, Entscheidungsaufwand, schwankender Energie oder Unterbrechungen scheitern. Die Bedienung orientiert sich an der aktuellen Situation der Person und setzt keine lückenlose Datenerfassung voraus. Die Bedürfnisse von Menschen mit ADHS und Autismus werden in der Produktvalidierung getrennt geprüft und nicht aus einer Diagnose abgeleitet.

## Kern der ersten Version

Ein kurzes Onboarding und ein Tages-Check-in zu Zeit, Energie, Ort und Einschränkungen führen zu einer konkreten Aktion mit Alternativen. Kurze Workouts und einfache Mahlzeitenideen stammen aus einem fachlich geprüften Angebot; eine knappe Rückmeldung verbessert die nächste Empfehlung. Pausen erzeugen keine Streak-Strafe oder Nachholpflicht. Die priorisierten Features und ihre Abhängigkeiten stehen ausschließlich in `features/INDEX.md`.

## Erfolgsmessung

- Zeit vom Öffnen bis zum Start einer Aktion: Zielwert unter 30 Sekunden.
- Anteil der vorgeschlagenen Aktionen, die begonnen und abgeschlossen werden.
- Anteil der Vorschläge, die ohne Austausch passen.
- Rückkehr nach einer Unterbrechung und Nutzung nach vier Wochen.
- Von Nutzenden berichtete Überforderung vor und nach der Nutzung.

## Rahmenbedingungen

- `docs/product/` enthält den bisherigen PULSE-Prototyp und dient als funktionale und visuelle Grundlage. Die Next.js-App im Projekt ist noch das Grundgerüst; vorhandene Funktionen werden entsprechend der Feature-Priorität übernommen.
- Nutzerkonten und geräteübergreifende Speicherung werden mit Supabase umgesetzt.
- Environment strategy: local — Entwicklung und Tests laufen mit lokalem Supabase; eine Produktionsumgebung wird erst beim Deploy angebunden.
- Data region: eu-central-1 (Frankfurt) für die spätere gehostete Produktionsumgebung.
- Data protection law: DSGVO (EU/DE).
- Data protection stance: strict. Körper- und Trainingsdaten sowie die Nutzung durch Minderjährige werden bei der Spezifikation besonders berücksichtigt. Die ausführliche Prüfung mit `/dsgvo` erfolgt vor dem ersten Deploy; lokale Entwicklung und Tests mit Testdaten können vorher stattfinden.
- Sport- und Ernährungsfachleute prüfen die betreffenden Inhalte vor einer öffentlichen Veröffentlichung.
- Die PULSE-Marke bleibt erhalten. Die tägliche Oberfläche wird ruhiger, Bewegungseffekte sind reduzierbar. Das konkrete Designsystem steht in `docs/design-system.md`.
- Es gibt keinen festen Veröffentlichungstermin oder bestätigtes Wochenbudget. Die erste Version bleibt auf den kurzen Kernablauf begrenzt.

## Nichtziele der ersten Version

- Vollständiges Gewichts-, Kalorien- oder Makrotracking.
- Frei antwortender KI-Coach oder frei generierte Trainingspläne; Empfehlungen folgen nachvollziehbaren Regeln und geprüften Inhalten.
- Soziale Community, Wearables, Körperfotos und medizinische Personalisierung.
- Die unveränderte Übernahme sämtlicher Ansichten des bisherigen Prototyps.
