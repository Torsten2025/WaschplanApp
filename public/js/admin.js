/**
 * Admin-Bereich JavaScript
 */

const API_BASE = '/api/v1';
let currentUser = null;

/**
 * Escaped HTML um XSS zu verhindern
 */
function escapeHtml(text) {
  if (text === null || text === undefined) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  initializeAdmin().catch(error => {
    showFallbackError('Kritischer Fehler beim Initialisieren des Admin-Bereichs. Bitte laden Sie die Seite neu.');
    if (typeof logger !== 'undefined') {
      logger.error('Kritischer Initialisierungsfehler', error);
    } else {
      console.error('Kritischer Initialisierungsfehler:', error);
    }
  });
});

/**
 * Initialisiert den Admin-Bereich
 */
async function initializeAdmin() {
  try {
    await checkSession();
    setupEventListeners();
  } catch (error) {
    showFallbackError('Fehler beim Initialisieren. Bitte laden Sie die Seite neu.');
    throw error;
  }
}

/**
 * Event-Listener einrichten
 */
function setupEventListeners() {
  try {
    // Login-Formular
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout-Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Passwort-Ändern-Button
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }
    
    // Passwort-Änderung-Formular
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    // Tab-Navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      if (tab && tab.dataset && tab.dataset.tab) {
        tab.addEventListener('click', () => {
          switchTab(tab.dataset.tab);
        });
      }
    });
    
    // Maschinen-Formular
    const machineForm = document.getElementById('machine-form');
    if (machineForm) {
      machineForm.addEventListener('submit', handleMachineSubmit);
    }
    
    // Benutzer-Formular
    const userForm = document.getElementById('user-form');
    if (userForm) {
      userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Modal schließen bei Klick außerhalb
    const machineModal = document.getElementById('machine-modal');
    if (machineModal) {
      machineModal.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'machine-modal') {
          closeMachineModal();
        }
      });
    }
    
    const userModal = document.getElementById('user-modal');
    if (userModal) {
      userModal.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'user-modal') {
          closeUserModal();
        }
      });
    }
    
    const changePasswordModal = document.getElementById('change-password-modal');
    if (changePasswordModal) {
      changePasswordModal.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'change-password-modal') {
          closeChangePasswordModal();
        }
      });
    }
  } catch (error) {
    showFallbackError('Fehler beim Einrichten der Event-Listener.');
    if (typeof logger !== 'undefined') {
      logger.error('Event-Listener Setup Fehler', error);
    } else {
      console.error('Event-Listener Setup Fehler:', error);
    }
  }
}

/**
 * Session prüfen
 */
async function checkSession() {
  try {
    const response = await fetch(`${API_BASE}/auth/session`, {
      credentials: 'include'
    });
    
    // 401 ist normal, wenn noch nicht eingeloggt - kein Fehler
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.role === 'admin') {
        currentUser = data.data;
        showAdminArea();
        loadAllData();
      } else {
        showLogin();
      }
    } else if (response.status === 401) {
      // Nicht eingeloggt - normal beim ersten Laden
      showLogin();
    } else {
      // Anderer Fehler
      if (typeof logger !== 'undefined') {
        logger.warn('Session-Check fehlgeschlagen', { status: response.status });
      }
      showLogin();
    }
  } catch (error) {
    // Netzwerk-Fehler - zeige Login, aber logge nicht als Fehler
    if (typeof logger !== 'undefined') {
      logger.debug('Session-Check: Nicht eingeloggt oder Netzwerk-Fehler', error);
    }
    showLogin();
  }
}

/**
 * Login behandeln
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const errorDiv = document.getElementById('login-error');
  
  // Null-Checks
  if (!usernameInput || !passwordInput) {
    showFallbackError('Login-Formular-Elemente nicht gefunden.');
    return;
  }
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  // Validierung
  if (!username || !password) {
    if (errorDiv) {
      errorDiv.textContent = 'Bitte geben Sie Benutzername und Passwort ein.';
      errorDiv.style.display = 'block';
    }
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (typeof logger !== 'undefined') {
      logger.debug('Login-Response erhalten', { success: data.success, hasData: !!data.data, role: data.data?.role });
    }
    
    // Prüfe ob Login erfolgreich war
    if (!data.success) {
      if (errorDiv) {
        errorDiv.textContent = data.error || 'Login fehlgeschlagen';
        errorDiv.style.display = 'block';
      }
      return;
    }
    
    // Prüfe ob Benutzer-Daten vorhanden sind
    if (!data.data) {
      if (errorDiv) {
        errorDiv.textContent = 'Ungültige Antwort vom Server';
        errorDiv.style.display = 'block';
      }
      if (typeof logger !== 'undefined') {
        logger.warn('Login erfolgreich, aber keine Benutzer-Daten erhalten');
      }
      return;
    }
    
    // Prüfe ob Benutzer Admin-Rolle hat
    if (data.data.role !== 'admin') {
      if (errorDiv) {
        errorDiv.textContent = 'Nur Administratoren können sich hier anmelden.';
        errorDiv.style.display = 'block';
      }
      if (typeof logger !== 'undefined') {
        logger.warn('Login-Versuch mit nicht-Admin-Rolle', { role: data.data.role });
      }
      return;
    }
    
    // Login erfolgreich - Admin-Bereich anzeigen
    currentUser = data.data;
    showAdminArea();
    await loadAllData();
    
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
    
    // Login-Formular zurücksetzen
    if (passwordInput) passwordInput.value = '';
    
    if (typeof logger !== 'undefined') {
      logger.info('Admin erfolgreich eingeloggt', { username: currentUser.username });
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message || 'Fehler beim Login. Bitte versuchen Sie es erneut.';
      errorDiv.style.display = 'block';
    }
    if (typeof logger !== 'undefined') {
      logger.error('Login-Fehler', error);
    } else {
      console.error('Login-Fehler:', error);
    }
  }
}

/**
 * Logout behandeln
 */
async function handleLogout() {
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // UI zurücksetzen
    currentUser = null;
    
    if (typeof logger !== 'undefined') {
      logger.info('Erfolgreich abgemeldet, weiterleiten zur Haupt-App');
    }
    
    // Zur Haupt-App weiterleiten
    window.location.href = '/';
  } catch (error) {
    // Auch bei Fehler zur Haupt-App weiterleiten
    currentUser = null;
    
    if (typeof logger !== 'undefined') {
      logger.error('Logout-Fehler', error);
    } else {
      console.error('Logout-Fehler:', error);
    }
    
    // Trotzdem zur Haupt-App weiterleiten
    window.location.href = '/';
  }
}

/**
 * Login-Bereich anzeigen
 */
function showLogin() {
  try {
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    
    if (loginSection) {
      loginSection.style.display = 'block';
    }
    if (adminSection) {
      adminSection.style.display = 'none';
    }
  } catch (error) {
    showFallbackError('Fehler beim Anzeigen des Login-Bereichs.');
    if (typeof logger !== 'undefined') {
      logger.error('showLogin Fehler:', error);
    }
  }
}

/**
 * Admin-Bereich anzeigen
 */
function showAdminArea() {
  try {
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const currentUserEl = document.getElementById('current-user');
    
    if (loginSection) {
      loginSection.style.display = 'none';
    }
    if (adminSection) {
      adminSection.style.display = 'block';
    }
    if (currentUserEl && currentUser && currentUser.username) {
      currentUserEl.textContent = `Eingeloggt als: ${currentUser.username}`;
    }
    
    // Prüfe ob Standard-Passwort verwendet wird (Warnung anzeigen)
    checkDefaultPassword();
  } catch (error) {
    showFallbackError('Fehler beim Anzeigen des Admin-Bereichs.');
    if (typeof logger !== 'undefined') {
      logger.error('showAdminArea Fehler:', error);
    }
  }
}

/**
 * Prüft ob Standard-Passwort verwendet wird
 */
async function checkDefaultPassword() {
  try {
    const warningDiv = document.getElementById('password-warning');
    if (warningDiv && currentUser && currentUser.username === 'admin') {
      warningDiv.style.display = 'block';
    }
  } catch (error) {
    // Nicht kritisch, nur Warnung
    if (typeof logger !== 'undefined') {
      logger.error('checkDefaultPassword Fehler:', error);
    }
  }
}

/**
 * Passwort-Änderung-Modal anzeigen
 */
function showChangePasswordModal() {
  try {
    const modal = document.getElementById('change-password-modal');
    const form = document.getElementById('change-password-form');
    const errorDiv = document.getElementById('change-password-error');
    
    if (modal) {
      modal.classList.add('active');
    }
    if (form) {
      form.reset();
    }
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  } catch (error) {
    showFallbackError('Fehler beim Öffnen des Passwort-Änderungs-Dialogs.');
    if (typeof logger !== 'undefined') {
      logger.error('showChangePasswordModal Fehler:', error);
    }
  }
}

/**
 * Passwort-Änderung-Modal schließen
 */
function closeChangePasswordModal() {
  try {
    const modal = document.getElementById('change-password-modal');
    const form = document.getElementById('change-password-form');
    const errorDiv = document.getElementById('change-password-error');
    
    if (modal) {
      modal.classList.remove('active');
    }
    if (form) {
      form.reset();
    }
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('closeChangePasswordModal Fehler:', error);
    }
  }
}

/**
 * Passwort-Änderung behandeln
 */
async function handleChangePassword(e) {
  e.preventDefault();
  
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const errorDiv = document.getElementById('change-password-error');
  
  // Null-Checks
  if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !errorDiv) {
    showFallbackError('Passwort-Änderungs-Formular-Elemente nicht gefunden.');
    return;
  }
  
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  // Validierung
  if (newPassword.length < 6) {
    errorDiv.textContent = 'Das neue Passwort muss mindestens 6 Zeichen lang sein';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (newPassword !== confirmPassword) {
    errorDiv.textContent = 'Die Passwörter stimmen nicht überein';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (currentPassword === newPassword) {
    errorDiv.textContent = 'Das neue Passwort muss sich vom aktuellen Passwort unterscheiden';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert('Passwort erfolgreich geändert!');
      closeChangePasswordModal();
      // Warnung ausblenden
      const warningDiv = document.getElementById('password-warning');
      if (warningDiv) {
        warningDiv.style.display = 'none';
      }
    } else {
      errorDiv.textContent = data.error || 'Fehler beim Ändern des Passworts';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Fehler beim Ändern des Passworts. Bitte versuchen Sie es erneut.';
    errorDiv.style.display = 'block';
    if (typeof logger !== 'undefined') {
      logger.error('Passwort-Änderung Fehler', error);
    } else {
      if (typeof logger !== 'undefined') {
        logger.error('Passwort-Änderung Fehler', error);
      } else {
        console.error('Passwort-Änderung Fehler:', error);
      }
    }
  }
}

/**
 * Tab wechseln
 */
function switchTab(tabName) {
  try {
    if (!tabName) {
      if (typeof logger !== 'undefined') {
        logger.warn('switchTab: Kein Tab-Name angegeben');
      } else {
        console.warn('switchTab: Kein Tab-Name angegeben');
      }
      return;
    }
    
    // Navigation aktualisieren
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      if (tab && tab.dataset) {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      }
    });
    
    // Sections anzeigen/verstecken
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
      if (section) {
        section.classList.toggle('active', section.id === `${tabName}-tab`);
      }
    });
    
    // Daten laden
    if (tabName === 'bookings') {
      loadBookings();
    } else if (tabName === 'machines') {
      loadMachines();
    } else if (tabName === 'users') {
      loadUsers();
    }
  } catch (error) {
    showFallbackError('Fehler beim Wechseln des Tabs.');
    if (typeof logger !== 'undefined') {
      logger.error('switchTab Fehler:', error);
    }
  }
}

/**
 * Alle Daten laden
 */
async function loadAllData() {
  try {
    await Promise.all([
      loadBookings(),
      loadMachines(),
      loadUsers()
    ]);
  } catch (error) {
    showFallbackError('Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.');
    if (typeof logger !== 'undefined') {
      logger.error('loadAllData Fehler:', error);
    }
  }
}

/**
 * Buchungen laden
 */
async function loadBookings() {
  // Prüfe ob die bookings-tab Section sichtbar ist
  const bookingsTab = document.getElementById('bookings-tab');
  const isTabVisible = bookingsTab && bookingsTab.classList.contains('active');
  
  console.log('loadBookings aufgerufen');
  console.log('bookings-tab gefunden?', !!bookingsTab);
  console.log('bookings-tab sichtbar?', isTabVisible);
  console.log('bookings-tab display:', bookingsTab ? window.getComputedStyle(bookingsTab).display : 'N/A');
  
  const container = document.getElementById('bookings-container');
  
  // Null-Check
  if (!container) {
    console.error('KRITISCH: bookings-container Element nicht gefunden!');
    if (typeof logger !== 'undefined') {
      logger.error('bookings-container Element nicht gefunden');
    }
    return;
  }
  
  console.log('Container gefunden:', container);
  console.log('Container sichtbar?', container.offsetParent !== null);
  console.log('Container display:', window.getComputedStyle(container).display);
  
  // Prüfe ob Container in sichtbarer Section ist
  if (!isTabVisible) {
    console.warn('WARNUNG: bookings-tab ist nicht aktiv/sichtbar!');
    // Warte kurz und versuche es erneut (falls Timing-Problem)
    setTimeout(() => {
      console.log('Retry: loadBookings nach 100ms');
      loadBookings();
    }, 100);
    return;
  }
  
  container.innerHTML = '<p>Lädt...</p>';
  
  try {
    const dateFilter = document.getElementById('bookings-filter-date');
    let date = dateFilter ? dateFilter.value.trim() : null;
    
    // Validierung: Wenn Datum gesetzt ist, aber leer oder ungültig, auf null setzen
    if (date && date.length === 0) {
      date = null;
    }
    
    const url = date 
      ? `${API_BASE}/admin/bookings?date=${encodeURIComponent(date)}`
      : `${API_BASE}/admin/bookings`;
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: Fehler beim Laden der Buchungen`);
    }
    
    const data = await response.json();
    
    // Debug-Logging für Problemdiagnose
    console.log('=== ADMIN: BUCHUNGEN LADEN ===');
    console.log('Response Status:', response.status);
    console.log('Data:', data);
    console.log('data.success:', data.success);
    console.log('data.data:', data.data);
    console.log('data.data type:', typeof data.data);
    console.log('data.data isArray:', Array.isArray(data.data));
    console.log('data.data length:', data.data ? data.data.length : 'N/A');
    console.log('Container:', container);
    console.log('Container exists:', !!container);
    
    if (typeof logger !== 'undefined') {
      logger.debug('Admin: Buchungen geladen', {
        success: data.success,
        hasData: !!data.data,
        isArray: Array.isArray(data.data),
        length: data.data ? data.data.length : 0,
        containerExists: !!container
      });
    }
    
    // Prüfe ob escapeHtml verfügbar ist
    if (typeof escapeHtml !== 'function') {
      console.error('KRITISCH: escapeHtml ist nicht definiert!');
      container.innerHTML = `
        <div class="error-fallback">
          <p style="color: #e74c3c; font-weight: bold;">JavaScript-Fehler: escapeHtml Funktion nicht gefunden</p>
          <p style="color: #666; font-size: 0.9rem;">Bitte laden Sie die Seite neu.</p>
        </div>
      `;
      return;
    }
    
    if (data.success && data.data && Array.isArray(data.data)) {
      console.log('✓ Bedingung erfüllt: data.success && data.data && Array.isArray(data.data)');
      console.log('Anzahl Buchungen:', data.data.length);
      
      if (data.data.length > 0) {
        console.log('Rendere Tabelle mit', data.data.length, 'Buchungen');
        
        try {
          // Erstelle Tabellen-HTML
          const tableRows = data.data.map(booking => {
            console.log('Verarbeite Buchung:', booking);
            return `
              <tr>
                <td>${booking.id || '-'}</td>
                <td>${booking.date || '-'}</td>
                <td>${booking.slot || '-'}</td>
                <td>${escapeHtml(booking.machine_name || 'Unbekannt')} (${booking.machine_type === 'washer' ? 'Waschmaschine' : booking.machine_type === 'tumbler' ? 'Tumbler' : 'Trocknungsraum'})</td>
                <td>${escapeHtml(booking.user_name || 'Unbekannt')}</td>
                <td>
                  <button class="btn-admin btn-delete" onclick="deleteBooking(${booking.id})">Löschen</button>
                </td>
              </tr>
            `;
          });
          
          console.log('Table Rows erstellt:', tableRows.length);
          
          const tableHTML = `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Datum</th>
                  <th>Slot</th>
                  <th>Maschine</th>
                  <th>Benutzer</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows.join('')}
              </tbody>
            </table>
          `;
          
          console.log('Setze innerHTML auf Container');
          console.log('Container vor innerHTML:', container);
          console.log('Container.innerHTML vorher:', container.innerHTML.substring(0, 100));
          
          container.innerHTML = tableHTML;
          
          console.log('✓ innerHTML gesetzt');
          console.log('Container nach innerHTML:', container);
          console.log('Container.innerHTML nachher:', container.innerHTML.substring(0, 200));
          console.log('Container sichtbar?', container.offsetParent !== null);
          console.log('Container display:', window.getComputedStyle(container).display);
          console.log('Container visibility:', window.getComputedStyle(container).visibility);
          
          // Verifiziere dass die Tabelle wirklich im DOM ist
          const table = container.querySelector('.admin-table');
          console.log('Tabelle im DOM gefunden?', !!table);
          if (table) {
            console.log('Tabelle Zeilen:', table.querySelectorAll('tbody tr').length);
          }
          
        } catch (renderError) {
          console.error('FEHLER beim Rendern der Tabelle:', renderError);
          console.error('Render Error Stack:', renderError.stack);
          if (typeof logger !== 'undefined') {
            logger.error('Fehler beim Rendern der Buchungen', renderError);
          }
          container.innerHTML = `
            <div class="error-fallback">
              <p style="color: #e74c3c; font-weight: bold;">Fehler beim Rendern der Buchungen</p>
              <p style="color: #666; font-size: 0.9rem;">${escapeHtml(renderError.message || 'Unbekannter Fehler')}</p>
              <pre style="font-size: 0.8rem; background: #f5f5f5; padding: 10px; margin-top: 10px; overflow-x: auto;">${escapeHtml(JSON.stringify(data.data, null, 2))}</pre>
            </div>
          `;
        }
      } else {
        console.log('Keine Buchungen gefunden (Array ist leer)');
        container.innerHTML = '<p>Keine Buchungen gefunden.</p>';
      }
    } else {
      console.error('✗ Response-Format ist nicht korrekt!');
      console.error('data.success:', data.success);
      console.error('data.data:', data.data);
      console.error('Array.isArray(data.data):', Array.isArray(data.data));
      
      // Fehlerfall: Response-Format ist nicht korrekt
      if (typeof logger !== 'undefined') {
        logger.error('Ungültige Antwort vom Server beim Laden der Buchungen', { data });
      }
      container.innerHTML = `
        <div class="error-fallback">
          <p style="color: #e74c3c; font-weight: bold;">Ungültige Antwort vom Server</p>
          <p style="color: #666; font-size: 0.9rem;">Erwartetes Format: { success: true, data: [...] }</p>
          <pre style="font-size: 0.8rem; background: #f5f5f5; padding: 10px; margin-top: 10px; overflow-x: auto;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
        </div>
      `;
    }
    
    console.log('=== ENDE ADMIN: BUCHUNGEN LADEN ===');
  } catch (error) {
    container.innerHTML = `
      <div class="error-fallback">
        <p style="color: #e74c3c; font-weight: bold;">Fehler beim Laden der Buchungen</p>
        <p style="color: #666; font-size: 0.9rem;">${escapeHtml(error.message || 'Unbekannter Fehler')}</p>
        <button class="btn-admin" onclick="loadBookings()" style="margin-top: 10px;">Erneut versuchen</button>
      </div>
    `;
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Buchungen:', error);
    }
  }
}

/**
 * Maschinen laden
 */
async function loadMachines() {
  const container = document.getElementById('machines-container');
  
  // Null-Check
  if (!container) {
    if (typeof logger !== 'undefined') {
      logger.error('machines-container Element nicht gefunden');
    }
    return;
  }
  
  container.innerHTML = '<p>Lädt...</p>';
  
  try {
    const response = await fetch(`${API_BASE}/admin/machines`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: Fehler beim Laden der Maschinen`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
      container.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Typ</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map(machine => `
              <tr>
                <td>${machine.id || '-'}</td>
                <td>${escapeHtml(machine.name || 'Unbekannt')}</td>
                <td>${machine.type === 'washer' ? 'Waschmaschine' : machine.type === 'tumbler' ? 'Tumbler' : 'Trocknungsraum'}</td>
                <td>
                  <button class="btn-admin btn-edit" onclick="editMachine(${machine.id}, '${escapeHtml(machine.name || '')}', '${machine.type || 'washer'}')">Bearbeiten</button>
                  <button class="btn-admin btn-delete" onclick="deleteMachine(${machine.id})">Löschen</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p>Keine Maschinen gefunden.</p>';
    }
  } catch (error) {
    container.innerHTML = `
      <div class="error-fallback">
        <p style="color: #e74c3c; font-weight: bold;">Fehler beim Laden der Maschinen</p>
        <p style="color: #666; font-size: 0.9rem;">${escapeHtml(error.message || 'Unbekannter Fehler')}</p>
        <button class="btn-admin" onclick="loadMachines()" style="margin-top: 10px;">Erneut versuchen</button>
      </div>
    `;
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Maschinen:', error);
    }
  }
}

/**
 * Benutzer laden
 */
async function loadUsers() {
  const container = document.getElementById('users-container');
  
  // Null-Check
  if (!container) {
    if (typeof logger !== 'undefined') {
      logger.error('users-container Element nicht gefunden');
    }
    return;
  }
  
  container.innerHTML = '<p>Lädt...</p>';
  
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: Fehler beim Laden der Benutzer`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
      container.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Benutzername</th>
              <th>Rolle</th>
              <th>Erstellt am</th>
              <th>Letzter Login</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map(user => `
              <tr>
                <td>${user.id || '-'}</td>
                <td>${escapeHtml(user.username || 'Unbekannt')}</td>
                <td><span class="status-badge status-${user.role || 'user'}">${user.role === 'admin' ? 'Admin' : 'Benutzer'}</span></td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : '-'}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleString('de-DE') : 'Nie'}</td>
                <td>
                  <button class="btn-admin btn-edit" onclick="editUser(${user.id}, '${escapeHtml(user.username || '')}', '${user.role || 'user'}')">Bearbeiten</button>
                  <button class="btn-admin btn-delete" onclick="deleteUser(${user.id})">Löschen</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p>Keine Benutzer gefunden.</p>';
    }
  } catch (error) {
    container.innerHTML = `
      <div class="error-fallback">
        <p style="color: #e74c3c; font-weight: bold;">Fehler beim Laden der Benutzer</p>
        <p style="color: #666; font-size: 0.9rem;">${escapeHtml(error.message || 'Unbekannter Fehler')}</p>
        <button class="btn-admin" onclick="loadUsers()" style="margin-top: 10px;">Erneut versuchen</button>
      </div>
    `;
    if (typeof logger !== 'undefined') {
      logger.error('Fehler beim Laden der Benutzer:', error);
    }
  }
}

/**
 * Buchung löschen
 */
async function deleteBooking(id) {
  if (!id || isNaN(id)) {
    alert('Ungültige Buchungs-ID');
    return;
  }
  
  if (!confirm('Möchten Sie diese Buchung wirklich löschen?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/bookings/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert('Buchung erfolgreich gelöscht');
      await loadBookings();
    } else {
      alert('Fehler: ' + (data.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    alert('Fehler beim Löschen der Buchung. Bitte versuchen Sie es erneut.');
    if (typeof logger !== 'undefined') {
      logger.error('deleteBooking Fehler:', error);
    }
  }
}

/**
 * Maschinen-Formular anzeigen
 */
function showMachineForm(id = null, name = '', type = 'washer') {
  try {
    const idInput = document.getElementById('machine-id');
    const nameInput = document.getElementById('machine-name');
    const typeInput = document.getElementById('machine-type');
    const titleEl = document.getElementById('machine-modal-title');
    const modal = document.getElementById('machine-modal');
    
    if (idInput) idInput.value = id || '';
    if (nameInput) nameInput.value = name || '';
    if (typeInput) typeInput.value = type || 'washer';
    if (titleEl) titleEl.textContent = id ? 'Maschine bearbeiten' : 'Neue Maschine';
    if (modal) modal.classList.add('active');
  } catch (error) {
    showFallbackError('Fehler beim Öffnen des Maschinen-Formulars.');
    if (typeof logger !== 'undefined') {
      logger.error('showMachineForm Fehler:', error);
    }
  }
}

/**
 * Maschinen-Formular schließen
 */
function closeMachineModal() {
  try {
    const modal = document.getElementById('machine-modal');
    const form = document.getElementById('machine-form');
    
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('closeMachineModal Fehler:', error);
    }
  }
}

/**
 * Maschine bearbeiten
 */
function editMachine(id, name, type) {
  showMachineForm(id, name, type);
}

/**
 * Maschinen-Formular absenden
 */
async function handleMachineSubmit(e) {
  e.preventDefault();
  
  const idInput = document.getElementById('machine-id');
  const nameInput = document.getElementById('machine-name');
  const typeInput = document.getElementById('machine-type');
  
  // Null-Checks
  if (!nameInput || !typeInput) {
    alert('Formular-Elemente nicht gefunden.');
    return;
  }
  
  const id = idInput ? idInput.value : null;
  const name = nameInput.value.trim();
  const type = typeInput.value;
  
  // Validierung
  if (!name || name.length === 0) {
    alert('Bitte geben Sie einen Namen ein.');
    return;
  }
  
  try {
    const url = id 
      ? `${API_BASE}/admin/machines/${id}`
      : `${API_BASE}/admin/machines`;
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, type })
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert(id ? 'Maschine erfolgreich aktualisiert' : 'Maschine erfolgreich erstellt');
      closeMachineModal();
      await loadMachines();
    } else {
      alert('Fehler: ' + (data.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    alert('Fehler beim Speichern der Maschine. Bitte versuchen Sie es erneut.');
    if (typeof logger !== 'undefined') {
      logger.error('handleMachineSubmit Fehler:', error);
    }
  }
}

/**
 * Maschine löschen
 */
async function deleteMachine(id) {
  if (!id || isNaN(id)) {
    alert('Ungültige Maschinen-ID');
    return;
  }
  
  if (!confirm('Möchten Sie diese Maschine wirklich löschen?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/machines/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert('Maschine erfolgreich gelöscht');
      await loadMachines();
    } else {
      alert('Fehler: ' + (data.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    alert('Fehler beim Löschen der Maschine. Bitte versuchen Sie es erneut.');
    if (typeof logger !== 'undefined') {
      logger.error('deleteMachine Fehler:', error);
    }
  }
}

/**
 * Benutzer-Formular anzeigen
 */
function showUserForm(id = null, username = '', role = 'user') {
  try {
    const idInput = document.getElementById('user-id');
    const usernameInput = document.getElementById('user-username');
    const passwordInput = document.getElementById('user-password');
    const roleInput = document.getElementById('user-role');
    const titleEl = document.getElementById('user-modal-title');
    const modal = document.getElementById('user-modal');
    
    if (idInput) idInput.value = id || '';
    if (usernameInput) usernameInput.value = username || '';
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.required = !id; // Nur bei neuen Benutzern erforderlich
    }
    if (roleInput) roleInput.value = role || 'user';
    if (titleEl) titleEl.textContent = id ? 'Benutzer bearbeiten' : 'Neuer Benutzer';
    if (modal) modal.classList.add('active');
  } catch (error) {
    showFallbackError('Fehler beim Öffnen des Benutzer-Formulars.');
    if (typeof logger !== 'undefined') {
      logger.error('showUserForm Fehler:', error);
    }
  }
}

/**
 * Benutzer-Formular schließen
 */
function closeUserModal() {
  try {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('closeUserModal Fehler:', error);
    }
  }
}

/**
 * Benutzer bearbeiten
 */
function editUser(id, username, role) {
  showUserForm(id, username, role);
}

/**
 * Benutzer-Formular absenden
 */
async function handleUserSubmit(e) {
  e.preventDefault();
  
  const idInput = document.getElementById('user-id');
  const usernameInput = document.getElementById('user-username');
  const passwordInput = document.getElementById('user-password');
  const roleInput = document.getElementById('user-role');
  
  // Null-Checks
  if (!usernameInput || !roleInput) {
    alert('Formular-Elemente nicht gefunden.');
    return;
  }
  
  const id = idInput ? idInput.value : null;
  const username = usernameInput.value.trim();
  const password = passwordInput ? passwordInput.value : '';
  const role = roleInput.value;
  
  // Validierung
  if (!username || username.length < 3) {
    alert('Benutzername muss mindestens 3 Zeichen lang sein.');
    return;
  }
  
  if (!id && (!password || password.length < 6)) {
    alert('Passwort muss mindestens 6 Zeichen lang sein.');
    return;
  }
  
  const body = { username, role };
  if (password && password.length > 0) {
    body.password = password;
  }
  
  try {
    const url = id 
      ? `${API_BASE}/admin/users/${id}`
      : `${API_BASE}/admin/users`;
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert(id ? 'Benutzer erfolgreich aktualisiert' : 'Benutzer erfolgreich erstellt');
      closeUserModal();
      await loadUsers();
    } else {
      alert('Fehler: ' + (data.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    alert('Fehler beim Speichern des Benutzers. Bitte versuchen Sie es erneut.');
    if (typeof logger !== 'undefined') {
      logger.error('handleUserSubmit Fehler:', error);
    }
  }
}

/**
 * Benutzer löschen
 */
async function deleteUser(id) {
  if (!id || isNaN(id)) {
    alert('Ungültige Benutzer-ID');
    return;
  }
  
  // Prüfe ob versucht wird, sich selbst zu löschen
  if (currentUser && currentUser.id && parseInt(id) === currentUser.id) {
    alert('Sie können sich nicht selbst löschen.');
    return;
  }
  
  if (!confirm('Möchten Sie diesen Benutzer wirklich löschen?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showLogin();
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert('Benutzer erfolgreich gelöscht');
      await loadUsers();
    } else {
      alert('Fehler: ' + (data.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    alert('Fehler beim Löschen des Benutzers. Bitte versuchen Sie es erneut.');
    if (typeof logger !== 'undefined') {
      logger.error('deleteUser Fehler:', error);
    }
  }
}


/**
 * Zeigt eine Fallback-Fehlermeldung an
 */
function showFallbackError(message) {
  try {
    // Versuche Toast-System zu verwenden (falls verfügbar)
    if (typeof showToast === 'function') {
      showToast(message, 'error', { duration: 0 }); // Kein Auto-Close
      return;
    }
    
    // Fallback: Alert
    alert(message);
  } catch (error) {
    // Letzter Fallback: Console
    if (typeof logger !== 'undefined') {
      logger.error('Fallback-Error', null, { message });
    } else {
      console.error('Fallback-Error:', message);
    }
  }
}

// Cleanup beim Entladen der Seite (optional, da Event-Listener normalerweise automatisch entfernt werden)
window.addEventListener('beforeunload', () => {
  // Event-Listener werden automatisch beim Entladen entfernt
  // Diese Funktion kann für zusätzliche Cleanup-Aufgaben verwendet werden
});

