document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript geladen und DOMContentLoaded ausgeführt.");

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    console.log("Benutzer-ID aus URL:", userId);

    let allMachines = [];
    let currentYear = dayjs().year();
    let currentMonth = dayjs().month();
    console.log("Aktuelles Jahr:", currentYear, "Aktueller Monat:", currentMonth);

    const TIME_SLOTS = ["07:00-12:00", "12:00-17:00", "17:00-21:00"];
    const calendarContainer = document.getElementById("machineCalendars");
    const navigationContainer = document.getElementById("navigationContainer");
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", () => {
        console.log("Logout-Button geklickt...");
        sessionStorage.clear(); // Session-Daten löschen
        alert("Du wurdest erfolgreich ausgeloggt."); // Bestätigung anzeigen
        window.location.href = "/login.html"; // Weiterleitung zur Login-Seite
    });

    console.log("calendarContainer:", calendarContainer);
    console.log("navigationContainer:", navigationContainer);
    console.log("logoutButton:", logoutButton);

    if (!navigationContainer || !calendarContainer) {
        console.error("Fehler: navigationContainer oder calendarContainer wurde nicht gefunden.");
        return;
    }

    const userKuerzel = sessionStorage.getItem("kuerzel");
    console.log("Benutzer-Kürzel aus SessionStorage:", userKuerzel);

    if (userKuerzel) {
        const userGreeting = document.createElement("h2");
        userGreeting.textContent = `Willkommen, ${userKuerzel}!`;
        document.body.prepend(userGreeting);
        console.log("Begrüßung hinzugefügt:", userGreeting.textContent);
    } else {
        alert("Bitte erneut einloggen!");
        window.location.href = "login.html";
        return;
    }

    function getNextTwoWeeks() {
        const days = [];
        const today = dayjs();
        for (let i = 0; i < 14; i++) {
            const date = today.add(i, "day");
            days.push({
                date: date.format("YYYY-MM-DD"),
                day: date.format("dddd"),
            });
        }
        return days;
    }

    function createNavigation() {
        console.log("Navigation wird erstellt...");
        navigationContainer.innerHTML = `
            <button id="prevMonth" class="nav-button">&larr; Vorheriger Monat</button>
            <h2 id="currentMonthYear">${dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY")}</h2>
            <button id="nextMonth" class="nav-button">Nächster Monat &rarr;</button>
        `;
        document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
        document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
        console.log("Navigation erstellt.");
    }

    function changeMonth(direction) {
        console.log("Monat ändern, Richtung:", direction);
        currentMonth += direction;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        console.log("Neues Jahr:", currentYear, "Neuer Monat:", currentMonth);
        buildCalendars();
    }

    function loadMachines() {
        console.log("Maschinen werden geladen...");
        fetch("/api/machines")
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                console.log("Maschinen erfolgreich geladen:", data);
                allMachines = data.map((machine) => ({
                    id: machine.id,
                    name: machine.name,
                    type: machine.type,
                }));
                buildCalendars();
                loadLogs();
            })
            .catch((err) => console.error("Fehler beim Laden der Maschinen:", err.message));
    }

    function loadLogs() {
        console.log("Logs werden geladen...");
        fetch("/api/logs")
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Logs: ${res.status}`);
                return res.json();
            })
            .then((logs) => {
                console.log("Logs erfolgreich geladen:", logs);
                allMachines.forEach((machine) => {
                    const logContainer = document.getElementById(`log-${machine.id}`);
                    if (logContainer) {
                        const machineLogs = logs.filter((log) => log.machine_id === machine.id);
                        logContainer.innerHTML = machineLogs
                            .map((log) => `<p>${log.datum}: ${log.beschreibung} (${log.status})</p>`)
                            .join("");
                    }
                });
            })
            .catch((err) => console.error("Fehler beim Laden der Logs:", err.message));
    }

    function buildCalendars() {
        console.log("Kalender wird erstellt...");
        calendarContainer.innerHTML = "";
        document.getElementById("currentMonthYear").textContent = dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY");
        const washerGroup = document.createElement("div");
        washerGroup.classList.add("washer-group");
        const dryerGroup = document.createElement("div");
        dryerGroup.classList.add("dryer-group");

        allMachines.forEach((machine) => {
            console.log("Kalender für Maschine:", machine);
            if (!machine.type) {
                console.error(`Maschine hat keinen Typ:`, machine);
                return;
            }

            const calendarDiv = document.createElement("div");
            calendarDiv.classList.add("machine-calendar");
            calendarDiv.innerHTML = `
                <h3>${machine.name} (${machine.type})</h3>
                <div id="calendar-${machine.id}" class="month-grid"></div>
            `;

            if (machine.type.toLowerCase().includes("waschmaschine")) {
                washerGroup.appendChild(calendarDiv);
            } else if (machine.type.toLowerCase().includes("trocknungsraum")) {
                dryerGroup.appendChild(calendarDiv);
            }
        });

        calendarContainer.appendChild(washerGroup);
        calendarContainer.appendChild(dryerGroup);
        console.log("Kalender erfolgreich erstellt.");
    }

    function bookSlot(machineId, startTime) {
        console.log("Slot wird gebucht für Maschine:", machineId, "Startzeit:", startTime);
        if (dayjs(startTime).day() === 0) {
            alert("Buchungen an Sonntagen sind nicht erlaubt.");
            return;
        }

        const endTime = dayjs(startTime).add(5, "hour").format("YYYY-MM-DDTHH:mm:ss");
        const machine = allMachines.find((m) => m.id === machineId);

        if (!machine) {
            alert("Fehler: Maschine nicht gefunden.");
            return;
        }

        const payload = {
            start: startTime,
            end: endTime,
            userKuerzel: userKuerzel,
            machineName: machine.name,
        };

        fetch("/api/admin/addBooking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data.error) {
                    alert(`Fehler: ${data.error}`);
                } else {
                    alert("Buchung erfolgreich!");
                    buildCalendars();
                }
            })
            .catch((err) => {
                console.error("Fehler bei der Buchung:", err);
                alert("Ein unbekannter Fehler ist aufgetreten.");
            });
    }

    function cancelBooking(bookingId) {
        console.log("Buchung wird storniert:", bookingId);

        fetch(`/api/user/deleteBooking/${bookingId}`, { method: "DELETE" })
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data.error) {
                    alert(`Fehler: ${data.error}`);
                } else {
                    alert("Buchung erfolgreich storniert!");
                    buildCalendars();
                }
            })
            .catch((err) => {
                console.error("Fehler beim Stornieren der Buchung:", err);
                alert("Ein unbekannter Fehler ist aufgetreten.");
            });
    }

    console.log("Initialisiere Navigation und lade Maschinen...");
    createNavigation();
    loadMachines();
});
