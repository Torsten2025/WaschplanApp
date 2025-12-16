# Deployment-Dokumentation - WaschmaschinenApp

## Übersicht

Diese Dokumentation beschreibt den Deployment-Prozess für die Waschmaschinen-Buchungsapp in verschiedenen Umgebungen.

**Version:** 1.0.0  
**Letzte Aktualisierung:** _______________

---

## Voraussetzungen

### System-Anforderungen

- **Node.js:** Version 14 oder höher
- **npm:** Version 6 oder höher
- **Betriebssystem:** Linux, macOS, Windows
- **RAM:** Mindestens 512 MB
- **Festplatte:** Mindestens 100 MB freier Speicher

### Software-Abhängigkeiten

- Express.js 5.2.1+
- SQLite3 5.1.7+
- CORS 2.8.5+

---

## Environment-Variablen

### Übersicht

Die vollständige Liste aller Environment-Variablen finden Sie in `.env.example`.

**Wichtige Variablen:**
- `PORT`: Server-Port (Standard: 3000)
- `NODE_ENV`: Umgebung (development/production)
- `ALLOWED_ORIGIN`: CORS-Origins (siehe unten)
- `SESSION_SECRET`: Secret-Key für Sessions

### Entwicklung (Development)

```bash
NODE_ENV=development
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000
SESSION_SECRET=dev-secret-key
```

**Hinweis:** Wenn `ALLOWED_ORIGIN` nicht gesetzt ist, werden in Development alle Origins (`*`) erlaubt.

### Produktion (Production)

```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGIN=https://ihre-domain.de
SESSION_SECRET=<generierter-sicherer-key>
```

**WICHTIG für Produktion:**
- `ALLOWED_ORIGIN` **MUSS** gesetzt werden auf Ihre tatsächliche Domain
- `SESSION_SECRET` **MUSS** ein sicherer, zufälliger Wert sein
- Generieren Sie einen sicheren Key mit:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Test (Testing)

```bash
NODE_ENV=test
PORT=3001
ALLOWED_ORIGIN=http://localhost:3001
TEST_DB_PATH=./test-waschmaschine.db
```

### CORS-Konfiguration Details

**Mehrere Domains erlauben:**
```bash
ALLOWED_ORIGIN=https://app.example.com,https://admin.example.com
```

**Entwicklung mit mehreren Ports:**
```bash
ALLOWED_ORIGIN=http://localhost:3000,http://localhost:3001
```

---

## Lokales Deployment

### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd WaschmaschinenApp
```

### Schritt 2: Dependencies installieren

```bash
npm install
```

### Schritt 3: Environment-Variablen setzen (optional)

```bash
# .env Datei aus .env.example erstellen
cp .env.example .env

# .env Datei bearbeiten und Werte anpassen
# In Entwicklung können Sie die Standard-Werte verwenden
```

**Oder manuell:**
```bash
# .env Datei erstellen
cat > .env << EOF
NODE_ENV=development
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000
SESSION_SECRET=dev-secret-key
EOF
```

### Schritt 4: Server starten

```bash
npm start
```

### Schritt 5: Verifizierung

```bash
# Server sollte auf http://localhost:3000 laufen
curl http://localhost:3000/api/machines
```

---

## Production Deployment

### Option 1: Traditionelles Deployment (Linux Server)

#### Vorbereitung

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren (falls nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 installieren (Process Manager)
sudo npm install -g pm2
```

#### Deployment-Schritte

1. **Code auf Server kopieren:**
   ```bash
   scp -r WaschmaschinenApp/ user@server:/opt/waschmaschinenapp/
   ```

2. **Auf Server verbinden:**
   ```bash
   ssh user@server
   cd /opt/waschmaschinenapp
   ```

3. **Dependencies installieren:**
   ```bash
   npm install --production
   ```

4. **Environment-Variablen setzen:**
   ```bash
   # .env Datei erstellen
   cp .env.example .env
   
   # .env bearbeiten und Produktions-Werte setzen:
   # NODE_ENV=production
   # PORT=3000
   # ALLOWED_ORIGIN=https://ihre-domain.de
   # SESSION_SECRET=<generierter-sicherer-key>
   
   # Oder als Environment-Variablen exportieren:
   export NODE_ENV=production
   export PORT=3000
   export ALLOWED_ORIGIN=https://ihre-domain.de
   export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

5. **Mit PM2 starten:**
   ```bash
   pm2 start server.js --name waschmaschinenapp
   pm2 save
   pm2 startup
   ```

6. **PM2-Befehle:**
   ```bash
   pm2 list          # Status anzeigen
   pm2 logs          # Logs anzeigen
   pm2 restart all   # Neustart
   pm2 stop all      # Stoppen
   ```

#### Nginx Reverse Proxy (optional)

```nginx
server {
    listen 80;
    server_name ihre-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option 2: Docker Deployment

#### Dockerfile erstellen

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  waschmaschinenapp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ALLOWED_ORIGIN=https://ihre-domain.de
    volumes:
      - ./waschmaschine.db:/app/waschmaschine.db
    restart: unless-stopped
```

#### Deployment

```bash
# Build und Start
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Stoppen
docker-compose down
```

---

### Option 3: Cloud Deployment

#### Heroku

1. **Heroku CLI installieren:**
   ```bash
   npm install -g heroku
   ```

2. **App erstellen:**
   ```bash
   heroku create waschmaschinenapp
   ```

3. **Environment-Variablen setzen:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ALLOWED_ORIGIN=https://waschmaschinenapp.herokuapp.com
   ```

4. **Deployen:**
   ```bash
   git push heroku main
   ```

#### Railway

1. **Railway CLI installieren:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Projekt initialisieren:**
   ```bash
   railway init
   railway up
   ```

#### AWS EC2

1. **EC2-Instance erstellen**
2. **Node.js installieren**
3. **Code deployen** (siehe "Traditionelles Deployment")
4. **Security Groups konfigurieren** (Port 3000 öffnen)

---

## Datenbank-Backup

### Backup erstellen

```bash
# SQLite-Datenbank kopieren
cp waschmaschine.db waschmaschine.db.backup

# Oder mit Timestamp
cp waschmaschine.db "waschmaschine.db.$(date +%Y%m%d_%H%M%S).backup"
```

### Backup wiederherstellen

```bash
# Backup-Datei wiederherstellen
cp waschmaschine.db.backup waschmaschine.db

# Server neu starten
pm2 restart waschmaschinenapp
```

### Automatisches Backup (Cron)

```bash
# Crontab bearbeiten
crontab -e

# Täglich um 2 Uhr morgens
0 2 * * * cp /opt/waschmaschinenapp/waschmaschine.db /opt/waschmaschinenapp/backups/waschmaschine.db.$(date +\%Y\%m\%d).backup
```

---

## Monitoring

### Health-Check Endpoint

```bash
# Health-Check (kann implementiert werden)
curl http://localhost:3000/health
```

### Logs überwachen

```bash
# PM2 Logs
pm2 logs waschmaschinenapp

# Docker Logs
docker-compose logs -f

# System Logs (Linux)
journalctl -u waschmaschinenapp -f
```

### Performance-Monitoring

```bash
# PM2 Monitoring
pm2 monit

# Node.js Performance
node --inspect server.js
```

---

## Troubleshooting-Guide

### Problem 1: Server startet nicht

**Symptome:**
- Port bereits belegt
- Fehler beim Starten

**Lösungen:**
```bash
# Port prüfen
lsof -i :3000

# Port ändern
export PORT=3001
npm start

# Oder in server.js ändern
const PORT = process.env.PORT || 3001;
```

---

### Problem 2: Datenbankfehler

**Symptome:**
- "Fehler beim Öffnen der Datenbank"
- Datenbank-Datei nicht gefunden

**Lösungen:**
```bash
# Datenbank-Datei prüfen
ls -la waschmaschine.db

# Berechtigungen prüfen
chmod 644 waschmaschine.db

# Datenbank neu initialisieren (ACHTUNG: Daten gehen verloren!)
rm waschmaschine.db
npm start
```

---

### Problem 3: CORS-Fehler

**Symptome:**
- "CORS policy blocked"
- Requests von Frontend schlagen fehl
- "Access-Control-Allow-Origin" Fehler in Browser-Konsole

**Lösungen:**

1. **ALLOWED_ORIGIN prüfen:**
   ```bash
   echo $ALLOWED_ORIGIN
   # Oder in .env Datei prüfen
   cat .env | grep ALLOWED_ORIGIN
   ```

2. **CORS für Entwicklung anpassen:**
   ```bash
   # In .env setzen:
   ALLOWED_ORIGIN=http://localhost:3000
   
   # Oder als Environment-Variable:
   export ALLOWED_ORIGIN=http://localhost:3000
   ```

3. **CORS für Produktion anpassen:**
   ```bash
   # In .env setzen (mit Ihrer tatsächlichen Domain):
   ALLOWED_ORIGIN=https://ihre-domain.de
   
   # Mehrere Domains:
   ALLOWED_ORIGIN=https://app.example.com,https://admin.example.com
   ```

4. **Server neu starten:**
   ```bash
   pm2 restart waschmaschinenapp
   # Oder
   npm start
   ```

**WICHTIG:**
- In Produktion **MUSS** `ALLOWED_ORIGIN` auf Ihre tatsächliche Domain gesetzt werden
- Verwenden Sie `https://` in Produktion
- Lassen Sie `ALLOWED_ORIGIN` nicht leer in Produktion (Sicherheitsrisiko!)

---

### Problem 4: Hohe Memory-Nutzung

**Symptome:**
- Server wird langsam
- Memory-Leaks

**Lösungen:**
```bash
# Memory-Usage prüfen
pm2 monit

# Server neu starten
pm2 restart waschmaschinenapp

# Node.js mit Memory-Limit starten
node --max-old-space-size=512 server.js
```

---

### Problem 5: Rate Limiting zu streng

**Symptome:**
- 429 (Too Many Requests) Fehler
- Legitime Requests werden blockiert

**Lösungen:**
```bash
# Rate-Limit-Konfiguration in server.js anpassen
# Oder Environment-Variable setzen
export RATE_LIMIT_WINDOW=60000
export RATE_LIMIT_MAX=100
```

---

## Rollback-Strategie

### Schritt 1: Backup prüfen

```bash
ls -la backups/
```

### Schritt 2: Alte Version deployen

```bash
# Git: Zurück zu vorheriger Version
git checkout <previous-commit>
npm install
pm2 restart waschmaschinenapp
```

### Schritt 3: Datenbank wiederherstellen

```bash
# Backup wiederherstellen
cp backups/waschmaschine.db.backup waschmaschine.db
pm2 restart waschmaschinenapp
```

---

## Deployment-Checkliste

### Vor dem Deployment

- [ ] Code getestet
- [ ] Dependencies aktualisiert (`npm audit`)
- [ ] Environment-Variablen dokumentiert
- [ ] Backup erstellt
- [ ] Deployment-Plan erstellt

### Während des Deployments

- [ ] Dependencies installiert
- [ ] Environment-Variablen gesetzt
- [ ] Server gestartet
- [ ] Health-Check durchgeführt
- [ ] Logs überwacht

### Nach dem Deployment

- [ ] Funktionalität getestet
- [ ] Performance geprüft
- [ ] Monitoring aktiviert
- [ ] Backup-Strategie implementiert
- [ ] Dokumentation aktualisiert

---

## Best Practices

1. **Immer Backups erstellen** vor Deployment
2. **Staging-Umgebung** für Tests verwenden
3. **Blue-Green Deployment** für Zero-Downtime
4. **Monitoring** von Anfang an einrichten
5. **Logs** strukturiert und zentralisiert
6. **Security Updates** regelmäßig einspielen
7. **Documentation** aktuell halten

---

## Support & Kontakt

Bei Problemen:
1. Logs prüfen
2. Troubleshooting-Guide konsultieren
3. GitHub Issues erstellen
4. Team kontaktieren

---

## Referenzen

- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

