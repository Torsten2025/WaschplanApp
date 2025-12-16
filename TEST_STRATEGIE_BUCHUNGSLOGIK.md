# 🧪 Test-Strategie: Buchungslogik

**Erstellt am:** [Aktuelles Datum]  
**Erstellt von:** Senior Product Architect  
**Status:** Vollständige Test-Strategie für Buchungslogik

---

## 📋 Executive Summary

**Ziel:** Vollständige Test-Abdeckung der Buchungslogik (Backend + Frontend)  
**Priorität:** 🔴 KRITISCH - Blockiert Deployment  
**Geschätzte Zeit:** 6-8 Stunden (Backend: 3-4 Std, Frontend: 2-3 Std, Integration: 1 Std)

**Test-Pyramide:**
- 🔵 Unit-Tests: 60% (Backend-Validierung, Frontend-Logik)
- 🟡 Integration-Tests: 30% (API-Endpunkte, Frontend-Backend-Kommunikation)
- 🟢 E2E-Tests: 10% (Manuelle Tests, Browser-Tests)

---

## 🎯 Test-Übersicht

### Backend-Tests (API-Endpunkte)
1. **POST /api/v1/bookings** - Buchung erstellen
2. **DELETE /api/v1/bookings/:id** - Buchung löschen
3. **GET /api/v1/bookings** - Buchungen abrufen
4. **GET /api/v1/bookings/week** - Wochenansicht
5. **GET /api/v1/bookings/month** - Monatsansicht

### Frontend-Tests (UI-Logik)
1. **handleSlotClick()** - Slot-Klick-Handler
2. **handleDeleteBooking()** - Buchung löschen
3. **renderSlots()** - Slot-Rendering
4. **createBooking()** - API-Aufruf
5. **deleteBooking()** - API-Aufruf

### Integration-Tests
1. End-to-End Buchungs-Flow
2. Fehlerbehandlung
3. Optimistisches Update
4. Cache-Invalidierung

---

## 🔴 BACKEND-TESTS: POST /api/v1/bookings

### Test-Kategorie 1: Erfolgreiche Buchungserstellung

#### Test 1.1: Gültige Buchung erstellen
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Eine gültige Buchung sollte erfolgreich erstellt werden

**Test-Steps:**
1. Erstelle Buchung mit gültigen Daten
2. Prüfe Response: Status 201 Created
3. Prüfe Response-Body: Enthält alle Felder (id, machine_id, date, slot, user_name, machine_name, machine_type)
4. Prüfe Datenbank: Buchung existiert

**Test-Data:**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```

**Erwartetes Ergebnis:**
- Status: 201
- Response enthält alle Felder
- Buchung in Datenbank vorhanden

**Code-Stelle:** `server.js:2347-2467`

---

#### Test 1.2: Buchung mit verschiedenen Maschinen
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Buchungen für verschiedene Maschinen sollten unabhängig voneinander sein

**Test-Steps:**
1. Erstelle Buchung für Maschine 1, Slot "08:00-10:00", Datum "2024-12-31"
2. Erstelle Buchung für Maschine 2, Slot "08:00-10:00", Datum "2024-12-31"
3. Beide sollten erfolgreich sein

**Erwartetes Ergebnis:**
- Beide Buchungen erfolgreich (201)
- Keine Konflikte

---

#### Test 1.3: Buchung mit verschiedenen Slots
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Verschiedene Slots für dieselbe Maschine sollten unabhängig sein

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31"
2. Erstelle Buchung: Maschine 1, Slot "10:00-12:00", Datum "2024-12-31"
3. Beide sollten erfolgreich sein

**Erwartetes Ergebnis:**
- Beide Buchungen erfolgreich (201)

---

#### Test 1.4: Buchung mit verschiedenen Daten
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Verschiedene Daten für dieselbe Maschine/Slot sollten unabhängig sein

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31"
2. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2025-01-01"
3. Beide sollten erfolgreich sein

**Erwartetes Ergebnis:**
- Beide Buchungen erfolgreich (201)

---

### Test-Kategorie 2: Validierungs-Fehler

#### Test 2.1: Fehlende Pflichtfelder
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Fehlende Pflichtfelder sollten abgelehnt werden

**Test-Cases:**

**2.1.1: Fehlendes machine_id**
```json
{
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes machine_id

**2.1.2: Fehlendes date**
```json
{
  "machine_id": 1,
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes date

**2.1.3: Fehlendes slot**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes slot

**2.1.4: Fehlendes user_name**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes user_name

**Code-Stelle:** `server.js:2357-2361`

---

#### Test 2.2: Ungültige Maschine-ID
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Ungültige Maschine-IDs sollten abgelehnt werden

**Test-Cases:**

**2.2.1: Nicht-existierende Maschine-ID**
```json
{
  "machine_id": 9999,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 404 Not Found, Fehlermeldung "Maschine nicht gefunden"

**2.2.2: Maschine-ID = 0**
```json
{
  "machine_id": 0,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültige machine_id

**2.2.3: Maschine-ID = -1**
```json
{
  "machine_id": -1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültige machine_id

**2.2.4: Maschine-ID = String**
```json
{
  "machine_id": "abc",
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültige machine_id

**Code-Stelle:** `server.js:2352, 2378-2383`

---

#### Test 2.3: Ungültiges Datum
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Ungültige Daten sollten abgelehnt werden

**Test-Cases:**

**2.3.1: Datum in Vergangenheit**
```json
{
  "machine_id": 1,
  "date": "2020-01-01",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über Datum in Vergangenheit

**2.3.2: Ungültiges Datum-Format**
```json
{
  "machine_id": 1,
  "date": "31-12-2024",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültiges Datum-Format

**2.3.3: Ungültiges Datum (z.B. 2024-13-01)**
```json
{
  "machine_id": 1,
  "date": "2024-13-01",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültiges Datum

**2.3.4: Leeres Datum**
```json
{
  "machine_id": 1,
  "date": "",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes date

**Code-Stelle:** `server.js:2363-2368`

---

#### Test 2.4: Ungültiger Slot
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Ungültige Slots sollten abgelehnt werden

**Test-Cases:**

**2.4.1: Nicht-existierender Slot**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "99:00-99:00",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung mit Liste gültiger Slots

**2.4.2: Leerer Slot**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes slot

**2.4.3: Slot mit falschem Format**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "8-10",
  "user_name": "TestUser"
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültigen Slot

**Code-Stelle:** `server.js:2370-2375`

---

#### Test 2.5: Ungültiger Benutzername
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Ungültige Benutzernamen sollten abgelehnt werden

**Test-Cases:**

**2.5.1: Leerer Benutzername**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": ""
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes user_name

**2.5.2: Nur Leerzeichen**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "   "
}
```
**Erwartet:** 400 Bad Request, Fehlermeldung über fehlendes user_name (nach Trim)

**2.5.3: Sehr langer Benutzername (>255 Zeichen)**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "A".repeat(300)
}
```
**Erwartet:** 400 Bad Request oder 201 (je nach DB-Constraint)

**Code-Stelle:** `server.js:2355`

---

### Test-Kategorie 3: Doppelbuchung verhindern

#### Test 3.1: Doppelte Buchung (gleiche Maschine, Slot, Datum)
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Doppelte Buchungen sollten verhindert werden

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31", User "User1"
2. Versuche gleiche Buchung nochmal: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31", User "User2"
3. Zweite Buchung sollte fehlschlagen

**Erwartetes Ergebnis:**
- Erste Buchung: 201 Created
- Zweite Buchung: 409 Conflict, Fehlermeldung "Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht."

**Code-Stelle:** `server.js:2385-2399`

---

#### Test 3.2: Doppelte Buchung mit verschiedenen Usern
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Doppelbuchung sollte verhindert werden, auch wenn User unterschiedlich ist

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31", User "User1"
2. Versuche gleiche Buchung mit anderem User: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31", User "User2"
3. Zweite Buchung sollte fehlschlagen

**Erwartetes Ergebnis:**
- Erste Buchung: 201 Created
- Zweite Buchung: 409 Conflict

---

#### Test 3.3: Keine Doppelbuchung bei verschiedenen Maschinen
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Gleiche Slot/Datum für verschiedene Maschinen sollte erlaubt sein

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31"
2. Erstelle Buchung: Maschine 2, Slot "08:00-10:00", Datum "2024-12-31"
3. Beide sollten erfolgreich sein

**Erwartetes Ergebnis:**
- Beide Buchungen: 201 Created

---

#### Test 3.4: Keine Doppelbuchung bei verschiedenen Slots
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Verschiedene Slots für gleiche Maschine/Datum sollten erlaubt sein

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31"
2. Erstelle Buchung: Maschine 1, Slot "10:00-12:00", Datum "2024-12-31"
3. Beide sollten erfolgreich sein

**Erwartetes Ergebnis:**
- Beide Buchungen: 201 Created

---

#### Test 3.5: Keine Doppelbuchung bei verschiedenen Daten
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Verschiedene Daten für gleiche Maschine/Slot sollten erlaubt sein

**Test-Steps:**
1. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2024-12-31"
2. Erstelle Buchung: Maschine 1, Slot "08:00-10:00", Datum "2025-01-01"
3. Beide sollten erfolgreich sein

**Erwartetes Ergebnis:**
- Beide Buchungen: 201 Created

---

### Test-Kategorie 4: Edge-Cases

#### Test 4.1: Heute als Datum
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Buchung für heute sollte möglich sein

**Test-Steps:**
1. Erstelle Buchung mit Datum = heute
2. Sollte erfolgreich sein

**Erwartetes Ergebnis:**
- Status: 201 Created

---

#### Test 4.2: Datum mit Whitespace
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Datum mit Whitespace sollte normalisiert werden

**Test-Data:**
```json
{
  "machine_id": 1,
  "date": "  2024-12-31  ",
  "slot": "08:00-10:00",
  "user_name": "TestUser"
}
```

**Erwartetes Ergebnis:**
- Status: 201 Created
- Datum wird normalisiert (Whitespace entfernt)

---

#### Test 4.3: Benutzername mit Whitespace
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Benutzername mit Whitespace sollte normalisiert werden

**Test-Data:**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "  TestUser  "
}
```

**Erwartetes Ergebnis:**
- Status: 201 Created
- Benutzername wird normalisiert (Whitespace entfernt)

---

#### Test 4.4: Alle verfügbaren Slots testen
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Alle verfügbaren Slots sollten funktionieren

**Test-Steps:**
1. Für jeden Slot in TIME_SLOTS:
   - Erstelle Buchung mit diesem Slot
   - Prüfe ob erfolgreich

**Erwartetes Ergebnis:**
- Alle Buchungen: 201 Created

---

#### Test 4.5: Race Condition (gleichzeitige Buchungen)
**Priorität:** 🟢 NIEDRIG  
**Beschreibung:** Gleichzeitige Buchungen für denselben Slot sollten korrekt behandelt werden

**Test-Steps:**
1. Starte 2 parallele Requests für gleiche Maschine/Slot/Datum
2. Nur eine sollte erfolgreich sein

**Erwartetes Ergebnis:**
- Eine Buchung: 201 Created
- Andere Buchung: 409 Conflict

**Hinweis:** Kann schwierig zu testen sein, erfordert möglicherweise spezielle Test-Tools

---

## 🔴 BACKEND-TESTS: DELETE /api/v1/bookings/:id

### Test-Kategorie 5: Erfolgreiche Löschung

#### Test 5.1: Eigene Buchung löschen
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Benutzer sollte eigene Buchung löschen können

**Test-Steps:**
1. Erstelle Buchung als User "TestUser"
2. Setze Session: username = "TestUser"
3. Lösche Buchung
4. Prüfe Response: Status 200 OK
5. Prüfe Datenbank: Buchung existiert nicht mehr

**Erwartetes Ergebnis:**
- Status: 200 OK
- Response: { success: true, data: { message: "Buchung erfolgreich gelöscht" } }
- Buchung nicht mehr in Datenbank

**Code-Stelle:** `server.js:2470-2523`

---

#### Test 5.2: Admin kann alle Buchungen löschen
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Admin sollte alle Buchungen löschen können

**Test-Steps:**
1. Erstelle Buchung als User "User1"
2. Setze Session: username = "admin", role = "admin"
3. Lösche Buchung
4. Prüfe Response: Status 200 OK

**Erwartetes Ergebnis:**
- Status: 200 OK
- Buchung gelöscht

---

### Test-Kategorie 6: Löschung-Fehler

#### Test 6.1: Ungültige Buchungs-ID
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Ungültige IDs sollten abgelehnt werden

**Test-Cases:**

**6.1.1: Nicht-existierende ID**
```
DELETE /api/v1/bookings/9999
```
**Erwartet:** 404 Not Found, Fehlermeldung "Buchung nicht gefunden"

**6.1.2: ID = 0**
```
DELETE /api/v1/bookings/0
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültige ID

**6.1.3: ID = -1**
```
DELETE /api/v1/bookings/-1
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültige ID

**6.1.4: ID = String**
```
DELETE /api/v1/bookings/abc
```
**Erwartet:** 400 Bad Request, Fehlermeldung über ungültige ID

**Code-Stelle:** `server.js:2475-2488`

---

#### Test 6.2: Keine Berechtigung
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Benutzer sollte nur eigene Buchungen löschen können

**Test-Steps:**
1. Erstelle Buchung als User "User1"
2. Setze Session: username = "User2" (nicht Admin)
3. Versuche Buchung zu löschen
4. Sollte fehlschlagen

**Erwartetes Ergebnis:**
- Status: 403 Forbidden
- Fehlermeldung: "Sie haben keine Berechtigung, diese Buchung zu löschen"
- Buchung existiert noch in Datenbank

**Code-Stelle:** `server.js:2490-2503`

---

#### Test 6.3: Nicht eingeloggt
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Nicht eingeloggte Benutzer sollten nicht löschen können

**Test-Steps:**
1. Erstelle Buchung
2. Keine Session setzen
3. Versuche Buchung zu löschen
4. Sollte fehlschlagen

**Erwartetes Ergebnis:**
- Status: 403 Forbidden oder 401 Unauthorized
- Buchung existiert noch

---

## 🔴 BACKEND-TESTS: GET /api/v1/bookings

### Test-Kategorie 7: Buchungen abrufen

#### Test 7.1: Buchungen für Datum abrufen
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Buchungen für ein Datum sollten abgerufen werden können

**Test-Steps:**
1. Erstelle mehrere Buchungen für Datum "2024-12-31"
2. Rufe Buchungen ab: `GET /api/v1/bookings?date=2024-12-31`
3. Prüfe Response: Enthält alle Buchungen für dieses Datum

**Erwartetes Ergebnis:**
- Status: 200 OK
- Response enthält Array mit allen Buchungen für das Datum
- Buchungen sind sortiert (nach slot, dann machine_name)

**Code-Stelle:** `server.js:2180-2226`

---

#### Test 7.2: Leeres Datum
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Leeres Datum sollte abgelehnt werden

**Test:**
```
GET /api/v1/bookings?date=
```

**Erwartetes Ergebnis:**
- Status: 400 Bad Request
- Fehlermeldung über fehlendes Datum

---

#### Test 7.3: Ungültiges Datum
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Ungültiges Datum sollte abgelehnt werden

**Test:**
```
GET /api/v1/bookings?date=invalid
```

**Erwartetes Ergebnis:**
- Status: 400 Bad Request
- Fehlermeldung über ungültiges Datum

---

#### Test 7.4: Keine Buchungen für Datum
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Leeres Array sollte zurückgegeben werden, wenn keine Buchungen existieren

**Test-Steps:**
1. Rufe Buchungen ab für Datum ohne Buchungen
2. Prüfe Response: Leeres Array

**Erwartetes Ergebnis:**
- Status: 200 OK
- Response: []

---

## 🟡 FRONTEND-TESTS: handleSlotClick()

### Test-Kategorie 8: Slot-Klick-Handler

#### Test 8.1: Erfolgreiche Buchungserstellung
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Slot-Klick sollte Buchung erstellen

**Test-Steps:**
1. Setze Datum-Input: "2024-12-31"
2. Setze Name-Input: "TestUser"
3. Klicke auf freien Slot
4. Bestätige Modal
5. Prüfe: Buchung wird erstellt
6. Prüfe: Slot wird als "gebucht" markiert
7. Prüfe: Erfolgs-Meldung wird angezeigt

**Erwartetes Ergebnis:**
- Modal öffnet sich
- Nach Bestätigung: Buchung erstellt
- Slot wird als "gebucht" markiert
- Erfolgs-Meldung angezeigt

**Code-Stelle:** `public/js/app.js:586-865`

---

#### Test 8.2: Fehlendes Datum
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Fehlendes Datum sollte Fehler anzeigen

**Test-Steps:**
1. Setze Datum-Input: leer
2. Setze Name-Input: "TestUser"
3. Klicke auf freien Slot
4. Prüfe: Fehlermeldung wird angezeigt
5. Prüfe: Datum-Input erhält Focus

**Erwartetes Ergebnis:**
- Fehlermeldung: "Bitte wählen Sie ein Datum aus."
- Datum-Input erhält Focus
- Keine Buchung erstellt

---

#### Test 8.3: Fehlender Name
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Fehlender Name sollte Fehler anzeigen

**Test-Steps:**
1. Setze Datum-Input: "2024-12-31"
2. Setze Name-Input: leer
3. Klicke auf freien Slot
4. Prüfe: Fehlermeldung wird angezeigt
5. Prüfe: Name-Input erhält Focus

**Erwartetes Ergebnis:**
- Fehlermeldung: "Bitte geben Sie Ihren Namen ein."
- Name-Input erhält Focus
- Keine Buchung erstellt

---

#### Test 8.4: Modal-Abbruch
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Abbruch im Modal sollte keine Buchung erstellen

**Test-Steps:**
1. Setze Datum-Input: "2024-12-31"
2. Setze Name-Input: "TestUser"
3. Klicke auf freien Slot
4. Klicke "Abbrechen" im Modal
5. Prüfe: Keine Buchung erstellt

**Erwartetes Ergebnis:**
- Modal schließt sich
- Keine Buchung erstellt
- Slot bleibt frei

---

#### Test 8.5: Datum in Vergangenheit
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Datum in Vergangenheit sollte automatisch korrigiert werden

**Test-Steps:**
1. Setze Datum-Input: Datum in Vergangenheit
2. Setze Name-Input: "TestUser"
3. Klicke auf freien Slot
4. Prüfe: Datum wird auf heute gesetzt
5. Prüfe: Info-Meldung wird angezeigt

**Erwartetes Ergebnis:**
- Datum wird automatisch auf heute gesetzt
- Info-Meldung: "Das Datum wurde auf heute gesetzt..."
- Buchung wird mit korrigiertem Datum erstellt

---

#### Test 8.6: Optimistisches Update
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Slot sollte sofort als "gebucht" markiert werden (optimistisches Update)

**Test-Steps:**
1. Setze Datum-Input: "2024-12-31"
2. Setze Name-Input: "TestUser"
3. Klicke auf freien Slot
4. Bestätige Modal
5. Prüfe: Slot wird SOFORT als "gebucht" markiert (vor API-Response)

**Erwartetes Ergebnis:**
- Slot wird sofort als "gebucht" markiert
- UI wird sofort aktualisiert
- Nach API-Response: Bestätigung

**Code-Stelle:** `public/js/app.js:710-782`

---

## 🟡 FRONTEND-TESTS: handleDeleteBooking()

### Test-Kategorie 9: Buchung löschen

#### Test 9.1: Erfolgreiche Löschung
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Löschen-Button sollte Buchung löschen

**Test-Steps:**
1. Erstelle Buchung
2. Klicke auf Löschen-Button (✕)
3. Bestätige Modal
4. Prüfe: Buchung wird gelöscht
5. Prüfe: Slot wird als "frei" markiert
6. Prüfe: Erfolgs-Meldung wird angezeigt

**Erwartetes Ergebnis:**
- Modal öffnet sich
- Nach Bestätigung: Buchung gelöscht
- Slot wird als "frei" markiert
- Erfolgs-Meldung angezeigt

**Code-Stelle:** `public/js/app.js:867-950`

---

#### Test 9.2: Modal-Abbruch
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Abbruch im Modal sollte keine Löschung durchführen

**Test-Steps:**
1. Erstelle Buchung
2. Klicke auf Löschen-Button
3. Klicke "Abbrechen" im Modal
4. Prüfe: Buchung existiert noch

**Erwartetes Ergebnis:**
- Modal schließt sich
- Buchung existiert noch
- Slot bleibt "gebucht"

---

#### Test 9.3: Fehlerbehandlung bei Löschung
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Fehler beim Löschen sollte angezeigt werden

**Test-Steps:**
1. Erstelle Buchung
2. Simuliere API-Fehler (z.B. Netzwerk-Fehler)
3. Versuche Buchung zu löschen
4. Prüfe: Fehlermeldung wird angezeigt

**Erwartetes Ergebnis:**
- Fehlermeldung wird angezeigt
- Buchung existiert noch
- Slot bleibt "gebucht"

---

## 🟡 FRONTEND-TESTS: API-Funktionen

### Test-Kategorie 10: createBooking()

#### Test 10.1: Erfolgreicher API-Aufruf
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** createBooking() sollte erfolgreich Buchung erstellen

**Test-Steps:**
1. Rufe `createBooking()` mit gültigen Daten auf
2. Prüfe: Response enthält Buchung
3. Prüfe: Cache wird invalidiert

**Erwartetes Ergebnis:**
- Response enthält Buchung mit allen Feldern
- Cache für Datum wird gelöscht

**Code-Stelle:** `public/js/api.js:372-438`

---

#### Test 10.2: Fehlerbehandlung
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Fehler sollten korrekt behandelt werden

**Test-Cases:**

**10.2.1: Netzwerk-Fehler**
- Simuliere Netzwerk-Fehler
- Prüfe: Fehler wird geworfen
- Prüfe: Fehlermeldung ist aussagekräftig

**10.2.2: Server-Fehler (500)**
- Simuliere 500-Fehler
- Prüfe: Fehler wird geworfen
- Prüfe: Fehlermeldung ist aussagekräftig

**10.2.3: Validierungs-Fehler (400)**
- Sende ungültige Daten
- Prüfe: Fehler wird geworfen
- Prüfe: Fehlermeldung enthält Validierungs-Details

**10.2.4: Doppelbuchung (409)**
- Versuche doppelte Buchung
- Prüfe: Fehler wird geworfen
- Prüfe: Fehlermeldung ist aussagekräftig

---

### Test-Kategorie 11: deleteBooking()

#### Test 11.1: Erfolgreicher API-Aufruf
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** deleteBooking() sollte erfolgreich Buchung löschen

**Test-Steps:**
1. Erstelle Buchung
2. Rufe `deleteBooking()` mit Buchungs-ID auf
3. Prüfe: Response enthält Bestätigung
4. Prüfe: Cache wird invalidiert

**Erwartetes Ergebnis:**
- Response: { success: true, data: { message: "..." } }
- Cache für Datum wird gelöscht

**Code-Stelle:** `public/js/api.js:446-500`

---

## 🟢 INTEGRATION-TESTS

### Test-Kategorie 12: End-to-End Buchungs-Flow

#### Test 12.1: Vollständiger Buchungs-Flow
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Kompletter Flow von Slot-Klick bis Buchung erstellt

**Test-Steps:**
1. Öffne App
2. Wähle Datum
3. Gebe Namen ein
4. Klicke auf freien Slot
5. Bestätige Modal
6. Prüfe: Buchung wird erstellt
7. Prüfe: Slot wird als "gebucht" markiert
8. Prüfe: Erfolgs-Meldung wird angezeigt
9. Prüfe: Buchung ist in Datenbank

**Erwartetes Ergebnis:**
- Alle Schritte funktionieren
- UI ist konsistent
- Datenbank ist konsistent

---

#### Test 12.2: Vollständiger Lösch-Flow
**Priorität:** 🔴 KRITISCH  
**Beschreibung:** Kompletter Flow von Löschen-Button bis Buchung gelöscht

**Test-Steps:**
1. Erstelle Buchung
2. Klicke auf Löschen-Button
3. Bestätige Modal
4. Prüfe: Buchung wird gelöscht
5. Prüfe: Slot wird als "frei" markiert
6. Prüfe: Buchung ist nicht mehr in Datenbank

**Erwartetes Ergebnis:**
- Alle Schritte funktionieren
- UI ist konsistent
- Datenbank ist konsistent

---

#### Test 12.3: Fehlerbehandlung End-to-End
**Priorität:** 🟡 WICHTIG  
**Beschreibung:** Fehler sollten korrekt durch alle Schichten propagiert werden

**Test-Cases:**

**12.3.1: Netzwerk-Fehler**
- Simuliere Netzwerk-Fehler während Buchungserstellung
- Prüfe: Fehlermeldung wird im UI angezeigt
- Prüfe: Slot bleibt frei

**12.3.2: Server-Fehler**
- Simuliere Server-Fehler (500)
- Prüfe: Fehlermeldung wird im UI angezeigt
- Prüfe: Slot bleibt frei

**12.3.3: Validierungs-Fehler**
- Versuche ungültige Buchung zu erstellen
- Prüfe: Validierungs-Fehlermeldung wird angezeigt
- Prüfe: Slot bleibt frei

---

## 📊 Test-Priorisierung

### 🔴 SOFORT (Kritisch - Blockiert Deployment):
1. Test 1.1: Gültige Buchung erstellen
2. Test 2.1: Fehlende Pflichtfelder
3. Test 2.2: Ungültige Maschine-ID
4. Test 2.3: Ungültiges Datum
5. Test 2.4: Ungültiger Slot
6. Test 2.5: Ungültiger Benutzername
7. Test 3.1: Doppelte Buchung verhindern
8. Test 5.1: Eigene Buchung löschen
9. Test 5.2: Admin kann alle löschen
10. Test 6.1: Ungültige Buchungs-ID
11. Test 6.2: Keine Berechtigung
12. Test 7.1: Buchungen für Datum abrufen
13. Test 8.1: Erfolgreiche Buchungserstellung
14. Test 8.2: Fehlendes Datum
15. Test 8.3: Fehlender Name
16. Test 9.1: Erfolgreiche Löschung
17. Test 12.1: Vollständiger Buchungs-Flow
18. Test 12.2: Vollständiger Lösch-Flow

**Gesamt:** 18 kritische Tests

### 🟡 WICHTIG (Sollte vor Deployment):
- Alle anderen Tests aus Kategorien 1-12

**Gesamt:** ~30 wichtige Tests

### 🟢 OPTIONAL (Kann nach Deployment):
- Performance-Tests
- Load-Tests
- Browser-Kompatibilität-Tests (außerhalb dieser Strategie)

---

## 📝 Test-Implementierung

### Backend-Tests (Jest/Supertest)

**Datei:** `tests/integration/bookings.test.js`

**Struktur:**
```javascript
describe('POST /api/v1/bookings', () => {
  describe('Erfolgreiche Buchungserstellung', () => {
    test('1.1: Gültige Buchung erstellen', async () => {
      // Test-Implementierung
    });
    // ... weitere Tests
  });
  
  describe('Validierungs-Fehler', () => {
    test('2.1.1: Fehlendes machine_id', async () => {
      // Test-Implementierung
    });
    // ... weitere Tests
  });
  
  // ... weitere Kategorien
});
```

### Frontend-Tests (Jest/Vitest)

**Datei:** `tests/unit/frontend/bookings.test.js`

**Struktur:**
```javascript
describe('handleSlotClick()', () => {
  test('8.1: Erfolgreiche Buchungserstellung', async () => {
    // Test-Implementierung
  });
  // ... weitere Tests
});
```

### Integration-Tests (Playwright/Cypress)

**Datei:** `tests/e2e/bookings.spec.js`

**Struktur:**
```javascript
describe('Buchungs-Flow', () => {
  test('12.1: Vollständiger Buchungs-Flow', async ({ page }) => {
    // Test-Implementierung
  });
  // ... weitere Tests
});
```

---

## ✅ Test-Checkliste

### Backend-Tests:
- [ ] Test 1.1-1.5: Erfolgreiche Buchungserstellung
- [ ] Test 2.1-2.5: Validierungs-Fehler
- [ ] Test 3.1-3.5: Doppelbuchung verhindern
- [ ] Test 4.1-4.5: Edge-Cases
- [ ] Test 5.1-5.2: Erfolgreiche Löschung
- [ ] Test 6.1-6.3: Löschung-Fehler
- [ ] Test 7.1-7.4: Buchungen abrufen

### Frontend-Tests:
- [ ] Test 8.1-8.6: Slot-Klick-Handler
- [ ] Test 9.1-9.3: Buchung löschen
- [ ] Test 10.1-10.2: createBooking()
- [ ] Test 11.1: deleteBooking()

### Integration-Tests:
- [ ] Test 12.1: Vollständiger Buchungs-Flow
- [ ] Test 12.2: Vollständiger Lösch-Flow
- [ ] Test 12.3: Fehlerbehandlung End-to-End

---

## 🎯 Nächste Schritte

### Für Junior Backend Entwickler:
1. **SOFORT:** Implementiere Backend-Tests (Test 1.1-7.4)
2. **Zeit:** 3-4 Stunden
3. **Priorität:** Kritische Tests zuerst

### Für Junior Frontend Entwickler:
1. **SOFORT:** Implementiere Frontend-Tests (Test 8.1-11.1)
2. **Zeit:** 2-3 Stunden
3. **Priorität:** Kritische Tests zuerst

### Für Senior Fullstack Developer:
1. **SOFORT:** Implementiere Integration-Tests (Test 12.1-12.3)
2. **Zeit:** 1 Stunde
3. **Priorität:** Kritische Tests zuerst

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Bereit zur Implementierung  
**Nächste Review:** Nach Implementierung der kritischen Tests

