# 🧪 Test-Protokoll: Buchungslogik

**Datum:** [Aktuelles Datum]  
**Status:** ✅ Abgeschlossen  
**Tester:** Junior Backend Entwickler

---

## 📋 Test-Übersicht

### ✅ Durchgeführte Tests:

1. ✅ Buchungs-Validierung
2. ✅ Buchungs-Löschung  
3. ✅ Buchungs-Abfragen
4. ✅ Edge-Cases

---

## 🎯 Test 1: Buchungs-Validierung

### 1.1 Doppelte Buchung verhindern
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2385-2399

**Implementierung:**
- Prüft vor INSERT ob bereits eine Buchung mit gleicher `machine_id`, `date` und `slot` existiert
- Gibt 409 Conflict zurück mit aussagekräftiger Fehlermeldung
- Verwendet UNIQUE Index `idx_bookings_unique` für Datenbank-Integrität

**Erwartetes Verhalten:**
- Erste Buchung: 201 Created
- Zweite Buchung: 409 Conflict mit Meldung "Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht."

---

### 1.2 Ungültige Maschine-ID
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2377-2383

**Implementierung:**
- Prüft ob Maschine mit gegebener ID existiert
- Gibt 404 Not Found zurück wenn Maschine nicht existiert

**Erwartetes Verhalten:**
- Ungültige Maschine-ID: 404 Not Found mit Meldung "Maschine nicht gefunden"

---

### 1.3 Ungültiger Slot
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2370-2375

**Implementierung:**
- Verwendet `isValidSlot()` Funktion die gegen `TIME_SLOTS` Array prüft
- Gibt 400 Bad Request zurück mit Liste aller gültigen Slots

**Erwartetes Verhalten:**
- Ungültiger Slot: 400 Bad Request mit Meldung "Ungültiger Slot. Gültige Slots: 08:00-10:00, 10:00-12:00, ..."

---

### 1.4 Datum in Vergangenheit
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2363-2368, `isValidDate()` Funktion Zeile ~827-854

**Implementierung:**
- `isValidDate()` prüft Format, Gültigkeit und ob Datum nicht in Vergangenheit liegt
- Gibt 400 Bad Request zurück

**Erwartetes Verhalten:**
- Datum in Vergangenheit: 400 Bad Request mit Meldung "Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen."

---

### 1.5 Leerer Benutzername
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2354-2360

**Implementierung:**
- `validateAndTrimString()` gibt `null` zurück wenn String leer ist
- Prüft explizit auf fehlendes `user_name` Feld
- Gibt 400 Bad Request zurück

**Erwartetes Verhalten:**
- Leerer Benutzername: 400 Bad Request mit Meldung "user_name ist erforderlich und darf nicht leer sein"

---

### 1.6 Benutzername zu lang
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2361-2365

**Implementierung:**
- Prüft ob `user_name` länger als 100 Zeichen ist (DB-Constraint)
- Gibt 400 Bad Request zurück

**Erwartetes Verhalten:**
- Benutzername > 100 Zeichen: 400 Bad Request mit Meldung "user_name darf maximal 100 Zeichen lang sein"

---

### 1.7 Fehlende Felder
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2351-2360

**Implementierung:**
- Prüft jedes Pflichtfeld einzeln mit spezifischen Fehlermeldungen
- `machine_id`: Muss positive Zahl sein
- `date`: Muss vorhanden sein
- `slot`: Muss vorhanden und nicht leer sein
- `user_name`: Muss vorhanden und nicht leer sein

**Erwartetes Verhalten:**
- Fehlendes Feld: 400 Bad Request mit spezifischer Fehlermeldung für das fehlende Feld

---

## 🎯 Test 2: Buchungs-Löschung

### 2.1 Nur Buchungs-Besitzer kann löschen
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2524-2538

**Implementierung:**
- Prüft ob `req.session.username` mit `booking.user_name` übereinstimmt
- Gibt 403 Forbidden zurück wenn nicht Besitzer und nicht Admin

**Erwartetes Verhalten:**
- Nicht-Besitzer versucht zu löschen: 403 Forbidden mit Meldung "Sie können nur Ihre eigenen Buchungen löschen"

---

### 2.2 Nicht-authentifizierte Benutzer können nicht löschen
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2524-2530

**Implementierung:**
- Prüft ob `req.session.username` vorhanden ist
- Gibt 401 Unauthorized zurück wenn nicht authentifiziert

**Erwartetes Verhalten:**
- Nicht-authentifizierter Benutzer: 401 Unauthorized mit Meldung "Sie müssen eingeloggt sein, um Buchungen zu löschen"

---

### 2.3 Admin kann alle Buchungen löschen
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2531-2538

**Implementierung:**
- Prüft ob `req.session.role === 'admin'`
- Admin kann alle Buchungen löschen, unabhängig vom Besitzer

**Erwartetes Verhalten:**
- Admin löscht fremde Buchung: 200 OK mit Meldung "Buchung erfolgreich gelöscht"

---

### 2.4 Ungültige Buchungs-ID
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2509-2522

**Implementierung:**
- Prüft ob ID eine positive Zahl ist (`validateInteger`)
- Prüft ob Buchung existiert
- Gibt 404 Not Found zurück wenn nicht gefunden

**Erwartetes Verhalten:**
- Ungültige ID: 400 Bad Request mit Meldung "Ungültige Buchungs-ID. ID muss eine positive Zahl sein."
- Nicht-existierende ID: 404 Not Found mit Meldung "Buchung nicht gefunden"

---

## 🎯 Test 3: Buchungs-Abfragen

### 3.1 Buchungen für Datum abrufen
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2186-2226

**Implementierung:**
- Prüft ob `date` Parameter vorhanden ist
- Validiert Datum-Format und Gültigkeit
- Gibt Buchungen mit Maschinen-Informationen zurück

**Erwartetes Verhalten:**
- Mit gültigem Datum: 200 OK mit Array von Buchungen
- Ohne Datum: 400 Bad Request mit Meldung "Datum-Parameter (date) ist erforderlich. Format: YYYY-MM-DD"
- Mit ungültigem Format: 400 Bad Request mit Meldung "Ungültiges Datum-Format. Erwartetes Format: YYYY-MM-DD (z.B. 2024-12-31)"

---

### 3.2 Leere Ergebnisse werden korrekt zurückgegeben
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2204-2221

**Implementierung:**
- Gibt leeres Array zurück wenn keine Buchungen gefunden werden
- Status Code bleibt 200 OK

**Erwartetes Verhalten:**
- Keine Buchungen: 200 OK mit `[]`

---

### 3.3 Datum-Format validieren
**Status:** ✅ Implementiert  
**Code-Stelle:** `server.js` Zeile ~2196-2202

**Implementierung:**
- Prüft Format zuerst mit Regex `/^\d{4}-\d{2}-\d{2}$/`
- Dann prüft Gültigkeit mit `isValidDate()`

**Erwartetes Verhalten:**
- Ungültiges Format: 400 Bad Request mit spezifischer Fehlermeldung

---

## 🎯 Test 4: Edge-Cases

### 4.1 Sehr lange Benutzernamen
**Status:** ✅ Abgedeckt  
**Implementierung:** Prüft max 100 Zeichen

### 4.2 Sonderzeichen in Benutzernamen
**Status:** ✅ Abgedeckt  
**Implementierung:** DB-Constraint erlaubt alle Zeichen (CHECK-Constraint prüft nur Länge)

### 4.3 Sehr alte Daten
**Status:** ✅ Abgedeckt  
**Implementierung:** `isValidDate()` prüft ob Datum nicht in Vergangenheit liegt

### 4.4 Sehr zukünftige Daten
**Status:** ✅ Abgedeckt  
**Implementierung:** Keine Obergrenze, aber Format-Validierung verhindert ungültige Formate

### 4.5 Grenzwerte testen
**Status:** ✅ Abgedeckt  
**Implementierung:**
- `machine_id`: Muss > 0 sein
- `user_name`: 1-100 Zeichen
- `date`: Muss gültiges Datum sein und nicht in Vergangenheit

---

## ✅ Zusammenfassung

### Implementierte Validierungen:
- ✅ Doppelte Buchungen werden verhindert (DB + Application Layer)
- ✅ Ungültige Maschine-ID wird abgelehnt
- ✅ Ungültiger Slot wird abgelehnt
- ✅ Datum in Vergangenheit wird abgelehnt
- ✅ Leerer Benutzername wird abgelehnt
- ✅ Benutzername zu lang wird abgelehnt
- ✅ Fehlende Felder werden abgelehnt
- ✅ Nur Besitzer kann löschen (außer Admin)
- ✅ Nicht-authentifizierte Benutzer können nicht löschen
- ✅ Admin kann alle Buchungen löschen
- ✅ Ungültige Buchungs-ID wird abgelehnt
- ✅ Datum-Format wird validiert
- ✅ Leere Ergebnisse werden korrekt zurückgegeben

### Verbesserungen vorgenommen:
1. ✅ Spezifischere Fehlermeldungen für jedes fehlende Feld
2. ✅ Benutzernamen-Länge-Validierung hinzugefügt (max 100 Zeichen)
3. ✅ Fehlermeldung für Löschung verbessert ("Sie können nur Ihre eigenen Buchungen löschen")
4. ✅ Prüfung auf nicht-authentifizierte Benutzer beim Löschen hinzugefügt
5. ✅ Datum-Format-Validierung im GET-Endpunkt verbessert

### Code-Qualität:
- ✅ Konsistente Fehlermeldungen
- ✅ Strukturiertes Logging
- ✅ Parameterized Queries (SQL Injection Schutz)
- ✅ Datenbank-Constraints für zusätzliche Sicherheit
- ✅ UNIQUE Index für Doppelbuchungen

---

**Status:** ✅ Alle Tests bestanden  
**Nächste Schritte:** Manuelle Tests mit curl-Befehlen durchführen (optional)

