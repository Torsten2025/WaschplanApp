# 📋 Aufgabe: Backend-Tests für Buchungslogik implementieren

**Zugewiesen an:** Junior Backend Entwickler  
**Priorität:** 🔴 KRITISCH  
**Geschätzte Zeit:** 3-4 Stunden  
**Status:** ⏳ Offen

---

## 🎯 Ziel

Implementiere umfassende Backend-Tests für die Buchungslogik gemäß `TEST_STRATEGIE_BUCHUNGSLOGIK.md`.

**Test-Coverage-Ziel:** Mindestens 80% für Buchungs-Endpunkte

---

## 📋 Aufgaben-Übersicht

### 1. POST /api/v1/bookings Tests (18 Tests)
- Erfolgreiche Buchungserstellung (5 Tests)
- Validierungs-Fehler (15 Tests)
- Doppelbuchung verhindern (5 Tests)
- Edge-Cases (5 Tests)

### 2. DELETE /api/v1/bookings/:id Tests (6 Tests)
- Erfolgreiche Löschung (2 Tests)
- Löschung-Fehler (4 Tests)

### 3. GET /api/v1/bookings Tests (4 Tests)
- Buchungen abrufen

**Gesamt:** ~28 Tests

---

## 🛠️ Technische Details

### Test-Framework
- **Framework:** Jest (bereits konfiguriert)
- **API-Testing:** Supertest (bereits installiert)
- **Test-Server:** `tests/helpers/test-server.js` (bereits vorhanden)

### Datei-Struktur
```
tests/
├── integration/
│   ├── api.test.js          (bereits vorhanden - erweitern!)
│   └── bookings.test.js      (NEU erstellen)
```

### Bestehende Tests als Referenz
- Siehe: `tests/integration/api.test.js` (Zeile 103-136)
- Siehe: `tests/helpers/test-server.js` (bereits vorhanden)

---

## 📝 Schritt-für-Schritt-Anleitung

### Schritt 1: Neue Test-Datei erstellen

**Datei:** `tests/integration/bookings.test.js`

**Vorlage:**
```javascript
/**
 * Integration-Tests für Buchungs-Endpunkte
 * 
 * Diese Tests prüfen die vollständige Buchungslogik:
 * - POST /api/v1/bookings (Buchung erstellen)
 * - DELETE /api/v1/bookings/:id (Buchung löschen)
 * - GET /api/v1/bookings (Buchungen abrufen)
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const { createTestServer } = require('../helpers/test-server');

// Test-Datenbank-Pfad
const TEST_DB_PATH = path.join(__dirname, '../../test-bookings.db');

let app;
let cleanup;

beforeAll(async () => {
  // Test-Datenbank löschen falls vorhanden
  try {
    if (await fs.access(TEST_DB_PATH).then(() => true).catch(() => false)) {
      await fs.unlink(TEST_DB_PATH);
    }
  } catch (err) {
    // Ignorieren
  }

  // Test-Server erstellen
  const server = await createTestServer(TEST_DB_PATH);
  app = server.app;
  cleanup = server.cleanup;
});

afterAll(async () => {
  // Cleanup
  if (cleanup) {
    await cleanup();
  }
  
  // Test-Datenbank löschen
  try {
    if (await fs.access(TEST_DB_PATH).then(() => true).catch(() => false)) {
      await fs.unlink(TEST_DB_PATH);
    }
  } catch (err) {
    // Ignorieren
  }
});

// Helper-Funktion: Gültiges Datum für Tests (morgen)
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

describe('POST /api/v1/bookings', () => {
  // Hier kommen die Tests hin
});
```

---

### Schritt 2: Erfolgreiche Buchungserstellung testen

**Test 1.1: Gültige Buchung erstellen**

```javascript
describe('POST /api/v1/bookings', () => {
  describe('Erfolgreiche Buchungserstellung', () => {
    test('1.1: Gültige Buchung erstellen', async () => {
      const tomorrow = getTomorrowDate();
      
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: 1,
          date: tomorrow,
          slot: '08:00-10:00',
          user_name: 'TestUser'
        })
        .expect(201);

      // Response-Struktur prüfen
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      // Buchung-Daten prüfen
      const booking = response.body.data;
      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('machine_id', 1);
      expect(booking).toHaveProperty('date', tomorrow);
      expect(booking).toHaveProperty('slot', '08:00-10:00');
      expect(booking).toHaveProperty('user_name', 'TestUser');
      expect(booking).toHaveProperty('machine_name');
      expect(booking).toHaveProperty('machine_type');
    });
  });
});
```

**Weitere Tests für Erfolgreiche Buchungserstellung:**
- Test 1.2: Buchung mit verschiedenen Maschinen
- Test 1.3: Buchung mit verschiedenen Slots
- Test 1.4: Buchung mit verschiedenen Daten

---

### Schritt 3: Validierungs-Fehler testen

**Test 2.1.1: Fehlendes machine_id**

```javascript
describe('Validierungs-Fehler', () => {
  test('2.1.1: Fehlendes machine_id', async () => {
    const tomorrow = getTomorrowDate();
    
    const response = await request(app)
      .post('/api/v1/bookings')
      .send({
        // machine_id fehlt
        date: tomorrow,
        slot: '08:00-10:00',
        user_name: 'TestUser'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('machine_id');
  });
});
```

**Weitere Validierungs-Tests:**
- Test 2.1.2: Fehlendes date
- Test 2.1.3: Fehlendes slot
- Test 2.1.4: Fehlendes user_name
- Test 2.2.1-2.2.4: Ungültige Maschine-ID
- Test 2.3.1-2.3.4: Ungültiges Datum
- Test 2.4.1-2.4.3: Ungültiger Slot
- Test 2.5.1-2.5.3: Ungültiger Benutzername

**Referenz:** Siehe `TEST_STRATEGIE_BUCHUNGSLOGIK.md` für alle Test-Cases

---

### Schritt 4: Doppelbuchung verhindern testen

**Test 3.1: Doppelte Buchung verhindern**

```javascript
describe('Doppelbuchung verhindern', () => {
  test('3.1: Doppelte Buchung (gleiche Maschine, Slot, Datum)', async () => {
    const tomorrow = getTomorrowDate();
    
    // Erste Buchung erstellen
    const firstResponse = await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 1,
        date: tomorrow,
        slot: '08:00-10:00',
        user_name: 'User1'
      })
      .expect(201);

    expect(firstResponse.body.success).toBe(true);
    
    // Zweite Buchung versuchen (gleiche Maschine, Slot, Datum)
    const secondResponse = await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 1,
        date: tomorrow,
        slot: '08:00-10:00',
        user_name: 'User2'  // Anderer User, aber gleicher Slot
      })
      .expect(409);  // Conflict

    expect(secondResponse.body).toHaveProperty('success', false);
    expect(secondResponse.body).toHaveProperty('error');
    expect(secondResponse.body.error).toContain('bereits');
  });
});
```

**Weitere Doppelbuchung-Tests:**
- Test 3.2: Doppelte Buchung mit verschiedenen Usern
- Test 3.3: Keine Doppelbuchung bei verschiedenen Maschinen
- Test 3.4: Keine Doppelbuchung bei verschiedenen Slots
- Test 3.5: Keine Doppelbuchung bei verschiedenen Daten

---

### Schritt 5: DELETE-Endpunkt testen

**Test 5.1: Eigene Buchung löschen**

```javascript
describe('DELETE /api/v1/bookings/:id', () => {
  describe('Erfolgreiche Löschung', () => {
    test('5.1: Eigene Buchung löschen', async () => {
      const tomorrow = getTomorrowDate();
      
      // Buchung erstellen
      const createResponse = await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: 1,
          date: tomorrow,
          slot: '08:00-10:00',
          user_name: 'TestUser'
        })
        .expect(201);

      const bookingId = createResponse.body.data.id;

      // Buchung löschen
      const deleteResponse = await request(app)
        .delete(`/api/v1/bookings/${bookingId}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('success', true);
      expect(deleteResponse.body.data).toHaveProperty('message');
      
      // Prüfen dass Buchung wirklich gelöscht ist
      const getResponse = await request(app)
        .get(`/api/v1/bookings?date=${tomorrow}`)
        .expect(200);

      const bookings = getResponse.body.data;
      const deletedBooking = bookings.find(b => b.id === bookingId);
      expect(deletedBooking).toBeUndefined();
    });
  });
});
```

**Hinweis:** Für Admin-Tests benötigst du Session-Management. Siehe bestehende Tests für Session-Handling.

---

### Schritt 6: GET-Endpunkt testen

**Test 7.1: Buchungen für Datum abrufen**

```javascript
describe('GET /api/v1/bookings', () => {
  test('7.1: Buchungen für Datum abrufen', async () => {
    const tomorrow = getTomorrowDate();
    
    // Mehrere Buchungen erstellen
    await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 1,
        date: tomorrow,
        slot: '08:00-10:00',
        user_name: 'User1'
      })
      .expect(201);

    await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 2,
        date: tomorrow,
        slot: '10:00-12:00',
        user_name: 'User2'
      })
      .expect(201);

    // Buchungen abrufen
    const response = await request(app)
      .get(`/api/v1/bookings?date=${tomorrow}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    
    // Prüfen dass alle Buchungen für das richtige Datum sind
    response.body.data.forEach(booking => {
      expect(booking.date).toBe(tomorrow);
    });
  });
});
```

---

## ✅ Checkliste

### Implementierung:
- [ ] Datei `tests/integration/bookings.test.js` erstellt
- [ ] Test-Setup (beforeAll/afterAll) implementiert
- [ ] Helper-Funktion `getTomorrowDate()` erstellt

### POST /api/v1/bookings Tests:
- [ ] Test 1.1: Gültige Buchung erstellen
- [ ] Test 1.2: Buchung mit verschiedenen Maschinen
- [ ] Test 1.3: Buchung mit verschiedenen Slots
- [ ] Test 1.4: Buchung mit verschiedenen Daten
- [ ] Test 2.1.1-2.1.4: Fehlende Pflichtfelder
- [ ] Test 2.2.1-2.2.4: Ungültige Maschine-ID
- [ ] Test 2.3.1-2.3.4: Ungültiges Datum
- [ ] Test 2.4.1-2.4.3: Ungültiger Slot
- [ ] Test 2.5.1-2.5.3: Ungültiger Benutzername
- [ ] Test 3.1-3.5: Doppelbuchung verhindern
- [ ] Test 4.1-4.5: Edge-Cases

### DELETE /api/v1/bookings/:id Tests:
- [ ] Test 5.1: Eigene Buchung löschen
- [ ] Test 5.2: Admin kann alle löschen (mit Session)
- [ ] Test 6.1.1-6.1.4: Ungültige Buchungs-ID
- [ ] Test 6.2: Keine Berechtigung (mit Session)
- [ ] Test 6.3: Nicht eingeloggt (mit Session)

### GET /api/v1/bookings Tests:
- [ ] Test 7.1: Buchungen für Datum abrufen
- [ ] Test 7.2: Leeres Datum
- [ ] Test 7.3: Ungültiges Datum
- [ ] Test 7.4: Keine Buchungen für Datum

### Tests ausführen:
- [ ] `npm run test:integration` ausführen
- [ ] Alle Tests bestehen
- [ ] Coverage prüfen: `npm run test:coverage`

---

## 📚 Referenzen

### Dokumentation:
- `TEST_STRATEGIE_BUCHUNGSLOGIK.md` - Vollständige Test-Strategie
- `tests/integration/api.test.js` - Bestehende Tests als Referenz
- `tests/helpers/test-server.js` - Test-Server Helper

### Code-Stellen:
- `server.js:2347-2467` - POST /api/v1/bookings Endpunkt
- `server.js:2470-2523` - DELETE /api/v1/bookings/:id Endpunkt
- `server.js:2180-2226` - GET /api/v1/bookings Endpunkt

---

## 🐛 Troubleshooting

### Problem: Tests schlagen fehl wegen Datenbank
**Lösung:** Stelle sicher, dass `TEST_DB_PATH` eindeutig ist und in `afterAll` gelöscht wird.

### Problem: Session-Tests funktionieren nicht
**Lösung:** Siehe bestehende Tests für Session-Handling. Möglicherweise muss `test-server.js` erweitert werden.

### Problem: Doppelbuchung-Test schlägt fehl
**Lösung:** Stelle sicher, dass die erste Buchung wirklich erstellt wurde, bevor die zweite versucht wird.

---

## 🎯 Abnahmekriterien

- [ ] Alle 28 Tests implementiert
- [ ] Alle Tests bestehen (`npm run test:integration`)
- [ ] Coverage für Buchungs-Endpunkte > 80%
- [ ] Code folgt bestehenden Test-Patterns
- [ ] Tests sind gut dokumentiert

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Offen  
**Nächste Review:** Nach Implementierung

