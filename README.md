# Waschmaschinen-Buchungsapp

Eine vollständige Web-Anwendung zur Verwaltung von Waschmaschinen- und Trocknungsraum-Buchungen in Mehrfamilienhäusern oder Wohngemeinschaften.

## Features

- **Maschinen-Verwaltung:** Übersicht über verfügbare Waschmaschinen und Trocknungsräume
- **Zeit-Slots:** 6 feste Zeit-Slots pro Tag (08:00-20:00)
- **Buchungsverwaltung:** Einfaches Erstellen und Löschen von Buchungen
- **Datum-Auswahl:** Buchungen für heute und zukünftige Daten
- **Responsive Design:** Funktioniert auf Desktop und Mobile-Geräten
- **RESTful API:** Vollständige API für alle Funktionen

## Technologie-Stack

- **Backend:** Node.js, Express.js
- **Datenbank:** SQLite3
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **API:** RESTful API mit JSON

## Voraussetzungen

- **Node.js:** Version 14 oder höher
- **npm:** Version 6 oder höher

### Installation von Node.js

- **Windows:** [Node.js Download](https://nodejs.org/)
- **macOS:** `brew install node`
- **Linux:** `sudo apt-get install nodejs npm`

## Installation

1. **Repository klonen oder herunterladen:**
   ```bash
   cd WaschmaschinenApp
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

   Dies installiert folgende Pakete:
   - `express` - Web-Framework
   - `sqlite3` - SQLite-Datenbank
   - `cors` - Cross-Origin Resource Sharing
   - `bcrypt` - Passwort-Hashing
   - `express-session` - Session-Management

3. **Environment-Variablen konfigurieren (optional):**
   ```bash
   # Kopieren Sie .env.example zu .env
   cp .env.example .env
   
   # Bearbeiten Sie .env und passen Sie die Werte an
   # In Produktion: Setzen Sie ALLOWED_ORIGIN auf Ihre Domain!
   ```

   **Wichtige Environment-Variablen:**
   - `PORT`: Server-Port (Standard: 3000)
   - `NODE_ENV`: Umgebung (development/production)
   - `ALLOWED_ORIGIN`: Erlaubte CORS-Origins (siehe `.env.example`)
   - `SESSION_SECRET`: Secret-Key für Sessions (in Produktion ändern!)

4. **Server starten:**
   ```bash
   npm start
   ```

   Alternativ:
   ```bash
   node server.js
   ```

5. **Anwendung öffnen:**
   Öffnen Sie `http://localhost:3000` in Ihrem Browser.

## Verwendung

### Server starten

```bash
npm start
```

Der Server läuft standardmäßig auf Port 3000. Sie sehen folgende Ausgabe:

```
Waschmaschinen-Buchungsapp Server läuft auf http://localhost:3000
Datenbank verbunden.
Maschine eingefügt: Waschmaschine 1
Maschine eingefügt: Waschmaschine 2
Maschine eingefügt: Waschmaschine 3
Maschine eingefügt: Trocknungsraum 1
```

### Server stoppen

Drücken Sie `Ctrl+C` im Terminal. Die Datenbankverbindung wird sauber geschlossen.

### Datenbank

Die SQLite-Datenbank wird automatisch als `waschmaschine.db` im Projektverzeichnis erstellt. Bei der ersten Initialisierung werden folgende Maschinen automatisch eingefügt:

- Waschmaschine 1
- Waschmaschine 2
- Waschmaschine 3
- Trocknungsraum 1

### Frontend verwenden

1. Öffnen Sie `http://localhost:3000` im Browser
2. Wählen Sie ein Datum (heute oder später)
3. Wählen Sie eine Maschine
4. Wählen Sie einen Zeit-Slot
5. Geben Sie Ihren Namen ein
6. Klicken Sie auf "Buchen"

### API verwenden

Die API ist unter `http://localhost:3000/api` verfügbar. Siehe [API-Dokumentation](API_DOKUMENTATION.md) für Details.

**Beispiel:**
```bash
# Maschinen abrufen
curl http://localhost:3000/api/machines

# Buchung erstellen
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-12-31",
    "slot": "08:00-10:00",
    "user_name": "Max Mustermann"
  }'
```

## Projektstruktur

```
WaschmaschinenApp/
├── server.js              # Express-Server und API-Routen
├── package.json           # Projekt-Konfiguration und Abhängigkeiten
├── package-lock.json     # Gesperrte Versionsnummern
├── waschmaschine.db       # SQLite-Datenbank (wird automatisch erstellt)
├── public/               # Frontend-Dateien
│   ├── index.html        # Haupt-HTML-Datei
│   ├── css/              # CSS-Dateien
│   │   └── style.css
│   └── js/               # JavaScript-Dateien
│       ├── api.js        # API-Funktionen
│       └── app.js        # Frontend-Logik
├── README.md             # Diese Datei
├── API_DOKUMENTATION.md  # Vollständige API-Dokumentation
├── MANUELLE_TEST_SUITE.md # Test-Cases für manuelle Tests
└── RISIKEN_UND_UNKLARHEITEN.md # Risiken und Unklarheiten
```

## API-Endpunkte

### Maschinen
- `GET /api/machines` - Alle Maschinen abrufen

### Zeit-Slots
- `GET /api/slots` - Alle verfügbaren Zeit-Slots abrufen

### Buchungen
- `GET /api/bookings?date=YYYY-MM-DD` - Buchungen für ein Datum abrufen
- `POST /api/bookings` - Neue Buchung erstellen
- `DELETE /api/bookings/:id` - Buchung löschen

Siehe [API_DOKUMENTATION.md](API_DOKUMENTATION.md) für vollständige Details.

## Verfügbare Zeit-Slots

Die App verwendet folgende feste Zeit-Slots:

- 08:00-10:00
- 10:00-12:00
- 12:00-14:00
- 14:00-16:00
- 16:00-18:00
- 18:00-20:00

## Browser-Kompatibilität

Die App wurde getestet und funktioniert mit:

- ✅ Google Chrome (empfohlen)
- ✅ Mozilla Firefox
- ✅ Safari
- ✅ Mobile Browser (Chrome Mobile, Safari Mobile)

Siehe [MANUELLE_TEST_SUITE.md](MANUELLE_TEST_SUITE.md) für detaillierte Browser-Tests.

## Entwicklung

### Projekt-Scripts

```bash
# Server starten
npm start

# Entwicklung (aktuell identisch mit start)
npm run dev

# Tests (noch nicht implementiert)
npm test
```

### Code-Struktur

- **Backend:** `server.js` enthält alle API-Routen und Datenbank-Logik
- **Frontend:** `public/js/app.js` enthält die Frontend-Logik
- **API-Funktionen:** `public/js/api.js` enthält wiederverwendbare API-Funktionen

### Datenbank-Schema

#### Tabelle: `machines`
```sql
CREATE TABLE machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL
)
```

#### Tabelle: `bookings`
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,
  user_name TEXT NOT NULL,
  FOREIGN KEY (machine_id) REFERENCES machines(id)
)
```

## Testing

### Manuelle Tests

Siehe [MANUELLE_TEST_SUITE.md](MANUELLE_TEST_SUITE.md) für eine vollständige Liste von Test-Cases.

### API-Tests mit curl

```bash
# Maschinen abrufen
curl http://localhost:3000/api/machines

# Slots abrufen
curl http://localhost:3000/api/slots

# Buchungen für Datum abrufen
curl "http://localhost:3000/api/bookings?date=2024-12-31"

# Buchung erstellen
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "date": "2024-12-31",
    "slot": "08:00-10:00",
    "user_name": "Test"
  }'

# Buchung löschen
curl -X DELETE http://localhost:3000/api/bookings/1
```

## Fehlerbehebung

### Server startet nicht

- **Problem:** Port 3000 ist bereits belegt
- **Lösung:** Ändern Sie den Port in `server.js` (Zeile 7: `const PORT = 3000;`)

### Datenbankfehler

- **Problem:** Datenbankdatei ist beschädigt
- **Lösung:** Löschen Sie `waschmaschine.db` und starten Sie den Server neu (Seed-Daten werden automatisch erstellt)

### API-Requests schlagen fehl

- **Problem:** CORS-Fehler
- **Lösung:** 
  - CORS ist bereits aktiviert. Prüfen Sie, ob der Server läuft.
  - In Produktion: Setzen Sie die `ALLOWED_ORIGIN` Environment-Variable auf Ihre Domain
  - Siehe `.env.example` für Konfigurationsbeispiele

### Frontend lädt nicht

- **Problem:** JavaScript-Fehler in der Konsole
- **Lösung:** Öffnen Sie die Browser-Entwicklertools (F12) und prüfen Sie die Fehlermeldungen

## Bekannte Einschränkungen

1. **Zeit-Slots sind fest:** Slots können nicht über die API geändert werden
2. **Keine Maschinen-Verwaltung:** Maschinen können derzeit nicht über die API erstellt/gelöscht werden
3. **Keine Authentifizierung:** Alle Buchungen sind öffentlich
4. **Keine Buchungs-Bearbeitung:** Buchungen können nur erstellt und gelöscht werden

## Zukünftige Verbesserungen

- [ ] Benutzer-Authentifizierung
- [ ] Maschinen-Verwaltung über API
- [ ] Buchungs-Bearbeitung
- [ ] E-Mail-Benachrichtigungen
- [ ] Kalender-Ansicht
- [ ] Statistiken und Auswertungen
- [ ] Automatische Tests
- [ ] Docker-Container

## Dokumentation

- [API-Dokumentation](API_DOKUMENTATION.md) - Vollständige API-Referenz
- [Manuelle Test-Suite](MANUELLE_TEST_SUITE.md) - Test-Cases für manuelle Tests
- [Risiken und Unklarheiten](RISIKEN_UND_UNKLARHEITEN.md) - Bekannte Probleme

## Lizenz

ISC

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie die [Dokumentation](API_DOKUMENTATION.md)
2. Prüfen Sie die [Fehlerbehebung](#fehlerbehebung)
3. Prüfen Sie die [Risiken und Unklarheiten](RISIKEN_UND_UNKLARHEITEN.md)
