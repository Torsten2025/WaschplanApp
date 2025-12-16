/**
 * Senioren-Ansicht: Zettel-ähnliches Grid-Layout
 * Direktes Eintragen in Zellen, Auto-Save, Auto-Login
 */

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

// Input-Overlay Variablen
let inputOverlay = null;
let cellInput = null;
let currentCell = null;
let debounceTimer = null;

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeSeniorView();
  } catch (error) {
    console.error('Fehler beim Initialisieren der Senioren-Ansicht:', error);
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Initialisieren der Senioren-Ansicht', error);
    }
  }
});

async function initializeSeniorView() {
  // Username aus LocalStorage laden
  if (typeof storage !== 'undefined') {
    currentUserName = storage.getItem('waschmaschine_user_name') || '';
  }
  
  // Erleichterte Anmeldung: Automatisches Login wenn Name vorhanden
  if (currentUserName) {
    try {
      const user = await loginSimple(currentUserName);
      if (typeof logger !== 'undefined') {
        logger.info('Erleichterte Anmeldung erfolgreich (Senioren)', { username: user.username });
      }
    } catch (error) {
      // Fehler beim Auto-Login ist OK - wird beim ersten Klick nachgeholt
      if (typeof logger !== 'undefined') {
        logger.debug('Auto-Login fehlgeschlagen (wird beim ersten Klick nachgeholt)', error);
      }
    }
  }
  
  // Daten laden
  await loadMachines();
  await loadBookings();
  
  // Grid rendern
  renderGrid();
  
  // Event-Listener
  setupEventListeners();
  
  // Monatsanzeige aktualisieren
  updateMonthDisplay();
  
  // Auto-Refresh alle 30 Sekunden
  setInterval(async () => {
    try {
      await loadBookings();
      renderGrid();
    } catch (error) {
      console.error('Fehler beim Auto-Refresh:', error);
    }
  }, 30000);
}

async function loadMachines() {
  try {
    machines = await fetchMachines();
    if (typeof logger !== 'undefined') {
      logger.debug('Maschinen geladen', { count: machines.length });
    }
  } catch (error) {
    console.error('Fehler beim Laden der Maschinen:', error);
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Maschinen', error);
    }
  }
}

async function loadBookings() {
  try {
    // Lade Buchungen für den gesamten Monat
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const allBookings = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      try {
        const dayBookings = await fetchBookings(date);
        if (dayBookings && Array.isArray(dayBookings)) {
          allBookings.push(...dayBookings);
        }
      } catch (error) {
        // Ignoriere Fehler für einzelne Tage
        console.warn(`Fehler beim Laden der Buchungen für ${date}:`, error);
      }
    }
    
    bookings = allBookings;
    if (typeof logger !== 'undefined') {
      logger.debug('Buchungen geladen', { count: bookings.length });
    }
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Buchungen', error);
    }
  }
}

function renderGrid() {
  const container = document.getElementById('grid-container');
  if (!container) return;
  
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  // Header-Zeile (Maschinen×Slots)
  let headerHTML = '<div class="grid-header">';
  headerHTML += '<div class="grid-header-cell grid-day-label">Tag</div>';
  
  machines.forEach(machine => {
    TIME_SLOTS.forEach(slot => {
      headerHTML += `<div class="grid-header-cell">${escapeHtml(machine.name)}<br>${escapeHtml(slot.label)}</div>`;
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
        let cellClass = '';
        
        if (isSunday && machine.type === 'washer') {
          cellClass = 'sunday';
        } else if (booking) {
          cellClass = isOwnBooking ? 'own-booking' : 'booked';
        }
        
        const cellContent = booking ? escapeHtml(booking.user_name) : '';
        
        rowsHTML += `<div class="grid-cell ${cellClass}" 
          data-machine-id="${machine.id}" 
          data-date="${date}" 
          data-slot="${escapeHtml(slot.label)}"
          data-is-booked="${!!booking}"
          data-is-sunday="${isSunday}"
          data-machine-type="${machine.type}">${cellContent}</div>`;
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

function setupEventListeners() {
  inputOverlay = document.getElementById('input-overlay');
  cellInput = document.getElementById('cell-input');
  
  if (!inputOverlay || !cellInput) {
    console.error('Input-Overlay oder Cell-Input nicht gefunden');
    return;
  }
  
  // Enter-Taste: Speichern
  cellInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveCellInput();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCellInput();
    }
  });
  
  // Klick außerhalb: Schließen
  inputOverlay.addEventListener('click', (e) => {
    if (e.target === inputOverlay) {
      closeCellInput();
    }
  });
  
  // Monats-Navigation
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
      } else {
        currentMonth--;
      }
      updateMonthDisplay();
      loadBookings().then(() => renderGrid());
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentMonth === 12) {
        currentMonth = 1;
        currentYear++;
      } else {
        currentMonth++;
      }
      updateMonthDisplay();
      loadBookings().then(() => renderGrid());
    });
  }
  
  // Debounce für Auto-Save
  cellInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await saveCellInput();
    }, 1000);
  });
}

function handleCellClick(e) {
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  
  const isBooked = cell.dataset.isBooked === 'true';
  const isSunday = cell.dataset.isSunday === 'true';
  const machineType = cell.dataset.machineType;
  const machineId = parseInt(cell.dataset.machineId);
  const date = cell.dataset.date;
  const slot = cell.dataset.slot;
  
  // Sonntag: Keine Buchung möglich (für Waschmaschinen)
  if (isSunday && machineType === 'washer') {
    return; // Keine Aktion
  }
  
  // Wenn bereits gebucht: Löschen (nur eigene Buchungen)
  if (isBooked) {
    const booking = findBooking(machineId, date, slot);
    if (booking && booking.user_name === currentUserName) {
      deleteBooking(booking.id, date).then(() => {
        loadBookings().then(() => renderGrid());
      }).catch(error => {
        console.error('Fehler beim Löschen der Buchung:', error);
      });
    }
    return;
  }
  
  // Input-Overlay anzeigen
  showCellInput(cell, machineId, date, slot);
}

async function showCellInput(cell, machineId, date, slot) {
  currentCell = { cell, machineId, date, slot };
  
  // Erleichterte Anmeldung: Wenn Name vorhanden aber nicht eingeloggt, automatisch einloggen
  if (currentUserName && typeof loginSimple === 'function') {
    try {
      const user = await loginSimple(currentUserName);
      if (typeof logger !== 'undefined') {
        logger.debug('Erleichterte Anmeldung beim Zellklick (Senioren)', { username: user.username });
      }
    } catch (error) {
      // Fehler beim Login - Input trotzdem anzeigen, Login wird beim Speichern versucht
      if (typeof logger !== 'undefined') {
        logger.debug('Login beim Zellklick fehlgeschlagen (wird beim Speichern versucht)', error);
      }
    }
  }
  
  // Position berechnen
  const rect = cell.getBoundingClientRect();
  inputOverlay.style.display = 'flex';
  inputOverlay.classList.add('active');
  inputOverlay.style.left = `${rect.left}px`;
  inputOverlay.style.top = `${rect.top}px`;
  inputOverlay.style.width = `${rect.width}px`;
  inputOverlay.style.height = `${rect.height}px`;
  
  // Input fokussieren (mit vorausgefülltem Namen für erleichterte Eingabe)
  cellInput.value = currentUserName || '';
  cellInput.focus();
}

async function saveCellInput() {
  if (!currentCell) return;
  
  const name = cellInput.value.trim();
  if (!name) {
    closeCellInput();
    return;
  }
  
  // Username speichern
  if (typeof storage !== 'undefined') {
    storage.setItem('waschmaschine_user_name', name);
  }
  currentUserName = name;
  
  const { machineId, date, slot } = currentCell;
  
  try {
    // Erleichterte Anmeldung: Automatisches Login vor Buchung
    if (typeof loginSimple === 'function') {
      try {
        await loginSimple(name);
        if (typeof logger !== 'undefined') {
          logger.debug('Erleichterte Anmeldung vor Buchung (Senioren)', { username: name });
        }
      } catch (error) {
        // Fehler beim Login - trotzdem versuchen zu buchen (Backend prüft Session)
        if (typeof logger !== 'undefined') {
          logger.warn('Login vor Buchung fehlgeschlagen', error);
        }
      }
    }
    
    // Buchung erstellen (user_name wird NICHT mehr gesendet - kommt aus Session)
    const booking = await createBooking({
      machine_id: machineId,
      date: date,
      slot: slot
      // user_name wird automatisch aus der Session genommen (Backend)
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
  if (inputOverlay) {
    inputOverlay.style.display = 'none';
    inputOverlay.classList.remove('active');
  }
  if (cellInput) {
    cellInput.value = '';
  }
  currentCell = null;
  clearTimeout(debounceTimer);
}

function updateMonthDisplay() {
  const monthDisplay = document.getElementById('current-month');
  if (monthDisplay) {
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    monthDisplay.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
  }
}

function escapeHtml(text) {
  if (text === null || text === undefined) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Auto-Login (optional - für später)
async function autoLoginSenior() {
  try {
    // TODO: Implementiere Auto-Login-Endpunkt im Backend
    // const response = await fetch('/api/v1/auth/auto-login-senior', {
    //   method: 'POST',
    //   credentials: 'include'
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Auto-Login fehlgeschlagen');
    // }
    // 
    // const data = await response.json();
    // if (data.success && data.data) {
    //   currentUserName = data.data.username;
    //   if (typeof logger !== 'undefined') {
    //     logger.info('Auto-Login erfolgreich', { username: currentUserName });
    //   }
    // } else {
    //   throw new Error('Auto-Login fehlgeschlagen');
    // }
  } catch (error) {
    console.error('Auto-Login fehlgeschlagen:', error);
    if (typeof logger !== 'undefined') {
      logger.error('Auto-Login fehlgeschlagen', error);
    }
    // Fallback: Weiterleitung zur normalen Login-Seite (optional)
    // window.location.href = '/';
  }
}

