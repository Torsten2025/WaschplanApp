# 🚀 Render Deployment Guide - WaschmaschinenApp

**Status:** ✅ Deployment-Ready (mit einigen Anpassungen)

---

## 📋 Voraussetzungen

### ✅ Was bereits funktioniert:
- ✅ Node.js/Express Backend
- ✅ SQLite Datenbank
- ✅ Environment-Variablen konfiguriert
- ✅ CORS-Konfiguration vorhanden
- ✅ Session-Management implementiert
- ✅ Statische Dateien (Frontend) werden serviert

### ⚠️ Was angepasst werden muss:
- ⚠️ Port-Konfiguration (Render setzt PORT automatisch)
- ⚠️ CORS für Render-Domain konfigurieren
- ⚠️ Session-Speicherung (File-Store funktioniert auf Render, aber besser: Memory-Store oder Redis)
- ⚠️ Datenbank-Persistenz (SQLite-Datei muss persistent sein)

---

## 🔧 Schritt-für-Schritt Anleitung

### Schritt 1: Render-Account erstellen

1. Gehen Sie zu [render.com](https://render.com)
2. Erstellen Sie einen Account (kostenlos)
3. Bestätigen Sie Ihre E-Mail

---

### Schritt 2: Neues Web Service erstellen

1. **Dashboard öffnen:** Klicken Sie auf "New +" → "Web Service"
2. **Repository verbinden:**
   - Wenn Code auf GitHub/GitLab: Repository auswählen
   - Oder: "Public Git repository" URL eingeben
3. **Service konfigurieren:**
   - **Name:** `waschmaschinenapp` (oder Ihr gewünschter Name)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (für Tests) oder Starter ($7/Monat für bessere Performance)

---

### Schritt 3: Environment-Variablen setzen

In Render Dashboard → Environment:

```bash
NODE_ENV=production
PORT=10000
ALLOWED_ORIGIN=https://waschmaschinenapp.onrender.com
SESSION_SECRET=<generierter-sicherer-key>
```

**WICHTIG:** 
- `PORT` wird von Render automatisch gesetzt, aber wir setzen es trotzdem als Fallback
- `ALLOWED_ORIGIN` muss Ihre tatsächliche Render-URL sein (wird nach Deployment angezeigt)
- `SESSION_SECRET` generieren mit:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

### Schritt 4: Build & Deploy Settings

**Root Directory:** (leer lassen, wenn Code im Root ist)

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Auto-Deploy:** `Yes` (automatisches Deployment bei Git-Push)

---

### Schritt 5: Disk/Volume für Datenbank (WICHTIG!)

**Problem:** Render's Free Tier löscht Dateien bei jedem Deployment!

**Lösung Option 1: Persistent Disk (Starter Plan)**
1. In Render Dashboard → "Disks" → "Create Disk"
2. Name: `database-disk`
3. Mount Path: `/opt/render/project/src/database`
4. In Code: Datenbank-Pfad anpassen (siehe unten)

**Lösung Option 2: Render PostgreSQL (EMPFOHLEN)**
- Kostenloser PostgreSQL-Service in Render
- Bessere Performance als SQLite
- Automatische Backups
- **ABER:** Code muss angepasst werden (siehe unten)

**Lösung Option 3: Externe SQLite (z.B. S3)**
- SQLite-Datei in S3/Cloud Storage speichern
- Bei Start herunterladen, bei Änderungen hochladen
- Komplex, aber funktioniert mit Free Tier

---

## 🔨 Code-Anpassungen für Render

### 1. Port-Konfiguration (bereits vorhanden ✅)

```javascript
// server.js - Zeile 12
const PORT = process.env.PORT || 3000;
```

✅ **Bereits korrekt!** Render setzt `PORT` automatisch.

---

### 2. Datenbank-Pfad anpassen (für Persistent Disk)

**Aktuell:**
```javascript
const db = new sqlite3.Database('database.db', ...);
```

**Für Render mit Persistent Disk:**
```javascript
const DB_PATH = process.env.DATABASE_PATH || './database.db';
const db = new sqlite3.Database(DB_PATH, ...);
```

**Environment-Variable in Render:**
```bash
DATABASE_PATH=/opt/render/project/src/database/database.db
```

---

### 3. Session-Store anpassen (optional, aber empfohlen)

**Aktuell:** File-Store (funktioniert, aber nicht ideal)

**Besser für Render:**
```javascript
// In server.js - Session-Konfiguration
const session = require('express-session');

// Für Render: Memory-Store verwenden (einfacher)
app.use(session({
  secret: process.env.SESSION_SECRET || 'waschmaschine-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in Produktion
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  },
  // Memory-Store (Standard) - Sessions gehen bei Neustart verloren
  // Für Production: Redis verwenden (kostenlos auf Render verfügbar)
}));
```

**Oder Redis (empfohlen für Production):**
1. In Render: "New +" → "Redis"
2. Redis-URL in Environment-Variablen:
   ```bash
   REDIS_URL=redis://...
   ```
3. Code anpassen (siehe unten)

---

### 4. CORS-Konfiguration (bereits vorhanden ✅)

```javascript
// server.js - Zeile 123-125
const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : (process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : '*');
```

✅ **Bereits korrekt!** Setzen Sie nur `ALLOWED_ORIGIN` in Render.

---

## 📝 Render-spezifische Dateien

### Option 1: render.yaml (empfohlen)

Erstellen Sie `render.yaml` im Root-Verzeichnis:

```yaml
services:
  - type: web
    name: waschmaschinenapp
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: ALLOWED_ORIGIN
        sync: false  # Muss manuell gesetzt werden
      - key: SESSION_SECRET
        generateValue: true  # Render generiert automatisch
    disk:
      name: database-disk
      mountPath: /opt/render/project/src/database
      sizeGB: 1
```

**Hinweis:** `render.yaml` ist optional, aber macht Deployment einfacher.

---

## 🧪 Testing vor Deployment

### Lokal testen mit Render-ähnlicher Umgebung:

```bash
# Environment-Variablen setzen
export NODE_ENV=production
export PORT=10000
export ALLOWED_ORIGIN=http://localhost:10000
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Server starten
npm start

# Testen
curl http://localhost:10000/api/v1/machines
```

---

## 🚨 Bekannte Probleme & Lösungen

### Problem 1: Datenbank geht bei jedem Deployment verloren

**Symptom:** Alle Buchungen verschwinden nach Deployment

**Lösung:**
- ✅ Persistent Disk verwenden (Starter Plan)
- ✅ Oder: PostgreSQL statt SQLite
- ✅ Oder: Datenbank-Backup vor Deployment

---

### Problem 2: Free Tier: App schläft nach 15 Minuten Inaktivität

**Symptom:** Erster Request nach Inaktivität dauert 30-60 Sekunden

**Lösung:**
- ⚠️ Starter Plan ($7/Monat) - App läuft immer
- ⚠️ Oder: Cron-Job der alle 10 Minuten pingt (kostenlos)
- ⚠️ Oder: Externer Monitoring-Service (z.B. UptimeRobot)

---

### Problem 3: CORS-Fehler

**Symptom:** "CORS policy blocked" im Browser

**Lösung:**
1. Prüfen Sie `ALLOWED_ORIGIN` in Render Dashboard
2. Muss exakt Ihre Render-URL sein: `https://waschmaschinenapp.onrender.com`
3. Kein trailing slash!
4. Server neu starten

---

### Problem 4: Sessions funktionieren nicht

**Symptom:** Login funktioniert nicht, Sessions gehen verloren

**Lösung:**
- ✅ `SESSION_SECRET` muss gesetzt sein
- ✅ `secure: true` nur wenn HTTPS (Render hat HTTPS)
- ✅ Cookie-Domain prüfen

---

## 📊 Deployment-Checkliste

### Vor Deployment:
- [ ] Code getestet lokal
- [ ] `render.yaml` erstellt (optional)
- [ ] Environment-Variablen dokumentiert
- [ ] Datenbank-Backup-Strategie geplant
- [ ] CORS-URL bekannt

### Während Deployment:
- [ ] Repository mit Render verbunden
- [ ] Environment-Variablen gesetzt
- [ ] Build erfolgreich
- [ ] Server startet ohne Fehler
- [ ] Health-Check erfolgreich

### Nach Deployment:
- [ ] App erreichbar unter Render-URL
- [ ] API-Endpunkte funktionieren
- [ ] Frontend lädt korrekt
- [ ] Login funktioniert
- [ ] Buchungen können erstellt werden
- [ ] Datenbank persistiert

---

## 🔐 Sicherheits-Checkliste

- [ ] `SESSION_SECRET` ist ein sicherer, zufälliger Wert
- [ ] `ALLOWED_ORIGIN` ist auf Ihre Domain gesetzt (nicht `*`)
- [ ] HTTPS aktiviert (automatisch bei Render)
- [ ] Admin-Passwort geändert (nicht mehr `admin123`)
- [ ] Keine sensiblen Daten im Code (nur in Environment-Variablen)

---

## 📈 Monitoring & Logs

### Render Dashboard:
- **Logs:** Dashboard → Service → "Logs"
- **Metrics:** Dashboard → Service → "Metrics"
- **Events:** Dashboard → Service → "Events"

### Externe Monitoring:
- **UptimeRobot:** Kostenloser Uptime-Monitor
- **Sentry:** Error-Tracking (optional)

---

## 💰 Kosten

### Free Tier:
- ✅ Kostenlos
- ⚠️ App schläft nach 15 Min Inaktivität
- ⚠️ Keine Persistent Disks
- ⚠️ Begrenzte Ressourcen

### Starter Plan ($7/Monat):
- ✅ App läuft immer
- ✅ Persistent Disk verfügbar
- ✅ Bessere Performance
- ✅ Mehr RAM/CPU

---

## 🆘 Support

Bei Problemen:
1. Render Logs prüfen (Dashboard → Logs)
2. Browser-Console prüfen (F12)
3. Network-Tab prüfen (F12 → Network)
4. Render Support kontaktieren

---

## 📚 Nächste Schritte

1. ✅ Code auf GitHub/GitLab pushen
2. ✅ Render-Account erstellen
3. ✅ Web Service erstellen
4. ✅ Environment-Variablen setzen
5. ✅ Deployen
6. ✅ Testen
7. ✅ Monitoring einrichten

---

**Erstellt:** [Aktuelles Datum]  
**Zuletzt aktualisiert:** [Aktuelles Datum]

