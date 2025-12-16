# 🔍 Debug-Anleitung für Login/Registrierung

## Schnelle Fehlersuche

### 1. Browser-Console öffnen (F12)
Prüfe die Console auf Fehler.

### 2. Network-Tab prüfen
1. Öffne Browser-Entwicklertools (F12)
2. Gehe zu "Network" (Netzwerk)
3. Versuche Login/Registrierung
4. Prüfe den Request zu `/api/v1/auth/login` oder `/api/v1/auth/register`

**Was prüfen:**
- ✅ Request-URL: Sollte `/api/v1/auth/login` sein
- ✅ Request-Methode: Sollte `POST` sein
- ✅ Request-Headers: Sollte `Content-Type: application/json` enthalten
- ✅ Request-Body: Sollte `{"username":"...","password":"..."}` enthalten
- ✅ Response-Status: Sollte `200` oder `201` sein (nicht `404`)

### 3. Server-Logs prüfen
Im Terminal wo der Server läuft sollten Sie sehen:
```
[INFO] POST /api/v1/auth/login
[INFO] POST /api/v1/auth/register
```

Wenn Sie `404` oder `Cannot POST` sehen, ist die Route nicht registriert.

---

## Häufige Fehler

### Fehler 1: "Cannot POST /api/v1/auth/register"
**Ursache:** Route nicht gefunden  
**Lösung:** Server neu starten (Middleware-Reihenfolge wurde geändert)

### Fehler 2: "process is not defined"
**Ursache:** `logger.js` verwendet `process.env`  
**Status:** ✅ BEHOBEN

### Fehler 3: "credentials is not defined"
**Ursache:** `fetchWithRetry` überschreibt Optionen  
**Status:** ✅ BEHOBEN (Options werden jetzt kopiert)

---

## Manueller Test in Browser-Console

```javascript
// 1. Login testen
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)

// 2. Registrierung testen
fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'testuser', password: 'test123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

---

## Server-Status prüfen

```powershell
# Prüfe ob Server läuft
Test-NetConnection -ComputerName localhost -Port 3000

# Prüfe Node-Prozesse
Get-Process -Name node
```

---

## Nächste Schritte

1. ✅ Server neu starten
2. ✅ Browser-Cache leeren
3. ✅ Browser-Console öffnen (F12)
4. ✅ Network-Tab prüfen
5. ✅ Login/Registrierung testen

