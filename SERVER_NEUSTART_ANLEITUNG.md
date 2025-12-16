# 🚀 Server-Neustart-Anleitung

## Windows (PowerShell)

### Server stoppen:
1. **Aktuellen Server-Prozess finden:**
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue
   ```

2. **Server beenden:**
   - **Option 1:** Im Terminal wo der Server läuft: `Ctrl + C`
   - **Option 2:** Prozess beenden:
     ```powershell
     Stop-Process -Name node -Force
     ```

### Server starten:
```powershell
npm start
```

oder

```powershell
node server.js
```

---

## Schnellste Methode

1. **Im Terminal wo der Server läuft:**
   - `Ctrl + C` drücken (Server stoppen)
   - `npm start` eingeben (Server starten)

2. **Oder in neuem Terminal:**
   ```powershell
   # Server stoppen
   Stop-Process -Name node -Force
   
   # Server starten
   npm start
   ```

---

## Fehler beheben

### Fehler: "process is not defined"

**Problem:**  
`public/js/logger.js` verwendet `process.env`, was im Browser nicht verfügbar ist.

**Status:** ✅ **BEHOBEN**

Die Datei wurde aktualisiert und verwendet jetzt eine Browser-kompatible Methode.

**Nach dem Neustart:**
1. Browser-Cache leeren (Ctrl+Shift+Delete)
2. Seite neu laden (F5)

---

## Server-Status prüfen

### Prüfen ob Server läuft:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

### Server-Logs prüfen:
Im Terminal wo der Server läuft sollten Sie sehen:
```
[INFO] Server erfolgreich gestartet | {"port":3000,"url":"http://localhost:3000"}
```

---

## Troubleshooting

### Port bereits belegt:
```powershell
# Prozess auf Port 3000 finden
netstat -ano | findstr :3000

# Prozess beenden (PID aus vorherigem Befehl)
taskkill /PID <PID> /F
```

### Server startet nicht:
1. Prüfe ob Node.js installiert ist: `node --version`
2. Prüfe ob alle Dependencies installiert sind: `npm install`
3. Prüfe Logs auf Fehler

---

## Nächste Schritte

1. ✅ Server neu starten
2. ✅ Browser-Cache leeren
3. ✅ Seite neu laden
4. ✅ Login testen

