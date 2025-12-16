# 📋 Aufgabe: Integration-Tests für Buchungslogik implementieren

**Zugewiesen an:** Senior Fullstack Developer  
**Priorität:** 🔴 KRITISCH  
**Geschätzte Zeit:** 1 Stunde  
**Status:** ⏳ Offen

---

## 🎯 Ziel

Implementiere End-to-End Integration-Tests für die Buchungslogik gemäß `TEST_STRATEGIE_BUCHUNGSLOGIK.md`.

**Test-Coverage-Ziel:** Vollständiger Buchungs-Flow von Frontend bis Backend

---

## 📋 Aufgaben-Übersicht

### 1. Vollständiger Buchungs-Flow (1 Test)
- Von Slot-Klick bis Buchung erstellt

### 2. Vollständiger Lösch-Flow (1 Test)
- Von Löschen-Button bis Buchung gelöscht

### 3. Fehlerbehandlung End-to-End (3 Tests)
- Netzwerk-Fehler
- Server-Fehler
- Validierungs-Fehler

**Gesamt:** 5 Tests

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
│   └── bookings-e2e.test.js (NEU erstellen - optional)
```

**Hinweis:** Integration-Tests können in `api.test.js` erweitert werden oder in separater Datei.

---

## 📝 Schritt-für-Schritt-Anleitung

### Schritt 1: Bestehende Tests erweitern

**Datei:** `tests/integration/api.test.js` (bereits vorhanden)

**Erweitere die bestehende Datei um:**

```javascript
describe('Buchungs-Flow End-to-End', () => {
  test('12.1: Vollständiger Buchungs-Flow', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Schritt 1: Maschinen abrufen
    const machinesResponse = await request(app)
      .get('/api/v1/machines')
      .expect(200);

    expect(machinesResponse.body.success).toBe(true);
    expect(machinesResponse.body.data.length).toBeGreaterThan(0);
    
    const machineId = machinesResponse.body.data[0].id;

    // Schritt 2: Slots abrufen
    const slotsResponse = await request(app)
      .get('/api/v1/slots')
      .expect(200);

    expect(slotsResponse.body.success).toBe(true);
    expect(slotsResponse.body.data.length).toBeGreaterThan(0);
    
    const slotLabel = slotsResponse.body.data[0].label;

    // Schritt 3: Buchung erstellen
    const createResponse = await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: machineId,
        date: dateStr,
        slot: slotLabel,
        user_name: 'E2E-Test-User'
      })
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toHaveProperty('id');
    const bookingId = createResponse.body.data.id;

    // Schritt 4: Buchung abrufen (verifizieren dass sie existiert)
    const getResponse = await request(app)
      .get(`/api/v1/bookings?date=${dateStr}`)
      .expect(200);

    expect(getResponse.body.success).toBe(true);
    const bookings = getResponse.body.data;
    const createdBooking = bookings.find(b => b.id === bookingId);
    
    expect(createdBooking).toBeDefined();
    expect(createdBooking.machine_id).toBe(machineId);
    expect(createdBooking.slot).toBe(slotLabel);
    expect(createdBooking.user_name).toBe('E2E-Test-User');

    // Schritt 5: Buchung löschen
    const deleteResponse = await request(app)
      .delete(`/api/v1/bookings/${bookingId}`)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);

    // Schritt 6: Verifizieren dass Buchung gelöscht ist
    const getAfterDeleteResponse = await request(app)
      .get(`/api/v1/bookings?date=${dateStr}`)
      .expect(200);

    const bookingsAfterDelete = getAfterDeleteResponse.body.data;
    const deletedBooking = bookingsAfterDelete.find(b => b.id === bookingId);
    expect(deletedBooking).toBeUndefined();
  });
});
```

---

### Schritt 2: Fehlerbehandlung testen

**Test 12.3.1: Netzwerk-Fehler**

```javascript
describe('Fehlerbehandlung End-to-End', () => {
  test('12.3.1: Validierungs-Fehler wird korrekt behandelt', async () => {
    // Versuche Buchung mit ungültigen Daten zu erstellen
    const response = await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 9999,  // Nicht-existierende Maschine
        date: '2024-12-31',
        slot: '08:00-10:00',
        user_name: 'TestUser'
      })
      .expect(404);  // Maschine nicht gefunden

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Maschine');
  });

  test('12.3.2: Doppelbuchung wird korrekt behandelt', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Erste Buchung erstellen
    const firstResponse = await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 1,
        date: dateStr,
        slot: '08:00-10:00',
        user_name: 'User1'
      })
      .expect(201);

    expect(firstResponse.body.success).toBe(true);

    // Zweite Buchung versuchen (doppelt)
    const secondResponse = await request(app)
      .post('/api/v1/bookings')
      .send({
        machine_id: 1,
        date: dateStr,
        slot: '08:00-10:00',
        user_name: 'User2'
      })
      .expect(409);  // Conflict

    expect(secondResponse.body).toHaveProperty('success', false);
    expect(secondResponse.body).toHaveProperty('error');
    expect(secondResponse.body.error).toContain('bereits');
  });
});
```

---

### Schritt 3: Vollständiger Lösch-Flow

**Test 12.2: Vollständiger Lösch-Flow**

```javascript
test('12.2: Vollständiger Lösch-Flow', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  // Schritt 1: Buchung erstellen
  const createResponse = await request(app)
    .post('/api/v1/bookings')
    .send({
      machine_id: 1,
      date: dateStr,
      slot: '08:00-10:00',
      user_name: 'TestUser'
    })
    .expect(201);

  const bookingId = createResponse.body.data.id;

  // Schritt 2: Verifizieren dass Buchung existiert
  const getBeforeDeleteResponse = await request(app)
    .get(`/api/v1/bookings?date=${dateStr}`)
    .expect(200);

  const bookingsBeforeDelete = getBeforeDeleteResponse.body.data;
  const bookingBeforeDelete = bookingsBeforeDelete.find(b => b.id === bookingId);
  expect(bookingBeforeDelete).toBeDefined();

  // Schritt 3: Buchung löschen
  const deleteResponse = await request(app)
    .delete(`/api/v1/bookings/${bookingId}`)
    .expect(200);

  expect(deleteResponse.body.success).toBe(true);
  expect(deleteResponse.body.data).toHaveProperty('message');

  // Schritt 4: Verifizieren dass Buchung gelöscht ist
  const getAfterDeleteResponse = await request(app)
    .get(`/api/v1/bookings?date=${dateStr}`)
    .expect(200);

  const bookingsAfterDelete = getAfterDeleteResponse.body.data;
  const deletedBooking = bookingsAfterDelete.find(b => b.id === bookingId);
  expect(deletedBooking).toBeUndefined();
});
```

---

## ✅ Checkliste

### Implementierung:
- [ ] Bestehende `tests/integration/api.test.js` erweitert ODER neue Datei erstellt
- [ ] Test 12.1: Vollständiger Buchungs-Flow implementiert
- [ ] Test 12.2: Vollständiger Lösch-Flow implementiert
- [ ] Test 12.3.1: Validierungs-Fehler implementiert
- [ ] Test 12.3.2: Doppelbuchung implementiert
- [ ] Test 12.3.3: Server-Fehler implementiert (optional)

### Tests ausführen:
- [ ] `npm run test:integration` ausführen
- [ ] Alle Tests bestehen
- [ ] Keine Regression in bestehenden Tests

---

## 📚 Referenzen

### Dokumentation:
- `TEST_STRATEGIE_BUCHUNGSLOGIK.md` - Vollständige Test-Strategie
- `tests/integration/api.test.js` - Bestehende Tests als Referenz

### Code-Stellen:
- `server.js:2347-2467` - POST /api/v1/bookings
- `server.js:2470-2523` - DELETE /api/v1/bookings/:id
- `server.js:2180-2226` - GET /api/v1/bookings

---

## 🎯 Abnahmekriterien

- [ ] Alle 5 Tests implementiert
- [ ] Alle Tests bestehen (`npm run test:integration`)
- [ ] Keine Regression in bestehenden Tests
- [ ] Tests sind gut dokumentiert
- [ ] Vollständiger Flow von Erstellung bis Löschung getestet

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Offen  
**Nächste Review:** Nach Implementierung

