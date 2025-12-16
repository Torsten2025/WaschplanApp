# 🐛 Test-Fehler Dokumentation

**Erstellt:** 2025-12-16  
**Test-Skript:** `test-all-bugs.js`  
**Status:** Server nicht erreichbar

---

## ❌ Gefundene Fehler

### 1. Server nicht erreichbar
**Fehler:** `connect ECONNREFUSED ::1:3000`

**Ursache:**
- Server läuft möglicherweise nicht
- IPv6-Problem (::1 statt 127.0.0.1)
- Port 3000 ist nicht geöffnet

**Lösung:**
- [x] Test-Skript angepasst: verwendet jetzt IPv4 (127.0.0.1)
- [ ] Server starten: `npm start` oder `node server.js`
- [ ] Prüfen ob Port 3000 verfügbar ist

**Betroffene Tests:**
- Admin-Login
- Einfaches Login (normale User)
- Senior-Login

---

## 📋 Test-Ergebnisse

### Bestanden: 0
- Keine Tests konnten durchgeführt werden (Server nicht erreichbar)

### Fehlgeschlagen: 5
1. Admin-Session prüfen (keine Cookies wegen fehlgeschlagenem Login)
2. Admin-Endpoints zugänglich (keine Cookies)
3. User-Session prüfen (keine Cookies)
4. Buchung erstellen (keine Cookies)
5. Senior-Session prüfen (keine Cookies)

### Fehler: 3
1. Admin-Login (Server nicht erreichbar)
2. Einfaches Login (Server nicht erreichbar)
3. Senior-Login (Server nicht erreichbar)

---

## 🔧 Nächste Schritte

1. **Server starten:**
   ```bash
   npm start
   # oder
   node server.js
   ```

2. **Tests erneut ausführen:**
   ```bash
   node test-all-bugs.js
   ```

3. **Fehler dokumentieren und beheben**

---

**Hinweis:** Die Tests können erst durchgeführt werden, wenn der Server läuft.

