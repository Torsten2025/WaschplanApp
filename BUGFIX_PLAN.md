# 🐛 Bugfix-Plan - Waschmaschinen-App

**Erstellt:** 2025-12-16  
**Status:** In Bearbeitung  
**Priorität:** Hoch

---

## 📋 Übersicht der bekannten Bugs

### 🔴 Kritische Bugs (Sofort beheben)

#### 1. Admin-Login funktioniert nicht
**Symptome:**
- `/api/v1/auth/login` gibt 401 zurück
- `/api/v1/auth/session` gibt 401 zurück
- Admin-Bereich ist nicht zugänglich
- `/api/v1/admin/*` Endpoints geben 401 zurück

**Ursache:**
- Session wird nicht korrekt erstellt/gespeichert
- Admin-User existiert möglicherweise nicht oder hat kein Passwort
- Cookie wird nicht korrekt gesetzt (CORS/SameSite-Probleme)

**Lösung:**
- [ ] Admin-User prüfen/erstellen mit `reset-admin-password.js`
- [ ] Session-Speicherung verbessern (FileStore vs MemoryStore)
- [ ] Cookie-Konfiguration für Render/Production prüfen
- [ ] CORS-Konfiguration für Session-Cookies anpassen

**Test:**
```bash
# 1. Admin-User erstellen/zurücksetzen
node reset-admin-password.js

# 2. Login testen
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# 3. Session prüfen
curl -X GET http://localhost:3000/api/v1/auth/session \
  -b cookies.txt
```

**Dateien:**
- `server.js` (Zeile ~1712-1830: Login-Endpoint)
- `server.js` (Zeile ~1918-1934: Session-Endpoint)
- `server.js` (Zeile ~162-196: Session-Konfiguration)
- `public/js/admin.js` (Zeile ~174-277: Login-Handler)

---

#### 2. Buchungen löschen funktioniert nicht zuverlässig
**Symptome:**
- Buchungen können nicht gelöscht werden
- 401/403 Fehler beim Löschen
- Session wird nicht erkannt

**Ursache:**
- Session-Validierung im DELETE-Endpoint
- `user_name` wird nicht korrekt aus Session/Request geholt
- Cookie wird nicht mitgesendet

**Lösung:**
- [x] DELETE-Endpoint prüft jetzt Session bevorzugt
- [x] Frontend sendet `credentials: 'include'`
- [ ] Testen ob Session korrekt erkannt wird

**Test:**
```bash
# 1. Buchung erstellen
# 2. Buchung löschen (mit Session)
# 3. Prüfen ob Löschung erfolgreich war
```

**Dateien:**
- `server.js` (Zeile ~3489-3556: DELETE-Endpoint)
- `public/js/api.js` (Zeile ~454-521: deleteBooking)

---

### 🟡 Wichtige Bugs (Bald beheben)

#### 3. Senior-Anmeldung funktioniert nicht
**Symptome:**
- `/api/v1/auth/login-senior` gibt 500 zurück
- Senior-Ansicht kann nicht verwendet werden
- Auto-Login funktioniert nicht

**Ursache:**
- Endpoint existiert, aber möglicherweise Fehler in der Implementierung
- Session wird nicht korrekt erstellt

**Lösung:**
- [x] `/auth/login-senior` Endpoint erstellt
- [x] Frontend verwendet jetzt `loginSenior`
- [ ] Testen ob Endpoint funktioniert
- [ ] Session-Erstellung prüfen

**Test:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login-senior \
  -H "Content-Type: application/json" \
  -d '{"name":"SeniorUser"}' \
  -c cookies.txt
```

**Dateien:**
- `server.js` (Zeile ~1710-1809: Senior-Login-Endpoint)
- `public/js/api.js` (Zeile ~697-730: loginSenior)
- `public/js/senior.js` (Zeile ~44-57, 326-338, 373-385: Senior-Login-Verwendung)

---

#### 4. Normale User können sich als andere User anmelden
**Symptome:**
- Eingeloggter User kann sich als anderer User anmelden
- Buchungen können für andere User erstellt werden

**Ursache:**
- Frontend erlaubt Login-Wechsel ohne Logout
- Backend prüft nicht, ob `user_name` mit Session übereinstimmt

**Lösung:**
- [x] Frontend verhindert Login-Wechsel ohne Logout
- [x] Backend prüft `user_name` gegen Session
- [ ] Testen ob Sicherheit gewährleistet ist

**Test:**
```bash
# 1. Als User A einloggen
# 2. Versuchen als User B zu buchen
# 3. Sollte fehlschlagen
```

**Dateien:**
- `server.js` (Zeile ~2700-2750: Booking-Endpoint mit Session-Validierung)
- `public/js/app.js` (Zeile ~669-682: Login-Wechsel-Prüfung)

---

### 🟢 Kleinere Bugs (Optional)

#### 5. Session wird nicht persistent gespeichert
**Symptome:**
- Session geht nach Server-Neustart verloren (bei MemoryStore)
- User muss sich nach jedem Neustart neu anmelden

**Ursache:**
- MemoryStore wird verwendet statt FileStore
- Sessions-Verzeichnis existiert nicht oder ist nicht beschreibbar

**Lösung:**
- [ ] Sessions-Verzeichnis prüfen/erstellen
- [ ] FileStore korrekt konfigurieren
- [ ] Fallback auf MemoryStore nur wenn nötig

**Dateien:**
- `server.js` (Zeile ~175-194: Session-Store-Konfiguration)

---

#### 6. CORS-Konfiguration zu restriktiv
**Symptome:**
- Requests von bestimmten Origins werden blockiert
- Session-Cookies werden nicht mitgesendet

**Ursache:**
- CORS-Konfiguration erlaubt nicht alle benötigten Origins
- `credentials: true` funktioniert nicht mit `*` Origin

**Lösung:**
- [x] CORS-Konfiguration verbessert
- [ ] Testen ob alle Origins funktionieren

**Dateien:**
- `server.js` (Zeile ~140-160: CORS-Konfiguration)

---

## 🔧 Implementierungsreihenfolge

### Phase 1: Kritische Bugs (Sofort)
1. ✅ Admin-Login fixen
2. ✅ Buchungen löschen fixen
3. ⏳ Session-Validierung testen

### Phase 2: Wichtige Bugs (Diese Woche)
1. ⏳ Senior-Anmeldung testen/fixen
2. ✅ Sicherheitsproblem (Login-Wechsel) behoben

### Phase 3: Kleinere Bugs (Optional)
1. ⏳ Session-Persistenz verbessern
2. ✅ CORS-Konfiguration verbessert

---

## 🧪 Test-Plan

### 1. Admin-Login Test
```bash
# Test 1: Admin-User existiert
node reset-admin-password.js

# Test 2: Login funktioniert
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt -v

# Test 3: Session wird erkannt
curl -X GET http://localhost:3000/api/v1/auth/session \
  -b cookies.txt -v

# Test 4: Admin-Endpoints funktionieren
curl -X GET http://localhost:3000/api/v1/admin/bookings \
  -b cookies.txt -v
```

### 2. Buchungen löschen Test
```bash
# Test 1: Buchung erstellen
BOOKING_ID=$(curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{"machine_id":1,"date":"2025-12-20","slot":"07:00-12:00","user_name":"TestUser"}' \
  -b cookies.txt | jq -r '.data.id')

# Test 2: Buchung löschen
curl -X DELETE "http://localhost:3000/api/v1/bookings/$BOOKING_ID?user_name=TestUser" \
  -b cookies.txt -v
```

### 3. Senior-Login Test
```bash
# Test 1: Senior-Login
curl -X POST http://localhost:3000/api/v1/auth/login-senior \
  -H "Content-Type: application/json" \
  -d '{"name":"SeniorUser"}' \
  -c cookies.txt -v

# Test 2: Session prüfen
curl -X GET http://localhost:3000/api/v1/auth/session \
  -b cookies.txt -v
```

### 4. Sicherheitstest
```bash
# Test 1: Als User A einloggen
curl -X POST http://localhost:3000/api/v1/auth/login-simple \
  -H "Content-Type: application/json" \
  -d '{"name":"UserA"}' \
  -c cookies.txt

# Test 2: Versuchen als User B zu buchen (sollte fehlschlagen)
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{"machine_id":1,"date":"2025-12-20","slot":"07:00-12:00","user_name":"UserB"}' \
  -b cookies.txt -v
```

---

## 📝 Checkliste

### Admin-Login
- [ ] Admin-User existiert und hat Passwort
- [ ] Login-Endpoint funktioniert
- [ ] Session wird erstellt und gespeichert
- [ ] Cookie wird korrekt gesetzt
- [ ] Session-Endpoint erkennt Session
- [ ] Admin-Endpoints funktionieren

### Buchungen löschen
- [ ] DELETE-Endpoint prüft Session
- [ ] Frontend sendet Cookie mit
- [ ] Buchungen können gelöscht werden
- [ ] Nur eigene Buchungen können gelöscht werden
- [ ] Admin kann alle Buchungen löschen

### Senior-Anmeldung
- [ ] `/auth/login-senior` Endpoint funktioniert
- [ ] User wird mit Rolle 'senior' erstellt
- [ ] Session wird erstellt
- [ ] Auto-Login funktioniert
- [ ] Buchungen funktionieren mit Senior-Login

### Sicherheit
- [ ] Login-Wechsel ohne Logout wird verhindert
- [ ] Backend prüft `user_name` gegen Session
- [ ] Buchungen können nur für eigenen Account erstellt werden

---

## 🔍 Debugging-Tipps

### Session-Probleme
```javascript
// In server.js: Session-Debug-Logging aktivieren
logger.debug('Session-Details', {
  hasSession: !!req.session,
  sessionId: req.sessionID,
  userId: req.session?.userId,
  username: req.session?.username,
  role: req.session?.role,
  cookies: req.headers.cookie
});
```

### Cookie-Probleme
- Prüfe ob `credentials: 'include'` im Frontend gesetzt ist
- Prüfe ob `sameSite: 'lax'` in Session-Config korrekt ist
- Prüfe ob `secure: true` nur in Production gesetzt ist

### CORS-Probleme
- Prüfe ob Origin in erlaubter Liste ist
- Prüfe ob `credentials: true` in CORS-Config gesetzt ist
- Prüfe Browser-Console für CORS-Fehler

---

## 📚 Weitere Ressourcen

- [Express-Session Dokumentation](https://github.com/expressjs/session)
- [CORS Dokumentation](https://github.com/expressjs/cors)
- [Session-File-Store Dokumentation](https://github.com/valery-barysok/session-file-store)

---

**Letzte Aktualisierung:** 2025-12-16  
**Nächste Review:** Nach Implementierung der kritischen Bugs

