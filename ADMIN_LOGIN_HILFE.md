# 🔐 Admin-Login Problem beheben

## Problem
Sie können sich nicht mit `admin` / `admin123` in den Admin-Bereich einloggen.

---

## Lösung: Admin-Benutzer erstellen/zurücksetzen

### Schritt 1: Server starten (falls nicht läuft)

```bash
npm start
```

**Wichtig:** Der Server muss mindestens einmal gestartet werden, damit die Datenbank-Tabellen erstellt werden!

### Schritt 2: Admin-Benutzer erstellen/zurücksetzen

In einem **neuen Terminal** (Server weiterlaufen lassen):

```bash
node create-admin.js
```

Das Skript:
- ✅ Erstellt den Admin-Benutzer, falls er nicht existiert
- ✅ Setzt das Passwort zurück, falls der Benutzer existiert
- ✅ Setzt die Rolle auf `admin`

**Ausgabe:**
```
✅ Admin-Benutzer erfolgreich erstellt!
   Username: admin
   Password: admin123
```

### Schritt 3: Einloggen

1. Öffnen Sie: `http://localhost:3000/admin.html`
2. Benutzername: `admin`
3. Passwort: `admin123`
4. Klicken Sie auf "Anmelden"

---

## Alternative: Manuell über SQL

Falls das Skript nicht funktioniert, können Sie den Admin-Benutzer manuell erstellen:

### Option 1: SQLite-Browser verwenden

1. Öffnen Sie `database.db` mit einem SQLite-Browser (z.B. DB Browser for SQLite)
2. Führen Sie folgendes SQL aus:

```sql
-- Prüfen ob Admin existiert
SELECT * FROM users WHERE username = 'admin';

-- Falls nicht vorhanden: Admin erstellen
-- Passwort-Hash für "admin123" (bcrypt, 10 Runden)
-- WICHTIG: Dieser Hash ist nur ein Beispiel! Verwenden Sie das Skript!
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$...', 'admin');

-- Falls vorhanden: Passwort zurücksetzen
-- Verwenden Sie dafür das Skript, da bcrypt-Hashing erforderlich ist!
```

### Option 2: Node.js REPL verwenden

```bash
node
```

Dann im Node.js REPL:

```javascript
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

bcrypt.hash('admin123', 10, (err, hash) => {
  if (err) {
    console.error('Fehler:', err);
    return;
  }
  
  db.run(
    'INSERT OR REPLACE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    ['admin', hash, 'admin'],
    (err) => {
      if (err) {
        console.error('Fehler:', err);
      } else {
        console.log('Admin erstellt!');
      }
      db.close();
    }
  );
});
```

---

## Häufige Probleme

### Problem 1: "Ungültiger Benutzername oder Passwort"

**Ursache:** Admin-Benutzer existiert nicht oder Passwort ist falsch.

**Lösung:**
1. Führen Sie `node create-admin.js` aus
2. Versuchen Sie es erneut

### Problem 2: "Die users-Tabelle existiert nicht"

**Ursache:** Datenbank wurde noch nicht initialisiert.

**Lösung:**
1. Starten Sie den Server: `npm start`
2. Warten Sie, bis der Server vollständig gestartet ist
3. Führen Sie dann `node create-admin.js` aus

### Problem 3: Login funktioniert, aber kein Admin-Zugriff

**Ursache:** Benutzer hat nicht die Rolle `admin`.

**Lösung:**
1. Führen Sie `node create-admin.js` aus (setzt Rolle auf `admin`)
2. Oder manuell in SQLite:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'admin';
   ```

### Problem 4: Session-Problem

**Ursache:** Session-Cookies werden nicht gespeichert.

**Lösung:**
1. Browser-Cache leeren
2. Cookies für `localhost:3000` löschen
3. Seite neu laden
4. Erneut einloggen

---

## Standard-Login-Daten

**Nach dem Ausführen von `create-admin.js`:**

- **Benutzername:** `admin`
- **Passwort:** `admin123`
- **Rolle:** `admin`

⚠️ **WICHTIG:** Ändern Sie das Passwort nach dem ersten Login!

---

## Testen ob Login funktioniert

### Über Browser-Console:

1. Öffnen Sie `http://localhost:3000/admin.html`
2. Öffnen Sie die Browser-Console (F12)
3. Führen Sie aus:

```javascript
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(r => r.json())
.then(data => console.log('Login-Ergebnis:', data))
.catch(err => console.error('Fehler:', err));
```

**Erwartete Ausgabe:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

## Weitere Hilfe

Falls das Problem weiterhin besteht:

1. Prüfen Sie die Server-Logs (Terminal wo `npm start` läuft)
2. Prüfen Sie die Browser-Console (F12)
3. Prüfen Sie ob die Datenbank-Datei `database.db` existiert
4. Prüfen Sie ob der Server auf Port 3000 läuft

---

**Erstellt:** [Aktuelles Datum]  
**Skript:** `create-admin.js`

