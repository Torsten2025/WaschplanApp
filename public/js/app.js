/**
 * Haupt-JavaScript für Waschmaschinen-Buchungsapp
 * Implementiert alle Frontend-Funktionen
 */

// Konstanten
const DEBOUNCE_DELAY_NAME = 300; // ms für Name-Input
const DEBOUNCE_DELAY_DATE = 500; // ms für Datum-Input
const MESSAGE_AUTO_HIDE_DELAY = 5000; // ms

// Globale Variablen
let machines = [];
let slots = [];
let bookings = [];
let pendingBookings = []; // Buchungen, die erstellt wurden, aber noch nicht vom Server bestätigt wurden
let currentUserName = '';
let currentView = 'day'; // 'day', 'week', 'month'
let currentWeekStart = null; // Montag der aktuellen Woche
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let currentUser = null; // Aktueller eingeloggter Benutzer

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  initializeApp().catch(error => {
    if (typeof logger !== 'undefined') {
      logger.error('Kritischer Fehler beim Initialisieren der App', error);
    } else {
      console.error('Kritischer Fehler beim Initialisieren der App:', error);
    }
    // Fallback: Zeige Fehlermeldung
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '<div class="message error">Fehler beim Laden der App. Bitte laden Sie die Seite neu.</div>';
    }
  });
});

/**
 * Initialisiert die App
 * @returns {Promise<void>}
 */
async function initializeApp() {
  try {
    // Theme initialisieren
    initializeTheme();
    
    // Prüfe ob Benutzer eingeloggt ist
    await checkAuthStatus();
    
    // Name aus LocalStorage laden (nur wenn nicht eingeloggt)
    if (!currentUser) {
      loadUserName();
    }
    
    // Datum auf heute setzen
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date-input');
    if (!dateInput) {
      if (typeof logger !== 'undefined') {
        logger.error('date-input Element nicht gefunden');
      } else {
        console.error('date-input Element nicht gefunden');
      }
      throw new Error('date-input Element nicht gefunden');
    }
    dateInput.value = today;
    dateInput.min = today;
    updateDateDisplay(today);
    
    // Event-Listener registrieren
    setupEventListeners();
    
    // Ansichts-Listener registrieren
    setupViewListeners();
    
    // Modal-Listener registrieren
    setupModalListeners();
    
    // Login/Logout-Listener registrieren
    setupAuthListeners();
    
    // Event-Delegation für Slot-Clicks einrichten (einmalig beim App-Start)
    setupSlotClickDelegation();
    
    // Maschinen und Slots laden
    await loadMachines();
    await loadSlots();
    
    // Standardansicht ist Tagesübersicht
    switchView('day');
    
    // Buchungen für heute laden
    await loadBookings(today);
    
  } catch (error) {
    showMessage('Fehler beim Initialisieren der App: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Initialisierungsfehler', error);
    } else {
      console.error('Initialisierungsfehler:', error);
    }
  }
}

/**
 * Debounce-Hilfsfunktion
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialisiert Theme basierend auf System-Präferenz oder gespeicherter Einstellung
 */
function initializeTheme() {
  const savedTheme = storage.getItem('waschmaschine_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let theme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
  
  // System-Präferenz-Änderungen überwachen (nur wenn kein manuelles Theme gesetzt)
  if (!savedTheme) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    });
  }
  
  // Theme-Toggle Button Event-Listener
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

/**
 * Setzt das Theme
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  storage.setItem('waschmaschine_theme', theme);
  
  // Icon aktualisieren
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/**
 * Wechselt das Theme
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

/**
 * Event-Listener einrichten
 */
function setupEventListeners() {
  // Datum-Änderung mit Debouncing
  const dateInput = document.getElementById('date-input');
  if (!dateInput) {
    console.error('date-input Element nicht gefunden');
    return;
  }
  
  const debouncedLoadBookings = debounce(async (date) => {
    if (date) {
      await loadBookings(date);
    }
  }, DEBOUNCE_DELAY_DATE);
  
  dateInput.addEventListener('change', (e) => {
    debouncedLoadBookings(e.target.value);
  });
  
  // Name-Änderung (in LocalStorage speichern) mit Debouncing
  const nameInput = document.getElementById('name-input');
  if (!nameInput) {
    if (typeof logger !== 'undefined') {
      logger.error('name-input Element nicht gefunden');
    } else {
      console.error('name-input Element nicht gefunden');
    }
    return;
  }
  
  const debouncedSaveName = debounce((name) => {
    if (name) {
      storage.setItem('waschmaschine_user_name', name);
      currentUserName = name;
    }
  }, DEBOUNCE_DELAY_NAME);
  
  nameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    debouncedSaveName(name);
  });
  
  // Connection-Restored Handler
  window.onConnectionRestored = async () => {
    showMessage('Verbindung wiederhergestellt. Daten werden aktualisiert...', 'success');
    const date = document.getElementById('date-input').value;
    try {
      await loadMachines();
      await loadSlots();
      if (date) {
        await loadBookings(date, true); // Force refresh
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('Fehler beim Aktualisieren nach Verbindungswiederherstellung', error);
      } else {
        console.error('Fehler beim Aktualisieren nach Verbindungswiederherstellung:', error);
      }
    }
  };
}

/**
 * Lädt den Benutzernamen aus LocalStorage
 */
function loadUserName() {
  const savedName = storage.getItem('waschmaschine_user_name');
  if (savedName) {
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
      nameInput.value = savedName;
      currentUserName = savedName;
    }
  }
}

/**
 * Lädt alle Maschinen und zeigt sie an
 */
async function loadMachines() {
  try {
    showLoading('machines-container', 'machines');
    machines = await fetchMachines();
    renderMachines();
  } catch (error) {
    showMessage('Fehler beim Laden der Maschinen: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Maschinen', error);
    } else {
      console.error('Fehler beim Laden der Maschinen:', error);
    }
  }
}

/**
 * Rendert die Maschinen-Übersicht
 */
function renderMachines() {
  const container = document.getElementById('machines-container');
  
  if (!machines || machines.length === 0) {
    container.innerHTML = '<p>Keine Maschinen verfügbar.</p>';
    return;
  }
  
  container.innerHTML = machines.map(machine => {
    let typeLabel = 'Unbekannt';
    if (machine.type === 'washer') {
      typeLabel = 'Waschmaschine';
    } else if (machine.type === 'dryer') {
      typeLabel = 'Trocknungsraum';
    } else if (machine.type === 'tumbler') {
      typeLabel = 'Tumbler';
    }
    return `
    <div class="machine-card" role="listitem" aria-label="${escapeHtml(machine.name)} - ${typeLabel}">
      <div class="machine-name">${escapeHtml(machine.name)}</div>
      <div class="machine-type">${typeLabel}</div>
    </div>
  `;
  }).join('');
}

/**
 * Lädt die fixen Slots
 */
async function loadSlots() {
  try {
    slots = await fetchSlots();
  } catch (error) {
    showMessage('Fehler beim Laden der Slots: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Slots', error);
    } else {
      console.error('Fehler beim Laden der Slots:', error);
    }
    // Fallback: Slots direkt definieren (Waschküchenordnung: 07–12, 12–17, 17–21)
    slots = [
      { start: '07:00', end: '12:00', label: '07:00-12:00' },
      { start: '12:00', end: '17:00', label: '12:00-17:00' },
      { start: '17:00', end: '21:00', label: '17:00-21:00' }
    ];
  }
}

/**
 * Lädt Buchungen für ein bestimmtes Datum
 * @param {string} date - Datum im Format YYYY-MM-DD
 * @param {boolean} forceRefresh - Cache ignorieren
 */
async function loadBookings(date, forceRefresh = false) {
  if (!date) {
    return;
  }
  
  try {
    showLoading('slots-container', 'Buchungen werden geladen...');
    const serverBookings = await fetchBookings(date, forceRefresh);
    
    // Normalisiere Datum für Vergleich
    const normalizeDate = (d) => {
      if (!d) return null;
      return d.trim().split('T')[0].split(' ')[0];
    };
    const normalizedDate = normalizeDate(date);
    
    // Füge pending Buchungen hinzu, die zum aktuellen Datum gehören
    const relevantPendingBookings = pendingBookings.filter(pb => {
      const pbDate = normalizeDate(pb.date);
      return pbDate === normalizedDate || !normalizedDate || !pbDate;
    });
    
    // Kombiniere Server-Buchungen mit pending Buchungen
    // Entferne Duplikate (gleiche ID oder gleiche Maschine+Slot+Datum)
    const allBookings = [...serverBookings];
    
    for (const pendingBooking of relevantPendingBookings) {
      const exists = allBookings.some(b => {
        const bDate = normalizeDate(b.date);
        const pbDate = normalizeDate(pendingBooking.date);
        return b.id === pendingBooking.id || 
               (b.machine_id === pendingBooking.machine_id && 
                b.slot === pendingBooking.slot && 
                (bDate === pbDate || (!bDate && !pbDate)));
      });
      
      if (!exists) {
        allBookings.push(pendingBooking);
        if (typeof logger !== 'undefined') {
          logger.debug('Pending Buchung hinzugefügt zu Server-Buchungen', {
            pendingBooking: {
              id: pendingBooking.id,
              machine_id: pendingBooking.machine_id,
              slot: pendingBooking.slot,
              date: pendingBooking.date
            }
          });
        }
      }
    }
    
    bookings = allBookings;
    
    // Entferne pending Buchungen, die jetzt im Server-Response sind (bestätigt)
    pendingBookings = pendingBookings.filter(pb => {
      const pbDate = normalizeDate(pb.date);
      const exists = serverBookings.some(b => {
        const bDate = normalizeDate(b.date);
        return b.id === pb.id || 
               (b.machine_id === pb.machine_id && 
                b.slot === pb.slot && 
                (bDate === pbDate || (!bDate && !pbDate)));
      });
      return !exists || pbDate !== normalizedDate; // Behalte nur, wenn nicht bestätigt oder anderes Datum
    });
    
    renderSlots();
  } catch (error) {
    const errorMessage = error.message || 'Unbekannter Fehler';
    console.error('Fehler beim Laden der Buchungen:', error);
    
    // Spezifische Fehlermeldungen
    if (errorMessage.includes('Server nicht erreichbar') || errorMessage.includes('Failed to fetch')) {
      showMessage('Server nicht erreichbar. Bitte prüfen Sie ob der Server auf http://localhost:3000 läuft.', 'error');
    } else if (errorMessage.includes('Internetverbindung')) {
      showMessage('Keine Internetverbindung. Bitte prüfen Sie Ihre Netzwerkverbindung.', 'error');
    } else if (errorMessage.includes('Datum')) {
      showMessage('Ungültiges Datum. Bitte wählen Sie ein gültiges Datum aus.', 'error');
    } else {
      showMessage('Fehler beim Laden der Buchungen: ' + errorMessage, 'error');
    }
    
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Buchungen', error);
    } else {
      console.error('Fehler beim Laden der Buchungen:', error);
    }
    
    // Slots trotzdem rendern (ohne Buchungen oder mit gecachten Daten)
    renderSlots();
  }
}

/**
 * Rendert alle Slots für alle Maschinen
 */
function renderSlots() {
  const container = document.getElementById('slots-container');
  
  if (!machines || machines.length === 0 || !slots || slots.length === 0) {
    container.innerHTML = '<p>Keine Daten verfügbar.</p>';
    return;
  }
  
  // Aktuelles Datum für Vergleich
  const dateInput = document.getElementById('date-input');
  const currentDate = dateInput ? dateInput.value : null;
  
  // Normalisiere Datum für Vergleich (Hilfsfunktion) - MUSS VOR Debug-Logging definiert werden
  const normalizeDate = (d) => {
    if (!d) return null;
    return d.trim().split('T')[0].split(' ')[0];
  };
  
  const normalizedCurrentDate = normalizeDate(currentDate);
  
  // Debug-Logging
  if (typeof logger !== 'undefined') {
    logger.debug('renderSlots aufgerufen', { 
      machinesCount: machines.length, 
      slotsCount: slots.length, 
      bookingsCount: bookings.length,
      currentDate,
      normalizedCurrentDate,
      bookings: bookings.map(b => ({ 
        id: b.id, 
        machine_id: b.machine_id, 
        slot: b.slot, 
        date: b.date,
        normalizedDate: normalizeDate(b.date),
        user_name: b.user_name 
      }))
    });
  } else {
    console.log('renderSlots aufgerufen:', {
      machinesCount: machines.length,
      slotsCount: slots.length,
      bookingsCount: bookings.length,
      currentDate,
      normalizedCurrentDate,
      bookings: bookings.map(b => ({
        id: b.id,
        machine_id: b.machine_id,
        slot: b.slot,
        date: b.date,
        normalizedDate: normalizeDate(b.date),
        user_name: b.user_name
      }))
    });
  }
  
  // Debug: Zeige alle Buchungen für jeden Slot
  if (typeof logger !== 'undefined' && bookings.length > 0) {
    logger.debug('renderSlots - Alle Buchungen vor Slot-Rendering', {
      bookingsCount: bookings.length,
      normalizedCurrentDate,
      bookings: bookings.map(b => ({
        id: b.id,
        machine_id: b.machine_id,
        slot: b.slot,
        date: b.date,
        normalizedDate: normalizeDate(b.date),
        user_name: b.user_name
      }))
    });
  }
  
  container.innerHTML = machines.map(machine => {
    const machineSlots = slots.map(slot => {
      // Prüfe ob Slot belegt ist (auch Datum prüfen falls vorhanden)
      const booking = bookings.find(b => {
        // Normalisiere Datum-Strings für Vergleich
        const bDate = normalizeDate(b.date);
        
        const machineMatch = b.machine_id === machine.id;
        const slotMatch = b.slot === slot.label;
        
        // Datum-Match: Wenn kein Datum gesetzt ist, zeige alle Buchungen
        // Wenn Datum gesetzt ist, müssen sie übereinstimmen
        const dateMatch = !normalizedCurrentDate || !bDate || bDate === normalizedCurrentDate;
        
        // Debug für jeden Vergleich - nur wenn alle Matches erfüllt sind
        if (machineMatch && slotMatch) {
          if (typeof logger !== 'undefined') {
            logger.debug('Buchungs-Vergleich für Slot', {
              machineId: machine.id,
              slotLabel: slot.label,
              booking: { 
                id: b.id, 
                machine_id: b.machine_id, 
                slot: b.slot, 
                date: b.date,
                normalizedDate: bDate,
                user_name: b.user_name
              },
              matches: {
                machineMatch,
                slotMatch,
                dateMatch,
                allMatch: machineMatch && slotMatch && dateMatch
              },
              normalizedCurrentDate
            });
          } else {
            console.log('Buchungs-Vergleich für Slot:', {
              machineId: machine.id,
              slotLabel: slot.label,
              booking: b,
              matches: {
                machineMatch,
                slotMatch,
                dateMatch,
                allMatch: machineMatch && slotMatch && dateMatch
              },
              normalizedCurrentDate
            });
          }
        }
        
        return machineMatch && slotMatch && dateMatch;
      });
      
      const isBooked = !!booking;
      const isOwnBooking = booking && booking.user_name === currentUserName;
      
      // Debug für spezifischen Slot
      if (typeof logger !== 'undefined') {
        if (booking) {
          logger.debug('Slot gefunden als belegt', { 
            machineId: machine.id, 
            slotLabel: slot.label, 
            booking: { id: booking.id, machine_id: booking.machine_id, slot: booking.slot, date: booking.date },
            isOwnBooking
          });
        } else {
          // Debug: Warum wurde keine Buchung gefunden?
          const potentialBookings = bookings.filter(b => {
            const bDate = normalizeDate(b.date);
            return b.machine_id === machine.id && 
                   b.slot === slot.label &&
                   (!normalizedCurrentDate || !bDate || bDate === normalizedCurrentDate);
          });
          
          if (potentialBookings.length > 0) {
            logger.debug('Slot NICHT als belegt markiert, obwohl passende Buchungen existieren', {
              machineId: machine.id,
              slotLabel: slot.label,
              normalizedCurrentDate,
              potentialBookings: potentialBookings.map(b => ({
                id: b.id,
                machine_id: b.machine_id,
                slot: b.slot,
                date: normalizeDate(b.date),
                user_name: b.user_name
              })),
              allBookings: bookings.map(b => ({
                id: b.id,
                machine_id: b.machine_id,
                slot: b.slot,
                date: normalizeDate(b.date)
              }))
            });
          }
        }
      } else if (!logger) {
        if (booking) {
          console.log('Slot gefunden als belegt:', {
            machineId: machine.id,
            slotLabel: slot.label,
            booking
          });
        }
      }
      
      return createSlotElement(slot, machine, booking, isBooked, isOwnBooking);
    }).join('');
    
    return `
      <div class="machine-slots" data-machine-id="${machine.id}">
        <h3>${escapeHtml(machine.name)}</h3>
        <div class="slots-grid" role="grid" aria-label="Zeitfenster für ${escapeHtml(machine.name)}">
          ${machineSlots}
        </div>
      </div>
    `;
  }).join('');
  
  // Keyboard-Navigation für Slots einrichten
  setupSlotKeyboardNavigation();
}

/**
 * Erstellt ein Slot-Element
 */
function createSlotElement(slot, machine, booking, isBooked, isOwnBooking) {
  const slotId = `slot-${machine.id}-${slot.label.replace(/:/g, '-')}`;
  const slotIndex = slots.findIndex(s => s.label === slot.label);
  
  if (isBooked) {
    // Belegter Slot
    return `
      <div class="slot booked" id="${slotId}" 
           data-booking-id="${booking.id}" 
           data-machine-id="${machine.id}" 
           data-slot-index="${slotIndex}"
           role="gridcell" 
           aria-label="Slot ${slot.label} belegt von ${escapeHtml(booking.user_name)}" 
           tabindex="${slotIndex === 0 ? '0' : '-1'}">
        <span class="slot-time">${slot.label}</span>
        <span class="slot-user">${escapeHtml(booking.user_name)}</span>
        ${isOwnBooking ? `<button class="delete-btn" onclick="handleDeleteBooking(${booking.id}, '${slot.label}')" title="Buchung löschen" aria-label="Buchung für ${slot.label} löschen" tabindex="0">✕</button>` : ''}
      </div>
    `;
  } else {
    // Freier Slot
    return `
      <div class="slot free" id="${slotId}" 
           data-machine-id="${machine.id}" 
           data-slot-index="${slotIndex}"
           role="gridcell" 
           aria-label="Slot ${slot.label} buchen" 
           tabindex="${slotIndex === 0 ? '0' : '-1'}">
        <span class="slot-time">${slot.label}</span>
        <span class="slot-user">Frei</span>
      </div>
    `;
  }
}

/**
 * Behandelt Klick auf einen freien Slot
 */
async function handleSlotClick(machineId, slotLabel) {
  // WICHTIG: Nur eingeloggte Benutzer können buchen
  if (!currentUser || !currentUser.username) {
    showMessage('Sie müssen sich anmelden, um Buchungen zu erstellen. Bitte klicken Sie auf "Anmelden" oben rechts.', 'error');
    // Öffne Login-Modal
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.click();
    }
    return;
  }
  
  const dateInput = document.getElementById('date-input');
  
  let date = dateInput.value;
  // Verwende Benutzername aus Session (nicht aus Input-Feld)
  const userName = currentUser.username;
  
  // Validierung
  if (!date) {
    showMessage('Bitte wählen Sie ein Datum aus.', 'error');
    dateInput.focus();
    return;
  }
  
  // Stelle sicher, dass das Datum im korrekten Format ist
  date = date.trim();
  
  // Prüfe ob Datum in Vergangenheit liegt
  const selectedDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    // Automatisch auf heute setzen, wenn Datum in Vergangenheit liegt
    const todayStr = today.toISOString().split('T')[0];
    dateInput.value = todayStr;
    date = todayStr;
    showMessage('Das Datum wurde auf heute gesetzt, da das ausgewählte Datum in der Vergangenheit lag.', 'info');
  }
  
  // Prüfe Online-Status
  if (typeof checkOnlineStatus === 'function' && !checkOnlineStatus()) {
    showMessage('Keine Internetverbindung. Buchung kann nicht erstellt werden.', 'error');
    return;
  }
  
  // Bestätigung mit Modal
  const dateFormatted = formatDateForDisplay ? formatDateForDisplay(date) : date;
  
  if (typeof logger !== 'undefined') {
    logger.debug('Zeige Bestätigungs-Modal', {
      machineId,
      slotLabel,
      date,
      dateFormatted,
      userName
    });
  } else {
    console.log('Zeige Bestätigungs-Modal:', { machineId, slotLabel, date, userName });
  }
  
  const confirmed = await showModal(
    'Buchung bestätigen',
    `Möchten Sie den Slot "${escapeHtml(slotLabel)}" für ${escapeHtml(dateFormatted)} buchen?`
  );
  
  if (typeof logger !== 'undefined') {
    logger.debug('Modal-Bestätigung erhalten', { confirmed });
  } else {
    console.log('Modal-Bestätigung erhalten:', confirmed);
  }
  
  if (!confirmed) {
    if (typeof logger !== 'undefined') {
      logger.debug('Buchung abgebrochen - Modal nicht bestätigt');
    } else {
      console.log('Buchung abgebrochen - Modal nicht bestätigt');
    }
    return;
  }
  
  try {
    if (typeof logger !== 'undefined') {
      logger.debug('Starte Buchungserstellung', {
        machineId,
        slotLabel,
        date,
        userName
      });
    } else {
      console.log('Starte Buchungserstellung:', { machineId, slotLabel, date, userName });
    }
    
    showMessage('Buchung wird erstellt...', 'info');
    
    // Debug: Logge die zu sendenden Daten
    // WICHTIG: user_name wird NICHT mehr gesendet - kommt aus Session im Backend
    const bookingData = {
      machine_id: machineId,
      date: date,
      slot: slotLabel
      // user_name wird automatisch aus der Session genommen (Backend)
    };
    
    if (typeof logger !== 'undefined') {
      logger.debug('Erstelle Buchung', bookingData);
    } else {
      console.log('Erstelle Buchung:', bookingData);
    }
    
    const booking = await createBooking(bookingData);
    
    // Debug: Logge die erhaltene Buchung
    if (typeof logger !== 'undefined') {
      logger.debug('Buchung erstellt - Response erhalten', booking);
    } else {
      console.log('Buchung erstellt - Response erhalten:', booking);
    }
    
    // Name in LocalStorage speichern
    storage.setItem('waschmaschine_user_name', userName);
    currentUserName = userName;
    
    // Stelle sicher, dass booking alle benötigten Felder hat
    if (!booking.machine_id) {
      booking.machine_id = machineId;
    }
    if (!booking.slot) {
      booking.slot = slotLabel;
    }
    if (!booking.date) {
      booking.date = date;
    }
    if (!booking.user_name) {
      booking.user_name = userName;
    }
    
    // Normalisiere Datum für Vergleich (trim und entferne Zeit-Komponente falls vorhanden)
    const normalizeDate = (d) => {
      if (!d) return null;
      return d.trim().split('T')[0].split(' ')[0];
    };
    
    const dateInputAfter = document.getElementById('date-input');
    const currentDate = normalizeDate(dateInputAfter ? dateInputAfter.value : date);
    const bookingDate = normalizeDate(booking.date || date);
    
    // Debug: Prüfe ob Datum übereinstimmt
    if (typeof logger !== 'undefined') {
      logger.debug('Buchung erstellt - Datum-Vergleich', {
        currentDate,
        bookingDate,
        date,
        match: currentDate === bookingDate
      });
    } else {
      console.log('Buchung erstellt - Datum-Vergleich:', {
        currentDate,
        bookingDate,
        date,
        match: currentDate === bookingDate
      });
    }
    
    // Buchung zur aktuellen Liste hinzufügen (optimistisches Update)
    // Nur wenn das Datum übereinstimmt oder kein Datum gesetzt ist
    const shouldAddToCurrentView = currentDate === bookingDate || !currentDate || !bookingDate;
    
    if (shouldAddToCurrentView) {
      // Prüfe ob Buchung bereits existiert
      const existingIndex = bookings.findIndex(b => {
        const bDate = normalizeDate(b.date);
        return b.machine_id === booking.machine_id && 
               b.slot === booking.slot && 
               (bDate === bookingDate || (!bDate && !bookingDate));
      });
      
      if (existingIndex >= 0) {
        // Ersetze existierende Buchung
        bookings[existingIndex] = booking;
        if (typeof logger !== 'undefined') {
          logger.debug('Buchung ersetzt', { 
            index: existingIndex, 
            booking: {
              id: booking.id,
              machine_id: booking.machine_id,
              slot: booking.slot,
              date: booking.date,
              user_name: booking.user_name
            },
            bookingsCount: bookings.length
          });
        } else {
          console.log('Buchung ersetzt:', { index: existingIndex, booking, bookingsCount: bookings.length });
        }
      } else {
      // Füge neue Buchung hinzu
      bookings.push(booking);
      
      // Füge auch zu pendingBookings hinzu (falls sie noch nicht bestätigt ist)
      const normalizeDate = (d) => {
        if (!d) return null;
        return d.trim().split('T')[0].split(' ')[0];
      };
      const bookingDate = normalizeDate(booking.date);
      const pendingExists = pendingBookings.some(pb => {
        const pbDate = normalizeDate(pb.date);
        return pb.id === booking.id || 
               (pb.machine_id === booking.machine_id && 
                pb.slot === booking.slot && 
                (pbDate === bookingDate || (!pbDate && !bookingDate)));
      });
      
      if (!pendingExists) {
        pendingBookings.push(booking);
        if (typeof logger !== 'undefined') {
          logger.debug('Buchung zu pendingBookings hinzugefügt', {
            booking: {
              id: booking.id,
              machine_id: booking.machine_id,
              slot: booking.slot,
              date: booking.date
            },
            pendingCount: pendingBookings.length
          });
        }
      }
      
      if (typeof logger !== 'undefined') {
        logger.debug('Buchung hinzugefügt', { 
          booking: {
            id: booking.id,
            machine_id: booking.machine_id,
            slot: booking.slot,
            date: booking.date,
            user_name: booking.user_name
          }, 
          newCount: bookings.length,
          pendingCount: pendingBookings.length,
          allBookings: bookings.map(b => ({ id: b.id, machine_id: b.machine_id, slot: b.slot, date: b.date }))
        });
      } else {
        console.log('Buchung hinzugefügt:', { booking, newCount: bookings.length, allBookings: bookings });
      }
      }
      
      // Slots sofort neu rendern (optimistisches Update)
      if (typeof logger !== 'undefined') {
        logger.debug('renderSlots wird aufgerufen nach Buchung hinzufügen', {
          booking: {
            id: booking.id,
            machine_id: booking.machine_id,
            slot: booking.slot,
            date: booking.date,
            user_name: booking.user_name
          },
          bookingsCount: bookings.length
        });
      } else {
        console.log('renderSlots wird aufgerufen nach Buchung hinzufügen', {
          booking,
          bookingsCount: bookings.length
        });
      }
      
      // WICHTIG: renderSlots() SOFORT aufrufen, BEVOR loadBookings() die Array überschreibt
      renderSlots();
    }
    
    showMessage(`Buchung erfolgreich erstellt! Slot: ${escapeHtml(slotLabel)}`, 'success');
    
    // Buchungen neu laden (mit forceRefresh) um sicherzustellen, dass alles synchron ist
    // WICHTIG: Speichere alle neuen Buchungen vor dem Laden, damit sie nicht verloren gehen
    const newBooking = booking;
    const dateToLoad = bookingDate || currentDate || date;
    
    // Sammle alle Buchungen, die wir behalten wollen (alle aktuellen Buchungen)
    const bookingsToPreserve = [...bookings];
    
    // Kurze Verzögerung, damit renderSlots() die neue Buchung anzeigen kann
    // Dann loadBookings() aufrufen, aber die neuen Buchungen behalten
    setTimeout(async () => {
      try {
        if (typeof logger !== 'undefined') {
          logger.debug('Lade Buchungen neu nach Erstellung', {
            dateToLoad,
            bookingsBeforeLoad: bookingsToPreserve.length,
            newBooking: {
              id: newBooking.id,
              machine_id: newBooking.machine_id,
              slot: newBooking.slot,
              date: newBooking.date,
              user_name: newBooking.user_name
            }
          });
        }
        
        await loadBookings(dateToLoad, true);
        
        // Prüfe ob die neue Buchung im Response ist, wenn nicht, füge sie hinzu
        const normalizeDate = (d) => {
          if (!d) return null;
          return d.trim().split('T')[0].split(' ')[0];
        };
        
        const normalizedBookingDate = normalizeDate(newBooking.date);
        const normalizedCurrentDate = normalizeDate(dateToLoad);
        
        // Prüfe ob die neue Buchung im Server-Response ist
        const bookingExists = bookings.some(b => {
          const bDate = normalizeDate(b.date);
          return b.id === newBooking.id || 
                 (b.machine_id === newBooking.machine_id && 
                  b.slot === newBooking.slot && 
                  (bDate === normalizedBookingDate || (!bDate && !normalizedBookingDate)));
        });
        
        if (!bookingExists) {
          // Neue Buchung wurde nicht im Server-Response gefunden
          // Füge sie hinzu, aber nur wenn das Datum übereinstimmt
          if (normalizedBookingDate === normalizedCurrentDate || !normalizedCurrentDate || !normalizedBookingDate) {
            bookings.push(newBooking);
            if (typeof logger !== 'undefined') {
              logger.debug('Neue Buchung nach loadBookings hinzugefügt (nicht im Server-Response)', { 
                booking: {
                  id: newBooking.id,
                  machine_id: newBooking.machine_id,
                  slot: newBooking.slot,
                  date: newBooking.date,
                  user_name: newBooking.user_name
                },
                bookingsCount: bookings.length,
                serverBookingsCount: bookings.length - 1
              });
            } else {
              console.log('Neue Buchung nach loadBookings hinzugefügt (nicht im Server-Response):', newBooking);
            }
            renderSlots();
          } else {
            if (typeof logger !== 'undefined') {
              logger.debug('Neue Buchung nicht hinzugefügt (Datum stimmt nicht überein)', {
                bookingDate: normalizedBookingDate,
                currentDate: normalizedCurrentDate
              });
            }
          }
        } else {
          if (typeof logger !== 'undefined') {
            logger.debug('Neue Buchung bereits im Server-Response gefunden', {
              booking: {
                id: newBooking.id,
                machine_id: newBooking.machine_id,
                slot: newBooking.slot,
                date: newBooking.date
              },
              bookingsCount: bookings.length
            });
          }
          // Buchung ist bereits im Response, aber renderSlots() nochmal aufrufen für Sicherheit
          renderSlots();
        }
      } catch (loadError) {
        // Bei Fehler beim Laden: Neue Buchung ist bereits in der Array, renderSlots() wurde bereits aufgerufen
        if (typeof logger !== 'undefined') {
          logger.warn('Fehler beim Neuladen der Buchungen nach Erstellung', loadError);
        } else {
          console.warn('Fehler beim Neuladen der Buchungen nach Erstellung:', loadError);
        }
        // Stelle sicher, dass die neue Buchung noch in der Array ist
        const bookingStillExists = bookings.some(b => b.id === newBooking.id);
        if (!bookingStillExists && bookingsToPreserve.some(b => b.id === newBooking.id)) {
          // Buchung wurde verloren, füge sie wieder hinzu
          bookings.push(newBooking);
          renderSlots();
          if (typeof logger !== 'undefined') {
            logger.debug('Buchung wiederhergestellt nach Fehler beim Laden', { booking: newBooking });
          }
        }
      }
    }, 200); // 200ms Verzögerung für bessere Synchronisation
    
  } catch (error) {
    const errorMessage = error.message || 'Unbekannter Fehler';
    
    // Debug: Logge vollständigen Fehler - IMMER in Console ausgeben
    console.error('=== FEHLER BEIM ERSTELLEN DER BUCHUNG ===');
    console.error('Fehlermeldung:', errorMessage);
    console.error('Vollständiger Fehler:', error);
    console.error('Fehler-Details:', {
      message: error.message,
      stack: error.stack,
      machineId,
      slotLabel,
      date,
      userName
    });
    console.error('=== ENDE FEHLER ===');
    
    // Auch im Logger ausgeben, falls verfügbar
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Erstellen der Buchung', error, {
        machineId,
        slotLabel,
        date,
        userName,
        errorMessage: errorMessage
      });
    }
    
    // Spezifische Fehlermeldungen
    if (errorMessage.includes('bereits gebucht') || errorMessage.includes('409') || errorMessage.includes('Conflict')) {
      showMessage('Dieser Slot ist bereits gebucht. Bitte wählen Sie einen anderen Slot.', 'error');
      // Buchungen neu laden um aktuellen Stand zu zeigen
      await loadBookings(date, true);
    } else if (errorMessage.includes('Internetverbindung') || errorMessage.includes('Failed to fetch')) {
      showMessage('Keine Internetverbindung. Buchung konnte nicht erstellt werden.', 'error');
    } else if (errorMessage.includes('Maschine existiert nicht') || errorMessage.includes('404')) {
      showMessage('Die ausgewählte Maschine existiert nicht mehr. Bitte laden Sie die Seite neu.', 'error');
    } else if (errorMessage.includes('Tageslimit') || errorMessage.includes('Maximum')) {
      // Tageslimiten-Fehler direkt anzeigen
      showMessage(errorMessage, 'error');
    } else if (errorMessage.includes('zukünftige Buchung') || errorMessage.includes('Vorausbuchungsregel')) {
      // Vorausbuchungsregel-Fehler direkt anzeigen
      showMessage(errorMessage, 'error');
    } else if (errorMessage.includes('Sonntag') || errorMessage.includes('Sperrtag')) {
      // Sperrtag-Fehler direkt anzeigen
      showMessage(errorMessage, 'error');
    } else {
      // Alle anderen Fehler anzeigen
      showMessage('Fehler beim Erstellen der Buchung: ' + errorMessage, 'error');
    }
    
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Erstellen der Buchung', error);
    } else {
      console.error('Fehler beim Erstellen der Buchung:', error);
    }
  }
}

/**
 * Behandelt das Löschen einer Buchung
 */
async function handleDeleteBooking(bookingId, slotLabel) {
  const confirmed = await showModal(
    'Buchung löschen',
    `Möchten Sie die Buchung für "${escapeHtml(slotLabel)}" wirklich löschen?`,
    'Löschen'
  );
  
  if (!confirmed) {
    return;
  }
  
  // Prüfe Online-Status
  if (typeof checkOnlineStatus === 'function' && !checkOnlineStatus()) {
    showMessage('Keine Internetverbindung. Buchung kann nicht gelöscht werden.', 'error');
    return;
  }
  
  try {
    showMessage('Buchung wird gelöscht...', 'info');
    
    const date = document.getElementById('date-input').value;
    await deleteBooking(bookingId, date);
    
    showMessage('Buchung erfolgreich gelöscht!', 'success');
    
    // Buchungen neu laden (mit forceRefresh)
    await loadBookings(date, true);
    
  } catch (error) {
    const errorMessage = error.message || 'Unbekannter Fehler';
    
    // Spezifische Fehlermeldungen
    if (errorMessage.includes('Internetverbindung') || errorMessage.includes('Failed to fetch')) {
      showMessage('Keine Internetverbindung. Buchung konnte nicht gelöscht werden.', 'error');
    } else if (errorMessage.includes('nicht gefunden') || errorMessage.includes('404')) {
      showMessage('Die Buchung wurde bereits gelöscht oder existiert nicht mehr.', 'error');
      // Buchungen trotzdem neu laden
      const date = document.getElementById('date-input').value;
      await loadBookings(date, true);
    } else {
      showMessage('Fehler beim Löschen der Buchung: ' + errorMessage, 'error');
    }
    
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Löschen der Buchung', error);
    } else {
      console.error('Fehler beim Löschen der Buchung:', error);
    }
  }
}

/**
 * Toast-Notification-System
 */

// Toast-Konfiguration
const TOAST_CONFIG = {
  defaultDuration: 5000, // 5 Sekunden
  errorDuration: 8000, // 8 Sekunden für Fehler
  infoDuration: 4000, // 4 Sekunden für Info
  successDuration: 4000, // 4 Sekunden für Erfolg
  warningDuration: 6000, // 6 Sekunden für Warnung
  maxToasts: 5 // Maximale Anzahl gleichzeitiger Toasts
};

// Toast-Icons
const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
};

/**
 * Zeigt eine Toast-Notification an
 * @param {string} message - Nachrichtentext
 * @param {string} type - Typ: 'success', 'error', 'info', 'warning'
 * @param {Object} options - Optionale Konfiguration
 * @param {number} options.duration - Anzeigedauer in ms
 * @param {string} options.title - Optionaler Titel
 * @param {Array} options.actions - Optional: Array von Action-Buttons { label, onClick }
 */
function showToast(message, type = 'info', options = {}) {
  const container = document.getElementById('toast-container');
  if (!container) {
    if (typeof logger !== 'undefined') {
      logger.warn('Toast-Container nicht gefunden');
    } else {
      console.warn('Toast-Container nicht gefunden');
    }
    // Fallback auf alte showMessage
    showMessage(message, type);
    return;
  }
  
  // Maximale Anzahl Toasts prüfen
  const existingToasts = container.querySelectorAll('.toast');
  if (existingToasts.length >= TOAST_CONFIG.maxToasts) {
    // Ältesten Toast entfernen
    const oldestToast = existingToasts[0];
    removeToast(oldestToast);
  }
  
  // Toast-Element erstellen
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  
  // Icon
  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;
  icon.setAttribute('aria-hidden', 'true');
  
  // Content
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  if (options.title) {
    const title = document.createElement('div');
    title.className = 'toast-title';
    title.textContent = options.title;
    content.appendChild(title);
  }
  
  const messageEl = document.createElement('div');
  messageEl.className = 'toast-message';
  messageEl.textContent = message; // XSS-Schutz: textContent
  content.appendChild(messageEl);
  
  // Actions
  if (options.actions && options.actions.length > 0) {
    const actionsEl = document.createElement('div');
    actionsEl.className = 'toast-actions';
    options.actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'toast-btn';
      btn.textContent = action.label;
      btn.onclick = () => {
        if (action.onClick) action.onClick();
        removeToast(toast);
      };
      actionsEl.appendChild(btn);
    });
    content.appendChild(actionsEl);
  }
  
  // Close-Button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Schließen');
  closeBtn.onclick = () => removeToast(toast);
  
  // Progress-Bar
  const progressContainer = document.createElement('div');
  progressContainer.className = 'toast-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'toast-progress-bar';
  
  // Dauer bestimmen
  const duration = options.duration || 
    (type === 'error' ? TOAST_CONFIG.errorDuration :
     type === 'info' ? TOAST_CONFIG.infoDuration :
     type === 'success' ? TOAST_CONFIG.successDuration :
     type === 'warning' ? TOAST_CONFIG.warningDuration :
     TOAST_CONFIG.defaultDuration);
  
  // Progress-Bar Animation
  progressBar.style.animationDuration = `${duration}ms`;
  progressContainer.appendChild(progressBar);
  
  // Zusammenbauen
  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  toast.appendChild(progressContainer);
  
  // Zum Container hinzufügen
  container.appendChild(toast);
  
  // Animation starten
  requestAnimationFrame(() => {
    toast.classList.add('showing');
  });
  
  // Auto-Entfernen (außer wenn duration 0 oder negativ)
  if (duration > 0) {
    let remainingTime = duration;
    let startTime = Date.now();
    let paused = false;
    
    const updateProgress = () => {
      if (paused) return;
      
      const elapsed = Date.now() - startTime;
      remainingTime = duration - elapsed;
      
      if (remainingTime <= 0) {
        removeToast(toast);
      } else {
        requestAnimationFrame(updateProgress);
      }
    };
    
    // Pause bei Hover
    toast.addEventListener('mouseenter', () => {
      paused = true;
      progressBar.style.animationPlayState = 'paused';
    });
    
    toast.addEventListener('mouseleave', () => {
      paused = false;
      startTime = Date.now() - (duration - remainingTime);
      progressBar.style.animationPlayState = 'running';
      updateProgress();
    });
    
    // Progress-Update starten
    updateProgress();
    
    // Fallback-Timeout (falls Animation nicht läuft)
    const timeoutId = setTimeout(() => {
      if (!paused) {
        removeToast(toast);
      }
    }, duration);
    
    // Timeout-ID speichern für mögliches Abbrechen
    toast._timeoutId = timeoutId;
  }
  
  return toast;
}

/**
 * Entfernt einen Toast mit Animation
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  
  // Timeout abbrechen falls vorhanden
  if (toast._timeoutId) {
    clearTimeout(toast._timeoutId);
  }
  
  // Ausblend-Animation
  toast.classList.remove('showing');
  toast.classList.add('hiding');
  
  // Nach Animation entfernen
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Zeigt eine Nachricht an (Kompatibilität - verwendet jetzt Toasts)
 * @deprecated Verwenden Sie showToast() für mehr Optionen
 */
function showMessage(text, type = 'info') {
  // Für Rückwärtskompatibilität: showMessage ruft showToast auf
  showToast(text, type);
}

/**
 * Zeigt einen Loading-Zustand mit Skeleton-Screens an
 */
function showLoading(containerId, type = 'default') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (type === 'machines') {
    container.innerHTML = `
      <div class="skeleton skeleton-card" role="status" aria-live="polite" aria-label="Maschinen werden geladen"></div>
      <div class="skeleton skeleton-card" role="status" aria-live="polite"></div>
      <div class="skeleton skeleton-card" role="status" aria-live="polite"></div>
      <div class="skeleton skeleton-card" role="status" aria-live="polite"></div>
    `;
  } else if (type === 'slots') {
    container.innerHTML = `
      <div class="machine-slots">
        <div class="skeleton skeleton-text skeleton-text-title" aria-hidden="true"></div>
        <div class="slots-grid">
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `<div class="loading-centered" role="status" aria-live="polite">Lädt...</div>`;
  }
}

/**
 * Escaped HTML um XSS zu verhindern
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Formatiert ein Datum für die Anzeige (Heute, Morgen, etc.)
 */
function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Heute';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Morgen';
  } else {
    // Format: DD.MM.YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}

/**
 * Aktualisiert die Datum-Anzeige
 */
function updateDateDisplay(dateString) {
  const dateDisplay = document.getElementById('date-display');
  if (dateDisplay) {
    const formatted = formatDateForDisplay(dateString);
    dateDisplay.textContent = formatted ? `(${formatted})` : '';
  }
}

/**
 * Modal-Funktionen
 */
function setupModalListeners() {
  const overlay = document.getElementById('modal-overlay');
  const cancelBtn = document.getElementById('modal-cancel');
  const confirmBtn = document.getElementById('modal-confirm');
  
  // Null-Checks
  if (!overlay || !cancelBtn || !confirmBtn) {
    if (typeof logger !== 'undefined') {
      logger.warn('Modal-Elemente nicht gefunden');
    } else {
      console.warn('Modal-Elemente nicht gefunden');
    }
    return;
  }
  
  // Overlay-Klick schließt Modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Escape-Taste schließt Modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Cancel-Button
  cancelBtn.addEventListener('click', () => {
    closeModal();
  });
}

/**
 * Zeigt ein Modal an und gibt Promise zurück
 */
function showModal(title, message, confirmText = 'Bestätigen') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    
    if (!overlay || !titleEl || !messageEl || !confirmBtn) {
      if (typeof logger !== 'undefined') {
        logger.error('Modal-Elemente nicht gefunden');
      } else {
        console.error('Modal-Elemente nicht gefunden');
      }
      resolve(false);
      return;
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    
    // Entferne alte Event-Listener (falls vorhanden)
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Event-Listener für Confirm-Button
    const handleConfirm = () => {
      // WICHTIG: resolve(true) BEVOR closeModal() aufgerufen wird
      // damit closeModal() nicht das Promise mit false auflöst
      resolve(true);
      // Dann Modal schließen (ohne Promise aufzulösen)
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      removeFocusTrap();
      // Entferne den Resolver, damit closeModal() ihn nicht verwendet
      overlay._resolve = null;
    };
    
    newConfirmBtn.onclick = handleConfirm;
    
    // Promise-Resolver speichern (für Cancel/Close)
    overlay._resolve = resolve;
    
    // Modal anzeigen
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    
    // Focus-Trap einrichten
    setupFocusTrap();
  });
}

/**
 * Schließt das Modal
 */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  
  // Promise auflösen mit false
  if (overlay._resolve) {
    overlay._resolve(false);
    overlay._resolve = null;
  }
  
  // Focus-Trap entfernen
  removeFocusTrap();
}

/**
 * Richtet Event-Delegation für Slot-Clicks ein (einmalig beim App-Start)
 * Diese Funktion wird nur einmal aufgerufen und funktioniert auch nach dynamischem HTML-Update
 */
/**
 * Richtet Event-Delegation für Slot-Clicks ein
 * Wird einmalig beim App-Start aufgerufen
 * Verwendet Event-Delegation, damit es auch nach dynamischem HTML-Update funktioniert
 */
function setupSlotClickDelegation() {
  const slotsContainer = document.getElementById('slots-container');
  
  if (!slotsContainer) {
    if (typeof logger !== 'undefined') {
      logger.error('slots-container Element nicht gefunden für Event-Delegation');
    } else {
      console.error('slots-container Element nicht gefunden für Event-Delegation');
    }
    return;
  }
  
  // Prüfe ob Event-Listener bereits registriert wurde (verhindere mehrfache Registrierung)
  if (slotsContainer.dataset.clickDelegationSetup === 'true') {
    if (typeof logger !== 'undefined') {
      logger.debug('Event-Delegation für Slot-Clicks bereits eingerichtet');
    } else {
      console.log('Event-Delegation für Slot-Clicks bereits eingerichtet');
    }
    return;
  }
  
  // Event-Delegation: Ein Event-Listener auf dem Container für alle Slot-Clicks
  slotsContainer.addEventListener('click', (e) => {
    // Debug: Logge jeden Click im Container
    if (typeof logger !== 'undefined') {
      logger.debug('Click im slots-container erkannt', {
        target: e.target.tagName,
        targetClass: e.target.className,
        targetId: e.target.id
      });
    }
    
    // Prüfe ob Klick auf einem freien Slot war (oder innerhalb eines freien Slots)
    // closest() findet das nächste übergeordnete Element mit der Klasse .slot.free
    const slot = e.target.closest('.slot.free');
    
    if (!slot) {
      // Klick war nicht auf einem freien Slot - könnte auf belegtem Slot oder anderem Element sein
      if (typeof logger !== 'undefined') {
        logger.debug('Click nicht auf freiem Slot', {
          clickedElement: e.target.tagName,
          clickedClass: e.target.className
        });
      }
      return;
    }
    
    // Debug: Slot wurde gefunden
    if (typeof logger !== 'undefined') {
      logger.debug('Freier Slot gefunden für Click', {
        slotId: slot.id,
        machineId: slot.dataset.machineId,
        slotIndex: slot.dataset.slotIndex
      });
    }
    
    // Extrahiere Machine-ID und Slot-Label
    const machineId = parseInt(slot.dataset.machineId);
    const slotTimeElement = slot.querySelector('.slot-time');
    
    if (!slotTimeElement) {
      if (typeof logger !== 'undefined') {
        logger.warn('Slot-Click: .slot-time Element nicht gefunden', {
          slotId: slot.id,
          slotHTML: slot.outerHTML.substring(0, 200)
        });
      } else {
        console.warn('Slot-Click: .slot-time Element nicht gefunden', slot);
      }
      return;
    }
    
    if (isNaN(machineId)) {
      if (typeof logger !== 'undefined') {
        logger.warn('Slot-Click: Machine-ID ist keine gültige Zahl', {
          machineId: slot.dataset.machineId,
          slotId: slot.id
        });
      } else {
        console.warn('Slot-Click: Machine-ID ist keine gültige Zahl', {
          machineId: slot.dataset.machineId,
          slotId: slot.id
        });
      }
      return;
    }
    
    const slotLabel = slotTimeElement.textContent.trim();
    
    if (!slotLabel) {
      if (typeof logger !== 'undefined') {
        logger.warn('Slot-Click: Slot-Label ist leer', {
          machineId,
          slotId: slot.id
        });
      } else {
        console.warn('Slot-Click: Slot-Label ist leer', { machineId, slotId: slot.id });
      }
      return;
    }
    
    // Debug: Rufe handleSlotClick auf
    if (typeof logger !== 'undefined') {
      logger.debug('Rufe handleSlotClick auf', {
        machineId,
        slotLabel
      });
    } else {
      console.log('Rufe handleSlotClick auf', { machineId, slotLabel });
    }
    
    // Rufe handleSlotClick auf
    handleSlotClick(machineId, slotLabel);
  });
  
  // Markiere Container als eingerichtet (verhindert mehrfache Registrierung)
  slotsContainer.dataset.clickDelegationSetup = 'true';
  
  if (typeof logger !== 'undefined') {
    logger.debug('Event-Delegation für Slot-Clicks eingerichtet');
  } else {
    console.log('Event-Delegation für Slot-Clicks eingerichtet');
  }
}

/**
 * Richtet Keyboard-Navigation für Slots ein
 * Vereinfachte Version: Nur Keyboard-Navigation, keine Click-Handler (durch Event-Delegation abgedeckt)
 */
function setupSlotKeyboardNavigation() {
  const allSlots = document.querySelectorAll('.slot[role="gridcell"]');
  
  if (!allSlots || allSlots.length === 0) {
    return; // Keine Slots vorhanden
  }
  
  allSlots.forEach(slot => {
    if (!slot || !slot.parentNode) {
      return; // Slot oder Parent nicht vorhanden
    }
    
    // Nur Keyboard-Navigation Event-Listener hinzufügen
    // Kein cloneNode() mehr nötig, da Click-Handler durch Event-Delegation abgedeckt wird
    slot.addEventListener('keydown', (e) => {
      handleSlotKeydown(e, slot);
    });
  });
  
  if (typeof logger !== 'undefined') {
    logger.debug('Keyboard-Navigation für Slots eingerichtet', { slotsCount: allSlots.length });
  } else {
    console.log('Keyboard-Navigation für Slots eingerichtet', { slotsCount: allSlots.length });
  }
}

/**
 * Behandelt Keyboard-Events für Slots
 */
function handleSlotKeydown(e, slotElement) {
  if (!slotElement || !e) {
    return;
  }
  
  const key = e.key;
  const machineId = parseInt(slotElement.dataset.machineId);
  const currentSlotIndex = parseInt(slotElement.dataset.slotIndex);
  
  // Null-Checks
  if (isNaN(machineId) || isNaN(currentSlotIndex)) {
    return;
  }
  
  // Enter oder Leertaste: Slot aktivieren
  if (key === 'Enter' || key === ' ') {
    e.preventDefault();
    if (slotElement.classList.contains('free')) {
      const slotTimeElement = slotElement.querySelector('.slot-time');
      if (slotTimeElement) {
        const slotLabel = slotTimeElement.textContent;
        handleSlotClick(machineId, slotLabel);
      }
    }
    return;
  }
  
  // Arrow-Keys: Navigation zwischen Slots
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    e.preventDefault();
    navigateToSlot(key, machineId, currentSlotIndex, slotElement);
  }
}

/**
 * Navigiert zu einem Slot basierend auf Arrow-Key
 */
function navigateToSlot(direction, machineId, currentIndex, currentElement) {
  const slotsPerMachine = slots.length;
  let targetIndex = currentIndex;
  
  switch (direction) {
    case 'ArrowRight':
      targetIndex = (currentIndex + 1) % slotsPerMachine;
      break;
    case 'ArrowLeft':
      targetIndex = (currentIndex - 1 + slotsPerMachine) % slotsPerMachine;
      break;
    case 'ArrowDown':
      // Nächste Maschine, gleicher Slot-Index
      const currentMachineIndex = machines.findIndex(m => m.id === machineId);
      if (currentMachineIndex < machines.length - 1) {
        const nextMachine = machines[currentMachineIndex + 1];
        const nextSlot = document.querySelector(
          `.slot[data-machine-id="${nextMachine.id}"][data-slot-index="${currentIndex}"]`
        );
        if (nextSlot) {
          focusSlot(nextSlot);
          return;
        }
      }
      break;
    case 'ArrowUp':
      // Vorherige Maschine, gleicher Slot-Index
      const currentMachineIdx = machines.findIndex(m => m.id === machineId);
      if (currentMachineIdx > 0) {
        const prevMachine = machines[currentMachineIdx - 1];
        const prevSlot = document.querySelector(
          `.slot[data-machine-id="${prevMachine.id}"][data-slot-index="${currentIndex}"]`
        );
        if (prevSlot) {
          focusSlot(prevSlot);
          return;
        }
      }
      break;
  }
  
  // Navigation innerhalb derselben Maschine
  const targetSlot = document.querySelector(
    `.slot[data-machine-id="${machineId}"][data-slot-index="${targetIndex}"]`
  );
  if (targetSlot) {
    focusSlot(targetSlot);
  }
}

/**
 * Setzt Focus auf einen Slot
 */
function focusSlot(slotElement) {
  // Alle Slots in derselben Maschine auf tabindex="-1" setzen
  const machineId = slotElement.dataset.machineId;
  const allMachineSlots = document.querySelectorAll(
    `.slot[data-machine-id="${machineId}"]`
  );
  allMachineSlots.forEach(slot => {
    slot.setAttribute('tabindex', '-1');
  });
  
  // Ziel-Slot fokussieren
  slotElement.setAttribute('tabindex', '0');
  slotElement.focus();
}

/**
 * Focus-Trap für Modals
 */
let focusTrapElements = [];
let previousActiveElement = null;

function setupFocusTrap() {
  const modal = document.getElementById('modal-overlay');
  if (!modal) return;
  
  // Speichere aktuelles fokussiertes Element
  previousActiveElement = document.activeElement;
  
  // Finde alle fokussierbaren Elemente im Modal
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  focusTrapElements = Array.from(modal.querySelectorAll(focusableSelectors));
  
  if (focusTrapElements.length === 0) return;
  
  const firstElement = focusTrapElements[0];
  const lastElement = focusTrapElements[focusTrapElements.length - 1];
  
  // Focus-Trap Event-Listener
  const trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift+Tab: Wenn auf erstem Element, springe zum letzten
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: Wenn auf letztem Element, springe zum ersten
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  modal.addEventListener('keydown', trapHandler);
  modal._trapHandler = trapHandler;
  
  // Focus auf erstes Element setzen
  setTimeout(() => {
    firstElement.focus();
  }, 100);
}

function removeFocusTrap() {
  const modal = document.getElementById('modal-overlay');
  if (!modal || !modal._trapHandler) return;
  
  modal.removeEventListener('keydown', modal._trapHandler);
  modal._trapHandler = null;
  focusTrapElements = [];
  
  // Focus zurück zum vorherigen Element
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
  previousActiveElement = null;
}

// ============================================================================
// ANSICHTS-FUNKTIONEN (Tag, Woche, Monat)
// ============================================================================

/**
 * Initialisiert die Ansichts-Listener
 */
function setupViewListeners() {
  // Ansichts-Buttons
  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      switchView(view);
    });
  });
  
  // Navigation-Buttons
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');
  
  if (navPrev) {
    navPrev.addEventListener('click', () => navigateView(-1));
  }
  if (navNext) {
    navNext.addEventListener('click', () => navigateView(1));
  }
  
  // Initialisiere aktuelle Woche
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  currentWeekStart = monday.toISOString().split('T')[0];
}

/**
 * Wechselt zwischen den Ansichten
 */
function switchView(view) {
  currentView = view;
  
  // Buttons aktualisieren
  document.querySelectorAll('.view-btn').forEach(btn => {
    const isActive = btn.dataset.view === view;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });
  
  // Sektionen anzeigen/verstecken
  const daySection = document.getElementById('day-view-section');
  const weekSection = document.getElementById('week-view-section');
  const monthSection = document.getElementById('month-view-section');
  const inputSection = document.getElementById('input-section');
  const machinesSection = document.getElementById('machines-section');
  const navSection = document.getElementById('navigation-section');
  
  // Alle verstecken
  [daySection, weekSection, monthSection, inputSection, machinesSection, navSection].forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  // Entsprechende Sektion anzeigen
  if (view === 'day') {
    if (daySection) daySection.style.display = 'block';
    if (inputSection) inputSection.style.display = 'block';
    if (machinesSection) machinesSection.style.display = 'block';
    // Aktuelle Buchungen laden
    const date = document.getElementById('date-input').value;
    if (date) loadBookings(date);
  } else if (view === 'week') {
    if (weekSection) weekSection.style.display = 'block';
    if (navSection) navSection.style.display = 'block';
    loadWeekView();
  } else if (view === 'month') {
    if (monthSection) monthSection.style.display = 'block';
    if (navSection) navSection.style.display = 'block';
    loadMonthView();
  }
}

/**
 * Navigiert in der aktuellen Ansicht (vor/zurück)
 */
function navigateView(direction) {
  if (currentView === 'week') {
    const date = new Date(currentWeekStart + 'T00:00:00');
    date.setDate(date.getDate() + (direction * 7));
    currentWeekStart = date.toISOString().split('T')[0];
    loadWeekView();
  } else if (currentView === 'month') {
    currentMonth += direction;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    } else if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    loadMonthView();
  }
}

/**
 * Lädt die Wochenübersicht
 */
async function loadWeekView() {
  try {
    const weekContainer = document.getElementById('week-container');
    if (!weekContainer) return;
    
    weekContainer.innerHTML = '<div class="loading">Lade Arbeitswoche...</div>';
    
    const data = await fetchBookingsWeek(currentWeekStart);
    
    // Navigation anzeigen
    const navDisplay = document.getElementById('nav-display');
    if (navDisplay) {
      const monday = new Date(data.week_start + 'T00:00:00');
      const friday = new Date(data.week_end + 'T00:00:00');
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      navDisplay.textContent = `${monday.toLocaleDateString('de-DE', options)} - ${friday.toLocaleDateString('de-DE', options)}`;
    }
    
    // Buchungen nach Tag gruppieren
    const bookingsByDay = {};
    data.bookings.forEach(booking => {
      if (!bookingsByDay[booking.date]) {
        bookingsByDay[booking.date] = [];
      }
      bookingsByDay[booking.date].push(booking);
    });
    
    // HTML generieren
    let html = '<div class="week-grid">';
    
    // Wochentage (Montag bis Freitag)
    const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    const mondayDate = new Date(data.week_start + 'T00:00:00');
    
    for (let i = 0; i < 5; i++) {
      const dayDate = new Date(mondayDate);
      dayDate.setDate(mondayDate.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      const dayName = weekDays[i];
      const dayBookings = bookingsByDay[dateStr] || [];
      
      html += `
        <div class="week-day">
          <h3 class="week-day-header">
            ${dayName}<br>
            <span class="week-day-date">${dayDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
          </h3>
          <div class="week-day-bookings">
            ${dayBookings.length === 0 ? '<p class="no-bookings">Keine Buchungen</p>' : ''}
            ${dayBookings.map(booking => `
              <div class="week-booking" data-booking-id="${booking.id}">
                <div class="week-booking-slot">${booking.slot}</div>
                <div class="week-booking-machine">${booking.machine_name}</div>
                <div class="week-booking-user">${booking.user_name}</div>
                ${booking.user_name === currentUserName ? `
                  <button class="week-booking-delete" onclick="deleteBookingFromWeek(${booking.id}, '${booking.date}')" aria-label="Buchung löschen">×</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    weekContainer.innerHTML = html;
    
  } catch (error) {
    showMessage('Fehler beim Laden der Arbeitswoche: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Arbeitswoche', error);
    } else {
      console.error('Fehler beim Laden der Arbeitswoche:', error);
    }
  }
}

/**
 * Lädt die Monatsübersicht
 */
async function loadMonthView() {
  try {
    const monthContainer = document.getElementById('month-container');
    if (!monthContainer) return;
    
    monthContainer.innerHTML = '<div class="loading">Lade Monat...</div>';
    
    const data = await fetchBookingsMonth(currentYear, currentMonth);
    
    // Navigation anzeigen
    const navDisplay = document.getElementById('nav-display');
    if (navDisplay) {
      const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                         'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      navDisplay.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
    }
    
    // Buchungen nach Tag gruppieren
    const bookingsByDay = {};
    data.bookings.forEach(booking => {
      if (!bookingsByDay[booking.date]) {
        bookingsByDay[booking.date] = [];
      }
      bookingsByDay[booking.date].push(booking);
    });
    
    // Ersten Tag des Monats
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sonntag, 1 = Montag, etc.
    
    // HTML generieren
    let html = '<div class="month-calendar">';
    html += '<div class="month-weekdays">';
    const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    weekDays.forEach(day => {
      html += `<div class="month-weekday">${day}</div>`;
    });
    html += '</div>';
    
    html += '<div class="month-days">';
    
    // Leere Zellen für Tage vor Monatsbeginn
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Montag = 0
    for (let i = 0; i < adjustedStartDay; i++) {
      html += '<div class="month-day empty"></div>';
    }
    
    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = bookingsByDay[dateStr] || [];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isPast = date < new Date().setHours(0, 0, 0, 0);
      
      html += `
        <div class="month-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}">
          <div class="month-day-number">${day}</div>
          <div class="month-day-bookings">
            ${dayBookings.length > 0 ? `
              <div class="month-booking-count" title="${dayBookings.length} Buchung(en)">
                ${dayBookings.length}
              </div>
              <div class="month-booking-details">
                ${dayBookings.map(booking => `
                  <div class="month-booking-item">
                    <span class="month-booking-slot">${booking.slot}</span>
                    <span class="month-booking-machine">${booking.machine_name}</span>
                    <span class="month-booking-user">${booking.user_name}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    html += '</div></div>';
    monthContainer.innerHTML = html;
    
  } catch (error) {
    showMessage('Fehler beim Laden des Monats: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden des Monats', error);
    } else {
      console.error('Fehler beim Laden des Monats:', error);
    }
  }
}

/**
 * Löscht eine Buchung aus der Wochenansicht
 */
async function deleteBookingFromWeek(id, date) {
  try {
    await deleteBooking(id, date);
    await loadWeekView();
    showMessage('Buchung erfolgreich gelöscht', 'success');
  } catch (error) {
    showMessage('Fehler beim Löschen: ' + error.message, 'error');
  }
}

/**
 * Authentifizierungs-Funktionen
 */

/**
 * Prüft den aktuellen Authentifizierungs-Status
 */
async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    if (user) {
      currentUser = user;
      currentUserName = user.username;
      updateAuthUI();
    } else {
      currentUser = null;
      currentUserName = '';
      updateAuthUI();
    }
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Prüfen des Auth-Status', error);
    } else {
      console.error('Fehler beim Prüfen des Auth-Status:', error);
    }
    currentUser = null;
    updateAuthUI();
  }
}

/**
 * Aktualisiert die UI basierend auf Auth-Status
 */
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');
  const nameInput = document.getElementById('name-input');
  
  // Null-Checks für alle Elemente
  if (!loginBtn || !userInfo || !usernameDisplay || !nameInput) {
    if (typeof logger !== 'undefined') {
      logger.warn('Einige Auth-UI-Elemente nicht gefunden');
    } else {
      console.warn('Einige Auth-UI-Elemente nicht gefunden');
    }
    return;
  }
  
  if (currentUser && currentUser.username) {
    // Eingeloggt
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    usernameDisplay.textContent = currentUser.username;
    
    // Name-Input verstecken (nicht mehr benötigt - Benutzername kommt aus Session)
    const nameInputGroup = nameInput.closest('.input-group');
    if (nameInputGroup) {
      nameInputGroup.style.display = 'none';
    }
    nameInput.value = currentUser.username;
    nameInput.disabled = true;
  } else {
    // Nicht eingeloggt
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
    
    // Name-Input anzeigen (aber wird nicht mehr für Buchungen verwendet - nur für Info)
    const nameInputGroup = nameInput.closest('.input-group');
    if (nameInputGroup) {
      nameInputGroup.style.display = 'block';
    }
    nameInput.disabled = false;
    nameInput.placeholder = 'Bitte melden Sie sich an, um zu buchen';
  }
}

/**
 * Richtet Event-Listener für Login/Logout ein
 */
function setupAuthListeners() {
  // Login-Button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      showLoginModal();
    });
  }
  
  // Logout-Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Login-Formular
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleLogin();
    });
  }
  
  // Register-Formular
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleRegister();
    });
  }
  
  // Modal-Schließen-Buttons
  const closeLoginBtn = document.getElementById('close-login');
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', closeLoginModal);
  }
  
  const closeRegisterBtn = document.getElementById('close-register');
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener('click', closeRegisterModal);
  }
  
  // Wechsel zwischen Login und Register
  const showRegisterBtn = document.getElementById('show-register');
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      closeLoginModal();
      showRegisterModal();
    });
  }
  
  const showLoginBtn = document.getElementById('show-login');
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      closeRegisterModal();
      showLoginModal();
    });
  }
}

/**
 * Zeigt das Login-Modal
 */
function showLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('login-username').focus();
  }
}

/**
 * Schließt das Login-Modal
 */
function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('login-form').reset();
  }
}

/**
 * Zeigt das Register-Modal
 */
function showRegisterModal() {
  const modal = document.getElementById('register-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('register-username').focus();
  }
}

/**
 * Schließt das Register-Modal
 */
function closeRegisterModal() {
  const modal = document.getElementById('register-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('register-form').reset();
  }
}

/**
 * Behandelt Login
 */
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    showMessage('Bitte geben Sie Benutzername und Passwort ein.', 'error');
    return;
  }
  
  try {
    showMessage('Anmeldung läuft...', 'info');
    const result = await login(username, password);
    
    // Backend gibt direkt User-Objekt zurück: { id, username, role }
    if (result && result.username) {
      currentUser = result;
      currentUserName = result.username;
      updateAuthUI();
      closeLoginModal();

      // Prüfe, ob dies der erste Login auf diesem Gerät ist
      const hasSeenWelcome = storage.getItem('waschmaschine_welcome_shown') === 'true';
      if (!hasSeenWelcome) {
        showMessage(
          `Herzlich willkommen in der GBMZ-Waschküche, ${result.username}! Schön, dass Sie unsere Buchungsapp nutzen.`,
          'success'
        );
        storage.setItem('waschmaschine_welcome_shown', 'true');
      } else {
        showMessage(`Willkommen zurück in der GBMZ-Waschküche, ${result.username}!`, 'success');
      }
    } else {
      showMessage('Anmeldung fehlgeschlagen.', 'error');
    }
  } catch (error) {
    showMessage('Fehler bei der Anmeldung: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Login-Fehler', error);
    } else {
      console.error('Login-Fehler:', error);
    }
  }
}

/**
 * Behandelt Registrierung
 */
async function handleRegister() {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  
  if (!username || !password) {
    showMessage('Bitte geben Sie Benutzername und Passwort ein.', 'error');
    return;
  }
  
  // Validierung: Benutzername
  if (username.length < 3 || username.length > 50) {
    showMessage('Benutzername muss zwischen 3 und 50 Zeichen lang sein.', 'error');
    return;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showMessage('Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten.', 'error');
    return;
  }
  
  // Validierung: Passwort
  if (password.length < 6 || password.length > 100) {
    showMessage('Passwort muss zwischen 6 und 100 Zeichen lang sein.', 'error');
    return;
  }
  
  try {
    showMessage('Registrierung läuft...', 'info');
    const result = await register(username, password);
    
    // Nach erfolgreicher Registrierung automatisch einloggen (wenn Backend User zurückgibt)
    if (result && result.user) {
      currentUser = result.user;
      currentUserName = result.user.username;
      updateAuthUI();
      closeRegisterModal();

      // Spezielle Willkommensnachricht für neue Nutzer:innen
      showMessage(
        `Registrierung erfolgreich! Herzlich willkommen in der GBMZ-Waschküche, ${result.user.username}!`,
        'success'
      );
      storage.setItem('waschmaschine_welcome_shown', 'true');
    } else {
      showMessage('Registrierung erfolgreich! Sie können sich jetzt anmelden.', 'success');
      closeRegisterModal();
      showLoginModal();
      document.getElementById('login-username').value = username;
    }
  } catch (error) {
    showMessage('Fehler bei der Registrierung: ' + error.message, 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Register-Fehler', error);
    } else {
      console.error('Register-Fehler:', error);
    }
  }
}

/**
 * Behandelt Logout
 */
async function handleLogout() {
  // Bestätigung mit confirm (einfacher als Modal)
  if (!confirm('Möchten Sie sich wirklich abmelden?')) {
    return;
  }
  
  try {
    const response = await logout();
    
    // UI zurücksetzen
    currentUser = null;
    currentUserName = '';
    updateAuthUI();
    
    // Name-Input zurücksetzen
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
      nameInput.value = '';
      nameInput.disabled = false;
    }
    
    showMessage('Sie wurden erfolgreich abgemeldet.', 'success');
    
    if (typeof logger !== 'undefined') {
      logger.info('Erfolgreich abgemeldet');
    }
  } catch (error) {
    showMessage('Fehler beim Abmelden: ' + (error.message || 'Unbekannter Fehler'), 'error');
    if (typeof logger !== 'undefined') {
      logger.error('Logout-Fehler', error);
    } else {
      console.error('Logout-Fehler:', error);
    }
  }
}

