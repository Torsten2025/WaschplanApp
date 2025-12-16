// API-Basis-URL
const API_BASE = '/api';

// Globale Variablen
let currentPage = 'dashboard';
let programs = [];
let cycles = [];
let currentCycle = null;
let cycleTimer = null;

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboard();
    loadPrograms();
    loadCycles();
    
    // Event Listeners für Formulare
    document.getElementById('new-cycle-form').addEventListener('submit', handleNewCycle);
    document.getElementById('new-program-form').addEventListener('submit', handleNewProgram);
    
    // Modal schließen bei Klick außerhalb
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
});

// Navigation
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    // Navigation aktualisieren
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // Seiten anzeigen/verstecken
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === page);
    });
    
    currentPage = page;
    
    // Daten neu laden
    if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'programs') {
        loadPrograms();
    } else if (page === 'cycles') {
        loadCycles();
    }
}

// Dashboard laden
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        const data = await response.json();
        
        // Statistiken anzeigen
        document.getElementById('running-count').textContent = data.runningCycles || 0;
        document.getElementById('completed-count').textContent = data.completedCycles || 0;
        document.getElementById('programs-count').textContent = data.totalPrograms || 0;
        
        // Aktuellen Waschgang anzeigen
        currentCycle = data.currentCycle;
        displayCurrentCycle();
        
        // Timer starten, wenn ein Waschgang läuft
        if (currentCycle && currentCycle.status === 'running') {
            startCycleTimer();
        }
    } catch (error) {
        console.error('Fehler beim Laden des Dashboards:', error);
    }
}

// Aktuellen Waschgang anzeigen
function displayCurrentCycle() {
    const container = document.getElementById('current-cycle');
    
    if (!currentCycle || currentCycle.status !== 'running') {
        container.innerHTML = '<p class="no-cycle">Kein aktiver Waschgang</p>';
        container.classList.remove('active');
        if (cycleTimer) {
            clearInterval(cycleTimer);
            cycleTimer = null;
        }
        return;
    }
    
    container.classList.add('active');
    const endTime = new Date(currentCycle.end_time);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60));
    
    container.innerHTML = `
        <p class="program-name">${currentCycle.program_name}</p>
        <p class="time-remaining">${remaining} Minuten verbleibend</p>
        <p>Temperatur: ${currentCycle.temperature || 'N/A'}°C</p>
        <p>Dauer: ${currentCycle.duration} Minuten</p>
        ${currentCycle.notes ? `<p>Notizen: ${currentCycle.notes}</p>` : ''}
    `;
}

// Timer für laufenden Waschgang
function startCycleTimer() {
    if (cycleTimer) return;
    
    cycleTimer = setInterval(() => {
        if (currentCycle && currentCycle.status === 'running') {
            const endTime = new Date(currentCycle.end_time);
            const now = new Date();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60));
            
            if (remaining === 0) {
                // Waschgang beenden
                updateCycleStatus(currentCycle.id, 'completed');
                clearInterval(cycleTimer);
                cycleTimer = null;
            } else {
                displayCurrentCycle();
            }
        }
    }, 60000); // Jede Minute aktualisieren
}

// Programme laden
async function loadPrograms() {
    try {
        const response = await fetch(`${API_BASE}/wash-programs`);
        programs = await response.json();
        displayPrograms();
    } catch (error) {
        console.error('Fehler beim Laden der Programme:', error);
    }
}

// Programme anzeigen
function displayPrograms() {
    const container = document.getElementById('programs-list');
    
    if (programs.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Programme vorhanden. Erstellen Sie ein neues Programm.</div>';
        return;
    }
    
    container.innerHTML = programs.map(program => `
        <div class="program-card ${program.is_favorite ? 'favorite' : ''}">
            <h3>
                ${program.name}
                ${program.is_favorite ? '<span class="favorite-icon">⭐</span>' : ''}
            </h3>
            <div class="program-details">
                <div class="detail-item">
                    <span>Temperatur:</span>
                    <span>${program.temperature || 'N/A'}°C</span>
                </div>
                <div class="detail-item">
                    <span>Dauer:</span>
                    <span>${program.duration} Min.</span>
                </div>
                <div class="detail-item">
                    <span>Schleudern:</span>
                    <span>${program.spin_speed || 'N/A'} U/min</span>
                </div>
            </div>
            ${program.description ? `<p style="color: var(--text-secondary); font-size: 14px; margin-top: 10px;">${program.description}</p>` : ''}
            <div class="program-actions">
                <button class="btn btn-primary btn-small" onclick="startCycleFromProgram(${program.id})">Start</button>
                <button class="btn btn-secondary btn-small" onclick="editProgram(${program.id})">Bearbeiten</button>
                <button class="btn btn-danger btn-small" onclick="deleteProgram(${program.id})">Löschen</button>
            </div>
        </div>
    `).join('');
}

// Waschgänge laden
async function loadCycles() {
    try {
        const response = await fetch(`${API_BASE}/wash-cycles`);
        cycles = await response.json();
        displayCycles();
    } catch (error) {
        console.error('Fehler beim Laden der Waschgänge:', error);
    }
}

// Waschgänge anzeigen
function displayCycles() {
    const container = document.getElementById('cycles-list');
    
    if (cycles.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Waschgänge vorhanden. Starten Sie einen neuen Waschgang.</div>';
        return;
    }
    
    container.innerHTML = cycles.map(cycle => {
        const startTime = new Date(cycle.start_time);
        const endTime = cycle.end_time ? new Date(cycle.end_time) : null;
        const statusClass = cycle.status;
        
        return `
            <div class="cycle-card ${statusClass}">
                <div class="cycle-info">
                    <h3>${cycle.program_name}</h3>
                    <div class="cycle-details">
                        <span>Temp: ${cycle.temperature || 'N/A'}°C</span>
                        <span>Dauer: ${cycle.duration} Min.</span>
                        <span>Start: ${formatDateTime(startTime)}</span>
                        ${endTime ? `<span>Ende: ${formatDateTime(endTime)}</span>` : ''}
                    </div>
                    ${cycle.notes ? `<p style="margin-top: 10px; color: var(--text-secondary);">${cycle.notes}</p>` : ''}
                </div>
                <div class="cycle-actions">
                    <span class="cycle-status ${statusClass}">${getStatusText(cycle.status)}</span>
                    ${cycle.status === 'running' ? 
                        `<button class="btn btn-secondary btn-small" onclick="updateCycleStatus(${cycle.id}, 'completed')">Beenden</button>` : 
                        ''
                    }
                    <button class="btn btn-danger btn-small" onclick="deleteCycle(${cycle.id})">Löschen</button>
                </div>
            </div>
        `;
    }).join('');
}

// Neuen Waschgang starten
async function handleNewCycle(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        program_name: formData.get('program_name'),
        temperature: formData.get('temperature') ? parseInt(formData.get('temperature')) : null,
        duration: parseInt(formData.get('duration')),
        notes: formData.get('notes')
    };
    
    try {
        const response = await fetch(`${API_BASE}/wash-cycles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('new-cycle-modal');
            e.target.reset();
            loadCycles();
            loadDashboard();
        } else {
            alert('Fehler beim Erstellen des Waschgangs');
        }
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Erstellen des Waschgangs');
    }
}

// Neues Programm erstellen
async function handleNewProgram(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        temperature: formData.get('temperature') ? parseInt(formData.get('temperature')) : null,
        duration: parseInt(formData.get('duration')),
        spin_speed: formData.get('spin_speed') ? parseInt(formData.get('spin_speed')) : null,
        description: formData.get('description'),
        is_favorite: formData.get('is_favorite') ? 1 : 0
    };
    
    try {
        const response = await fetch(`${API_BASE}/wash-programs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('new-program-modal');
            e.target.reset();
            loadPrograms();
        } else {
            alert('Fehler beim Erstellen des Programms');
        }
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Erstellen des Programms');
    }
}

// Waschgang aus Programm starten
async function startCycleFromProgram(programId) {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    
    const data = {
        program_name: program.name,
        temperature: program.temperature,
        duration: program.duration,
        notes: `Gestartet aus Programm: ${program.name}`
    };
    
    try {
        const response = await fetch(`${API_BASE}/wash-cycles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            loadCycles();
            loadDashboard();
            switchPage('cycles');
        } else {
            alert('Fehler beim Starten des Waschgangs');
        }
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Starten des Waschgangs');
    }
}

// Waschgang-Status aktualisieren
async function updateCycleStatus(cycleId, status) {
    try {
        const response = await fetch(`${API_BASE}/wash-cycles/${cycleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadCycles();
            loadDashboard();
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Programm löschen
async function deleteProgram(programId) {
    if (!confirm('Möchten Sie dieses Programm wirklich löschen?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/wash-programs/${programId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadPrograms();
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Waschgang löschen
async function deleteCycle(cycleId) {
    if (!confirm('Möchten Sie diesen Waschgang wirklich löschen?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/wash-cycles/${cycleId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadCycles();
            loadDashboard();
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Programm bearbeiten (vereinfacht - könnte erweitert werden)
function editProgram(programId) {
    alert('Bearbeitungsfunktion wird in einer späteren Version hinzugefügt.');
}

// Modal-Funktionen
function showNewCycleModal() {
    // Programme in Select laden
    const select = document.getElementById('cycle-program');
    select.innerHTML = '<option value="">Bitte wählen...</option>';
    programs.forEach(program => {
        const option = document.createElement('option');
        option.value = program.name;
        option.textContent = `${program.name} (${program.duration} Min., ${program.temperature || 'N/A'}°C)`;
        option.dataset.duration = program.duration;
        option.dataset.temperature = program.temperature || '';
        select.appendChild(option);
    });
    
    // Auto-Fill bei Auswahl
    select.addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        if (option.dataset.duration) {
            document.getElementById('cycle-duration').value = option.dataset.duration;
        }
        if (option.dataset.temperature) {
            document.getElementById('cycle-temperature').value = option.dataset.temperature;
        }
    });
    
    document.getElementById('new-cycle-modal').classList.add('active');
}

function showNewProgramModal() {
    document.getElementById('new-program-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Hilfsfunktionen
function formatDateTime(date) {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Ausstehend',
        'running': 'Läuft',
        'completed': 'Abgeschlossen'
    };
    return statusMap[status] || status;
}

