# PROJ-1 — Aufgaben: Konto & Anmeldung

> Geordneter Umsetzungsplan aus `spec.md` und `design.md`. Die Stufen laufen nacheinander. Innerhalb einer Stufe dürfen nur mit `[P]` gekennzeichnete Aufgaben parallel laufen; ihre `files:`-Mengen überschneiden sich nicht. `/build` prüft jede Stufe und hakt erledigte Bauaufgaben ab. `[user go-live]` bleibt bis vor dem ersten Deploy offen und blockiert weder lokale Tests noch `/qa`.

## Stufe 1 — Lokale Grundlage

- [ ] T1 Lokales Supabase mit E-Mail-Bestätigung, zehn Minuten gültigen Codes, Passwort-Mindestlänge und CAPTCHA-Testschlüsseln konfigurieren; Platzhalter für benötigte Schlüssel dokumentieren. Reale lokale Testwerte trägt der Nutzer selbst in `.env.local` ein. · files: `supabase/config.toml`, `supabase/templates/confirmation.html`, `supabase/templates/recovery.html`, `supabase/templates/email_change.html`, `.env.local.example` · → AC-4, AC-7, AC-8, AC-10, AC-20

## Stufe 2 — Datenmodell und Zugriffsregeln

- [ ] T2 [P] Kurzprofil, Altersprüfung bei Registrierung und Zugriffsregeln anlegen; Konto und Profil bleiben eindeutig verknüpft. · files: `supabase/migrations/202609300101_profiles.sql` · → AC-2, AC-3, AC-13, AC-14, AC-16; EC-1
- [ ] T3 [P] Schutz-Zähler und Auth-Hook für fehlgeschlagene Anmeldungen anlegen. · files: `supabase/migrations/202609300102_auth_limits.sql` · → AC-17, AC-18, AC-19; EC-7

## Stufe 3 — Gemeinsame Serverbausteine

- [ ] T4 [P] Tägliche Bereinigung unbestätigter Konten und abgelaufener Zähler einrichten; beim Entfernen den Kontostatus erneut prüfen. · files: `supabase/migrations/202609300103_cleanup.sql` · → AC-2, AC-17, AC-18, AC-19
- [ ] T5 [P] Sitzungserneuerung, aktuellen Sitzungsnachweis und eng begrenzten Admin-Zugang bereitstellen. · files: `src/proxy.ts`, `src/lib/auth/session.ts`, `src/lib/supabase/admin.ts` · → AC-1, AC-5, AC-11, AC-12, AC-14, AC-16; EC-5
- [ ] T6 [P] Serverseitige Formularprüfung und Prüfung kompromittierter Passwörter bereitstellen. · files: `src/lib/auth/validation.ts`, `src/lib/auth/breached-password.ts` · → AC-2, AC-3, AC-6, AC-7, AC-8, AC-9, AC-10, AC-21
- [ ] T7 [P] IP- und Adressgrenzen sowie Bot-Prüfung als gemeinsame Schutzfunktionen bereitstellen. · files: `src/lib/auth/rate-limit.ts`, `src/lib/auth/captcha.ts` · → AC-17, AC-18, AC-19, AC-20

## Stufe 4 — Kontoabläufe auf dem Server

- [ ] T8 [P] Registrierung, Bestätigung und erneute Anforderung mit neutralen Rückmeldungen umsetzen. · files: `src/app/(auth)/registrieren/actions.ts`, `src/app/(auth)/bestaetigen/actions.ts` · → AC-2, AC-3, AC-4, AC-6, AC-7, AC-13, AC-19, AC-20, AC-21; EC-1, EC-2, EC-3, EC-4
- [ ] T9 [P] Anmeldung und Abmeldung samt Konten- und IP-Sperren umsetzen. · files: `src/app/(auth)/anmelden/actions.ts`, `src/app/(protected)/actions.ts` · → AC-5, AC-6, AC-11, AC-17, AC-18, AC-20, AC-21; EC-7
- [ ] T10 [P] Passwort-Zurücksetzung mit Einmalcode, Passwortprüfung und Sitzungswiderruf umsetzen. · files: `src/app/(auth)/passwort-vergessen/actions.ts`, `src/app/(auth)/passwort-zuruecksetzen/actions.ts` · → AC-6, AC-7, AC-8, AC-19, AC-20, AC-21; EC-2, EC-3
- [ ] T11 [P] E-Mail-Wechsel mit Bestätigung der neuen Adresse und Nachricht an die alte Adresse umsetzen. · files: `src/app/(protected)/profil/sicherheit/email-actions.ts` · → AC-10, AC-21; EC-6
- [ ] T12 [P] Passwortwechsel mit erneuter Identitätsprüfung und Widerruf anderer Sitzungen umsetzen. · files: `src/app/(protected)/profil/sicherheit/password-actions.ts` · → AC-7, AC-9, AC-21
- [ ] T13 [P] Vollständigen, kontogebundenen und maschinenlesbaren Datenexport bereitstellen. · files: `src/app/(protected)/profil/daten/export/route.ts` · → AC-15
- [ ] T14 [P] Konto und aktive Daten nach Bestätigung sicher und wiederholbar löschen; Zugriff vor dem Entfernen sperren. · files: `src/app/(protected)/profil/daten/delete-actions.ts` · → AC-16; EC-5

## Stufe 5 — Oberflächen und Einbindung

- [ ] T15 [P] Registrierung und Code-Bestätigung mit verständlichen Feldfehlern und sicheren POST-Formularen gestalten. · files: `src/app/(auth)/registrieren/page.tsx`, `src/components/account/register-form.tsx`, `src/app/(auth)/bestaetigen/page.tsx`, `src/components/account/confirm-form.tsx` · → AC-2, AC-3, AC-4, AC-6, AC-7, AC-20, AC-21
- [ ] T16 [P] Anmeldung samt Sperr- und Fehlerzuständen gestalten. · files: `src/app/(auth)/anmelden/page.tsx`, `src/components/account/login-form.tsx` · → AC-5, AC-6, AC-17, AC-18, AC-20, AC-21
- [ ] T17 [P] Anforderung und Abschluss der Passwort-Zurücksetzung gestalten. · files: `src/app/(auth)/passwort-vergessen/page.tsx`, `src/components/account/forgot-password-form.tsx`, `src/app/(auth)/passwort-zuruecksetzen/page.tsx`, `src/components/account/reset-password-form.tsx` · → AC-6, AC-7, AC-8, AC-19, AC-20, AC-21
- [ ] T18 [P] Kontosicherheit mit E-Mail- und Passwortwechsel gestalten. · files: `src/app/(protected)/profil/sicherheit/page.tsx`, `src/components/account/email-change-form.tsx`, `src/components/account/password-change-form.tsx` · → AC-9, AC-10, AC-21
- [ ] T19 [P] Datenexport und bestätigte Kontolöschung gestalten. · files: `src/app/(protected)/profil/daten/page.tsx`, `src/components/account/export-button.tsx`, `src/components/account/delete-dialog.tsx` · → AC-15, AC-16
- [ ] T20 [P] Geschützten vorläufigen Einstieg und Verweise zu Kontoeinstellungen anbinden; PROJ-2 übernimmt später den gemeinsamen App-Rahmen. · files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/(protected)/layout.tsx`, `src/app/(protected)/start/page.tsx`, `src/app/(protected)/profil/page.tsx` · → AC-1, AC-5, AC-11, AC-12, AC-13, AC-14

## Stufe 6 — Einstellungen vor dem ersten Deploy

Die folgenden Aufgaben benötigen eine gehostete Umgebung oder eine Produktionsadresse. Sie werden erst vor dem ersten Deploy vom Nutzer erledigt und abgehakt. Lokale Entwicklung und `/qa` prüfen die jeweilige Testumgebung; `/dsgvo PROJ-1` bleibt ebenfalls vor dem ersten Deploy offen.

- [ ] T21 [user go-live] Gehosteten Auth-Plan und wirksame Kontosperre festlegen; bei einer anderen Architektur zuvor `/refine PROJ-1` ausführen. · where: Supabase → Organisation / Plan und Authentication → Hooks; Password Verification Hook ermöglichen oder eine geänderte Auth-Architektur freigeben. · → AC-17
- [ ] T22 [user go-live] E-Mail-Bestätigung, Passwort-Mindestlänge 12 und kurze Sitzungsdauer für das öffentliche Projekt setzen. · where: Supabase → Authentication → Sign In / Providers → Email und Sessions; Bestätigung an, Mindestlänge 12, Zugriffstoken-Zielwert fünf Minuten. · → AC-4, AC-7, AC-9, AC-12
- [ ] T23 [user go-live] Echtes Turnstile und Auth-Grenzen einrichten; direkte Auth-Anfragen müssen AC-17 bis AC-20 nachweisbar erfüllen. · where: Cloudflare → Turnstile für die Produktionsdomain; Supabase → Authentication → Bot and Abuse Protection und Rate Limits; zugesagte Grenzwerte aus `spec.md` prüfen. Falls die Plattform sie nicht abbildet, vor dem Deploy die Architektur anpassen. · → AC-17, AC-18, AC-19, AC-20
- [ ] T24 [user go-live] E-Mail-Dienst, Produktionsadresse und Code-Vorlagen einrichten. · where: Supabase → Authentication → SMTP Settings, URL Configuration und Email Templates; Produktionsdomain, Versanddienst und Einmalcode-Vorlagen einsetzen. · → AC-4, AC-8, AC-10
- [ ] T25 [user go-live] Tägliche Bereinigung im gehosteten Projekt aktivieren und ihre Ausführung prüfen. · where: Supabase → Integrations → Cron; den lokal geprüften täglichen Job ausführen und überwachen. · → AC-2, AC-17, AC-18, AC-19

## Parallelisierung und Abnahme

- Jede Stufe beginnt erst, wenn die vorherige integriert und gegen ihre zugeordneten Acceptance Criteria geprüft ist.
- `[P]` gilt nur innerhalb derselben Stufe. Die angegebenen Dateien aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden; gemeinsam genutzte Bausteine entstehen in Stufe 3 vor den Kontoabläufen.
- `/build` prüft die lokale Umsetzung nach jeder Stufe. `/qa` führt die unabhängige Prüfung der Acceptance Criteria und Edge Cases durch und erstellt die Testnachweise. Die fünf `[user go-live]`-Aufgaben bleiben bis vor dem ersten Deploy offen.
