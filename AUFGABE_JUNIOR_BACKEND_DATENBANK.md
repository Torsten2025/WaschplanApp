# 🗄️ Aufgabe: Datenbank-Backup & Persistenz sicherstellen

**Zugewiesen an:** Junior Backend Entwickler  
**Priorität:** 🔴 KRITISCH (blockiert Deployment)  
**Geschätzte Zeit:** 2-3 Stunden  
**Status:** ⏳ Offen

---

## 📋 Aufgaben-Übersicht

### 1. Datenbank-Backup testen
### 2. Datenbank-Initialisierung robust machen
### 3. Datenbank-Migrationen prüfen

---

## 🎯 Aufgabe 1: Datenbank-Backup testen

### Problem:
- Backup-Endpunkte existieren, aber wurden nicht vollständig getestet
- Muss für Render Deployment funktionieren

### Aufgaben:

#### 1.1 Backup-Endpunkt testen
**Endpunkt:** `POST /api/v1/admin/backup`

**Test-Szenarien:**
- [ ] Backup kann erstellt werden (als Admin eingeloggt)
- [ ] Backup-Datei wird im `backups/` Verzeichnis erstellt
- [ ] Backup-Datei hat korrekten Namen (Timestamp)
- [ ] Response enthält Backup-Informationen
- [ ] Backup schlägt fehl wenn nicht als Admin eingeloggt

**Code-Stellen:**
- `server.js` - Backup-Endpunkt (Zeile ~2440+)

**Test-Commands:**
```bash
# Als Admin eingeloggt:
curl -X POST http://localhost:3000/api/v1/admin/backup \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json"

# Prüfen ob Backup-Datei erstellt wurde:
ls -la backups/
```

#### 1.2 Wiederherstellungs-Endpunkt testen
**Endpunkt:** `POST /api/v1/admin/restore`

**Test-Szenarien:**
- [ ] Backup kann wiederhergestellt werden (als Admin eingeloggt)
- [ ] Datenbank wird korrekt wiederhergestellt
- [ ] Alte Daten werden überschrieben
- [ ] Response enthält Wiederherstellungs-Informationen
- [ ] Wiederherstellung schlägt fehl wenn nicht als Admin eingeloggt
- [ ] Wiederherstellung schlägt fehl wenn Backup-Datei nicht existiert

**Code-Stellen:**
- `server.js` - Restore-Endpunkt (Zeile ~2600+)

**Test-Commands:**
```bash
# Backup erstellen
curl -X POST http://localhost:3000/api/v1/admin/backup

# Backup wiederherstellen
curl -X POST http://localhost:3000/api/v1/admin/restore \
  -H "Content-Type: application/json" \
  -d '{"backupName": "backup_20240101_120000.db"}'
```

#### 1.3 Backup-Verzeichnis prüfen
- [ ] Backup-Verzeichnis wird automatisch erstellt
- [ ] Backup-Dateien haben korrekte Berechtigungen
- [ ] Alte Backups werden nicht automatisch gelöscht (kann später optimiert werden)

**Code-Stellen:**
- `server.js` - Backup-Verzeichnis-Erstellung (Zeile ~2440+)

---

## 🎯 Aufgabe 2: Datenbank-Initialisierung robust machen

### Problem:
- `initDatabase()` muss bei jedem Start korrekt laufen
- Admin-Benutzer muss korrekt erstellt werden
- Seed-Daten müssen korrekt eingefügt werden

### Aufgaben:

#### 2.1 initDatabase() testen
**Test-Szenarien:**
- [ ] Datenbank wird bei erstem Start korrekt initialisiert
- [ ] Tabellen werden erstellt (machines, bookings, users)
- [ ] Indizes werden erstellt
- [ ] Foreign Keys sind aktiviert
- [ ] Initialisierung schlägt nicht fehl wenn Tabellen bereits existieren

**Code-Stellen:**
- `server.js` - `initDatabase()` (Zeile ~549)

**Test-Commands:**
```bash
# Datenbank löschen und neu starten
rm database.db
npm start

# Prüfen ob Tabellen erstellt wurden (mit SQLite-Browser oder SQL)
```

#### 2.2 Admin-Benutzer-Erstellung testen
**Test-Szenarien:**
- [ ] Admin-Benutzer wird erstellt wenn users-Tabelle leer ist
- [ ] Admin-Benutzer wird NICHT erstellt wenn bereits Benutzer existieren
- [ ] Admin-Benutzer hat korrekte Rolle ('admin')
- [ ] Passwort ist korrekt gehasht (bcrypt)
- [ ] Login funktioniert mit Standard-Credentials (admin/admin123)

**Code-Stellen:**
- `server.js` - Admin-Benutzer-Erstellung (Zeile ~720)

**Test-Commands:**
```bash
# Datenbank löschen und neu starten
rm database.db
npm start

# Prüfen ob Admin erstellt wurde:
# (mit SQLite-Browser oder create-admin.js Skript)
node create-admin.js
```

#### 2.3 Seed-Daten testen
**Test-Szenarien:**
- [ ] Maschinen werden korrekt eingefügt (3 Waschmaschinen, 1 Trockner)
- [ ] Seed-Daten werden NICHT doppelt eingefügt
- [ ] Seed-Daten haben korrekte Werte

**Code-Stellen:**
- `server.js` - Maschinen-Seed-Daten (Zeile ~650+)

---

## 🎯 Aufgabe 3: Datenbank-Migrationen prüfen

### Problem:
- Migrationen existieren, aber müssen getestet werden
- Schema-Version muss korrekt verwaltet werden

### Aufgaben:

#### 3.1 Migrationen testen
**Test-Szenarien:**
- [ ] Migrationen werden bei Server-Start ausgeführt
- [ ] Schema-Version wird korrekt gespeichert
- [ ] Migrationen werden nur einmal ausgeführt
- [ ] Migrationen können mit existierender Datenbank ausgeführt werden

**Code-Stellen:**
- `server.js` - Migrationen (Zeile ~2800+)

**Test-Commands:**
```bash
# Migrationen manuell testen (falls möglich)
# Oder: Datenbank-Version prüfen
curl http://localhost:3000/api/migrations/version
```

---

## ✅ Abnahmekriterien

### Backup & Restore:
- [ ] Backup kann erstellt werden
- [ ] Backup kann wiederhergestellt werden
- [ ] Backup-Dateien werden korrekt erstellt
- [ ] Fehlerbehandlung funktioniert

### Datenbank-Initialisierung:
- [ ] Datenbank wird bei jedem Start korrekt initialisiert
- [ ] Admin-Benutzer wird korrekt erstellt
- [ ] Seed-Daten werden korrekt eingefügt
- [ ] Keine Fehler bei wiederholtem Start

### Migrationen:
- [ ] Migrationen funktionieren korrekt
- [ ] Schema-Version wird korrekt verwaltet
- [ ] Migrationen können mit existierender Datenbank ausgeführt werden

---

## 📝 Code-Stellen zum Prüfen

1. **Backup-Endpunkt:**
   - `server.js` - Zeile ~2440+
   - `POST /api/v1/admin/backup`

2. **Restore-Endpunkt:**
   - `server.js` - Zeile ~2600+
   - `POST /api/v1/admin/restore`

3. **Datenbank-Initialisierung:**
   - `server.js` - `initDatabase()` (Zeile ~549)
   - `server.js` - Admin-Benutzer-Erstellung (Zeile ~720)

4. **Migrationen:**
   - `server.js` - Migrationen (Zeile ~2800+)

---

## 🧪 Test-Plan

### 1. Lokale Tests:
```bash
# Server starten
npm start

# Backup erstellen
curl -X POST http://localhost:3000/api/v1/admin/backup \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json"

# Backup wiederherstellen
curl -X POST http://localhost:3000/api/v1/admin/restore \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json" \
  -d '{"backupName": "backup_20240101_120000.db"}'
```

### 2. Datenbank-Initialisierung testen:
```bash
# Datenbank löschen
rm database.db

# Server starten
npm start

# Prüfen ob Admin erstellt wurde
node create-admin.js
```

---

## 📚 Referenzen

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Express Session](https://github.com/expressjs/session)
- Backup-Endpunkt: `server.js` Zeile ~2440+
- Restore-Endpunkt: `server.js` Zeile ~2600+

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Offen  
**Zuletzt aktualisiert:** [Aktuelles Datum]

