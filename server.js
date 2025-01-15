// Import modules
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
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
const dbPath = path.resolve('/data', 'waschplan.db');
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

// API: Maschine hinzufügen
app.post('/api/admin/addBooking', async (req, res) => {
    const { userId, machineId, machineType, bookingDate, slot } = req.body;

    try {
        console.log("Empfangene Buchungsdaten:", req.body);

        // Wochentag ermitteln (0 = Sonntag)
        const dayOfWeek = new Date(bookingDate).getDay();

        // **Sonntagsregel**
        if (machineType === 'Waschmaschine' && dayOfWeek === 0) {
            return res.status(400).json({ error: 'Keine Sonntagsbuchungen für Waschmaschinen erlaubt.' });
        }

        // Buchung speichern
        console.log("Buchung wird gespeichert:", { userId, machineId, machineType, bookingDate, slot });
        const newBooking = {
            userId,
            machineId,
            machineType,
            date: bookingDate,
            slot,
        };
        await saveBooking(newBooking);

        res.status(200).json({ message: 'Buchung erfolgreich!' });
    } catch (error) {
        console.error('Fehler bei der Verarbeitung der Buchung:', error);
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
});

// Funktion: Buchung speichern
async function saveBooking(booking) {
    const sql = `
        INSERT INTO bookings (start_time, end_time, user_kuerzel, machine_name)
        VALUES (?, ?, ?, ?)
    `;
    const startTime = booking.slot;
    const endTime = dayjs(booking.slot).add(5, 'hour').format('YYYY-MM-DDTHH:mm:ss');
    const userkuerzel = await dbGet(`SELECT kuerzel FROM users WHERE id = ?`, [booking.userId]);
    const machineName = await dbGet(`SELECT name FROM machines WHERE id = ?`, [booking.machineId]);

    return await dbRun(sql, [startTime, endTime, userkuerzel.kuerzel, machineName.name]);
}

// API: Alle Buchungen anzeigen
app.get('/api/bookings', (req, res) => {
    const sql = `SELECT * FROM bookings`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Buchungen:', err.message);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Buchungen.' });
        }

        console.log('Buchungen aus der Datenbank:', rows);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Keine Buchungen gefunden.' });
        }

        res.json(rows);
    });
});

// API: Alle Maschinen anzeigen
app.get('/api/machines', async (req, res) => {
    try {
        const sql = `SELECT * FROM machines`;
        const rows = await dbAll(sql);

        res.json(rows);
    } catch (err) {
        console.error('Fehler beim Abrufen der Maschinen:', err.message);
        res.status(500).json({ error: 'Fehler beim Abrufen der Maschinen.' });
    }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
