# ✅ Fehler 404 bei Registrierung - BEHOBEN

**Problem:** HTTP 404 "Cannot POST /api/v1/auth/register"

**Ursache:**  
`express.static('public')` wurde VOR den API-Routen registriert und hat alle Requests abgefangen.

**Lösung:**  
Statische Dateien NACH API-Routen registrieren.

**Geändert:** `server.js`
- Zeile 180: `express.static` entfernt
- Zeile 3372: `express.static` NACH API-Routen eingefügt

**Server neu starten erforderlich!**

