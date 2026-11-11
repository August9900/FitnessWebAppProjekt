# PROJ-1 — Aufgaben: Konto & Anmeldung (lokaler Prototyp)

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe, deshalb kann `/build` sie an einen eigenen Subagenten geben.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Innerhalb einer Stufe laufen die mit `[P]` markierten Aufgaben parallel. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> `[user]` = eine Einstellung, die nur der Nutzer vornehmen kann: `where:` statt `files:`, nie `[P]`, wird vom Nutzer abgehakt.
> `[user go-live]` = dasselbe, braucht aber die Produktionsumgebung. Diese Aufgaben blockieren weder `/build` noch `/qa`; `/deploy` erledigt und prüft sie.
> Die zurückgestellten Kriterien (Abschnitt „Zurückgestellt bis vor dem ersten Deploy“ in `spec.md`) haben bewusst keine Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlage

- [x] T1 [P] Lokale Auth-Konfiguration: E-Mail-Bestätigung bleibt aus, Mindestlänge 12 ohne Pflicht zu Zeichenarten, Code-Gültigkeit 600 s bei Codelänge 6, Mindestabstand 60 s zwischen Reset-Mails, Reset-Vorlage nur mit Code; die Grenzen in `[auth.rate_limit]` bleiben auf dem Standard. Platzhalter für `SUPABASE_SERVICE_ROLE_KEY` mit Hinweis auf `supabase start` dokumentieren. · files: `supabase/config.toml`, `supabase/templates/recovery.html`, `.env.local.example` · → AC-7, AC-8; EC-2
- [x] T2 [P] Migration: Tabelle `profiles` (Konto-ID als Primärschlüssel mit Löschweitergabe, Altersgruppe `12_15`/`16_plus`, Zeitstempel), Anlage-Trigger auf `auth.users`, der die Registrierung bei fehlender oder ungültiger Altersgruppe abbricht, Prüffunktion für aktive Sitzungen, RLS „eigene Zeile + aktive Sitzung“ nur zum Lesen. · files: `supabase/migrations/20261111120000_account_profiles.sql` · → AC-2, AC-3, AC-12, AC-13, AC-14, AC-16; EC-1, EC-5
- [x] T3 [P] Zod-Schemas (Registrierung, Anmeldung, Reset-Anforderung, Reset-Abschluss, Passwortwechsel, Löschbestätigung; Passwort 12–72 Zeichen und höchstens 72 Byte; Altersgruppen) und reine Regeln (Auth-Fehlercode → neutraler Meldungsschlüssel, Aufbau des Exportobjekts) mit Unit-Tests. · files: `src/features/account/account.schema.ts`, `src/features/account/account.schema.test.ts`, `src/features/account/account.rules.ts`, `src/features/account/account.rules.test.ts` · → AC-3, AC-6, AC-7, AC-15, AC-21
- [x] T4 [P] Sitzungserneuerung und Umleitung nicht angemeldeter Aufrufe geschützter Pfade nach `/anmelden` im Proxy; `server-only`-Admin-Client mit Service-Role-Schlüssel. · files: `src/proxy.ts`, `src/lib/supabase/admin.ts` · → AC-1, AC-12, AC-16
- [ ] T5 [user] Lokale Werte aus `supabase start` selbst in `.env.local` eintragen. · where: Ausgabe von `supabase start` (bzw. `supabase status`) → `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` · → AC-16

## Stufe 2 — Serverlogik

- [x] T6 [P] Datenmodul (`server-only`): aktuelle Person per Server-Abgleich feststellen (`requireUser` und eine optionale Variante für öffentliche Seiten), eigenes Kurzprofil lesen, Exportdaten sammeln, aktuelles Passwort zustandslos prüfen, ohne die laufende Sitzung zu berühren, Konto über den Admin-Zugang löschen; mit Test. · files: `src/features/account/account.data.ts`, `src/features/account/account.data.test.ts` · → AC-1, AC-12, AC-13, AC-15, AC-16; EC-5
- [x] T7 [P] Öffentliche Auth-Actions: Registrieren (sofort angemeldet, neutrale Meldung bei vergebener Adresse), Anmelden (einheitliche Fehlermeldung, nur interne Weiterleitungsziele), Abmelden (nur aktuelles Gerät), Reset anfordern (immer gleiche Antwort), Reset abschließen (Code prüfen, Passwort setzen, andere Sitzungen beenden); Mindestantwortzeit 800 ms für Anmelden und Reset-Anforderung; keine Zugangsdaten in Protokollen; mit Test. · files: `src/features/account/auth.actions.ts`, `src/features/account/auth.actions.test.ts` · → AC-2, AC-5, AC-6, AC-8, AC-11, AC-21; EC-1, EC-2, EC-3, EC-4

## Stufe 3 — Geschützte Serverlogik

- [x] T8 [P] Konto-Actions: Passwort ändern (aktuelles Passwort prüfen, neues setzen, alle anderen Sitzungen beenden) und Konto löschen (aktuelles Passwort und „LÖSCHEN“, Löschung über das Datenmodul, Cookies leeren, Weiterleitung nach `/` mit Hinweis; bei Fehler unverändert mit Wiederholungsmöglichkeit); mit Test. · files: `src/features/account/account.actions.ts`, `src/features/account/account.actions.test.ts` · → AC-7, AC-9, AC-16, AC-21; EC-5
- [x] T9 [P] Download-Endpunkt für den Datenexport mit eigener Sitzungsprüfung; liefert `pulse-daten-<Datum>.json` oder bei Fehler keine Datei. · files: `src/app/(protected)/profil/export/route.ts` · → AC-15

## Stufe 4 — Oberfläche

- [x] T10 [P] Registrierung: Formular mit E-Mail, Passwort und Altersgruppe (12–15 / ab 16 / unter 12), Hinweis zur Altersgrenze ohne Absenden, Fehler direkt am Feld; Seite leitet angemeldete Personen nach `/heute` weiter. · files: `src/features/account/components/register-form.tsx`, `src/app/(auth)/registrieren/page.tsx` · → AC-2, AC-3, AC-21; EC-1, EC-4
- [x] T11 [P] Anmeldung: Formular mit Link „Passwort vergessen“, neutrale Fehlermeldung; Seite leitet angemeldete Personen nach `/heute` weiter. · files: `src/features/account/components/login-form.tsx`, `src/app/(auth)/anmelden/page.tsx` · → AC-5, AC-6, AC-21
- [x] T12 [P] Passwort vergessen: eine Seite mit zwei Schritten, die Adresse bleibt im Formularzustand und gelangt nie in die URL; „Neuen Code anfordern“ bei falschem oder abgelaufenem Code. · files: `src/features/account/components/reset-password-form.tsx`, `src/app/(auth)/passwort-vergessen/page.tsx` · → AC-6, AC-8, AC-21; EC-2, EC-3
- [x] T13 [P] Profil, Abschnitt „Konto“: Kontodaten (E-Mail, Altersgruppe, Konto seit), Passwortwechsel, Export-Button, Lösch-Dialog mit aktuellem Passwort und „LÖSCHEN“, Abmelden. · files: `src/features/account/components/password-change-form.tsx`, `src/features/account/components/export-button.tsx`, `src/features/account/components/delete-account-dialog.tsx`, `src/app/(protected)/profil/page.tsx` · → AC-9, AC-11, AC-13, AC-15, AC-16, AC-21
- [x] T14 [P] Einhängen in die App: Startseite (angemeldet → `/heute`, sonst Links zu Anmelden und Registrieren, Hinweis nach Kontolöschung), `lang="de"` und Titel „PULSE“, geschütztes Layout mit `requireUser`, Platzhalter für `/heute` mit Link zum Profil und Abmelden. · files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/(protected)/layout.tsx`, `src/app/(protected)/heute/page.tsx` · → AC-1, AC-5, AC-11, AC-12

## Stufe 5 — Vor dem ersten Deploy

Diese Aufgaben brauchen die gehostete Umgebung. Sie blockieren weder `/build` noch `/qa`. Vorher werden die zurückgestellten Kriterien über `/refine PROJ-1` wieder aufgenommen.

- [ ] T15 [user go-live] Auth-Einstellungen des gehosteten Projekts angleichen. · where: `supabase link` + `supabase config push` oder Supabase → Authentication → Sign In / Providers → Email; Mindestlänge 12, Code-Gültigkeit 10 Minuten, Reset-Vorlage nur mit Code, E-Mail-Bestätigung gemäß der dann gültigen Spec · → AC-7, AC-8
- [ ] T16 [user go-live] E-Mail-Dienst und Adressen einrichten. · where: Supabase → Authentication → SMTP Settings und URL Configuration; Versanddienst, Absender, Produktionsdomain als Site URL · → AC-8
- [ ] T17 [user go-live] Service-Role-Schlüssel beim Hoster hinterlegen. · where: Supabase → Project Settings → API → Umgebungsvariablen des Hosters: `SUPABASE_SERVICE_ROLE_KEY`, ohne `NEXT_PUBLIC_` · → AC-16

## Parallelisierung

- **Stufen sind Schranken.** Eine Stufe beginnt erst, wenn die vorherige vollständig integriert und gegen ihre AC-IDs geprüft ist: Grundlage (1) → Serverlogik (2, 3) → Oberfläche (4).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- **`[user]`-Aufgaben werden nie gebaut.** `/build` nennt bei T5 die Übergabe (was, wo, welcher Wert) und macht weiter; den Haken setzt der Nutzer. `[user go-live]` bleibt bis `/deploy` offen.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
