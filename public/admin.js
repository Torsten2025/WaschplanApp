import ProjectReferences from "./project_variables.js";

// Liste der Variablen und Konstanten (Schreibweisenübersicht):
// - addUserForm
// - addMachineForm
// - userTable
// - machineTable
// - resTable
// - logoutButton
// - API-Endpunkte: 
//   1. /api/admin/users (GET)
//   2. /api/admin/addUser (POST)
//   3. /api/admin/users/:id (PUT)
//   4. /api/admin/users/:id (DELETE)
//   5. /api/admin/machines (GET)
//   6. /api/admin/addMachine (POST)
//   7. /api/admin/machines/:id (PUT)
//   8. /api/admin/machines/:id (DELETE)

document.addEventListener("DOMContentLoaded", () => {
    console.log("1. JavaScript geladen und DOMContentLoaded ausgeführt.");

    // 1. Variablen initialisieren
    const addUserForm = document.getElementById(ProjectReferences.htmlIds.addUserForm);
    const addMachineForm = document.getElementById(ProjectReferences.htmlIds.addMachineForm);
    const userTable = document.getElementById(ProjectReferences.htmlIds.userTable);
    const machineTable = document.getElementById(ProjectReferences.htmlIds.machinesTable);
    const resTable = document.getElementById(ProjectReferences.htmlIds.resTable);
    const logoutButton = document.getElementById(ProjectReferences.htmlIds.logoutBtn);

    if (!addUserForm || !addMachineForm || !userTable || !machineTable || !resTable || !logoutButton) {
        console.error("Ein oder mehrere notwendige DOM-Elemente fehlen.");
        return;
    }

    // 2. Logout-Button-Event hinzufügen
    logoutButton.addEventListener("click", () => {
        console.log("2. Logout-Button geklickt...");
        sessionStorage.clear();
        alert("Du wurdest erfolgreich ausgeloggt.");
        window.location.href = "/login.html";
    });

    // Funktion 1: Nutzer laden
    function loadUsers() {
        console.log("3. Nutzer werden geladen...");
        fetch(ProjectReferences.apiEndpoints.users)
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Nutzer: ${res.status}`);
                return res.json();
            })
            .then((users) => {
                userTable.innerHTML = users
                    .map((user) => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.kuerzel}</td>
                            <td>
                                <button class="edit-user" data-id="${user.id}" data-kuerzel="${user.kuerzel}">Bearbeiten</button>
                                <button class="delete-user" data-id="${user.id}">Löschen</button>
                            </td>
                        </tr>`)
                    .join("");

                attachUserListeners();
            })
            .catch((err) => console.error("Fehler beim Laden der Nutzer:", err));
    }

    // Funktion 2: Nutzer-Event-Listener hinzufügen
    function attachUserListeners() {
        document.querySelectorAll(".edit-user").forEach((button) => {
            button.addEventListener("click", () => {
                const userId = button.dataset.id;
                const currentKuerzel = button.dataset.kuerzel;
                const newKuerzel = prompt("Neues Kürzel eingeben:", currentKuerzel);

                if (newKuerzel && newKuerzel !== currentKuerzel) {
                    fetch(`${ProjectReferences.apiEndpoints.users}/${userId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ kuerzel: newKuerzel }),
                    })
                        .then((res) => {
                            if (!res.ok) throw new Error(`Fehler beim Bearbeiten des Nutzers: ${res.status}`);
                            return res.json();
                        })
                        .then(() => loadUsers())
                        .catch((err) => console.error("Fehler beim Bearbeiten des Nutzers:", err));
                }
            });
        });

        document.querySelectorAll(".delete-user").forEach((button) => {
            button.addEventListener("click", () => {
                const userId = button.dataset.id;
                if (confirm("Möchtest du diesen Nutzer wirklich löschen?")) {
                    fetch(`${ProjectReferences.apiEndpoints.users}/${userId}`, { method: "DELETE" })
                        .then((res) => {
                            if (!res.ok) throw new Error(`Fehler beim Löschen des Nutzers: ${res.status}`);
                            return res.json();
                        })
                        .then(() => loadUsers())
                        .catch((err) => console.error("Fehler beim Löschen des Nutzers:", err));
                }
            });
        });
    }

    // Funktion 3: Maschinen laden
    function loadMachines() {
        console.log("4. Maschinen werden geladen...");
        fetch(ProjectReferences.apiEndpoints.machines)
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
                return res.json();
            })
            .then((machines) => {
                machineTable.innerHTML = machines
                    .map((machine) => `
                        <tr>
                            <td>${machine.id}</td>
                            <td>${machine.name}</td>
                            <td>${machine.type}</td>
                            <td>
                                <button class="edit-machine" data-id="${machine.id}" data-name="${machine.name}" data-type="${machine.type}">Bearbeiten</button>
                                <button class="delete-machine" data-id="${machine.id}">Löschen</button>
                            </td>
                        </tr>`)
                    .join("");

                attachMachineListeners();
            })
            .catch((err) => console.error("Fehler beim Laden der Maschinen:", err));
    }

    // Funktion 4: Maschinen-Event-Listener hinzufügen
    function attachMachineListeners() {
        document.querySelectorAll(".edit-machine").forEach((button) => {
            button.addEventListener("click", () => {
                const machineId = button.dataset.id;
                const currentName = button.dataset.name;
                const currentType = button.dataset.type;
                const newName = prompt("Neuen Namen eingeben:", currentName);
                const newType = prompt("Neuen Typ eingeben:", currentType);

                if ((newName && newName !== currentName) || (newType && newType !== currentType)) {
                    fetch(`${ProjectReferences.apiEndpoints.machines}/${machineId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newName, type: newType }),
                    })
                        .then((res) => {
                            if (!res.ok) throw new Error(`Fehler beim Bearbeiten der Maschine: ${res.status}`);
                            return res.json();
                        })
                        .then(() => loadMachines())
                        .catch((err) => console.error("Fehler beim Bearbeiten der Maschine:", err));
                }
            });
        });

        document.querySelectorAll(".delete-machine").forEach((button) => {
            button.addEventListener("click", () => {
                const machineId = button.dataset.id;
                if (confirm("Möchtest du diese Maschine wirklich löschen?")) {
                    fetch(`${ProjectReferences.apiEndpoints.machines}/${machineId}`, { method: "DELETE" })
                        .then((res) => {
                            if (!res.ok) throw new Error(`Fehler beim Löschen der Maschine: ${res.status}`);
                            return res.json();
                        })
                        .then(() => loadMachines())
                        .catch((err) => console.error("Fehler beim Löschen der Maschine:", err));
                }
            });
        });
    }

    // Funktion 5: Nutzer hinzufügen
    addUserForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(addUserForm);
        const kuerzel = formData.get("newUserKuerzel");

        console.log("5. Nutzer wird hinzugefügt:", { kuerzel });

        fetch(ProjectReferences.apiEndpoints.addUser, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kuerzel }),
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Hinzufügen des Nutzers: ${res.status}`);
                return res.json();
            })
            .then(() => {
                alert("Nutzer erfolgreich hinzugefügt.");
                addUserForm.reset();
                loadUsers();
            })
            .catch((err) => console.error("Fehler beim Hinzufügen des Nutzers:", err));
    });

    // Funktion 6: Maschine hinzufügen
    addMachineForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(addMachineForm);
        const name = formData.get("machineName");
        const type = formData.get("machineType");

        console.log("6. Maschine wird hinzugefügt:", { name, type });

        fetch(ProjectReferences.apiEndpoints.addMachine, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type }),
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Hinzufügen der Maschine: ${res.status}`);
                return res.json();
            })
            .then(() => {
                alert("Maschine erfolgreich hinzugefügt.");
                addMachineForm.reset();
                loadMachines();
            })
            .catch((err) => console.error("Fehler beim Hinzufügen der Maschine:", err));
    });

// Funktion 6: Maschine hinzufügen
addMachineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(addMachineForm);
    const name = formData.get("machineName");
    const type = formData.get("machineType");

    console.log("6. Maschine wird hinzugefügt:", { name, type });

    fetch(ProjectReferences.apiEndpoints.addMachine, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Fehler beim Hinzufügen der Maschine: ${res.status}`);
            return res.json();
        })
        .then(() => {
            alert("Maschine erfolgreich hinzugefügt.");
            addMachineForm.reset();
            loadMachines();
        })
        .catch((err) => console.error("Fehler beim Hinzufügen der Maschine:", err));
});

// Funktion 7: Maschine bearbeiten
function editMachine(machineId, updatedData) {
    console.log("7. Maschine wird bearbeitet:", { machineId, updatedData });

    fetch(`${ProjectReferences.apiEndpoints.machines}/${machineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Fehler beim Bearbeiten der Maschine: ${res.status}`);
            return res.json();
        })
        .then(() => {
            alert("Maschine erfolgreich bearbeitet.");
            loadMachines();
        })
        .catch((err) => console.error("Fehler beim Bearbeiten der Maschine:", err));
}

// Funktion 8: Maschine löschen
function deleteMachine(machineId) {
    console.log("8. Maschine wird gelöscht:", machineId);

    fetch(`${ProjectReferences.apiEndpoints.machines}/${machineId}`, {
        method: "DELETE",
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Fehler beim Löschen der Maschine: ${res.status}`);
            return res.json();
        })
        .then(() => {
            alert("Maschine erfolgreich gelöscht.");
            loadMachines();
        })
        .catch((err) => console.error("Fehler beim Löschen der Maschine:", err));
}


    // Initiale Daten laden
    loadUsers();
    loadMachines();
});
