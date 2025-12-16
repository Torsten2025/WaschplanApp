# 🔍 SOFORT-DEBUG: Login & Registrierung

## ⚡ Schnelle Fehlersuche (5 Minuten)

### Schritt 1: Browser-Console öffnen
1. **F12** drücken
2. **Console-Tab** öffnen
3. **Fehler kopieren** und mir zeigen

### Schritt 2: Network-Tab prüfen
1. **Network-Tab** öffnen (F12 → Network)
2. **Login/Registrierung versuchen**
3. **Request zu `/api/v1/auth/login` oder `/api/v1/auth/register` finden**
4. **Klicken Sie auf den Request**
5. **Prüfen Sie:**
   - **Request URL:** Sollte `/api/v1/auth/login` sein
   - **Status Code:** Was steht da? (404, 500, etc.)
   - **Request Headers:** Enthält `Content-Type: application/json`?
   - **Request Payload:** Enthält `{"username":"...","password":"..."}`?
   - **Response:** Was steht in der Response?

### Schritt 3: Server-Logs prüfen
Im Terminal wo der Server läuft:
- Sehen Sie Requests zu `/api/v1/auth/login`?
- Sehen Sie Fehler?

---

## 🧪 Manueller Test in Browser-Console

**Kopieren Sie das in die Browser-Console (F12):**

```javascript
// Test 1: Login
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Status Text:', r.statusText);
  return r.json();
})
.then(data => {
  console.log('Response:', data);
})
.catch(err => {
  console.error('Fehler:', err);
});
```

**Was sehen Sie?**
- Status: `200` = OK, `404` = Route nicht gefunden, `500` = Server-Fehler
- Response: Was kommt zurück?

---

## 🔧 Was ich brauche um den Fehler zu finden

**Bitte geben Sie mir:**

1. **Browser-Console-Fehler:**
   - Öffnen Sie F12 → Console
   - Kopieren Sie alle roten Fehler

2. **Network-Tab-Info:**
   - F12 → Network
   - Klicken Sie auf den fehlgeschlagenen Request
   - Screenshot oder kopieren Sie:
     - Request URL
     - Status Code
     - Request Headers
     - Response

3. **Server-Logs:**
   - Was steht im Terminal wo der Server läuft?
   - Sehen Sie Requests?
   - Sehen Sie Fehler?

---

## ✅ Was bereits behoben wurde

1. ✅ `process is not defined` - behoben (logger.js)
2. ✅ `credentials: 'include'` - hinzugefügt (api.js)
3. ✅ Middleware-Reihenfolge - korrigiert (server.js)
4. ✅ `fetchWithRetry` Options-Kopie - behoben (api.js)

---

## 🚀 Server neu starten (WICHTIG!)

**Die Änderungen erfordern einen Server-Neustart:**

```powershell
# Im Terminal wo Server läuft:
Ctrl + C

# Dann:
npm start
```

**Oder:**

```powershell
# Server stoppen
Stop-Process -Name node -Force

# Server starten
npm start
```

---

## 📋 Checkliste

- [ ] Server neu gestartet?
- [ ] Browser-Cache geleert? (Ctrl+Shift+Delete)
- [ ] Seite neu geladen? (F5)
- [ ] Browser-Console geöffnet? (F12)
- [ ] Network-Tab geöffnet? (F12 → Network)
- [ ] Fehler kopiert und mir gezeigt?

---

**Bitte geben Sie mir die Fehler aus der Browser-Console und dem Network-Tab, dann kann ich den genauen Fehler finden und beheben!**

