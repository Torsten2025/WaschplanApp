# 🐛 Aufgabe: Slot-Klick-Event funktioniert nicht

**Zugewiesen an:** Junior Frontend Entwickler  
**Priorität:** 🔴 Hoch (kritisch für Hauptfunktionalität)  
**Geschätzte Zeit:** 2-3 Stunden  
**Status:** ⏳ Offen

---

## 📋 Problembeschreibung

**Symptom:**  
Wenn Benutzer auf einen freien Slot klicken, wird der Buchungsprozess nicht ausgelöst. Der Klick-Event-Handler funktioniert nicht.

**Betroffene Datei:**  
- `public/js/app.js`

**Betroffene Funktionen:**
- `renderSlots()` (Zeile ~347)
- `setupSlotKeyboardNavigation()` (Zeile ~1125)
- `handleSlotClick()` (Zeile ~500)

---

## 🔍 Problem-Analyse

### Aktueller Code-Flow:

1. **`renderSlots()`** wird aufgerufen und erstellt HTML für alle Slots
2. Am Ende wird **`setupSlotKeyboardNavigation()`** aufgerufen (Zeile 456)
3. In `setupSlotKeyboardNavigation()`:
   - Slots werden mit `querySelectorAll('.slot[role="gridcell"]')` gefunden
   - Für jeden Slot wird `cloneNode(true)` verwendet und dann `replaceChild()` aufgerufen
   - **Problem:** `cloneNode()` kopiert keine Event-Listener!
   - Click-Handler werden nur für `.free` Slots hinzugefügt (Zeile 1147-1156)

### Mögliche Ursachen:

1. ❌ **Event-Listener werden durch `cloneNode()` entfernt**
   - `cloneNode(true)` kopiert nur HTML-Struktur, nicht Event-Listener
   - Nach `replaceChild()` sind alle vorherigen Event-Listener weg

2. ❌ **Slots werden nicht korrekt gefunden**
   - `querySelectorAll()` könnte leer sein, wenn Slots noch nicht gerendert sind
   - Timing-Problem zwischen `innerHTML` und `querySelectorAll()`

3. ❌ **Click-Handler werden nicht korrekt hinzugefügt**
   - Bedingung `newSlot.classList.contains('free')` könnte fehlschlagen
   - `machineId` oder `slotLabel` könnten `undefined` sein

4. ❌ **Event-Propagation wird blockiert**
   - Andere Event-Listener könnten `stopPropagation()` aufrufen
   - CSS `pointer-events: none` könnte aktiv sein

---

## ✅ Lösung

### Option 1: Event-Delegation verwenden (EMPFOHLEN)

**Vorteile:**
- Funktioniert auch nach dynamischem HTML-Update
- Keine Probleme mit `cloneNode()`
- Bessere Performance bei vielen Slots

**Implementierung:**

1. **Event-Listener einmalig beim App-Start registrieren** (nicht in `setupSlotKeyboardNavigation()`)

```javascript
// In initializeApp() oder ähnlicher Initialisierungsfunktion
document.getElementById('slots-container').addEventListener('click', (e) => {
  // Prüfe ob Klick auf einem Slot war
  const slot = e.target.closest('.slot.free');
  if (!slot) return;
  
  const machineId = parseInt(slot.dataset.machineId);
  const slotTimeElement = slot.querySelector('.slot-time');
  
  if (slotTimeElement && !isNaN(machineId)) {
    const slotLabel = slotTimeElement.textContent;
    handleSlotClick(machineId, slotLabel);
  }
});
```

2. **`setupSlotKeyboardNavigation()` anpassen:**
   - Entferne die `cloneNode()`/`replaceChild()` Logik
   - Entferne die Click-Handler-Logik (wird jetzt durch Event-Delegation abgedeckt)
   - Behalte nur die Keyboard-Navigation

### Option 2: Event-Listener direkt nach innerHTML hinzufügen

**Implementierung:**

1. **In `renderSlots()` nach `innerHTML` Assignment:**

```javascript
container.innerHTML = machines.map(...).join('');

// SOFORT danach Event-Listener hinzufügen (vor setupSlotKeyboardNavigation)
const freeSlots = container.querySelectorAll('.slot.free');
freeSlots.forEach(slot => {
  const machineId = parseInt(slot.dataset.machineId);
  const slotTimeElement = slot.querySelector('.slot-time');
  
  if (slotTimeElement && !isNaN(machineId)) {
    const slotLabel = slotTimeElement.textContent;
    slot.addEventListener('click', () => {
      handleSlotClick(machineId, slotLabel);
    });
  }
});

setupSlotKeyboardNavigation(); // Nur für Keyboard-Navigation
```

2. **`setupSlotKeyboardNavigation()` anpassen:**
   - Entferne `cloneNode()`/`replaceChild()` Logik
   - Entferne Click-Handler-Logik
   - Behalte nur Keyboard-Navigation

### Option 3: Inline onclick verwenden (NICHT EMPFOHLEN, aber schnell)

**Implementierung:**

In `createSlotElement()` für freie Slots:

```javascript
// Freier Slot
return `
  <div class="slot free" id="${slotId}" 
       data-machine-id="${machine.id}" 
       data-slot-index="${slotIndex}"
       onclick="handleSlotClick(${machine.id}, '${slot.label.replace(/'/g, "\\'")}')"
       role="gridcell" 
       aria-label="Slot ${slot.label} buchen" 
       tabindex="${slotIndex === 0 ? '0' : '-1'}">
    <span class="slot-time">${slot.label}</span>
    <span class="slot-user">Frei</span>
  </div>
`;
```

**⚠️ Nachteile:**
- Globaler Namespace-Pollution
- Sicherheitsrisiko bei nicht-escapten Strings
- Nicht best practice

---

## 🧪 Test-Anweisungen

### Vor dem Fix:
1. ✅ Öffne `http://localhost:3000`
2. ✅ Wähle ein Datum aus
3. ✅ Gebe einen Namen ein
4. ✅ Klicke auf einen freien Slot (grün)
5. ❌ **Erwartetes Verhalten:** Bestätigungs-Modal sollte erscheinen
6. ❌ **Tatsächliches Verhalten:** Nichts passiert

### Nach dem Fix:
1. ✅ Öffne `http://localhost:3000`
2. ✅ Wähle ein Datum aus
3. ✅ Gebe einen Namen ein
4. ✅ Klicke auf einen freien Slot (grün)
5. ✅ **Erwartetes Verhalten:** Bestätigungs-Modal erscheint
6. ✅ Klicke "Bestätigen"
7. ✅ **Erwartetes Verhalten:** Buchung wird erstellt, Slot wird rot markiert

### Debug-Tests:

**In Browser-Console (F12) testen:**

```javascript
// Test 1: Prüfe ob Slots existieren
console.log('Freie Slots:', document.querySelectorAll('.slot.free').length);

// Test 2: Prüfe ob Event-Listener vorhanden sind
const firstSlot = document.querySelector('.slot.free');
if (firstSlot) {
  console.log('Machine ID:', firstSlot.dataset.machineId);
  console.log('Slot Label:', firstSlot.querySelector('.slot-time')?.textContent);
  
  // Manuell Click-Event auslösen
  firstSlot.click();
}

// Test 3: Prüfe ob handleSlotClick global verfügbar ist
console.log('handleSlotClick:', typeof handleSlotClick);
```

---

## 📝 Abnahmekriterien

- [ ] ✅ Klick auf freien Slot öffnet Bestätigungs-Modal
- [ ] ✅ Bestätigung erstellt Buchung erfolgreich
- [ ] ✅ Slot wird nach Buchung als "gebucht" (rot) markiert
- [ ] ✅ Keyboard-Navigation funktioniert weiterhin (Enter/Leertaste)
- [ ] ✅ Keine JavaScript-Fehler in Browser-Console
- [ ] ✅ Funktioniert auch nach mehrfachem Rendern (z.B. Datum-Wechsel)
- [ ] ✅ Funktioniert auch nach Neuladen der Buchungen

---

## 🔧 Code-Stellen zum Prüfen

### 1. `renderSlots()` Funktion (Zeile ~347)
```javascript
function renderSlots() {
  // ...
  container.innerHTML = machines.map(...).join('');
  setupSlotKeyboardNavigation(); // <-- Hier wird Event-Listener hinzugefügt
}
```

### 2. `setupSlotKeyboardNavigation()` Funktion (Zeile ~1125)
```javascript
function setupSlotKeyboardNavigation() {
  const allSlots = document.querySelectorAll('.slot[role="gridcell"]');
  // ...
  allSlots.forEach(slot => {
    // PROBLEM: cloneNode() entfernt Event-Listener!
    const newSlot = slot.cloneNode(true);
    slot.parentNode.replaceChild(newSlot, slot);
    
    // Click-Handler wird hier hinzugefügt, aber zu spät?
    if (newSlot.classList.contains('free')) {
      // ...
      newSlot.addEventListener('click', () => {
        handleSlotClick(machineId, slotLabel);
      });
    }
  });
}
```

### 3. `handleSlotClick()` Funktion (Zeile ~500)
```javascript
async function handleSlotClick(machineId, slotLabel) {
  // Diese Funktion wird nie aufgerufen, wenn Event-Listener nicht funktioniert
  // ...
}
```

---

## 💡 Empfohlene Lösung (Option 1: Event-Delegation)

**Schritt 1:** Event-Listener in `initializeApp()` registrieren

**Schritt 2:** `setupSlotKeyboardNavigation()` vereinfachen

**Schritt 3:** Testen

---

## 📚 Referenzen

- [MDN: Event Delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation)
- [MDN: cloneNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)
- [MDN: addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)

---

## ⚠️ Wichtige Hinweise

1. **Nicht `cloneNode()` verwenden**, wenn Event-Listener benötigt werden
2. **Event-Delegation** ist die beste Lösung für dynamisch erstelltes HTML
3. **Teste nach jedem Datum-Wechsel**, da `renderSlots()` mehrfach aufgerufen wird
4. **Prüfe Browser-Console** auf Fehler

---

## 📞 Bei Fragen

Falls unklar:
- Prüfe Browser-Console (F12) auf Fehler
- Prüfe ob `handleSlotClick` global verfügbar ist
- Prüfe ob Slots korrekt gerendert werden
- Prüfe ob Event-Listener tatsächlich hinzugefügt werden

---

**Erstellt:** [Aktuelles Datum]  
**Zuletzt aktualisiert:** [Aktuelles Datum]

