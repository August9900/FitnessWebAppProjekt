# PROJ-6 — Technisches Design: Tagesentscheidung

> Technische Umsetzung von `spec.md`. „Heute“ führt mit wenigen Tipps von „Bewegen“ oder „Essen“ zu genau einem Vorschlag mit bis zu zwei Alternativen. Die Auswahl ist eine reine, nachvollziehbare Regel über die Inhalte aus PROJ-4 und PROJ-5. Gespeichert werden – nur für die jeweilige Person – Check-ins mit ihrem Vorschlag und die daraus begonnenen Aktionen mit ihrem Zustand. Das ist das erste Feature, das laufend persönliche Tagesdaten schreibt.

## Komponentenstruktur

```text
Heute  /heute  (Bereich im App-Rahmen, nur mit vollständigen Angaben — Gate aus PROJ-3)
├── Kopfbereich „Heute“
├── Offene Aktionen (nur wenn vorhanden: begonnen, nicht abgeschlossen, jünger als 12 Stunden)
│   └── Karte je Aktion: Titel · „Weitermachen“ · „Geschafft“ · „Heute nicht“
├── Letzte Markierung (nur bis zum nächsten Check-in): „Geschafft. Gut gemacht.“ bzw.
│   „Okay. Vielleicht ein andermal.“ · „Rückgängig“
└── Tagesentscheidung (ein Schritt zur Zeit, ohne Seitenwechsel)
    ├── Schritt „Wahl“: „Was brauchst du gerade?“ · [Bewegen] [Essen]
    ├── Schritt „Fragen“ (je eine Frage pro Bildschirm, „Zurück“)
    │   ├── ggf. „Wie letztes Mal“ mit Zusammenfassung („10 Min · wenig Energie · Zuhause“)
    │   ├── Bewegen: Zeit [5 Min][10 Min][15 Min] → Energie [wenig][mittel][viel] → Ort (nur Profil-Orte; entfällt bei einem Ort)
    │   └── Essen: „Wie viel geht gerade?“ [Gar nicht kochen][Kurz kochen][Bis 20 Min]
    ├── Schritt „Vorschlag“
    │   ├── Hauptvorschlag (einzige dominante Fläche): Titel (Link zum Detail) · Dauer bzw. Aufwand ·
    │   │   „Passt zu: …“ · ggf. „Beispielinhalt …“ · [Los geht's] bzw. [Das mach ich]
    │   ├── bis zu zwei Alternativen: Titel (Link) · Dauer bzw. Aufwand · [Stattdessen das]
    │   └── „Andere Angaben wählen“
    ├── Leer: „Gerade passt nichts genau.“ · „Andere Angaben wählen“ · „Zu Bewegung“ bzw. „Zu Essen“
    └── Fehler: „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“ · „Nochmal versuchen“
```

Alles liegt im App-Rahmen von PROJ-2 mit `PageHeader`, Lade- und Fehlerzustand. Keine neuen Navigationseinträge. Der Wechsel zwischen Fragen setzt den Fokus auf die Überschrift der neuen Frage, damit Screenreader den Wechsel ansagen. Gewählte bzw. vorausgewählte Antworten sind durch `aria-pressed` und eine sichtbare Markierung (nicht nur Farbe) erkennbar.

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/today/today.rules.ts` | Reine Regeln: Typen und Beschriftungen für Art, Zeit, Energie, Ort, Aufwand, Aktionszustand; **Auswahl Bewegen** (AC-7) und **Auswahl Essen** (AC-8) – Kandidaten, Sortierung, Platz 1 bis 3; Zeile „Passt zu: …“; Zusammenfassung „Wie letztes Mal“ und ob sie noch gültig ist (EC-7); welche Aktionen auf „Heute“ offen sind (12 Stunden, EC-8) und welche Markierung noch zurücknehmbar ist (AC-15). Zeit wird als Eingabe übergeben. | `features/workouts/workouts.rules` (`fitOf`, Typen), `features/meals/meals.rules` (`mealFits`, Typen), `features/profile/profile.schema` / `profile.rules` (Typen). |
| `src/features/today/today.schema.ts` | Zod-Schemas der Eingaben der Server Actions: Check-in Bewegen bzw. Essen, Aktion beginnen, markieren, zurücknehmen. | Zod, Rules. |
| `src/features/today/today.data.ts` | `server-only`. Eigene Check-ins anlegen (mit Vorschlag) und die letzten Antworten je Art lesen; IDs der in den letzten 72 Stunden begonnenen Inhalte; Aktion anlegen; Zustand bedingt ändern; offene Aktionen und letzte Markierung mit Titeln lesen; alle eigenen Check-ins und Aktionen für den Export lesen. | `src/lib/supabase/server.ts`, Rules, Zod. |
| `src/features/today/today.actions.ts` | `'use server'`. `requestSuggestion` (Sitzung prüfen, Eingabe prüfen, Profil, Inhalte und Verlauf laden, Regel anwenden, Check-in speichern, Vorschlag zurückgeben), `startAction`, `concludeAction`, `undoConclusion`. Jede Action liefert ein Ergebnis statt zu werfen; Fehler werden ohne Personendaten protokolliert. | `features/account/account.data` (`requireUser`), `features/profile/profile.data`, `features/workouts/workouts.data`, `features/meals/meals.data`, Data, Rules, Schema. |
| `src/features/today/components/today-flow.tsx` | Client: Schrittfolge Wahl → Fragen → Vorschlag mit Vorauswahl, „Wie letztes Mal“, „Zurück“, Leer- und Fehlerzustand, Sperre gegen Doppeltipps während eine Action läuft; nach „Los geht's“ / „Das mach ich“ / „Stattdessen das“ Weiterleitung zur geführten Durchführung bzw. zum Mahlzeit-Detail. | shadcn `button`, `card`; `SampleContentBadge`; Actions, Rules. |
| `src/features/today/components/open-actions.tsx` | Client: offene Aktionen mit „Weitermachen“, „Geschafft“, „Heute nicht“; letzte Markierung mit Bestätigungstext und „Rückgängig“. | shadcn `button`, `card`; Actions, Rules. |
| `src/app/(protected)/(bereiche)/heute/page.tsx` | Ersetzt den Platzhalter: lädt Profilangaben (`requireCompletedProfile`), letzte Antworten je Art, offene Aktionen und letzte Markierung; übergibt an die beiden Komponenten. | `features/today`, `features/profile`. |
| **Änderung PROJ-1:** `src/features/account/account.data.ts`, `src/features/account/account.rules.ts` | `collectAccountExport` liest zusätzlich die eigenen Check-ins und Aktionen; der Export bekommt einen Abschnitt „Tagesentscheidung“ (AC-18). Bestehende Teile des Exports bleiben unverändert. | `features/today/today.data`. |

## Footprint

- **Code und Tests:** `src/features/today/**` mit Tests neben den Modulen; `src/app/(protected)/(bereiche)/heute/page.tsx` ersetzt den Platzhalter; Export-Erweiterung in `src/features/account/account.data.ts` und `account.rules.ts` mit Tests.
- **Migrationen, Tabellen und Zugriffsregeln:** `supabase/migrations/<Zeitstempel>_today.sql` – Tabellen `check_ins` und `actions`, Prüfregeln, Indizes, RLS nur für die eigene Person mit aktiver Sitzung, Spaltenrechte.
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** `/heute` (ersetzt Platzhalter); nutzt `/bewegung/[id]`, `/bewegung/[id]/los`, `/essen/[id]` als Ziele; Datenexport `/profil/export` erweitert; keine neuen Navigationseinträge; keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-6 | Höchstens 5 Tipps bis zum Workout-Start (mit „Wie letztes Mal“ 3), höchstens 3 bis zur Mahlzeit; keine Texteingabe. | Ein Tipp beantwortet und geht weiter; „Wie letztes Mal“ fordert sofort den Vorschlag an; die Hauptaktion startet direkt. | UI-Test zählt die Klicks bis zur Weiterleitung für alle drei Wege. |
| AC-7, AC-8 | Auswahl exakt nach der Regel der Spec. | Reine Funktionen in `today.rules.ts`, auf dem Server ausgewertet. | Unit-Tests mit Tabellen aus Angaben, Profil, Inhalten und Verlauf. |
| AC-11 | Check-in und Vorschlag gespeichert, sobald der Vorschlag erscheint; abgebrochene Check-ins hinterlassen nichts. | Der Check-in wird erst in `requestSuggestion` gespeichert – in **einem** Eintrag zusammen mit dem Vorschlag. Vorher liegen die Antworten nur im Browser. | Action-Test; Live-Prüfung der gespeicherten Zeile. |
| EC-4 | Doppeltipps erzeugen genau eine Aktion bzw. eine Zustandsänderung. | Die Datenbank lässt pro Check-in höchstens eine Aktion zu (eindeutig); ein zweiter Versuch liefert die bestehende Aktion zurück. Zustandsänderungen sind bedingt („nur wenn noch begonnen“). Zusätzlich sperrt die Oberfläche Knöpfe, solange eine Action läuft. | Action-Tests mit zwei Aufrufen; Live-Prüfung mit zwei gleichzeitigen Anfragen. |
| EC-5 | Zwei Geräte: die erste Markierung gilt. | Bedingte Änderung: „geschafft“ bzw. „heute nicht“ wird nur gesetzt, wenn die Aktion noch „begonnen“ ist. Trifft die Bedingung nicht, liefert die Action den tatsächlichen Zustand; die Oberfläche zeigt ihn. | Action-Test; Live-Prüfung zweier Markierungen nacheinander. |
| AC-17 | Nur die eigene Person liest und ändert. | RLS auf beiden Tabellen (eigene Zeilen, aktive Sitzung); keine Rechte für `anon`; Löschen über die API nicht erlaubt. | Live-Prüfung mit zweitem Testkonto und anonym. |

**Fehler an den Schnittstellen:**
- **Ungültige Eingabe** an eine Action (manipulierte Anfrage): Ergebnis „ungültig“, nichts gespeichert, kein Fehlerprotokoll mit Inhalt.
- **Keine Sitzung:** `requireUser` leitet zur Anmeldung um (bestehendes Verhalten).
- **Datenbank nicht erreichbar / Speichern fehlgeschlagen (EC-9):** Ergebnis „fehlgeschlagen“; die Oberfläche zeigt „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“ mit „Nochmal versuchen“, die Antworten bleiben im Browser erhalten. Protokoll: Action-Name und Fehlercode, keine Antworten, keine Nutzer-ID.
- **Inhalt nicht mehr angeboten (EC-6):** `startAction` prüft das Angebot; Ergebnis „gibt es nicht mehr“ → „Das gibt es leider nicht mehr.“ mit „Neuer Vorschlag“ (fordert mit denselben Antworten einen neuen Check-in an).
- **Kein passender Inhalt (EC-1):** Ergebnis „leer“; der Check-in wird trotzdem mit leerem Vorschlag gespeichert (er ist für die Erfolgsmessung relevant).
- **Laden von „Heute“ schlägt fehl:** die Seite wirft; Fehlergrenze aus PROJ-2.

## Datenmodell

Zwei Tabellen mit persönlichen Daten. Jede Zeile gehört genau einer Person.

**Check-in `check_ins`** – eine beantwortete Tagesentscheidung mit ihrem Vorschlag
- `id` — UUID, automatisch, Primärschlüssel.
- `user_id` — verweist auf das Konto; Pflicht; wird mit dem Konto gelöscht.
- `kind` — Text, genau `move` (Bewegen) oder `eat` (Essen).
- `minutes` — ganze Zahl 5, 10 oder 15; Pflicht bei `move`, leer bei `eat`.
- `energy` — Text, genau `low` („wenig“), `medium` („mittel“) oder `high` („viel“); Pflicht bei `move`, leer bei `eat`.
- `place` — Text, genau `home`, `outdoors` oder `gym`; Pflicht bei `move`, leer bei `eat`.
- `effort` — Text, genau `no_cook`, `quick` oder `up_to_20`; Pflicht bei `eat`, leer bei `move`.
- `suggested_ids` — Liste von Texten, 0–3 Einträge, keine Doppelten, in Rangfolge (Platz 1 = Hauptvorschlag); bei `move` Workout-IDs, bei `eat` Mahlzeit-IDs; leer = „Gerade passt nichts genau“ (EC-1). Dies ist der **Tagesvorschlag** aus dem Datenmodell.
- `created_at` — Zeitpunkt, automatisch.
- Keine Änderung nach dem Anlegen.

**Aktion `actions`** – eine aus einem Vorschlag begonnene Aktion (der **Aktionsverlauf** aus dem Datenmodell)
- `id` — UUID, automatisch, Primärschlüssel.
- `user_id` — verweist auf das Konto; Pflicht; wird mit dem Konto gelöscht.
- `check_in_id` — verweist auf den eigenen Check-in; Pflicht; **eindeutig** (höchstens eine Aktion pro Check-in, EC-4); wird mit dem Check-in gelöscht.
- `kind` — Text, `move` oder `eat`; gleich der Art des Check-ins.
- `workout_id` — verweist auf ein Workout; Pflicht bei `move`, leer bei `eat`.
- `meal_id` — verweist auf eine Mahlzeit; Pflicht bei `eat`, leer bei `move`.
- `status` — Text, genau `started` („begonnen“), `done` („geschafft“) oder `skipped` („heute nicht“); Standard `started`.
- `started_at` — Zeitpunkt, automatisch.
- `concluded_at` — Zeitpunkt; leer genau dann, wenn `status = started`.
- `updated_at` — Zeitpunkt, automatisch bei jeder Änderung (bestehende Hilfsfunktion).
- Workouts und Mahlzeiten, auf die eine Aktion verweist, können nicht gelöscht werden (sie werden ohnehin nur aus dem Angebot genommen).

**Zustandsübergänge** (durch die Server Actions mit bedingten Änderungen durchgesetzt):
- `started` → `done` oder `skipped` (nur wenn noch `started`; sonst bleibt der tatsächliche Zustand, EC-5).
- `done` / `skipped` → `started` („Rückgängig“), nur wenn die Person seit der Markierung keinen neuen Check-in angelegt hat (AC-15).
- Kein direkter Wechsel `done` ↔ `skipped`.

**Abgeleitet, nicht gespeichert:**
- **Offen auf „Heute“:** Aktionen mit `started` und `started_at` innerhalb der letzten 12 Stunden (AC-13, EC-8).
- **Zurücknehmbare Markierung:** die zuletzt markierte Aktion, wenn danach kein Check-in angelegt wurde (AC-15).
- **Letzte Antworten:** die des jüngsten Check-ins der jeweiligen Art (AC-5).
- **Kürzlich begonnen:** Inhalte aus Aktionen mit `started_at` innerhalb der letzten 72 Stunden, unabhängig vom Zustand (AC-7, AC-8).

**Auswahlregel (AC-7, AC-8)** – reine Funktion, Eingaben: Antworten, Profil, angebotene Inhalte, kürzlich begonnene IDs.
- **Bewegen – Kandidaten:** `fitOf` aus PROJ-4 passt **und** der gewählte Ort gehört zu den Orten des Workouts **und** (bei `home`) jede benötigte Ausstattung ist im Profil **und** Dauer ≤ gewählte Zeit **und** Intensität erlaubt: `low` → `gentle`; `medium` → `gentle`, `moderate`; `high` → alle (die Erfahrung begrenzt bereits über `fitOf`).
- **Bewegen – Sortierung:** (1) Dauer = gewählte Zeit vor kürzer (kürzere absteigend nach Dauer); (2) Abstand der Intensität zur Energie (`low`↔`gentle`, `medium`↔`moderate`, `high`↔`vigorous`; kleinerer Abstand zuerst); (3) nicht kürzlich begonnen vor kürzlich begonnen; (4) `sort_order`.
- **Essen – Kandidaten:** `mealFits` aus PROJ-5 **und** Aufwandsstufe = gewählte; bei weniger als drei Treffern aufgefüllt mit den jeweils einfacheren Stufen in der Reihenfolge `up_to_20` → `quick` → `no_cook`.
- **Essen – Sortierung:** (1) gewählte Stufe vor aufgefüllten (aufgefüllte in Auffüllreihenfolge); (2) nicht kürzlich begonnen vor kürzlich begonnen; (3) `sort_order`.
- Plätze 1–3 werden gespeichert; Platz 1 ist der Hauptvorschlag.

**Zugriff (RLS, nur `authenticated` mit aktiver Sitzung über `private.has_active_session`):**
- `check_ins`: lesen und anlegen nur eigene (`user_id` = angemeldete Person). Kein Ändern, kein Löschen über die API.
- `actions`: lesen nur eigene; anlegen nur eigene, und nur wenn der Check-in der Person gehört, die Art übereinstimmt, der Inhalt in dessen `suggested_ids` steht und der Inhalt angeboten wird; ändern nur eigene, und nur die Spalten `status` und `concluded_at`. Kein Löschen über die API.
- `anon` hat keinerlei Rechte auf beide Tabellen.

**Aufbewahrung:** bis zur Kontolöschung; dann automatisch mit dem Konto gelöscht (AC-19). Eine kürzere Frist klärt `/dsgvo PROJ-6` vor dem ersten Deploy (offene Frage in der Spec). Keine Freitexte, keine IP-Adressen, keine Geräteangaben.

**Indizes:** `check_ins` nach Person, Art und Zeitpunkt (letzte Antworten, Rückgängig-Prüfung); `actions` nach Person und Beginn (offen, kürzlich begonnen); Fremdschlüssel auf Workout und Mahlzeit.

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| „Heute“ laden | Angemeldet, Angaben vollständig (Gate PROJ-3). | Offene Aktionen, letzte zurücknehmbare Markierung, letzte Antworten je Art; Schritt „Wahl“. | AC-1, AC-5, AC-13, AC-15, EC-7, EC-8 |
| Vorschlag anfordern (`requestSuggestion`) | Angemeldet; Eingabe Bewegen (Zeit, Energie, Ort aus den Profil-Orten) oder Essen (Aufwand) wird geprüft. | Speichert den Check-in mit Plätzen 1–3; liefert Vorschlag mit Titeln, Dauer/Aufwand, Prüfstatus und „Passt zu“; leer bei keinem Treffer; „fehlgeschlagen“ bei Fehler. | AC-7 bis AC-11, EC-1 bis EC-3, EC-9 |
| Aktion beginnen (`startAction`) | Angemeldet; Check-in-ID und Inhalt-ID; Inhalt muss im Vorschlag des eigenen Check-ins stehen und angeboten sein. | Legt die Aktion an oder liefert die bereits bestehende des Check-ins; liefert das Ziel (geführte Durchführung bzw. Mahlzeit-Detail); „gibt es nicht mehr“ bei EC-6. | AC-12, EC-4, EC-6, EC-9 |
| Markieren (`concludeAction`) | Angemeldet; eigene Aktions-ID; Zustand `done` oder `skipped`. | Bedingte Änderung; liefert den tatsächlichen Zustand. | AC-14, EC-4, EC-5, EC-9 |
| Zurücknehmen (`undoConclusion`) | Angemeldet; eigene Aktions-ID. | Nur ohne neueren Check-in; sonst „nicht mehr möglich“ und der aktuelle Zustand. | AC-15 |
| Datenexport (PROJ-1) | Angemeldet. | Enthält alle eigenen Check-ins (Antworten, Vorschlag, Zeitpunkt) und Aktionen (Inhalt, Zustand, Zeitpunkte). | AC-18 |
| Konto löschen (PROJ-1) | Angemeldet. | Check-ins und Aktionen werden mit dem Konto gelöscht. | AC-19 |

## Abhängigkeiten

- `@supabase/ssr` (vorhanden), Zod (vorhanden).
- shadcn `button`, `card` (vorhanden); `SampleContentBadge` (`src/components/content/`).
- Regeln und Datenzugriff aus PROJ-3, PROJ-4, PROJ-5; `requireUser` und Export aus PROJ-1.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Vorschlag als Rangliste im Check-in-Eintrag statt eigener Tabelle | Check-in und Vorschlag entstehen gemeinsam und ändern sich nie; ein einziger Eintrag ist atomar, ohne Transaktion über mehrere Tabellen (AC-11). | Eigene Tabelle `suggestions` mit je einer Zeile pro Platz | Keine Fremdschlüssel auf die vorgeschlagenen Inhalte; vertretbar, weil Inhalte nie gelöscht, nur aus dem Angebot genommen werden. | 2026-11-13 |
| Höchstens eine Aktion pro Check-in, von der Datenbank erzwungen | Garantiert EC-4 auch bei gleichzeitigen Doppeltipps; ein zweiter Versuch bekommt die bestehende Aktion. | Nur Sperre in der Oberfläche | Wer nach dem Start zurückblättert und „Stattdessen das“ wählt, bekommt die schon begonnene Aktion statt einer zweiten – passt zur Spec (Wechsel nur vor dem Start). | 2026-11-13 |
| Zustandsänderungen als bedingte Änderung („nur wenn noch begonnen“) | Garantiert EC-5: die erste Markierung gilt, ohne Sperren oder Versionsnummern. | Letzte Änderung gewinnt | Ein Fehltipp auf dem zweiten Gerät wird nicht übernommen; „Rückgängig“ korrigiert. | 2026-11-13 |
| Erlaubte Übergänge in den Server Actions, die Datenbank prüft gültige Kombinationen | Die Regeln sind klein und gut testbar; RLS und Spaltenrechte begrenzen, was überhaupt änderbar ist. | Übergangsprüfung per Datenbank-Trigger | Wer die App umgeht, könnte eigene Aktionen direkt zwischen `done` und `skipped` setzen – betrifft nur die eigenen Daten. | 2026-11-13 |
| RLS prüft beim Anlegen einer Aktion Check-in-Besitz, Art, Vorschlag und Angebot | Niemand kann über die API Aktionen für fremde Check-ins oder nicht vorgeschlagene Inhalte anlegen (SEC-03). | Nur Prüfung in der Server Action | Etwas komplexere Zugriffsregel. | 2026-11-13 |
| Zugriffsregeln verlangen eine aktive Sitzung (`private.has_active_session`) | Gleiches Muster wie das Profil (PROJ-1): nach Abmelden oder Passwortwechsel sind die Daten auch mit altem Token nicht lesbar. | Nur `user_id` prüfen | Eine Hilfsfunktion pro Abfrage; bei kleinen Datenmengen vernachlässigbar. | 2026-11-13 |
| Auswahlregel als reine Funktion, auf dem Server ausgewertet | Nachvollziehbar und mit Tabellen testbar (PRD); PROJ-7 kann sie später um Rückmeldungen erweitern. | Auswahl in der Datenbank | Alle angebotenen Inhalte (≈ 30) werden pro Vorschlag geladen; bei sehr vielen Inhalten müsste das in die Abfrage. | 2026-11-13 |
| Check-in-Antworten bleiben bis zum Vorschlag nur im Browser | Ein abgebrochener Check-in hinterlässt nichts (AC-11); weniger Daten. | Jede Antwort sofort speichern | Neuladen mitten im Check-in verliert die Antworten – bei 1–3 Tipps zumutbar. | 2026-11-13 |
| Server Actions statt eigener API-Routen | Projektkonvention (PROJ-1, PROJ-3); POST, Sitzung und Eingabeprüfung an einer Stelle. | Route Handler | Keine. | 2026-11-13 |
| 12 und 72 Stunden auf dem Server aus der Datenbankzeit berechnet | Unabhängig von falsch gestellten Geräteuhren. | Berechnung im Browser | Keine. | 2026-11-13 |
| Export-Erweiterung im bestehenden PROJ-1-Export | Ein Export für alles (AC-18); PROJ-3 hat ihn bereits so erweitert. | Eigener Export für PROJ-6 | Kleine Änderung an PROJ-1-Dateien. | 2026-11-13 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: Aufbewahrungsfrist für Check-ins und Aktionen nach `/dsgvo PROJ-6` (bisher bis zur Kontolöschung).

## Umsetzungshinweise (/build, 2026-11-17)

- **Zeitfenster mit der Serveruhr:** Die 12- und 72-Stunden-Fenster und `concluded_at` werden mit der Uhr des Next.js-Servers berechnet, nicht mit `now()` der Datenbank. Die Geräteuhr spielt wie geplant keine Rolle; zwischen Server- und Datenbankuhr sind nur Abweichungen im Millisekundenbereich zu erwarten. Gilt auch für die Rückgängig-Prüfung (Markierung gegen jüngsten Check-in).
- **Aktualisierung von „Heute“:** Jede Server Action ruft nach Erfolg `revalidatePath('/heute')` auf. Offene Aktionen und letzte Markierung zeigen deshalb immer den Serverzustand, auch wenn ein anderes Gerät zuerst markiert hat (EC-5). Die Antworten des Check-ins bleiben dabei im Browser erhalten.
- **Inhalt nicht mehr angeboten:** Offene Aktionen, deren Workout oder Mahlzeit aus dem Angebot genommen wurde, erscheinen mit „Dein Workout“ bzw. „Deine Mahlzeit“ statt des Titels und bleiben markierbar.
- **Export:** Der neue Abschnitt heißt `dailyDecisions` und enthält `checkIns` und `actions` mit IDs. Über `checkInId` lässt sich die Aktion ihrem Check-in zuordnen.
- **Ergänzungen in `today.rules.ts`:** `openSince`, `detailHref`, `continueHref` und `TODAY_MESSAGES`. Sie werden von Daten, Actions und beiden Ansichten gemeinsam genutzt.
- **Live-Prüfung:** Gegen die lokale Datenbank wurden Zugriff, Doppeltipps, zwei Markierungen, Spaltenrechte, Löschsperre, Export, die Sitzungsregel und die Kontolöschung mit zwei Testkonten geprüft (16/16). Zusätzlich wurde `/heute` mit echter Sitzung abgerufen (7/7). Die Browser-Bedienung selbst ist nur durch Komponententests abgedeckt.
