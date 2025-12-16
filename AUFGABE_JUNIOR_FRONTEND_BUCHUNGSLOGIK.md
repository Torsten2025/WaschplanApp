# 🎨 Aufgabe: Frontend-Buchungslogik testen

**Zugewiesen an:** Junior Frontend Entwickler  
**Priorität:** 🔴 KRITISCH (blockiert Deployment)  
**Geschätzte Zeit:** 1-2 Stunden  
**Status:** ⏳ Offen (abhängig von Slot-Klick-Event Fix)

---

## 📋 Aufgaben-Übersicht

### 1. Buchungs-Flow testen (nach Slot-Klick-Fix)
### 2. UI-Feedback testen
### 3. Datum-Handling testen

---

## 🎯 Aufgabe 1: Buchungs-Flow testen

### Voraussetzung:
- ✅ Slot-Klick-Event muss funktionieren (siehe `AUFGABE_JUNIOR_FRONTEND_SLOT_CLICK.md`)

### Test-Szenarien:

#### 1.1 Buchung erstellen
**Test:**
- [ ] Datum auswählen
- [ ] Namen eingeben
- [ ] Auf freien Slot klicken
- [ ] Bestätigungs-Modal erscheint
- [ ] Bestätigen klicken
- [ ] Buchung wird erstellt
- [ ] Slot wird als "gebucht" markiert
- [ ] Erfolgs-Meldung wird angezeigt

**Code-Stellen:**
- `public/js/app.js` - `handleSlotClick()` (Zeile ~500)
- `public/js/api.js` - `createBooking()` (Zeile ~372)

**Test-Schritte:**
1. App öffnen: `http://localhost:3000`
2. Datum auswählen (z.B. heute)
3. Namen eingeben (z.B. "TestUser")
4. Auf freien Slot klicken (z.B. "08:00-10:00" für Maschine 1)
5. Bestätigungs-Modal sollte erscheinen
6. "Bestätigen" klicken
7. Slot sollte rot werden (gebucht)
8. Erfolgs-Meldung sollte erscheinen

---

#### 1.2 Buchung löschen
**Test:**
- [ ] Eigene Buchung löschen (X-Button klicken)
- [ ] Bestätigungs-Modal erscheint
- [ ] Bestätigen klicken
- [ ] Buchung wird gelöscht
- [ ] Slot wird als "frei" markiert
- [ ] Erfolgs-Meldung wird angezeigt

**Code-Stellen:**
- `public/js/app.js` - `handleDeleteBooking()` (Zeile ~690)
- `public/js/api.js` - `deleteBooking()` (Zeile ~433)

**Test-Schritte:**
1. Eigene Buchung finden (rote Slots mit X-Button)
2. X-Button klicken
3. Bestätigungs-Modal sollte erscheinen
4. "Bestätigen" klicken
5. Slot sollte grün werden (frei)
6. Erfolgs-Meldung sollte erscheinen

---

#### 1.3 Fehlerbehandlung bei Netzwerk-Fehlern
**Test:**
- [ ] Server stoppen
- [ ] Buchung versuchen zu erstellen
- [ ] Fehler-Meldung sollte erscheinen
- [ ] Meldung sollte hilfreich sein ("Server nicht erreichbar")

**Test-Schritte:**
1. Server stoppen: `Ctrl+C` im Terminal
2. App öffnen (läuft noch im Browser)
3. Buchung versuchen zu erstellen
4. Fehler-Meldung sollte erscheinen
5. Server wieder starten: `npm start`

---

#### 1.4 Fehlerbehandlung bei Server-Fehlern
**Test:**
- [ ] Doppelte Buchung versuchen (gleiche Maschine, Slot, Datum)
- [ ] Fehler-Meldung sollte erscheinen
- [ ] Meldung sollte hilfreich sein ("Slot bereits gebucht")

**Test-Schritte:**
1. Buchung erstellen (z.B. Maschine 1, Slot "08:00-10:00", heute)
2. Gleiche Buchung nochmal versuchen
3. Fehler-Meldung sollte erscheinen: "Dieser Slot ist bereits gebucht"

---

#### 1.5 Optimistisches Update
**Test:**
- [ ] Buchung erstellen
- [ ] Slot sollte SOFORT als "gebucht" markiert werden (vor Server-Response)
- [ ] Falls Server-Fehler: Slot sollte wieder "frei" werden

**Code-Stellen:**
- `public/js/app.js` - `handleSlotClick()` (Zeile ~580+)
- Optimistisches Update-Logik

**Test-Schritte:**
1. Buchung erstellen
2. Slot sollte sofort rot werden (optimistisches Update)
3. Server-Response abwarten
4. Falls erfolgreich: Slot bleibt rot
5. Falls Fehler: Slot wird wieder grün

---

## 🎯 Aufgabe 2: UI-Feedback testen

### Test-Szenarien:

#### 2.1 Loading-States
**Test:**
- [ ] Loading-Indikator wird angezeigt während Buchung erstellt wird
- [ ] Loading-Indikator wird angezeigt während Buchungen geladen werden
- [ ] Loading-Indikator verschwindet nach Abschluss

**Code-Stellen:**
- `public/js/app.js` - `showLoading()` (Zeile ~300+)
- `public/js/app.js` - `loadBookings()` (Zeile ~309)

**Test-Schritte:**
1. Datum ändern
2. Loading-Indikator sollte erscheinen
3. Nach Laden sollte verschwinden

---

#### 2.2 Erfolgs-Meldungen
**Test:**
- [ ] Erfolgs-Meldung wird angezeigt nach erfolgreicher Buchung
- [ ] Erfolgs-Meldung wird angezeigt nach erfolgreicher Löschung
- [ ] Meldung verschwindet nach ein paar Sekunden

**Code-Stellen:**
- `public/js/app.js` - `showMessage()` (Zeile ~800+)

**Test-Schritte:**
1. Buchung erstellen
2. Erfolgs-Meldung sollte erscheinen: "Buchung erfolgreich erstellt!"
3. Meldung sollte nach 3-5 Sekunden verschwinden

---

#### 2.3 Fehler-Meldungen
**Test:**
- [ ] Fehler-Meldung wird angezeigt bei Netzwerk-Fehlern
- [ ] Fehler-Meldung wird angezeigt bei Server-Fehlern
- [ ] Fehler-Meldung wird angezeigt bei Validierungs-Fehlern
- [ ] Meldungen sind hilfreich und aussagekräftig

**Code-Stellen:**
- `public/js/app.js` - `showMessage()` mit 'error' type
- `public/js/api.js` - Error-Handling

**Test-Schritte:**
1. Verschiedene Fehler-Szenarien testen
2. Prüfen ob Meldungen hilfreich sind
3. Prüfen ob Meldungen korrekt formatiert sind

---

#### 2.4 Slot-Markierung
**Test:**
- [ ] Gebuchte Slots werden rot markiert
- [ ] Freie Slots werden grün markiert
- [ ] Eigene Buchungen haben X-Button
- [ ] Fremde Buchungen haben keinen X-Button

**Code-Stellen:**
- `public/js/app.js` - `renderSlots()` (Zeile ~347)
- `public/js/app.js` - `createSlotElement()` (Zeile ~462)

**Test-Schritte:**
1. App öffnen
2. Prüfen ob Slots korrekt markiert sind
3. Eigene Buchung erstellen
4. Prüfen ob X-Button erscheint
5. Fremde Buchung prüfen (kein X-Button)

---

## 🎯 Aufgabe 3: Datum-Handling testen

### Test-Szenarien:

#### 3.1 Datum-Auswahl
**Test:**
- [ ] Datum-Input funktioniert
- [ ] Datum kann ausgewählt werden
- [ ] Datum wird korrekt formatiert angezeigt

**Code-Stellen:**
- `public/js/app.js` - Datum-Input-Handling
- `public/index.html` - Datum-Input-Element

**Test-Schritte:**
1. Datum-Input klicken
2. Datum auswählen
3. Prüfen ob Datum korrekt angezeigt wird

---

#### 3.2 Datum-Validierung
**Test:**
- [ ] Vergangene Daten werden abgelehnt (oder automatisch auf heute gesetzt)
- [ ] Ungültige Datums-Formate werden abgelehnt
- [ ] Fehlermeldung wird angezeigt

**Code-Stellen:**
- `public/js/app.js` - `handleSlotClick()` (Zeile ~514+)
- Datum-Validierungs-Logik

**Test-Schritte:**
1. Vergangenes Datum auswählen (z.B. gestern)
2. Buchung versuchen zu erstellen
3. Prüfen ob Fehler-Meldung erscheint oder Datum automatisch auf heute gesetzt wird

---

#### 3.3 Datum-Format
**Test:**
- [ ] Datum wird im korrekten Format an Server gesendet (YYYY-MM-DD)
- [ ] Datum wird korrekt vom Server empfangen
- [ ] Datum wird korrekt angezeigt

**Code-Stellen:**
- `public/js/app.js` - Datum-Formatierung
- `public/js/api.js` - API-Requests

**Test-Schritte:**
1. Buchung erstellen
2. Browser-Console öffnen (F12)
3. Network-Tab prüfen
4. Request-Body prüfen: Datum sollte im Format "YYYY-MM-DD" sein

---

## ✅ Abnahmekriterien

### Buchungs-Flow:
- [ ] Buchung erstellen funktioniert end-to-end
- [ ] Buchung löschen funktioniert end-to-end
- [ ] Fehlerbehandlung ist robust
- [ ] Optimistisches Update funktioniert

### UI-Feedback:
- [ ] Loading-States werden angezeigt
- [ ] Erfolgs-Meldungen werden angezeigt
- [ ] Fehler-Meldungen werden angezeigt
- [ ] Slots werden korrekt markiert

### Datum-Handling:
- [ ] Datum-Auswahl funktioniert
- [ ] Datum-Validierung funktioniert
- [ ] Datum-Format ist korrekt

### Allgemein:
- [ ] Keine JavaScript-Fehler in Console
- [ ] Alle Edge-Cases sind abgedeckt
- [ ] App funktioniert in verschiedenen Browsern

---

## 📝 Code-Stellen zum Prüfen

1. **Buchung erstellen:**
   - `public/js/app.js` - `handleSlotClick()` (Zeile ~500)
   - `public/js/api.js` - `createBooking()` (Zeile ~372)

2. **Buchung löschen:**
   - `public/js/app.js` - `handleDeleteBooking()` (Zeile ~690)
   - `public/js/api.js` - `deleteBooking()` (Zeile ~433)

3. **UI-Feedback:**
   - `public/js/app.js` - `showMessage()` (Zeile ~800+)
   - `public/js/app.js` - `showLoading()` (Zeile ~300+)

4. **Slot-Rendering:**
   - `public/js/app.js` - `renderSlots()` (Zeile ~347)
   - `public/js/app.js` - `createSlotElement()` (Zeile ~462)

---

## 🧪 Test-Plan

### 1. Manuelle Tests:
- Alle oben genannten Test-Szenarien durchführen
- Ergebnisse dokumentieren
- Fehler beheben

### 2. Browser-Tests:
- Chrome testen
- Firefox testen
- Safari testen (falls verfügbar)
- Edge testen (falls verfügbar)

### 3. Edge-Cases:
- Sehr lange Benutzernamen
- Sonderzeichen in Benutzernamen
- Sehr alte Daten
- Sehr zukünftige Daten
- Netzwerk-Unterbrechungen

---

## 📚 Referenzen

- Slot-Klick-Event Fix: `AUFGABE_JUNIOR_FRONTEND_SLOT_CLICK.md`
- API-Dokumentation: `API_DOKUMENTATION.md`
- Frontend-Code: `public/js/app.js`

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Offen (abhängig von Slot-Klick-Event Fix)  
**Zuletzt aktualisiert:** [Aktuelles Datum]

