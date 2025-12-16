# User-Acceptance-Test Plan - WaschmaschinenApp

## Übersicht

Dieser Plan beschreibt die User-Acceptance-Tests (UAT) für die Waschmaschinen-Buchungsapp. UAT-Tests werden von Endbenutzern durchgeführt, um sicherzustellen, dass die Anwendung ihren Anforderungen entspricht.

**Version:** 1.0.0  
**Erstellt am:** _______________  
**Geplant für:** _______________

---

## Test-User-Stories

### User Story 1: Als Mieter möchte ich eine Waschmaschine buchen

**Akzeptanzkriterien:**
- ✅ Ich kann eine verfügbare Maschine auswählen
- ✅ Ich kann ein Datum auswählen (heute oder später)
- ✅ Ich kann einen Zeit-Slot auswählen
- ✅ Ich kann meinen Namen eingeben
- ✅ Die Buchung wird erfolgreich erstellt
- ✅ Ich sehe eine Bestätigung

**Test-Szenario:**
1. Öffne die App
2. Wähle ein Datum (z.B. morgen)
3. Wähle eine Maschine (z.B. "Waschmaschine 1")
4. Wähle einen Slot (z.B. "08:00-10:00")
5. Gib deinen Namen ein
6. Klicke auf "Buchen"
7. Prüfe, dass Buchung erstellt wurde

**Erwartetes Ergebnis:**
- ✅ Buchung erscheint in der Liste
- ✅ Erfolgsmeldung wird angezeigt
- ✅ Buchung ist für das gewählte Datum sichtbar

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

### User Story 2: Als Mieter möchte ich meine Buchung löschen

**Akzeptanzkriterien:**
- ✅ Ich kann meine Buchung in der Liste sehen
- ✅ Ich kann meine Buchung löschen
- ✅ Die Buchung wird aus der Liste entfernt
- ✅ Ich erhalte eine Bestätigung

**Test-Szenario:**
1. Öffne die App
2. Erstelle eine Buchung (siehe User Story 1)
3. Finde die Buchung in der Liste
4. Klicke auf "Löschen"
5. Bestätige die Löschung (falls Bestätigungsdialog vorhanden)

**Erwartetes Ergebnis:**
- ✅ Buchung verschwindet aus der Liste
- ✅ Erfolgsmeldung wird angezeigt
- ✅ Buchung ist nicht mehr buchbar (Slot ist wieder frei)

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

### User Story 3: Als Mieter möchte ich sehen, welche Maschinen verfügbar sind

**Akzeptanzkriterien:**
- ✅ Ich sehe alle verfügbaren Maschinen
- ✅ Ich kann zwischen Waschmaschinen und Trocknungsräumen unterscheiden
- ✅ Die Maschinen sind klar beschriftet

**Test-Szenario:**
1. Öffne die App
2. Prüfe die Maschinen-Liste

**Erwartetes Ergebnis:**
- ✅ Mindestens 4 Maschinen werden angezeigt
- ✅ Maschinen-Namen sind klar lesbar
- ✅ Typ (Waschmaschine/Trocknungsraum) ist erkennbar

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

### User Story 4: Als Mieter möchte ich sehen, welche Zeit-Slots verfügbar sind

**Akzeptanzkriterien:**
- ✅ Ich sehe alle verfügbaren Zeit-Slots
- ✅ Slots sind klar formatiert (z.B. "08:00-10:00")
- ✅ Belegte Slots sind als belegt markiert

**Test-Szenario:**
1. Öffne die App
2. Wähle ein Datum
3. Prüfe die verfügbaren Slots

**Erwartetes Ergebnis:**
- ✅ 6 Zeit-Slots werden angezeigt
- ✅ Slots sind klar formatiert
- ✅ Belegte Slots sind als belegt markiert (optional)

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

### User Story 5: Als Mieter möchte ich Buchungen für verschiedene Daten ansehen

**Akzeptanzkriterien:**
- ✅ Ich kann das Datum ändern
- ✅ Ich sehe Buchungen für das gewählte Datum
- ✅ Die Liste aktualisiert sich automatisch

**Test-Szenario:**
1. Öffne die App
2. Wähle ein Datum (z.B. heute)
3. Sieh dir die Buchungen an
4. Ändere das Datum (z.B. morgen)
5. Prüfe, dass sich die Liste aktualisiert

**Erwartetes Ergebnis:**
- ✅ Buchungen für das gewählte Datum werden angezeigt
- ✅ Bei Datumsänderung aktualisiert sich die Liste
- ✅ Keine Fehler in der Konsole

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

### User Story 6: Als Mieter möchte ich nicht vergangene Daten buchen können

**Akzeptanzkriterien:**
- ✅ Vergangene Daten können nicht ausgewählt werden
- ✅ Nur heute und zukünftige Daten sind verfügbar

**Test-Szenario:**
1. Öffne die App
2. Versuche ein vergangenes Datum auszuwählen

**Erwartetes Ergebnis:**
- ✅ Vergangene Daten sind im Datum-Picker nicht verfügbar
- ✅ Oder: Fehlermeldung bei Versuch, vergangenes Datum zu buchen

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

### User Story 7: Als Mieter möchte ich nicht doppelt buchen können

**Akzeptanzkriterien:**
- ✅ Ich kann nicht den gleichen Slot für die gleiche Maschine am gleichen Tag buchen
- ✅ Ich erhalte eine Fehlermeldung bei Doppelbuchung

**Test-Szenario:**
1. Öffne die App
2. Erstelle eine Buchung (Maschine 1, Datum X, Slot "08:00-10:00")
3. Versuche erneut, die gleiche Buchung zu erstellen

**Erwartetes Ergebnis:**
- ✅ Fehlermeldung: "Dieser Slot ist bereits gebucht"
- ✅ Zweite Buchung wird nicht erstellt

**Tester:** _______________  
**Datum:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

**Bemerkungen:**
_________________________________________________

---

## UAT-Szenarien

### Szenario 1: Normale Buchung

**Beschreibung:** Ein Benutzer bucht erfolgreich eine Waschmaschine.

**Schritte:**
1. App öffnen
2. Datum auswählen (morgen)
3. Maschine auswählen (Waschmaschine 1)
4. Slot auswählen (10:00-12:00)
5. Namen eingeben ("Max Mustermann")
6. "Buchen" klicken
7. Bestätigung prüfen

**Erwartetes Ergebnis:**
- ✅ Buchung erfolgreich erstellt
- ✅ Buchung in Liste sichtbar
- ✅ Erfolgsmeldung angezeigt

**Tester:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

---

### Szenario 2: Buchung löschen

**Beschreibung:** Ein Benutzer löscht eine bestehende Buchung.

**Schritte:**
1. App öffnen
2. Bestehende Buchung finden
3. "Löschen" klicken
4. Bestätigen (falls Dialog)

**Erwartetes Ergebnis:**
- ✅ Buchung wird gelöscht
- ✅ Buchung verschwindet aus Liste
- ✅ Slot ist wieder verfügbar

**Tester:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

---

### Szenario 3: Fehlerbehandlung - Doppelbuchung

**Beschreibung:** Ein Benutzer versucht, einen bereits gebuchten Slot zu buchen.

**Schritte:**
1. App öffnen
2. Buchung erstellen (Maschine 1, Datum X, Slot "08:00-10:00")
3. Erneut versuchen, gleiche Buchung zu erstellen

**Erwartetes Ergebnis:**
- ✅ Fehlermeldung wird angezeigt
- ✅ Zweite Buchung wird nicht erstellt

**Tester:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

---

### Szenario 4: Datum wechseln

**Beschreibung:** Ein Benutzer wechselt zwischen verschiedenen Daten.

**Schritte:**
1. App öffnen
2. Datum auf "heute" setzen
3. Buchungen ansehen
4. Datum auf "morgen" ändern
5. Buchungen ansehen

**Erwartetes Ergebnis:**
- ✅ Buchungen für gewähltes Datum werden angezeigt
- ✅ Liste aktualisiert sich korrekt
- ✅ Keine Fehler

**Tester:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

---

### Szenario 5: Mobile Nutzung

**Beschreibung:** Ein Benutzer nutzt die App auf einem mobilen Gerät.

**Schritte:**
1. App auf Mobile-Gerät öffnen
2. Alle Funktionen testen:
   - Maschinen anzeigen
   - Buchung erstellen
   - Buchung löschen
   - Datum ändern

**Erwartetes Ergebnis:**
- ✅ UI ist responsive
- ✅ Touch-Interaktionen funktionieren
- ✅ Alle Funktionen sind nutzbar

**Tester:** _______________  
**Status:** ⬜ Bestanden / ⬜ Fehlgeschlagen

---

## Acceptance-Criteria Checkliste

### Funktionalität

- [ ] Buchung erstellen funktioniert
- [ ] Buchung löschen funktioniert
- [ ] Maschinen werden korrekt angezeigt
- [ ] Slots werden korrekt angezeigt
- [ ] Datum-Auswahl funktioniert
- [ ] Doppelbuchung wird verhindert
- [ ] Vergangene Daten können nicht gebucht werden

### Benutzerfreundlichkeit

- [ ] UI ist intuitiv
- [ ] Fehlermeldungen sind verständlich
- [ ] Erfolgsmeldungen sind klar
- [ ] Navigation ist logisch
- [ ] Responsive Design funktioniert

### Performance

- [ ] Seite lädt schnell (< 2 Sekunden)
- [ ] API-Requests sind schnell (< 500ms)
- [ ] Keine spürbaren Verzögerungen

### Browser-Kompatibilität

- [ ] Chrome funktioniert
- [ ] Firefox funktioniert
- [ ] Safari funktioniert
- [ ] Mobile Browser funktionieren

---

## Test-Umgebung

**URL:** http://localhost:3000  
**Browser:** _______________  
**Gerät:** _______________  
**Betriebssystem:** _______________

---

## Test-Ergebnisse Zusammenfassung

**Gesamtanzahl Tests:** 7 User Stories + 5 Szenarien = 12  
**Bestanden:** _______________  
**Fehlgeschlagen:** _______________  
**Übersprungen:** _______________

**Kritische Fehler:** _______________  
**Mittlere Fehler:** _______________  
**Niedrige Fehler:** _______________

**Test-Dauer:** _______________

---

## Feedback & Anmerkungen

**Allgemeine Anmerkungen:**
_________________________________________________
_________________________________________________
_________________________________________________

**Verbesserungsvorschläge:**
_________________________________________________
_________________________________________________
_________________________________________________

**Tester:** _______________  
**Datum:** _______________

---

## Sign-off

**Ich bestätige, dass die Anwendung die Anforderungen erfüllt:**

**Tester:** _______________  
**Datum:** _______________  
**Unterschrift:** _______________

**Product Owner:** _______________  
**Datum:** _______________  
**Unterschrift:** _______________

