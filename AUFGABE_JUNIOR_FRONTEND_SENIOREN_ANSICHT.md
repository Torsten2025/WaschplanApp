# 📋 Aufgabe: Senioren-Ansicht (Zettel-ähnlich) implementieren

**Zugewiesen an:** Junior Frontend Entwickler  
**Priorität:** 🟡 MITTEL (Feature-Erweiterung)  
**Geschätzte Zeit:** 6-8 Stunden  
**Status:** ⏳ Offen

---

## 📋 Aufgaben-Übersicht

### 1. Neue Datei `public/senior.html` erstellen
### 2. Grid-Layout (Zettel-ähnlich) implementieren
### 3. Direktes Eintragen in Zelle
### 4. Auto-Save bei Eingabe
### 5. Auto-Login beim Laden
### 6. Tablet-Optimierung (Kiosk-Modus)
### 7. Visuelles Feedback (keine Fehlermeldungen)

---

## 🎯 Aufgabe 1: Neue Datei `public/senior.html` erstellen

### Problem:
- Aktuell gibt es nur `index.html` (normale Ansicht)
- Neue Senioren-Ansicht benötigt eigene HTML-Datei

### Lösung:
- Erstelle `public/senior.html` mit minimalem HTML
- Verweise auf `public/js/senior.js` und `public/css/senior.css`

### Code-Struktur:

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waschplan - Waschküche</title>
    <link rel="stylesheet" href="css/senior.css">
    <script src="js/logger.js"></script>
    <script src="js/storage.js"></script>
    <script src="js/api.js"></script>
    <script src="js/senior.js"></script>
</head>
<body>
    <div class="senior-container">
        <header class="senior-header">
            <h1>WASCHPLAN</h1>
            <div class="month-selector">
                <button id="prev-month" class="nav-btn">←</button>
                <span id="current-month" class="month-display"></span>
                <button id="next-month" class="nav-btn">→</button>
            </div>
        </header>
        
        <main class="senior-main">
            <div id="grid-container" class="grid-container" role="grid" aria-label="Waschplan">
                <!-- Grid wird dynamisch generiert -->
            </div>
        </main>
    </div>
    
    <!-- Input-Overlay für Zelleneingabe -->
    <div id="input-overlay" class="input-overlay" style="display: none;">
        <input type="text" id="cell-input" class="cell-input" placeholder="Name eingeben" autofocus>
    </div>
</body>
</html>
```

### Akzeptanzkriterien:
- [ ] `public/senior.html` existiert
- [ ] Verweise auf `senior.js` und `senior.css` sind korrekt
- [ ] HTML-Struktur ist semantisch korrekt

---

## 🎯 Aufgabe 2: Grid-Layout (Zettel-ähnlich) implementieren

### Problem:
- Zettel hat Tage vertikal (links), Maschinen×Slots horizontal (oben)
- Muss als CSS Grid implementiert werden

### Lösung:
- CSS Grid mit dynamischen Spalten (Maschinen × Slots)
- Eine Zeile pro Tag (1-31)
- Große, lesbare Zellen

### Code-Struktur:

#### `public/css/senior.css`:

```css
/* Basis-Styling */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 18px;
    line-height: 1.5;
    background-color: #f5f5f5;
    color: #333;
}

.senior-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 20px;
}

.senior-header {
    text-align: center;
    margin-bottom: 20px;
}

.senior-header h1 {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #20C997;
}

.month-selector {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.month-display {
    font-size: 24px;
    font-weight: 600;
}

.nav-btn {
    font-size: 24px;
    padding: 10px 20px;
    background-color: #20C997;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    min-width: 60px;
    min-height: 60px;
}

.nav-btn:hover {
    background-color: #1aa87a;
}

/* Grid-Layout */
.grid-container {
    display: grid;
    gap: 2px;
    background-color: #ddd;
    border: 2px solid #333;
    overflow-x: auto;
}

/* Grid-Header (Maschinen×Slots) */
.grid-header {
    display: contents;
}

.grid-header-cell {
    background-color: #20C997;
    color: white;
    padding: 15px 10px;
    text-align: center;
    font-weight: 600;
    font-size: 16px;
    min-width: 120px;
    position: sticky;
    top: 0;
    z-index: 10;
}

/* Grid-Zeilen (Tage) */
.grid-row {
    display: contents;
}

.grid-day-label {
    background-color: #f0f0f0;
    padding: 15px 10px;
    text-align: center;
    font-weight: 600;
    font-size: 16px;
    min-width: 80px;
    position: sticky;
    left: 0;
    z-index: 5;
    border-right: 2px solid #333;
}

/* Grid-Zellen (Buchungen) */
.grid-cell {
    background-color: #e6faf5; /* Frei: Hellgrün */
    border: 1px solid #20C997;
    padding: 10px;
    min-height: 60px;
    min-width: 120px;
    cursor: pointer;
    font-size: 16px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.grid-cell:hover {
    background-color: #d4f5e8;
}

/* Gebucht (fremd) */
.grid-cell.booked {
    background-color: #f8d7da; /* Gebucht: Hellrot */
    border-color: #dc3545;
    color: #721c24;
}

/* Eigene Buchung */
.grid-cell.own-booking {
    background-color: #d1ecf1; /* Eigene Buchung: Hellblau */
    border-color: #0c5460;
    color: #0c5460;
}

/* Sonntag (grau) */
.grid-cell.sunday {
    background-color: #e9ecef;
    border-color: #adb5bd;
    color: #6c757d;
}

/* Touch-Optimierung */
@media (hover: none) {
    .grid-cell {
        min-height: 80px;
    }
}
```

### JavaScript-Logik (`public/js/senior.js`):

```javascript
// Globale Variablen
let machines = [];
let bookings = [];
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let currentUserName = '';

// Zeit-Slots (wie in app.js)
const TIME_SLOTS = [
  { label: '07:00-12:00', start: '07:00', end: '12:00' },
  { label: '12:00-17:00', start: '12:00', end: '17:00' },
  { label: '17:00-21:00', start: '17:00', end: '21:00' }
];

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSeniorView();
});

async function initializeSeniorView() {
  // Auto-Login
  await autoLoginSenior();
  
  // Daten laden
  await loadMachines();
  await loadBookings();
  
  // Grid rendern
  renderGrid();
  
  // Event-Listener
  setupEventListeners();
}

function renderGrid() {
  const container = document.getElementById('grid-container');
  if (!container) return;
  
  // Berechne Anzahl der Tage im Monat
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  // Berechne Anzahl der Spalten (Maschinen × Slots + 1 für Tag-Label)
  const columns = machines.length * TIME_SLOTS.length + 1;
  
  // Setze CSS Grid
  container.style.gridTemplateColumns = `80px repeat(${machines.length * TIME_SLOTS.length}, 1fr)`;
  
  // Header-Zeile (Maschinen×Slots)
  let headerHTML = '<div class="grid-header">';
  headerHTML += '<div class="grid-header-cell grid-day-label">Tag</div>';
  
  machines.forEach(machine => {
    TIME_SLOTS.forEach(slot => {
      headerHTML += `<div class="grid-header-cell">${machine.name}<br>${slot.label}</div>`;
    });
  });
  
  headerHTML += '</div>';
  
  // Zeilen (Tage)
  let rowsHTML = '';
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    
    rowsHTML += '<div class="grid-row">';
    rowsHTML += `<div class="grid-day-label">${day}</div>`;
    
    machines.forEach(machine => {
      TIME_SLOTS.forEach(slot => {
        const booking = findBooking(machine.id, date, slot.label);
        const isOwnBooking = booking && booking.user_name === currentUserName;
        const cellClass = isSunday ? 'sunday' : (booking ? (isOwnBooking ? 'own-booking' : 'booked') : '');
        const cellContent = booking ? booking.user_name : '';
        
        rowsHTML += `<div class="grid-cell ${cellClass}" 
          data-machine-id="${machine.id}" 
          data-date="${date}" 
          data-slot="${slot.label}"
          data-is-booked="${!!booking}"
          data-is-sunday="${isSunday}">${cellContent}</div>`;
      });
    });
    
    rowsHTML += '</div>';
  }
  
  container.innerHTML = headerHTML + rowsHTML;
  
  // Event-Delegation für Zellen-Clicks
  container.addEventListener('click', handleCellClick);
}

function findBooking(machineId, date, slot) {
  return bookings.find(b => 
    b.machine_id === machineId && 
    b.date === date && 
    b.slot === slot
  );
}
```

### Akzeptanzkriterien:
- [ ] Grid-Layout sieht aus wie Zettel (Tage vertikal, Maschinen×Slots horizontal)
- [ ] Farbcodierung: Frei (grün), Gebucht (rot), Eigene Buchung (blau)
- [ ] Sonntage sind grau markiert
- [ ] Große, lesbare Zellen (min. 60x60px)

---

## 🎯 Aufgabe 3: Direktes Eintragen in Zelle

### Problem:
- Senioren sollen direkt in Zelle eintragen können (wie auf Zettel)
- Kein separates Eingabefeld

### Lösung:
- Klick auf Zelle → Input-Overlay erscheint
- Eingabe → Auto-Save nach 1 Sekunde Debounce
- Visuelles Feedback: Zelle blinkt kurz grün bei erfolgreicher Buchung

### Code-Struktur:

```javascript
let inputOverlay = null;
let cellInput = null;
let currentCell = null;

function setupEventListeners() {
  inputOverlay = document.getElementById('input-overlay');
  cellInput = document.getElementById('cell-input');
  
  // Enter-Taste: Speichern
  cellInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      await saveCellInput();
    } else if (e.key === 'Escape') {
      closeCellInput();
    }
  });
  
  // Klick außerhalb: Schließen
  inputOverlay.addEventListener('click', (e) => {
    if (e.target === inputOverlay) {
      closeCellInput();
    }
  });
}

function handleCellClick(e) {
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  
  const isBooked = cell.dataset.isBooked === 'true';
  const isSunday = cell.dataset.isSunday === 'true';
  const machineId = parseInt(cell.dataset.machineId);
  const date = cell.dataset.date;
  const slot = cell.dataset.slot;
  
  // Sonntag: Keine Buchung möglich (für Waschmaschinen)
  // TODO: Prüfe Maschinentyp
  if (isSunday) {
    return; // Keine Aktion
  }
  
  // Wenn bereits gebucht: Löschen
  if (isBooked) {
    const booking = findBooking(machineId, date, slot);
    if (booking && booking.user_name === currentUserName) {
      deleteBooking(booking.id);
    }
    return;
  }
  
  // Input-Overlay anzeigen
  showCellInput(cell, machineId, date, slot);
}

function showCellInput(cell, machineId, date, slot) {
  currentCell = { cell, machineId, date, slot };
  
  // Position berechnen
  const rect = cell.getBoundingClientRect();
  inputOverlay.style.display = 'block';
  inputOverlay.style.left = `${rect.left}px`;
  inputOverlay.style.top = `${rect.top}px`;
  inputOverlay.style.width = `${rect.width}px`;
  inputOverlay.style.height = `${rect.height}px`;
  
  // Input fokussieren
  cellInput.value = '';
  cellInput.focus();
  
  // Auto-Save nach 1 Sekunde Debounce
  let debounceTimer = null;
  cellInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await saveCellInput();
    }, 1000);
  });
}

async function saveCellInput() {
  if (!currentCell) return;
  
  const name = cellInput.value.trim();
  if (!name) {
    closeCellInput();
    return;
  }
  
  const { machineId, date, slot } = currentCell;
  
  try {
    // Buchung erstellen
    const booking = await createBooking({
      machine_id: machineId,
      date: date,
      slot: slot,
      user_name: name
    });
    
    // Visuelles Feedback: Zelle blinkt kurz grün
    currentCell.cell.classList.add('success-flash');
    setTimeout(() => {
      currentCell.cell.classList.remove('success-flash');
    }, 500);
    
    // Buchungen neu laden
    await loadBookings();
    renderGrid();
    
    closeCellInput();
  } catch (error) {
    // Keine Fehlermeldung für Senioren (stille Validierung)
    console.error('Fehler beim Erstellen der Buchung:', error);
    closeCellInput();
  }
}

function closeCellInput() {
  inputOverlay.style.display = 'none';
  currentCell = null;
}
```

### CSS für Input-Overlay:

```css
.input-overlay {
    position: fixed;
    background-color: rgba(255, 255, 255, 0.95);
    border: 3px solid #20C997;
    border-radius: 8px;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cell-input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 20px;
    text-align: center;
    padding: 10px;
    font-weight: 600;
}

.cell-input:focus {
    outline: none;
}

/* Visuelles Feedback */
.success-flash {
    animation: flashGreen 0.5s;
}

@keyframes flashGreen {
    0%, 100% { background-color: #e6faf5; }
    50% { background-color: #20C997; }
}
```

### Akzeptanzkriterien:
- [ ] Klick auf Zelle öffnet Input-Overlay
- [ ] Eingabe wird nach 1 Sekunde automatisch gespeichert
- [ ] Enter-Taste speichert sofort
- [ ] Escape-Taste schließt Input
- [ ] Visuelles Feedback: Zelle blinkt grün bei erfolgreicher Buchung

---

## 🎯 Aufgabe 4: Auto-Save bei Eingabe

### Problem:
- Eingabe soll automatisch gespeichert werden (kein "Speichern"-Button)
- Debounce: Nicht bei jedem Tastendruck speichern

### Lösung:
- Debounce von 1 Sekunde
- Auto-Save bei Eingabe
- Visuelles Feedback bei erfolgreichem Save

### Code-Struktur:
(Siehe Aufgabe 3 - bereits implementiert)

### Akzeptanzkriterien:
- [ ] Auto-Save funktioniert nach 1 Sekunde
- [ ] Keine doppelten Requests
- [ ] Visuelles Feedback bei erfolgreichem Save

---

## 🎯 Aufgabe 5: Auto-Login beim Laden

### Problem:
- Tablet soll automatisch eingeloggt sein
- Kein Login-Dialog für Senioren

### Lösung:
- Beim Laden der Seite: Auto-Login-Endpunkt aufrufen
- Session speichern
- Bei Fehler: Fallback auf normale Login-Seite

### Code-Struktur:

```javascript
async function autoLoginSenior() {
  try {
    const response = await fetch('/api/v1/auth/auto-login-senior', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Auto-Login fehlgeschlagen');
    }
    
    const data = await response.json();
    if (data.success && data.data) {
      currentUserName = data.data.username;
      logger.info('Auto-Login erfolgreich', { username: currentUserName });
    } else {
      throw new Error('Auto-Login fehlgeschlagen');
    }
  } catch (error) {
    logger.error('Auto-Login fehlgeschlagen', error);
    // Fallback: Weiterleitung zur normalen Login-Seite
    window.location.href = '/';
  }
}
```

### Akzeptanzkriterien:
- [ ] Auto-Login funktioniert beim Laden
- [ ] Session wird korrekt gespeichert
- [ ] Bei Fehler: Fallback auf normale Login-Seite

---

## 🎯 Aufgabe 6: Tablet-Optimierung (Kiosk-Modus)

### Problem:
- Tablet soll im Kiosk-Modus laufen
- Keine Browser-Navigation
- Auto-Refresh für Live-Updates

### Lösung:
- Fullscreen-Modus (optional, über Browser-Einstellungen)
- Auto-Refresh alle 30 Sekunden
- Große Touch-Targets (bereits in CSS)

### Code-Struktur:

```javascript
// Auto-Refresh alle 30 Sekunden
setInterval(async () => {
  await loadBookings();
  renderGrid();
}, 30000);

// Fullscreen-Modus (optional)
function enterFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) {
    document.documentElement.msRequestFullscreen();
  }
}

// Beim Laden: Fullscreen aktivieren (optional)
// document.addEventListener('DOMContentLoaded', () => {
//   enterFullscreen();
// });
```

### CSS für Tablet-Optimierung:

```css
/* Landscape-Orientierung bevorzugt */
@media (orientation: landscape) {
  .senior-container {
    padding: 10px;
  }
  
  .grid-cell {
    min-height: 80px;
  }
}

/* Touch-Optimierung */
@media (hover: none) {
  .grid-cell {
    min-height: 80px;
    font-size: 18px;
  }
  
  .nav-btn {
    min-width: 80px;
    min-height: 80px;
  }
}
```

### Akzeptanzkriterien:
- [ ] Auto-Refresh funktioniert alle 30 Sekunden
- [ ] Große Touch-Targets (min. 60x60px)
- [ ] Landscape-Orientierung optimiert
- [ ] Fullscreen-Modus (optional)

---

## 🎯 Aufgabe 7: Visuelles Feedback (keine Fehlermeldungen)

### Problem:
- Senioren sollen keine Fehlermeldungen sehen
- Aber: Visuelles Feedback bei erfolgreichen Aktionen

### Lösung:
- Alle API-Fehler still behandeln
- Visuelles Feedback: Zelle blinkt grün bei erfolgreicher Buchung
- Keine Toast-Notifications oder Modals

### Code-Struktur:
(Siehe Aufgabe 3 - bereits implementiert)

### Akzeptanzkriterien:
- [ ] Keine Fehlermeldungen werden angezeigt
- [ ] Visuelles Feedback bei erfolgreichen Aktionen
- [ ] Alle Fehler werden still behandelt

---

## 📝 Test-Plan

### Manuelle Tests:
1. **Grid-Layout prüfen:**
   - Öffne `/senior.html`
   - Prüfe: Tage vertikal, Maschinen×Slots horizontal
   - Prüfe: Farbcodierung (Frei=grün, Gebucht=rot, Eigene=blau)

2. **Direktes Eintragen testen:**
   - Klicke auf freie Zelle
   - Eingabe: "Test"
   - Warte 1 Sekunde → Sollte automatisch gespeichert werden
   - Prüfe: Zelle blinkt grün

3. **Auto-Login testen:**
   - Öffne `/senior.html`
   - Prüfe: Kein Login-Dialog
   - Prüfe: Automatisch eingeloggt

4. **Tablet-Optimierung testen:**
   - Öffne auf Tablet
   - Prüfe: Große Touch-Targets
   - Prüfe: Landscape-Orientierung optimiert

5. **Auto-Refresh testen:**
   - Öffne `/senior.html`
   - Erstelle Buchung in anderem Tab
   - Warte 30 Sekunden → Sollte automatisch aktualisiert werden

### Browser-Tests:
- [ ] Chrome/Edge (Desktop)
- [ ] Chrome (Tablet)
- [ ] Safari (iPad)
- [ ] Firefox (Desktop)

---

## ✅ Akzeptanzkriterien (Gesamt)

- [ ] `public/senior.html` existiert
- [ ] Grid-Layout sieht aus wie Zettel
- [ ] Direktes Eintragen funktioniert
- [ ] Auto-Save funktioniert
- [ ] Auto-Login funktioniert
- [ ] Tablet-Optimierung funktioniert
- [ ] Keine Fehlermeldungen werden angezeigt
- [ ] Visuelles Feedback bei erfolgreichen Aktionen
- [ ] Alle Features sind getestet

---

## 📚 Referenzen

- `public/index.html` - Normale Ansicht (Referenz)
- `public/js/app.js` - Normale Frontend-Logik (Referenz)
- `public/css/style.css` - Normale Styles (Referenz)
- `AUFGABE_JUNIOR_BACKEND_SENIOREN_ROLLE.md` - Backend-Implementierung

---

**Ende der Aufgabe**

