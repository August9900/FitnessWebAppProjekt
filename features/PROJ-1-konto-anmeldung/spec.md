# PROJ-1: Konto & Anmeldung

## Abhängigkeiten

- Keine vorgelagerte Produktfunktion. PROJ-2 übernimmt später den gemeinsamen App-Rahmen und den Bereich „Heute“; PROJ-3 ergänzt die fachlichen Profilangaben.

## User Stories

- Als Person ab 12 Jahren möchte ich ein Konto mit meiner E-Mail-Adresse erstellen, damit ich PULSE auf mehreren Geräten nutzen kann.
- Als angemeldete Person möchte ich nur meine eigenen Daten sehen und ändern können, damit meine Angaben privat bleiben.
- Als Person, die ihr Passwort vergessen hat, möchte ich den Zugang zum selben Konto behalten.
- Als angemeldete Person möchte ich meine Daten herunterladen und mein Konto löschen können, damit ich die Kontrolle über meine Angaben behalte.

## Nicht enthalten

- Anmeldung über Google, Apple oder andere Drittanbieter; Gastzugang und Familienkonten.
- Mehrfaktor-Authentifizierung und zusätzliche Nutzendenrollen.
- Ziele, Trainingsmöglichkeiten, Diagnosen oder Körperdaten beim Registrieren; fachliche Profilangaben gehören zu PROJ-3.
- Ein eigener App-Rahmen oder eine zweite Navigation; diese gehören zu PROJ-2.
- Ein sichtbarer Wiederherstellungszeitraum nach bestätigter Kontolöschung.
- Im lokalen Prototyp: E-Mail-Bestätigung bei der Registrierung, E-Mail-Wechsel, Sperren und Anfragegrenzen, Bot-Prüfung und Prüfung kompromittierter Passwörter. Diese Kriterien stehen unter „Zurückgestellt bis vor dem ersten Deploy“.

## Acceptance Criteria

- [ ] **AC-1** — Angenommen eine Person ist nicht angemeldet, wenn sie einen persönlichen Bereich direkt aufruft, dann erhält sie keinen Zugriff auf dessen Inhalte oder Daten und wird zum Konto-Zugang geführt.
- [ ] **AC-2** — Angenommen eine Person ist mindestens 12 Jahre alt, wenn sie eine gültige E-Mail-Adresse, ein zulässiges Passwort und die Altersgruppe „12–15“ oder „ab 16“ angibt, dann wird ein Konto angelegt und sie gelangt angemeldet zum geschützten Einstieg, ohne ein genaues Geburtsdatum oder fachliche Profilangaben eingeben zu müssen.
- [ ] **AC-3** — Angenommen eine Person gibt an, jünger als 12 Jahre zu sein, wenn sie die Registrierung fortsetzen möchte, dann wird kein Konto angelegt und sie erhält eine verständliche Altersgrenze angezeigt.
- [ ] **AC-5** — Angenommen ein Konto existiert und ist nicht gelöscht, wenn die Person sich mit den richtigen Zugangsdaten anmeldet, dann erreicht sie den geschützten Einstieg in die App und bleibt bei einem Seitenwechsel angemeldet.
- [ ] **AC-6** — Angenommen eine Anmeldung oder Passwort-Zurücksetzung kann für die angegebene E-Mail-Adresse nicht wie angefordert abgeschlossen werden, wenn eine Rückmeldung erscheint, dann verrät sie nicht, ob zu dieser Adresse ein Konto existiert; die Antwortzeiten sind für bestehende und unbekannte Adressen vergleichbar.
- [ ] **AC-7** — Angenommen eine Person legt ein neues Passwort fest, wenn es weniger als 12 Zeichen hat, dann wird es mit einer verständlichen Begründung abgelehnt; längere Passphrasen sind zulässig.
- [ ] **AC-8** — Angenommen eine Person hat ihr Passwort vergessen, wenn sie eine Zurücksetzung anfordert und den einmalig nutzbaren Nachweis aus der E-Mail gültig bestätigt, dann kann sie ein neues zulässiges Passwort setzen und sich damit anmelden.
- [ ] **AC-9** — Angenommen eine Person ist angemeldet, wenn sie ihr Passwort mit erneuter Bestätigung ihrer Identität ändert, dann gilt nur noch das neue Passwort und bestehende andere Sitzungen verlieren den Zugang.
- [ ] **AC-11** — Angenommen eine Person ist angemeldet, wenn sie sich abmeldet, dann endet ihre Sitzung und persönliche Bereiche sind auf diesem Gerät erst nach erneuter Anmeldung erreichbar.
- [ ] **AC-12** — Angenommen eine Sitzung ist abgelaufen oder ungültig geworden, wenn die Person einen geschützten Bereich oder eine persönliche Datenanfrage aufruft, dann erhält sie keinen Zugriff und kann sich erneut anmelden.
- [ ] **AC-13** — Angenommen ein Konto wurde erstellt, wenn die Person ihre Kontodaten aufruft, dann existiert genau ein ihr zugeordnetes, zunächst fachlich leeres Kurzprofil als Grundlage für PROJ-3.
- [ ] **AC-14** — Angenommen zwei Konten besitzen persönliche Daten, wenn eines davon die Daten des anderen über die Oberfläche oder eine direkte Datenanfrage lesen oder ändern will, dann wird der Zugriff verweigert.
- [ ] **AC-15** — Angenommen eine Person ist angemeldet, wenn sie „Meine Daten herunterladen“ auslöst, dann erhält sie eine maschinenlesbare Kopie ihrer gespeicherten Konto- und persönlichen App-Daten, ohne Daten anderer Personen.
- [ ] **AC-16** — Angenommen eine Person ist angemeldet, wenn sie die Kontolöschung ausdrücklich bestätigt, dann verliert das Konto sofort den Zugang, alle aktiven Sitzungen enden, ihre aktiven Konto- und App-Daten werden gelöscht und es gibt keinen Wiederherstellungsweg.
- [ ] **AC-21** — Angenommen eine Person sendet ein Kontoformular mit fehlenden oder ungültigen Angaben ab, wenn die Eingabe geprüft wird, dann erscheinen verständliche Fehler direkt bei den betroffenen Feldern und keine vertraulichen Eingaben werden in eine URL geschrieben.

## Edge Cases

- [ ] **EC-1** — Angenommen zwei Registrierungen für dieselbe E-Mail-Adresse treffen nahezu gleichzeitig ein, wenn beide verarbeitet werden, dann entsteht höchstens ein Konto und die abgewiesene Anfrage erhält eine verständliche Rückmeldung ohne technische Details.
- [ ] **EC-2** — Angenommen ein Nachweis für eine Passwort-Zurücksetzung ist abgelaufen oder wurde bereits verwendet, wenn er erneut eingesetzt wird, dann ändert sich der Kontostatus nicht und die Person kann einen neuen Nachweis anfordern.
- [ ] **EC-3** — Angenommen der Nachrichtendienst meldet einen Fehler bei einer Zurücksetzungsnachricht, wenn die Person erneut anfordert, dann wird kein erfolgreicher Versand vorgetäuscht und sie erhält eine neutrale Möglichkeit zum erneuten Versuch.
- [ ] **EC-4** — Angenommen die Verbindung bricht während einer Registrierung ab, wenn die Person dieselben Angaben erneut sendet, dann entsteht kein doppeltes Konto und sie erhält einen Weg zur Anmeldung.
- [ ] **EC-5** — Angenommen eine Kontolöschung und eine Anmeldung auf einem zweiten Gerät überschneiden sich, wenn die Löschung bestätigt wurde, dann erhält das zweite Gerät keinen weiteren Zugriff und das Konto wird nicht wiederhergestellt.

## Zurückgestellt bis vor dem ersten Deploy

Für den lokalen Prototyp mit Testdaten zurückgestellt (Entscheidung vom 2026-11-11). Diese Kriterien sind **Pflicht vor dem ersten Deploy**: Vorher werden sie über `/refine PROJ-1` wieder in die aktiven Kriterien übernommen, danach folgen `/architecture`, `/tasks`, `/build` und `/qa`. Die IDs bleiben unverändert. `/qa` prüft sie im Prototyp nicht.

- [ ] **AC-4** — Angenommen ein Konto wurde neu angelegt, wenn seine E-Mail-Adresse noch nicht bestätigt ist, dann bleiben die persönlichen Bereiche gesperrt und die Person erhält einen Weg, die Bestätigung abzuschließen oder erneut anzufordern.
- [ ] **AC-2 (Teil)** — Die Registrierung legt ein Konto zur Bestätigung an; erst nach Bestätigung gelangt die Person in den geschützten Einstieg.
- [ ] **AC-5 (Teil)** — Nur Konten mit bestätigter E-Mail-Adresse erreichen nach der Anmeldung den geschützten Einstieg.
- [ ] **AC-6 (Teil)** — Auch die Rückmeldung der Registrierung verrät nicht, ob zu der angegebenen Adresse ein Konto existiert; die Antwortzeiten sind vergleichbar.
- [ ] **AC-7 (Teil)** — Ein als kompromittiert bekanntes Passwort wird mit einer verständlichen Begründung abgelehnt.
- [ ] **AC-10** — Angenommen eine Person ist angemeldet, wenn sie ihre E-Mail-Adresse ändert, dann wird die neue Adresse erst nach Bestätigung für die Anmeldung verwendet; bis dahin bleibt die bisherige Adresse gültig und wird über die Änderung informiert.
- [ ] **AC-17** — Angenommen für dieselbe E-Mail-Adresse sind innerhalb von 15 Minuten fünf Anmeldungen fehlgeschlagen, wenn ein weiterer Versuch erfolgt, dann wird er für 15 Minuten zurückgewiesen und die Person sieht eine neutrale Wartezeitmeldung.
- [ ] **AC-18** — Angenommen von derselben IP-Adresse sind innerhalb von 15 Minuten 20 Anmeldungen fehlgeschlagen, wenn ein weiterer Versuch erfolgt, dann wird er für 15 Minuten zurückgewiesen, unabhängig von der jeweils eingegebenen E-Mail-Adresse.
- [ ] **AC-19** — Angenommen von derselben IP-Adresse wurden innerhalb einer Stunde fünf Registrierungen oder drei Passwort-Zurücksetzungen angefordert, wenn eine weitere gleichartige Anfrage erfolgt, dann wird sie bis zum Ende dieses Stundenfensters zurückgewiesen; für dieselbe E-Mail-Adresse gelten höchstens drei Zurücksetzungen pro Stunde.
- [ ] **AC-20** — Angenommen ein öffentliches Formular für Registrierung oder Passwort-Zurücksetzung wird automatisiert aufgerufen, wenn die Bot-Prüfung nicht bestanden wird, dann wird keine Anfrage verarbeitet; bei auffälligen Anmeldeversuchen wird ebenfalls eine Bot-Prüfung verlangt.
- [ ] **EC-1 (Teil)** — Bei nahezu gleichzeitigen Registrierungen derselben Adresse verrät keine Antwort, ob die Adresse zuvor registriert war.
- [ ] **EC-2 (Teil)** — Ein abgelaufener oder bereits verwendeter Nachweis für die E-Mail-Bestätigung ändert den Kontostatus nicht; ein neuer kann angefordert werden.
- [ ] **EC-3 (Teil)** — Meldet der Nachrichtendienst einen Fehler bei einer Bestätigungsnachricht, wird kein erfolgreicher Versand vorgetäuscht und ein neutraler erneuter Versuch ist möglich.
- [ ] **EC-4 (Teil)** — Nach einem Verbindungsabbruch während der Registrierung erhält die Person einen sicheren Weg, den Status der Bestätigung zu klären.
- [ ] **EC-6** — Angenommen eine neue E-Mail-Adresse wird nicht bestätigt, wenn die Person sich später anmeldet, dann bleibt die bisherige bestätigte Adresse gültig und es entsteht kein zweites Konto.
- [ ] **EC-7** — Angenommen eine Sperrfrist für Anmeldeversuche endet, wenn die Person erneut korrekte Zugangsdaten eingibt, dann ist die Anmeldung wieder möglich, sofern das Konto bestätigt und nicht gelöscht ist.

## Übergreifende Anforderungen

- Kontoformulare, Fehlermeldungen und Bestätigungen sind auf Mobilgeräten und mit Tastatur nutzbar und verwenden kurze, eindeutige deutsche Texte.
- Die Datenzugriffskontrolle gilt unabhängig von der sichtbaren Oberfläche auch für direkte Anfragen an persönliche Daten.
- Zugangsversuche und Fehler dürfen keine Passwörter oder vollständigen Nachweise in Protokolle schreiben.

## Offene Fragen

Die folgenden Punkte werden vor dem ersten Deploy geklärt. Sie halten die lokale Entwicklung und Tests nicht auf. Falls sich daraus Änderungen am Verhalten ergeben, werden die betroffenen Acceptance Criteria vor der Veröffentlichung über `/refine PROJ-1` angepasst.

- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-1` prüft die Registrierung von 12- bis 15-Jährigen und klärt, ob zusätzliche Schritte oder Änderungen am Registrierungsablauf erforderlich sind.
- [ ] Vor dem ersten Deploy: `/dsgvo PROJ-1` klärt die Löschfristen für Sicherungen und Sicherheitsprotokolle sowie den Umgang mit laufenden Export- oder Löschanfragen.
- [ ] Vor dem ersten Deploy: Die Auth-Architektur muss AC-7 und AC-17 bis AC-20 auch gegen direkt erreichbare gehostete Auth-Endpunkte erfüllen. Dafür werden Kosten und mögliche Anpassungen der technischen Lösung geprüft.
- [ ] Vor dem ersten Deploy: Verantwortlichen, Produktionshoster, E-Mail-Dienst und erforderliche Verträge festlegen; die Datenschutzprüfung dokumentiert die tatsächlichen Datenflüsse.

## Entscheidungsprotokoll

### Produktentscheidungen

| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| E-Mail und Passwort mit E-Mail-Bestätigung und Passwort-Zurücksetzung; keine Anmeldung über Drittanbieter in Version 1 | Ein klarer, begrenzter Konto-Zugang für die erste Version. | 2026-09-30 |
| Registrierung ab 12 mit Altersgruppe statt genauem Geburtsdatum | Die Zielgruppe umfasst Minderjährige; die Abfrage soll sparsam bleiben. | 2026-09-30 |
| Selbst bedienbares Abmelden, Passwort- und E-Mail-Wechsel, Datenexport und Kontolöschung | Nutzende können Zugang und eigene Daten selbst verwalten. | 2026-09-30 |
| Nach bestätigter Kontolöschung kein Wiederherstellungszeitraum | Die Löschung soll für Nutzende eindeutig und sofort wirksam sein. | 2026-09-30 |
| Passwort mindestens 12 Zeichen, Passphrasen zulassen, bekannte kompromittierte Passwörter ablehnen | Erleichtert starke, merkbare Passwörter. | 2026-09-30 |
| Fünf fehlgeschlagene Anmeldungen je Adresse und 20 je IP in 15 Minuten; fünf Registrierungen und drei Zurücksetzungen je IP pro Stunde; Bot-Prüfung | Schützt öffentliche Kontoformulare vor automatisierten Versuchen. | 2026-09-30 |
| Für den lokalen Prototyp zurückgestellt: E-Mail-Bestätigung bei der Registrierung (AC-4 und abhängige Teile), E-Mail-Wechsel (AC-10, EC-6), Sperren und Anfragegrenzen (AC-17–AC-19, EC-7), Bot-Prüfung (AC-20) und Prüfung kompromittierter Passwörter (Teil von AC-7). Alle sind Pflicht vor dem ersten Deploy. | Der Prototyp soll schnell lauffähig sein und läuft nur lokal mit Testdaten; die Schutzfunktionen machen den größten Aufwand aus. Ohne Bestätigung kann die Registrierung nicht neutral bleiben, deshalb ist auch dieser Teil von AC-6 und EC-1 zurückgestellt. Die Entscheidungen vom 2026-09-30 gelten für den Deploy weiter. | 2026-11-11 |
