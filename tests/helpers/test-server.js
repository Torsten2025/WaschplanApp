/**
 * Test-Server Helper
 * Erstellt einen Test-Server für Integration-Tests
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

/**
 * Erstellt einen Test-Server mit eigener Test-Datenbank
 */
async function createTestServer(testDbPath) {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));
  
  // Test-Datenbank
  const db = new sqlite3.Database(testDbPath);
  
  // Datenbank initialisieren
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      
      // Maschinen-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL
      )`, (err) => {
        if (err) reject(err);
      });
      
      // Buchungen-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        slot TEXT NOT NULL,
        user_name TEXT NOT NULL,
        FOREIGN KEY (machine_id) REFERENCES machines(id)
      )`, (err) => {
        if (err) reject(err);
      });
      
      // Seed-Daten einfügen
      db.get('SELECT COUNT(*) as count FROM machines', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row.count === 0) {
          const seedMachines = [
            { name: 'Waschmaschine 1', type: 'washer' },
            { name: 'Waschmaschine 2', type: 'washer' },
            { name: 'Waschmaschine 3', type: 'washer' },
            { name: 'Trocknungsraum 1', type: 'dryer' }
          ];
          
          let inserted = 0;
          seedMachines.forEach(machine => {
            db.run(
              'INSERT INTO machines (name, type) VALUES (?, ?)',
              [machine.name, machine.type],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  inserted++;
                  if (inserted === seedMachines.length) {
                    resolve();
                  }
                }
              }
            );
          });
        } else {
          resolve();
        }
      });
    });
  });
  
  // Helper-Funktionen
  const dbHelper = {
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    },
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  };
  
  // API Response Helper
  const apiResponse = {
    success: (res, data, statusCode = 200) => {
      res.status(statusCode).json({ success: true, data });
    },
    error: (res, message, statusCode = 500) => {
      res.status(statusCode).json({ success: false, error: message });
    },
    validationError: (res, message) => {
      res.status(400).json({ success: false, error: message, type: 'validation_error' });
    },
    notFound: (res, resource = 'Ressource') => {
      res.status(404).json({ success: false, error: `${resource} nicht gefunden` });
    },
    conflict: (res, message) => {
      res.status(409).json({ success: false, error: message, type: 'conflict' });
    }
  };
  
  // Validierungsfunktionen
  const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '08:00-10:00' },
    { start: '10:00', end: '12:00', label: '10:00-12:00' },
    { start: '12:00', end: '14:00', label: '12:00-14:00' },
    { start: '14:00', end: '16:00', label: '14:00-16:00' },
    { start: '16:00', end: '18:00', label: '16:00-18:00' },
    { start: '18:00', end: '20:00', label: '18:00-20:00' }
  ];
  
  function isValidSlot(slot) {
    return TIME_SLOTS.some(s => s.label === slot);
  }
  
  function isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    const trimmedDate = dateString.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmedDate)) return false;
    const date = new Date(trimmedDate + 'T00:00:00');
    if (isNaN(date.getTime())) return false;
    const [year, month, day] = trimmedDate.split('-').map(Number);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }
  
  function validateAndTrimString(value) {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  
  function validateInteger(value) {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    return Number.isInteger(num) && num > 0 ? num : null;
  }
  
  // API-Routen
  const apiV1 = express.Router();
  
  // GET /api/v1/machines
  apiV1.get('/machines', async (req, res) => {
    try {
      const machines = await dbHelper.all('SELECT * FROM machines ORDER BY id');
      apiResponse.success(res, machines);
    } catch (error) {
      apiResponse.error(res, 'Fehler beim Abrufen der Maschinen', 500);
    }
  });
  
  // GET /api/v1/slots
  apiV1.get('/slots', (req, res) => {
    apiResponse.success(res, TIME_SLOTS);
  });
  
  // GET /api/v1/bookings
  apiV1.get('/bookings', async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) {
        apiResponse.validationError(res, 'Datum-Parameter (date) ist erforderlich. Format: YYYY-MM-DD');
        return;
      }
      const trimmedDate = typeof date === 'string' ? date.trim() : date;
      if (!isValidDate(trimmedDate)) {
        apiResponse.validationError(res, 'Ungültiges Datum. Format: YYYY-MM-DD');
        return;
      }
      const bookings = await dbHelper.all(`
        SELECT 
          b.id,
          b.machine_id,
          b.date,
          b.slot,
          b.user_name,
          m.name as machine_name,
          m.type as machine_type
        FROM bookings b
        INNER JOIN machines m ON b.machine_id = m.id
        WHERE b.date = ?
        ORDER BY b.slot, m.name
      `, [trimmedDate]);
      apiResponse.success(res, bookings);
    } catch (error) {
      apiResponse.error(res, 'Fehler beim Abrufen der Buchungen', 500);
    }
  });
  
  // GET /api/v1/bookings/week
  apiV1.get('/bookings/week', async (req, res) => {
    try {
      const { start_date } = req.query;
      if (!start_date) {
        apiResponse.validationError(res, 'start_date-Parameter ist erforderlich');
        return;
      }
      const startDate = new Date(start_date + 'T00:00:00');
      if (isNaN(startDate.getTime())) {
        apiResponse.validationError(res, 'Ungültiges Datum');
        return;
      }
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(startDate);
      monday.setDate(startDate.getDate() + diff);
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      const mondayStr = monday.toISOString().split('T')[0];
      const fridayStr = friday.toISOString().split('T')[0];
      const bookings = await dbHelper.all(`
        SELECT 
          b.id,
          b.machine_id,
          b.date,
          b.slot,
          b.user_name,
          m.name as machine_name,
          m.type as machine_type
        FROM bookings b
        INNER JOIN machines m ON b.machine_id = m.id
        WHERE b.date >= ? AND b.date <= ?
        ORDER BY b.date, b.slot, m.name
      `, [mondayStr, fridayStr]);
      apiResponse.success(res, {
        week_start: mondayStr,
        week_end: fridayStr,
        bookings: bookings
      });
    } catch (error) {
      apiResponse.error(res, 'Fehler beim Abrufen der Wochen-Buchungen', 500);
    }
  });
  
  // GET /api/v1/bookings/month
  apiV1.get('/bookings/month', async (req, res) => {
    try {
      const { year, month } = req.query;
      if (!year || !month) {
        apiResponse.validationError(res, 'year und month Parameter sind erforderlich');
        return;
      }
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        apiResponse.validationError(res, 'Ungültige year oder month Parameter');
        return;
      }
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = new Date(yearNum, monthNum, 0);
      const firstDayStr = firstDay.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];
      const bookings = await dbHelper.all(`
        SELECT 
          b.id,
          b.machine_id,
          b.date,
          b.slot,
          b.user_name,
          m.name as machine_name,
          m.type as machine_type
        FROM bookings b
        INNER JOIN machines m ON b.machine_id = m.id
        WHERE b.date >= ? AND b.date <= ?
        ORDER BY b.date, b.slot, m.name
      `, [firstDayStr, lastDayStr]);
      apiResponse.success(res, {
        year: yearNum,
        month: monthNum,
        month_start: firstDayStr,
        month_end: lastDayStr,
        bookings: bookings
      });
    } catch (error) {
      apiResponse.error(res, 'Fehler beim Abrufen der Monats-Buchungen', 500);
    }
  });
  
  // POST /api/v1/bookings
  apiV1.post('/bookings', async (req, res) => {
    try {
      const { machine_id, date, slot, user_name } = req.body;
      const validatedMachineId = validateInteger(machine_id);
      const validatedDate = date ? (typeof date === 'string' ? date.trim() : String(date)) : null;
      const validatedSlot = validateAndTrimString(slot);
      const validatedUserName = validateAndTrimString(user_name);
      
      if (!validatedMachineId || !validatedDate || !validatedSlot || !validatedUserName) {
        apiResponse.validationError(res, 'Alle Felder sind erforderlich');
        return;
      }
      
      if (!isValidDate(validatedDate)) {
        apiResponse.validationError(res, 'Ungültiges Datum');
        return;
      }
      
      if (!isValidSlot(validatedSlot)) {
        apiResponse.validationError(res, 'Ungültiger Slot');
        return;
      }
      
      const machine = await dbHelper.get('SELECT * FROM machines WHERE id = ?', [validatedMachineId]);
      if (!machine) {
        apiResponse.notFound(res, 'Maschine');
        return;
      }
      
      const existingBooking = await dbHelper.get(
        'SELECT * FROM bookings WHERE machine_id = ? AND date = ? AND slot = ?',
        [validatedMachineId, validatedDate, validatedSlot]
      );
      
      if (existingBooking) {
        apiResponse.conflict(res, 'Dieser Slot ist bereits gebucht');
        return;
      }
      
      const result = await dbHelper.run(
        'INSERT INTO bookings (machine_id, date, slot, user_name) VALUES (?, ?, ?, ?)',
        [validatedMachineId, validatedDate, validatedSlot, validatedUserName]
      );
      
      const booking = await dbHelper.get(`
        SELECT 
          b.id,
          b.machine_id,
          b.date,
          b.slot,
          b.user_name,
          m.name as machine_name,
          m.type as machine_type
        FROM bookings b
        INNER JOIN machines m ON b.machine_id = m.id
        WHERE b.id = ?
      `, [result.lastID]);
      
      apiResponse.success(res, booking, 201);
    } catch (error) {
      apiResponse.error(res, 'Fehler beim Erstellen der Buchung', 500);
    }
  });
  
  // DELETE /api/v1/bookings/:id
  apiV1.delete('/bookings/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedId = validateInteger(id);
      if (!validatedId) {
        apiResponse.validationError(res, 'Ungültige Buchungs-ID');
        return;
      }
      const booking = await dbHelper.get('SELECT * FROM bookings WHERE id = ?', [validatedId]);
      if (!booking) {
        apiResponse.notFound(res, 'Buchung');
        return;
      }
      await dbHelper.run('DELETE FROM bookings WHERE id = ?', [validatedId]);
      apiResponse.success(res, { message: 'Buchung erfolgreich gelöscht' });
    } catch (error) {
      apiResponse.error(res, 'Fehler beim Löschen der Buchung', 500);
    }
  });
  
  app.use('/api/v1', apiV1);
  
  // 404 Handler
  app.use((req, res) => {
    apiResponse.notFound(res, 'Endpoint');
  });
  
  return { app, db, cleanup: async () => {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error('Fehler beim Schließen der Test-Datenbank:', err);
        resolve();
      });
    });
  }};
}

module.exports = { createTestServer };

