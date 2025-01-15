document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript geladen und DOMContentLoaded ausgeführt.");

    const addUserForm = document.getElementById("addUserForm");
    const addMachineForm = document.getElementById("addMachineForm");
    const userTable = document.getElementById("userTable");
    const machineTable = document.getElementById("machineTable");
    const resTable = document.getElementById("resTable");
    const logoutButton = document.getElementById("logoutButton");

    if (!addUserForm || !addMachineForm || !userTable || !machineTable || !resTable || !logoutButton) {
        console.error("Ein oder mehrere notwendige DOM-Elemente fehlen.");
        return;
    }

    logoutButton.addEventListener("click", () => {
        console.log("Logout-Button geklickt...");
        sessionStorage.clear();
        alert("Du wurdest erfolgreich ausgeloggt.");
        window.location.href = "/login.html";
    });

    function loadUsers() {
        console.log("Nutzer werden geladen...");
        fetch("/api/admin/users")
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

    function attachUserListeners() {
        document.querySelectorAll(".edit-user").forEach((button) => {
            button.addEventListener("click", () => {
                const userId = button.dataset.id;
                const currentKuerzel = button.dataset.kuerzel;
                const newKuerzel = prompt("Neues Kürzel eingeben:", currentKuerzel);
                if (newKuerzel && newKuerzel !== currentKuerzel) {
                    fetch(`/api/admin/users/${userId}`, {
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
                    fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
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

    function loadMachines() {
        console.log("Maschinen werden geladen...");
        fetch("/api/admin/machines")
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

    function attachMachineListeners() {
        document.querySelectorAll(".edit-machine").forEach((button) => {
            button.addEventListener("click", () => {
                const machineId = button.dataset.id;
                const currentName = button.dataset.name;
                const currentType = button.dataset.type;
                const newName = prompt("Neuen Namen eingeben:", currentName);
                const newType = prompt("Neuen Typ eingeben (z. B. Waschmaschine oder Trocknungsraum):", currentType);

                if ((newName && newName !== currentName) || (newType && newType !== currentType)) {
                    fetch(`/api/admin/machines/${machineId}`, {
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
                    fetch(`/api/admin/machines/${machineId}`, { method: "DELETE" })
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

    addUserForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(addUserForm);
        const kuerzel = formData.get("kuerzel");

        fetch("/api/admin/addUser", {
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

    addMachineForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(addMachineForm);
        const name = formData.get("name");
        const type = formData.get("type");

        fetch("/api/admin/addMachine", {
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

    loadUsers();
    loadMachines();
});
