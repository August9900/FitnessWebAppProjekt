# PROJ-2 — Aufgaben: App-Rahmen & Navigation

> Erstellt von `/tasks` aus `spec.md` und `design.md`. Das ist der geordnete, rückverfolgbare Bauplan zwischen Vertrag (WAS) und Umsetzung (WIE).
> `[P]` = parallel ausführbar: Die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Stufe.
> Die Stufen laufen **nacheinander**, jede ist eine Schranke. Jede Aufgabe verweist auf die AC-/EC-IDs aus `spec.md`; das ist die Kette AC → Aufgabe → Test.
> Dieses Feature braucht keine `[user]`-Aufgaben (keine Dashboard-Einstellungen).
> Kein Statusfeld hier — der Fortschritt sind die Haken unten, der Feature-Status steht ausschließlich in `features/INDEX.md`.

## Stufe 1 — Grundlagen

- [x] T1 [P] PULSE-Farbtoken für Hell und Dunkel exakt nach `docs/design-system.md`, Rundung 14 px, Schriftzuordnung (Text: Inter, Marke/Überschriften: Unbounded), zentrale Regel für reduzierte Bewegung (Gerätemeldung oder `data-reduce-motion` am `html`); Test berechnet den Kontrast aller Textpaare in beiden Schemata aus `globals.css`. · files: `src/app/globals.css`, `src/app/design-tokens.test.ts` · → AC-10, AC-11, AC-15
- [x] T2 [P] Grundhöhe von Schaltflächen und Eingabefeldern auf 48 px anheben, ohne die Bausteine nachzubauen. · files: `src/components/ui/button.tsx`, `src/components/ui/input.tsx` · → AC-9
- [x] T3 [P] Navigationsregeln: die fünf Bereiche (Name, Pfad, Symbol) in fester Reihenfolge und die Prüfung „aktiv für Pfad X“ (Pfad selbst oder Unterpfad nach `/`); mit Test. · files: `src/components/shell/navigation.rules.ts`, `src/components/shell/navigation.rules.test.ts` · → AC-1, AC-2, AC-3
- [x] T4 [P] Darstellungsregeln: erlaubte Werte, Speicherschlüssel `pulse-theme` und `pulse-reduce-motion`, Auslesen mit Rückfall bei ungültigen Werten, „Bewegung reduzieren“ gilt bei Gerätemeldung oder eigener Wahl; mit Test. · files: `src/features/appearance/appearance.rules.ts`, `src/features/appearance/appearance.rules.test.ts` · → AC-13, AC-14, AC-15; EC-2
- [x] T5 [P] Proxy: `/bewegung`, `/essen` und `/wochenblick` als geschützte Pfade ergänzen; Test erweitern. · files: `src/proxy.ts`, `src/proxy.test.ts` · → EC-3
- [x] T6 [P] PULSE-Marke (Wortmarke in Unbounded mit statischer Pulslinie) und Kopfbereich (Titel als `h1`, umbrechend, optionaler Platz für genau eine Hauptaktion). · files: `src/components/shell/brand-mark.tsx`, `src/components/shell/page-header.tsx` · → AC-6, AC-7, AC-10; EC-5

## Stufe 2 — Bausteine

- [x] T7 [P] Seitenleiste ab 1024 px aus den shadcn-`Sidebar`-Bausteinen (nicht einklappbar, mit Marke) und fixierte untere Navigation darunter (5 gleich breite Felder ≥ 64 px, Symbol + 14-px-Beschriftung, weiche Trennung „Wochen-blick“, Sicherheitsabstand); aktiver Eintrag mit Balken, kräftiger Schrift und `aria-current="page"`; Render-Test. · files: `src/components/shell/desktop-nav.tsx`, `src/components/shell/mobile-nav.tsx`, `src/components/shell/navigation.test.tsx` · → AC-1, AC-2, AC-3, AC-8, AC-9; EC-4
- [x] T8 [P] Platzhalteransicht für leere Bereiche: Kopfbereich, kurzer ermutigender Text, Link „Zu Heute“; mit Test. · files: `src/components/shell/area-placeholder.tsx`, `src/components/shell/area-placeholder.test.tsx` · → AC-5
- [x] T9 [P] Darstellungs-Provider (`next-themes` mit Klasse `dark`, Standard `system`, Schlüssel `pulse-theme`, Übergänge beim Umschalten aus; „Bewegung reduzieren“ mit Gerätespeicher und Attribut) und Skript, das das Attribut vor dem ersten Zeichnen setzt; mit Test. · files: `src/features/appearance/appearance-provider.tsx`, `src/features/appearance/appearance-script.tsx`, `src/features/appearance/appearance-provider.test.tsx` · → AC-13, AC-15; EC-1, EC-2

## Stufe 3 — Zusammensetzen

- [x] T10 [P] App-Rahmen: Link „Zum Inhalt springen“ als erstes fokussierbares Element, Seitenleiste, untere Navigation, `main` als Sprungziel mit unterem Abstand für die Navigation; mit Test. · files: `src/components/shell/app-shell.tsx`, `src/components/shell/app-shell.test.tsx` · → AC-1, AC-2, AC-8; EC-6
- [x] T11 [P] Root-Layout: Inter und Unbounded über `next/font/google` (selbst ausgeliefert), Darstellungs-Provider und Skript einhängen, `suppressHydrationWarning` am `html`. · files: `src/app/layout.tsx` · → AC-10, AC-12, AC-13; EC-1
- [x] T12 [P] Abschnitt „Darstellung“: Farbschema System/Hell/Dunkel (shadcn `RadioGroup`) mit sofortiger Wirkung, Schalter „Bewegung reduzieren“ (shadcn `Switch`), gesperrt mit Hinweis, wenn das Gerät bereits reduziert; mit Test. · files: `src/features/appearance/appearance-settings.tsx`, `src/features/appearance/appearance-settings.test.tsx` · → AC-14, AC-15; EC-2

## Stufe 4 — Einhängen

- [x] T13 [P] Geschütztes Layout legt nach der Sitzungsprüfung den App-Rahmen um den Inhalt; Ladezustand mit ruhigem Skelett; Fehlerzustand mit „Erneut versuchen“, Navigation bleibt bedienbar. · files: `src/app/(protected)/layout.tsx`, `src/app/(protected)/loading.tsx`, `src/app/(protected)/error.tsx` · → AC-1, AC-2, AC-4, AC-17, AC-18
- [x] T14 [P] Platzhalterseiten für Bewegung, Essen und Wochenblick. · files: `src/app/(protected)/bewegung/page.tsx`, `src/app/(protected)/essen/page.tsx`, `src/app/(protected)/wochenblick/page.tsx` · → AC-5
- [x] T15 [P] „Heute“ und Profil mit Kopfbereich; im Profil den Abschnitt „Darstellung“ ergänzen; doppelte Links („Zum Profil“, „Zu Heute“) und den Abmelde-Knopf auf „Heute“ entfernen. · files: `src/app/(protected)/heute/page.tsx`, `src/app/(protected)/profil/page.tsx` · → AC-4, AC-6, AC-14
- [x] T16 [P] „Seite nicht gefunden“: angemeldet im App-Rahmen mit Weg zu „Heute“, sonst mit Marke ohne Navigation und Weg zum Einstieg. · files: `src/app/not-found.tsx` · → AC-16
- [x] T17 [P] PULSE-Marke auf den öffentlichen Seiten aus PROJ-1 statt des Schriftzugs „PULSE“; keine App-Navigation. · files: `src/app/page.tsx`, `src/app/(auth)/anmelden/page.tsx`, `src/app/(auth)/registrieren/page.tsx`, `src/app/(auth)/passwort-vergessen/page.tsx` · → AC-7, AC-10

## Parallelisierung

- **Stufen sind Schranken.** Grundlagen (1) → Bausteine (2) → Zusammensetzen (3) → Einhängen (4).
- **`[P]` setzt getrennte Dateien voraus.** Die `files:`-Mengen aller `[P]`-Aufgaben einer Stufe sind paarweise verschieden.
- **Nachweise im Browser:** AC-12 (keine Abrufe bei Drittanbietern) und EC-1 (kein Aufblitzen) prüft `/qa` im Browser; die Unit-Tests decken sie nicht ab.
- Während `/build` läuft jede `[P]`-Aufgabe einer Stufe in einem eigenen Subagenten oder nacheinander. Der Hauptagent integriert, prüft gegen die AC-IDs der Stufe und hakt hier ab.
