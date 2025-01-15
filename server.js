// Import modules
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // SQLite wird hier nur einmal importiert
const dayjs = require('dayjs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Route für die Startseite (Login-Seite)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// SQLite einrichten
const dbPath = path.resolve('/data', 'waschplan.db'); // Persistent Disk Pfad
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden mit SQLite:', err.message);
    } else {
        console.log(`SQLite-Datenbank erfolgreich verbunden: ${dbPath}`);
    }
});

// Tabellen erstellen
const fs = require('fs');

if (!fs.existsSync(dbPath)) {
    console.log('Datenbank wird zum ersten Mal erstellt.');
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                user_kuerzel TEXT NOT NULL,
                machine_name TEXT NOT NULL
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kuerzel TEXT NOT NULL UNIQUE
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS machines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id INTEGER NOT NULL,
                datum TEXT NOT NULL,
                beschreibung TEXT NOT NULL,
                status TEXT NOT NULL,
                FOREIGN KEY(machine_id) REFERENCES machines(id)
            )
        `);
    });
} else {
    console.log('Datenbank gefunden und geladen.');
}
// Promisify SQLite-Methoden
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Funktion: Buchung speichern
async function saveBooking(booking) {
    const sql = `
        INSERT INTO bookings (start_time, end_time, user_kuerzel, machine_name)
        VALUES (?, ?, ?, ?)
    `;
    const startTime = booking.slot; // Annahme: `slot` enthält die Startzeit
    const endTime = dayjs(booking.slot).add(5, 'hour').format('YYYY-MM-DDTHH:mm:ss');
    const userkuerzel = await dbGet(`SELECT kuerzel FROM users WHERE id = ?`, [booking.userId]);
    const machineName = await dbGet(`SELECT name FROM machines WHERE id = ?`, [booking.machineId]);

    return await dbRun(sql, [startTime, endTime, userkuerzel.kuerzel, machineName.name]);
}

// API: Login
app.post('/api/login', (req, res) => {
    const { kuerzel, password } = req.body;
    const sql = `SELECT * FROM users WHERE kuerzel = ?`;
    db.get(sql, [kuerzel], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Fehler beim Abrufen der Nutzerdaten.' });
        }
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
        }
        if (kuerzel === 'Admin' && password === 'Admin') {
            return res.json({ message: 'Login erfolgreich', role: 'admin', kuerzel });
        }
        res.json({ message: 'Login erfolgreich', role: 'user', kuerzel, userId: user.id });
    });
});

// API: Nutzer hinzufügen
app.post('/api/admin/addUser', async (req, res) => {
    const { kuerzel } = req.body;

    try {
        const sql = `INSERT INTO users (kuerzel) VALUES (?)`;
        const result = await dbRun(sql, [kuerzel]);
        res.json({ message: 'Nutzer erfolgreich hinzugefügt.', id: result.lastID });
    } catch (err) {
        console.error('Fehler beim Hinzufügen des Nutzers:', err.message);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Nutzers.' });
    }
});

// API: Alle Nutzer anzeigen
app.get('/api/admin/users', async (req, res) => {
    try {
        const sql = `SELECT * FROM users`;
        const rows = await dbAll(sql);
        res.json(rows);
    } catch (err) {
        console.error('Fehler beim Abrufen der Nutzer:', err.message);
        res.status(500).json({ error: 'Fehler beim Abrufen der Nutzer.' });
    }
});

// API: Nutzer bearbeiten
app.put('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const { kuerzel } = req.body;

    try {
        const sql = `UPDATE users SET kuerzel = ? WHERE id = ?`;
        const result = await dbRun(sql, [kuerzel, id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
        }

        res.json({ message: 'Nutzer erfolgreich bearbeitet.' });
    } catch (err) {
        console.error('Fehler beim Bearbeiten des Nutzers:', err.message);
        res.status(500).json({ error: 'Fehler beim Bearbeiten des Nutzers.' });
    }
});

// API: Nutzer löschen
app.delete('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `DELETE FROM users WHERE id = ?`;
        const result = await dbRun(sql, [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
        }

        res.json({ message: 'Nutzer erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen des Nutzers:', err.message);
        res.status(500).json({ error: 'Fehler beim Löschen des Nutzers.' });
    }
});

// API: Alle Maschine anzeigen
app.get('/api/admin/machines', (req, res) => {
    const sql = `SELECT * FROM machines`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Maschinen:', err.message);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen.' });
        }
        res.json(rows);
    });
});

// API: Maschine hinzufügen
app.post('/api/admin/addBooking', async (req, res) => {
    const { userId, machineId, machineType, bookingDate, slot } = req.body;

    try {
        console.log("Empfangene Buchungsdaten:", req.body);

        // Alle Buchungen des Benutzers abrufen
        const userBookings = await getBookingsByUser(userId);
        console.log("Buchungen des Benutzers:", userBookings);
// Funktion: Buchungen eines Benutzers abrufen
async function getBookingsByUser(userId) {
    const sql = `
        SELECT * 
        FROM bookings 
        WHERE user_kuerzel = (SELECT kuerzel FROM users WHERE id = ?)
    `;
    return await dbAll(sql, [userId]);
}

// API: Maschine hinzufügen (Buchungen verarbeiten)
app.post('/api/admin/addBooking', async (req, res) => {
    const { userId, machineId, machineType, bookingDate, slot } = req.body;

    try {
        console.log("Empfangene Buchungsdaten:", req.body);

        // Alle Buchungen des Benutzers abrufen
        const userBookings = await getBookingsByUser(userId);
        console.log("Buchungen des Benutzers:", userBookings);

        // Restliche Logik zur Validierung und Speicherung der Buchung...
    } catch (error) {
        console.error('Fehler bei der Verarbeitung der Buchung:', error);
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
});


        // Buchungen für denselben Tag und Maschinentyp filtern
        const bookingsForDay = userBookings.filter(
            (b) => b.date === bookingDate && b.machineType === machineType
        );
        console.log("Buchungen für den gleichen Tag und Typ:", bookingsForDay);

        // Wochentag ermitteln (0 = Sonntag)
        const dayOfWeek = new Date(bookingDate).getDay();

        // **Waschmaschinenlogik**
        if (machineType === 'Waschmaschine') {
            // Keine Buchung an Sonntagen
            if (dayOfWeek === 0) {
                return res.status(400).json({ error: 'Keine Sonntagsbuchungen für Waschmaschinen erlaubt.' });
            }

            // Maximal 1 Buchung pro Tag
            if (bookingsForDay.length > 0) {
                return res.status(400).json({ error: 'Maximal 1 Waschmaschinenslot pro Tag erlaubt.' });
            }

            // Nur eine zukünftige Buchung erlaubt
            const futureBookings = userBookings.filter(
                (b) => b.date > bookingDate && b.machineId === machineId
            );
            if (futureBookings.length > 0) {
                return res.status(400).json({ error: 'Nur eine zukünftige Buchung pro Waschmaschine erlaubt.' });
            }
        }

        // **Trocknungsraumlogik**
        if (machineType === 'Trocknungsraum') {
            // Maximal 1 Buchung pro Tag
            if (bookingsForDay.length > 0) {
                return res.status(400).json({ error: 'Maximal 1 Trocknungsraum pro Tag erlaubt.' });
            }

            // Prüfen, ob der gewünschte Slot erlaubt ist
            const allowedSlots = calculateAllowedTRSlots(userBookings, bookingDate);
            console.log("Erlaubte Slots für den Trocknungsraum:", allowedSlots);

            if (!allowedSlots.includes(slot)) {
                return res.status(400).json({ error: 'Der gewünschte Slot ist nicht erlaubt.' });
            }

            // Maximal 3 Slots pro Raum
            const slotsForRoom = bookingsForDay.filter((b) => b.machineId === machineId);
            if (slotsForRoom.length >= 3) {
                return res.status(400).json({ error: 'Maximal 3 Slots pro Trocknungsraum erlaubt.' });
            }

            // Nur eine zukünftige Buchung erlaubt
            const futureBookings = userBookings.filter(
                (b) => b.date > bookingDate && b.machineId === machineId
            );
            if (futureBookings.length > 0) {
                return res.status(400).json({ error: 'Nur eine zukünftige Buchung pro Trocknungsraum erlaubt.' });
            }

            // Keine Einschränkung für Sonntagsbuchungen
            console.log("Sonntagsbuchungen für Trocknungsräume erlaubt.");
        }

        // Buchung speichern
        console.log("Buchung wird gespeichert:", { userId, machineId, machineType, bookingDate, slot });
        const newBooking = { userId, machineId, machineType, date: bookingDate, slot };
        await saveBooking(newBooking);

        res.status(200).json({ message: 'Buchung erfolgreich!' });
    } catch (error) {
        console.error('Fehler bei der Verarbeitung der Buchung:', error);
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
});


// Hilfsfunktion: Berechnung der erlaubten Slots für Trocknungsräume
function calculateAllowedTRSlots(userBookings, bookingDate) {
  const wmBooking = userBookings.find(
    (b) => b.machineType === 'Waschmaschine' && b.date === bookingDate
  );

  const nextDay = new Date(bookingDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split('T')[0];

  if (wmBooking) {
    switch (wmBooking.slot) {
      case '07:00-12:00':
        return ['07:00-12:00', '12:00-17:00', '17:00-21:00'];
      case '12:00-17:00':
        return ['12:00-17:00', '17:00-21:00', `${nextDayStr} 07:00-12:00`];
      case '17:00-21:00':
        return ['17:00-21:00', `${nextDayStr} 07:00-12:00`, `${nextDayStr} 12:00-17:00`];
    }
  } else {
    // Standard-Slots ohne Waschmaschinenbuchung
    return ['07:00-12:00', '12:00-17:00', '17:00-21:00'];
  }
}


// API: Alle Reservierungen anzeigen
app.get('/api/admin/reservations', (req, res) => {
    const sql = `SELECT * FROM bookings`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Reservierungen:', err.message);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Reservierungen.' });
        }
        res.json(rows);
    });
});

// API: Alle Buchungen anzeigen
app.get('/api/bookings', (req, res) => {
    const sql = `SELECT * FROM bookings`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Buchungen:', err.message);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Buchungen.' });
        }

        // Debugging: Logge die Ergebnisse aus der Datenbank
        console.log('Buchungen aus der Datenbank:', rows);

        if (!rows || rows.length === 0) {
            console.warn('Keine Buchungen gefunden.');
            return res.status(404).json({ error: 'Keine Buchungen gefunden.' });
        }

        res.json(rows);
    });
});

// API: Alle Logs anzeigen
app.get('/api/logs', (req, res) => {
    const sql = `SELECT * FROM logs`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Logs:', err.message);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Logs.' });
        }
        res.json(rows);
    });
});

// API: Buchung stornieren
app.delete('/api/user/deleteBooking/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM bookings WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Fehler beim Löschen der Buchung.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Buchung nicht gefunden.' });
        }
        res.json({ message: 'Buchung erfolgreich storniert.' });
    });
});

// API: Alle Maschinen für den Admin-Bereich anzeigen
app.get('/api/admin/machines', (req, res) => {
    const sql = `SELECT * FROM machines`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Maschinen:', err);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen.' });
        }
        res.json(rows);
    });
});

// API: Alle Maschinen für den User-Bereich anzeigen
app.get('/api/machines', async (req, res) => {
    try {
        const sql = `SELECT * FROM machines`;
        const rows = await dbAll(sql); // Promisified Version von db.all

        if (rows.length === 0) {
            console.warn("Keine Maschinen in der Datenbank gefunden.");
        }

        res.json(rows);
    } catch (err) {
        console.error(`Fehler beim Abrufen der Maschinen: ${err.message}`);
        res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen.' });
    }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
