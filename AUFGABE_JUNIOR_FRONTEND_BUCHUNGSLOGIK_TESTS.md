# 📋 Aufgabe: Frontend-Tests für Buchungslogik implementieren

**Zugewiesen an:** Junior Frontend Entwickler  
**Priorität:** 🔴 KRITISCH  
**Geschätzte Zeit:** 2-3 Stunden  
**Status:** ⏳ Offen

---

## 🎯 Ziel

Implementiere Frontend-Tests für die Buchungslogik gemäß `TEST_STRATEGIE_BUCHUNGSLOGIK.md`.

**Hinweis:** Frontend-Tests sind optional, da die Hauptlogik im Backend getestet wird. Diese Tests prüfen die UI-Logik und API-Aufrufe.

---

## 📋 Aufgaben-Übersicht

### 1. handleSlotClick() Tests (6 Tests)
- Erfolgreiche Buchungserstellung
- Fehlendes Datum
- Fehlender Name
- Modal-Abbruch
- Datum in Vergangenheit
- Optimistisches Update

### 2. handleDeleteBooking() Tests (3 Tests)
- Erfolgreiche Löschung
- Modal-Abbruch
- Fehlerbehandlung

### 3. API-Funktionen Tests (4 Tests)
- createBooking() Erfolg
- createBooking() Fehlerbehandlung
- deleteBooking() Erfolg
- deleteBooking() Fehlerbehandlung

**Gesamt:** ~13 Tests

---

## 🛠️ Technische Details

### Test-Framework
- **Framework:** Jest (bereits konfiguriert)
- **DOM-Testing:** jsdom (bereits in Jest enthalten)
- **Mocking:** Jest Mocks für fetch/API-Aufrufe

### Datei-Struktur
```
tests/
├── unit/
│   └── frontend/
│       └── bookings.test.js      (NEU erstellen)
```

**Hinweis:** Frontend-Tests sind optional. Wenn Zeit fehlt, können diese Tests übersprungen werden, da die Hauptlogik im Backend getestet wird.

---

## 📝 Schritt-für-Schritt-Anleitung

### Schritt 1: Neue Test-Datei erstellen

**Datei:** `tests/unit/frontend/bookings.test.js`

**Vorlage:**
```javascript
/**
 * Unit-Tests für Frontend-Buchungslogik
 * 
 * Diese Tests prüfen die UI-Logik und API-Aufrufe:
 * - handleSlotClick()
 * - handleDeleteBooking()
 * - createBooking()
 * - deleteBooking()
 */

// Mock für fetch
global.fetch = jest.fn();

// Mock für DOM
beforeEach(() => {
  document.body.innerHTML = `
    <input id="date-input" type="date" />
    <input id="name-input" type="text" />
    <div id="slots-container"></div>
  `;
  
  // Reset fetch mock
  fetch.mockClear();
});

describe('handleSlotClick()', () => {
  // Hier kommen die Tests hin
});
```

---

### Schritt 2: handleSlotClick() Tests implementieren

**Test 8.1: Erfolgreiche Buchungserstellung**

```javascript
describe('handleSlotClick()', () => {
  test('8.1: Erfolgreiche Buchungserstellung', async () => {
    // Setup: DOM-Elemente setzen
    const dateInput = document.getElementById('date-input');
    const nameInput = document.getElementById('name-input');
    dateInput.value = '2024-12-31';
    nameInput.value = 'TestUser';

    // Mock fetch für erfolgreiche Buchung
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          machine_id: 1,
          date: '2024-12-31',
          slot: '08:00-10:00',
          user_name: 'TestUser',
          machine_name: 'Waschmaschine 1',
          machine_type: 'washer'
        }
      })
    });

    // Mock für showModal (sollte true zurückgeben = bestätigt)
    global.showModal = jest.fn().mockResolvedValue(true);
    global.showMessage = jest.fn();
    global.renderSlots = jest.fn();
    global.loadBookings = jest.fn().mockResolvedValue([]);

    // Mock für handleSlotClick (muss aus app.js importiert werden)
    // Hinweis: handleSlotClick muss exportiert werden oder über window verfügbar sein
    await handleSlotClick(1, '08:00-10:00');

    // Prüfen dass Modal aufgerufen wurde
    expect(showModal).toHaveBeenCalled();
    
    // Prüfen dass fetch aufgerufen wurde
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('"machine_id":1')
      })
    );

    // Prüfen dass Erfolgs-Meldung angezeigt wurde
    expect(showMessage).toHaveBeenCalledWith(
      expect.stringContaining('erfolgreich'),
      'success'
    );
  });
});
```

**Hinweis:** `handleSlotClick()` muss aus `public/js/app.js` exportiert oder über `window` verfügbar gemacht werden, damit es getestet werden kann.

---

### Schritt 3: Fehlerbehandlung testen

**Test 8.2: Fehlendes Datum**

```javascript
test('8.2: Fehlendes Datum', async () => {
  const dateInput = document.getElementById('date-input');
  const nameInput = document.getElementById('name-input');
  dateInput.value = '';  // Leer!
  nameInput.value = 'TestUser';

  global.showMessage = jest.fn();

  await handleSlotClick(1, '08:00-10:00');

  // Prüfen dass Fehlermeldung angezeigt wurde
  expect(showMessage).toHaveBeenCalledWith(
    expect.stringContaining('Datum'),
    'error'
  );

  // Prüfen dass Datum-Input Focus erhalten hat
  expect(document.activeElement).toBe(dateInput);

  // Prüfen dass KEINE API-Anfrage gestellt wurde
  expect(fetch).not.toHaveBeenCalled();
});
```

---

### Schritt 4: API-Funktionen testen

**Test 10.1: createBooking() Erfolg**

```javascript
describe('createBooking()', () => {
  test('10.1: Erfolgreicher API-Aufruf', async () => {
    // Mock fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          machine_id: 1,
          date: '2024-12-31',
          slot: '08:00-10:00',
          user_name: 'TestUser'
        }
      })
    });

    // createBooking aufrufen (muss aus api.js importiert werden)
    const booking = await createBooking({
      machine_id: 1,
      date: '2024-12-31',
      slot: '08:00-10:00',
      user_name: 'TestUser'
    });

    // Prüfen dass fetch aufgerufen wurde
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/bookings'),
      expect.objectContaining({
        method: 'POST'
      })
    );

    // Prüfen dass Buchung zurückgegeben wurde
    expect(booking).toHaveProperty('id');
    expect(booking).toHaveProperty('machine_id', 1);
    expect(booking).toHaveProperty('date', '2024-12-31');
  });
});
```

---

## ⚠️ Wichtige Hinweise

### 1. Code muss testbar gemacht werden

**Problem:** `handleSlotClick()` und andere Funktionen sind nicht exportiert.

**Lösung:** Funktionen müssen exportiert werden oder über `window` verfügbar sein:

```javascript
// In public/js/app.js:
window.handleSlotClick = handleSlotClick;
window.handleDeleteBooking = handleDeleteBooking;

// Oder besser: Module-System verwenden
export { handleSlotClick, handleDeleteBooking };
```

### 2. DOM-Mocking

Frontend-Tests benötigen DOM-Mocking. Jest verwendet jsdom automatisch.

### 3. API-Mocking

Alle API-Aufrufe müssen gemockt werden, da wir keine echte API in Unit-Tests verwenden.

---

## ✅ Checkliste

### Setup:
- [ ] Datei `tests/unit/frontend/bookings.test.js` erstellt
- [ ] Jest-Konfiguration prüfen (jsdom sollte aktiv sein)
- [ ] Funktionen exportieren/verfügbar machen

### handleSlotClick() Tests:
- [ ] Test 8.1: Erfolgreiche Buchungserstellung
- [ ] Test 8.2: Fehlendes Datum
- [ ] Test 8.3: Fehlender Name
- [ ] Test 8.4: Modal-Abbruch
- [ ] Test 8.5: Datum in Vergangenheit
- [ ] Test 8.6: Optimistisches Update

### handleDeleteBooking() Tests:
- [ ] Test 9.1: Erfolgreiche Löschung
- [ ] Test 9.2: Modal-Abbruch
- [ ] Test 9.3: Fehlerbehandlung

### API-Funktionen Tests:
- [ ] Test 10.1: createBooking() Erfolg
- [ ] Test 10.2: createBooking() Fehlerbehandlung
- [ ] Test 11.1: deleteBooking() Erfolg

### Tests ausführen:
- [ ] `npm run test:unit` ausführen
- [ ] Alle Tests bestehen

---

## 📚 Referenzen

### Dokumentation:
- `TEST_STRATEGIE_BUCHUNGSLOGIK.md` - Vollständige Test-Strategie
- Jest DOM Testing: https://jestjs.io/docs/tutorial-jquery

### Code-Stellen:
- `public/js/app.js:586-865` - handleSlotClick()
- `public/js/app.js:867-950` - handleDeleteBooking()
- `public/js/api.js:372-438` - createBooking()
- `public/js/api.js:446-500` - deleteBooking()

---

## 🎯 Abnahmekriterien

- [ ] Alle 13 Tests implementiert (oder so viele wie möglich)
- [ ] Alle Tests bestehen (`npm run test:unit`)
- [ ] Code folgt bestehenden Test-Patterns
- [ ] Tests sind gut dokumentiert

**Hinweis:** Wenn Zeit fehlt, können Frontend-Tests optional sein, da die Hauptlogik im Backend getestet wird.

---

**Erstellt:** [Aktuelles Datum]  
**Status:** ⏳ Offen  
**Nächste Review:** Nach Implementierung

