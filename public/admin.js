document.addEventListener('DOMContentLoaded', () => {
  const addUserForm = document.getElementById('addUserForm');
  const addUserMessage = document.getElementById('addUserMessage');

  const addMachineForm = document.getElementById('addMachineForm');
  const addMachineMessage = document.getElementById('addMachineMessage');

  const resTableBody = document.querySelector('#resTable tbody');
  const machinesTableBody = document.querySelector('#machinesTable tbody');
  const usersTableBody = document.querySelector('#usersTable tbody');

  const logoutBtn = document.getElementById('logoutBtn');

  // Admin-Kürzel anzeigen
 let adminKuerzel = null;

try {
    adminKuerzel = sessionStorage.getItem('kuerzel');
} catch (error) {
    console.warn('sessionStorage ist nicht verfügbar:', error);
}

if (adminKuerzel) {
    const adminGreeting = document.createElement('h2');
    adminGreeting.textContent = `Angemeldet als: ${adminKuerzel}`;
    adminGreeting.style.marginBottom = '20px';
    document.body.prepend(adminGreeting);
} else {
    alert('Bitte erneut einloggen.');
    window.location.href = '/login.html';
}

  // Nutzer anlegen
  addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addUserForm);
    const kuerzel = formData.get('newUserKuerzel');

    fetch('/api/admin/addUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kuerzel }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Fehler beim Hinzufügen des Nutzers: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          addUserMessage.style.color = 'red';
          addUserMessage.textContent = data.error;
        } else {
          addUserMessage.style.color = 'lime';
          addUserMessage.textContent = data.message;
          addUserForm.reset();
          loadUsers();
        }
      })
      .catch((err) => {
        console.error('Fehler beim Hinzufügen des Nutzers:', err);
        addUserMessage.style.color = 'red';
        addUserMessage.textContent = 'Ein Fehler ist aufgetreten.';
      });
  });

  // Maschine anlegen
  addMachineForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addMachineForm);
    const name = formData.get('machineName');
    const type = formData.get('machineType');

    fetch('/api/admin/addMachine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Fehler beim Hinzufügen der Maschine: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          addMachineMessage.style.color = 'red';
          addMachineMessage.textContent = data.error;
        } else {
          addMachineMessage.style.color = 'lime';
          addMachineMessage.textContent = data.message;
          addMachineForm.reset();
          loadMachines();
        }
      })
      .catch((err) => {
        console.error('Fehler beim Hinzufügen der Maschine:', err);
        addMachineMessage.style.color = 'red';
        addMachineMessage.textContent = 'Ein Fehler ist aufgetreten.';
      });
  });

  // Nutzer laden
 function loadUsers() {
    usersTableBody.innerHTML = '<tr><td colspan="4">Lade Nutzer...</td></tr>';

    fetch('/api/admin/users')
        .then((res) => {
            console.log("API-Antwort Status (Nutzer):", res.status); // Status prüfen
            if (!res.ok) {
                throw new Error(`Fehler beim Laden der Nutzer: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            console.log("Nutzerdaten von der API:", data); // Die erhaltenen Daten loggen
            usersTableBody.innerHTML = '';
            data.forEach((user) => {
                console.log("Verarbeite Nutzer:", user); // Einzelne Nutzer prüfen
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.kuerzel}</td>
                    <td><button class="edit-btn" data-id="${user.id}" data-value="${user.kuerzel}">✏️</button></td>
                    <td><button class="delete-btn" data-id="${user.id}">🗑️</button></td>
                `;
                usersTableBody.appendChild(tr);
            });
            attachUserListeners();
        })
        .catch((err) => {
            console.error('Fehler beim Laden der Nutzer:', err);
            usersTableBody.innerHTML = '<tr><td colspan="4">Fehler beim Laden der Nutzer.</td></tr>';
        });
}


  // Maschinen laden
  function loadMachines() {
    machinesTableBody.innerHTML = '<tr><td colspan="5">Lade Maschinen...</td></tr>';

    fetch('/api/admin/machines')
        .then((res) => {
            console.log("API-Antwort Status (Maschinen):", res.status); // Status prüfen
            if (!res.ok) {
                throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            console.log("Maschinendaten von der API:", data); // Die erhaltenen Daten loggen
            machinesTableBody.innerHTML = '';
            data.forEach((machine) => {
                console.log("Verarbeite Maschine:", machine); // Einzelne Maschinen prüfen
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${machine.id}</td>
                    <td>${machine.name}</td>
                    <td>${machine.type}</td>
                    <td><button class="edit-btn" data-id="${machine.id}" data-name="${machine.name}" data-type="${machine.type}">✏️</button></td>
                    <td><button class="delete-btn" data-id="${machine.id}">🗑️</button></td>
                `;
                machinesTableBody.appendChild(tr);
            });
            attachMachineListeners();
        })
        .catch((err) => {
            console.error('Fehler beim Laden der Maschinen:', err);
            machinesTableBody.innerHTML = '<tr><td colspan="5">Fehler beim Laden der Maschinen.</td></tr>';
        });
}


  // Reservierungen laden
  function loadReservations() {
    resTableBody.innerHTML = '<tr><td colspan="5">Lade Reservierungen...</td></tr>';

    fetch('/api/admin/reservations')
        .then((res) => {
            console.log("API-Antwort Status (Reservierungen):", res.status); // Status prüfen
            if (!res.ok) {
                throw new Error(`Fehler beim Laden der Reservierungen: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            console.log("Reservierungsdaten von der API:", data); // Die erhaltenen Daten loggen
            resTableBody.innerHTML = '';
            data.forEach((reservation) => {
                console.log("Verarbeite Reservierung:", reservation); // Einzelne Reservierungen prüfen
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reservation.id}</td>
                    <td>${reservation.start_time}</td>
                    <td>${reservation.end_time}</td>
                    <td>${reservation.email || 'Keine Email'}</td>
                    <td>${reservation.user_kuerzel || 'Kein Nutzer'}</td>
                    <td>${reservation.machine_name || 'Keine Maschine'}</td>
                    <td><button class="delete-btn" data-id="${reservation.id}">🗑️</button></td>
                `;
                resTableBody.appendChild(tr);
            });
            attachReservationListeners();
        })
        .catch((err) => {
            console.error('Fehler beim Laden der Reservierungen:', err);
            resTableBody.innerHTML = '<tr><td colspan="5">Fehler beim Laden der Reservierungen.</td></tr>';
        });
}


  // Logout-Button
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login.html';
  });

  // Daten initial laden
  loadUsers();
  loadMachines();
  loadReservations();
});

function attachUserListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            const currentKuerzel = btn.dataset.value;
            editUser(userId, currentKuerzel);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            deleteItem('users', userId);
        });
    });
}

function attachMachineListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const machineId = btn.dataset.id;
      const currentName = btn.dataset.name;
      const currentType = btn.dataset.type;
      editMachine(machineId, currentName, currentType);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const machineId = btn.dataset.id;
      deleteItem('machines', machineId);
    });
  });
}

function attachReservationListeners() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reservationId = btn.dataset.id;
      deleteItem('reservations', reservationId);
    });
  });
}

function deleteItem(type, id) {
    let url = '';
    switch (type) {
        case 'users':
            url = `/api/admin/users/${id}`;
            break;
        case 'machines':
            url = `/api/admin/machines/${id}`;
            break;
        case 'reservations':
            url = `/api/admin/reservations/${id}`;
            break;
        default:
            alert('Unbekannter Typ beim Löschen.');
            return;
    }

    if (confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
        fetch(url, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error(`Fehler: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.error) {
                    alert(`Fehler: ${data.error}`);
                } else {
                    alert(data.message);

                    // Entferne das Element direkt aus der Tabelle
                    const row = document.querySelector(`[data-id="${id}"]`).closest('tr');
                    if (row) row.remove();

                    console.log(`Eintrag mit ID ${id} erfolgreich entfernt.`);
                }
            })
            .catch(err => {
                console.error(`Fehler beim Löschen von ${type}:`, err);
                alert('Ein unbekannter Fehler ist aufgetreten.');
            });
    }
}

function editUser(userId, currentKuerzel) {
    const newKuerzel = prompt('Neues Kürzel eingeben:', currentKuerzel);
    if (newKuerzel && newKuerzel !== currentKuerzel) {
        fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kuerzel: newKuerzel }),
        })
            .then(res => {
                if (!res.ok) throw new Error(`Fehler: ${res.status}`);
                return res.json();
            })
            .then(data => {
                alert(data.message);

                // Aktualisiere die Zeile direkt in der Tabelle
                const row = document.querySelector(`[data-id="${userId}"]`).closest('tr');
                if (row) {
                    row.children[1].textContent = newKuerzel; // Spalte mit dem Kürzel aktualisieren
                }

                console.log(`Nutzer mit ID ${userId} erfolgreich bearbeitet.`);
            })
            .catch(err => {
                console.error('Fehler beim Bearbeiten des Nutzers:', err);
                alert('Ein unbekannter Fehler ist aufgetreten.');
            });
    }
}

function editMachine(machineId, currentName, currentType) {
    const newName = prompt('Neuen Namen eingeben:', currentName);
    const newType = prompt('Neuen Typ eingeben (washer/dryer):', currentType);

    if ((newName && newName !== currentName) || (newType && newType !== currentType)) {
        fetch(`/api/admin/machines/${machineId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, type: newType }),
        })
            .then(res => {
                if (!res.ok) throw new Error(`Fehler: ${res.status}`);
                return res.json();
            })
            .then(data => {
                alert(data.message);

                // Aktualisiere die Zeile direkt in der Tabelle
                const row = document.querySelector(`[data-id="${machineId}"]`).closest('tr');
                if (row) {
                    row.children[1].textContent = newName; // Spalte mit dem Namen aktualisieren
                    row.children[2].textContent = newType; // Spalte mit dem Typ aktualisieren
                }

                console.log(`Maschine mit ID ${machineId} erfolgreich bearbeitet.`);
            })
            .catch(err => {
                console.error('Fehler beim Bearbeiten der Maschine:', err);
                alert('Ein unbekannter Fehler ist aufgetreten.');
            });
    }
}

