# 📅 Aufgabe: Buchungslogik testen & validieren

**Zugewiesen an:** Junior Backend Entwickler  
**Priorität:** 🔴 KRITISCH (blockiert Deployment)  
**Geschätzte Zeit:** 2-3 Stunden  
**Status:** ⏳ Offen

---

## 📋 Aufgaben-Übersicht

### 1. Buchungs-Validierung testen
### 2. Buchungs-Löschung testen
### 3. Buchungs-Abfragen testen

---

## 🎯 Aufgabe 1: Buchungs-Validierung testen

### Problem:
- Buchungslogik muss vollständig getestet werden
- Validierung muss sicherstellen, dass keine doppelten Buchungen möglich sind
- Edge-Cases müssen abgedeckt sein

### Test-Szenarien:

#### 1.1 Doppelte Buchung verhindern
**Test:**
- [ ] Buchung erstellen: Maschine 1, Slot "08:00-10:00", Datum "2024-01-01"
- [ ] Gleiche Buchung nochmal versuchen → Sollte fehlschlagen mit 409 Conflict
- [ ] Fehlermeldung sollte aussagekräftig sein

**Code-Stellen:**
- `server.js` - `POST /api/v1/bookings` (Zeile ~800+)

**Test-Command:**
```bash
# Erste Buchung
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-01-01",
    "slot": "08:00-10:00",
    "user_name": "TestUser"
  }'

# Zweite Buchung (sollte fehlschlagen)
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-01-01",
    "slot": "08:00-10:00",
    "user_name": "TestUser2"
  }'
```

**Erwartetes Ergebnis:**
- Erste Buchung: 201 Created
- Zweite Buchung: 409 Conflict mit Fehlermeldung

---

#### 1.2 Ungültige Maschine-ID
**Test:**
- [ ] Buchung mit nicht-existierender Maschine-ID erstellen
- [ ] Sollte fehlschlagen mit 404 Not Found
- [ ] Fehlermeldung sollte aussagekräftig sein

**Test-Command:**
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 999,
    "date": "2024-01-01",
    "slot": "08:00-10:00",
    "user_name": "TestUser"
  }'
```

**Erwartetes Ergebnis:**
- 404 Not Found
- Fehlermeldung: "Maschine existiert nicht"

---

#### 1.3 Ungültiger Slot
**Test:**
- [ ] Buchung mit ungültigem Slot erstellen (z.B. "25:00-27:00")
- [ ] Sollte fehlschlagen mit 400 Bad Request
- [ ] Fehlermeldung sollte aussagekräftig sein

**Test-Command:**
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-01-01",
    "slot": "25:00-27:00",
    "user_name": "TestUser"
  }'
```

**Erwartetes Ergebnis:**
- 400 Bad Request
- Fehlermeldung: "Ungültiger Slot"

---

#### 1.4 Datum in Vergangenheit
**Test:**
- [ ] Buchung mit Datum in Vergangenheit erstellen
- [ ] Sollte fehlschlagen mit 400 Bad Request
- [ ] Fehlermeldung sollte aussagekräftig sein

**Test-Command:**
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2020-01-01",
    "slot": "08:00-10:00",
    "user_name": "TestUser"
  }'
```

**Erwartetes Ergebnis:**
- 400 Bad Request
- Fehlermeldung: "Datum liegt in der Vergangenheit"

---

#### 1.5 Leerer Benutzername
**Test:**
- [ ] Buchung mit leerem Benutzernamen erstellen
- [ ] Sollte fehlschlagen mit 400 Bad Request
- [ ] Fehlermeldung sollte aussagekräftig sein

**Test-Command:**
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-01-01",
    "slot": "08:00-10:00",
    "user_name": ""
  }'
```

**Erwartetes Ergebnis:**
- 400 Bad Request
- Fehlermeldung: "Benutzername ist erforderlich"

---

#### 1.6 Fehlende Felder
**Test:**
- [ ] Buchung ohne `machine_id` erstellen
- [ ] Buchung ohne `date` erstellen
- [ ] Buchung ohne `slot` erstellen
- [ ] Buchung ohne `user_name` erstellen
- [ ] Alle sollten fehlschlagen mit 400 Bad Request

**Test-Command:**
```bash
# Ohne machine_id
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-01",
    "slot": "08:00-10:00",
    "user_name": "TestUser"
  }'
```

**Erwartetes Ergebnis:**
- 400 Bad Request
- Fehlermeldung: "machine_id ist erforderlich"

---

## 🎯 Aufgabe 2: Buchungs-Löschung testen

### Test-Szenarien:

#### 2.1 Nur Buchungs-Besitzer kann löschen
**Test:**
- [ ] Buchung als User A erstellen
- [ ] Als User B versuchen zu löschen → Sollte fehlschlagen mit 403 Forbidden
- [ ] Als User A löschen → Sollte funktionieren

**Code-Stellen:**
- `server.js` - `DELETE /api/v1/bookings/:id` (Zeile ~900+)

**Test-Command:**
```bash
# Buchung als User A erstellen
BOOKING_ID=$(curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-01-01",
    "slot": "08:00-10:00",
    "user_name": "UserA"
  }' | jq -r '.data.id')

# Als User B versuchen zu löschen (sollte fehlschlagen)
curl -X DELETE http://localhost:3000/api/v1/bookings/$BOOKING_ID \
  -H "Cookie: connect.sid=..." # Session von User B
```

**Erwartetes Ergebnis:**
- 403 Forbidden
- Fehlermeldung: "Sie können nur Ihre eigenen Buchungen löschen"

---

#### 2.2 Admin kann alle Buchungen löschen
**Test:**
- [ ] Buchung als normaler User erstellen
- [ ] Als Admin löschen → Sollte funktionieren

**Test-Command:**
```bash
# Als Admin löschen
curl -X DELETE http://localhost:3000/api/v1/bookings/$BOOKING_ID \
  -H "Cookie: connect.sid=..." # Admin-Session
```

**Erwartetes Ergebnis:**
- 200 OK
- Buchung wurde gelöscht

---

#### 2.3 Ungültige Buchungs-ID
**Test:**
- [ ] Buchung mit nicht-existierender ID löschen
- [ ] Sollte fehlschlagen mit 404 Not Found

**Test-Command:**
```bash
curl -X DELETE http://localhost:3000/api/v1/bookings/99999
```

**Erwartetes Ergebnis:**
- 404 Not Found
- Fehlermeldung: "Buchung nicht gefunden"

---

## 🎯 Aufgabe 3: Buchungs-Abfragen testen

### Test-Szenarien:

#### 3.1 Buchungen für Datum abrufen
**Test:**
- [ ] Buchungen für spezifisches Datum abrufen
- [ ] Sollte nur Buchungen für dieses Datum zurückgeben
- [ ] Leere Ergebnisse sollten korrekt zurückgegeben werden

**Code-Stellen:**
- `server.js` - `GET /api/v1/bookings` (Zeile ~700+)

**Test-Command:**
```bash
# Buchungen für Datum abrufen
curl http://localhost:3000/api/v1/bookings?date=2024-01-01

# Leeres Datum (sollte alle Buchungen zurückgeben)
curl http://localhost:3000/api/v1/bookings
```

**Erwartetes Ergebnis:**
- 200 OK
- JSON-Array mit Buchungen
- Leeres Array wenn keine Buchungen

---

#### 3.2 Alle Buchungen abrufen (Admin)
**Test:**
- [ ] Als Admin alle Buchungen abrufen
- [ ] Sollte alle Buchungen zurückgeben (unabhängig vom Datum)

**Test-Command:**
```bash
# Als Admin alle Buchungen abrufen
curl http://localhost:3000/api/v1/admin/bookings \
  -H "Cookie: connect.sid=..." # Admin-Session
```

**Erwartetes Ergebnis:**
- 200 OK
- JSON-Array mit allen Buchungen

---

#### 3.3 Datum-Format validieren
**Test:**
- [ ] Buchungen mit ungültigem Datum-Format abrufen
- [ ] Sollte fehlschlagen mit 400 Bad Request

**Test-Command:**
```bash
# Ungültiges Datum-Format
curl http://localhost:3000/api/v1/bookings?date=invalid-date
```

**Erwartetes Ergebnis:**
- 400 Bad Request
- Fehlermeldung: "Ungültiges Datum-Format"

---

## ✅ Abnahmekriterien

### Validierung:
- [ ] Alle Validierungs-Tests bestehen
- [ ] Doppelte Buchungen werden verhindert
- [ ] Ungültige Eingaben werden abgelehnt
- [ ] Fehlermeldungen sind aussagekräftig

### Löschung:
- [ ] Buchungs-Löschung funktioniert korrekt
- [ ] Nur Besitzer kann löschen (außer Admin)
- [ ] Admin kann alle Buchungen löschen
- [ ] Fehlerbehandlung funktioniert

### Abfragen:
- [ ] Buchungen können korrekt abgerufen werden
- [ ] Datum-Filter funktioniert
- [ ] Leere Ergebnisse werden korrekt zurückgegeben
- [ ] Edge-Cases sind abgedeckt

---

## 📝 Code-Stellen zum Prüfen

1. **Buchung erstellen:**
   - `server.js` - `POST /api/v1/bookings` (Zeile ~800+)
   - Validierungs-Logik

2. **Buchung löschen:**
   - `server.js` - `DELETE /api/v1/bookings/:id` (Zeile ~900+)
   - Benutzer-Validierung

3. **Buchungen abrufen:**
   - `server.js` - `GET /api/v1/bookings` (Zeile ~700+)
   - Datum-Filter

---

## 🧪 Test-Plan

### 1. Manuelle Tests:
- Alle oben genannten Test-Commands ausführen
- Ergebnisse dokumentieren
- Fehler beheben

### 2. Edge-Cases testen:
- Sehr lange Benutzernamen
- Sonderzeichen in Benutzernamen
- Sehr alte Daten
- Sehr zukünftige Daten
- Grenzwerte testen

---

## 📚 Referenzen

- API-Dokumentation: `API_DOKUMENTATION.md`
- Validierungs-Logik: `server.js` Zeile ~800+
- Buchungs-Endpunkte: `server.js` Zeile ~700+

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Offen  
**Zuletzt aktualisiert:** [Aktuelles Datum]

