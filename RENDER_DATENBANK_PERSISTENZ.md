# 🔧 Render: Datenbank-Persistenz einrichten

## Problem

**Symptom:** Nach jedem Deploy/Neustart sind alle Benutzer und Buchungen weg.

**Ursache:** Die SQLite-Datenbank wird nicht persistent gespeichert und geht bei jedem Neustart verloren.

---

## ✅ Lösung: Persistent Disk einrichten

### Schritt 1: Persistent Disk in Render erstellen

1. Gehen Sie zu Ihrem Render-Dashboard
2. Klicken Sie auf Ihren Web-Service
3. Gehen Sie zu **"Disk"** (im linken Menü)
4. Klicken Sie auf **"Attach Disk"**
5. Konfigurieren Sie:
   - **Name:** `database-disk`
   - **Size:** 1 GB (ausreichend für SQLite)
   - **Mount Path:** `/opt/render/project/src/database`

### Schritt 2: Environment-Variable setzen

1. Gehen Sie zu **"Environment"** in Ihrem Render-Service
2. Fügen Sie eine neue Variable hinzu:
   - **Key:** `DATABASE_PATH`
   - **Value:** `/opt/render/project/src/database/waschmaschine.db`

### Schritt 3: Deploy

Nach dem nächsten Deploy wird die Datenbank auf dem Persistent Disk gespeichert und bleibt bei Neustarts erhalten.

---

## 🔍 Prüfen ob Persistent Disk funktioniert

### Option 1: Render Logs prüfen

Nach dem Start sollte in den Logs stehen:
```
Datenbank erfolgreich verbunden mit optimierten Einstellungen
Datenbank-Schema erfolgreich initialisiert
Maschinen-Tabelle enthält bereits X Einträge, keine Seed-Daten nötig
```

**Wenn stattdessen steht:**
```
Maschinen-Tabelle ist leer, füge Seed-Daten ein
```
→ Die Datenbank wird neu erstellt = Persistent Disk funktioniert NICHT

### Option 2: Render Shell verwenden

1. Gehen Sie zu Ihrem Service → **"Shell"**
2. Führen Sie aus:
```bash
ls -la /opt/render/project/src/database/
```

**Erwartetes Ergebnis:**
```
waschmaschine.db  (Datei sollte existieren)
```

---

## ⚠️ WICHTIG: Datenbank-Backup

Auch mit Persistent Disk sollten Sie regelmäßig Backups erstellen:

1. **Automatisches Backup:** Läuft bereits alle 24 Stunden
2. **Manuelles Backup:** Admin-Bereich → Backup erstellen
3. **Backup-Download:** Backups werden in `/backups` gespeichert

---

## 🐛 Troubleshooting

### Problem: Datenbank wird trotzdem neu erstellt

**Mögliche Ursachen:**
1. Persistent Disk nicht korrekt gemountet
2. `DATABASE_PATH` Environment-Variable nicht gesetzt
3. Keine Schreibrechte auf Persistent Disk

**Lösung:**
1. Prüfen Sie die Render-Logs auf Fehler
2. Prüfen Sie ob `DATABASE_PATH` gesetzt ist
3. Prüfen Sie die Mount-Pfade in Render

### Problem: "Permission denied" Fehler

**Lösung:**
- Stellen Sie sicher, dass der Mount-Pfad korrekt ist
- Render sollte automatisch die richtigen Rechte setzen

---

## 📝 Alternative: In-Memory Datenbank (NICHT empfohlen)

Falls Persistent Disk nicht funktioniert, verwendet die App automatisch eine In-Memory Datenbank als Fallback. **WARNUNG:** Alle Daten gehen bei jedem Neustart verloren!

**Erkennung in Logs:**
```
In-Memory Datenbank verwendet - Daten gehen bei Neustart verloren!
```

---

## ✅ Checkliste

- [ ] Persistent Disk erstellt und gemountet
- [ ] `DATABASE_PATH` Environment-Variable gesetzt
- [ ] Service neu gestartet
- [ ] Logs geprüft (keine "Tabelle ist leer" Meldung)
- [ ] Benutzer bleiben nach Neustart erhalten
- [ ] Buchungen bleiben nach Neustart erhalten

---

**Erstellt:** 2025-01-XX  
**Zuletzt aktualisiert:** 2025-01-XX

