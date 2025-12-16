/**
 * Performance/Load-Tests für API
 * 
 * Diese Tests prüfen die Performance der API unter Last
 * WICHTIG: Diese Tests sollten nicht in CI/CD ausgeführt werden,
 * da sie den Server belasten
 */

const request = require('supertest');

// Server-Import (muss angepasst werden)
let app;

beforeAll(() => {
  app = require('../../server');
});

describe('Performance Tests', () => {
  describe('GET /api/machines - Response Time', () => {
    test('sollte in unter 100ms antworten', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/machines')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    test('sollte auch bei mehreren Requests schnell antworten', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app).get('/api/machines')
      );
      
      const startTime = Date.now();
      await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      const avgTime = totalTime / 10;
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('GET /api/slots - Response Time', () => {
    test('sollte in unter 50ms antworten', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/slots')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(50);
    });
  });

  describe('GET /api/bookings - Response Time', () => {
    test('sollte in unter 150ms antworten', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const startTime = Date.now();
      
      await request(app)
        .get(`/api/bookings?date=${dateStr}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(150);
    });
  });

  describe('POST /api/bookings - Response Time', () => {
    let machineId;

    beforeAll(async () => {
      const machinesResponse = await request(app).get('/api/machines');
      machineId = machinesResponse.body.data[0].id;
    });

    test('sollte in unter 200ms antworten', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const startTime = Date.now();
      
      await request(app)
        .post('/api/bookings')
        .send({
          machine_id: machineId,
          date: dateStr,
          slot: '14:00-16:00',
          user_name: 'Performance Test'
        })
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('Concurrent Requests', () => {
    test('sollte 50 gleichzeitige Requests verarbeiten können', async () => {
      const requests = Array(50).fill(null).map(() => 
        request(app).get('/api/slots')
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // Alle Requests sollten erfolgreich sein
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Sollte in unter 2 Sekunden abgeschlossen sein
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage', () => {
    test('sollte keine Memory-Leaks bei wiederholten Requests haben', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 100 Requests ausführen
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/slots');
      }
      
      // Garbage Collection anstoßen (falls möglich)
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory-Zunahme sollte unter 10MB sein
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});

