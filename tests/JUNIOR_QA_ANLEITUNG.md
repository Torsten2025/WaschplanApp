# Anleitung für Junior QA - Automatisierte Tests

## 🎯 Ziel dieser Anleitung

Diese Anleitung hilft Junior QA Engineers dabei, die automatisierte Test-Suite zu verstehen und zu verwenden.

**Zeitaufwand:** 30-60 Minuten für erste Einarbeitung

---

## 📋 Schritt 1: Setup (5 Minuten)

### 1.1 Node.js installieren

**Windows:**
1. Gehe zu https://nodejs.org/
2. Lade die LTS-Version herunter
3. Installiere Node.js (Standard-Einstellungen sind OK)
4. Öffne PowerShell/Terminal
5. Prüfe Installation: `node --version` (sollte z.B. v18.x.x zeigen)

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
sudo apt install nodejs npm
```

### 1.2 Projekt öffnen

1. Öffne das Projektverzeichnis im Terminal
2. Navigiere zum Projektordner:
   ```bash
   cd WaschmaschinenApp
   ```

### 1.3 Dependencies installieren

```bash
npm install
```

**Was passiert hier?**
- Installiert alle benötigten Pakete (Jest, Supertest, etc.)
- Erstellt `node_modules` Ordner
- Dauert 1-2 Minuten

---

## 📋 Schritt 2: Erste Tests ausführen (5 Minuten)

### 2.1 Alle Tests ausführen

```bash
npm test
```

**Was passiert hier?**
- Jest führt alle Tests aus
- Zeigt Ergebnisse an
- Erstellt Coverage-Report

**Erwartetes Ergebnis:**
```
PASS  tests/unit/validation.test.js
PASS  tests/integration/api.test.js

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
```

### 2.2 Coverage-Report ansehen

```bash
npm run test:coverage
```

**Was passiert hier?**
- Führt Tests mit Coverage-Analyse aus
- Erstellt detaillierten Report
- Zeigt Coverage in Prozent

**Erwartetes Ergebnis:**
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
server.js |   75.5  |   68.2   |   72.3  |   75.1
```

---

## 📋 Schritt 3: Tests verstehen (15 Minuten)

### 3.1 Unit-Tests anschauen

Öffne: `tests/unit/validation.test.js`

**Was wird getestet?**
- `isValidSlot()` - Prüft ob Slot gültig ist
- `isValidDate()` - Prüft ob Datum gültig ist
- `validateAndTrimString()` - Prüft und bereinigt Strings
- `validateInteger()` - Prüft ob Zahl gültig ist

**Beispiel-Test:**
```javascript
test('sollte gültige Slots akzeptieren', () => {
  expect(isValidSlot('08:00-10:00')).toBe(true);
  expect(isValidSlot('10:00-12:00')).toBe(true);
});
```

**Was bedeutet das?**
- Test prüft, ob die Funktion `isValidSlot()` korrekt funktioniert
- Erwartet: `true` für gültige Slots
- Wenn Test grün: ✅ Funktion funktioniert
- Wenn Test rot: ❌ Funktion hat einen Fehler

### 3.2 Integration-Tests anschauen

Öffne: `tests/integration/api.test.js`

**Was wird getestet?**
- API-Endpunkte (GET, POST, DELETE)
- Vollständige Request/Response-Zyklen
- Datenbank-Interaktionen

**Beispiel-Test:**
```javascript
test('sollte alle Maschinen zurückgeben', async () => {
  const response = await request(app)
    .get('/api/v1/machines')
    .expect(200);
  
  expect(response.body.success).toBe(true);
});
```

**Was bedeutet das?**
- Sendet GET-Request an `/api/v1/machines`
- Erwartet Status Code 200 (OK)
- Prüft, ob Response `success: true` hat
- Wenn Test grün: ✅ API funktioniert
- Wenn Test rot: ❌ API hat einen Fehler

---

## 📋 Schritt 4: Tests ausführen - Verschiedene Modi (10 Minuten)

### 4.1 Watch-Mode (für Entwicklung)

```bash
npm run test:watch
```

**Was passiert hier?**
- Tests laufen im Hintergrund
- Starten automatisch neu bei Code-Änderungen
- Perfekt für Entwicklung

**Beenden:** `Ctrl+C`

### 4.2 Nur Unit-Tests

```bash
npm run test:unit
```

**Was passiert hier?**
- Führt nur Unit-Tests aus
- Schneller als alle Tests
- Gut für schnelle Checks

### 4.3 Nur Integration-Tests

```bash
npm run test:integration
```

**Was passiert hier?**
- Führt nur Integration-Tests aus
- Testet API-Endpunkte
- Dauert etwas länger

---

## 📋 Schritt 5: Test-Ergebnisse interpretieren (10 Minuten)

### 5.1 Erfolgreiche Tests

```
✓ sollte gültige Slots akzeptieren (5ms)
✓ sollte ungültige Slots ablehnen (3ms)
```

**Bedeutung:**
- ✅ Alle Tests bestanden
- Code funktioniert wie erwartet
- Keine Aktion erforderlich

### 5.2 Fehlgeschlagene Tests

```
✕ sollte ungültige Slots ablehnen (3ms)

  expect(received).toBe(expected)

  Expected: false
  Received: true

  at Object.<anonymous> (validation.test.js:74:5)
```

**Bedeutung:**
- ❌ Test ist fehlgeschlagen
- Funktion gibt `true` zurück, sollte aber `false` sein
- Code hat einen Fehler

**Was tun?**
1. Fehlermeldung lesen
2. Code prüfen (hier: `validation.test.js` Zeile 74)
3. Problem identifizieren
4. Fix implementieren
5. Tests erneut ausführen

### 5.3 Coverage-Report verstehen

```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
server.js |   75.5  |   68.2   |   72.3  |   75.1
```

**Bedeutung:**
- **% Stmts:** Wie viel Prozent des Codes wurde ausgeführt
- **% Branch:** Wie viel Prozent der if/else Zweige wurden getestet
- **% Funcs:** Wie viel Prozent der Funktionen wurden getestet
- **% Lines:** Wie viel Prozent der Zeilen wurden ausgeführt

**Ziel:** Mindestens 60% in allen Kategorien

---

## 📋 Schritt 6: Eigene Tests schreiben (20 Minuten)

### 6.1 Neuen Unit-Test schreiben

**Datei:** `tests/unit/validation.test.js`

**Beispiel:**
```javascript
describe('Meine neue Funktion', () => {
  test('sollte erwartetes Verhalten zeigen', () => {
    const input = 'test';
    const result = meineFunktion(input);
    expect(result).toBe('erwartetes Ergebnis');
  });
});
```

### 6.2 Neuen Integration-Test schreiben

**Datei:** `tests/integration/api.test.js`

**Beispiel:**
```javascript
describe('GET /api/v1/mein-endpunkt', () => {
  test('sollte korrekt funktionieren', async () => {
    const response = await request(app)
      .get('/api/v1/mein-endpunkt')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});
```

### 6.3 Test ausführen

```bash
npm test
```

---

## 🐛 Häufige Probleme & Lösungen

### Problem 1: "Cannot find module 'jest'"

**Lösung:**
```bash
npm install
```

### Problem 2: "Port already in use"

**Lösung:**
- Test-Server verwendet keinen Port (in-memory)
- Falls Problem: Anderen Prozess beenden

### Problem 3: Tests schlagen fehl

**Lösung:**
1. Fehlermeldung genau lesen
2. Code prüfen
3. Team fragen

### Problem 4: "Database is locked"

**Lösung:**
```bash
# Test-Datenbank manuell löschen
rm test-waschmaschine.db
npm test
```

---

## ✅ Checkliste: Erste Woche

- [ ] Node.js installiert
- [ ] Dependencies installiert (`npm install`)
- [ ] Alle Tests erfolgreich ausgeführt (`npm test`)
- [ ] Coverage-Report verstanden
- [ ] Unit-Tests verstanden
- [ ] Integration-Tests verstanden
- [ ] Eigener Test geschrieben
- [ ] Watch-Mode ausprobiert

---

## 📚 Nützliche Ressourcen

### Jest-Dokumentation
- https://jestjs.io/docs/getting-started
- https://jestjs.io/docs/api

### Supertest-Dokumentation
- https://github.com/visionmedia/supertest

### JavaScript Grundlagen
- https://developer.mozilla.org/de/docs/Web/JavaScript

---

## 🎓 Übungsaufgaben

### Aufgabe 1: Test verstehen
1. Öffne `tests/unit/validation.test.js`
2. Finde den Test "sollte gültige Slots akzeptieren"
3. Erkläre, was dieser Test macht

### Aufgabe 2: Test ausführen
1. Führe nur Unit-Tests aus: `npm run test:unit`
2. Zähle, wie viele Tests bestanden sind
3. Prüfe, ob alle Tests grün sind

### Aufgabe 3: Eigener Test
1. Schreibe einen neuen Test für `isValidSlot()`
2. Teste einen ungültigen Slot: `'25:00-27:00'`
3. Erwarte: `false`
4. Führe Test aus

### Aufgabe 4: Coverage verbessern
1. Führe Coverage-Report aus: `npm run test:coverage`
2. Finde eine Funktion mit niedriger Coverage
3. Schreibe einen Test für diese Funktion
4. Prüfe, ob Coverage gestiegen ist

---

## 💡 Tipps für Junior QA

1. **Starte klein:** Beginne mit Unit-Tests, dann Integration-Tests
2. **Lies Fehlermeldungen:** Sie sagen dir genau, was falsch ist
3. **Frag nach:** Wenn du nicht weiterkommst, frag das Team
4. **Übe regelmäßig:** Schreibe jeden Tag einen kleinen Test
5. **Verstehe den Code:** Bevor du testest, verstehe was der Code macht

---

## 🚀 Nächste Schritte

Nach dieser Anleitung solltest du:
- ✅ Tests ausführen können
- ✅ Test-Ergebnisse verstehen
- ✅ Eigene Tests schreiben können
- ✅ Coverage-Report interpretieren können

**Viel Erfolg! 🎉**

