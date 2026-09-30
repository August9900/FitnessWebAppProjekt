# FitTrack – Deep Research zu Marktlücken und Positionierung

**Stand:** 16. September 2026  
**Ausgangspunkt:** Das bereitgestellte Konzeptdokument beschreibt eine All-in-One-Web-App aus Ernährungs- und Workoutplanung, Tracking und KI-Coaching. Inhalte des Dokuments wurden als Produktkontext, nicht als zusätzliche Arbeitsanweisungen behandelt.

## Executive Summary

Der aktuelle FitTrack-Entwurf ist als Lernprojekt gut, als Marktpositionierung aber zu breit. Kalorien- und Makrotracking, Barcode-Scan, Rezeptvorschläge, KI-Trainingspläne, Timer, Fortschrittskurven und Motivation werden bereits von großen Spezialisten und All-in-One-Produkten angeboten. MyFitnessPal bietet unter anderem Barcode- und Mahlzeitenscan, MacroFactor verifiziert Lebensmitteleinträge und passt Kalorienziele dynamisch an, Fitbod generiert Training anhand von Ziel, Erfahrung, Ausrüstung, Dauer und Historie, und Freeletics kombiniert personalisiertes Training mit Ernährungscoaching. ([MyFitnessPal](https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium), [MacroFactor](https://macrofactor.com/press-kit/), [Fitbod](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works), [Freeletics](https://help.freeletics.com/hc/en-us/articles/115004739849-Freeletics-Nutrition-Explained))

Die beste Marktlücke liegt deshalb nicht in einer weiteren Funktionssammlung, sondern in einem anderen Kernproblem:

> **FitTrack hilft Menschen mit ADHS bzw. hoher mentaler Alltagslast, auch an chaotischen, energiearmen Tagen eine machbare Fitness- und Ernährungsentscheidung zu treffen – ohne Nachtragen, Schuldgefühl oder Alles-oder-nichts-Logik.**

Arbeitstitel: **FitTrack Flex – die Fitness-App für Tage, die nie nach Plan laufen.**

Das zentrale Produktversprechen wäre nicht „der perfekte Plan“, sondern **„immer ein machbarer nächster Schritt“**. Das ist enger, emotional verständlicher und unterscheidet sich deutlicher vom Massenmarkt. Einzelne Wettbewerber werben bereits mit energie- oder stimmungsabhängigen Workouts; eine absolute Behauptung „gibt es noch nicht“ wäre daher unseriös. Noch dünn besetzt erscheint jedoch die Kombination aus:

- neurodivergenzfreundlicher Bedienung,
- tagesaktueller Anpassung von Training **und** Ernährung,
- extrem geringer Eingabelast,
- fehlertoleranter Motivation ohne Streak-Strafe,
- transparenten, regelbasierten Sicherheitsgrenzen statt frei halluzinierender KI.

## 1. Vorgehen und Aussagegrenzen

Die Recherche kombiniert:

- wiederkehrende Beschwerden in Nutzerforen und produktspezifischen Communities,
- aktuelle Produkt- und Hilfeseiten etablierter und neuer Wettbewerber,
- systematische Reviews zu App-Abbruch, Personalisierung, älteren Menschen und KI-Trainingsplänen,
- offizielle Statistiken und Gesundheitsquellen.

Forenbeiträge liefern starke Hinweise auf Probleme und Sprache der Nutzer, sind aber nicht repräsentativ. Produktseiten belegen vorhandene Funktionen, nicht deren tatsächliche Qualität. „Nicht am Markt“ lässt sich bei einer globalen, schnelllebigen App-Landschaft kaum beweisen; im Folgenden ist daher von **unterversorgt**, **schwach gelöst** oder **noch nicht überzeugend gebündelt** die Rede.

## 2. Häufige Beschwerden, Wünsche und Frustrationen

### 2.1 Ernährungs-Apps: Genauigkeit gegen Bequemlichkeit

Wiederkehrende Beschwerden sind doppelte oder falsche Lebensmitteleinträge, schlechte Suche, fehlende regionale Produkte, Werbung, Bezahlschranken für Basisfunktionen und hoher manueller Aufwand. In einem aktuellen MyFitnessPal-Thread wird etwa von vielen unterschiedlichen und teils falschen Einträgen desselben Produkts berichtet; Cronometer-Nutzer kritisieren dagegen, viele lokale Produkte selbst anlegen zu müssen und die umständliche Suche. ([MyFitnessPal-Nutzerfeedback](https://www.reddit.com/r/Myfitnesspal/comments/1rtphg8/just_cant_trust_the_app_any_more/), [Cronometer-Nutzerfeedback](https://www.reddit.com/r/cronometer/comments/1s4yp5o/feedback_after_one_week_of_usage/))

Das ist nicht nur subjektiv: Eine Vergleichsstudie fand bei mehreren populären Apps signifikante Abweichungen gegenüber einer professionellen Referenzdatenbank. ([Studie zur Nährwertgenauigkeit](https://pmc.ncbi.nlm.nih.gov/articles/PMC8181233/))

Für FitTrack besonders wichtig: Open Food Facts ist nützlich und offen, erklärt in seiner eigenen API-Dokumentation aber ausdrücklich, dass Genauigkeit, Vollständigkeit und Verlässlichkeit nicht garantiert werden. ([Open Food Facts API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)) Ein ungeprüftes „echte Nährwertdaten“-Versprechen wäre damit zu stark.

**Ungedeckter Bedarf:** Ein Logger, der schnell und ehrlich mit Unsicherheit umgeht – etwa mit Quellenanzeige, Vertrauenswert, bevorzugten verifizierten Einträgen und einer bewussten Option „grob reicht heute“.

### 2.2 Workout-Apps: Personalisierung wird versprochen, aber nicht immer vertraut

Fitbod verspricht offiziell Anpassung an Trainingsziel, Erfahrung, Ausrüstung, Dauer, Trainingshistorie und Regeneration. ([Fitbod-Funktionsweise](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works)) Nutzer berichten zugleich von unplausiblen Gewichten, ignorierter Ausrüstung, falscher Übungsreihenfolge, fehlender Progression und Plänen, die Zeitvorgaben nicht respektieren. Besonders aussagekräftig ist der Vertrauensverlust: Wenn Nutzer jede Empfehlung kontrollieren müssen, entfällt der Nutzen der Automatisierung. ([Langzeit-Review](https://www.reddit.com/r/fitbod/comments/1joklkd/review_of_fitbod_after_one_year_of_use/), [Fehler nach Update](https://www.reddit.com/r/fitbod/comments/1kw51hk))

**Ungedeckter Bedarf:** Nicht bloß eine Empfehlung, sondern eine erklärbare Empfehlung: „Warum diese Übung? Welche Einschränkungen wurden berücksichtigt? Was bleibt gleich, wenn ich sie ersetze?“

### 2.3 Zu viel Bedienung, zu viel Perfektion

In ADHS-Communities werden Essensplanung, Einkauf, Kochen, Training und Protokollieren als zusammenhängende Belastung beschrieben. Ein viel beachteter Beitrag beschreibt, wie nach einem anspruchsvollen Arbeitstag keine Exekutivfunktion mehr für Kalorien, Grammangaben, Einkauf und Vorbereitung übrig ist. ([ADHSWomen-Thread](https://www.reddit.com/r/adhdwomen/comments/1j5dvkg)) Andere Nutzer vergessen das Tracking nach wenigen Tagen oder brechen nach einer ausgelassenen Eingabe ganz ab. ([ADHS-Tracking-Erfahrungen](https://www.reddit.com/r/ADHD/comments/1r2uczu/people_who_actually_manage_to_track_their_health/))

Das Problem ist wirtschaftlich relevant: Eine aktuelle Scoping Review verweist auf Branchenwerte, nach denen rund 69 % der Fitness- und Ernährungs-Apps innerhalb von 90 Tagen und 81 % innerhalb eines Jahres aufgegeben werden. Technische Probleme, veränderte Bedürfnisse und mangelnde anhaltende Motivation spielen dabei eine Rolle. ([Review zu App-Abbruch](https://pmc.ncbi.nlm.nih.gov/articles/PMC11694054/))

**Ungedeckter Bedarf:** Ein Produkt, das nicht vollständige Datenerfassung voraussetzt, nach Pausen keine Rückstände erzeugt und den Wiedereinstieg als Hauptfunktion behandelt.

### 2.4 Streaks motivieren einige und beschämen andere

Streaks funktionieren nicht für alle gleich. In einem Lose-It!-Thread berichtet eine erfolgreiche Nutzerin, dass ein über 100 Tage langer Streak zusätzlichen Stress erzeugte und sie eine Monatsansicht ohne ununterbrochene Serie als entlastender empfand. Andere Nutzer mögen gerade den Streak. ([Lose It!-Diskussion](https://www.reddit.com/r/LoseitApp/comments/1qcas2a/how_does_everyone_feel_about_the_streak_feature/))

Auch Fachleute warnen, dass Kalorienziele, Farbcodierungen, Belohnungen und Mahnungen bei gefährdeten Personen problematisches Essverhalten verstärken können. ([AP-Überblick](https://apnews.com/article/d6f91ade776e75bc83f18fb2fa67daac))

**Produktfolgerung:** Gamification optional und positiv kumulativ gestalten: Wochenpunkte, Rückkehrquote und „Minimum geschafft“ statt täglich abbrechender Kette, roten Defiziten und Strafmeldungen.

### 2.5 Integrationen und Dateneigentum

Nutzer wechseln zwischen Ernährungstracker, Workout-App, Wearable und Notizen. Dabei entstehen doppelte Einträge, Synchronisationsprobleme und eingeschlossene Daten. Das verstärkt das Gefühl, für dieselbe Aufgabe mehrere Abos und Apps zu benötigen.

**Ungedeckter Bedarf:** Nicht notwendigerweise alles selbst nachbauen, sondern Daten sauber zusammenführen, exportierbar halten und klar erklären, welche Quelle Vorrang hat.

## 3. Unterversorgte Zielgruppen – Bewertung

| Zielgruppe | Schmerzintensität | Wettbewerb | Umsetzungsrisiko | Eignung für FitTrack |
|---|---:|---:|---:|---:|
| Erwachsene mit ADHS/Exekutivfunktionsproblemen | sehr hoch | mittel, aber fragmentiert | mittel | **sehr hoch** |
| Schichtarbeitende | hoch | niedrig bis zunehmend | mittel | **hoch** |
| Menschen mit stark schwankender Energie, chronischen Schmerzen oder Fatigue | sehr hoch | niedrig bis mittel | hoch, gesundheitlich sensibel | hoch, später |
| Rollstuhlnutzende / Menschen mit konkreten Mobilitätseinschränkungen | sehr hoch | mehrere Nischenanbieter | hoch, sehr heterogen | nur mit Co-Design |
| Ältere Erwachsene 60+ | hoch | mittel | hoch, Usability und Sicherheit | mittel |
| Spezifische Ernährungsformen | mittel | hoch | mittel | niedrig als Hauptpositionierung |

### 3.1 ADHS und hohe mentale Alltagslast

Das Kernproblem ist nicht fehlendes Wissen, sondern Initiierung, Planung, Zeitempfinden, Erinnerung und der Umgang mit Unterbrechungen. Ein klassischer Wochenplan verlangt genau jene Fähigkeiten, die im Alltag schwanken. Die Chance liegt daher in **situativer Vereinfachung**:

- Tagesform statt starrer Wochenpflicht,
- eine nächste Handlung statt Dashboard voller Kennzahlen,
- Essen aus vorhandenen Zutaten statt idealisiertem Meal Prep,
- „2, 8 oder 25 Minuten“ statt „Training geschafft/nicht geschafft“,
- Wiederaufnahme ohne Daten-Nachtrag.

Es existieren bereits allgemeine neurodivergente Planer wie Tiimo sowie erste Fitnessideen und neue energieadaptive Workout-Apps. ([Tiimo](https://www.tiimoapp.com/), [MOOD](https://officialmood.app/), [Aura](https://useaura.it/features/workout-planner)) Die Positionierung muss daher enger sein als „ADHS-freundlich“: **Fitness und Essen in einen einzigen, extrem kurzen Entscheidungsfluss übersetzen.**

### 3.2 Schichtarbeitende

Viele Apps gehen implizit von Frühstück–Mittag–Abend, regelmäßiger Schlafenszeit und wiederkehrenden Wochentagen aus. In der EU arbeiten laut Europäischer Kommission/Eurostat rund 18 % der Beschäftigten in Schichten; 4,6 % arbeiten gewöhnlich nachts. ([EU-Beschäftigungsbericht](https://ec.europa.eu/employment_social/employment_analysis/esde/2025/Chapter%201.html)) Erste kleine Produkte zielen bereits auf Mahlzeitenplanung nach Rotationsmustern, was Bedarf und beginnende Konkurrenz zugleich bestätigt. ([Nutzer-/Builder-Thread](https://www.reddit.com/r/alphaandbetausers/comments/1r0d0g6/beta_testers_wanted_for_a_shiftworker_meal/))

Eine gute Spezialisierung wäre: Dienstplan importieren, Essensfenster relativ zu Aufstehen/Schlaf statt Uhrzeit, Batch-Cooking vor Schichtblöcken, koffein- und schlaffreundliche Hinweise sowie kurze Workouts nach Belastungsart. Wegen Gesundheitsrisiken sollten circadiane oder medizinische Empfehlungen fachlich geprüft werden.

### 3.3 Behinderung und adaptive Fitness

Der Bedarf ist groß: Die WHO schätzt, dass 1,3 Milliarden Menschen bzw. 16 % der Weltbevölkerung eine erhebliche Behinderung haben; Barrieren und geringere körperliche Aktivität sind verbreitet. ([WHO](https://www.who.int/news-room/fact-sheets/detail/disability-and-health)) Nutzer von Apple Fitness+ kritisieren zum Beispiel, nicht vorab erkennen zu können, ob Übungen mit ihrer Funktionseinschränkung machbar sind. ([Nutzerfeedback](https://www.reddit.com/r/AppleFitnessPlus/comments/1pphb8s/fitness_for_everyone_did_they_add_workouts_for/))

Allerdings ist „Menschen mit Behinderung“ keine ausreichend konkrete Zielgruppe. Wheel With Me Adapt Fit, AdaptiveFit, Accessercise und weitere Anbieter existieren bereits. ([Wheel With Me](https://apps.apple.com/us/app/wheel-with-me-adapt-fit/id1609250295), [AdaptiveFit](https://apps.apple.com/us/app/adaptivefit/id6505124309), [Accessercise](https://accessercise.com/)) Eine seriöse Lösung müsste nach Funktion statt Diagnose modellieren: Greiffähigkeit, Rumpfstabilität, Transfermöglichkeit, Schmerz, Spastik, Gleichgewicht und verfügbare Assistenz. Dafür sind Betroffene sowie Physio-/Sportfachleute als Co-Designer erforderlich.

### 3.4 Ältere Erwachsene

Beschwerden betreffen zu schnelles Tempo, junge Trainerbilder und komplizierte Navigation. ([Apple-Fitness+-Feedback](https://www.reddit.com/r/AppleFitnessPlus/comments/1lb2n44/not_very_good_for_seniors/)) Forschung nennt seniorengerechtes Design, Einbettung in Routinen, soziale Unterstützung, Familienbeteiligung, klare Anleitung, Feedback und adaptive Progression als relevant. ([Qualitative Meta-Synthese](https://www.sciencedirect.com/science/article/pii/S0197457224002672)) Neuere Reviews sehen eher kurzfristige Aktivitätssteigerungen, aber wenig gesicherte Nachhaltigkeit. ([Systematic Review](https://pubmed.ncbi.nlm.nih.gov/41919924/))

Das Segment ist sinnvoll, aber für ein kleines Projekt sicherheits- und contentintensiver als die ADHS-Positionierung.

## 4. Marktlücken bei KI und neue Interaktionsformen

### 4.1 Die KI-Lücke ist Vertrauen, nicht Textgenerierung

Generative KI kann schnell Varianten erzeugen, kennt aber Bewegungsausführung, Schmerzen, Technik und Biomechanik nicht zuverlässig. Eine Untersuchung von ChatGPT-Trainingsplänen fand nur 41 % Vollständigkeit über zentrale Komponenten der Trainingsverschreibung hinweg. ([Zusammenfassung der Studie](https://time.com/6958557/chatgpt-workout-plan/)) Ein aktueller systematischer Review betont Chancen, aber auch Sicherheits-, Qualitäts- und Evaluationslücken bei LLM-basierten Trainingsempfehlungen. ([Systematic Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC13343266/))

**Empfehlung:** Das LLM darf erklären, umformulieren und aus einem geprüften Übungskatalog wählen. Trainingslast, Progression, Kontraindikationen und Austauschregeln sollten durch deterministische Regeln begrenzt werden. Jede Empfehlung zeigt:

- berücksichtigte Eingaben,
- Begründung,
- Unsicherheit,
- sichere Alternativen,
- Abbruchsignale und gegebenenfalls Verweis an Fachpersonal.

### 4.2 „One-question UI“ statt Chatfenster

Ein freies Chatfenster verlagert Arbeit auf den Nutzer: Wer den perfekten Prompt formulieren kann, braucht oft weniger Hilfe. Besser ist ein kurzer situativer Einstieg:

1. **Wie viel Kapazität hast du?** niedrig / mittel / hoch
2. **Wie viel Zeit wirklich?** 2 / 8 / 20+ Minuten
3. **Gibt es heute Einschränkungen?** Schmerz, müde, unterwegs, keine Küche, keine Geräte
4. FitTrack liefert **eine** Empfehlung und zwei Ausweichmöglichkeiten.

### 4.3 Multimodale, fehlertolerante Eingabe

- Sprache: „Zwei Brötchen mit Käse und ein Kaffee“ wird strukturiert; nur die wichtigste Unklarheit wird nachgefragt.
- Foto/Barcode: Ergebnis mit Konfidenz statt falscher Scheingenauigkeit.
- Widget/Lockscreen: Training starten oder Mahlzeit wiederholen, ohne App-Navigation.
- „Wie gestern“ und Favoriten: wiederkehrende Mahlzeiten mit einem Tippen.
- Teilprotokoll: Die App erkennt ausdrücklich „unvollständig“ und rechnet nicht so, als seien fehlende Daten null.

### 4.4 Just-in-Time statt täglicher Standardbenachrichtigung

Personalisierung und Anpassbarkeit sind in Reviews positiv mit App-Adhärenz verbunden. ([JMIR-Review](https://www.jmir.org/2022/5/e35371)) Just-in-Time Adaptive Interventions passen Inhalt und Zeitpunkt an den Kontext an; das Feld ist vielversprechend, aber methodisch noch jung. ([JITAI-Review](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2026.1934024/full))

Für FitTrack bedeutet das: nicht jeden Tag um 18 Uhr mahnen, sondern etwa nach einem langen Meetingblock eine 3-Minuten-Bewegung anbieten, vor einer Nachtschicht einen vorbereiteten Snack erinnern oder nach mehreren stillen Tagen nur einen druckfreien Wiedereinstieg zeigen. Nutzer müssen Häufigkeit, Ruhezeiten und Datennutzung kontrollieren.

### 4.5 Anti-Streak: Rückkehr als Erfolgsmetrik

Neue Metriken können die Produktidee sichtbar machen:

- **Return Rate:** Wie oft kehrt der Nutzer nach einer Unterbrechung innerhalb von 48 Stunden zurück?
- **Flexible Consistency:** erfüllte Bewegungsminuten pro Woche, unabhängig von der Verteilung.
- **Minimum Wins:** Anzahl bewusst kleiner Einheiten.
- **Plan-Fit:** Anteil der Vorschläge, die ohne manuelle Korrektur passten.

## 5. Empfohlene Positionierung für FitTrack

### Positionierung A – klare Empfehlung

**FitTrack Flex: Fitness und Ernährung für ADHS-Gehirne und chaotische Tage.**

**Zielgruppe:** deutschsprachige Erwachsene von etwa 25–45 Jahren mit diagnostiziertem oder selbst beschriebenem ADHS/Exekutivfunktionsproblemen, die grundsätzlich etwas verändern wollen, aber an Planung, Tracking und Unterbrechungen scheitern.

**Versprechen:** „Sag uns, was heute realistisch ist. FitTrack macht daraus den kleinsten sinnvollen Schritt.“

**Alleinstellungsmerkmale:**

1. Tagesform-Engine für Zeit, Energie, Ort, Ausrüstung und Einschränkungen.
2. Ein gemeinsamer Entscheidungsfluss für Bewegung **und** Essen, nicht zwei parallele Tracker.
3. Kein Nachtragen, keine verlorenen Streaks, kein rotes „versagt“.
4. Drei Genauigkeitsmodi: exakt, geschätzt, nur Muster erfassen.
5. „Rescue Mode“ für überforderte Momente: eine sofort verfügbare Mahlzeit oder 2-Minuten-Aktion.
6. Erklärbare KI innerhalb fachlich kuratierter Grenzen.

**Verteidigbarer Vorteil:** Nicht der Chatbot, sondern ein wachsendes Modell dafür, welche Intervention bei welchem Kontext tatsächlich begonnen und abgeschlossen wird. Das Produkt lernt also „Was hilft dieser Person jetzt?“, nicht nur „Welcher Plan passt statistisch?“

### Positionierung B – starke zweite Option

**FitTrack Shift: Training und Essen rund um deinen Dienstplan.**

Zielgruppe wären Pflege, Rettungsdienst, Produktion, Logistik und andere wechselnde Schichten. Das Problem ist konkret und kaufkräftige B2B2C-Partnerschaften mit Kliniken oder Arbeitgebern wären denkbar. Der Nachteil: Kalender-/Dienstplanintegration, Datenschutz und fachlich korrekte Schlaf-/Ernährungshinweise erhöhen die Komplexität.

### Positionierung C – wirkungsstark, aber nicht als erstes Solo-MVP

**FitTrack Adapt: funktionale, anpassbare Bewegung für Menschen mit konkreten Mobilitätsprofilen.**

Nicht „für alle Behinderungen“, sondern zunächst etwa für manuelle Rollstuhlnutzende mit stabiler Oberkörperfunktion. Diese Positionierung braucht bezahltes Co-Design und fachliche Validierung; rein KI-generierte Anpassungen wären unverantwortlich.

## 6. Realistisches MVP bei drei Stunden pro Woche

Der Jahresplan entspricht nur ungefähr 156 Arbeitsstunden. Authentifizierung, Lebensmittelplattform, Meal Planner, Workoutgenerator, Medienbibliothek, Timer, Charts, Fotos, Wearables und KI-Coach sind in diesem Rahmen nicht seriös als marktfähiges Gesamtprodukt zu bauen.

### MVP: nur ein Kernkreislauf

**Eingabe → machbare Tagesaktion → Abschlussfeedback → bessere nächste Empfehlung**

Version 1 sollte enthalten:

1. sehr kurzes Onboarding mit Ziel, Trainingserfahrung, verfügbaren Geräten und Ausschlussfragen;
2. Tages-Check-in: Energie, Zeit, Ort, Einschränkung;
3. Auswahl aus fachlich kuratierten 2-, 8- und 20-Minuten-Workouts;
4. Rescue Meals aus 20–30 einfachen, günstigen und anpassbaren Bausteinen;
5. Abschlussfrage „zu leicht / passend / zu viel“;
6. Wochenansicht ohne tägliche Streak;
7. lokales oder sehr einfaches Profil; kein komplexes Social-/Foto-/Wearable-System.

**Bewusst später:** vollständiger Kalorienzähler, frei generierte Trainingspläne, Körperfotos, soziale Community, Wearables, vollautomatische Bildanalyse und medizinische Personalisierung.

### Erfolgsmessung

- Zeit vom Öffnen bis zum Start einer Handlung: Ziel unter 30 Sekunden.
- Anteil gestarteter Empfehlungen.
- Abschlussquote nach Zeitkategorie.
- Rückkehr innerhalb von 48 Stunden nach ausgelassenem Tag.
- Anteil der Vorschläge, die Nutzer nicht ersetzen.
- subjektive Überforderung vor/nach Nutzung.
- 4-Wochen-Retention, nicht nur Downloads.

### Validierung vor größerer Entwicklung

1. 12–15 problemorientierte Interviews mit Erwachsenen mit ADHS; nicht nach gewünschten Features fragen, sondern den letzten gescheiterten Versuch rekonstruieren.
2. Klickbarer Prototyp mit Tages-Check-in und Rescue Mode.
3. Zweiwöchiger „Concierge“-Test: Empfehlungen zunächst manuell hinter den Kulissen erstellen.
4. Zahlungsbereitschaft mit Landingpage oder Vorbestellung testen.
5. Erst danach Automatisierung und KI ausbauen.

## 7. Wettbewerbsabgrenzung in einem Satz

| Kategorie | Stärke | Lücke, die FitTrack nutzen kann |
|---|---|---|
| MyFitnessPal / Cronometer | große bzw. genaue Ernährungserfassung | Eingabelast, kein gemeinsamer situativer Handlungscoach |
| MacroFactor | datenbasierte adaptive Kalorienziele | benötigt regelmäßige Ernährungs-/Gewichtsdaten; kein Workout- und Exekutivfunktionsfokus |
| Fitbod / Freeletics | adaptive Trainingsplanung | Ernährung getrennt oder weniger integriert; Vertrauen und Alltagstauglichkeit bleiben angreifbar |
| MOOD / Aura / Momentm | Anpassung an Stimmung, Energie, Zeit und Ausrüstung | entstehende Konkurrenz; wenig erkennbare Verbindung zu neurodivergenter Ernährung und Wiedereinstieg |
| Tiimo / Finch | neurodivergenzfreundliche Planung bzw. Self-Care | keine spezialisierte, evidenzbegrenzte Fitness- und Ernährungslogik |
| Adaptive Fitness Apps | glaubwürdige Zielgruppenkenntnis | oft auf bestimmte Einschränkungen oder Workoutbibliotheken begrenzt |

## 8. Alternative Pivot-Ideen

### Pivot 1: „Back on Track“ – nur der Wiedereinstieg

Eine App, die ausschließlich Menschen nach Krankheit, Reise, Stressphase oder mehrwöchiger Pause zurückführt. Sie importiert den alten Plan, reduziert Umfang und Intensität kontrolliert, erklärt den Neustart und erhöht erst nach Feedback. Das Problem ist emotional klar und bei bestehenden Apps oft nur Nebenfunktion.

### Pivot 2: „Meal Rescue“ – Essen ohne Meal-Prep-Ideal

Keine Kalorien-App, sondern ein Entscheidungssystem für „Ich bin jetzt hungrig und habe keine Kapazität“. Eingaben: vorhandene Zutaten, Budget, Zeit, Kochmöglichkeit und Protein-/Allergieanforderung. Ausgabe: eine Sofortlösung, eine Mitnehm-Lösung und eine Einkaufs-Lösung. Der Fokus läge auf Ausführung statt Rezeptinspiration.

### Pivot 3: „ShiftFuel“ – Schichtplan als Gesundheitsbetriebssystem

Ein Dienstplan-zentriertes Produkt für Ernährung, Koffein, Schlafvorbereitung und Mikrotraining. Es könnte als B2B2C-Angebot für Kliniken, Pflegeanbieter oder Logistikunternehmen attraktiver sein als eine weitere Consumer-Fitness-App.

### Pivot 4: „PlanCheck“ – Sicherheits- und Qualitätsprüfung für KI-Trainingspläne

Nutzer fügen einen Plan aus ChatGPT, YouTube oder einer Trainer-App ein. PlanCheck prüft Progression, Volumensprünge, fehlende Bewegungsmuster, nicht berücksichtigte Ausrüstung und unklare Belastungsangaben. Das Produkt gibt keine Diagnose, sondern zeigt nachvollziehbare Warnungen und Fragen. Denkbar wäre später ein B2B-SDK für andere Fitnessprodukte.

### Pivot 5: „CareCircle Strength“ – funktionelles Training mit Unterstützer-Modus

Für ältere Menschen oder Personen nach längerer Inaktivität: sehr einfache Oberfläche, große Bedienelemente, klare Video-/Audioanweisungen und optionaler Angehörigen- oder Trainerzugang. Fortschritt wird als Alltagsfunktion gezeigt – Aufstehen, Tragen, Balance – statt als Kalorienverbrauch. Hoher gesellschaftlicher Nutzen, aber nur mit fachlicher Begleitung umsetzen.

## 9. Klare Entscheidungsempfehlung

**Nicht bauen:** eine generische All-in-One-App, deren Hauptargument „KI erstellt Trainings- und Ernährungspläne“ lautet. Dieses Versprechen ist austauschbar und wird von etablierten Anbietern bereits erfüllt.

**Bauen und testen:** **FitTrack Flex** mit einem einzigen Kernmoment: Der Nutzer öffnet die App in einem unperfekten Alltag, beantwortet maximal drei kurze Fragen und beginnt innerhalb von 30 Sekunden eine passende Aktion. Ernährung wird zunächst als Rescue-Entscheidung und nicht als vollständiger Kalorienzähler eingebunden.

**Erster Claim:**

> **Dein Tag lief nicht nach Plan. Dein Fortschritt muss deshalb nicht ausfallen.**

**Entscheidungstor nach vier Wochen Test:** Weiterbauen, wenn mindestens 40 % der Testnutzer die App in Woche vier noch verwenden, der Median bis zum Aktionsstart unter 30 Sekunden liegt und Nutzer nach einem ausgelassenen Tag häufiger zurückkehren als bei ihrem bisherigen System. Andernfalls auf **Meal Rescue** oder **FitTrack Shift** pivotieren.

