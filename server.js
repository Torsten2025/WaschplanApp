// Import modules
const express = require('express');
const path = require('path');
const dayjs = require('dayjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// SQLite einrichten
const dbPath = path.resolve('/data', 'waschplan.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden mit SQLite:', err.message);
    } else {
        console.log(`SQLite-Datenbank erfolgreich verbunden: ${dbPath}`);
    }
});

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

// API: Login
app.post('/api/login', async (req, res) => {
    const { kuerzel, password } = req.body;

    try {
        const user = await dbGet(`SELECT * FROM users WHERE kuerzel = ?`, [kuerzel]);

        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
        }

        if (kuerzel === 'Admin' && password === 'Admin') {
            return res.json({ message: 'Login erfolgreich', role: 'admin', kuerzel });
        } else if (!password && kuerzel !== 'Admin') {
            return res.json({ message: 'Login erfolgreich', role: 'user', kuerzel, userId: user.id });
        } else {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
        }
    } catch (err) {
        console.error('Fehler beim Login:', err.message);
        res.status(500).json({ error: 'Interner Serverfehler.' });
    }
});

// API: Nutzer hinzufügen
app.post('/api/admin/addUser', async (req, res) => {
    const { kuerzel } = req.body;

    if (!kuerzel) {
        return res.status(400).json({ error: 'Kürzel ist erforderlich.' });
    }

    try {
        const result = await dbRun(`INSERT INTO users (kuerzel) VALUES (?)`, [kuerzel]);
        res.json({ message: 'Nutzer erfolgreich hinzugefügt.', userId: result.lastID });
    } catch (err) {
        console.error('Fehler beim Hinzufügen des Nutzers:', err.message);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Nutzers.' });
    }
});

// API: Nutzer bearbeiten
app.put('/api/admin/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { kuerzel } = req.body;

    if (!kuerzel) {
        return res.status(400).json({ error: 'Kürzel darf nicht leer sein.' });
    }

    try {
        const result = await dbRun(`UPDATE users SET kuerzel = ? WHERE id = ?`, [kuerzel, userId]);

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
    const userId = parseInt(req.params.id);

    try {
        const result = await dbRun(`DELETE FROM users WHERE id = ?`, [userId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
        }

        res.json({ message: 'Nutzer erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen des Nutzers:', err.message);
        res.status(500).json({ error: 'Fehler beim Löschen des Nutzers.' });
    }
});

// API: Alle Nutzer anzeigen
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await dbAll(`SELECT * FROM users`);
        res.json(users);
    } catch (err) {
        console.error('Fehler beim Laden der Nutzer:', err.message);
        res.status(500).json({ error: 'Fehler beim Laden der Nutzer.' });
    }
});

// API: Alle Maschinen anzeigen
app.get('/api/machines', async (req, res) => {
    try {
        const machines = await dbAll(`SELECT * FROM machines`);
        res.json(machines);
    } catch (err) {
        console.error('Fehler beim Laden der Maschinen:', err.message);
        res.status(500).json({ error: 'Fehler beim Laden der Maschinen.' });
    }
});

// API: Buchung hinzufügen
app.post('/api/admin/addBooking', async (req, res) => {
    const { start, end, userKuerzel, machineName } = req.body;

    try {
        const startTime = dayjs(start);
        const endTime = dayjs(end);

        if (startTime.day() === 0) {
            return res.status(400).json({ error: 'Buchungen an Sonntagen sind nicht erlaubt.' });
        }

        const result = await dbRun(
            `INSERT INTO bookings (start_time, end_time, user_kuerzel, machine_name) VALUES (?, ?, ?, ?)`,
            [start, end, userKuerzel, machineName]
        );

        res.json({ message: 'Buchung erfolgreich hinzugefügt.', bookingId: result.lastID });
    } catch (err) {
        console.error('Fehler beim Hinzufügen der Buchung:', err.message);
        res.status(500).json({ error: 'Fehler beim Hinzufügen der Buchung.' });
    }
});

// API: Buchung löschen
app.delete('/api/user/deleteBooking/:id', async (req, res) => {
    const bookingId = parseInt(req.params.id);

    try {
        const result = await dbRun(`DELETE FROM bookings WHERE id = ?`, [bookingId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Buchung nicht gefunden.' });
        }

        res.json({ message: 'Buchung erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen der Buchung:', err.message);
        res.status(500).json({ error: 'Fehler beim Löschen der Buchung.' });
    }
});

// API: Alle Buchungen anzeigen
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await dbAll(`SELECT * FROM bookings`);
        res.json(bookings);
    } catch (err) {
        console.error('Fehler beim Laden der Buchungen:', err.message);
        res.status(500).json({ error: 'Fehler beim Laden der Buchungen.' });
    }
});

// API: Alle Logs anzeigen
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await dbAll(`SELECT * FROM logs`);
        res.json(logs);
    } catch (err) {
        console.error('Fehler beim Laden der Logs:', err.message);
        res.status(500).json({ error: 'Fehler beim Laden der Logs.' });
    }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
