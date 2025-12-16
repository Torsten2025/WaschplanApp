# 🔧 Render Environment-Variablen - Schritt für Schritt

## 📋 Was Sie in Render setzen müssen

### ✅ MINDESTENS diese Variablen (für ersten Test):

#### 1. NODE_ENV
- **NAME_DER_VARIABLEN:** `NODE_ENV`
- **Wert:** `production`
- **Warum:** Aktiviert Produktions-Modus

#### 2. ALLOWED_ORIGIN (WICHTIG!)
- **NAME_DER_VARIABLEN:** `ALLOWED_ORIGIN`
- **Wert:** `https://ihre-app-name.onrender.com`
  - ⚠️ **WICHTIG:** Ersetzen Sie `ihre-app-name` mit dem Namen, den Sie für Ihre App gewählt haben!
  - Beispiel: Wenn Ihre App `waschmaschinenapp` heißt → `https://waschmaschinenapp.onrender.com`
- **Warum:** Erlaubt CORS-Requests von Ihrer Render-URL

---

### 🔐 EMPFOHLEN (für Sicherheit):

#### 3. SESSION_SECRET
- **NAME_DER_VARIABLEN:** `SESSION_SECRET`
- **Wert generieren:**
  1. Klicken Sie auf das **"Erzeugen"** (Generate) Icon (Zauberstab-Symbol) neben dem Wert-Feld
  2. Oder generieren Sie lokal:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
  3. Kopieren Sie den generierten Wert
- **Warum:** Sicherer Session-Key (wichtig für Produktion)

---

### 💾 OPTIONAL (nur wenn Sie Starter Plan mit Persistenz verwenden):

#### 4. DATABASE_PATH
- **NAME_DER_VARIABLEN:** `DATABASE_PATH`
- **Wert:** `/var/data/waschmaschine.db`
- **Warum:** Speichert Datenbank auf persistentem Datenträger
- **Nur nötig wenn:** Sie Starter Plan ($7/Monat) mit Persistent Disk verwenden

---

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: NODE_ENV hinzufügen
1. Klicken Sie auf **"+ Umgebungsvariable hinzufügen"**
2. **NAME_DER_VARIABLEN:** `NODE_ENV`
3. **Wert:** `production`
4. Klicken Sie außerhalb des Feldes oder auf "Speichern"

### Schritt 2: ALLOWED_ORIGIN hinzufügen
1. Klicken Sie auf **"+ Umgebungsvariable hinzufügen"**
2. **NAME_DER_VARIABLEN:** `ALLOWED_ORIGIN`
3. **Wert:** `https://ihre-app-name.onrender.com`
   - ⚠️ **WICHTIG:** Ersetzen Sie `ihre-app-name` mit Ihrem App-Namen!
   - Falls Sie den Namen noch nicht wissen: Lassen Sie das Feld erstmal leer, setzen Sie es nach dem ersten Deployment

### Schritt 3: SESSION_SECRET hinzufügen (empfohlen)
1. Klicken Sie auf **"+ Umgebungsvariable hinzufügen"**
2. **NAME_DER_VARIABLEN:** `SESSION_SECRET`
3. **Wert generieren:**
   - Klicken Sie auf **"Erzeugen"** (Zauberstab-Symbol) neben dem Wert-Feld
   - Oder: Generieren Sie lokal und kopieren Sie den Wert
4. Fügen Sie den generierten Wert ein

### Schritt 4: DATABASE_PATH (nur wenn Starter Plan)
1. Klicken Sie auf **"+ Umgebungsvariable hinzufügen"**
2. **NAME_DER_VARIABLEN:** `DATABASE_PATH`
3. **Wert:** `/var/data/waschmaschine.db`
4. **Nur nötig wenn:** Sie Starter Plan mit Persistent Disk verwenden

---

## 📝 Beispiel-Konfiguration

### Minimal (für ersten Test):
```
NODE_ENV = production
ALLOWED_ORIGIN = https://waschmaschinenapp.onrender.com
```

### Empfohlen (für Produktion):
```
NODE_ENV = production
ALLOWED_ORIGIN = https://waschmaschinenapp.onrender.com
SESSION_SECRET = <generierter-sicherer-key>
```

### Mit Persistenz (Starter Plan):
```
NODE_ENV = production
ALLOWED_ORIGIN = https://waschmaschinenapp.onrender.com
SESSION_SECRET = <generierter-sicherer-key>
DATABASE_PATH = /var/data/waschmaschine.db
```

---

## ⚠️ WICHTIGE HINWEISE

### ALLOWED_ORIGIN
- **Muss exakt Ihre Render-URL sein!**
- Format: `https://ihre-app-name.onrender.com`
- **Kein trailing slash!** (Nicht: `https://...onrender.com/`)
- Falls Sie die URL noch nicht kennen: Lassen Sie das Feld erstmal leer, setzen Sie es nach dem ersten Deployment

### SESSION_SECRET
- **Sollte ein sicherer, zufälliger Wert sein**
- Verwenden Sie den "Erzeugen"-Button oder generieren Sie lokal
- **Nicht:** Den Default-Wert aus dem Code verwenden!

### DATABASE_PATH
- **Nur nötig wenn:** Sie Starter Plan mit Persistent Disk verwenden
- **Free Tier:** Nicht nötig (Datenbank geht bei jedem Deployment verloren)

---

## ✅ Checkliste

### Vor dem Deployment:
- [ ] `NODE_ENV=production` gesetzt
- [ ] `ALLOWED_ORIGIN` gesetzt (oder nach Deployment)
- [ ] `SESSION_SECRET` gesetzt (empfohlen)
- [ ] `DATABASE_PATH` gesetzt (nur wenn Starter Plan)

### Nach dem ersten Deployment:
- [ ] Render-URL notieren
- [ ] `ALLOWED_ORIGIN` auf tatsächliche URL setzen (falls noch nicht gesetzt)
- [ ] App testen
- [ ] CORS-Fehler prüfen

---

## 🎯 Schnellstart

### Für sofortiges Deployment (Minimal):
1. **NODE_ENV:** `production`
2. **ALLOWED_ORIGIN:** Lassen Sie erstmal leer, setzen Sie nach Deployment
3. Klicken Sie auf **"Webdienst Bereitstellen"**

### Nach dem Deployment:
1. Notieren Sie Ihre Render-URL (z.B. `https://waschmaschinenapp.onrender.com`)
2. Gehen Sie zurück zu Environment-Variablen
3. Fügen Sie `ALLOWED_ORIGIN` hinzu mit Ihrer URL
4. App wird automatisch neu deployt

---

## 💡 Tipp

**Falls Sie die Render-URL noch nicht kennen:**
- Lassen Sie `ALLOWED_ORIGIN` erstmal leer
- Deployen Sie die App
- Notieren Sie die URL aus dem Dashboard
- Fügen Sie `ALLOWED_ORIGIN` danach hinzu
- App wird automatisch neu deployt

---

**Fertig! Klicken Sie auf "Webdienst Bereitstellen"** 🚀

