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
    const addUserForm = document.getElementById("addUserForm");
    const addMachineForm = document.getElementById("addMachineForm");
    const userTable = document.getElementById("userTable");
    const machineTable = document.getElementById("machineTable");
    const resTable = document.getElementById("resTable");
    const logoutButton = document.getElementById("logoutButton");
	
	console.log("1. DOM-Elemente geprüft:", {
        addUserForm,
        addMachineForm,
        userTable,
        machineTable,
        resTable,
        logoutButton
    });
	
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

    // 3. Nutzer laden
    function loadUsers() {
        console.log("3. Nutzer werden geladen...");
        fetch("/api/admin/users") // API: 1
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Nutzer: ${res.status}`);
                return res.json();
            })
            .then((users) => {
                userTable.innerHTML = users
                    .map(
                        (user) => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.kuerzel}</td>
                        <td>
                            <button class="edit-user" data-id="${user.id}" data-kuerzel="${user.kuerzel}">Bearbeiten</button>
                            <button class="delete-user" data-id="${user.id}">Löschen</button>
                        </td>
                    </tr>`
                    )
                    .join("");

                attachUserListeners();
            })
            .catch((err) => console.error("Fehler beim Laden der Nutzer:", err));
    }

    // 4. Nutzer-Event-Listener hinzufügen
    function attachUserListeners() {
        document.querySelectorAll(".edit-user").forEach((button) => {
            button.addEventListener("click", () => {
                const userId = button.dataset.id;
                const currentKuerzel = button.dataset.kuerzel;
                const newKuerzel = prompt("Neues Kürzel eingeben:", currentKuerzel);
                if (newKuerzel && newKuerzel !== currentKuerzel) {
                    fetch(`/api/admin/users/${userId}`, { // API: 3
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
                    fetch(`/api/admin/users/${userId}`, { method: "DELETE" }) // API: 4
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

    // 5. Maschinen laden
    function loadMachines() {
        console.log("5. Maschinen werden geladen...");
        fetch("/api/admin/machines") // API: 5
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
                return res.json();
            })
            .then((machines) => {
                machineTable.innerHTML = machines
                    .map(
                        (machine) => `
                    <tr>
                        <td>${machine.id}</td>
                        <td>${machine.name}</td>
                        <td>${machine.type}</td>
                        <td>
                            <button class="edit-machine" data-id="${machine.id}" data-name="${machine.name}" data-type="${machine.type}">Bearbeiten</button>
                            <button class="delete-machine" data-id="${machine.id}">Löschen</button>
                        </td>
                    </tr>`
                    )
                    .join("");

                attachMachineListeners();
            })
            .catch((err) => console.error("Fehler beim Laden der Maschinen:", err));
    }

    // 6. Maschinen-Event-Listener hinzufügen
    function attachMachineListeners() {
        document.querySelectorAll(".edit-machine").forEach((button) => {
            button.addEventListener("click", () => {
                const machineId = button.dataset.id;
                const currentName = button.dataset.name;
                const currentType = button.dataset.type;
                const newName = prompt("Neuen Namen eingeben:", currentName);
                const newType = prompt("Neuen Typ eingeben (z. B. Waschmaschine oder Trocknungsraum):", currentType);

                if ((newName && newName !== currentName) || (newType && newType !== currentType)) {
                    fetch(`/api/admin/machines/${machineId}`, { // API: 7
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
                    fetch(`/api/admin/machines/${machineId}`, { method: "DELETE" }) // API: 8
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

    // 7. Nutzer hinzufügen
       addUserForm.addEventListener("submit", (e) => {
       e.preventDefault();
       const formData = new FormData(addUserForm);
       const kuerzel = formData.get("newUserKuerzel");

       console.log("7. Nutzer wird hinzugefügt:", { kuerzel });

       fetch("/api/admin/addUser", { // API: 2
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ kuerzel }),
       })
           .then((res) => {
               console.log("API-Antwortstatus: /api/admin/addUser", res.status);
               if (!res.ok) throw new Error(`Fehler beim Hinzufügen des Nutzers: ${res.status}`);
               return res.json();
           })
           .then((data) => {
               console.log("7. Nutzer erfolgreich hinzugefügt:", data);
               alert("Nutzer erfolgreich hinzugefügt.");
               addUserForm.reset();
               loadUsers(); // Nutzerliste aktualisieren
           })
           .catch((err) => console.error("Fehler beim Hinzufügen des Nutzers:", err));
   });
