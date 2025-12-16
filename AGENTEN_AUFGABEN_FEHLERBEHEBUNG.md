# 🔧 Agenten-Aufgaben: Fehlerbehebung

**Erstellt:** [Aktuelles Datum]  
**Basierend auf:** FEHLERLISTE_FUER_CEO.md  
**Status:** Priorität 2 & 3 Aufgaben zugewiesen

---

## 📊 Übersicht

**Gesamtaufwand:** 12-16 Stunden (Priorität 2) + 20-30 Stunden (Priorität 3)  
**Empfohlener Zeitrahmen:** 1-2 Wochen  
**Status:** ✅ Alle kritischen Fehler behoben

---

## 🔵 Junior Backend Entwickler

### Aufgabe 1: Session-Speicherung auf File-Store umstellen
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Problem:**
- Session-Speicherung verwendet Standard Memory-Store
- Bei Server-Neustart gehen alle Sessions verloren
- Benutzer müssen sich nach jedem Neustart neu einloggen

**Beschreibung:**
- Session-Speicherung auf Dateisystem umstellen
- Sessions überleben Server-Neustart
- Für Produktion: Optional Redis oder SQLite-basierte Session-Store

**Konkrete Tasks:**
- [ ] `session-file-store` Package installieren: `npm install session-file-store`
- [ ] File-Store in `server.js` konfigurieren
- [ ] Sessions-Verzeichnis erstellen (`./sessions`)
- [ ] Session-Konfiguration anpassen (Zeile 116-125)
- [ ] Testen: Session überlebt Server-Neustart
- [ ] `.gitignore` aktualisieren (sessions-Verzeichnis ignorieren)

**Code-Änderung:**
```javascript
// Vorher: Memory-Store
app.use(session({ ... }));

// Nachher: File-Store
const FileStore = require('session-file-store')(session);
app.use(session({
  store: new FileStore({ 
    path: './sessions',
    ttl: 86400, // 24 Stunden
    retries: 1
  }),
  // ... restliche Konfiguration
}));
```

**Datei:** `server.js:116-125`

**Output:**
- File-Store konfiguriert
- Sessions-Verzeichnis erstellt
- Sessions überleben Neustart

**Abnahmekriterien:**
- ✅ Sessions werden in Dateien gespeichert
- ✅ Sessions überleben Server-Neustart
- ✅ Sessions werden nach Timeout automatisch gelöscht
- ✅ Keine Performance-Einbußen
- ✅ `.gitignore` aktualisiert

---

### Aufgabe 2: `/api/v1/auth/me` Endpunkt implementieren
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 30 Minuten  
**Status:** 📋 Bereit zum Start

**Problem:**
- Frontend ruft `/api/v1/auth/me` auf, Endpunkt existiert nicht
- Workaround: Frontend verwendet `/api/v1/auth/session` (erfordert Auth)

**Beschreibung:**
- Endpunkt `GET /api/v1/auth/me` implementieren
- Gibt aktuellen Benutzer zurück oder 401 wenn nicht eingeloggt
- Öffentlicher Endpunkt (keine Auth erforderlich)

**Konkrete Tasks:**
- [ ] Endpunkt `GET /api/v1/auth/me` in `server.js` hinzufügen
- [ ] `getCurrentUser()` Helper-Funktion verwenden
- [ ] Response-Format: `{ user: { id, username, role } }`
- [ ] 401 zurückgeben wenn nicht eingeloggt
- [ ] Endpunkt testen (mit/ohne Session)

**Code-Implementierung:**
```javascript
apiV1.get('/auth/me', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (user) {
      apiResponse.success(res, { 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } else {
      apiResponse.unauthorized(res, 'Nicht authentifiziert');
    }
  } catch (error) {
    logger.error('Fehler beim Abrufen des Benutzers', error);
    apiResponse.error(res, 'Fehler beim Abrufen des Benutzers', 500);
  }
});
```

**Datei:** `server.js` (nach `/auth/logout`)

**Output:**
- `/api/v1/auth/me` Endpunkt implementiert
- Korrekte Response-Formate

**Abnahmekriterien:**
- ✅ Endpunkt gibt Benutzer-Info zurück wenn eingeloggt
- ✅ Endpunkt gibt 401 zurück wenn nicht eingeloggt
- ✅ Response-Format entspricht Frontend-Erwartung
- ✅ Fehlerbehandlung funktioniert

---

### Aufgabe 3: Performance-Middleware Reihenfolge prüfen
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 15 Minuten  
**Status:** 📋 Bereit zum Start

**Problem:**
- Performance-Middleware sollte vor allen Routen aktiviert werden
- Alle Requests sollten getrackt werden

**Beschreibung:**
- Middleware-Reihenfolge prüfen
- Sicherstellen dass Performance-Monitoring alle Requests erfasst

**Konkrete Tasks:**
- [ ] Middleware-Reihenfolge in `server.js` prüfen
- [ ] Performance-Middleware sollte vor API-Routen sein
- [ ] Testen: Alle API-Requests werden getrackt
- [ ] Metriken-Endpunkt prüfen

**Datei:** `server.js:3298` (Status: Bereits korrigiert, aber prüfen)

**Output:**
- Bestätigung dass Middleware-Reihenfolge korrekt ist

**Abnahmekriterien:**
- ✅ Alle API-Requests werden getrackt
- ✅ Metriken-Endpunkt zeigt korrekte Daten
- ✅ Middleware-Reihenfolge ist optimal

---

### Aufgabe 4: Transaktionen für kritische Operationen (Optional)
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Optional

**Problem:**
- Keine Transaktionen für komplexe DB-Operationen
- Bei Fehlern könnten inkonsistente Zustände entstehen

**Beschreibung:**
- Transaktionen für kritische Operationen implementieren
- Rollback bei Fehlern

**Konkrete Tasks:**
- [ ] Transaktionen für Buchung erstellen
- [ ] Transaktionen für Admin-Operationen (Maschine löschen + Buchungen)
- [ ] Rollback bei Fehlern implementieren
- [ ] Tests für Transaktionen

**Datei:** `server.js` (Buchungs-Endpunkte)

**Output:**
- Transaktions-Logik für kritische Operationen

**Abnahmekriterien:**
- ✅ Transaktionen funktionieren
- ✅ Rollback bei Fehlern
- ✅ Datenkonsistenz gewährleistet

---

## 🟣 Junior Frontend Entwickler

### Aufgabe 5: Admin-Bereich Fehlerbehandlung verbessern
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Problem:**
- `checkSession()` in `admin.js` hat keine Fehlerbehandlung
- Event-Listener werden ohne Null-Checks registriert
- Admin-Bereich könnte bei Fehlern abstürzen

**Beschreibung:**
- Try-Catch um alle async-Funktionen
- Null-Checks für alle DOM-Elemente
- Fallback-UI bei Fehlern

**Konkrete Tasks:**
- [ ] Try-Catch um `checkSession()` und alle async-Funktionen
- [ ] Null-Checks für alle DOM-Elemente vor Verwendung
- [ ] Error-Handler für alle Event-Listener
- [ ] Fallback-UI bei Fehlern anzeigen
- [ ] User-freundliche Fehlermeldungen

**Code-Änderung:**
```javascript
// Vorher:
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  setupEventListeners();
});

// Nachher:
document.addEventListener('DOMContentLoaded', () => {
  checkSession().catch(error => {
    console.error('Fehler beim Prüfen der Session:', error);
    showError('Fehler beim Laden. Bitte Seite neu laden.');
  });
  
  try {
    setupEventListeners();
  } catch (error) {
    console.error('Fehler beim Setup:', error);
    showError('Fehler beim Initialisieren der Seite.');
  }
});
```

**Datei:** `public/js/admin.js:9-12`

**Output:**
- Verbesserte Fehlerbehandlung im Admin-Bereich
- Robusteres Error-Handling

**Abnahmekriterien:**
- ✅ Keine unhandled Promise Rejections
- ✅ Fehlermeldungen werden dem Benutzer angezeigt
- ✅ App stürzt nicht ab bei Netzwerkfehlern
- ✅ Null-Checks für alle DOM-Elemente
- ✅ Fallback-UI funktioniert

---

### Aufgabe 6: Console.log Aufräumen
**Priorität:** 🟡 Mittel  
**Geschätzte Dauer:** 1-2 Stunden  
**Status:** 📋 Bereit zum Start

**Problem:**
- Viele `console.log/error/warn` Aufrufe im Frontend
- Könnten sensible Informationen in Browser-Console preisgeben
- Unprofessionell in Produktion

**Beschreibung:**
- Console-Logs durch strukturiertes Logging ersetzen
- Oder: Console-Logs nur in Development-Modus
- Sensible Daten nicht loggen

**Konkrete Tasks:**
- [ ] Alle Console-Logs in Frontend-Dateien finden (~59 Aufrufe)
- [ ] Logging-Helper-Funktion erstellen:
  ```javascript
  const isDevelopment = window.location.hostname === 'localhost';
  function log(...args) {
    if (isDevelopment) {
      console.log(...args);
    }
  }
  ```
- [ ] Sensible Daten identifizieren und entfernen
- [ ] Console-Logs durch Helper-Funktion ersetzen
- [ ] Production-Build testen (keine Logs)

**Dateien:** `public/js/*.js` (app.js, admin.js, api.js, monitoring.js)

**Output:**
- Aufgeräumte Console-Logs
- Logging-Helper implementiert
- Keine sensiblen Daten in Logs

**Abnahmekriterien:**
- ✅ Keine sensiblen Daten in Console-Logs
- ✅ Production-Build ohne Debug-Logs
- ✅ Development-Logs funktionieren weiterhin
- ✅ Strukturiertes Logging für Monitoring (optional)

---

### Aufgabe 7: Cleanup-Funktionen für Event-Listener (Optional)
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 2-3 Stunden  
**Status:** 📋 Optional

**Problem:**
- Event-Listener werden nicht explizit entfernt
- Könnte zu Memory-Leaks führen bei Single-Page-App

**Beschreibung:**
- Cleanup-Funktionen implementieren
- Event-Listener bei Komponenten-Wechsel entfernen

**Konkrete Tasks:**
- [ ] Alle Event-Listener identifizieren
- [ ] Cleanup-Funktionen für Modals implementieren
- [ ] Event-Listener bei Modal-Schließung entfernen
- [ ] Memory-Leak-Tests durchführen

**Datei:** `public/js/app.js`

**Output:**
- Cleanup-Funktionen implementiert
- Keine Memory-Leaks

**Abnahmekriterien:**
- ✅ Event-Listener werden entfernt
- ✅ Keine Memory-Leaks
- ✅ Cleanup-Funktionen sind dokumentiert

---

## 🟢 Senior Fullstack Developer

### Aufgabe 8: Monitoring-Dashboard erstellen (Optional)
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 4-6 Stunden  
**Status:** 📋 Optional

**Problem:**
- Monitoring-Metriken vorhanden, aber kein Dashboard
- Metriken nur über API abrufbar

**Beschreibung:**
- HTML-Dashboard-Seite erstellen
- Visualisierung der Metriken (Charts, Tabellen)
- Auto-Refresh alle 30 Sekunden

**Konkrete Tasks:**
- [ ] `public/monitoring.html` erstellen
- [ ] Dashboard-Layout mit Metriken-Anzeige
- [ ] API-Calls für Metriken implementieren
- [ ] Charts/Tabellen für Visualisierung
- [ ] Auto-Refresh implementieren (30 Sekunden)
- [ ] Responsive Design

**Datei:** `public/monitoring.html` (NEU)

**Output:**
- Monitoring-Dashboard
- Visualisierte Metriken
- Auto-Refresh

**Abnahmekriterien:**
- ✅ Dashboard zeigt alle Metriken
- ✅ Visualisierung ist übersichtlich
- ✅ Auto-Refresh funktioniert
- ✅ Responsive Design

---

### Aufgabe 9: TypeScript oder JSDoc einführen (Optional)
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 8-12 Stunden  
**Status:** 📋 Optional

**Problem:**
- Keine Typisierung vorhanden
- Schwerer zu warten, mehr Fehler möglich

**Beschreibung:**
- Option A: TypeScript einführen (größerer Aufwand)
- Option B: JSDoc-Typen hinzufügen (weniger Aufwand)

**Empfehlung:** JSDoc für schnelle Verbesserung

**Konkrete Tasks:**
- [ ] Entscheidung: TypeScript oder JSDoc
- [ ] JSDoc-Typen für alle Funktionen hinzufügen
- [ ] Oder: TypeScript-Setup und Migration
- [ ] Type-Checking in CI/CD integrieren

**Output:**
- Typisierte Codebase
- Bessere IDE-Unterstützung

**Abnahmekriterien:**
- ✅ Alle Funktionen sind typisiert
- ✅ Type-Checking funktioniert
- ✅ IDE zeigt Typen korrekt an

---

## 🟡 Junior QA und Dokumentation

### Aufgabe 10: Unit-Tests erweitern (Optional)
**Priorität:** 🟢 Niedrig  
**Geschätzte Dauer:** 8-12 Stunden  
**Status:** 📋 Optional

**Problem:**
- Tests vorhanden, aber Coverage könnte höher sein
- Edge-Cases nicht vollständig abgedeckt

**Beschreibung:**
- Unit-Tests für alle Validierungs-Funktionen
- Integration-Tests für alle API-Endpunkte
- Frontend-Tests für kritische User-Flows

**Konkrete Tasks:**
- [ ] Test-Coverage analysieren
- [ ] Unit-Tests für Validierungs-Funktionen
- [ ] Integration-Tests für alle Endpunkte
- [ ] Frontend-Tests für kritische Flows
- [ ] Edge-Cases testen
- [ ] Coverage-Report generieren

**Dateien:** `tests/unit/*.test.js`, `tests/integration/*.test.js`

**Output:**
- Erweiterte Test-Suite
- Höhere Test-Coverage
- Edge-Cases abgedeckt

**Abnahmekriterien:**
- ✅ Test-Coverage > 70%
- ✅ Alle kritischen Funktionen getestet
- ✅ Edge-Cases abgedeckt
- ✅ Tests laufen in CI/CD

---

## 🔧 DevOps / Backend

### Aufgabe 11: CORS-Konfiguration für Produktion
**Priorität:** 🟡 Mittel (🔴 Hoch für Produktion)  
**Geschätzte Dauer:** 30 Minuten  
**Status:** 📋 Bereit zum Start

**Problem:**
- CORS erlaubt aktuell alle Origins (`*`)
- In Produktion sollte auf spezifische Domains beschränkt werden
- Sicherheitsrisiko

**Beschreibung:**
- Environment-Variable `ALLOWED_ORIGIN` dokumentieren
- In Produktion auf spezifische Domains setzen
- Development: `localhost` erlauben

**Konkrete Tasks:**
- [ ] Environment-Variable dokumentieren
- [ ] `.env.example` erstellen/aktualisieren
- [ ] CORS-Konfiguration prüfen (bereits verbessert)
- [ ] Deployment-Dokumentation aktualisieren
- [ ] Produktions-Konfiguration testen

**Datei:** `server.js:90-96` (Status: Bereits verbessert)

**Output:**
- Dokumentierte CORS-Konfiguration
- `.env.example` aktualisiert

**Abnahmekriterien:**
- ✅ CORS in Produktion auf spezifische Domains beschränkt
- ✅ Development-Umgebung funktioniert weiterhin
- ✅ Dokumentation vorhanden
- ✅ `.env.example` aktualisiert

---

## 📊 Priorisierung & Zeitplan

### Woche 1: Priorität 2 (Sofort)
**Aufwand:** ~6-8 Stunden

**Tag 1-2:**
1. ✅ **Aufgabe 1:** Session-Speicherung (Junior Backend) - 1-2h
2. ✅ **Aufgabe 2:** `/api/v1/auth/me` Endpunkt (Junior Backend) - 30min
3. ✅ **Aufgabe 5:** Admin-Bereich Fehlerbehandlung (Junior Frontend) - 1-2h

**Tag 3-4:**
4. ✅ **Aufgabe 11:** CORS-Konfiguration (DevOps/Backend) - 30min
5. ✅ **Aufgabe 6:** Console.log Aufräumen (Junior Frontend) - 1-2h
6. ✅ **Aufgabe 3:** Performance-Middleware prüfen (Junior Backend) - 15min

### Woche 2: Priorität 3 (Optional)
**Aufwand:** ~12-20 Stunden

1. ✅ **Aufgabe 8:** Monitoring-Dashboard (Senior Fullstack) - 4-6h
2. ✅ **Aufgabe 4:** Transaktionen (Junior Backend) - 2-3h
3. ✅ **Aufgabe 7:** Cleanup-Funktionen (Junior Frontend) - 2-3h
4. ✅ **Aufgabe 9:** TypeScript/JSDoc (Senior Fullstack) - 8-12h

### Langfristig (Optional)
**Aufwand:** ~8-12 Stunden

1. ✅ **Aufgabe 10:** Unit-Tests erweitern (Junior QA) - 8-12h

---

## 🎯 Sofort starten mit (Top 3)

### 1. Session-Speicherung (Junior Backend)
- 🟡 Mittel-Priorität
- 1-2 Stunden
- Wichtige Stabilität-Verbesserung

### 2. `/api/v1/auth/me` Endpunkt (Junior Backend)
- 🟡 Mittel-Priorität
- 30 Minuten
- Schnell umsetzbar, hoher Impact

### 3. Admin-Bereich Fehlerbehandlung (Junior Frontend)
- 🟡 Mittel-Priorität
- 1-2 Stunden
- Wichtige Stabilität-Verbesserung

**Gesamtzeit für Top 3:** ~3-5 Stunden  
**Impact:** Hoch (Stabilität + Funktionalität)

---

## ✅ Checkliste

### Priorität 2 (Diese Woche):
- [ ] Aufgabe 1: Session-Speicherung
- [ ] Aufgabe 2: `/api/v1/auth/me` Endpunkt
- [ ] Aufgabe 3: Performance-Middleware prüfen
- [ ] Aufgabe 5: Admin-Bereich Fehlerbehandlung
- [ ] Aufgabe 6: Console.log Aufräumen
- [ ] Aufgabe 11: CORS-Konfiguration

### Priorität 3 (Optional):
- [ ] Aufgabe 4: Transaktionen
- [ ] Aufgabe 7: Cleanup-Funktionen
- [ ] Aufgabe 8: Monitoring-Dashboard
- [ ] Aufgabe 9: TypeScript/JSDoc
- [ ] Aufgabe 10: Unit-Tests erweitern

---

*Aufgaben erstellt am: [Datum]*  
*Basierend auf: FEHLERLISTE_FUER_CEO.md*

