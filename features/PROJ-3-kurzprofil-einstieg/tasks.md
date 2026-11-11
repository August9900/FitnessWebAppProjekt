# PROJ-3 — Aufgaben: Kurzprofil & Einstieg

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben.
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] Migration: `profiles` um `goal`, `experience`, `places`, `home_equipment`, `diet` erweitern, mit Prüfregeln (erlaubte Werte, nicht leere Listen ohne Doppelte, `none` allein, `home_equipment` nur mit `home` in `places`); RLS-Änderungsregel „eigene Zeile + aktive Sitzung“; Änderungsrecht nur für die fünf Spalten; automatische Pflege von `updated_at`. · files: `supabase/migrations/20261111150000_profile_answers.sql` · → AC-3, AC-4, AC-5, AC-6, AC-7, AC-14, AC-16; EC-2, EC-5
- [x] T2 [P] Erlaubte Werte, deutsche Beschriftungen und Zod-Schemas für eine einzelne Antwort (je Frage) und für das vollständige Profil-Formular; mit Test. · files: `src/features/profile/profile.schema.ts`, `src/features/profile/profile.schema.test.ts` · → AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-13, AC-14; EC-5
- [x] T3 [P] Proxy: `/einstieg` als geschützten Pfad ergänzen; Test erweitern. · files: `src/proxy.ts`, `src/proxy.test.ts` · → AC-1, AC-10
- [x] T4 [P] Export aus PROJ-1 um `goal`, `experience`, `places`, `homeEquipment`, `diet` erweitern (leere Felder als `null`); Tests anpassen. · files: `src/features/account/account.data.ts`, `src/features/account/account.rules.ts`, `src/features/account/account.data.test.ts`, `src/features/account/account.rules.test.ts` · → AC-15

## Stufe 2 — Regeln und Auswahlflächen

- [x] T5 [P] Reine Regeln: Fragenliste für gegebene Antworten (4 ohne, 5 mit „Zuhause“), erste unbeantwortete Frage, „vollständig?“, Bereinigung (Ausstattung entfällt ohne „Zuhause“); mit Test. · files: `src/features/profile/profile.rules.ts`, `src/features/profile/profile.rules.test.ts` · → AC-2, AC-6, AC-9, AC-11, AC-14; EC-1, EC-4
- [x] T6 [P] Gemeinsame Auswahlflächen: Einzelauswahl (shadcn `RadioGroup`) und Mehrfachauswahl (shadcn `Checkbox`) mit „Nichts davon“, das andere abwählt; ganz anklickbar, per Tastatur bedienbar; mit Test. · files: `src/features/profile/components/answer-options.tsx`, `src/features/profile/components/answer-options.test.tsx` · → AC-3, AC-4, AC-5, AC-6, AC-7, AC-11

## Stufe 3 — Datenzugriff

- [x] T7 Datenmodul (`server-only`): eigene Angaben lesen, eine Antwort speichern, alle fünf in einer Änderung speichern, `requireCompletedProfile` (Weiterleitung nach `/einstieg`); mit Test; Live-Prüfung gegen die lokale Datenbank für fremde Zeile, gesperrte Spalte und ungültige Werte. · files: `src/features/profile/profile.data.ts`, `src/features/profile/profile.data.test.ts` · → AC-1, AC-9, AC-13, AC-16; EC-1, EC-2, EC-6

## Stufe 4 — Server-Actions

- [x] T8 Server-Actions `saveOnboardingAnswer`, `finishOnboarding` und `updateProfileAnswers`: Sitzung und Eingabe prüfen, Ausstattung ohne „Zuhause“ leeren bzw. ablehnen, Feldfehler und „Erneut versuchen“-Meldung, Weiterleitung nach `/heute` bei vollständigen Angaben; mit Test. · files: `src/features/profile/profile.actions.ts`, `src/features/profile/profile.actions.test.ts` · → AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-13, AC-14, AC-17; EC-3, EC-5

## Stufe 5 — Oberfläche

- [ ] T9 [P] Einstieg: Ablauf mit einer Frage pro Bildschirm, „Frage X von Y“, Zurück ohne Verlust, Hinweis bei fehlender Antwort, „Erneut versuchen“, „Fertig“ während des Speicherns gesperrt, Bestätigung; Route-Gruppe ohne App-Rahmen mit Marke, „Konto verwalten“ und „Abmelden“; Seite startet bei der ersten offenen Frage oder leitet bei vollständigen Angaben nach `/heute`; mit Test. · files: `src/features/profile/components/onboarding-flow.tsx`, `src/features/profile/components/onboarding-flow.test.tsx`, `src/app/(einstieg)/layout.tsx`, `src/app/(einstieg)/einstieg/page.tsx` · → AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-17; EC-1, EC-3, EC-4
- [ ] T10 [P] Abschnitt „Meine Angaben“ im Profil: vorausgefülltes Formular mit „Speichern“ und Bestätigung; bei unvollständigen Angaben Hinweis mit Link „Einstieg fortsetzen“; mit Test. · files: `src/features/profile/components/answers-form.tsx`, `src/features/profile/components/answers-form.test.tsx`, `src/app/(protected)/profil/page.tsx` · → AC-12, AC-13, AC-14, AC-17
- [ ] T11 [P] Gate: Route-Gruppe `(bereiche)` mit `requireCompletedProfile`; die Seiten von Heute, Bewegung, Essen und Wochenblick ziehen dorthin um (Adressen bleiben gleich). · files: `src/app/(protected)/(bereiche)/layout.tsx`, `src/app/(protected)/(bereiche)/heute/page.tsx`, `src/app/(protected)/(bereiche)/bewegung/page.tsx`, `src/app/(protected)/(bereiche)/essen/page.tsx`, `src/app/(protected)/(bereiche)/wochenblick/page.tsx` · → AC-1; EC-6

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Regeln und Auswahlflächen (2) → Datenzugriff (3) → Actions (4) → Oberfläche (5).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden. T11 entfernt außerdem die bisherigen Bereichsseiten unter `src/app/(protected)/{heute,bewegung,essen,wochenblick}/`, die keine andere Aufgabe dieser Stufe berührt.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
