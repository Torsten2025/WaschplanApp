// Liste der API-Routen (Schreibweisenübersicht):
//   1. /api/admin/users (GET): Alle Nutzer abrufen
//   2. /api/admin/addUser (POST): Neuen Nutzer hinzufügen
//   3. /api/admin/users/:id (PUT): Nutzer bearbeiten
//   4. /api/admin/users/:id (DELETE): Nutzer löschen
//   5. /api/admin/machines (GET): Alle Maschinen abrufen
//   6. /api/admin/addMachine (POST): Neue Maschine hinzufügen
//   7. /api/admin/machines/:id (PUT): Maschine bearbeiten
//   8. /api/admin/machines/:id (DELETE): Maschine löschen
//   9. /api/bookings (GET): Alle Buchungen abrufen
//  10. /api/admin/addBooking (POST): Neue Buchung erstellen
//  11. /api/user/deleteBooking/:id (DELETE): Buchung stornieren
//  12. /api/logs (GET): Alle Logs abrufen
//  13. /api/logs/:machineId (GET): Logs einer bestimmten Maschine abrufen

// Liste der Funktionen (Schreibweisenübersicht):
//  1. dbGet(sql, params): Führt eine SQLite-Abfrage aus und gibt eine einzelne Zeile zurück.
//  2. dbAll(sql, params): Führt eine SQLite-Abfrage aus und gibt alle Zeilen zurück.
//  3. dbRun(sql, params): Führt eine SQLite-Abfrage aus, die keine Rückgabe benötigt.
//  4. app.get("/api/admin/users"): Ruft alle Nutzer aus der Datenbank ab.
//  5. app.post("/api/admin/addUser"): Fügt einen neuen Nutzer zur Datenbank hinzu.
//  6. app.put("/api/admin/users/:id"): Bearbeitet einen bestehenden Nutzer.
//  7. app.delete("/api/admin/users/:id"): Löscht einen Nutzer aus der Datenbank.
//  8. app.get("/api/admin/machines"): Ruft alle Maschinen aus der Datenbank ab.
//  9. app.post("/api/admin/addMachine"): Fügt eine neue Maschine zur Datenbank hinzu.
// 10. app.put("/api/admin/machines/:id"): Bearbeitet eine bestehende Maschine.
// 11. app.delete("/api/admin/machines/:id"): Löscht eine Maschine aus der Datenbank.
// 12. app.get("/api/bookings"): Ruft alle Buchungen aus der Datenbank ab.
// 13. app.post("/api/admin/addBooking"): Fügt eine neue Buchung zur Datenbank hinzu.
// 14. app.delete("/api/user/deleteBooking/:id"): Storniert eine Buchung.
// 15. app.get("/api/logs"): Ruft alle Logs aus der Datenbank ab.
// 16. app.get("/api/logs/:machineId"): Ruft Logs einer bestimmten Maschine ab.
// 17. app.post("/api/login"): Behandelt den Login von Nutzern.

const express = require("express");
const path = require("path");
const dayjs = require("dayjs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, "public")));

// SQLite einrichten
const dbPath = path.resolve("/data", "waschplan.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Fehler beim Verbinden mit SQLite:", err.message);
    } else {
        console.log(`SQLite-Datenbank erfolgreich verbunden: ${dbPath}`);
        initializeDatabase();
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

// Datenbankinitialisierung
function initializeDatabase() {
    const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kuerzel TEXT NOT NULL UNIQUE
    );`;

    const createMachinesTable = `CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL
    );`;

    const createBookingsTable = `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        user_kuerzel TEXT NOT NULL,
        machine_name TEXT NOT NULL,
        FOREIGN KEY(user_kuerzel) REFERENCES users(kuerzel),
        FOREIGN KEY(machine_name) REFERENCES machines(name)
    );`;

    const createLogsTable = `CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        datum TEXT NOT NULL,
        beschreibung TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY(machine_id) REFERENCES machines(id)
    );`;

    db.run(createUsersTable, (err) => {
        if (err) console.error("Fehler beim Erstellen der Tabelle users:", err.message);
    });

    db.run(createMachinesTable, (err) => {
        if (err) console.error("Fehler beim Erstellen der Tabelle machines:", err.message);
    });

    db.run(createBookingsTable, (err) => {
        if (err) console.error("Fehler beim Erstellen der Tabelle bookings:", err.message);
    });

    db.run(createLogsTable, (err) => {
        if (err) console.error("Fehler beim Erstellen der Tabelle logs:", err.message);
    });
}
// API 1: Alle Nutzer abrufen
app.get("/api/admin/users", async (req, res) => {
    try {
        const users = await dbAll("SELECT * FROM users");
        res.json(users);
    } catch (err) {
        console.error("Fehler beim Laden der Nutzer:", err);
        res.status(500).json({ error: "Fehler beim Laden der Nutzer." });
    }
});

// API 2: Neuen Nutzer hinzufügen
app.post("/api/admin/addUser", async (req, res) => {
    const { kuerzel } = req.body;
    if (!kuerzel) {
        return res.status(400).json({ error: "Kürzel ist erforderlich." });
    }
    try {
        const result = await dbRun("INSERT INTO users (kuerzel) VALUES (?)", [kuerzel]);
        res.json({ message: "Nutzer erfolgreich hinzugefügt.", userId: result.lastID });
    } catch (err) {
        console.error("Fehler beim Hinzufügen des Nutzers:", err);
        res.status(500).json({ error: "Fehler beim Hinzufügen des Nutzers." });
    }
});

// API 3: Nutzer bearbeiten
app.put("/api/admin/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const { kuerzel } = req.body;
    if (!kuerzel) {
        return res.status(400).json({ error: "Kürzel ist erforderlich." });
    }
    try {
        const result = await dbRun("UPDATE users SET kuerzel = ? WHERE id = ?", [kuerzel, userId]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Nutzer nicht gefunden." });
        }
        res.json({ message: "Nutzer erfolgreich bearbeitet." });
    } catch (err) {
        console.error("Fehler beim Bearbeiten des Nutzers:", err);
        res.status(500).json({ error: "Fehler beim Bearbeiten des Nutzers." });
    }
});

// API 4: Nutzer löschen
app.delete("/api/admin/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        const result = await dbRun("DELETE FROM users WHERE id = ?", [userId]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Nutzer nicht gefunden." });
        }
        res.json({ message: "Nutzer erfolgreich gelöscht." });
    } catch (err) {
        console.error("Fehler beim Löschen des Nutzers:", err);
        res.status(500).json({ error: "Fehler beim Löschen des Nutzers." });
    }
});

// API 5: Alle Maschinen abrufen
app.get("/api/admin/machines", async (req, res) => {
    console.log("Route /api/admin/machines aufgerufen.");
    try {
        const machines = await dbAll("SELECT * FROM machines");
        res.json(machines);
    } catch (err) {
        console.error("Fehler beim Laden der Maschinen:", err);
        res.status(500).json({ error: "Fehler beim Laden der Maschinen." });
    }
});

// API 6: Neue Maschine hinzufügen
app.post("/api/admin/addMachine", async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: "Name und Typ sind erforderlich." });
    }
    try {
        const result = await dbRun("INSERT INTO machines (name, type) VALUES (?, ?)", [name, type]);
        res.json({ message: "Maschine erfolgreich hinzugefügt.", machineId: result.lastID });
    } catch (err) {
        console.error("Fehler beim Hinzufügen der Maschine:", err);
        res.status(500).json({ error: "Fehler beim Hinzufügen der Maschine." });
    }
});

// API 7: Maschine bearbeiten
app.put("/api/admin/machines/:id", async (req, res) => {
    const machineId = parseInt(req.params.id);
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: "Name und Typ sind erforderlich." });
    }
    try {
        const result = await dbRun("UPDATE machines SET name = ?, type = ? WHERE id = ?", [name, type, machineId]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Maschine nicht gefunden." });
        }
        res.json({ message: "Maschine erfolgreich bearbeitet." });
    } catch (err) {
        console.error("Fehler beim Bearbeiten der Maschine:", err);
        res.status(500).json({ error: "Fehler beim Bearbeiten der Maschine." });
    }
});

// API 8: Maschine löschen
app.delete("/api/admin/machines/:id", async (req, res) => {
    const machineId = parseInt(req.params.id);
    try {
        const result = await dbRun("DELETE FROM machines WHERE id = ?", [machineId]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Maschine nicht gefunden." });
        }
        res.json({ message: "Maschine erfolgreich gelöscht." });
    } catch (err) {
        console.error("Fehler beim Löschen der Maschine:", err);
        res.status(500).json({ error: "Fehler beim Löschen der Maschine." });
    }
});

// API 9: Alle Buchungen abrufen
app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await dbAll("SELECT * FROM bookings");
        res.json(bookings);
    } catch (err) {
        console.error("Fehler beim Laden der Buchungen:", err);
        res.status(500).json({ error: "Fehler beim Laden der Buchungen." });
    }
});

// API 10: Neue Buchung erstellen
app.post("/api/admin/addBooking", async (req, res) => {
    const { start, end, userKuerzel, machineName } = req.body;
    if (!start || !end || !userKuerzel || !machineName) {
        return res.status(400).json({ error: "Alle Felder sind erforderlich." });
    }
    try {
        const result = await dbRun(
            "INSERT INTO bookings (start_time, end_time, user_kuerzel, machine_name) VALUES (?, ?, ?, ?)",
            [start, end, userKuerzel, machineName]
        );
        res.json({ message: "Buchung erfolgreich hinzugefügt.", bookingId: result.lastID });
    } catch (err) {
        console.error("Fehler beim Hinzufügen der Buchung:", err);
        res.status(500).json({ error: "Fehler beim Hinzufügen der Buchung." });
    }
});

// API 11: Buchung stornieren
app.delete("/api/user/deleteBooking/:id", async (req, res) => {
    const bookingId = parseInt(req.params.id);
    try {
        const result = await dbRun("DELETE FROM bookings WHERE id = ?", [bookingId]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Buchung nicht gefunden." });
        }
        res.json({ message: "Buchung erfolgreich storniert." });
    } catch (err) {
        console.error("Fehler beim Stornieren der Buchung:", err);
        res.status(500).json({ error: "Fehler beim Stornieren der Buchung." });
    }
});

// API 12: Alle Logs abrufen
app.get("/api/logs", async (req, res) => {
    try {
        const logs = await dbAll("SELECT * FROM logs");
        res.json(logs);
    } catch (err) {
        console.error("Fehler beim Laden der Logs:", err);
        res.status(500).json({ error: "Fehler beim Laden der Logs." });
    }
});

// API 13: Logs einer bestimmten Maschine abrufen
app.get("/api/logs/:machineId", async (req, res) => {
    const machineId = parseInt(req.params.machineId);
    try {
        const logs = await dbAll("SELECT * FROM logs WHERE machine_id = ?", [machineId]);
        res.json(logs);
    } catch (err) {
        console.error("Fehler beim Laden der Logs für die Maschine:", err);
        res.status(500).json({ error: "Fehler beim Laden der Logs für die Maschine." });
    }
});

// 17. app.post("/api/login"): Behandelt den Login von Nutzern.
app.post('/api/login', async (req, res) => {
    const { kuerzel, password } = req.body;

    try {
        const user = await dbGet('SELECT * FROM users WHERE kuerzel = ?', [kuerzel]);

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

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
