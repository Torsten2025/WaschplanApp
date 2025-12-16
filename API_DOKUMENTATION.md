# API-Dokumentation - WaschmaschinenApp

## Basis-URL
```
http://localhost:3000
```

## Allgemeine Informationen

### Content-Type
Alle Requests mit Body müssen den Header `Content-Type: application/json` enthalten.

### Response-Format

Die API verwendet eine standardisierte Response-Struktur für alle Endpunkte:

#### Erfolgreiche Responses (200/201)

**Struktur:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Beispiele:**
- Array-Response (z.B. GET /api/machines):
  ```json
  {
    "success": true,
    "data": [ ... ]
  }
  ```
- Objekt-Response (z.B. POST /api/bookings):
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

#### Fehler-Responses (400/404/409/500)

**Struktur:**
```json
{
  "success": false,
  "error": "Fehlermeldung",
  "type": "validation_error" // Optional, nur bei bestimmten Fehlertypen
}
```

**Fehler-Typen:**
- `validation_error`: Validierungsfehler (400) - z.B. ungültige Parameter, fehlende Pflichtfelder
- `conflict`: Konflikt (409) - z.B. Doppelbuchung

**Beispiele:**
- Validierungsfehler:
  ```json
  {
    "success": false,
    "error": "Ungültiges Datum. Format: YYYY-MM-DD",
    "type": "validation_error"
  }
  ```
- Konflikt:
  ```json
  {
    "success": false,
    "error": "Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht.",
    "type": "conflict"
  }
  ```
- Nicht gefunden:
  ```json
  {
    "success": false,
    "error": "Buchung nicht gefunden"
  }
  ```

### CORS
CORS ist aktiviert - Requests von anderen Origins sind erlaubt.  

**Konfiguration:**
- `origin`: Konfigurierbar über Environment-Variable `ALLOWED_ORIGIN`
- `methods`: GET, POST, DELETE
- `allowedHeaders`: Content-Type
- `credentials`: true (für Session-basierte Authentifizierung)

**Environment-Variable `ALLOWED_ORIGIN`:**
- **Entwicklung:** Wenn nicht gesetzt, werden alle Origins (`*`) erlaubt
- **Produktion:** **MUSS** gesetzt werden! Setzen Sie auf Ihre tatsächliche Domain
  - Einzelne Domain: `ALLOWED_ORIGIN=https://waschmaschine.example.com`
  - Mehrere Domains: `ALLOWED_ORIGIN=https://app.example.com,https://admin.example.com`

**Beispiele:**
```bash
# Entwicklung (localhost)
ALLOWED_ORIGIN=http://localhost:3000

# Produktion (einzelne Domain)
ALLOWED_ORIGIN=https://waschmaschine.example.com

# Produktion (mehrere Domains)
ALLOWED_ORIGIN=https://app.example.com,https://admin.example.com
```

**WICHTIG für Produktion:**
- Setzen Sie `ALLOWED_ORIGIN` immer auf Ihre tatsächliche Domain
- Verwenden Sie `https://` in Produktion
- Lassen Sie `ALLOWED_ORIGIN` nicht leer in Produktion (Sicherheitsrisiko!)

Siehe auch: `.env.example` für eine vollständige Konfigurationsvorlage.

### Security Headers
Die API setzt folgende Security Headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` (nur in Produktion)

### Request-Logging
Alle Requests werden im Server-Log protokolliert mit Timestamp, Methode, Pfad, Query-Parametern, IP-Adresse und User-Agent.

### Body-Size-Limit
Request-Bodies sind auf 10KB begrenzt, um große Payloads zu verhindern.

---

## Endpunkte

## 1. Maschinen (Machines)

### 1.1 Alle Maschinen abrufen

**GET** `/api/machines`

**Beschreibung:** Ruft alle verfügbaren Maschinen (Waschmaschinen und Trocknungsräume) aus der Datenbank ab.

**Request:**
- Keine Parameter erforderlich

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Waschmaschine 1",
      "type": "washer"
    },
    {
      "id": 2,
      "name": "Waschmaschine 2",
      "type": "washer"
    },
    {
      "id": 3,
      "name": "Waschmaschine 3",
      "type": "washer"
    },
    {
      "id": 4,
      "name": "Trocknungsraum 1",
      "type": "dryer"
    }
  ]
}
```

**Felder:**
- `id` (integer): Eindeutige Maschinen-ID
- `name` (string): Name der Maschine
- `type` (string): Typ der Maschine (`washer` oder `dryer`)

**Sortierung:**
- Maschinen sind nach `id` sortiert (ORDER BY id)

**Fehler:**
- `500`: Datenbankfehler beim Abrufen der Maschinen
  ```json
  {
    "success": false,
    "error": "Fehler beim Abrufen der Maschinen aus der Datenbank"
  }
  ```

**Beispiel-Request:**
```bash
curl http://localhost:3000/api/machines
```

---

## 2. Zeit-Slots (Slots)

### 2.1 Alle Zeit-Slots abrufen

**GET** `/api/slots`

**Beschreibung:** Ruft alle verfügbaren Zeit-Slots für Buchungen ab. Slots sind fest definiert und werden nicht in der Datenbank gespeichert.

**Request:**
- Keine Parameter erforderlich

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "start": "08:00",
      "end": "10:00",
      "label": "08:00-10:00"
    },
    {
      "start": "10:00",
      "end": "12:00",
      "label": "10:00-12:00"
    },
    {
      "start": "12:00",
      "end": "14:00",
      "label": "12:00-14:00"
    },
    {
      "start": "14:00",
      "end": "16:00",
      "label": "14:00-16:00"
    },
    {
      "start": "16:00",
      "end": "18:00",
      "label": "16:00-18:00"
    },
    {
      "start": "18:00",
      "end": "20:00",
      "label": "18:00-20:00"
    }
  ]
}
```

**Felder:**
- `start` (string): Startzeit im Format HH:MM
- `end` (string): Endzeit im Format HH:MM
- `label` (string): Anzeige-Label im Format "HH:MM-HH:MM"

**Verfügbare Slots:**
- 08:00-10:00
- 10:00-12:00
- 12:00-14:00
- 14:00-16:00
- 16:00-18:00
- 18:00-20:00

**Fehler:**
- `500`: Interner Serverfehler beim Abrufen der Slots
  ```json
  {
    "success": false,
    "error": "Interner Serverfehler beim Abrufen der Slots"
  }
  ```

**Beispiel-Request:**
```bash
curl http://localhost:3000/api/slots
```

---

## 3. Buchungen (Bookings)

### 3.1 Buchungen für ein Datum abrufen

**GET** `/api/bookings`

**Beschreibung:** Ruft alle Buchungen für ein bestimmtes Datum ab. Die Buchungen enthalten zusätzlich Informationen über die zugehörige Maschine.

**Query-Parameter:**
- `date` (string, **erforderlich**): Datum im Format YYYY-MM-DD

**Request:**
```
GET /api/bookings?date=2024-12-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "machine_id": 1,
      "date": "2024-12-31",
      "slot": "08:00-10:00",
      "user_name": "Max Mustermann",
      "machine_name": "Waschmaschine 1",
      "machine_type": "washer"
    },
    {
      "id": 2,
      "machine_id": 2,
      "date": "2024-12-31",
      "slot": "10:00-12:00",
      "user_name": "Anna Schmidt",
      "machine_name": "Waschmaschine 2",
      "machine_type": "washer"
    }
  ]
}
```

**Felder:**
- `id` (integer): Eindeutige Buchungs-ID
- `machine_id` (integer): ID der gebuchten Maschine
- `date` (string): Datum im Format YYYY-MM-DD
- `slot` (string): Zeit-Slot (z.B. "08:00-10:00")
- `user_name` (string): Name des Benutzers
- `machine_name` (string): Name der Maschine (aus JOIN)
- `machine_type` (string): Typ der Maschine (aus JOIN)

**Sortierung:**
- Buchungen sind nach `slot` und `machine_name` sortiert

**Validierung:**
- Datum muss im Format YYYY-MM-DD sein
- Datum muss gültig sein (z.B. nicht 2024-02-30)
- Datum darf nicht in der Vergangenheit liegen

**Fehler:**
- `400`: Fehlender oder ungültiger `date`-Parameter
  ```json
  {
    "success": false,
    "error": "Datum-Parameter (date) ist erforderlich. Format: YYYY-MM-DD",
    "type": "validation_error"
  }
  ```
  oder
  ```json
  {
    "success": false,
    "error": "Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen.",
    "type": "validation_error"
  }
  ```
- `500`: Datenbankfehler beim Abrufen der Buchungen
  ```json
  {
    "success": false,
    "error": "Fehler beim Abrufen der Buchungen aus der Datenbank"
  }
  ```

**Beispiel-Request:**
```bash
curl "http://localhost:3000/api/bookings?date=2024-12-31"
```

---

### 3.2 Neue Buchung erstellen

**POST** `/api/bookings`

**Beschreibung:** Erstellt eine neue Buchung für eine Maschine, ein Datum und einen Zeit-Slot.

**Request Body:**
```json
{
  "machine_id": 1,
  "date": "2024-12-31",
  "slot": "08:00-10:00",
  "user_name": "Max Mustermann"
}
```

**Pflichtfelder:**
- `machine_id` (integer): ID der Maschine (muss positive Zahl sein)
- `date` (string): Datum im Format YYYY-MM-DD
- `slot` (string): Zeit-Slot (muss einer der verfügbaren Slots sein)
- `user_name` (string): Name des Benutzers (darf nicht leer sein)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "machine_id": 1,
    "date": "2024-12-31",
    "slot": "08:00-10:00",
    "user_name": "Max Mustermann",
    "machine_name": "Waschmaschine 1",
    "machine_type": "washer"
  }
}
```

**Validierung:**
1. Alle Pflichtfelder müssen vorhanden sein
2. `machine_id` muss eine positive Zahl sein
3. `date` muss gültig sein und nicht in der Vergangenheit liegen
4. `slot` muss einer der verfügbaren Slots sein
5. `user_name` darf nicht leer sein (nach Trim)
6. Maschine muss existieren
7. Doppelbuchung wird verhindert (gleiche Maschine, Datum, Slot)

**Fehler:**
- `400`: Fehlende oder ungültige Pflichtfelder
  ```json
  {
    "success": false,
    "error": "Alle Felder sind erforderlich: machine_id (positive Zahl), date (YYYY-MM-DD), slot, user_name (nicht leer)",
    "type": "validation_error"
  }
  ```
- `400`: Ungültiges Datum
  ```json
  {
    "success": false,
    "error": "Ungültiges Datum. Format: YYYY-MM-DD, Datum muss gültig sein und darf nicht in der Vergangenheit liegen.",
    "type": "validation_error"
  }
  ```
- `400`: Ungültiger Slot
  ```json
  {
    "success": false,
    "error": "Ungültiger Slot. Gültige Slots: 08:00-10:00, 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00, 18:00-20:00",
    "type": "validation_error"
  }
  ```
- `404`: Maschine existiert nicht
  ```json
  {
    "success": false,
    "error": "Maschine nicht gefunden"
  }
  ```
- `409`: Doppelbuchung (Conflict)
  ```json
  {
    "success": false,
    "error": "Dieser Slot ist bereits für diese Maschine und dieses Datum gebucht.",
    "type": "conflict"
  }
  ```
- `500`: Datenbankfehler
  ```json
  {
    "success": false,
    "error": "Fehler beim Erstellen der Buchung in der Datenbank"
  }
  ```

**Beispiel-Request:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-12-31",
    "slot": "08:00-10:00",
    "user_name": "Max Mustermann"
  }'
```

---

### 3.3 Buchung löschen

**DELETE** `/api/bookings/:id`

**Beschreibung:** Löscht eine bestehende Buchung aus der Datenbank.

**URL-Parameter:**
- `id` (integer): ID der zu löschenden Buchung (muss positive Zahl sein)

**Request:**
```
DELETE /api/bookings/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Buchung erfolgreich gelöscht"
  }
}
```

**Validierung:**
- `id` muss eine positive Zahl sein
- Buchung muss existieren

**Fehler:**
- `400`: Ungültige ID
  ```json
  {
    "success": false,
    "error": "Ungültige Buchungs-ID. ID muss eine positive Zahl sein.",
    "type": "validation_error"
  }
  ```
- `404`: Buchung nicht gefunden
  ```json
  {
    "success": false,
    "error": "Buchung nicht gefunden"
  }
  ```
- `500`: Datenbankfehler
  ```json
  {
    "success": false,
    "error": "Fehler beim Löschen der Buchung aus der Datenbank"
  }
  ```

**Beispiel-Request:**
```bash
curl -X DELETE http://localhost:3000/api/bookings/1
```

---

## 4. Fehlerbehandlung

### 4.1 Unbekannte Endpunkte

**GET/POST/PUT/DELETE** `/api/*` (ungültiger Pfad)

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Endpoint nicht gefunden"
}
```

### 4.2 Unerwartete Serverfehler

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Interner Serverfehler"
}
```

---

## 5. Datenmodell

### 5.1 Datenbank-Schema

#### Tabelle: `machines`
```sql
CREATE TABLE machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL
)
```

#### Tabelle: `bookings`
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,
  user_name TEXT NOT NULL,
  FOREIGN KEY (machine_id) REFERENCES machines(id)
)
```

### 5.2 Seed-Daten

Bei der ersten Initialisierung werden automatisch folgende Maschinen erstellt:
- Waschmaschine 1 (type: `washer`)
- Waschmaschine 2 (type: `washer`)
- Waschmaschine 3 (type: `washer`)
- Trocknungsraum 1 (type: `dryer`)

---

## 6. Frontend-API-Funktionen

Die Frontend-Anwendung verwendet die JavaScript-Funktionen aus `public/js/api.js`:

### 6.1 `fetchMachines()`
Ruft alle Maschinen ab.

**Rückgabewert:** `Promise<Array<Machine>>`  
**Hinweis:** Die Funktion gibt direkt das `data`-Array aus der API-Response zurück.

### 6.2 `fetchSlots()`
Ruft alle Zeit-Slots ab.

**Rückgabewert:** `Promise<Array<Slot>>`  
**Hinweis:** Die Funktion gibt direkt das `data`-Array aus der API-Response zurück.

### 6.3 `fetchBookings(date)`
Ruft Buchungen für ein Datum ab.

**Parameter:**
- `date` (string): Datum im Format YYYY-MM-DD

**Rückgabewert:** `Promise<Array<Booking>>`  
**Hinweis:** Die Funktion gibt direkt das `data`-Array aus der API-Response zurück.

### 6.4 `createBooking(data)`
Erstellt eine neue Buchung.

**Parameter:**
- `data` (object): Objekt mit `machine_id`, `date`, `slot`, `user_name`

**Rückgabewert:** `Promise<Booking>`  
**Hinweis:** Die Funktion gibt direkt das `data`-Objekt aus der API-Response zurück.

### 6.5 `deleteBooking(id)`
Löscht eine Buchung.

**Parameter:**
- `id` (number|string): ID der Buchung

**Rückgabewert:** `Promise<Object>` (mit `message`)  
**Hinweis:** Die Funktion gibt direkt das `data`-Objekt aus der API-Response zurück.

---

## 7. Status-Codes Übersicht

| Status Code | Bedeutung | Verwendung |
|------------|-----------|------------|
| 200 | OK | Erfolgreiche GET/DELETE-Requests |
| 201 | Created | Erfolgreiche POST-Requests (Buchung erstellt) |
| 400 | Bad Request | Ungültige Parameter oder Validierungsfehler |
| 404 | Not Found | Ressource nicht gefunden (Maschine, Buchung, Endpunkt) |
| 409 | Conflict | Doppelbuchung |
| 500 | Internal Server Error | Unerwarteter Serverfehler |

---

## 8. Beispiel-Workflows

### 8.1 Komplette Buchung erstellen

```bash
# 1. Maschinen abrufen
curl http://localhost:3000/api/machines

# 2. Slots abrufen
curl http://localhost:3000/api/slots

# 3. Buchung erstellen
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-12-31",
    "slot": "08:00-10:00",
    "user_name": "Max Mustermann"
  }'

# 4. Buchungen für Datum abrufen
curl "http://localhost:3000/api/bookings?date=2024-12-31"

# 5. Buchung löschen
curl -X DELETE http://localhost:3000/api/bookings/1
```

### 8.2 JavaScript-Beispiel

```javascript
// Maschinen laden
const machines = await fetchMachines();
console.log('Maschinen:', machines);

// Slots laden
const slots = await fetchSlots();
console.log('Slots:', slots);

// Buchung erstellen
const booking = await createBooking({
  machine_id: 1,
  date: '2024-12-31',
  slot: '08:00-10:00',
  user_name: 'Max Mustermann'
});
console.log('Buchung erstellt:', booking);

// Buchungen für Datum laden
const bookings = await fetchBookings('2024-12-31');
console.log('Buchungen:', bookings);

// Buchung löschen
await deleteBooking(booking.id);
console.log('Buchung gelöscht');
```

---

## 9. Bekannte Einschränkungen

1. **Zeit-Slots sind fest definiert:** Slots können nicht über die API geändert werden
2. **Keine Maschinen-Verwaltung:** Maschinen können derzeit nicht über die API erstellt/gelöscht werden
3. **Keine Benutzer-Authentifizierung:** Alle Buchungen sind öffentlich
4. **Keine Buchungs-Bearbeitung:** Buchungen können nur erstellt und gelöscht werden, nicht bearbeitet

---

## 10. Changelog

### Version 1.0.0
- Initiale API-Implementierung
- Endpunkte für Maschinen, Slots und Buchungen
- Validierung und Fehlerbehandlung
- Seed-Daten für Maschinen
