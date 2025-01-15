document.addEventListener('DOMContentLoaded', () => {
    const addUserForm = document.getElementById('addUserForm');
    const addMachineForm = document.getElementById('addMachineForm');
    const resTableBody = document.querySelector('#resTable tbody');
    const machinesTableBody = document.querySelector('#machinesTable tbody');
    const usersTableBody = document.querySelector('#usersTable tbody');
    const logoutBtn = document.getElementById('logoutBtn');

    let adminKuerzel = null;

    try {
        adminKuerzel = sessionStorage.getItem('kuerzel');
    } catch (error) {
        console.warn('SessionStorage ist nicht verfügbar:', error);
    }

    if (adminKuerzel) {
        const adminGreeting = document.createElement('h2');
        adminGreeting.textContent = `Angemeldet als: ${adminKuerzel}`;
        document.body.prepend(adminGreeting);
    } else {
        alert('Bitte erneut einloggen.');
        window.location.href = '/login.html';
        return;
    }

    // Nutzer hinzufügen
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
                if (!res.ok) throw new Error(`Fehler beim Hinzufügen des Nutzers: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                alert(data.message);
                addUserForm.reset();
                loadUsers();
            })
            .catch((err) => console.error('Fehler beim Hinzufügen des Nutzers:', err));
    });

    // Maschinen hinzufügen
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
                if (!res.ok) throw new Error(`Fehler beim Hinzufügen der Maschine: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                alert(data.message);
                addMachineForm.reset();
                loadMachines();
            })
            .catch((err) => console.error('Fehler beim Hinzufügen der Maschine:', err));
    });

    // Nutzer laden
    function loadUsers() {
        usersTableBody.innerHTML = '<tr><td colspan="4">Lade Nutzer...</td></tr>';
        fetch('/api/admin/users')
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Nutzer: ${res.status}`);
                return res.json();
            })
            .then((users) => {
                usersTableBody.innerHTML = '';
                users.forEach((user) => {
                    usersTableBody.innerHTML += `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.kuerzel}</td>
                            <td><button data-id="${user.id}" class="delete-btn">Löschen</button></td>
                        </tr>`;
                });
            })
            .catch((err) => console.error('Fehler beim Laden der Nutzer:', err));
    }

    // Maschinen laden
    function loadMachines() {
        machinesTableBody.innerHTML = '<tr><td colspan="5">Lade Maschinen...</td></tr>';
        fetch('/api/admin/machines')
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
                return res.json();
            })
            .then((machines) => {
                machinesTableBody.innerHTML = '';
                machines.forEach((machine) => {
                    machinesTableBody.innerHTML += `
                        <tr>
                            <td>${machine.id}</td>
                            <td>${machine.name}</td>
                            <td>${machine.type}</td>
                        </tr>`;
                });
            })
            .catch((err) => console.error('Fehler beim Laden der Maschinen:', err));
    }

    // Reservierungen laden
    function loadReservations() {
        resTableBody.innerHTML = '<tr><td colspan="5">Lade Reservierungen...</td></tr>';
        fetch('/api/admin/reservations')
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Reservierungen: ${res.status}`);
                return res.json();
            })
            .then((reservations) => {
                resTableBody.innerHTML = '';
                reservations.forEach((res) => {
                    resTableBody.innerHTML += `
                        <tr>
                            <td>${res.id}</td>
                            <td>${res.start_time}</td>
                            <td>${res.end_time}</td>
                        </tr>`;
                });
            })
            .catch((err) => console.error('Fehler beim Laden der Reservierungen:', err));
    }

    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/login.html';
    });

    // Initial laden
    loadUsers();
    loadMachines();
    loadReservations();
});
