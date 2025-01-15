const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const dayjs = require('dayjs');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Excel-Dateipfad
const excelPath = path.join(__dirname, 'waschplan_daten.xlsx');

// Hilfsfunktion: Excel initialisieren
function initializeExcel() {
    if (!fs.existsSync(excelPath)) {
        console.log('Excel-Datei nicht gefunden. Erstelle eine neue Datei.');
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([]), 'Users');
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([]), 'Machines');
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([]), 'Bookings');
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([]), 'Logs');
        xlsx.writeFile(workbook, excelPath);
    }
}

// Hilfsfunktion: Excel laden
function loadExcel() {
    const workbook = xlsx.readFile(excelPath);
    return {
        workbook,
        users: xlsx.utils.sheet_to_json(workbook.Sheets['Users'] || []),
        machines: xlsx.utils.sheet_to_json(workbook.Sheets['Machines'] || []),
        bookings: xlsx.utils.sheet_to_json(workbook.Sheets['Bookings'] || []),
        logs: xlsx.utils.sheet_to_json(workbook.Sheets['Logs'] || []),
    };
}

// Hilfsfunktion: Excel speichern
function saveExcel(workbook) {
    xlsx.writeFile(workbook, excelPath);
}

// Excel initialisieren
initializeExcel();

// API: Login
app.post('/api/login', (req, res) => {
    const { kuerzel, password } = req.body;
    const { users } = loadExcel();

    const user = users.find(user => user.Kuerzel === kuerzel);

    if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    if (kuerzel === 'Admin' && password === 'Admin') {
        return res.json({ message: 'Login erfolgreich', role: 'admin', kuerzel });
    } else if (!password && kuerzel !== 'Admin') {
        return res.json({ message: 'Login erfolgreich', role: 'user', kuerzel, userId: user.ID });
    } else {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    }
});

// API: Nutzer hinzufügen
app.post('/api/admin/addUser', (req, res) => {
    const { kuerzel } = req.body;

    if (!kuerzel) {
        return res.status(400).json({ error: 'Kürzel ist erforderlich.' });
    }

    try {
        const { workbook, users } = loadExcel();
        const newID = users.length > 0 ? Math.max(...users.map(user => user.ID)) + 1 : 1;

        const newUser = { ID: newID, Kuerzel: kuerzel };
        users.push(newUser);

        workbook.Sheets['Users'] = xlsx.utils.json_to_sheet(users);
        saveExcel(workbook);

        res.json({ message: 'Nutzer erfolgreich hinzugefügt.', user: newUser });
    } catch (err) {
        console.error('Fehler beim Hinzufügen des Nutzers:', err);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Nutzers.' });
    }
});

// Nutzer bearbeiten
app.put('/api/admin/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { kuerzel } = req.body;

    try {
        const { workbook, users } = loadExcel();
        const userIndex = users.findIndex(user => user.ID === userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
        }

        if (!kuerzel) {
            return res.status(400).json({ error: 'Kürzel darf nicht leer sein.' });
        }

        users[userIndex].Kuerzel = kuerzel;
        workbook.Sheets['Users'] = xlsx.utils.json_to_sheet(users);
        saveExcel(workbook);

        res.json({ message: 'Nutzer erfolgreich bearbeitet.', user: users[userIndex] });
    } catch (err) {
        console.error('Fehler beim Bearbeiten des Nutzers:', err);
        res.status(500).json({ error: 'Fehler beim Bearbeiten des Nutzers.' });
    }
});

// Nutzer löschen
app.delete('/api/admin/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const { workbook, users } = loadExcel();
        const updatedUsers = users.filter(user => user.ID !== userId);

        if (updatedUsers.length === users.length) {
            return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
        }

        workbook.Sheets['Users'] = xlsx.utils.json_to_sheet(updatedUsers);
        saveExcel(workbook);

        res.json({ message: 'Nutzer erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen des Nutzers:', err);
        res.status(500).json({ error: 'Fehler beim Löschen des Nutzers.' });
    }
});

// API: Maschine hinzufügen
app.post('/api/admin/addMachine', (req, res) => {
    const { name, type } = req.body;

    if (!name || !type) {
        return res.status(400).json({ error: 'Name und Typ sind erforderlich.' });
    }

    try {
        const { workbook, machines } = loadExcel();
        const newID = machines.length > 0 ? Math.max(...machines.map(machine => machine.ID)) + 1 : 1;

        const newMachine = { ID: newID, Name: name, Typ: type };
        machines.push(newMachine);

        workbook.Sheets['Machines'] = xlsx.utils.json_to_sheet(machines);
        saveExcel(workbook);

        res.json({ message: 'Maschine erfolgreich hinzugefügt.', machine: newMachine });
    } catch (err) {
        console.error('Fehler beim Hinzufügen der Maschine:', err);
        res.status(500).json({ error: 'Fehler beim Hinzufügen der Maschine.' });
    }
});

// Maschine bearbeiten
app.put('/api/admin/machines/:id', (req, res) => {
    const machineId = parseInt(req.params.id);
    const { name, type } = req.body;

    try {
        const { workbook, machines } = loadExcel();
        const machineIndex = machines.findIndex(machine => machine.ID === machineId);

        if (machineIndex === -1) {
            return res.status(404).json({ error: 'Maschine nicht gefunden.' });
        }

        if (!name || !type) {
            return res.status(400).json({ error: 'Name und Typ sind erforderlich.' });
        }

        machines[machineIndex].Name = name;
        machines[machineIndex].Typ = type;
        workbook.Sheets['Machines'] = xlsx.utils.json_to_sheet(machines);
        saveExcel(workbook);

        res.json({ message: 'Maschine erfolgreich bearbeitet.', machine: machines[machineIndex] });
    } catch (err) {
        console.error('Fehler beim Bearbeiten der Maschine:', err);
        res.status(500).json({ error: 'Fehler beim Bearbeiten der Maschine.' });
    }
});

// Maschine löschen
app.delete('/api/admin/machines/:id', (req, res) => {
    const machineId = parseInt(req.params.id);

    try {
        const { workbook, machines } = loadExcel();
        const updatedMachines = machines.filter(machine => machine.ID !== machineId);

        if (updatedMachines.length === machines.length) {
            return res.status(404).json({ error: 'Maschine nicht gefunden.' });
        }

        workbook.Sheets['Machines'] = xlsx.utils.json_to_sheet(updatedMachines);
        saveExcel(workbook);

        res.json({ message: 'Maschine erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen der Maschine:', err);
        res.status(500).json({ error: 'Fehler beim Löschen der Maschine.' });
    }
});

// API: Alle Nutzer anzeigen
app.get('/api/admin/users', (req, res) => {
    try {
        const { users } = loadExcel();
        res.json(users);
    } catch (err) {
        console.error('Fehler beim Laden der Nutzer:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Nutzer.' });
    }
});

// API: Alle Maschinen anzeigen (bereits vorhanden, aber um Konsistenz zu gewährleisten, belassen wir sie hier)
app.get('/api/admin/machines', (req, res) => {
    try {
        const { machines } = loadExcel();
        res.json(machines);
    } catch (err) {
        console.error('Fehler beim Laden der Maschinen:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Maschinen.' });
    }
});

// API: Alle Reservierungen anzeigen
app.get('/api/admin/reservations', (req, res) => {
    try {
        const { bookings } = loadExcel();
        res.json(bookings);
    } catch (err) {
        console.error('Fehler beim Laden der Reservierungen:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Reservierungen.' });
    }
});

// API: Alle Logs anzeigen
app.get('/api/logs', (req, res) => {
    try {
        const { logs } = loadExcel();
        res.json(logs);
    } catch (err) {
        console.error('Fehler beim Laden der Logs:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Logs.' });
    }
});

// API: Neues Log hinzufügen
app.post('/api/logs', (req, res) => {
    const { machineId, description, status } = req.body;

    if (!machineId || !description) {
        return res.status(400).json({ error: 'Maschinen-ID und Beschreibung sind erforderlich.' });
    }

    try {
        const { workbook, logs } = loadExcel();
        const newLog = {
            ID: logs.length > 0 ? Math.max(...logs.map(log => log.ID)) + 1 : 1,
            MachineID: machineId,
            Datum: new Date().toISOString(),
            Beschreibung: description,
            Status: status || 'Offen',
        };

        logs.push(newLog);
        workbook.Sheets['Logs'] = xlsx.utils.json_to_sheet(logs);
        saveExcel(workbook);

        res.json({ message: 'Log erfolgreich hinzugefügt.', log: newLog });
    } catch (err) {
        console.error('Fehler beim Hinzufügen des Logs:', err);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Logs.' });
    }
});

// API: Nutzer löschen
app.delete('/api/admin/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const { workbook, users } = loadExcel();
        const updatedUsers = users.filter(user => user.ID !== userId);

        if (updatedUsers.length === users.length) {
            return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
        }

        workbook.Sheets['Users'] = xlsx.utils.json_to_sheet(updatedUsers);
        saveExcel(workbook);

        res.json({ message: 'Nutzer erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen des Nutzers:', err);
        res.status(500).json({ error: 'Fehler beim Löschen des Nutzers.' });
    }
});

// API: Maschine löschen
app.delete('/api/admin/machines/:id', (req, res) => {
    const machineId = parseInt(req.params.id);

    try {
        const { workbook, machines } = loadExcel();
        const updatedMachines = machines.filter(machine => machine.ID !== machineId);

        if (updatedMachines.length === machines.length) {
            return res.status(404).json({ error: 'Maschine nicht gefunden.' });
        }

        workbook.Sheets['Machines'] = xlsx.utils.json_to_sheet(updatedMachines);
        saveExcel(workbook);

        res.json({ message: 'Maschine erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen der Maschine:', err);
        res.status(500).json({ error: 'Fehler beim Löschen der Maschine.' });
    }
});

// API: Alle Maschinen anzeigen
app.get('/api/machines', (req, res) => {
    try {
        const { machines } = loadExcel();
        res.json(machines);
    } catch (err) {
        console.error('Fehler beim Laden der Maschinen:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Maschinen.' });
    }
});

// API: Alle Buchungen anzeigen
app.get('/api/bookings', (req, res) => {
    try {
        const { bookings } = loadExcel();
        res.json(bookings);
    } catch (err) {
        console.error('Fehler beim Laden der Buchungen:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Buchungen.' });
    }
});

// API: Buchung hinzufügen
app.post('/api/admin/addBooking', (req, res) => {
	console.log("Request erhalten für /api/admin/addBooking:", req.body);
    const { start, end, userKuerzel, machineName } = req.body;

    try {
        const { workbook, bookings } = loadExcel();
        const startTime = dayjs(start);
        const endTime = dayjs(end);

        // Regel: Kein Waschen an Sonntagen
        if (startTime.day() === 0) {
            return res.status(400).json({ error: 'Buchungen an Sonntagen sind nicht erlaubt.' });
        }

        // Fortsetzung der Logik (ohne Änderungen)
        const newID = bookings.length > 0 ? Math.max(...bookings.map(b => b.ID)) + 1 : 1;
        const newBooking = {
            ID: newID,
            Startzeit: start,
            Endzeit: end,
            UserKuerzel: userKuerzel,
            MachineName: machineName,
        };

        bookings.push(newBooking);
        workbook.Sheets['Bookings'] = xlsx.utils.json_to_sheet(bookings);
        saveExcel(workbook);

        res.json({ message: 'Buchung erfolgreich hinzugefügt.' });
    } catch (err) {
        console.error('Fehler beim Hinzufügen der Buchung:', err);
        res.status(500).json({ error: 'Fehler beim Hinzufügen der Buchung.' });
    }
});

// Reservierung bearbeiten
app.put('/api/admin/reservations/:id', (req, res) => {
    const bookingId = parseInt(req.params.id);
    const { start, end, machineName, userKuerzel } = req.body;

    try {
        const { workbook, bookings } = loadExcel();
        const bookingIndex = bookings.findIndex(booking => booking.ID === bookingId);

        if (bookingIndex === -1) {
            return res.status(404).json({ error: 'Reservierung nicht gefunden.' });
        }

        bookings[bookingIndex] = {
            ...bookings[bookingIndex],
            Startzeit: start || bookings[bookingIndex].Startzeit,
            Endzeit: end || bookings[bookingIndex].Endzeit,
            MachineName: machineName || bookings[bookingIndex].MachineName,
            UserKuerzel: userKuerzel || bookings[bookingIndex].UserKuerzel,
        };

        workbook.Sheets['Bookings'] = xlsx.utils.json_to_sheet(bookings);
        saveExcel(workbook);

        res.json({ message: 'Reservierung erfolgreich bearbeitet.', booking: bookings[bookingIndex] });
    } catch (err) {
        console.error('Fehler beim Bearbeiten der Reservierung:', err);
        res.status(500).json({ error: 'Fehler beim Bearbeiten der Reservierung.' });
    }
});

// Reservierung löschen
// API: Buchung löschen (für Nutzer)
app.delete('/api/user/deleteBooking/:id', (req, res) => {
    const bookingId = parseInt(req.params.id);

    try {
        const { workbook, bookings } = loadExcel();
        const updatedBookings = bookings.filter((booking) => booking.ID !== bookingId);

        if (updatedBookings.length === bookings.length) {
            return res.status(404).json({ error: 'Buchung nicht gefunden.' });
        }

        workbook.Sheets['Bookings'] = xlsx.utils.json_to_sheet(updatedBookings);
        saveExcel(workbook);

        res.json({ message: 'Buchung erfolgreich gelöscht.' });
    } catch (err) {
        console.error('Fehler beim Löschen der Buchung:', err);
        res.status(500).json({ error: 'Fehler beim Löschen der Buchung.' });
    }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
