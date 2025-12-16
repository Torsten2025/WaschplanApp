# Fehlende Funktionen - Aufgaben für Agenten

**Erstellt am:** [Aktuelles Datum]  
**Erstellt von:** Senior Product Architect  
**Status:** 🔴 Kritisch - Blockiert Funktionalität

---

## 📋 Executive Summary

Die App hat mehrere fehlende Backend-Endpunkte, die im Frontend aufgerufen werden, aber nicht implementiert sind. Dies führt zu Fehlern in der Wochen-/Monatsansicht und bei der Authentifizierung.

**Kritische Fehlende Funktionen:**
1. ❌ Wochenansicht-Endpunkt (`/api/v1/bookings/week`)
2. ❌ Monatsansicht-Endpunkt (`/api/v1/bookings/month`)
3. ❌ Auth-Endpunkt `/api/v1/auth/me` (für getCurrentUser)
4. ❌ Auth-Endpunkt `/api/v1/auth/session` (für Admin-Bereich)

**Priorität:** 🔴 HOCH - Blockiert Funktionalität

---

## 🔴 KRITISCHE FEHLENDE FUNKTIONEN

### ✅ 1. Wochenansicht-Endpunkt - BEREITS IMPLEMENTIERT

**Status:** ✅ **VORHANDEN**  
**Datei:** `server.js:1431`  
**Endpunkt:** `GET /api/v1/bookings/week?start_date=YYYY-MM-DD`

**Hinweis:** Dieser Endpunkt ist bereits implementiert und sollte funktionieren. Falls Probleme auftreten, bitte prüfen.

---

### ✅ 2. Monatsansicht-Endpunkt - BEREITS IMPLEMENTIERT

**Status:** ✅ **VORHANDEN**  
**Datei:** `server.js:1492`  
**Endpunkt:** `GET /api/v1/bookings/month?year=YYYY&month=MM`

**Hinweis:** Dieser Endpunkt ist bereits implementiert und sollte funktionieren. Falls Probleme auftreten, bitte prüfen.

---

### ✅ 3. Auth-Endpunkt `/api/v1/auth/session` - BEREITS IMPLEMENTIERT

**Status:** ✅ **VORHANDEN**  
**Datei:** `server.js:1073`  
**Endpunkt:** `GET /api/v1/auth/session`

**Hinweis:** Dieser Endpunkt ist bereits implementiert. Er verwendet `requireAuth` Middleware, was korrekt ist für den Admin-Bereich.

---

### ❌ 4. Auth-Endpunkt `/api/v1/auth/me` fehlt

**Benötigter Endpunkt:**
```
GET /api/v1/bookings/week?start_date=YYYY-MM-DD
```

**Response-Format:**
```json
{
  "success": true,
  "data": {
    "week_start": "2024-12-30",
    "week_end": "2025-01-03",
    "bookings": [
      {
        "id": 1,
        "machine_id": 1,
        "date": "2024-12-30",
        "slot": "08:00-10:00",
        "user_name": "Max Mustermann",
        "machine_name": "Waschmaschine 1",
        "machine_type": "washer"
      }
    ]
  }
}
```

**Anforderungen:**
- Startdatum kann beliebiges Datum der Woche sein
- Berechnet Montag bis Freitag der Arbeitswoche
- Liefert alle Buchungen für diese 5 Tage
- Sortiert nach Datum, dann Slot

---

**Problem:**
- Frontend ruft `getCurrentUser()` auf (`public/js/app.js:1186`)
- API-Funktion ruft `/api/v1/auth/me` auf (`public/js/api.js:498`)
- Backend-Endpunkt existiert nicht

**Auswirkung:**
- Authentifizierungs-Status kann nicht geprüft werden
- Login-Status wird nicht korrekt angezeigt
- Fehler 404 beim Prüfen des Auth-Status

**Benötigter Endpunkt:**
```
GET /api/v1/auth/me
```

**Response-Format (eingeloggt):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "max",
      "role": "user"
    }
  }
}
```

**Response-Format (nicht eingeloggt):**
```json
{
  "success": false,
  "error": "Nicht authentifiziert"
}
```
Status Code: 401

**Anforderungen:**
- Prüft Session (optional - kann auch ohne Session aufgerufen werden)
- Gibt aktuellen Benutzer zurück oder 401
- Unterschied zu `/auth/session`: Keine `requireAuth` Middleware (öffentlicher Endpunkt)

---

## 📝 AUFGABEN FÜR AGENTEN

### ✅ Aufgabe 1 & 2: Wochen- und Monatsansicht-Endpunkte - BEREITS IMPLEMENTIERT

**Status:** ✅ **VORHANDEN**  
**Datei:** `server.js:1431` (Woche), `server.js:1492` (Monat)

**Hinweis:** Diese Endpunkte sind bereits implementiert. Falls Probleme auftreten, bitte prüfen ob:
- Die Endpunkte korrekt funktionieren
- Die Response-Formate mit dem Frontend übereinstimmen
- Die Validierung korrekt ist

---

### 🟢 Senior Fullstack Developer

#### Aufgabe 1: Auth-Endpunkt `/api/v1/auth/me` implementieren
**Priorität:** 🔴 Hoch  
**Geschätzte Dauer:** 1-2 Stunden  
**Komplexität:** Niedrig

**Beschreibung:**
Implementiere den Endpunkt `GET /api/v1/auth/me` für die Prüfung des aktuellen Benutzers.

**Technische Details:**
- Endpunkt: `GET /api/v1/auth/me`
- Prüft Session (`req.session.userId`)
- Gibt Benutzer-Info zurück oder 401 wenn nicht eingeloggt
- Keine Authentifizierung erforderlich (öffentlicher Endpunkt)

**Response-Struktur (eingeloggt):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "max",
      "role": "user"
    }
  }
}
```

**Response-Struktur (nicht eingeloggt):**
```json
{
  "success": false,
  "error": "Nicht authentifiziert"
}
```
Status Code: 401

**Implementierung:**
- Nutze `getCurrentUser(req)` Helper-Funktion (bereits vorhanden in `server.js:990`)
- Wenn `user` vorhanden: `apiResponse.success(res, { user })`
- Wenn `user` null: `apiResponse.unauthorized(res, 'Nicht authentifiziert')`

**Output:**
- Endpunkt in `server.js` im `apiV1` Router (nach `/auth/logout`)

**Abnahmekriterien:**
- ✅ Endpunkt gibt Benutzer-Info zurück wenn eingeloggt
- ✅ Endpunkt gibt 401 zurück wenn nicht eingeloggt
- ✅ Response-Format entspricht Spezifikation
- ✅ Funktioniert mit Session-basierter Authentifizierung

**Datei:** `server.js` (im `apiV1` Router, nach `/auth/logout`)

---

### ✅ Aufgabe 2: Auth-Endpunkt `/api/v1/auth/session` - BEREITS IMPLEMENTIERT

**Status:** ✅ **VORHANDEN**  
**Datei:** `server.js:1073`

**Hinweis:** Dieser Endpunkt ist bereits implementiert. Er verwendet `requireAuth` Middleware, was korrekt ist für den Admin-Bereich.

---

## 🟡 MITTLERE PRIORITÄT - Verbesserungen

### 5. Buchungs-Bearbeitung (Optional)

**Problem:**
- Aktuell können Buchungen nur erstellt und gelöscht werden
- Keine Möglichkeit, Buchungen zu bearbeiten (z.B. Slot ändern)

**Auswirkung:**
- Nutzer müssen Buchung löschen und neu erstellen
- Nicht optimal für UX

**Benötigter Endpunkt:**
```
PUT /api/v1/bookings/:id
Body: { machine_id, date, slot, user_name }
```

**Priorität:** 🟡 Mittel (nicht kritisch, aber sinnvoll)

**Zugewiesen an:** Senior Fullstack Developer (optional)

---

### 6. Datenbank-Indizes hinzufügen

**Problem:**
- Keine Indizes auf `bookings.date` und `bookings.machine_id`
- Performance-Probleme bei vielen Buchungen

**Auswirkung:**
- Langsame Queries bei Wochen-/Monatsansicht

**Benötigte Indizes:**
```sql
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_machine_date ON bookings(machine_id, date);
```

**Priorität:** 🟡 Mittel (Performance-Optimierung)

**Zugewiesen an:** Junior Backend Entwickler

---

## 📊 Priorisierung

### Sofort (diese Woche):
1. ✅ Aufgabe 1: `/api/v1/auth/me` (Senior Fullstack) - **EINZIGE FEHLENDE FUNKTION**
2. ✅ Aufgabe 1 & 2: Wochen-/Monatsansicht-Endpunkte - BEREITS IMPLEMENTIERT (nur prüfen)
3. ✅ Aufgabe 2: `/api/v1/auth/session` - BEREITS IMPLEMENTIERT (nur prüfen)

### Nächste Woche:
5. ✅ Aufgabe 6: Datenbank-Indizes (Junior Backend)

### Optional (Backlog):
6. ✅ Aufgabe 5: Buchungs-Bearbeitung (Senior Fullstack)

---

## 🧪 Testing

### Manuelle Tests nach Implementierung:

1. **Wochenansicht:**
   - Öffne App → "Arbeitswoche" Tab
   - Prüfe ob Buchungen geladen werden
   - Prüfe Navigation (vor/zurück)

2. **Monatsansicht:**
   - Öffne App → "Monatsübersicht" Tab
   - Prüfe ob Buchungen geladen werden
   - Prüfe Navigation (vor/zurück)

3. **Authentifizierung:**
   - Öffne App → Klicke "Anmelden"
   - Prüfe ob Login funktioniert
   - Prüfe ob Benutzername angezeigt wird
   - Prüfe ob Logout funktioniert

4. **Admin-Bereich:**
   - Öffne `/admin.html`
   - Prüfe ob Session-Prüfung funktioniert
   - Prüfe ob Admin-Bereich geladen wird

---

## 📝 Notizen

- Alle Endpunkte müssen im `apiV1` Router implementiert werden
- Response-Format muss dem Standard entsprechen: `{ success: true, data: ... }`
- Fehlerbehandlung muss konsistent sein
- Logging sollte für alle Endpunkte implementiert werden
- Validierung sollte vorhanden sein

---

## ✅ Checkliste

### Junior Backend Entwickler:
- [x] Aufgabe 1: Wochenansicht-Endpunkt - BEREITS IMPLEMENTIERT
- [x] Aufgabe 2: Monatsansicht-Endpunkt - BEREITS IMPLEMENTIERT
- [ ] Tests durchgeführt (falls Probleme auftreten)
- [ ] Code-Review durchgeführt (optional)

### Senior Fullstack Developer:
- [ ] Aufgabe 1: `/api/v1/auth/me` implementiert - **FEHLT NOCH**
- [x] Aufgabe 2: `/api/v1/auth/session` - BEREITS IMPLEMENTIERT
- [ ] Tests durchgeführt
- [ ] Code-Review durchgeführt

---

**Nächste Schritte:**
1. Junior Backend startet mit Aufgabe 1 und 2
2. Senior Fullstack startet mit Aufgabe 3 und 4
3. Nach Implementierung: Manuelle Tests durchführen
4. Code-Review durchführen
5. Dokumentation aktualisieren

---

*Erstellt am: [Datum]*  
*Zuletzt aktualisiert: [Datum]*

