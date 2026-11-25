# PROJ-11 — Aufgaben: Gewichtsverlauf

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben. Änderungen an PROJ-1 und PROJ-2 sind als solche gekennzeichnet.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration:
  - Tabelle `weight_entries` mit Schlüssel (Person, Tag), Wertebereich 30,0–300,0 mit einer Nachkommastelle, Datum höchstens UTC-heute + 1 Tag, `updated_at` automatisch, Löschen mit dem Konto
  - Hilfsfunktion „ab 16“; Zugriffsregel „eigene Zeilen, aktive Sitzung, ab 16“ für Lesen, Anlegen, Ändern, Löschen; Spaltenrechte; `anon` ohne Rechte
  - Speicherfunktion (Rechte der Person, eine Transaktion) mit den Ergebnissen gespeichert · schon vorhanden (mit Wert) · gibt es nicht mehr; gleicher Wert am selben Tag gilt als gespeichert
  - Spalte `show_weight_in_nav` an `profiles` (Pflicht, Standard „ja“) mit Recht zum Ändern
  - lokal anwenden

  · files: `supabase/migrations/<Zeitstempel>_weight_entries.sql` · → AC-2, AC-6, AC-11, AC-14, AC-15, AC-17; EC-1, EC-3
- [x] T2 [P] Regeln und Eingabeprüfung:
  - Regel „Gewicht sichtbar“ (ab 16 und Einstellung an)
  - kg aus Text lesen (Komma oder Punkt, höchstens eine Nachkommastelle, 30,0–300,0); Anzeige „72,0 kg“
  - Datum „nicht in der Zukunft“ gegen „heute“ in der Gerätezeitzone
  - Zeiträume `1m`/`3m`/`1j` (Standard `3m`), Einträge eines Zeitraums, Kurvenpunkte; Texte
  - Schema mit Hinweisen je Feld; Zeitraum-Parameter
  - Tabellen-Tests

  · files: `src/features/weight/weight.rules.ts`, `src/features/weight/weight.rules.test.ts`, `src/features/weight/weight.schema.ts`, `src/features/weight/weight.schema.test.ts` · → AC-1, AC-2, AC-4, AC-5, AC-7, AC-8, AC-9, AC-14; EC-5
- [x] T3 [P] Änderung PROJ-2, Navigationsliste: Eintrag „Gewicht“ (`/gewicht`) zwischen Wochenblick und Profil als bedingt; reine Funktion „Bereiche für diese Person“; Kurzbeschriftungen mit weichen Trennstellen bei sechs Einträgen; Waagen-Symbol; mit Test. · files: `src/components/shell/navigation.rules.ts`, `src/components/shell/navigation.rules.test.ts`, `src/components/shell/nav-icons.tsx` · → AC-1, AC-2; EC-7

## Stufe 2 — Daten und Rahmen

- [x] T4 [P] Datenzugriff: Zugang lesen (pro Anfrage zwischengespeichert); eigene Einträge neueste zuerst; Speicherfunktion aufrufen und Ergebnis übersetzen; einen Eintrag löschen; alle löschen; Einstellung setzen; Export lesen (älteste zuerst); Lesefehler werfen ohne Personendaten; mit Test. · files: `src/features/weight/weight.data.ts`, `src/features/weight/weight.data.test.ts` · → AC-2, AC-4, AC-6, AC-11, AC-12, AC-13, AC-14, AC-16; EC-1, EC-3, EC-6
- [x] T5 [P] Änderung PROJ-1, Exportregeln: Abschnitt `weightEntries` (Datum, kg) und `showWeightInNav` im Profil-Abschnitt; mit Test. · files: `src/features/account/account.rules.ts`, `src/features/account/account.rules.test.ts` · → AC-16
- [x] T6 [P] Änderung PROJ-2, Rahmen-Bausteine: Seitenleiste und untere Leiste bekommen die Bereiche von außen; Spaltenzahl nach Anzahl; bei sechs Einträgen 12 px mit Umbruch an Trennstellen, mindestens 48 px hoch; mit Tests. · files: `src/components/shell/app-shell.tsx`, `src/components/shell/desktop-nav.tsx`, `src/components/shell/mobile-nav.tsx`, `src/components/shell/navigation.test.tsx`, `src/components/shell/app-shell.test.tsx` · → AC-1; EC-7

## Stufe 3 — Aktionen und Export

- [x] T7 [P] Server Actions `saveWeightEntry`, `deleteWeightEntry`, `deleteAllWeightEntries`, `setWeightVisibility`: Sitzung, Schema und Zugang prüfen (Speichern/Löschen: „Gewicht sichtbar“; Einstellung: „ab 16“); Ergebnisse gespeichert · schon vorhanden · gibt es nicht mehr · ungültig · Fehler; `/gewicht` bzw. Rahmen neu laden; mit Test. · files: `src/features/weight/weight.actions.ts`, `src/features/weight/weight.actions.test.ts` · → AC-2, AC-4, AC-5, AC-6, AC-11, AC-12, AC-13, AC-14; EC-2, EC-3, EC-4
- [x] T8 [P] Änderung PROJ-1: Datenexport liest die Gewichtseinträge mit; mit Test. · files: `src/features/account/account.data.ts`, `src/features/account/account.data.test.ts` · → AC-16

## Stufe 4 — Bausteine der Ansicht

- [x] T9 [P] Kurve als SVG: Linie mit Punkten, Beschriftung nur kleinster/größter Wert und erstes/letztes Datum; keine Zielmarken, Trendpfeile, wertenden Farben oder Animation; für Screenreader verborgen; mit Test. · files: `src/features/weight/components/weight-chart.tsx`, `src/features/weight/components/weight-chart.test.tsx` · → AC-7, AC-8
- [x] T10 [P] Dialog „Eintragen“ / „Eintrag ändern“:
  - Datum (vorausgefüllt mit heute, höchstens heute) und Gewicht; Prüfung vor dem Senden mit Hinweisen je Feld
  - Rückfrage „Für diesen Tag gibt es schon einen Eintrag (<Wert> kg). Ersetzen?“ aus den geladenen Einträgen und aus der Serverantwort
  - „Diesen Eintrag gibt es nicht mehr.“; gesperrt während des Speicherns; Eingaben bleiben bei Fehler
  - mit Test

  · files: `src/features/weight/components/weight-entry-dialog.tsx`, `src/features/weight/components/weight-entry-dialog.test.tsx` · → AC-4, AC-5, AC-6, AC-11; EC-2, EC-3, EC-4, EC-5
- [x] T11 [P] Schalter „Gewicht in der Navigation zeigen“: sofort gespeichert, bei Fehler zurück mit Meldung; mit Test. · files: `src/features/weight/components/weight-visibility-switch.tsx`, `src/features/weight/components/weight-visibility-switch.test.tsx` · → AC-14

## Stufe 5 — Verlauf und Anschlüsse

- [x] T12 [P] Verlaufsansicht:
  - Zeitraum-Wahl als Links mit `aria-current` und Häkchen
  - Kurve oder „Zu wenige Einträge für eine Kurve.“
  - Liste neueste zuerst mit „Ändern“ und „Löschen“ (Bestätigung „Eintrag vom <Datum> löschen?“)
  - „Alle Einträge löschen“ mit Bestätigung; leerer Zustand mit „Eintragen“
  - gesperrt während Aktionen; Meldungen nahe der Aktion
  - mit Test

  · files: `src/features/weight/components/weight-view.tsx`, `src/features/weight/components/weight-view.test.tsx` · → AC-7, AC-8, AC-9, AC-10, AC-12, AC-13; EC-2, EC-3, EC-4
- [x] T13 [P] Anschlüsse: Das geschützte Layout liest den Zugang und reicht die Bereiche an den Rahmen (Lesefehler → ohne „Gewicht“); Profil-Abschnitt „Gewicht“ mit dem Schalter zwischen „Darstellung“ und „Passwort“, nur ab 16. · files: `src/app/(protected)/layout.tsx`, `src/app/(protected)/profil/page.tsx` · → AC-1, AC-2, AC-14

## Stufe 6 — Seite und Live-Prüfung

- [x] T14 Seite `/gewicht`:
  - im Gate für vollständige Angaben; lädt Zugang, Einträge und Zeitzonen-Cookie (mit `TimeZoneSync`); ohne „Gewicht sichtbar“ → allgemeines „Seite nicht gefunden“
  - Zeitraum aus `?zeitraum=` (Unbekanntes → `3m`); Lesefehler → Fehlerzustand des Rahmens
  - Anschließend Live-Prüfung gegen lokale Datenbank und Dev-Server: Person „12–15“ (Navigation, direkter Aufruf, direkter Datenbankzugriff), Person ab 16 mit unvollständigen Angaben, Ausblenden und Wiedereinblenden (auch zweite Sitzung), zwei Sitzungen am selben Tag, Verschieben auf belegten Tag, auf anderem Gerät gelöschter Eintrag, Doppelaufruf, Export, Kontolöschung; Sichtprüfung der unteren Leiste mit sechs Einträgen bei 375 px

  · files: `src/app/(protected)/(bereiche)/gewicht/page.tsx` · → AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-10, AC-11, AC-13, AC-14, AC-15, AC-16, AC-17; EC-1, EC-2, EC-3, EC-5, EC-6, EC-7

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Daten und Rahmen (2) → Aktionen und Export (3) → Bausteine der Ansicht (4) → Verlauf und Anschlüsse (5) → Seite und Live-Prüfung (6). Für Stufe 1 muss Docker laufen.
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden; keine Stufe hat mehr als drei `[P]`-Aufgaben.
- AC-2, AC-14 bis AC-17 und EC-1, EC-3 werden nach Stufe 6 zusätzlich live gegen die lokale Datenbank und den Dev-Server geprüft.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
