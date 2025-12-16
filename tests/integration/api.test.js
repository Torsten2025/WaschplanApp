/**
 * Integration-Tests für API-Endpunkte
 * 
 * Diese Tests prüfen die vollständige API-Funktionalität
 * mit einer echten Datenbank (Test-Datenbank)
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const { createTestServer } = require('../helpers/test-server');

// Test-Datenbank-Pfad
const TEST_DB_PATH = path.join(__dirname, '../../test-waschmaschine.db');

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

describe('API Integration Tests', () => {
  describe('GET /api/v1/machines', () => {
    test('sollte alle Maschinen zurückgeben', async () => {
      const response = await request(app)
        .get('/api/v1/machines')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    test('sollte korrekte Maschinen-Struktur haben', async () => {
      const response = await request(app)
        .get('/api/v1/machines')
        .expect(200);

      if (response.body.data.length > 0) {
        const machine = response.body.data[0];
        expect(machine).toHaveProperty('id');
        expect(machine).toHaveProperty('name');
        expect(machine).toHaveProperty('type');
        expect(['washer', 'dryer']).toContain(machine.type);
      }
    });
  });

  describe('GET /api/v1/slots', () => {
    test('sollte alle Slots zurückgeben', async () => {
      const response = await request(app)
        .get('/api/v1/slots')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(6);
    });

    test('sollte korrekte Slot-Struktur haben', async () => {
      const response = await request(app)
        .get('/api/v1/slots')
        .expect(200);

      const slot = response.body.data[0];
      expect(slot).toHaveProperty('start');
      expect(slot).toHaveProperty('end');
      expect(slot).toHaveProperty('label');
    });
  });

  describe('GET /api/v1/bookings', () => {
    test('sollte Fehler zurückgeben wenn date fehlt', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('type', 'validation_error');
    });

    test('sollte Fehler zurückgeben bei ungültigem Datum', async () => {
      const response = await request(app)
        .get('/api/v1/bookings?date=2023-01-01')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('type', 'validation_error');
    });

    test('sollte Buchungen für gültiges Datum zurückgeben', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/v1/bookings?date=${dateStr}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/bookings/week', () => {
    test('sollte Fehler zurückgeben wenn start_date fehlt', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/week')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('type', 'validation_error');
    });

    test('sollte Buchungen für eine Arbeitswoche zurückgeben', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/v1/bookings/week?start_date=${dateStr}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('week_start');
      expect(response.body.data).toHaveProperty('week_end');
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });
  });

  describe('GET /api/v1/bookings/month', () => {
    test('sollte Fehler zurückgeben wenn year oder month fehlt', async () => {
      const response1 = await request(app)
        .get('/api/v1/bookings/month')
        .expect(400);

      expect(response1.body).toHaveProperty('success', false);

      const response2 = await request(app)
        .get('/api/v1/bookings/month?year=2024')
        .expect(400);

      expect(response2.body).toHaveProperty('success', false);
    });

    test('sollte Buchungen für einen Monat zurückgeben', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await request(app)
        .get(`/api/v1/bookings/month?year=${year}&month=${month}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('year', year);
      expect(response.body.data).toHaveProperty('month', month);
      expect(response.body.data).toHaveProperty('month_start');
      expect(response.body.data).toHaveProperty('month_end');
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });
  });

  describe('POST /api/v1/bookings', () => {
    let machineId;
    let tomorrow;

    beforeAll(async () => {
      // Maschine für Tests holen
      const machinesResponse = await request(app).get('/api/v1/machines');
      machineId = machinesResponse.body.data[0].id;
      
      tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
    });

    test('sollte Buchung erfolgreich erstellen', async () => {
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '08:00-10:00',
          user_name: 'Test User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('machine_id', machineId);
      expect(response.body.data).toHaveProperty('date', dateStr);
      expect(response.body.data).toHaveProperty('slot', '08:00-10:00');
      expect(response.body.data).toHaveProperty('user_name', 'Test User');
    });

    test('sollte Fehler bei fehlenden Pflichtfeldern zurückgeben', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId
          // date, slot, user_name fehlen
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('type', 'validation_error');
    });

    test('sollte Doppelbuchung verhindern', async () => {
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Erste Buchung
      await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '10:00-12:00',
          user_name: 'User 1'
        })
        .expect(201);

      // Zweite Buchung mit gleichen Daten
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '10:00-12:00',
          user_name: 'User 2'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('type', 'conflict');
    });
  });

  describe('DELETE /api/v1/bookings/:id', () => {
    let bookingId;
    let machineId;
    let tomorrow;

    beforeAll(async () => {
      // Buchung für Tests erstellen
      const machinesResponse = await request(app).get('/api/v1/machines');
      machineId = machinesResponse.body.data[0].id;
      
      tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const createResponse = await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '12:00-14:00',
          user_name: 'Delete Test User'
        });
      
      bookingId = createResponse.body.data.id;
    });

    test('sollte Buchung erfolgreich löschen', async () => {
      const response = await request(app)
        .delete(`/api/v1/bookings/${bookingId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('sollte Fehler bei nicht existierender Buchung zurückgeben', async () => {
      const response = await request(app)
        .delete('/api/v1/bookings/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('sollte Fehler bei ungültiger ID zurückgeben', async () => {
      const response = await request(app)
        .delete('/api/v1/bookings/abc')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('type', 'validation_error');
    });
  });

  describe('GET /api/v1/bookings/week - Arbeitswochenübersicht', () => {
    let machineId;
    let testDate;

    beforeAll(async () => {
      // Maschine für Tests holen
      const machinesResponse = await request(app).get('/api/v1/machines');
      machineId = machinesResponse.body.data[0].id;
      
      // Test-Datum: Nächster Montag
      testDate = new Date();
      const dayOfWeek = testDate.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
      testDate.setDate(testDate.getDate() + daysUntilMonday);
    });

    test('sollte Buchungen für eine Arbeitswoche zurückgeben', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      // Test-Buchung erstellen
      await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '08:00-10:00',
          user_name: 'Week Test User'
        });

      const response = await request(app)
        .get(`/api/v1/bookings/week?start_date=${dateStr}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('week_start');
      expect(response.body.data).toHaveProperty('week_end');
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
      
      // Prüfe, dass week_start ein Montag ist
      const monday = new Date(response.body.data.week_start + 'T00:00:00');
      expect(monday.getDay()).toBe(1); // 1 = Montag
    });

    test('sollte Fehler bei ungültigem start_date zurückgeben', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/week?start_date=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('type', 'validation_error');
    });
  });

  describe('GET /api/v1/bookings/month - Monatsübersicht', () => {
    let machineId;
    let testYear;
    let testMonth;

    beforeAll(async () => {
      // Maschine für Tests holen
      const machinesResponse = await request(app).get('/api/v1/machines');
      machineId = machinesResponse.body.data[0].id;
      
      // Test-Datum: Nächster Monat
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      testYear = nextMonth.getFullYear();
      testMonth = nextMonth.getMonth() + 1;
      
      // Test-Buchung erstellen
      const firstDay = new Date(testYear, testMonth - 1, 1);
      const dateStr = firstDay.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/v1/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '10:00-12:00',
          user_name: 'Month Test User'
        });
    });

    test('sollte Buchungen für einen Monat zurückgeben', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/month?year=${testYear}&month=${testMonth}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('year', testYear);
      expect(response.body.data).toHaveProperty('month', testMonth);
      expect(response.body.data).toHaveProperty('month_start');
      expect(response.body.data).toHaveProperty('month_end');
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });

    test('sollte Fehler bei ungültigem month zurückgeben', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/month?year=${testYear}&month=13`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('sollte Fehler bei ungültigem year zurückgeben', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/month?year=abc&month=1')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('404 Handler', () => {
    test('sollte 404 für unbekannte Endpunkte zurückgeben', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
