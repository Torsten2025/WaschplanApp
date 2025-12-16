# 🔧 Offene Aufgaben für morgen

**Datum:** Heute  
**Status:** Anmelden funktioniert ✅, Abmelden und Admin-Login funktionieren noch nicht ❌

---

## ❌ Problem 1: Abmelden funktioniert nicht

### Betroffene Dateien:
- `public/js/api.js` - `logout()` Funktion (Zeile 620-642)
- `public/js/app.js` - `handleLogout()` Funktion (Zeile 1744-1776)
- `public/js/admin.js` - `handleLogout()` Funktion (Zeile 223-236)
- `server.js` - `/api/v1/auth/logout` Endpunkt (Zeile 1483-1495)

### Mögliche Ursachen:
1. **Session-Zerstörung**: Die `req.session.destroy()` Funktion könnte fehlschlagen
2. **API_BASE_URL**: Prüfen ob `API_BASE_URL` in `api.js` korrekt definiert ist
3. **Credentials**: Möglicherweise werden Session-Cookies nicht korrekt gesendet/gelöscht
4. **Frontend-Update**: Nach Logout wird die UI möglicherweise nicht korrekt aktualisiert

### Zu prüfen:
- [ ] Browser-Entwicklertools: Werden Session-Cookies nach Logout gelöscht?
- [ ] Server-Logs: Gibt es Fehler beim `req.session.destroy()`?
- [ ] Network-Tab: Wird der Logout-Request korrekt gesendet? Welcher Status-Code?
- [ ] `API_BASE_URL` in `public/js/api.js` prüfen

### Debugging-Schritte:
```javascript
// In public/js/api.js - logout() Funktion
// Prüfen ob API_BASE_URL korrekt ist:
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Logout URL:', `${API_BASE_URL}/auth/logout`);

// In server.js - Logout-Endpunkt
// Mehr Logging hinzufügen:
apiV1.post('/auth/logout', (req, res) => {
  console.log('Logout-Request erhalten');
  console.log('Session vor destroy:', req.session);
  const username = req.session?.username;
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy Fehler:', err);
      // ...
    } else {
      console.log('Session erfolgreich zerstört');
      // ...
    }
  });
});
```

---

## ❌ Problem 2: Admin-Login funktioniert nicht

### Betroffene Dateien:
- `public/js/admin.js` - `handleLogin()` Funktion (Zeile 155-218)
- `server.js` - `/api/v1/auth/login` Endpunkt (Zeile 1362-1410)

### Mögliche Ursachen:
1. **Rollen-Prüfung**: Die Prüfung `data.data.role === 'admin'` könnte fehlschlagen
2. **Session-Erstellung**: Die Session wird möglicherweise nicht korrekt erstellt
3. **Response-Format**: Die Antwort vom Server hat möglicherweise ein anderes Format
4. **Admin-Benutzer**: Der Admin-Benutzer existiert möglicherweise nicht in der Datenbank

### Zu prüfen:
- [ ] Existiert der Admin-Benutzer in der Datenbank? (Username: `admin`, Passwort: `admin123`)
- [ ] Browser-Entwicklertools: Welche Antwort kommt vom Server beim Login?
- [ ] Server-Logs: Wird der Login-Request korrekt verarbeitet?
- [ ] Session-Cookies: Werden Session-Cookies nach Login gesetzt?
- [ ] Response-Format: Hat die Antwort die Struktur `{ success: true, data: { role: 'admin' } }`?

### Debugging-Schritte:
```javascript
// In public/js/admin.js - handleLogin() Funktion
// Mehr Logging hinzufügen:
const data = await response.json();
console.log('Login-Response:', data);
console.log('Rolle:', data.data?.role);
console.log('Ist Admin?', data.data?.role === 'admin');

// In server.js - Login-Endpunkt
// Prüfen ob Admin-Benutzer existiert:
const user = await dbHelper.get('SELECT * FROM users WHERE username = ?', [username]);
console.log('Gefundener Benutzer:', user);
console.log('Rolle:', user?.role);
```

### Standard-Admin-Benutzer prüfen:
```sql
-- In der Datenbank prüfen:
SELECT * FROM users WHERE username = 'admin';
-- Sollte einen Eintrag mit role = 'admin' zurückgeben
```

---

## 🔍 Allgemeine Debugging-Tipps

### 1. Browser-Entwicklertools öffnen
- **F12** drücken
- **Network-Tab** öffnen
- Request/Response prüfen

### 2. Server-Logs prüfen
- Server-Konsole beobachten
- Nach Fehlermeldungen suchen
- Log-Level auf `debug` setzen (falls möglich)

### 3. Session-Cookies prüfen
- **Application-Tab** in Entwicklertools
- **Cookies** → `http://localhost:3000` prüfen
- Nach Login: Cookie sollte gesetzt sein
- Nach Logout: Cookie sollte gelöscht sein

### 4. API-Endpunkte testen
```powershell
# Login testen
Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/login -Method POST -Body (@{username='admin';password='admin123'} | ConvertTo-Json) -ContentType 'application/json' -SessionVariable session

# Session prüfen
Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/session -Method GET -WebSession $session

# Logout testen
Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/logout -Method POST -WebSession $session
```

---

## 📝 Notizen

- Anmelden als normaler Benutzer funktioniert ✅
- Server läuft auf Port 3000 ✅
- API-Endpunkte sind unter `/api/v1/*` erreichbar ✅

---

## 🎯 Priorität

1. **Hoch**: Admin-Login beheben (wichtig für Admin-Funktionalität)
2. **Mittel**: Logout beheben (UX-Problem)

---

**Viel Erfolg morgen! 🚀**

