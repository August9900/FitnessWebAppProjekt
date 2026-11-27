# PROJ-2: App-Rahmen & Navigation

## Abhängigkeiten

- Benötigt: PROJ-1 (Konto & Anmeldung) — geschützter Bereich, Sitzungsprüfung, Abmelden und die Kontoeinstellungen im Profil.
- Die Inhalte der Bereiche liefern andere Features: „Heute“ PROJ-6, „Bewegung“ PROJ-4, „Essen“ PROJ-5, „Wochenblick“ PROJ-8, „Gewicht“ PROJ-11, „Profil“ PROJ-3 (Angaben) und PROJ-1 (Konto). Bis dahin zeigt PROJ-2 Platzhalter.
- Wann der Bereich „Gewicht“ in der Navigation erscheint (Altersgruppe, Ausblenden), legt PROJ-11 fest; PROJ-2 stellt nur den bedingten Eintrag bereit (AC-19).
- Gemeinsame Grundlage: `docs/app-shell.md` (Rahmen) und `docs/design-system.md` (visuelle Gestaltung).

## User Stories

- Als angemeldete Person möchte ich jederzeit sehen, wo ich in der App bin, und mit einem Tipp zu jedem Hauptbereich wechseln, damit ich mich nicht durch Menüs suchen muss.
- Als Person, die PULSE am Handy nutzt, möchte ich die Hauptbereiche mit dem Daumen erreichen, damit ich die App auch unterwegs und in Eile bedienen kann.
- Als Person, die sich schnell überfordert fühlt, möchte ich eine ruhige, gleichbleibende Oberfläche ohne ablenkende Bewegung, damit ich mich auf den nächsten Schritt konzentrieren kann.
- Als Person mit eigener Vorliebe oder Lichtempfindlichkeit möchte ich zwischen hellem und dunklem Farbschema wählen und Bewegung reduzieren können, damit die App für mich angenehm zu nutzen ist.
- Als Person, die mit Tastatur oder Screenreader arbeitet, möchte ich die Navigation vollständig ohne Maus bedienen können und erkennen, welcher Bereich gerade aktiv ist.

## Nicht enthalten

- Die Inhalte der Bereiche: Tagesentscheidung (PROJ-6), Workouts (PROJ-4), Mahlzeiten (PROJ-5), Wochenblick (PROJ-8), fachliche Profilangaben (PROJ-3). Kontoeinstellungen bleiben bei PROJ-1.
- Navigationseinträge späterer Features (z. B. KI-Trainer PROJ-14); sie erhalten erst bei ihrer eigenen Architektur einen Platz. Aufgenommen ist bisher nur „Gewicht“ (PROJ-11, AC-19); die Übungsbibliothek (PROJ-9) liegt ohne eigenen Eintrag unter „Bewegung“.
- Suche, Benachrichtigungen, Benutzermenü mit Avatar und eine ein- oder ausklappbare Seitenleiste.
- Speicherung der Darstellungseinstellungen am Konto und Abgleich zwischen Geräten.
- Animierte Pulslinie oder andere Daueranimationen; die Pulslinie bleibt statisch.
- Neugestaltung der öffentlichen Einstiegsseite über die Designbasis hinaus (Marketingseite, Onboarding — PROJ-3).

## Acceptance Criteria

### Navigation und Rahmen

- [ ] **AC-1** — Angenommen eine Person ist angemeldet und das Fenster ist mindestens 1024 px breit, wenn sie einen geschützten Bereich öffnet, dann sieht sie eine Seitenleiste mit der PULSE-Marke und den Hauptbereichen in der Reihenfolge Heute, Bewegung, Essen, Wochenblick, Profil — für Personen, für die „Gewicht“ gilt, zusätzlich „Gewicht“ zwischen Wochenblick und Profil (AC-19).
- [ ] **AC-2** — Angenommen eine Person ist angemeldet und das Fenster ist schmaler als 1024 px (z. B. 375 px oder 768 px), wenn sie einen geschützten Bereich öffnet, dann sieht sie unten eine Navigation mit denselben Bereichen wie in der Seitenleiste (fünf oder sechs), jeweils mit Symbol und sichtbarer Beschriftung; sie bleibt beim Scrollen erreichbar und verdeckt keinen Inhalt.
- [ ] **AC-3** — Angenommen eine Person ist angemeldet, wenn sie einen Bereich in der Navigation auswählt, dann öffnet sich dieser Bereich, sein Titel steht im Kopfbereich und der zugehörige Navigationseintrag ist als aktuell markiert — sichtbar nicht nur durch Farbe und für Screenreader als aktuelle Seite ausgezeichnet.
- [ ] **AC-4** — Angenommen eine Person meldet sich an oder registriert sich, wenn die Anmeldung erfolgreich ist, dann landet sie im Bereich „Heute“ innerhalb des App-Rahmens.
- [ ] **AC-5** — Angenommen ein Bereich hat noch keinen Inhalt (Bewegung, Essen, Wochenblick), wenn eine Person ihn öffnet, dann sieht sie im Rahmen einen ruhigen Hinweis, was hier entstehen wird, und einen Weg zurück zu „Heute“ — keine Fehlermeldung und keine leere Seite.
- [ ] **AC-6** — Angenommen eine Person ist in einem Bereich, wenn die Ansicht angezeigt wird, dann steht im Kopfbereich der Titel des Bereichs, und es gibt dort höchstens eine hervorgehobene Hauptaktion.
- [ ] **AC-19** — Angenommen für eine angemeldete Person gelten die Bedingungen aus PROJ-11 (Altersgruppe „ab 16“, „Gewicht in der Navigation zeigen“ eingeschaltet), wenn die Navigation angezeigt wird, dann steht „Gewicht“ in Seitenleiste und unterer Navigation zwischen „Wochenblick“ und „Profil“ und verhält sich wie jeder andere Eintrag (AC-3, AC-8, AC-9); gelten sie nicht — oder nicht mehr, spätestens beim nächsten Seitenaufruf —, erscheint der Eintrag nicht und die übrigen fünf Bereiche bleiben unverändert.
- [ ] **AC-7** — Angenommen eine Person ist nicht angemeldet, wenn sie eine öffentliche Seite öffnet (Einstieg, Anmelden, Registrieren, Passwort vergessen), dann sieht sie die PULSE-Marke, aber keine App-Navigation.

### Bedienbarkeit

- [ ] **AC-8** — Angenommen eine Person nutzt nur die Tastatur, wenn sie eine Seite im Rahmen lädt und Tab drückt, dann ist das erste fokussierbare Element ein Link „Zum Inhalt springen“, alle Navigationseinträge sind danach per Tab erreichbar und jeder fokussierte Eintrag zeigt einen mindestens 2 px starken, sichtbaren Fokusrahmen.
- [ ] **AC-9** — Angenommen eine Person bedient die App per Touch, wenn sie Navigationseinträge, primäre Schaltflächen oder Eingabefelder nutzt, dann sind diese mindestens 48 px hoch.

### Designbasis

- [ ] **AC-10** — Angenommen eine beliebige Ansicht der App wird angezeigt, auch die öffentlichen Seiten aus PROJ-1, wenn sie geladen ist, dann verwendet sie die PULSE-Farben, die Schriften (Unbounded für Marke und kurze Überschriften, Inter für Text) und die gemeinsame Rundung aus `docs/design-system.md`.
- [ ] **AC-11** — Angenommen das helle oder das dunkle Farbschema ist aktiv, wenn Text auf seinem Hintergrund steht (Haupttext, gedämpfter Text, Text auf Primär-, Akzent- und Fehlerflächen), dann beträgt der Kontrast mindestens 4,5:1.
- [ ] **AC-12** — Angenommen eine Person lädt die App, wenn Schriften und andere Ressourcen geladen werden, dann werden sie von der eigenen Adresse der App ausgeliefert und nicht bei Drittanbietern (z. B. Google Fonts) abgerufen. _(Datenschutz: keine Weitergabe der IP-Adresse beim Seitenaufruf.)_

### Darstellung

- [ ] **AC-13** — Angenommen eine Person hat auf diesem Gerät noch kein Farbschema gewählt, wenn sie die App öffnet, dann folgt das Farbschema der Einstellung des Geräts; meldet das Gerät keine Vorliebe, ist es dunkel.
- [ ] **AC-14** — Angenommen eine Person ist im Profil im Abschnitt „Darstellung“, wenn sie „System“, „Hell“ oder „Dunkel“ wählt, dann wird das Farbschema sofort ohne Neuladen übernommen und gilt auf diesem Gerät auch nach Neuladen und Neustart des Browsers.
- [ ] **AC-15** — Angenommen das Gerät meldet reduzierte Bewegung oder die Person hat unter „Darstellung“ „Bewegung reduzieren“ eingeschaltet, wenn sie in der App navigiert oder Aktionen auslöst, dann gibt es keine nicht notwendigen Übergänge oder Animationen; die eigene Einstellung gilt auf diesem Gerät auch nach Neuladen.

### Zustände

- [ ] **AC-16** — Angenommen eine angemeldete Person ruft eine Adresse auf, die es nicht gibt, wenn die Seite angezeigt wird, dann sieht sie „Seite nicht gefunden“ innerhalb des App-Rahmens mit einem Weg zu „Heute“; eine nicht angemeldete Person sieht dieselbe Meldung ohne App-Navigation mit einem Weg zum Einstieg.
- [ ] **AC-17** — Angenommen der Inhalt eines Bereichs lädt noch, wenn die Person wartet, dann hält ein ruhiger Platzhalter den Platz des Inhalts frei, ohne dauernde Bewegung, und die Navigation bleibt bedienbar.
- [ ] **AC-18** — Angenommen beim Anzeigen eines Bereichs tritt ein unerwarteter Fehler auf, wenn die Ansicht dargestellt wird, dann sieht die Person im Rahmen eine verständliche Meldung mit „Erneut versuchen“, und die Navigation bleibt bedienbar.

## Edge Cases

- [ ] **EC-1** — Angenommen eine Person hat auf dem Gerät „Hell“ gewählt und das Gerät steht auf Dunkel, wenn sie die App neu lädt, dann erscheint von Anfang an das helle Schema, ohne sichtbares Aufblitzen des dunklen.
- [ ] **EC-2** — Angenommen der Browser erlaubt keine Speicherung auf dem Gerät (z. B. privater Modus mit Sperre), wenn die Person eine Darstellung wählt, dann funktioniert die App ohne Fehlermeldung weiter, die Wahl gilt bis zum Neuladen und danach folgt die App wieder der Geräteeinstellung.
- [ ] **EC-3** — Angenommen die Sitzung einer Person ist abgelaufen, wenn sie in der Navigation einen Bereich wählt, dann gelangt sie zur Anmeldung und nach erfolgreicher Anmeldung in den gewählten Bereich.
- [ ] **EC-4** — Angenommen das Fenster ist nur 320 px breit oder ein Handy liegt quer, wenn die untere Navigation angezeigt wird, dann sind alle Einträge (fünf oder sechs) ohne seitliches Scrollen sichtbar, jeder mit Symbol, sichtbarer Beschriftung und vollständigem, zugänglichem Namen; bei sechs Einträgen dürfen Beschriftungen an sinnvollen Trennstellen (z. B. „Be-wegung“, „Wochen-blick“) auf zwei Zeilen umbrechen und etwas kleiner sein, aber nicht unter 12 px, und jeder Eintrag bleibt mindestens 48 px hoch.
- [ ] **EC-5** — Angenommen ein Bereichstitel ist sehr lang, wenn er im Kopfbereich steht, dann bricht er um, statt Inhalte zu überdecken oder seitliches Scrollen zu erzeugen.
- [ ] **EC-6** — Angenommen eine Person vergrößert die Darstellung im Browser auf 200 %, wenn sie die App nutzt, dann bleiben Navigation und Inhalte bedienbar und werden nicht von der Navigation verdeckt.

## Übergreifende Anforderungen

- Texte im Rahmen sind kurz, deutsch und verwenden für Bereiche überall dieselben Namen: Heute, Bewegung, Essen, Wochenblick, Gewicht, Profil.
- Der Rahmen kommt ohne Daueranimationen, pulsierende Hintergründe oder gestaffelte Karteneintritte aus.
- Der Rahmen speichert keine personenbezogenen Daten. Die Darstellungseinstellungen liegen nur auf dem jeweiligen Gerät. Um „Gewicht“ zu zeigen oder nicht, liest er nur die Altersgruppe (PROJ-1) und die Einstellung „Gewicht in der Navigation zeigen“ (PROJ-11).

## Offene Fragen

- [x] AC-13: Heutige Browser melden ohne gesetzte Vorliebe meist „hell“. → AC-13 bleibt: PULSE folgt dem Gerät; „dunkel“ gilt nur, wenn der Browser keine Einstellung liefern kann (2026-11-11)
- [ ] Wie die Platzhalter für Bewegung, Essen und Wochenblick genau formuliert sind, wird bei der Umsetzung mit kurzen, ermutigenden Texten festgelegt und kann bei der Produktvalidierung angepasst werden.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| PROJ-2 setzt auch die visuelle Designbasis der ganzen App um (Farben, Schriften, Hell/Dunkel) | Kein anderes Feature ist dafür zuständig; alle späteren Features erben dadurch automatisch die PULSE-Gestaltung. | 2026-11-11 |
| Alle fünf Bereiche sind von Anfang an in der Navigation, noch leere mit ruhigem Platzhalter | Der Rahmen lässt sich im Prototyp vollständig ausprobieren; der Platzhalter führt zurück zu „Heute“ statt in eine Sackgasse. | 2026-11-11 |
| Farbschema folgt dem Gerät (ohne Vorgabe: Dunkel), zusätzlich eigene Wahl System/Hell/Dunkel und „Bewegung reduzieren“ im Profil, nur auf dem Gerät gespeichert | Dunkel ist die PULSE-Ausgangsansicht; eigene Wahl hilft bei Lichtempfindlichkeit und Ablenkung. Gerätespeicherung braucht keine Kontodaten. | 2026-11-11 |
| Seitenleiste ab 1024 px Breite, darunter untere Navigation; Einträge immer mit sichtbarer Beschriftung | Tablets im Hochformat profitieren von der Daumen-Navigation; Beschriftungen vermeiden Rätselraten über Symbole. | 2026-11-11 |
| Sechster, bedingter Bereich „Gewicht“ zwischen Wochenblick und Profil; bei sechs Einträgen dürfen Beschriftungen unten umbrechen und kleiner werden (mind. 12 px) | PROJ-11 braucht einen eigenen Bereich, der nur für manche Personen gilt; Beschriftungen bleiben sichtbar, weil Symbole allein Rätselraten erzeugen. | 2026-11-25 |
| Keine Suche, keine Benachrichtigungen, kein Benutzermenü und keine einklappbare Seitenleiste in der ersten Version | Ein ruhiger Rahmen mit wenig Entscheidungen passt zur Zielgruppe; Abmelden liegt im Profil. | 2026-11-11 |
| Schriften werden von der eigenen Adresse ausgeliefert, nicht von Google Fonts | Ein Abruf bei Drittanbietern überträgt die IP-Adresse und wurde in Deutschland als DSGVO-Verstoß gewertet. | 2026-11-11 |
