# PROJ-11 — Technisches Design: Gewichtsverlauf

> Das WIE zu `spec.md`. Zwei Lesende: die Produktverantwortung (Freigabe) und `/build` (Umsetzung). Kein Code, aber so genau, dass nichts geraten werden muss.
> Der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Überblick

Ein neuer Hauptbereich `/gewicht` im bestehenden Rahmen. Jede Person speichert höchstens einen Gewichtswert pro Kalendertag; der Bereich zeigt die Werte als Kurve für einen wählbaren Zeitraum und als vollständige Liste. Wer den Bereich sehen darf, entscheidet eine einzige Regel aus Altersgruppe (ab 16) und der neuen Profil-Einstellung „Gewicht in der Navigation zeigen“; dieselbe Regel steuert den Navigationseintrag (PROJ-2 AC-19), die Seite und die Server-Aktionen. Die Datenbank lässt Gewichtseinträge zusätzlich nur für die Altersgruppe „ab 16“ zu.

## Komponentenstruktur

```
Navigation (PROJ-2, geändert)
└── Eintrag „Gewicht“ zwischen Wochenblick und Profil — nur wenn die Regel „Gewicht sichtbar“ gilt

/gewicht (Seite, im Gate für vollständige Angaben)
├── Kopfbereich „Gewicht“ mit Hauptaktion „Eintragen“
├── Zeitzonen-Abgleich (aus PROJ-8 wiederverwendet, unsichtbar)
├── Gewichtsverlauf (Client)
│   ├── Zeitraum-Wahl: „1 Monat“ · „3 Monate“ (Standard) · „1 Jahr“ — Links mit aria-current und Häkchen
│   ├── Kurve (einfaches SVG) — oder „Zu wenige Einträge für eine Kurve.“
│   ├── Liste „Deine Einträge“, neueste zuerst: Datum · „72,4 kg“ · „Ändern“ · „Löschen“
│   ├── „Alle Einträge löschen“ (zurückhaltend, unter der Liste)
│   └── Leerer Zustand: „Hier siehst du deinen Verlauf, sobald du etwas einträgst.“ + „Eintragen“
├── Dialog „Eintragen“ / „Eintrag ändern“: Datum (vorausgefüllt mit heute, höchstens heute), Gewicht in kg
├── Rückfrage „Für diesen Tag gibt es schon einen Eintrag (<Wert> kg). Ersetzen?“
├── Bestätigung „Eintrag vom <Datum> löschen?“
└── Bestätigung „Alle Gewichtseinträge löschen? Das lässt sich nicht rückgängig machen.“

/profil (geändert, nur ab 16)
└── Abschnitt „Gewicht“ mit Schalter „Gewicht in der Navigation zeigen“ (zwischen „Darstellung“ und „Passwort“)
```

Für alle, für die die Regel nicht gilt (unter 16 oder ausgeblendet), antwortet `/gewicht` mit der allgemeinen Ansicht „Seite nicht gefunden“ des Rahmens — dieselbe wie bei einer unbekannten Adresse, ohne Altershinweis (AC-2, AC-14).

## Code-Struktur

Neuer Feature-Ordner `src/features/weight/` nach der Konvention der anderen Features.

| Modul / Pfad | Aufgabe und Schnittstelle | Erlaubte Abhängigkeiten / Wiederverwendung |
| --- | --- | --- |
| `src/features/weight/weight.rules.ts` | Rein. Regel **„Gewicht sichtbar“** (Altersgruppe „ab 16“ und Einstellung an); Grenzen 30,0–300,0 kg; Gewicht aus Text lesen (Komma oder Punkt, höchstens eine Nachkommastelle); Anzeige im deutschen Format mit genau einer Nachkommastelle („72,0 kg“); Datum „nicht in der Zukunft“ gegen „heute“ in der Gerätezeitzone; Zeiträume `1m`/`3m`/`1j` mit Standard `3m` und deren Startdatum; Einträge eines Zeitraums; Kurvenpunkte (Skalierung zwischen kleinstem und größtem Wert mit Rand); Texte. | Nur reine Regeln: `week.rules` (Zeitzone, lokales Datum), `account.schema` (Altersgruppen). |
| `src/features/weight/weight.schema.ts` | Zod-Prüfung der Eingaben: Datum (ISO-Kalendertag), Gewicht (Text wie oben), optional vorheriges Datum beim Ändern, Ersetzen ja/nein; Zeitraum-Parameter. Meldungen je Feld (AC-5). | `weight.rules`. |
| `src/features/weight/weight.data.ts` | Server. **Zugang lesen** (Altersgruppe und Einstellung der angemeldeten Person; pro Anfrage zwischengespeichert, weil Rahmen und Seite ihn brauchen); eigene Einträge lesen (alle, neueste zuerst); Eintrag speichern über die Datenbankfunktion; einen Eintrag löschen; alle löschen; Einstellung setzen; Export-Abschnitt lesen. Lesefehler werfen ohne Personendaten. | `@/lib/supabase/server`, `weight.rules`. |
| `src/features/weight/weight.actions.ts` | Server Actions: `saveWeightEntry`, `deleteWeightEntry`, `deleteAllWeightEntries`, `setWeightVisibility`. Jede prüft Sitzung, Eingabe (Schema) und Zugang; Speichern/Löschen verlangen „Gewicht sichtbar“, die Einstellung verlangt nur „ab 16“. Ergebnisse: gespeichert · schon vorhanden (mit Wert) · gibt es nicht mehr · ungültig (Feldhinweise) · Fehler. Danach `/gewicht` (und bei der Einstellung den Rahmen) neu laden. | `weight.data`, `weight.schema`, `account.data` (Sitzung). |
| `src/features/weight/components/weight-view.tsx` | Client. Zeitraum-Wahl, Kurve, Liste, leerer Zustand, „Alle Einträge löschen“; öffnet Dialoge; während einer Aktion gesperrt (EC-2); Fehler- und „gibt es nicht mehr“-Meldungen nahe der Aktion. | shadcn `button`, `alert`, `alert-dialog`; `weight-chart`, `weight-entry-dialog`; Actions, Rules. |
| `src/features/weight/components/weight-chart.tsx` | Client oder Server, rein darstellend. SVG-Linie mit Punkten, Achsenbeschriftung nur kleinster/größter Wert und erstes/letztes Datum; keine Zielmarken, keine Trendpfeile, keine wertenden Farben, keine Animation. Für Screenreader verborgen; die Liste ist die Textfassung (AC-9). | `weight.rules`. |
| `src/features/weight/components/weight-entry-dialog.tsx` | Client. Formular Datum + Gewicht für Neu und Ändern; Prüfung mit dem Schema vor dem Senden; fragt bei vorhandenem Tag nach (lokal aus den geladenen Einträgen, zusätzlich auf Antwort „schon vorhanden“ des Servers); Eingaben bleiben bei Fehler erhalten (EC-4). | shadcn `dialog`, `input`, `label`, `button`, `alert`, `alert-dialog`; Actions, Schema, Rules. |
| `src/features/weight/components/weight-visibility-switch.tsx` | Client. Schalter „Gewicht in der Navigation zeigen“ für das Profil; sofort gespeichert, bei Fehler zurückgestellt mit Meldung. | shadcn `switch`, `label`; Action. |
| `src/app/(protected)/(bereiche)/gewicht/page.tsx` (neu) | Lädt Zugang, Einträge und Zeitzonen-Cookie; ohne „Gewicht sichtbar“ → `notFound()` (allgemeine Ansicht). Liest den Zeitraum aus der Adresse (`?zeitraum=1m|3m|1j`, Unbekanntes → `3m`). Lesefehler → Fehlerzustand des Rahmens (EC-6). | `weight.data`, `weight.rules`, `week` (`TimeZoneSync`, Zeitzone). |
| **Änderung PROJ-2:** `src/components/shell/navigation.rules.ts` | Neuer Eintrag `gewicht` („Gewicht“, `/gewicht`) zwischen Wochenblick und Profil, als bedingt gekennzeichnet; neue reine Funktion „Bereiche für diese Person“ (mit oder ohne Gewicht). Bei sechs Einträgen eigene kurze Beschriftungen mit weichen Trennstellen („Be­we­gung“, „Wochen­blick“). | — |
| **Änderung PROJ-2:** `src/components/shell/nav-icons.tsx` | Symbol für „Gewicht“ (schlichte Waage aus `lucide-react`). | — |
| **Änderung PROJ-2:** `app-shell.tsx`, `desktop-nav.tsx`, `mobile-nav.tsx` | Bekommen die Liste der Bereiche von außen statt sie selbst festzulegen. Die untere Leiste teilt die Breite durch die Anzahl; bei sechs Einträgen kleinere Beschriftung (12 px) mit Umbruch an den Trennstellen, Höhe bleibt mindestens 48 px (PROJ-2 EC-4). | — |
| **Änderung PROJ-2:** `src/app/(protected)/layout.tsx` | Liest nach der Sitzungsprüfung den Zugang (`weight.data`) und übergibt dem Rahmen die passenden Bereiche. Fällt das Lesen aus, gilt „nicht sichtbar“ — der Rahmen bleibt bedienbar. | `weight.data`, `navigation.rules`. |
| **Änderung PROJ-3/PROJ-1:** `src/app/(protected)/profil/page.tsx` | Abschnitt „Gewicht“ mit dem Schalter, nur für „ab 16“. | `weight-visibility-switch`, `weight.data`. |
| **Änderung PROJ-1:** `src/features/account/account.rules.ts`, `account.data.ts` | Export um den Abschnitt `weightEntries` (Datum, kg) erweitern; die Einstellung erscheint im Profil-Abschnitt (`showWeightInNav`). | `weight.data` (Export lesen). |

Die Rahmen-Bausteine importieren nichts aus `features/`; die Entscheidung trifft das geschützte Layout und reicht nur die Liste weiter.

## Footprint

- **Code und Tests:** `src/features/weight/` (rules, schema, data, actions, drei Komponenten — jeweils mit Test); Seite `src/app/(protected)/(bereiche)/gewicht/page.tsx`; Änderungen mit Tests an `src/components/shell/navigation.rules.ts`, `nav-icons.tsx`, `app-shell.tsx`, `desktop-nav.tsx`, `mobile-nav.tsx`, `src/app/(protected)/layout.tsx`, `src/app/(protected)/profil/page.tsx`, `src/features/account/account.rules.ts`, `account.data.ts`.
- **Migrationen, Tabellen und Zugriffsregeln:** eine neue Migration `supabase/migrations/<Zeitstempel>_weight_entries.sql` mit der Tabelle `weight_entries`, ihrer Zugriffsregel, der Hilfsfunktion „ab 16“, der Speicherfunktion und der neuen Spalte `show_weight_in_nav` an `profiles`.
- **Namen der Umgebungsvariablen:** keine.
- **Pakete:** keine neuen (Kurve als eigenes SVG).
- **Routen, Rahmen und externe Dienste:** neu `/gewicht` (Parameter `zeitraum`); geändert: Navigation (bedingter sechster Eintrag), `/profil` (Abschnitt „Gewicht“), Datenexport. Keine externen Dienste.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-1, AC-2, AC-14 | Navigation, Seite und Aktionen zeigen bzw. erlauben „Gewicht“ nur bei „ab 16“ und eingeschalteter Einstellung; sonst „Seite nicht gefunden“ ohne Altershinweis. | Eine reine Regel „Gewicht sichtbar“, genutzt von Layout, Seite und Actions; Datenbank lässt Einträge nur für „ab 16“ zu. | Unit-Tests der Regel; Komponententests der Navigation (fünf/sechs); Live-Prüfung mit Personen „12–15“ und „ab 16“ (direkter Aufruf und direkter Datenbankzugriff). |
| AC-5, EC-5 | Gewicht 30,0–300,0 mit höchstens einer Nachkommastelle; Datum nicht nach „heute“ in der Gerätezeitzone. | Schema im Browser und in der Action; Datenbank prüft Wertebereich und Datum mit einem Tag Toleranz für Zeitzonen. | Tabellen-Tests (Komma/Punkt, 30,0/300,0, 72,45, Zukunft, Zeitzonengrenze). |
| AC-6, EC-1 | Ein Eintrag pro Person und Tag; gleichzeitiges Speichern ergibt nie zwei. | Eindeutigkeit (Person, Tag) in der Datenbank; Speicherfunktion fügt ein oder ersetzt nur mit „Ersetzen“; sonst Antwort „schon vorhanden“ mit Wert. | Datenbank-Live-Prüfung: zwei Sitzungen, gleicher Tag. |
| AC-11, EC-3 | Datum eines Eintrags ändern, auch auf einen belegten Tag; gelöschter Eintrag → „Diesen Eintrag gibt es nicht mehr.“ | Speicherfunktion verschiebt in einem Schritt (neuer Tag schreiben, alter Tag entfernen) oder antwortet „gibt es nicht mehr“. | Live-Prüfung; Unit-Tests der Action-Ergebnisse. |
| EC-2 | Mehrfaches Tippen ergibt genau eine Wirkung. | Knöpfe während der Aktion gesperrt; gleicher Wert am selben Tag gilt als gespeichert (keine Rückfrage); Löschen und „Alle löschen“ sind wiederholbar ohne Fehler. | Komponententest Sperre; Live-Prüfung Doppelaufruf. |
| AC-7, AC-8 | Kurve nur ab zwei Einträgen im Zeitraum; Zeitraum-Wahl nicht nur über Farbe. | Reine Zeitraum- und Punktberechnung; Links mit `aria-current` und Häkchen. | Unit- und Komponententests. |
| EC-4 | Fehler beim Speichern/Löschen → Meldung, Eingaben bleiben. | Actions fangen Fehler und antworten mit „Fehler“; Dialog bleibt offen. | Komponententest mit fehlschlagender Action. |
| EC-6 | Ladefehler sieht nicht wie ein leerer Verlauf aus. | Lesefunktionen werfen; Fehlerzustand des Rahmens. | Daten-Test. |
| EC-7 | 375 px (und 320 px laut PROJ-2 EC-4) mit sechs Einträgen. | Gleichmäßige Spalten, 12 px Beschriftung mit Trennstellen, mindestens 48 px Höhe. | Komponententest der Klassen/Trennstellen; Sichtprüfung im Browser. |

**Fehlerarten an den Schnittstellen:**
- **Erwartet:** ungültige Eingabe (Feldhinweise), „schon vorhanden“ (Rückfrage), „gibt es nicht mehr“ (Meldung, Verlauf neu laden), kein Zugang (Seite: „Seite nicht gefunden“; Action: Ablehnung ohne Hinweis auf das Alter).
- **Unerwartet:** Datenbankfehler → Action antwortet „Das hat gerade nicht geklappt. Bitte versuch es noch einmal.“; Lesefehler der Seite → Fehlerzustand mit „Erneut versuchen“. Protokolliert wird nur der Fehlercode, nie Gewicht oder Datum.

## Datenmodell

**Neue Tabelle `weight_entries` (persönliche Daten)**
- `user_id`: UUID, Pflicht; verweist auf das Konto und wird mit dem Konto gelöscht. Nicht änderbar.
- `entry_date`: Kalendertag, Pflicht. Nicht später als der heutige Tag in UTC plus ein Tag (Toleranz für Zeitzonen; die genaue Prüfung „nicht in der Zukunft“ macht die App mit der Gerätezeitzone).
- `weight_kg`: Dezimalzahl mit genau einer Nachkommastelle, Pflicht, 30,0 bis 300,0.
- `created_at`, `updated_at`: Zeitpunkte, automatisch (`updated_at` bei jeder Änderung).
- **Primärschlüssel:** (`user_id`, `entry_date`) — ein Eintrag pro Person und Tag (AC-6, EC-1). Ein Eintrag wird über sein Datum angesprochen; eine eigene ID ist nicht nötig.

**Neue Spalte an `profiles` (PROJ-1/PROJ-3)**
- `show_weight_in_nav`: Wahrheitswert, Pflicht, Standard „ja“. Gilt für das Konto, auf allen Geräten.

**Automatik in der Datenbank:**
- **Hilfsfunktion „ab 16“** (privat, liest nur die eigene Altersgruppe aus `profiles`): Grundlage der Zugriffsregel.
- **Speicherfunktion „Eintrag speichern“** (läuft mit den Rechten der Person, also unter den Zugriffsregeln; in einer Transaktion). Eingaben: Datum, Gewicht, optional das bisherige Datum (beim Ändern), „Ersetzen“ ja/nein. Ergebnis:
  - **gespeichert** — kein Eintrag am Zieltag, oder dort steht schon derselbe Wert, oder „Ersetzen“ war gewählt. Beim Ändern mit anderem Datum wird der alte Tag im selben Schritt entfernt.
  - **schon vorhanden** mit dem dort gespeicherten Wert — am Zieltag steht ein anderer Wert und „Ersetzen“ war nicht gewählt. Nichts wird geändert.
  - **gibt es nicht mehr** — beim Ändern existiert der Eintrag am bisherigen Datum nicht mehr. Nichts wird geändert.

**Zugriff (RLS, nur `authenticated` mit aktiver Sitzung über `private.has_active_session`):**
- `weight_entries`: Lesen, Anlegen, Ändern und Löschen nur eigener Zeilen **und** nur, wenn die eigene Altersgruppe „ab 16“ ist (AC-2, AC-15).
- Spaltenrechte: Anlegen nur `user_id`, `entry_date`, `weight_kg`; Ändern nur `entry_date`, `weight_kg`; Lesen und Löschen eigener Zeilen.
- Speicherfunktion: ausführbar nur für `authenticated`.
- `profiles.show_weight_in_nav`: änderbar durch die Person selbst (zusätzliches Spaltenrecht; bestehende Regel „nur eigene Zeile“ gilt).
- **`anon`:** keinerlei Rechte.

**Aufbewahrung:** Einträge bis die Person sie löscht (einzeln oder alle) oder ihr Konto löscht (AC-12, AC-13, AC-17). Ausblenden löscht nichts (AC-14). Eine kürzere Frist oder eine Einwilligung klärt `/dsgvo PROJ-11` vor dem ersten Deploy.

**Indizes:** der Primärschlüssel (Person, Tag) deckt Liste, Zeitraum und Eindeutigkeit ab.

**Datensparsamkeit:** keine Uhrzeit, keine Notiz, keine Größe, kein Geschlecht, keine Einheit (immer kg).

**Datenmodell der App:** „Gewichtseintrag“ wird von „Spätere Ergänzungen“ zu „Dinge“ verschoben; das Kurzprofil nennt die Einstellung „Gewicht in der Navigation zeigen“ (`docs/data-model.md`).

## Abläufe und Zugriffe

| Ablauf | Zugang | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Rahmen laden | Angemeldet. | Bereiche mit „Gewicht“, wenn die Regel gilt; bei Lesefehler ohne. | AC-1, AC-2, AC-14 |
| `/gewicht` laden | Angemeldet, Angaben vollständig (sonst Einstieg), Regel gilt (sonst „Seite nicht gefunden“). | Einträge neueste zuerst; Kurve für den Zeitraum; leer → leerer Zustand. | AC-3, AC-7 bis AC-10, EC-6 |
| Eintragen / Ändern (`saveWeightEntry`) | Regel gilt; gültige Eingabe. | gespeichert → Verlauf neu; schon vorhanden → Rückfrage, danach mit „Ersetzen“; gibt es nicht mehr → Meldung, Verlauf neu; ungültig → Feldhinweise; Fehler → Meldung, Eingaben bleiben. | AC-4 bis AC-6, AC-11, EC-1 bis EC-5 |
| Eintrag löschen (`deleteWeightEntry`) | Regel gilt; eigenes Datum. | Gelöscht (oder schon weg) → Verlauf neu; Fehler → Meldung. | AC-12, EC-2, EC-4 |
| Alle löschen (`deleteAllWeightEntries`) | Regel gilt. | Alle eigenen Einträge weg → leerer Zustand; Fehler → Meldung. | AC-13, EC-2, EC-4 |
| Einstellung setzen (`setWeightVisibility`) | Angemeldet, „ab 16“. | Gespeichert → Rahmen und Profil neu; Fehler → Schalter zurück, Meldung. | AC-14 |
| Datenexport (PROJ-1) | Angemeldet. | Abschnitt `weightEntries` (Datum, kg; älteste zuerst) und `showWeightInNav` im Profil — auch bei ausgeblendetem Bereich. | AC-16 |
| Konto löschen (PROJ-1) | Angemeldet. | Einträge werden mit dem Konto gelöscht. | AC-17 |

## Abhängigkeiten

- Vorhanden: Zod; shadcn `dialog`, `alert-dialog`, `input`, `label`, `button`, `alert`, `switch`; `lucide-react`; `PageHeader`; `TimeZoneSync` und Zeitzonenregeln aus PROJ-8.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Keine.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Primärschlüssel (Person, Tag); Eintrag über das Datum angesprochen | Garantiert „ein Eintrag pro Tag“ auch bei zwei Geräten gleichzeitig (EC-1); keine zusätzliche ID nötig. | Eigene UUID plus eindeutiger Index | Datum ändern heißt „Eintrag verschieben“; das übernimmt die Speicherfunktion. | 2026-11-25 |
| Speichern über eine Datenbankfunktion mit den Rechten der Person | Rückfrage „schon vorhanden“, Ersetzen und Verschieben passieren atomar (AC-6, AC-11, EC-3); Zugriffsregeln gelten weiter. | Mehrere Einzelabfragen aus der Action | Etwas Logik in der Migration. | 2026-11-25 |
| Gleicher Wert am selben Tag gilt als gespeichert | Doppeltipps und Wiederholungen nach Verbindungsabbruch lösen keine sinnlose Rückfrage aus (EC-2). | Immer nachfragen | — | 2026-11-25 |
| Zugriffsregel prüft zusätzlich die Altersgruppe „ab 16“ | Auch bei Umgehung der App können 12- bis 15-Jährige nichts speichern oder lesen (AC-2, SEC-03). | Nur Prüfung in App und Action | Eine kleine Abfrage je Zugriff über eine Hilfsfunktion. | 2026-11-25 |
| Ausblenden nur in der App, nicht in der Datenbank | Ausgeblendete Einträge bleiben erhalten und erscheinen im Export (AC-14, AC-16). | Auch die Datenbank sperrt bei ausgeblendetem Bereich | Wer die App umgeht, erreicht eigene Einträge trotz Ausblenden — unkritisch, es sind die eigenen. | 2026-11-25 |
| Einstellung als Spalte an `profiles`, gilt für das Konto | Produktentscheidung „auf allen Geräten“; liegt bei den anderen Kontoangaben und im Export. | Gerätespeicher wie die Darstellung (PROJ-2) | Ein Feld mehr am Profil. | 2026-11-25 |
| Rahmen bekommt die Bereiche vom geschützten Layout | Rahmen-Bausteine bleiben unabhängig von Features; eine Regel entscheidet überall gleich (PROJ-2 AC-19). | Navigation liest selbst Profil-Daten | Eine kleine Profil-Abfrage pro Seitenaufruf, pro Anfrage zwischengespeichert. | 2026-11-25 |
| Lesefehler im Layout → Rahmen ohne „Gewicht“ | Ein Fehler beim Zugang darf nicht jede Seite brechen. | Fehlerzustand für alle Seiten | „Gewicht“ fehlt kurzzeitig in der Navigation. | 2026-11-25 |
| Unbefugt oder ausgeblendet → allgemeines „Seite nicht gefunden“ | Nicht unterscheidbar von einer unbekannten Adresse; kein Altershinweis (AC-2). | Eigene Meldung des Bereichs | — | 2026-11-25 |
| Kurve als eigenes, schlichtes SVG | Eine Linie mit Punkten reicht; keine Animation, keine wertenden Farben, kein neues Paket. | shadcn Chart (Recharts) | Keine Tooltips oder Zoom — bewusst. | 2026-11-25 |
| Zeitraum in der Adresse (`?zeitraum=`) | Bleibt beim Neuladen und nach Dialogen erhalten; wie der Filter in PROJ-9. | Nur Browser-Zustand | — | 2026-11-25 |
| „Heute“ über das vorhandene Zeitzonen-Cookie aus PROJ-8 | Gleiche Logik wie im Wochenblick (EC-5); die Datenbank prüft nur grob mit einem Tag Toleranz. | Server-Zeit in UTC | Ohne Cookie gilt Europe/Berlin, bis der Abgleich es setzt. | 2026-11-25 |
| Anzeige immer mit einer Nachkommastelle („72,0 kg“) | Einheitliche Liste; Eingabe „72“ bleibt erlaubt. | Nachkommastelle nur bei Bedarf | — | 2026-11-25 |

## Offene Fragen

Keine neuen; siehe `spec.md` (insbesondere `/dsgvo PROJ-11` vor dem ersten Deploy).
