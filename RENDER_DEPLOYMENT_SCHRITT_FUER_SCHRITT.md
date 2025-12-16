# 🚀 Render Deployment - Schritt für Schritt Anleitung

**Für:** WaschmaschinenApp  
**Platform:** Render.com  
**Dauer:** ~15-20 Minuten

---

## 📋 Vorbereitung

### Schritt 0: Code auf GitHub/GitLab pushen (falls noch nicht geschehen)

**Falls Code noch nicht auf GitHub/GitLab ist:**

1. **GitHub-Repository erstellen:**
   - Gehen Sie zu [github.com](https://github.com)
   - Klicken Sie auf "New repository"
   - Name: `waschmaschinenapp` (oder beliebig)
   - Öffentlich oder privat (beides funktioniert)
   - Klicken Sie auf "Create repository"

2. **Code pushen:**
   ```bash
   # Im Projekt-Verzeichnis
   git init
   git add .
   git commit -m "Initial commit - Ready for Render"
   git branch -M main
   git remote add origin https://github.com/IHR-USERNAME/waschmaschinenapp.git
   git push -u origin main
   ```

**Falls Code bereits auf GitHub/GitLab ist:**
- ✅ Weiter zu Schritt 1

---

## 🎯 Schritt 1: Render Dashboard öffnen

1. Gehen Sie zu [render.com](https://render.com)
2. Loggen Sie sich ein
3. Sie sehen das Dashboard mit "New +" Button oben rechts

---

## 🎯 Schritt 2: Neues Web Service erstellen

1. **Klicken Sie auf "New +"** (oben rechts)
2. **Wählen Sie "Web Service"** aus der Liste

---

## 🎯 Schritt 3: Repository verbinden

### Option A: GitHub Repository verbinden

1. **"Connect account"** klicken (falls noch nicht verbunden)
2. **GitHub-Account autorisieren**
3. **Repository auswählen:**
   - Suchen Sie nach Ihrem Repository: `waschmaschinenapp`
   - Klicken Sie darauf

### Option B: Public Git Repository (falls nicht auf GitHub)

1. **"Public Git repository"** auswählen
2. **Repository URL eingeben:**
   ```
   https://github.com/IHR-USERNAME/waschmaschinenapp.git
   ```
   (Ersetzen Sie `IHR-USERNAME` mit Ihrem GitHub-Username)

---

## 🎯 Schritt 4: Service konfigurieren

### Basis-Konfiguration:

1. **Name:**
   ```
   waschmaschinenapp
   ```
   (Oder ein anderer Name Ihrer Wahl)

2. **Region:**
   ```
   Frankfurt (EU)
   ```
   (Oder näheste Region zu Ihnen)

3. **Branch:**
   ```
   main
   ```
   (Oder `master`, je nach Ihrem Repository)

4. **Root Directory:**
   ```
   (leer lassen)
   ```
   (Falls Code im Root-Verzeichnis ist)

5. **Runtime:**
   ```
   Node
   ```

6. **Build Command:**
   ```
   npm install
   ```

7. **Start Command:**
   ```
   npm start
   ```

8. **Plan:**
   - **Free** (für Tests - kostenlos, aber App schläft nach 15 Min)
   - **Starter** ($7/Monat - App läuft immer, Persistent Disk verfügbar)

**Empfehlung:** Starten Sie mit **Free** für Tests, können später upgraden.

---

## 🎯 Schritt 5: Environment-Variablen setzen

**WICHTIG:** Diese müssen VOR dem ersten Deployment gesetzt werden!

1. **Scrollen Sie nach unten** zu "Environment Variables"
2. **Klicken Sie auf "Add Environment Variable"**

### Variable 1: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Klicken Sie auf "Add"**

### Variable 2: ALLOWED_ORIGIN
- **Key:** `ALLOWED_ORIGIN`
- **Value:** `https://waschmaschinenapp.onrender.com`
  ⚠️ **WICHTIG:** Ersetzen Sie `waschmaschinenapp` mit dem Namen, den Sie in Schritt 4 gewählt haben!
- **Klicken Sie auf "Add"**

### Variable 3: SESSION_SECRET
- **Key:** `SESSION_SECRET`
- **Value generieren:**
  
  **Option A: In Render (später):**
  - Lassen Sie das erstmal leer, wir setzen es nach dem ersten Deployment
  
  **Option B: Jetzt generieren:**
  ```bash
  # In Ihrem Terminal (lokal):
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - Kopieren Sie den generierten Wert
  - **Key:** `SESSION_SECRET`
  - **Value:** `<generierter-wert>`
  - **Klicken Sie auf "Add"**

**Ihre Environment-Variablen sollten jetzt so aussehen:**
```
NODE_ENV = production
ALLOWED_ORIGIN = https://waschmaschinenapp.onrender.com
SESSION_SECRET = <ihr-generierter-wert>
```

---

## 🎯 Schritt 6: Deployen

1. **Scrollen Sie ganz nach unten**
2. **Klicken Sie auf "Create Web Service"**
3. **Warten Sie...** (2-5 Minuten)

**Was passiert jetzt:**
- Render klont Ihr Repository
- Installiert Dependencies (`npm install`)
- Startet den Server (`npm start`)
- Sie sehen Live-Logs

---

## 🎯 Schritt 7: Deployment überwachen

### Während des Deployments:

1. **Sie sehen Live-Logs** im Render Dashboard
2. **Prüfen Sie auf Fehler:**
   - ✅ "Build successful" = Gut
   - ✅ "Server started" = Gut
   - ❌ Rote Fehlermeldungen = Problem

### Typische Logs (erfolgreich):
```
==> Cloning from https://github.com/...
==> Building...
npm install
...
==> Starting...
npm start
Server erfolgreich gestartet { port: 10000, url: 'http://localhost:10000' }
```

### Bei Fehlern:
- **Scrollen Sie nach oben** in den Logs
- **Suchen Sie nach roten Fehlermeldungen**
- **Häufige Probleme:**
  - Port bereits belegt → Normal, Render setzt PORT automatisch
  - Module nicht gefunden → `npm install` fehlgeschlagen
  - Syntax-Fehler → Code-Problem

---

## 🎯 Schritt 8: Deployment-URL finden

**Nach erfolgreichem Deployment:**

1. **Oben im Dashboard** sehen Sie:
   ```
   https://waschmaschinenapp.onrender.com
   ```
   (Ihr Service-Name kann anders sein)

2. **Kopieren Sie diese URL** - das ist Ihre App-URL!

3. **⚠️ WICHTIG:** Falls Sie `ALLOWED_ORIGIN` in Schritt 5 gesetzt haben:
   - Prüfen Sie, ob die URL übereinstimmt
   - Falls nicht: Environment-Variable anpassen (siehe Schritt 9)

---

## 🎯 Schritt 9: CORS-URL anpassen (falls nötig)

**Falls Ihre tatsächliche URL anders ist als in Schritt 5:**

1. **Im Render Dashboard:**
   - Klicken Sie auf Ihren Service
   - Klicken Sie auf "Environment" (links im Menü)
   - Finden Sie `ALLOWED_ORIGIN`
   - Klicken Sie auf "Edit"
   - **Value ändern** auf Ihre tatsächliche URL:
     ```
     https://waschmaschinenapp.onrender.com
     ```
   - Klicken Sie auf "Save Changes"

2. **Service neu starten:**
   - Klicken Sie auf "Manual Deploy" → "Deploy latest commit"
   - Oder warten Sie auf automatisches Re-Deploy

---

## 🎯 Schritt 10: App testen

### Test 1: App öffnen

1. **Öffnen Sie Ihre App-URL:**
   ```
   https://waschmaschinenapp.onrender.com
   ```

2. **Erwartetes Ergebnis:**
   - ✅ App lädt
   - ✅ Maschinen werden angezeigt
   - ✅ Slots werden angezeigt

### Test 2: API testen

1. **Öffnen Sie in neuem Tab:**
   ```
   https://waschmaschinenapp.onrender.com/api/v1/machines
   ```

2. **Erwartetes Ergebnis:**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "name": "Waschmaschine 1",
         "type": "washing"
       },
       ...
     ]
   }
   ```

### Test 3: Admin-Bereich testen

1. **Öffnen Sie:**
   ```
   https://waschmaschinenapp.onrender.com/admin.html
   ```

2. **Login:**
   - Username: `admin`
   - Password: `admin123`

3. **⚠️ WICHTIG:** Ändern Sie das Passwort sofort nach dem ersten Login!

---

## 🎯 Schritt 11: SESSION_SECRET setzen (falls noch nicht geschehen)

**Falls Sie SESSION_SECRET in Schritt 5 nicht gesetzt haben:**

1. **Generieren Sie einen Secret:**
   ```bash
   # Lokal in Terminal:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **In Render Dashboard:**
   - Service → Environment
   - "Add Environment Variable"
   - **Key:** `SESSION_SECRET`
   - **Value:** `<generierter-wert>`
   - "Save Changes"

3. **Service neu starten:**
   - "Manual Deploy" → "Deploy latest commit"

---

## ✅ Deployment erfolgreich!

**Ihre App läuft jetzt auf Render!** 🎉

---

## 🔧 Nach dem Deployment

### 1. Admin-Passwort ändern

1. Login: `admin` / `admin123`
2. Passwort sofort ändern!

### 2. Monitoring einrichten

**Render Dashboard:**
- **Logs:** Service → Logs (Live-Logs ansehen)
- **Metrics:** Service → Metrics (CPU, Memory, etc.)
- **Events:** Service → Events (Deployment-Historie)

### 3. Auto-Deploy aktivieren (falls nicht aktiv)

- Service → Settings
- "Auto-Deploy" sollte auf "Yes" stehen
- Bei jedem Git-Push wird automatisch neu deployt

---

## ⚠️ Wichtige Hinweise

### Free Tier Einschränkungen:

1. **App schläft nach 15 Minuten Inaktivität**
   - Erster Request nach Inaktivität dauert 30-60 Sekunden
   - Lösung: Starter Plan ($7/Monat) oder externer Ping-Service

2. **Datenbank geht bei Deployment verloren**
   - SQLite-Datei wird bei jedem Deployment gelöscht
   - Lösung: Starter Plan mit Persistent Disk

### Starter Plan ($7/Monat):

- ✅ App läuft immer
- ✅ Persistent Disk verfügbar
- ✅ Bessere Performance
- ✅ Datenbank bleibt erhalten

---

## 🆘 Troubleshooting

### Problem 1: "Build failed"

**Lösung:**
- Prüfen Sie die Logs
- Häufig: `npm install` fehlgeschlagen
- Prüfen Sie `package.json` auf Fehler

### Problem 2: "Server crashed"

**Lösung:**
- Prüfen Sie die Logs
- Häufig: Port-Problem oder Datenbank-Fehler
- Prüfen Sie Environment-Variablen

### Problem 3: "CORS error" im Browser

**Lösung:**
- Prüfen Sie `ALLOWED_ORIGIN` in Environment-Variablen
- Muss exakt Ihre Render-URL sein (mit `https://`)
- Service neu starten

### Problem 4: "404 Not Found"

**Lösung:**
- Prüfen Sie, ob Server läuft (Logs)
- Prüfen Sie die URL (mit/ohne trailing slash)
- Prüfen Sie statische Dateien (sollten im `public` Ordner sein)

---

## 📞 Hilfe

**Bei Problemen:**
1. Render Logs prüfen (Dashboard → Logs)
2. Browser-Console prüfen (F12)
3. Network-Tab prüfen (F12 → Network)
4. Render Support kontaktieren

---

## ✅ Checkliste

- [ ] Code auf GitHub/GitLab
- [ ] Render-Account erstellt
- [ ] Web Service erstellt
- [ ] Repository verbunden
- [ ] Environment-Variablen gesetzt
- [ ] Deployment erfolgreich
- [ ] App erreichbar
- [ ] API funktioniert
- [ ] Admin-Login funktioniert
- [ ] Passwort geändert

---

**Viel Erfolg beim Deployment!** 🚀

