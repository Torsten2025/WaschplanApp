# Test-Suite Dokumentation - Für Junior QA

## Übersicht

Diese Test-Suite enthält automatisierte Tests für die Waschmaschinen-Buchungsapp. Die Tests prüfen die Funktionalität der API und der Validierungsfunktionen.

**Zielgruppe:** Junior QA Engineers  
**Test-Framework:** Jest  
**Sprache:** JavaScript

---

## Voraussetzungen

### Installation

1. **Node.js installieren** (Version 14 oder höher)
   - Download: https://nodejs.org/
   - Installation prüfen: `node --version`

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Test-Framework ist bereits konfiguriert:**
   - Jest (Test-Framework)
   - Supertest (für API-Tests)

---

## Test-Struktur

```
tests/
├── unit/              # Unit-Tests (einzelne Funktionen)
│   └── validation.test.js
├── integration/       # Integration-Tests (API-Endpunkte)
│   └── api.test.js
├── performance/      # Performance-Tests
│   └── load.test.js
├── helpers/          # Test-Hilfsfunktionen
│   └── test-server.js
├── setup.js          # Jest Setup-Datei
└── README.md         # Diese Datei
```

---

## Tests ausführen

### Alle Tests ausführen

```bash
npm test
```

Dies führt alle Tests aus und zeigt eine Coverage-Übersicht.

### Nur Unit-Tests

```bash
npm run test:unit
```

### Nur Integration-Tests

```bash
npm run test:integration
```

### Tests im Watch-Mode (automatisches Neustarten bei Änderungen)

```bash
npm run test:watch
```

### Tests mit Coverage-Report

```bash
npm run test:coverage
```

Dies erstellt einen detaillierten Coverage-Report im Ordner `coverage/`.

---

## Test-Kategorien

### 1. Unit-Tests (`tests/unit/`)

**Was wird getestet?**
- Validierungsfunktionen
- Einzelne Funktionen isoliert

**Beispiel:**
```javascript
test('sollte gültige Slots akzeptieren', () => {
  expect(isValidSlot('08:00-10:00')).toBe(true);
});
```

**Ausführen:**
```bash
npm run test:unit
```

---

### 2. Integration-Tests (`tests/integration/`)

**Was wird getestet?**
- API-Endpunkte
- Vollständige Request/Response-Zyklen
- Datenbank-Interaktionen

**Beispiel:**
```javascript
test('sollte alle Maschinen zurückgeben', async () => {
  const response = await request(app)
    .get('/api/v1/machines')
    .expect(200);
  
  expect(response.body.success).toBe(true);
});
```

**Ausführen:**
```bash
npm run test:integration
```

---

### 3. Performance-Tests (`tests/performance/`)

**Was wird getestet?**
- Response-Zeiten
- Concurrent Requests
- Memory Usage

**Hinweis:** Diese Tests sollten nicht in CI/CD ausgeführt werden, da sie den Server belasten.

---

## Test-Ergebnisse verstehen

### Erfolgreicher Test

```
✓ sollte gültige Slots akzeptieren (5ms)
```

### Fehlgeschlagener Test

```
✕ sollte ungültige Slots ablehnen (3ms)

  expect(received).toBe(expected) // Object.is equality

  Expected: false
  Received: true
```

### Coverage-Report

Nach `npm run test:coverage` wird ein Report erstellt:

```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
server.js |   75.5  |   68.2   |   72.3  |   75.1
```

**Ziel:** Mindestens 60% Coverage in allen Kategorien.

---

## Neue Tests schreiben

### Unit-Test Beispiel

```javascript
describe('Meine Funktion', () => {
  test('sollte erwartetes Verhalten zeigen', () => {
    const result = meineFunktion(input);
    expect(result).toBe(expected);
  });
});
```

### Integration-Test Beispiel

```javascript
describe('GET /api/v1/mein-endpunkt', () => {
  test('sollte korrekt funktionieren', async () => {
    const response = await request(app)
      .get('/api/v1/mein-endpunkt')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

---

## Häufige Probleme

### Problem 1: Tests schlagen fehl wegen Datenbank

**Fehlermeldung:**
```
Error: SQLITE_BUSY: database is locked
```

**Lösung:**
- Test-Datenbank wird automatisch erstellt und gelöscht
- Falls Problem besteht: `test-waschmaschine.db` manuell löschen

---

### Problem 2: Port bereits belegt

**Fehlermeldung:**
```
Error: listen EADDRINUSE: address already in use
```

**Lösung:**
- Test-Server verwendet keinen Port (in-memory)
- Falls Problem: Anderen Prozess auf Port 3000 beenden

---

### Problem 3: Dependencies fehlen

**Fehlermeldung:**
```
Cannot find module 'jest'
```

**Lösung:**
```bash
npm install
```

---

## Test-Coverage Ziele

| Kategorie | Ziel | Aktuell |
|-----------|------|---------|
| Statements | 60% | ___% |
| Branches | 60% | ___% |
| Functions | 60% | ___% |
| Lines | 60% | ___% |

**Prüfen:**
```bash
npm run test:coverage
```

---

## Best Practices

1. **Tests sollten schnell sein** - Unit-Tests < 1 Sekunde
2. **Tests sollten isoliert sein** - Keine Abhängigkeiten zwischen Tests
3. **Tests sollten deterministisch sein** - Immer gleiche Ergebnisse
4. **Tests sollten lesbar sein** - Klare Test-Namen und Struktur
5. **Tests sollten wartbar sein** - Einfach zu aktualisieren

---

## Nützliche Jest-Befehle

### Nur Tests mit bestimmten Namen

```bash
npm test -- -t "sollte gültige"
```

### Tests in bestimmter Datei

```bash
npm test -- validation.test.js
```

### Verbose Output

```bash
npm test -- --verbose
```

### Tests stoppen nach erstem Fehler

```bash
npm test -- --bail
```

---

## Test-Datenbank

- **Pfad:** `test-waschmaschine.db`
- **Wird automatisch erstellt** beim Test-Start
- **Wird automatisch gelöscht** nach Tests
- **Enthält Seed-Daten:** 4 Maschinen (3 Waschmaschinen, 1 Trocknungsraum)

---

## Hilfe & Support

Bei Fragen:
1. Diese README lesen
2. Jest-Dokumentation: https://jestjs.io/docs/getting-started
3. Team kontaktieren

---

## Checkliste für neue Features

Wenn ein neues Feature hinzugefügt wird:

- [ ] Unit-Tests für neue Funktionen geschrieben
- [ ] Integration-Tests für neue API-Endpunkte geschrieben
- [ ] Tests erfolgreich ausgeführt
- [ ] Coverage-Ziel erreicht (60%+)
- [ ] Tests dokumentiert

---

## Beispiel: Vollständiger Test-Workflow

```bash
# 1. Dependencies installieren
npm install

# 2. Alle Tests ausführen
npm test

# 3. Coverage prüfen
npm run test:coverage

# 4. Nur Unit-Tests
npm run test:unit

# 5. Nur Integration-Tests
npm run test:integration

# 6. Tests im Watch-Mode (für Entwicklung)
npm run test:watch
```

---

## Nächste Schritte

1. ✅ Tests ausführen und verstehen
2. ✅ Coverage-Report analysieren
3. ✅ Neue Tests für neue Features schreiben
4. ✅ Tests in CI/CD integrieren

---

**Viel Erfolg beim Testen! 🧪**

