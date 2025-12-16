# 🚀 Verbesserungsvorschläge aus Stresstest

**Erstellt:** 2025-12-16  
**Basierend auf:** Stresstest mit 20 Benutzern

---

## 📊 Stresstest-Erkenntnisse

### Aktuelle Performance
- ✅ **Sehr gut:** Durchschnittliche Response-Zeit: 7.68ms
- ✅ **Stabil:** Keine Server-Crashes oder Timeouts
- ⚠️ **Rate-Limiting:** 429-Fehler bei hoher Last
- ⚠️ **Fehlerrate:** 76.67% (hauptsächlich erwartete Validierungsfehler)

---

## 🎯 Konkrete Verbesserungsvorschläge

### 1. ⚡ Performance-Optimierungen

#### 1.1 Datenbank-Indizes prüfen
**Problem:** Bei vielen gleichzeitigen Buchungen könnten Datenbank-Abfragen langsam werden

**Lösung:**
- Prüfe ob alle wichtigen Indizes vorhanden sind
- Composite-Indizes für häufige Abfragen erstellen
- Beispiel: `(user_name, date, slot)` für Doppelbuchungs-Prüfung

**Datei:** `server.js` (initDatabase-Funktion)

**Priorität:** 🟡 Mittel

---

#### 1.2 Datenbank-Connection-Pooling
**Problem:** Jede Abfrage öffnet möglicherweise eine neue Verbindung

**Lösung:**
- SQLite unterstützt zwar kein echtes Connection-Pooling
- Aber: WAL-Mode ist bereits aktiviert (gut!)
- Prüfe ob `PRAGMA busy_timeout` gesetzt ist

**Datei:** `server.js` (createDatabaseConnection)

**Priorität:** 🟡 Mittel

---

### 2. 🛡️ Rate-Limiting verbessern

#### 2.1 Rate-Limiting zu restriktiv
**Problem:** 429-Fehler bei Stresstest (zu viele Anfragen)

**Aktueller Code:**
```javascript
'POST:/api/bookings': { maxRequests: 10, windowMs: 60 * 60 * 1000 } // 10 pro Stunde
```

**Lösung:**
- Erhöhe Limits für normale Nutzung
- Oder: Unterscheide zwischen verschiedenen Endpunkten
- Beispiel: GET-Requests weniger restriktiv als POST

**Datei:** `server.js` (rateLimitConfig)

**Priorität:** 🟡 Mittel

**Vorschlag:**
```javascript
'POST:/api/v1/bookings': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 pro Stunde
'GET:/api/v1/bookings': { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 pro 15 Min
```

---

#### 2.2 Rate-Limiting pro Benutzer statt global
**Problem:** Aktuelles Rate-Limiting ist global (IP-basiert)

**Lösung:**
- Rate-Limiting pro `user_name` implementieren
- Verhindert, dass ein Benutzer das System überlastet
- Andere Benutzer werden nicht beeinträchtigt

**Priorität:** 🟢 Niedrig (nice-to-have)

---

### 3. 📝 Fehlerbehandlung verbessern

#### 3.1 Fehlermeldungen spezifischer machen
**Problem:** Viele 400-Fehler, aber nicht immer klar warum

**Lösung:**
- Fehlermeldungen sollten spezifischer sein
- Beispiel: "Sie haben bereits 2 Waschmaschinen-Slots gebucht" statt nur "Limit erreicht"
- Zeige welche Regel verletzt wurde

**Status:** ✅ Bereits gut implementiert!

**Priorität:** ✅ Erledigt

---

#### 3.2 Fehler-Logging verbessern
**Problem:** Bei vielen gleichzeitigen Requests schwer zu debuggen

**Lösung:**
- Request-ID zu jedem Request hinzufügen
- Logs mit Request-ID versehen
- Erleichtert Debugging bei hoher Last

**Priorität:** 🟡 Mittel

**Beispiel:**
```javascript
// Middleware für Request-ID
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});
```

---

### 4. 🔄 Optimistische Locking für Buchungen

#### 4.1 Race Conditions verhindern
**Problem:** Bei gleichzeitigen Buchungen könnten Race Conditions auftreten

**Lösung:**
- Transaktionen für Buchungs-Erstellung verwenden
- Prüfe ob bereits implementiert (wahrscheinlich ja, da SQLite)
- Explizite Transaktionen für kritische Operationen

**Priorität:** 🔴 Hoch (wichtig für Datenintegrität)

**Beispiel:**
```javascript
await dbHelper.run('BEGIN TRANSACTION');
// Prüfungen...
// Buchung erstellen...
await dbHelper.run('COMMIT');
```

---

### 5. 📊 Monitoring & Metriken

#### 5.1 Performance-Metriken sammeln
**Problem:** Keine Langzeit-Metriken über Performance

**Lösung:**
- Metriken-System erweitern (ist bereits vorhanden!)
- Langzeit-Trends tracken
- Alerts bei Performance-Degradation

**Status:** ✅ Metriken-System bereits vorhanden

**Priorität:** 🟡 Mittel (erweitern)

---

#### 5.2 Health-Check Endpoint
**Problem:** Keine einfache Möglichkeit, Server-Status zu prüfen

**Lösung:**
- `/health` Endpoint erstellen
- Zeigt: Datenbank-Verbindung, Memory-Usage, Uptime
- Nützlich für Monitoring-Tools

**Priorität:** 🟢 Niedrig

---

### 6. 🧪 Test-Verbesserungen

#### 6.1 Realistischere Test-Szenarien
**Problem:** Stresstest verwendet zufällige Buchungen (viele erwartete Fehler)

**Lösung:**
- Test-Szenarien anpassen:
  - Benutzer buchen sequenziell (nicht alle gleichzeitig)
  - Verschiedene Tage für verschiedene Benutzer
  - Buchungen vor Löschungen erstellen
  - Trocknungsraum-Buchungen nur nach Waschmaschinen-Buchungen

**Priorität:** 🟡 Mittel

---

#### 6.2 Integrationstests
**Problem:** Nur Stresstest vorhanden, keine Integrationstests

**Lösung:**
- Integrationstests für kritische Workflows
- Beispiel: "Benutzer bucht Waschmaschine → bucht Trocknungsraum → löscht Buchung"

**Priorität:** 🟡 Mittel

---

## 🎯 Priorisierte To-Do-Liste

### 🔴 Hoch (Sofort umsetzen)

1. **Transaktionen für Buchungs-Erstellung**
   - Verhindert Race Conditions
   - Wichtig für Datenintegrität
   - **Aufwand:** 1-2 Stunden

2. **Rate-Limiting anpassen**
   - Erhöhe Limits für normale Nutzung
   - **Aufwand:** 30 Minuten

---

### 🟡 Mittel (Diese Woche)

3. **Request-ID für Logging**
   - Erleichtert Debugging
   - **Aufwand:** 1 Stunde

4. **Datenbank-Indizes prüfen/optimieren**
   - Verbessert Performance bei hoher Last
   - **Aufwand:** 1-2 Stunden

5. **Realistischere Test-Szenarien**
   - Bessere Test-Abdeckung
   - **Aufwand:** 2-3 Stunden

---

### 🟢 Niedrig (Nice-to-have)

6. **Rate-Limiting pro Benutzer**
   - Verhindert Missbrauch durch einzelne Benutzer
   - **Aufwand:** 2-3 Stunden

7. **Health-Check Endpoint**
   - Nützlich für Monitoring
   - **Aufwand:** 1 Stunde

8. **Integrationstests**
   - Bessere Test-Abdeckung
   - **Aufwand:** 3-4 Stunden

---

## 📝 Konkrete Code-Änderungen

### Änderung 1: Rate-Limiting anpassen

**Datei:** `server.js` (Zeile ~300-310)

**Aktuell:**
```javascript
'POST:/api/bookings': { maxRequests: 10, windowMs: 60 * 60 * 1000 },
```

**Vorschlag:**
```javascript
'POST:/api/v1/bookings': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 pro Stunde
'GET:/api/v1/bookings': { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 pro 15 Min
'GET:/api/v1/machines': { maxRequests: 200, windowMs: 15 * 60 * 1000 }, // 200 pro 15 Min
'GET:/api/v1/slots': { maxRequests: 200, windowMs: 15 * 60 * 1000 }, // 200 pro 15 Min
```

---

### Änderung 2: Request-ID Middleware

**Datei:** `server.js` (nach Zeile ~280)

**Hinzufügen:**
```javascript
const crypto = require('crypto');

// Request-ID Middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  logger.debug('Request-ID gesetzt', { requestId: req.requestId, path: req.path });
  next();
});
```

---

### Änderung 3: Transaktionen für Buchungen

**Datei:** `server.js` (POST /api/v1/bookings, Zeile ~2957)

**Hinzufügen:**
```javascript
// BEGIN TRANSACTION
await dbHelper.run('BEGIN TRANSACTION');

try {
  // Alle Prüfungen...
  // Buchung erstellen...
  
  // COMMIT
  await dbHelper.run('COMMIT');
} catch (error) {
  // ROLLBACK bei Fehler
  await dbHelper.run('ROLLBACK');
  throw error;
}
```

**Hinweis:** SQLite unterstützt Transaktionen, aber `dbHelper.run()` muss async sein.

---

## 🎯 Nächste Schritte

1. **Sofort umsetzen:**
   - Rate-Limiting anpassen
   - Transaktionen für Buchungen (wenn möglich)

2. **Diese Woche:**
   - Request-ID Middleware
   - Datenbank-Indizes prüfen

3. **Später:**
   - Realistischere Tests
   - Health-Check Endpoint

---

## 📊 Erwartete Verbesserungen

Nach Umsetzung der Hoch-Priorität-Punkte:

- ✅ **Weniger 429-Fehler** (höhere Rate-Limits)
- ✅ **Bessere Datenintegrität** (Transaktionen)
- ✅ **Einfacheres Debugging** (Request-IDs)
- ✅ **Bessere Performance** (optimierte Indizes)

---

**Status:** Bereit für Umsetzung

