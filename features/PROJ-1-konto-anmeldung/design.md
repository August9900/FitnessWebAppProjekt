# PROJ-1 — Technisches Design: Konto & Anmeldung (lokaler Prototyp)

> Technische Umsetzung der aktiven Kriterien in `spec.md`. Der Prototyp läuft ausschließlich gegen lokales Supabase mit Testdaten. Die Kriterien unter „Zurückgestellt bis vor dem ersten Deploy“ werden hier bewusst **nicht** gebaut. Vor dem Deploy werden sie über `/refine PROJ-1` wieder aufgenommen und dieses Design wird erweitert.

## Komponentenstruktur

```text
Öffentlicher Konto-Zugang (ohne App-Navigation)
├── Startseite „/“: angemeldet → weiter zu „Heute“; sonst Links zu Anmelden und Registrieren
├── Registrieren: E-Mail, Passwort, Altersgruppe (12–15 / ab 16 / unter 12)
│   └── „unter 12“ → verständlicher Hinweis zur Altersgrenze, kein Absenden an Supabase
├── Anmelden: E-Mail, Passwort, Link „Passwort vergessen“
└── Passwort vergessen (eine Seite, zwei Schritte)
    ├── Schritt 1: E-Mail eingeben → neutrale Rückmeldung
    └── Schritt 2: Code aus der E-Mail + neues Passwort → Anmeldung mit neuem Passwort

Geschützter Bereich (nur mit gültiger Sitzung)
├── Heute: vorläufiger Platzhalter (Begrüßung, Link zum Profil, Abmelden)
│   └── PROJ-2 setzt den App-Rahmen darum, PROJ-6 füllt den Inhalt
└── Profil → Abschnitt „Konto“
    ├── Kontodaten: E-Mail (nur Anzeige), Altersgruppe, Konto seit
    ├── Passwort ändern: aktuelles Passwort, neues Passwort
    ├── Meine Daten herunterladen (Datei-Download)
    ├── Konto löschen: Dialog mit aktuellem Passwort und ausdrücklicher Bestätigung
    └── Abmelden
```

Die Kontoansichten bringen keine eigene Navigation mit. Der öffentliche Zugang ist eine schlichte, zentrierte Formularseite. Der geschützte Bereich bekommt vorerst ein minimales Layout, nur mit der Sitzungsprüfung. Seitenleiste und Mobilnavigation liefert später PROJ-2 in genau dieses Layout. Titel, Lade-, Fehler- und Bestätigungszustände folgen `docs/app-shell.md`, die Gestaltung folgt `docs/design-system.md`. Alle Texte sind kurz, deutsch und per Tastatur erreichbar.

## Code-Struktur

| Modul / Pfad | Verantwortung und Schnittstelle | Erlaubte Abhängigkeiten / wiederverwendet |
| --- | --- | --- |
| `src/features/account/account.schema.ts` | Zod-Schemas für Registrierung, Anmeldung, Reset-Anforderung, Reset-Abschluss, Passwortwechsel und Löschbestätigung, dazu die Altersgruppen-Werte und die Passwortregel. | Nur Zod (rein). |
| `src/features/account/account.rules.ts` | Reine Regeln: übersetzt Auth-Fehlercodes in feste, neutrale Meldungsschlüssel und baut aus Konto- und Profildaten das Exportobjekt. | Schema-Modul, Typen (rein). |
| `src/features/account/account.data.ts` | `server-only`. Stellt die aktuelle Person fest (`requireUser`), liest das eigene Kurzprofil, sammelt die Exportdaten, prüft ein aktuelles Passwort ohne Folgen für die laufende Sitzung und löscht das Konto über den Admin-Zugang. | `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, Rules. |
| `src/features/account/auth.actions.ts` | Server-Actions für Registrieren, Anmelden, Abmelden, Reset anfordern und Reset abschließen. Jede validiert auf dem Server, ruft Supabase Auth auf und liefert Feldfehler bzw. eine neutrale Meldung oder leitet weiter. | Schema, Rules, Data, Server-Client. |
| `src/features/account/account.actions.ts` | Server-Actions für Passwortwechsel und Kontolöschung, beide nur mit aktueller Sitzung und erneuter Passworteingabe. | Schema, Rules, Data. |
| `src/features/account/components/` | Client-Formulare: `register-form`, `login-form`, `reset-password-form` (zwei Schritte), `password-change-form`, `delete-account-dialog`, `export-button`. | shadcn/ui (`form`, `input`, `radio-group`, `button`, `alert`, `alert-dialog`, `card`), react-hook-form, Schema, Actions. |
| `src/lib/supabase/admin.ts` | `server-only`. Supabase-Client mit Service-Role-Schlüssel, ausschließlich für die Kontolöschung. | `@supabase/supabase-js`. |
| `src/proxy.ts` | Erneuert die Sitzung bei jeder Anfrage. Leitet nicht angemeldete Aufrufe geschützter Pfade nach `/anmelden` um. | `@supabase/ssr`. |
| `src/app/(auth)/{registrieren,anmelden,passwort-vergessen}/page.tsx` | Seiten des öffentlichen Zugangs. Eine bereits angemeldete Person wird nach `/heute` weitergeleitet. | Feature-Komponenten. |
| `src/app/(protected)/layout.tsx` | Prüft die Sitzung über `requireUser` und lässt nur angemeldete Personen ein. Hier hängt PROJ-2 später den App-Rahmen ein. | `account.data.ts`. |
| `src/app/(protected)/heute/page.tsx`, `src/app/(protected)/profil/page.tsx` | Platzhalter für „Heute“ und der Abschnitt „Konto“ im Profil. | Feature-Komponenten, `account.data.ts`. |
| `src/app/(protected)/profil/export/route.ts` | Download-Endpunkt für den Datenexport. Er prüft die Sitzung selbst, weil Layouts für Route-Handler nicht gelten. | `account.data.ts`, Rules. |
| `src/app/page.tsx`, `src/app/layout.tsx` | Startseite des Zugangs. Im Layout nur `lang="de"` und der Titel „PULSE“; der App-Rahmen bleibt bei PROJ-2. | Feature-Komponenten. |

Die Feature-Module importieren nie aus `src/app/`, und gemeinsame Module importieren nie aus `src/features/`. Unit-Tests liegen neben dem jeweiligen Modul.

## Footprint

- **Code und Tests:** `src/features/account/**`, `src/lib/supabase/admin.ts`, `src/proxy.ts`, die oben genannten Seiten unter `src/app/(auth)/` und `src/app/(protected)/`, `src/app/page.tsx` und `src/app/layout.tsx`. Unit-Tests liegen jeweils neben dem Modul.
- **Migrationen, Tabellen und Zugriffsregeln:** eine Migration `supabase/migrations/<Zeitstempel>_account_profiles.sql` mit der Tabelle `profiles`, der Prüffunktion für aktive Sitzungen, dem Anlage-Trigger auf `auth.users` und den RLS-Regeln. Dazu Einstellungen in `supabase/config.toml` und die Vorlage `supabase/templates/recovery.html`.
- **Namen der Umgebungsvariablen:** `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` (beide vorhanden) sowie neu `SUPABASE_SERVICE_ROLE_KEY` (nur serverseitig, ohne `NEXT_PUBLIC_`).
- **Pakete:** keine neuen.
- **Routen, Rahmen und externe Dienste:** `/`, `/registrieren`, `/anmelden`, `/passwort-vergessen`, `/heute`, `/profil` und `/profil/export`. Der lokale Mailpit-Posteingang dient für die Reset-Codes. Externe Dienste gibt es im Prototyp keine.

## Qualität und Fehlerverhalten

| AC/EC | Bedingung und Grenze | Mechanismus | Geplanter Nachweis |
| --- | --- | --- | --- |
| AC-6 | Anmeldung und Reset-Anforderung: identische Meldung für bekannte und unbekannte Adressen, vergleichbare Antwortzeit. | Feste Meldungsschlüssel aus `account.rules.ts`. Jede Antwort dieser beiden Actions wird auf **mindestens 800 ms** aufgefüllt, damit der Unterschied zwischen „Konto existiert“ und „existiert nicht“ nicht messbar wird. | Unit-Test der Fehlerzuordnung; QA vergleicht Meldung und grobe Antwortzeit für beide Fälle gegen das lokale Supabase. |
| AC-12, AC-9, AC-11 | Eine abgemeldete, widerrufene oder abgelaufene Sitzung bekommt sofort keinen Zugriff, auch wenn das alte Zugriffstoken noch nicht abgelaufen ist. | Seiten und Actions prüfen die Sitzung über einen Server-Abgleich mit Supabase Auth, nicht nur über das lokal lesbare Token. Die RLS-Regeln verlangen zusätzlich, dass die Sitzungs-ID des Tokens noch als aktive Sitzung existiert. | QA: nach Abmeldung bzw. Passwortwechsel mit dem alten Token eine direkte Datenanfrage stellen → keine Daten. |
| EC-1, EC-4 | Gleichzeitige oder wiederholte Registrierung derselben Adresse ergibt höchstens ein Konto. | Supabase Auth erzwingt eindeutige E-Mail-Adressen. Das Kurzprofil hat die Konto-ID als eindeutigen Schlüssel und entsteht in derselben Transaktion wie das Konto. | QA: zwei parallele Registrierungen → ein Konto, ein Profil. |
| EC-5, AC-16 | Löschung und gleichzeitige Anmeldung auf einem zweiten Gerät. | Die Löschung entfernt das Auth-Konto in einem einzigen Schritt. Profil und Sitzungen hängen per Fremdschlüssel daran und verschwinden mit. Danach scheitert jede Anmeldung, und alte Tokens werden durch die Sitzungsprüfung in RLS abgewiesen. | QA: nach der Löschung Anmeldung und direkte Datenanfrage mit altem Token → beides abgewiesen. |

**Fehler an den Schnittstellen:**
- **Erwartete Ablehnung (Validierung, Altersgrenze, zu kurzes Passwort, falscher Code):** Die Action liefert ein Ergebnis mit Feldfehlern bzw. einem festen Meldungsschlüssel. Die Formulare zeigen den Fehler direkt am Feld (AC-21), es wird keine Ausnahme geworfen.
- **Auth-Ablehnung (falsche Zugangsdaten, keine Sitzung):** Die Prüfung schlägt geschlossen fehl, die Meldung ist neutral, geschützte Seiten leiten nach `/anmelden` um.
- **Ausfall von Supabase (nicht erreichbar, Zeitüberschreitung):** Die Meldung lautet „Gerade nicht erreichbar, bitte erneut versuchen“. Es gibt keinen automatischen erneuten Versuch, weil Registrierung und Mailversand nicht folgenlos wiederholbar sind. Ein Mailfehler beim Reset wird nicht als Erfolg ausgegeben (EC-3).
- **Unerwarteter Fehler:** Er geht an die Next.js-Fehlergrenze, die eine sichere Ersatzansicht zeigt. Die Action protokolliert ihn einmal, mit Fehlercode, ohne E-Mail, Passwort oder Code.

## Datenmodell

| Bestand | Felder und Regeln | Eigentum und Aufbewahrung |
| --- | --- | --- |
| Auth-Konto (von Supabase verwaltet) | `id` (UUID, eindeutig), `email` (gültig, normalisiert, eindeutig), Passwort-Hash (nur Supabase), `created_at`, `last_sign_in_at`. Bei der Registrierung wird die Altersgruppe als Metadatum `age_band` mitgegeben; der Anlage-Trigger liest sie aus. | Gehört genau einer Person. Bleibt bis zur ausdrücklich bestätigten Löschung bestehen. |
| Kurzprofil `profiles` | `user_id`: UUID, Primärschlüssel, Pflicht, verweist auf genau ein Auth-Konto und wird mit ihm gelöscht. `age_band_at_signup`: Text, genau `12_15` oder `16_plus`, Pflicht. `created_at` und `updated_at`: Zeitpunkte, Pflicht, vom System gesetzt. Fachliche Felder ergänzt erst PROJ-3. E-Mail und Passwort werden nicht kopiert. | Gehört ausschließlich dem verknüpften Konto. Es entsteht genau eine Zeile pro Konto, sie wird mit dem Konto gelöscht. Die Altersgruppe ist eine Selbstauskunft bei der Registrierung. |
| Sitzungen und Reset-Codes (von Supabase verwaltet) | Jede Sitzung hat eine ID und einen Ablaufzeitpunkt. Reset-Codes sind 6-stellig, nur einmal verwendbar und 10 Minuten gültig. | Supabase räumt abgelaufene Einträge selbst auf. Abmelden, Passwortwechsel und Löschung widerrufen die betroffenen Sitzungen. |

**Anlage des Profils:** Ein Trigger nach dem Anlegen eines Auth-Kontos erzeugt in derselben Transaktion genau ein Profil. Fehlt die Altersgruppe oder ist sie ungültig, bricht der Trigger mit einem Fehler ab, und das Konto entsteht gar nicht. Das gilt auch für direkte Anfragen an Supabase Auth, die das Formular umgehen (AC-3, AC-13). Den Wert „unter 12“ fängt bereits das Formular ab; er wird nie gesendet oder gespeichert.

**Zugriffsregeln (RLS):** RLS ist auf `profiles` eingeschaltet. Lesen darf nur die Eigentümerin oder der Eigentümer der Zeile, und nur, solange die Sitzungs-ID des Tokens noch als aktive Sitzung existiert. Diese Prüfung übernimmt eine eng begrenzte Datenbankfunktion, die nur den Sitzungsbestand abfragt. Für normale Nutzende gibt es keine Regeln zum Anlegen, Ändern oder Löschen, weil im Prototyp nichts davon über die App geschieht. PROJ-3 ergänzt eine Änderungsregel nach demselben Muster. Jede spätere persönliche Tabelle übernimmt die Regel „eigene Zeile + aktive Sitzung“ und hängt mit Löschweitergabe am Auth-Konto (AC-14, AC-16).

## Abläufe und Zugriffe

| Ablauf | Zugang und Prüfung | Ergebnis und Fehlerverhalten | Bezug |
| --- | --- | --- | --- |
| Registrieren | Öffentlich, per POST über eine Server-Action. Zod prüft E-Mail, Passwort (12–72 Zeichen, höchstens 72 Byte) und Altersgruppe. „Unter 12“ wird ohne Supabase-Aufruf abgelehnt. | Neues Konto mit leerem Kurzprofil, die Person ist sofort angemeldet und landet auf `/heute`. Ist die Adresse vergeben: „Mit dieser E-Mail-Adresse ist keine Registrierung möglich. Wenn du schon ein Konto hast, melde dich an.“ | AC-2, AC-3, AC-7, AC-13, AC-21; EC-1, EC-4 |
| Anmelden | Öffentlich, per POST über eine Server-Action, Zod-Prüfung. | Bei Erfolg Sitzung und Weiterleitung nach `/heute` bzw. zur ursprünglich aufgerufenen geschützten Seite, sofern das ein interner Pfad ist. Bei Fehler immer: „E-Mail oder Passwort stimmen nicht.“ Mindestantwortzeit 800 ms. | AC-5, AC-6, AC-21 |
| Abmelden | Nur mit Sitzung, per POST. | Die aktuelle Sitzung endet (nur dieses Gerät), danach geht es zu `/anmelden`. | AC-11 |
| Passwort zurücksetzen | Öffentlich. Schritt 1: Adresse eingeben; Supabase verschickt einen 6-stelligen Code und keinen Link. Schritt 2: Adresse (aus Schritt 1 im Formularzustand gehalten), Code und neues Passwort. | Schritt 1 antwortet immer: „Falls ein Konto existiert, haben wir dir einen Code geschickt.“ (mindestens 800 ms). Schritt 2: Code prüfen → neues Passwort setzen → alle anderen Sitzungen beenden → angemeldet weiter nach `/heute`. Ein falscher, abgelaufener oder verbrauchter Code ändert nichts; die Person kann einen neuen anfordern. | AC-6, AC-7, AC-8, AC-21; EC-2, EC-3 |
| Passwort ändern | Nur mit Sitzung. Das aktuelle Passwort wird über einen separaten, zustandslosen Auth-Aufruf geprüft, dessen Hilfssitzung sofort wieder beendet wird; die laufende Sitzung bleibt unberührt. | Neues Passwort gilt, alle **anderen** Sitzungen enden. Ist das aktuelle Passwort falsch, kommt ein Feldfehler und das alte Passwort bleibt gültig. | AC-7, AC-9, AC-21 |
| Geschützte Seiten und Daten | Der Proxy erneuert die Sitzung. Layout, Actions und der Export-Endpunkt fragen die aktuelle Person per Server-Abgleich ab. Die Datenbank prüft zusätzlich Eigentum und aktive Sitzung. | Ohne gültige Sitzung kein Inhalt und keine Daten, stattdessen Weiterleitung nach `/anmelden`. | AC-1, AC-12, AC-14 |
| Daten exportieren | Nur mit Sitzung, Download über `/profil/export`. | Eine JSON-Datei `pulse-daten-<Datum>.json` mit Konto-ID, E-Mail, Kontozeitpunkten, Altersgruppe und Profilzeitpunkten. Passwort-Hash, Tokens und fremde Daten fehlen. Spätere Features ergänzen ihre Daten in diesem Export. Bei einem Fehler wird keine Datei ausgeliefert, sondern eine Fehlermeldung angezeigt. | AC-15 |
| Konto löschen | Nur mit Sitzung, aktuellem Passwort (Prüfung wie beim Passwortwechsel) und Eingabe des Worts „LÖSCHEN“ im Dialog. | Das Auth-Konto wird über den Admin-Zugang gelöscht; Profil und alle Sitzungen verschwinden mit. Danach werden die Cookies geleert und die Person landet auf `/` mit dem Hinweis „Dein Konto wurde gelöscht.“ Schlägt das fehl, bleibt alles unverändert, es erscheint eine Fehlermeldung, und ein erneuter Versuch ist möglich. | AC-16; EC-5 |

Alle Formulare mit Zugangsdaten senden per POST über Server-Actions. Kein Passwort, Code oder keine E-Mail-Adresse gelangt in eine URL (AC-21, SEC-05). Weiterleitungsziele werden nur als interne Pfade akzeptiert.

## Schutz gegen automatisierte Versuche — dokumentierte Ausnahme SEC-04

| Feld | Inhalt |
| --- | --- |
| Kontrolle | SEC-04: Begrenzung von Zugangsversuchen pro Konto und pro Quelle, Bot-Prüfung, Prüfung kompromittierter Passwörter. |
| Umfang | PROJ-1, nur der lokale Prototyp (lokales Supabase, Testdaten, nicht öffentlich erreichbar). |
| Grund | Der Prototyp soll schnell lauffähig sein. Die Spezifikation stellt AC-17 bis AC-20 und den Leak-Teil von AC-7 zurück (Produktentscheidung vom 2026-11-11). |
| Freigabe | Durch die Nutzerin bzw. den Nutzer im `/refine PROJ-1` vom 2026-11-11. |
| Ausgleichende Maßnahmen | Ausschließlich lokaler Betrieb mit Testdaten. Die eingebauten Supabase-Grenzen pro IP bleiben auf den Standardwerten aktiv (30 Anmeldungen und Registrierungen sowie 30 Code-Prüfungen pro 5 Minuten). Neutrale Meldungen mit Mindestantwortzeit. Mindestlänge 12 Zeichen. |
| Bekannte Grenze | Weil Server-Actions Supabase Auth vom Next.js-Server aus aufrufen, sieht Supabase nur diese eine IP. Die eingebauten Grenzen pro IP wirken dadurch für die ganze App gemeinsam. Lokal ist das unkritisch, für einen öffentlichen Betrieb aber ungeeignet. |
| Überprüfung | Spätestens vor dem ersten Deploy bzw. vor jeder öffentlich erreichbaren Umgebung. `/refine PROJ-1` nimmt die zurückgestellten Kriterien wieder auf, `/architecture` entwirft den Schutz neu. `/qa` wertet ihr Fehlen im Prototyp nicht als Bug; `/deploy` darf ohne ihre Umsetzung nicht veröffentlichen. |

## Lokale Konfiguration (wird durch `/build` gesetzt)

`supabase/config.toml`:
- E-Mail-Bestätigung bei der Registrierung bleibt **aus**.
- Mindestlänge des Passworts **12**, keine Pflicht zu bestimmten Zeichenarten.
- Gültigkeit der E-Mail-Codes **600 s**, Codelänge 6.
- Mindestabstand zwischen zwei Reset-Mails **60 s**.
- Vorlage für die Reset-Mail auf `supabase/templates/recovery.html`; sie enthält nur den Code und keinen Link.
- Die übrigen Werte, auch die Grenzen in `[auth.rate_limit]`, bleiben auf dem Standard.

`.env.local.example`: Platzhalter für `SUPABASE_SERVICE_ROLE_KEY` mit dem Hinweis, dass `supabase start` den Wert ausgibt. Den echten lokalen Wert trägt die Nutzerin bzw. der Nutzer selbst in `.env.local` ein.

## Abhängigkeiten

- `@supabase/supabase-js` und `@supabase/ssr` (vorhanden): Auth, Sitzungen, Datenzugriff und Admin-Löschung.
- `zod` (vorhanden): Eingaben an der Servergrenze prüfen.
- `react-hook-form` und `@hookform/resolvers` (vorhanden): Formulare mit Fehlern direkt am Feld.
- `server-only` (vorhanden): verhindert, dass Admin- und Datenmodule in den Browser gelangen.
- Keine neuen Pakete.

## Einstellungen durch den Nutzer

Für den lokalen Prototyp sind **keine** Dashboard-Einstellungen nötig. Alles steht in `supabase/config.toml`. Vor dem Deploy gilt:

| Einstellung | Ort | Zeitpunkt | Wert | Warum | → AC |
| --- | --- | --- | --- | --- | --- |
| Auth-Einstellungen des gehosteten Projekts angleichen | `supabase link` + `supabase config push` oder Supabase → Authentication → Sign In / Providers → Email | go-live | Mindestlänge 12, Code-Gültigkeit 10 Minuten, Reset-Vorlage nur mit Code. Die E-Mail-Bestätigung richtet sich nach der dann gültigen Spec. | Das gehostete Projekt liest `config.toml` nicht von selbst. | AC-7, AC-8 |
| E-Mail-Dienst und Adressen | Supabase → Authentication → SMTP Settings und URL Configuration | go-live | Versanddienst, Absender, Produktionsdomain als Site URL. | Mailpit verschickt keine echten Mails. Lokaler Ersatz: Mailpit. | AC-8 |
| Service-Role-Schlüssel beim Hoster | Umgebungsvariablen des Hosters | go-live | `SUPABASE_SERVICE_ROLE_KEY` aus Supabase → Project Settings → API, ohne `NEXT_PUBLIC_`. | Wird für die Kontolöschung gebraucht. | AC-16 |

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
| --- | --- | --- | --- | --- |
| Supabase Auth mit E-Mail und Passwort, lokal ohne E-Mail-Bestätigung | Passt zu PRD und Stack. Nach der Registrierung ist die Person sofort angemeldet, das hält den Prototyp klein. | Bestätigung lokal über Mailpit | Die Registrierung kann nicht verbergen, ob eine Adresse vergeben ist (zurückgestellt: AC-6 Teil, EC-1 Teil). | 2026-11-11 |
| Profil per Datenbank-Trigger in derselben Transaktion wie das Konto; der Trigger lehnt eine fehlende oder ungültige Altersgruppe ab | Es entsteht nie ein Konto ohne Profil. Die Altersregel gilt auch für direkte Auth-Anfragen. Ein Trigger ist einfacher als ein Auth-Hook. | „Before User Created“-Hook plus separate Profilanlage (bisheriges Design) | Ein Fehler im Trigger lässt jede Registrierung scheitern. Die Altersgruppe steht zusätzlich in den Auth-Metadaten und damit im Token. | 2026-11-11 |
| RLS „eigene Zeile + aktive Sitzung“ und Sitzungsprüfung per Server-Abgleich | Widerrufene Sitzungen verlieren sofort den Zugriff, auch vor Ablauf des Tokens (AC-9, AC-11, AC-12, EC-5). Die Datenbank schützt unabhängig von der Oberfläche (AC-14). | Nur Token-Prüfung und Eigentümer-Regel | Eine zusätzliche Datenbankabfrage pro geschützter Anfrage. Jede spätere persönliche Tabelle muss die Regel übernehmen. | 2026-11-11 |
| Löschung des Auth-Kontos in einem Schritt mit Löschweitergabe | Profil und Sitzungen verschwinden atomar mit dem Konto. Es braucht keinen Zwischenzustand `deleting` und keinen Wiederholungsjob. | Erst sperren (`access_state`), dann löschen (bisheriges Design) | Spätere Tabellen müssen per Fremdschlüssel mit Löschweitergabe am Konto hängen. Daten außerhalb der Datenbank (z. B. Storage) bräuchten einen eigenen Schritt. | 2026-11-11 |
| Admin-Zugang mit Service-Role-Schlüssel nur in `src/lib/supabase/admin.ts` (`server-only`), nur für die Löschung | Eine Person kann ihr Auth-Konto nicht selbst entfernen. Der Schlüssel bleibt eng begrenzt und serverseitig. | Datenbankfunktion mit erhöhten Rechten | Ein Geheimnis mehr, das beim Hoster gesetzt werden muss. | 2026-11-11 |
| Erneute Passwortprüfung über einen zustandslosen Auth-Aufruf | Die laufende Sitzung bleibt unberührt, es entsteht kein Cookie-Wechsel. | Reauthentisierung per E-Mail-Code von Supabase | Es entsteht kurz eine Hilfssitzung, die sofort wieder beendet wird. | 2026-11-11 |
| Reset per 6-stelligem Code statt Link, auf einer Seite mit zwei Schritten | Der Code steht nie in einer URL. Die Adresse bleibt im Formularzustand statt im Querystring. | Link mit Token | Ein Eingabeschritt mehr für Nutzende. | 2026-11-11 |
| Mindestantwortzeit von 800 ms für Anmeldung und Reset-Anforderung | Unbekannte und bekannte Adressen sind zeitlich kaum zu unterscheiden (AC-6). | Keine Angleichung | Jede Anmeldung dauert mindestens 0,8 s. | 2026-11-11 |
| Passwort 12 bis 72 Zeichen (höchstens 72 Byte) | Der Passwort-Hash von Supabase verarbeitet höchstens 72 Byte. Längere Eingaben würden still gekürzt. | Keine Obergrenze | Sehr lange Passphrasen und solche mit vielen Umlauten werden mit einer Begründung abgelehnt. | 2026-11-11 |
| Geschützter Einstieg direkt unter `/heute` als Platzhalter | `docs/app-shell.md` nennt „Heute“ als Einstieg. PROJ-2 und PROJ-6 müssen dann kein Weiterleitungsziel ändern. | Eigene Zwischenseite `/start` (bisheriges Design) | Die Platzhalterseite wird von PROJ-6 ersetzt. | 2026-11-11 |
| SEC-04 für den lokalen Prototyp ausgesetzt (siehe Ausnahme oben) | Produktentscheidung zum Prototyp-Umfang. | Schutz von Anfang an (bisheriges Design) | Nicht für einen öffentlichen Betrieb geeignet; vor dem Deploy Pflicht. | 2026-11-11 |

### Ersetzte Entscheidungen aus dem Design vom 2026-09-30

Diese Entscheidungen sind für den Prototyp ersetzt. Ihre Begründung gilt für den späteren Deploy weiter und dient beim erneuten `/architecture` als Ausgangspunkt.

- **Atomare Schutz-Zähler in Postgres und Passwort-Prüf-Hook (AC-17 bis AC-19):** Pseudonyme Zähler pro Konto und IP, Sperre nach Grenzwert. Für die gehostete Version braucht der Hook den Team-Plan (ab 599 USD/Monat), sonst ist eine andere Auth-Architektur nötig.
- **Cloudflare Turnstile (AC-20):** Bot-Prüfung bei Registrierung, Anmeldung und Reset, lokal mit offiziellen Testschlüsseln.
- **Prüfung kompromittierter Passwörter (AC-7, Teil):** serverseitiger Hash-Präfix-Abgleich; der eingebaute Supabase-Abgleich erst ab Pro-Plan.
- **E-Mail-Bestätigung und E-Mail-Wechsel per Code (AC-4, AC-10):** Codes statt Links; Information an die alte Adresse.
- **Tägliche Bereinigung per Supabase Cron:** unbestätigte Konten nach 7 Tagen und abgelaufene Zähler. Ohne Bestätigung und Zähler entfällt sie.
- **Profilzustand `deleting` vor dem Löschen:** ersetzt durch die Löschung in einem Schritt (siehe oben).
- **Erneute Identitätsprüfung vor dem Export:** im Prototyp entfallen, weil AC-15 sie nicht verlangt. Der Export setzt eine aktive Sitzung voraus.

## Offene Fragen

- [ ] Vor dem ersten Deploy: Wie werden AC-17 bis AC-20 und der Leak-Teil von AC-7 auch bei direkt erreichbaren gehosteten Auth-Endpunkten durchgesetzt? Dabei ist zu beachten, dass Supabase bei serverseitigen Aufrufen nur die IP des Next.js-Servers sieht.
- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-1` prüft die Registrierung Minderjähriger, die Datenflüsse und die Löschfristen. Dazu gehört auch die Altersgruppe in den Auth-Metadaten bzw. im Token.

## Umsetzungsnotizen (`/build`, 2026-11-11)

- **Formular-Verdrahtung:** Zusätzlich zu den geplanten Dateien gibt es `src/features/account/components/use-server-form.ts`. Der kleine Hook verbindet die shadcn-`Form` (react-hook-form, dieselben Zod-Schemas im Browser) mit den Server-Actions und setzt Feldfehler vom Server direkt am Feld. Jedes Formular trägt zusätzlich `method="post"`, damit es auch vor dem Laden von JavaScript nie per GET sendet.
- **Export-Download:** Der Button lädt `/profil/export` per `fetch` und speichert die Datei nur bei Erfolg. Ein Fehler erscheint als Meldung statt als heruntergeladene Fehlerdatei.
- **Meldungstexte:** `ACCOUNT_MESSAGES` liegen in `account.rules.ts`, weil eine `'use server'`-Datei nur async-Funktionen exportieren darf.
- **Sitzungsabfrage:** `getCurrentUser` ist pro Anfrage mit React `cache` zwischengespeichert, damit Layout und Seite den Auth-Server nur einmal fragen.
- **Rücksprungziel:** Der Proxy übergibt den ursprünglich aufgerufenen geschützten Pfad als `?weiter=`. Es ist nur der Pfad, keine personenbezogenen Daten; er wird über `safeRedirectPath` auf interne Ziele beschränkt.
- **Ablauf des Builds:** Die `[P]`-Aufgaben wurden ohne Subagenten nacheinander gebaut, weil die Stufen klein und eng gekoppelt waren.
