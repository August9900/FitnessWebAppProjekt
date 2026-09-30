# PROJ-1 — Technisches Design: Konto & Anmeldung

> Dieses Dokument beschreibt die technische Umsetzung der freigegebenen Anforderungen in `spec.md`. Die erste Umsetzung läuft gegen lokales Supabase mit Testdaten. Einstellungen für eine öffentliche Umgebung werden erst vor dem ersten Deploy entschieden und eingerichtet.

## Komponentenstruktur

```text
Öffentlicher Einstieg
├── Registrieren: E-Mail, Passwort, Altersgruppe, Bot-Prüfung
├── E-Mail bestätigen: Code eingeben oder erneut anfordern
├── Anmelden: E-Mail, Passwort, bei Bedarf Bot-Prüfung
└── Passwort vergessen: Anforderung, Code-Eingabe, neues Passwort

Geschützter Einstieg
└── Vorläufige Zielansicht bis PROJ-2 den gemeinsamen App-Rahmen bereitstellt

Kontoeinstellungen im künftigen Profilbereich von PROJ-2/PROJ-3
├── E-Mail ändern und neue Adresse bestätigen
├── Passwort ändern
├── Eigene Daten herunterladen
├── Konto löschen mit eindeutiger Bestätigung
└── Abmelden

Servergrenze
├── Formularprüfung und einheitliche Rückmeldungen
├── Bot- und Versuchsprüfung vor Auth-Anfragen
├── Export und Löschung nach erneuter Identitätsprüfung
├── Tägliche Bereinigung unbestätigter Konten und abgelaufener Schutz-Zähler
└── Prüfung einer aktuellen Sitzung bei jedem geschützten Zugriff

Supabase lokal
├── Auth: Konten, Passwort-Hashes, Bestätigungen und Sitzungen
├── Postgres: Kurzprofil, Zugriffsregeln und Versuchs-Zähler
├── Auth-Hooks: Altersgrenze und Kontosperre
└── Lokaler E-Mail-Posteingang für Bestätigung und Zurücksetzung
```

Die Kontoansichten erhalten kein eigenes App-Menü. Nach der Anmeldung führt PROJ-1 in einen geschützten Einstieg; PROJ-2 ersetzt dessen Rahmen und öffnet anschließend „Heute“. Kontoeinstellungen werden als Inhalt des vorhandenen Bereichs „Profil“ eingebunden. Lade-, Fehler- und Bestätigungszustände folgen `docs/app-shell.md`; Gestaltung und reduzierte Bewegung folgen `docs/design-system.md`.

## Datenmodell

| Bestand | Felder und Regeln | Eigentum und Aufbewahrung |
|---------|-------------------|---------------------------|
| Auth-Konto, von Supabase verwaltet | `id`: eindeutige UUID, Pflichtwert; `email`: gültige, normalisierte Adresse, eindeutig, Pflichtwert; Passwort-Hash: nur von Supabase erzeugt, nie im App-Profil gespeichert; `email_confirmed_at`: Zeitpunkt oder leer; `created_at`: Zeitpunkt; `updated_at`: Zeitpunkt. Die zulässigen Zustände sind **unbestätigt**, **bestätigt** und **gelöscht**. | Gehört genau einer Person. Unbestätigte Konten werden nach sieben Tagen ohne Bestätigung entfernt; bestätigte Konten bis zur ausdrücklich bestätigten Löschung. Auf Auth-Interna greift nur Supabase Auth beziehungsweise eine eng begrenzte Serverfunktion zu. |
| Kurzprofil `profiles` | `user_id`: eindeutige UUID und Verweis auf genau ein Auth-Konto, Pflichtwert; `age_band_at_signup`: genau `12_15` oder `16_plus`, Pflichtwert; `access_state`: `open` oder `deleting`, beim Anlegen `open`, nur durch den Löschablauf änderbar; `created_at`: Zeitpunkt; `updated_at`: Zeitpunkt. Fachliche Felder folgen erst in PROJ-3. E-Mail und Passwort werden hier nicht kopiert. | Gehört ausschließlich zum verknüpften Konto. Es entsteht genau eine Zeile pro Registrierung und wird mit dem Konto gelöscht. Die Altersgruppe ist eine Selbstauskunft bei der Registrierung, kein dauerhaft korrektes Alter. |
| Anmeldung und Bestätigung, von Supabase verwaltet | Aktive Sitzungen tragen eine eindeutige Sitzungs-ID und einen Ablaufzeitpunkt. Bestätigungs- und Zurücksetzungscodes sind einmalig verwendbar und zehn Minuten gültig. Eine noch unbestätigte neue E-Mail-Adresse ist ein vorläufiger Auth-Zustand; die alte Adresse bleibt bis zur Bestätigung gültig. | Sitzungen gehören einem Konto; abgelaufene Daten räumt Supabase auf. Nach Abmeldung, Passwortwechsel oder Löschung werden betroffene Sitzungen widerrufen. |
| Schutz-Zähler | `kind`: einer der Werte `login_account`, `login_ip`, `signup_ip`, `reset_ip`, `reset_account`; `key_digest`: nicht umkehrbarer, mit Servergeheimnis gebildeter Kennwert aus Konto bzw. IP, Pflichtwert; `window_start`: Zeitpunkt; `count`: nichtnegative ganze Zahl; `blocked_until`: Zeitpunkt oder leer; `expires_at`: Zeitpunkt. Pro Art und Kennwert höchstens eine aktive Zeile. Ein zusätzlicher, nur für Auth erreichbarer Konto-Zähler nutzt die interne Konto-ID für die Prüfung nach einem Passwortversuch. | Keine Anzeige für Nutzende. Nur Auth-Hook und serverseitige Schutzfunktion dürfen lesen oder ändern. Zähler werden nach Ende des längsten Fensters beziehungsweise der Sperre, spätestens nach 24 Stunden, entfernt. Keine Klartext-E-Mail oder Klartext-IP im App-Zähler. |

Der Alterswert `unter_12` wird nur zur Ablehnung im Formular verwendet und nicht als Konto gespeichert. Ein vor dem Anlegen ausgeführter Supabase-Hook lehnt auch direkte Registrierungsanfragen ohne zulässige Altersgruppe ab. Das Kurzprofil wird beim Anlegen des Auth-Kontos in derselben Datenbankoperation erzeugt; ein Fehler darf kein halbes Konto hinterlassen. Eine eindeutige Zuordnung verhindert doppelte Profile bei gleichzeitigen Registrierungen. Eine täglich durch Supabase Cron ausgelöste Datenbankroutine entfernt nur Konten, die zum Ausführungszeitpunkt weiterhin unbestätigt und älter als sieben Tage sind, sowie abgelaufene Schutz-Zähler. Die Bedingung wird unmittelbar beim Entfernen erneut geprüft, damit eine zeitgleiche Bestätigung nicht verloren geht. Die Routine wird lokal eingerichtet und geprüft; vor dem ersten Deploy wird ihr Betrieb in der gehosteten Umgebung verifiziert. [Supabase Cron kann wiederkehrende Datenbankfunktionen ausführen](https://supabase.com/docs/guides/cron).

Alle persönlichen Tabellen erhalten Row Level Security: Nur die Eigentümerin oder der Eigentümer mit **noch aktiver Sitzung** und einem Kurzprofil im Zustand `open` darf eigene Zeilen lesen oder ändern. Die Prüfung einer aktiven Sitzungs-ID in der Datenbank schließt die Zeitspanne, in der ein bereits ausgegebenes Auth-Token nach Abmeldung oder Kontolöschung technisch noch nicht abgelaufen ist. Künftige persönliche Tabellen müssen dieselbe Eigentums- und Sitzungsregel übernehmen und bei Kontolöschung ihre Daten entfernen. [Supabase erläutert die verbleibende Gültigkeit ausgegebener Tokens](https://supabase.com/docs/guides/auth/managing-user-data).

## Abläufe und Zugriffe

| Ablauf | Zugang und Prüfung | Ergebnis und Fehlerverhalten | Bezug |
|--------|--------------------|------------------------------|-------|
| Registrieren | Öffentlich; Eingaben werden serverseitig geprüft; Alter unter 12 sowie fehlende Altersgruppe werden vor Auth-Anlage abgewiesen. Passwort mindestens 12 Zeichen, lange Passphrasen erlaubt; bekannte kompromittierte Passwörter werden vor dem Anlegen serverseitig zurückgewiesen. Bot-Prüfung vor Auth-Anfrage. | Genau ein unbestätigtes Konto mit leerem Kurzprofil. Bei doppelter Adresse oder Verbindungsabbruch neutrale Antwort und Weg zur Bestätigung; kein Kontostatus wird verraten. | AC-2, AC-3, AC-6, AC-7, AC-13, AC-19–21; EC-1, EC-4 |
| E-Mail bestätigen | Öffentlich über E-Mail-Adresse und manuell eingegebenen Einmalcode; kein Passwort oder Bestätigungscode im URL-Pfad oder Querystring. Erneutes Senden ist begrenzt. | Nach gültigem Code wird das Konto bestätigt. Abgelaufene oder verbrauchte Codes ändern nichts; neuer Code kann angefordert werden. Lokale E-Mails landen im Test-Posteingang. | AC-4, AC-5; EC-2, EC-3 |
| Anmelden | Öffentlich; Passwort wird ausschließlich mit POST übertragen. App-seitige IP- und Kontoprüfung vor der Supabase-Anfrage; Auth-Hook prüft die Kontosperre auch bei direktem Aufruf von Supabase Auth. | Nur bestätigte Konten erhalten eine Sitzung. Falsche Daten und unbekannte Adresse bekommen dieselbe Meldung mit vergleichbarem Antwortpfad; Sperre zeigt eine neutrale Wartezeit. | AC-5, AC-6, AC-17, AC-18, AC-20, AC-21; EC-7 |
| Passwort zurücksetzen | Öffentlich; Bot-Prüfung und höchstens drei Anfragen je IP und je Adresse pro Stunde. E-Mail enthält einen Einmalcode statt eines Tokens in einer URL. | Nach gültigem Code und neuem zulässigem Passwort wird der Zugang aktualisiert; alte Sitzungen enden. Eine unbekannte Adresse führt zur gleichen sichtbaren Antwort wie eine bekannte. | AC-6–8, AC-19, AC-20; EC-2, EC-3 |
| Passwort ändern | Nur mit aktuell bestätigter Sitzung und erneuter Identitätsprüfung. | Neues zulässiges Passwort wird übernommen; andere Sitzungen werden widerrufen. Fehler lässt das alte Passwort gültig. | AC-7, AC-9 |
| E-Mail ändern | Nur mit aktuell bestätigter Sitzung; neue Adresse muss frei und gültig sein. Bestätigung über Einmalcode an die neue Adresse, Sicherheitsinformation an die alte. | Vor Bestätigung bleibt die alte Adresse gültig. Bei ausbleibender Bestätigung kein zweites Konto. | AC-10; EC-6 |
| Abmelden und geschützte Anfragen | Aktuelle Sitzung wird serverseitig geprüft; eine bloß vorhandene Cookie-Zeichenfolge genügt nicht. Abmelden betrifft das aktuelle Gerät. | Anonyme, abgelaufene und widerrufene Sitzungen sehen weder Seiteninhalt noch persönliche API-Daten; nach Abmeldung erneute Anmeldung erforderlich. | AC-1, AC-11, AC-12, AC-14; EC-5 |
| Daten exportieren | Nur nach erneuter Identitätsprüfung. Der Export umfasst E-Mail, Konto-ID, Kontozeitpunkte, Altersgruppe und alle bis dahin hinzugekommenen persönlichen App-Daten. Passwort-Hash und fremde Daten fehlen. | Eine herunterladbare, maschinenlesbare Datei; spätere Features ergänzen ihre Daten in denselben Export. Fehler wird angezeigt, ohne eine unvollständige Datei als vollständig auszugeben. | AC-15 |
| Konto löschen | Nur nach erneuter Identitätsprüfung und zweiter, eindeutiger Bestätigung. Serverseitige Admin-Berechtigung ausschließlich für diesen Ablauf. | Das Profil wechselt zuerst auf `deleting` und sperrt weitere persönliche Zugriffe. Danach werden Konto und aktive App-Daten entfernt; alle Sitzungen verlieren den Zugang. Ein fehlgeschlagener Löschschritt darf nicht als Erfolg erscheinen und wird sicher wiederholt. Spätere Features müssen ihre Daten an diesen Ablauf anschließen. | AC-16; EC-5 |

Die eigene App-Grenze nutzt Next.js-Serveraktionen beziehungsweise geschützte Serverendpunkte. Formulare mit Zugangsdaten senden per POST; Zod validiert auf dem Server. Das vorhandene `@supabase/ssr` teilt die Sitzung zwischen Server und Browser. Ein Next.js-Proxy erneuert sie vor geschützten Seiten; der eigentliche Zugriff prüft zusätzlich eine aktuelle Sitzung und die Datenbank prüft Eigentum und Sitzungs-ID. Ein öffentliches Supabase-Auth-Endpunkt bleibt bei gehostetem Supabase direkt erreichbar; die genaue Grenze der appseitigen Versuchsprüfung ist unten als Deploy-Entscheidung benannt.

Für parallele Ereignisse gelten feste Garantien: Die E-Mail ist im Auth-System eindeutig; das Kurzprofil hat dieselbe eindeutige Konto-ID; Codes sind nur einmal verwendbar; Zähleränderungen erfolgen atomar; die Löschung sperrt zuerst weitere persönliche Zugriffe und entfernt dann Konto und verknüpfte Daten. Eine fehlgeschlagene Teiloperation führt zu einem sichtbaren Fehler und einem sicheren Wiederholungsweg statt zu einer Erfolgsmeldung.

## Schutz gegen automatisierte Versuche

| Regel aus der Spec | Lokale Durchsetzung | Grenze bei einem später gehosteten Projekt |
|--------------------|---------------------|--------------------------------------------|
| Fünf Fehlversuche je Konto in 15 Minuten, danach 15 Minuten Sperre | Passwort-Prüf-Hook in lokalem Supabase zählt pro interner Konto-ID atomar. Der App-Eingang führt denselben Schutz auch für unbekannte Adressen als gleichförmige Antwort aus. | Der [Password Verification Hook ist bei Supabase Hosting derzeit nur im Team- oder Enterprise-Plan verfügbar](https://supabase.com/docs/guides/auth/auth-hooks). Ohne ihn kann eine direkte Auth-Anfrage den App-Zähler umgehen. Vor Deploy ist die Auth-Entscheidung zu treffen. |
| 20 fehlgeschlagene Anmeldungen je IP in 15 Minuten, danach 15 Minuten Sperre | Serverseitiger Zähler vor Auth-Anfragen; zusätzlich wirken die eigenen [Supabase-IP-Limits](https://supabase.com/docs/guides/auth/rate-limits) als zweite Grenze. | App-Zähler gelten nicht für direkte Supabase-Auth-Anfragen. Die Supabase-Limits haben andere Fenster und erlauben kurze Bursts; AC-18 wird für öffentliche Direktzugriffe vor Deploy erneut geprüft. |
| Fünf Registrierungen je IP und drei Zurücksetzungen je IP und Adresse pro Stunde | Atomare serverseitige Zähler; Supabase-Grenzen und Bot-Prüfung ergänzen sie. | Direkte gehostete Auth-Anfragen können die App-Zähler umgehen; die genaue Einhaltung von AC-19 muss vor Deploy ebenfalls gelöst werden. |
| Bot-Prüfung | Cloudflare Turnstile liefert bei Registrierung, Anmeldung und Zurücksetzung einen Prüfwert an Supabase Auth. Die Login-Ansicht bleibt im Normalfall ohne zusätzliche Nutzeraktion; bei auffälligen Versuchen kann eine sichtbare Prüfung erscheinen. Lokal verwendet die App [offizielle Testschlüssel](https://developers.cloudflare.com/turnstile/troubleshooting/testing/), sodass Tests ohne reale Challenge laufen. | Echte Domain und Schlüssel erst vor Deploy; die Prüfung von Cloudflare als Dienst erfolgt in der verschobenen Datenschutzprüfung. |
| Passwortregel | Mindestlänge serverseitig und in lokalem Supabase; keine Zeichenklassenpflicht. Prüfung bekannter kompromittierter Passwörter vor jeder Neuanlage und Änderung; in Tests wird der Prüfdienst kontrolliert ersetzt. | Supabase bietet [integrierten Abgleich kompromittierter Passwörter derzeit ab Pro](https://supabase.com/docs/guides/auth/password-security). Der direkte Auth-Endpunkt darf die Regel vor dem Deploy nicht umgehen. |

Der Schutz-Zähler speichert nur pseudonyme Kennwerte und kurze Zeitfenster. Antworten für unbekannte und vorhandene Konten werden auf denselben sichtbaren Text und einen vergleichbaren Ablauf gebracht. Ein Ausfall der Zähler- oder Bot-Prüfung lässt keine neuen Zugangsanfragen unkontrolliert durch; die Oberfläche zeigt einen erneuten Versuch an. Die Prüfung kompromittierter Passwörter läuft serverseitig über einen Hash-Präfix-Abgleich; das Passwort selbst wird nicht an den Prüfdienst gesendet. Dieser Datenfluss wird vor dem Deploy in `/dsgvo PROJ-1` bewertet.

## Abhängigkeiten

- `@supabase/supabase-js` und `@supabase/ssr` — bereits vorhanden; Auth, Sitzungen und Datenzugriff.
- `zod` — bereits vorhanden; Eingaben an der Servergrenze prüfen.
- `react-hook-form` und `@hookform/resolvers` — bereits vorhanden; nutzbare Formulare und Feldfehler.
- Cloudflare Turnstile, über eine passende React-Einbindung — Bot-Prüfung; lokaler Testbetrieb mit Testschlüsseln. Das konkrete Paket legt `/tasks` nach Prüfung der aktuellen Version fest.
- Kein externer Redis-Dienst für den lokalen Build; die kurzen Schutz-Zähler liegen in der vorhandenen lokalen Postgres-Datenbank.
- Neue Platzhalter in `.env.local.example` für den nur serverseitig genutzten Admin-Zugang, das Geheimnis zur Bildung der Zähler-Kennwerte und die lokalen/produktiven Turnstile-Schlüssel. Reale Werte werden weder in die Dokumentation noch in Git geschrieben.

## Einstellungen durch den Nutzer

Lokal werden Bestätigungspflicht, Code-Vorlagen, Mindestlänge, Hook, Schutzgrenzen und Test-CAPTCHA als Projektkonfiguration durch `/build` eingerichtet. Der lokale E-Mail-Posteingang benötigt keinen externen Maildienst. Die folgenden Punkte brauchen erst für eine gehostete Umgebung Entscheidungen oder Zugang zu deren Dashboard; sie blockieren die lokale QA nicht.

| Einstellung | Ort | Zeitpunkt | Wert bzw. Entscheidung | Warum | → AC |
|-------------|-----|-----------|------------------------|-------|------|
| Auth-Plan und Kontosperre | Supabase → Organisation / Plan; Authentication → Hooks | vor Deploy | Gehosteten Password Verification Hook ermöglichen oder vor Deploy eine andere Auth-Architektur und gegebenenfalls `/refine PROJ-1` wählen. Der Team-Plan beginnt [derzeit bei 599 USD/Monat](https://supabase.com/pricing). | Direkte Anfragen an Supabase Auth müssen die Kontosperre ebenfalls einhalten. | AC-17 |
| E-Mail-Bestätigung, Passwortregel und Sitzungsdauer | Supabase → Authentication → Sign In / Providers → Email; Sessions | vor Deploy | Bestätigung an; Mindestlänge 12; keine Zeichenklassenpflicht; Zugriffstoken kurzlebig, Zielwert fünf Minuten. | Lokale Konfiguration muss vor öffentlichen Konten gespiegelt werden. | AC-4, AC-7, AC-9, AC-12 |
| Bot-Schutz und Auth-Limits | Supabase → Authentication → Bot and Abuse Protection; Rate Limits; Cloudflare → Turnstile | vor Deploy | Echtes Turnstile für die Produktionsdomain; die zugesagten Grenzen müssen auch bei direktem Auth-Zugriff nachweisbar gelten. Eine Dashboard-Einstellung allein genügt nur, wenn sie diese Grenzen tatsächlich abbildet. | Testschlüssel gelten nicht für reale Besucher; Supabase-IP-Limits haben eine andere Semantik als AC-18 und AC-19. | AC-17–20 |
| E-Mail-Versand und erlaubte Adresse | Supabase → Authentication → SMTP Settings; URL Configuration; Email Templates | vor Deploy | Geeigneten E-Mail-Dienst, Produktionsdomain, Einmalcode-Vorlagen und erlaubte Rücksprungziele festlegen. | Der lokale Test-Posteingang versendet keine echten Nachrichten. | AC-4, AC-8, AC-10 |
| Aufräumroutine | Supabase → Integrations → Cron | vor Deploy | Den lokal geprüften täglichen Job aktivieren und seine Ausführung überwachen. | Die begrenzte Aufbewahrung unbestätigter Konten und Schutz-Zähler braucht einen tatsächlich laufenden Job. | AC-2, AC-17–19 |

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Nachteil / Grenze | Datum |
|--------------|------------|----------------------|-------------------|-------|
| Supabase Auth und Postgres für die lokale Entwicklung | Passt zu PRD, vorhandenem Stack und der bestehenden Server-/Browser-Clientstruktur; Konten und Daten liegen in einer lokalen Umgebung. | Neue Auth-Bibliothek mit eigener Kontodatenbank | Der gehostete Schutz pro Konto ist planabhängig; vor Deploy kann eine Anpassung nötig sein. | 2026-09-30 |
| Registrierung über Supabase-Hook und genau ein minimales Kurzprofil | Altersgruppe und Einzigartigkeit gelten auch bei direktem Auth-Aufruf; PROJ-3 kann dasselbe Profil erweitern. | Altersprüfung nur im Formular und Profilanlage nachträglich | Hook und Profilerzeugung müssen sorgfältig gegen fehlerhafte Registrierungen getestet werden. | 2026-09-30 |
| Eindeutiges Konto, Profil und einmalig verwendbare Codes | Auth lehnt eine zweite identische E-Mail ab; das Profil entsteht mit eindeutiger Konto-ID in derselben Datenbankoperation; Bestätigungs- und Zurücksetzungscodes können nur einmal eingelöst werden. So bleiben parallele und wiederholte Anfragen eindeutig. | Erst Konto, dann Profil in einem unabhängigen Folgeschritt anlegen | Ein Fehler in der Profilerzeugung muss die gesamte Registrierung sichtbar scheitern lassen. | 2026-09-30 |
| E-Mail-Codes zur manuellen Eingabe | Vertrauliche Bestätigungswerte gelangen nicht in URLs; [Supabase unterstützt OTP in E-Mail-Vorlagen](https://supabase.com/docs/guides/auth/auth-email-templates). | Bestätigungslinks mit Token in der URL | Zusätzlicher Eingabeschritt für Nutzende. | 2026-09-30 |
| Serverseitige Auth-Abläufe und aktueller Sitzungsnachweis | Einheitliche Validierung, generische Fehler und Schutz-Zähler; widerrufene Sitzungen werden auch vor JWT-Ablauf ausgeschlossen. | Alle Auth-Aufrufe direkt aus dem Browser | Zusätzliche Serverarbeit je Anfrage; direkte gehostete Auth-Endpunkte brauchen vor Deploy eine eigene Entscheidung. | 2026-09-30 |
| Eigentümer-Regel plus aktive Sitzung in Row Level Security | Die Datenbank schützt persönliche Zeilen unabhängig von der Oberfläche und verweigert widerrufenen Sitzungen den Zugriff. | Nur Seiten- und API-Prüfung | Jede spätere persönliche Tabelle muss dieselbe Regel erhalten und geprüft werden. | 2026-09-30 |
| Löschung sperrt das Profil vor dem Entfernen des Kontos | Bei gleichzeitiger Anmeldung auf einem zweiten Gerät werden persönliche Daten ab dem Wechsel auf `deleting` verweigert; widerrufene Sitzungen bleiben auch mit altem Token ausgeschlossen. | Konto unmittelbar ohne vorherige Zugriffssperre entfernen | Ein abgebrochener Löschlauf benötigt einen sicheren, wiederholbaren Abschluss. | 2026-09-30 |
| Atomare Schutz-Zähler in Postgres statt zusätzlichem Dienst | Lokale Entwicklung benötigt keinen weiteren Anbieter; parallele Versuche überschreiten die Sperre nicht unbemerkt. | Upstash Redis | Datenbankarbeit für kurze Zähler und regelmäßige Bereinigung. | 2026-09-30 |
| Tägliche Bereinigung mit Supabase Cron | Ein Datenbankjob kann unbestätigte Alt-Konten und abgelaufene Zähler ohne zusätzlichen Dienst entfernen; die Bedingung wird beim Löschen erneut geprüft. | Zeitplan des späteren Webhosters | Der Betrieb des Jobs muss vor dem Deploy eingerichtet und kontrolliert werden. | 2026-09-30 |
| Export und Löschung als gemeinsame Kontodienste | Spätere Features können Daten zum Export und zur Löschung ergänzen, ohne eigene Kontoabläufe zu schaffen. | Separate Funktion pro Feature | Jede spätere persönliche Tabelle muss bei ihrer Umsetzung angeschlossen und überprüft werden. | 2026-09-30 |

## Offene Fragen

- [ ] Vor dem ersten Deploy: Welche Auth-Architektur erfüllt AC-7 und AC-17 bis AC-20 auch für direkt erreichbare gehostete Auth-Endpunkte zu vertretbaren laufenden Kosten? Ein gehosteter Password Verification Hook deckt die Kontosperre ab, löst allein aber weder die genauen IP-Grenzen noch die Prüfung kompromittierter Passwörter bei direkten Anfragen. Die lokale Umsetzung dokumentiert diese Grenze ausdrücklich.
- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-1` prüft Minderjährigenregistrierung, Datenflüsse und Löschfristen; Änderungen am Produktverhalten werden über `/refine PROJ-1` in der Spec festgehalten.
- [ ] Vor dem ersten Deploy: Produktionshoster, E-Mail-Dienst und echte Turnstile-Konfiguration bestimmen. Die lokalen Tests nutzen ausschließlich Testdaten und Testschlüssel.
