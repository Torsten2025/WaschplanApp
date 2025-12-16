# 🔧 Render Deployment - Fehler beheben

## ❌ Problem 1: SQLite-Fehler (KRITISCH)

### Fehler:
```
Fehler beim Verbinden mit SQLite: SQLITE_CANTOPEN: Datenbankdatei kann nicht geöffnet werden
```

### Ursache:
- Auf Render (Free Tier) ist das Dateisystem **schreibgeschützt** oder temporär
- Die Datenbank kann nicht im Standard-Pfad `./waschmaschine.db` erstellt werden
- Bei jedem Deployment wird das Dateisystem neu erstellt

### ✅ Lösung 1: Free Tier (Temporärer Fix)

**Problem:** Datenbank geht bei jedem Deployment verloren, aber App funktioniert.

**Schritt 1: Environment-Variable setzen**
1. Gehen Sie zu Render Dashboard → Ihre App → "Environment"
2. Klicken Sie auf "+ Umgebungsvariable hinzufügen"
3. **NAME:** `DATABASE_PATH`
4. **Wert:** `/tmp/waschmaschine.db`
5. Speichern

**Schritt 2: App neu deployen**
- Render wird automatisch neu deployen
- Datenbank wird in `/tmp` erstellt (temporär, geht bei Deployment verloren)

### ✅ Lösung 2: Starter Plan mit Persistent Disk (EMPFOHLEN)

**Problem:** Datenbank bleibt erhalten, aber kostet $7/Monat.

**Schritt 1: Persistent Disk erstellen**
1. Render Dashboard → Ihre App → "Disks" Tab
2. "Create Disk"
3. **Name:** `waschmaschine-db`
4. **Size:** 1GB
5. **Mount Path:** `/var/data`
6. "Create Disk"

**Schritt 2: Environment-Variable setzen**
1. Render Dashboard → Ihre App → "Environment"
2. **NAME:** `DATABASE_PATH`
3. **Wert:** `/var/data/waschmaschine.db`
4. Speichern

**Schritt 3: App neu deployen**
- Datenbank wird jetzt auf persistentem Datenträger gespeichert
- Bleibt auch nach Deployments erhalten

---

## ⚠️ Problem 2: CSP-Fehler (Weniger kritisch)

### Fehler:
```
Content Security Policy directive: "default-src 'none'"
```

### Ursache:
- CSP (Content Security Policy) blockiert externe Stylesheets
- Google Translate versucht ein Stylesheet zu laden
- Das ist eine Browser-Warnung, keine App-Funktionalität

### ✅ Lösung (Optional):

**Schritt 1: CSP anpassen**
- In `server.js` Zeile ~142: CSP ist zu restriktiv
- Für Entwicklung kann CSP gelockert werden

**Aktueller Code:**
```javascript
if (process.env.NODE_ENV === 'production') {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
}
```

**Option 1: CSP lockern (für Entwicklung)**
```javascript
if (process.env.NODE_ENV === 'production') {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' https://www.gstatic.com");
}
```

**Option 2: CSP deaktivieren (nur für Tests)**
```javascript
// CSP nur in echter Produktion aktivieren
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_CSP !== 'true') {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
}
```

**Hinweis:** CSP-Fehler ist **nicht kritisch** - die App funktioniert trotzdem!

---

## 🚀 Schnellste Lösung (Free Tier)

### Schritt 1: Environment-Variable setzen
1. Render Dashboard → Ihre App → "Environment"
2. "+ Umgebungsvariable hinzufügen"
3. **NAME:** `DATABASE_PATH`
4. **Wert:** `/tmp/waschmaschine.db`
5. Speichern

### Schritt 2: Warten auf automatisches Re-Deployment
- Render deployt automatisch neu
- Oder: Manuell "Manual Deploy" → "Deploy latest commit"

### Schritt 3: Testen
- App sollte jetzt funktionieren
- ⚠️ **Wichtig:** Datenbank geht bei jedem Deployment verloren (Free Tier)

---

## ✅ Empfohlene Lösung (Starter Plan)

### Schritt 1: Upgrade zu Starter Plan
1. Render Dashboard → Ihre App → "Settings"
2. "Change Plan"
3. "Starter" wählen ($7/Monat)
4. Bestätigen

### Schritt 2: Persistent Disk erstellen
1. Render Dashboard → Ihre App → "Disks"
2. "Create Disk"
3. **Name:** `waschmaschine-db`
4. **Size:** 1GB
5. **Mount Path:** `/var/data`
6. "Create Disk"

### Schritt 3: Environment-Variable setzen
1. Render Dashboard → Ihre App → "Environment"
2. **NAME:** `DATABASE_PATH`
3. **Wert:** `/var/data/waschmaschine.db`
4. Speichern

### Schritt 4: App neu deployen
- Datenbank bleibt jetzt erhalten!

---

## 📋 Checkliste

### Free Tier (Temporär):
- [ ] `DATABASE_PATH=/tmp/waschmaschine.db` setzen
- [ ] App neu deployen
- [ ] ⚠️ Akzeptieren, dass Daten bei jedem Deployment verloren gehen

### Starter Plan (Empfohlen):
- [ ] Upgrade zu Starter Plan ($7/Monat)
- [ ] Persistent Disk erstellen (`/var/data`)
- [ ] `DATABASE_PATH=/var/data/waschmaschine.db` setzen
- [ ] App neu deployen
- [ ] ✅ Daten bleiben erhalten!

---

## 🎯 Ihre aktuelle Situation

**App ist live:** ✅ `https://waschplanapp.onrender.com`

**Probleme:**
1. ❌ SQLite-Fehler → Datenbank kann nicht erstellt werden
2. ⚠️ CSP-Warnung → Nicht kritisch, App funktioniert trotzdem

**Nächste Schritte:**
1. **Sofort:** `DATABASE_PATH=/tmp/waschmaschine.db` setzen (Free Tier)
2. **Später:** Upgrade zu Starter Plan + Persistent Disk (für Produktion)

---

## 💡 Tipp

**Für sofortige Lösung (Free Tier):**
- Setzen Sie `DATABASE_PATH=/tmp/waschmaschine.db`
- App funktioniert, aber Daten gehen bei jedem Deployment verloren

**Für Produktion:**
- Upgrade zu Starter Plan
- Persistent Disk verwenden
- `DATABASE_PATH=/var/data/waschmaschine.db` setzen
- Daten bleiben erhalten!

---

**Nach dem Fix sollte die App vollständig funktionieren!** 🚀

