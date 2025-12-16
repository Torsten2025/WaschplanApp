# 🗄️ Render Persistent Disk Setup - Datenbank-Persistenz

**Ziel:** Datenbank bleibt zwischen Deployments erhalten (Benutzer, Buchungen, etc.)

---

## ✅ Schritt 1: Persistent Disk in Render erstellen

1. **Render Dashboard öffnen**
   - Gehe zu: https://dashboard.render.com
   - Wähle deinen Web Service aus

2. **Disk erstellen**
   - Klicke auf **"Disks"** im linken Menü
   - Klicke auf **"Create Disk"** (oder "+ New Disk")

3. **Disk konfigurieren**
   - **Name:** `database-disk`
   - **Mount Path:** `/opt/render/project/src/database`
   - **Size:** 1 GB (oder mehr, je nach Bedarf)
   - **Attach to:** Dein Web Service (z.B. `waschplanapp`)

4. **Disk erstellen**
   - Klicke auf **"Create Disk"**
   - Warte, bis der Disk erstellt ist (ca. 1-2 Minuten)

---

## ✅ Schritt 2: Environment-Variable setzen

1. **Environment-Variablen öffnen**
   - Gehe zu deinem Web Service
   - Klicke auf **"Environment"** im linken Menü

2. **DATABASE_PATH hinzufügen**
   - Klicke auf **"Add Environment Variable"**
   - **Key:** `DATABASE_PATH`
   - **Value:** `/opt/render/project/src/database/waschmaschine.db`
   - Klicke auf **"Save Changes"**

---

## ✅ Schritt 3: Service neu starten

1. **Manual Deploy auslösen**
   - Gehe zu **"Events"** im linken Menü
   - Klicke auf **"Manual Deploy"** → **"Deploy latest commit"**
   - Oder: Pushe einen neuen Commit zu GitHub (löst automatisches Deployment aus)

2. **Warte auf Deployment**
   - Deployment dauert ca. 2-3 Minuten
   - Prüfe die Logs: Die Datenbank sollte jetzt unter `/opt/render/project/src/database/waschmaschine.db` erstellt werden

---

## ✅ Schritt 4: Verifizierung

**In den Render-Logs sollte erscheinen:**
```
[INFO] Versuche Datenbank zu öffnen: /opt/render/project/src/database/waschmaschine.db
[INFO] Datenbank erfolgreich geöffnet: /opt/render/project/src/database/waschmaschine.db
```

**Test:**
1. Registriere einen neuen Benutzer (z.B. "Torsten")
2. Mache eine Buchung
3. Löse ein **neues Deployment** aus (z.B. durch einen Git-Push)
4. Prüfe nach dem Deployment: Benutzer und Buchung sollten noch vorhanden sein ✅

---

## ⚠️ Wichtige Hinweise

### Disk-Größe
- **Empfohlen:** 1 GB für den Start
- **Kosten:** Ca. $0.25/GB/Monat auf Render
- Für 1 GB: ~$0.25/Monat zusätzlich zum Starter Plan ($7)

### Datenbank-Pfad
- Der Pfad **MUSS** innerhalb des Mount Paths sein: `/opt/render/project/src/database/...`
- Die App erstellt das Verzeichnis automatisch, falls es nicht existiert

### Backup
- **WICHTIG:** Auch mit Persistent Disk solltest du regelmäßige Backups machen!
- Die Backup-Funktion ist bereits in der App implementiert (`/api/admin/backup/create`)
- Oder: Render PostgreSQL verwenden (hat automatische Backups)

---

## 🔍 Troubleshooting

### Problem: Datenbank wird nicht gefunden
**Lösung:** Prüfe in den Logs, welchen Pfad die App verwendet. Stelle sicher, dass `DATABASE_PATH` korrekt gesetzt ist.

### Problem: Permission Denied
**Lösung:** Stelle sicher, dass der Mount Path korrekt ist und der Disk an den Service angehängt ist.

### Problem: Datenbank geht trotzdem verloren
**Lösung:** 
1. Prüfe, ob der Disk wirklich angehängt ist (in Render Dashboard → Disks)
2. Prüfe die Logs nach Fehlermeldungen
3. Prüfe, ob `DATABASE_PATH` wirklich gesetzt ist

---

## 📊 Alternative: Render PostgreSQL

Wenn du mehr Features willst (automatische Backups, bessere Performance), kannst du auch Render PostgreSQL verwenden:

1. **PostgreSQL Service erstellen** (kostenlos im Free Tier)
2. **Connection String** als Environment-Variable setzen
3. **Code anpassen:** SQLite → PostgreSQL Migration

**Vorteile:**
- ✅ Automatische Backups
- ✅ Bessere Performance
- ✅ Skalierbarer
- ✅ Kostenlos im Free Tier

**Nachteile:**
- ⚠️ Code muss angepasst werden (nicht SQLite-kompatibel)

---

## ✅ Fertig!

Nach diesen Schritten sollte deine Datenbank zwischen Deployments erhalten bleiben! 🎉

