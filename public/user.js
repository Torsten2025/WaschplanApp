// Globale Variablen
let allMachines = []; // Maschinen-Array
let navigationContainer = null; // Globale Variable für die Navigation
let currentYear = dayjs().year();
let currentMonth = dayjs().month();
let calendarContainer = null; // Globale Variable für den Kalender
let userkuerzel = null; // Globale Variable für Benutzer-Kürzel
let allBookings = []; // Globale Variable für alle Buchungen
const TIME_SLOTS = ["07:00-12:00", "12:00-17:00", "17:00-21:00"];

// Funktion zur Berechnung der erlaubten Slots für Trocknungsräume
function calculateAllowedTRSlots(userBookings, bookingDate) {
    const wmBooking = userBookings.find(
        (b) => b.machineType === "Waschmaschine" && dayjs(b.start_time).isSame(bookingDate, "day")
    );

    const nextDay = dayjs(bookingDate).add(1, "day").format("YYYY-MM-DD");
    const allowedSlots = [];

    if (wmBooking) {
        // Erlaubte Slots basierend auf Waschmaschinenzeit
        console.log("Gefundene Waschmaschinenbuchung:", wmBooking);
        switch (wmBooking.slot) {
            case "07:00-12:00":
                allowedSlots.push(`${bookingDate}T07:00`, `${bookingDate}T12:00`, `${bookingDate}T17:00`);
                break;
            case "12:00-17:00":
                allowedSlots.push(`${bookingDate}T12:00`, `${bookingDate}T17:00`, `${nextDay}T07:00`);
                break;
            case "17:00-21:00":
                allowedSlots.push(`${bookingDate}T17:00`, `${nextDay}T07:00`, `${nextDay}T12:00`);
                break;
        }
    } else {
        // Standardzeitfenster ohne Waschmaschinenbuchung
        console.log("Keine Waschmaschinenbuchung gefunden, Standardzeitfenster.");
        allowedSlots.push(
            `${bookingDate}T07:00`,
            `${bookingDate}T12:00`,
            `${bookingDate}T17:00`
        );
    }

    console.log("Berechnete erlaubte Slots:", allowedSlots);
    return allowedSlots;
}

function validateBooking(machineId, machineType, bookingDate, slot) {
    const isDryer = machineType.toLowerCase().includes("trocknungsraum");
    const isWasher = machineType.toLowerCase().includes("waschmaschine");

    // Prüfen, ob der Benutzer bereits einen Slot am gleichen Tag gebucht hat
    const sameDayBookings = allBookings.filter(
        (b) => b.user_kuerzel === userkuerzel && dayjs(b.start_time).isSame(bookingDate, "day")
    );

    if (isWasher) {
        if (sameDayBookings.some((b) => b.machineType === "Waschmaschine")) {
            alert("Du kannst nur einen Waschmaschinenslot pro Tag buchen.");
            return false;
        }

        if (dayjs(bookingDate).day() === 0) {
            alert("Waschmaschinen können sonntags nicht gebucht werden.");
            return false;
        }
    }

    if (isDryer) {
        const sameDayDryerBookings = sameDayBookings.filter((b) => b.machineType === "Trocknungsraum");

        if (sameDayDryerBookings.length >= 3) {
            alert("Maximal 3 Slots pro Trocknungsraum erlaubt.");
            return false;
        }

        // Prüfen, ob der Slot in den erlaubten Zeitfenstern liegt
        const allowedSlots = calculateAllowedTRSlots(sameDayBookings, bookingDate);
        console.log("Erlaubte Slots:", allowedSlots);
        console.log("Überprüfter Slot:", slot);

        if (!allowedSlots.includes(slot)) {
            alert("Der gewählte Slot ist nicht erlaubt.");
            return false;
        }
    }

    return true;
}

// Funktion: Navigation erstellen
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

// Funktion: Nächste zwei Wochen berechnen
function getNextTwoWeeks() {
    const days = [];
    const today = dayjs();
    for (let i = 0; i < 14; i++) {
        const date = today.add(i, 'day');
        days.push({
            date: date.format("YYYY-MM-DD"),
            day: date.format("dddd"), // z. B. Montag, Dienstag
        });
    }
    return days;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript geladen und DOMContentLoaded ausgeführt.");

    // Test für sessionStorage
    try {
        sessionStorage.setItem("test", "test");
        sessionStorage.removeItem("test");
        console.log("SessionStorage funktioniert einwandfrei.");
    } catch (e) {
        console.error("SessionStorage-Zugriff blockiert:", e.message);
        alert("Dein Browser blockiert den Zugriff auf sessionStorage. Bitte überprüfe deine Einstellungen.");
    }


userkuerzel = sessionStorage.getItem("kuerzel");
if (!userkuerzel) {
    alert("Bitte erneut einloggen!");
    window.location.href = "/login.html";
    return;
}


    console.log("Benutzer-Kürzel:", userkuerzel);

    // Globale Variablen initialisieren
    navigationContainer = document.getElementById("navigationContainer");
    calendarContainer = document.getElementById("machineCalendars");

    if (!navigationContainer || !calendarContainer) {
        console.error("Fehler: navigationContainer oder calendarContainer wurde nicht gefunden.");
        document.body.innerHTML = `<h1>Ein notwendiges Element wurde nicht gefunden. Bitte die Seite neu laden.</h1>`;
        return;
    }

    console.log("navigationContainer und calendarContainer erfolgreich initialisiert.");

    // Logout-Button initialisieren
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            console.log("Logout-Button wurde geklickt."); // Debugging-Log

            try {
                sessionStorage.clear(); // sessionStorage leeren
                console.log("SessionStorage erfolgreich geleert."); // Debugging-Log
            } catch (e) {
                console.error("Fehler beim Löschen von sessionStorage:", e.message);
            }

            alert("Du wurdest erfolgreich ausgeloggt."); // Benutzer-Bestätigung
            window.location.href = "/login.html"; // Weiterleitung zur Login-Seite
        });
    } else {
        console.error("Logout-Button nicht gefunden."); // Debugging-Log, falls Button fehlt
    }

    // Navigation erstellen und Maschinen laden
    createNavigation();
    loadMachines();
});



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
            console.log("API Antwort Status (Maschinen):", res.status); // Status ausgeben
            if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
            return res.json(); // Antwort parsen
        })
        .then((data) => {
            console.log("Rohdaten der Maschinen (von API):", data); // Originaldaten loggen
            allMachines = data.map((machine) => ({
                id: machine.id, // Stellen sicher, dass Schlüssel korrekt sind
                name: machine.name,
                type: machine.type,
            }));
            console.log("Verarbeitete Maschinen (für Kalender):", allMachines); // Verarbeitete Daten loggen

            buildCalendars(); // Kalender aufbauen
            loadLogs(); // Logs laden und anzeigen
        })
        .catch((err) => console.error("Fehler beim Laden der Maschinen:", err.message)); // Fehler behandeln
}

function loadLogs() {
    console.log("Logs werden geladen...");

    fetch("/api/logs")
        .then((res) => {
            console.log("API Antwort Status (Logs):", res.status); // Status ausgeben
            if (!res.ok) throw new Error(`Fehler beim Laden der Logs: ${res.status}`);
            return res.json(); // Antwort parsen
        })
        .then((logs) => {
            console.log("Rohdaten der Logs (von API):", logs); // Originaldaten loggen
            allMachines.forEach((machine) => {
                const logContainer = document.getElementById(`log-${machine.id}`);
                if (logContainer) {
                    // Korrekte Filterung der Logs für die Maschine
                    const machineLogs = logs.filter((log) => log.machine_id === machine.id);
                    console.log(`Logs für Maschine ${machine.name}:`, machineLogs);

                    // Logs in den Container rendern
                    logContainer.innerHTML = machineLogs
                        .map(
                            (log) =>
                                `<p>${dayjs(log.Datum).format(
                                    "DD.MM.YYYY HH:mm"
                                )}: ${log.Beschreibung} (${log.Status})</p>`
                        )
                        .join("");
                } else {
                    console.warn(`Kein Log-Container für Maschine ${machine.id} gefunden.`);
                }
            });
        })
        .catch((err) => console.error("Fehler beim Laden der Logs:", err.message)); // Fehler behandeln
}


function buildCalendars() {
    console.log("Kalender wird erstellt...");

    // Kalender-Container leeren
    calendarContainer.innerHTML = "";

    // Titel des aktuellen Monats aktualisieren
    document.getElementById("currentMonthYear").textContent =
        dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY");

    // Gruppen für Waschmaschinen und Trocknungsräume erstellen
    const washerGroup = document.createElement("div");
    washerGroup.classList.add("washer-group");

    const dryerGroup = document.createElement("div");
    dryerGroup.classList.add("dryer-group");

    // Maschinen in die passenden Gruppen einteilen
    allMachines.forEach((machine) => {
        console.log("Kalender für Maschine:", machine);

        const calendarDiv = document.createElement("div");
        calendarDiv.classList.add("machine-calendar");
        calendarDiv.innerHTML = `
            <h3>${machine.name} (${machine.type})</h3>
            <div id="calendar-${machine.id}" class="month-grid"></div>
            <button class="report-issue-button" data-machine-id="${machine.id}">Fehler melden</button>
            <div id="log-${machine.id}" class="machine-log"></div>
        `;

        console.log("Erzeugtes Kalender-Element:", calendarDiv.innerHTML);

        // Maschinen je nach Typ in die richtige Gruppe einfügen
        if (machine.type.toLowerCase().includes("waschmaschine")) {
            washerGroup.appendChild(calendarDiv);
        } else if (machine.type.toLowerCase().includes("trocknungsraum")) {
            dryerGroup.appendChild(calendarDiv);
        }

        try {
            loadBookings(machine);
        } catch (err) {
            console.error("Fehler beim Aufrufen von loadBookings:", err);
        }
    });

    // Gruppen in den Hauptcontainer einfügen
    calendarContainer.appendChild(washerGroup);
    calendarContainer.appendChild(dryerGroup);

    // Jetzt den DOM-Check durchführen
    allMachines.forEach((machine) => {
        const calendarElement = document.getElementById(`calendar-${machine.id}`);
        console.log(`DOM-Check nach appendChild:`, calendarElement);
    });

    console.log("Aktueller Inhalt von machineCalendars:", calendarContainer.innerHTML);
    console.log("Kalender wurde erfolgreich erstellt.");
}



function loadBookings(machine) {
    console.log("Lade Buchungen für Maschine:", machine);

    fetch(`/api/bookings`)
        .then((res) => {
            if (!res.ok) throw new Error(`Fehler beim Laden der Buchungen: ${res.status}`);
            return res.json();
        })
        .then((bookings) => {
            console.log("Rohdaten der Buchungen aus API:", bookings);

            // `allBookings` wird hier aktualisiert
            allBookings = bookings;

            const filteredBookings = bookings.filter((b) => {
                console.log(
                    `Filterprüfung: API Maschinenname "${b.machine_name}", Lokaler Maschinenname "${machine.name}"`
                );
                return (
                    b.machine_name?.toLowerCase().trim() === machine.name.toLowerCase().trim() &&
                    dayjs(b.start_time).year() === currentYear &&
                    dayjs(b.start_time).month() === currentMonth
                );
            });

            console.log("Gefilterte Buchungen für Maschine:", machine.name, filteredBookings);

            renderCalendar(machine.id, filteredBookings);
        })
        .catch((err) => {
            console.error("Fehler beim Laden der Buchungen:", err.message);
        });
}

	function renderCalendar(machineId, bookings) {
    const calendarElement = document.getElementById(`calendar-${machineId}`);
    if (!calendarElement) {
        console.error(`Kalender-Element für Maschine ${machineId} nicht gefunden.`);
        return;
    }

    calendarElement.innerHTML = ""; // Inhalt leeren

    getNextTwoWeeks().forEach(({ date, day }) => {
        const dayCell = document.createElement("div");
        dayCell.classList.add("day-cell");

        const dateTitle = document.createElement("div");
        dateTitle.textContent = `${day}, ${dayjs(date).format("DD.MM.YYYY")}`;
        dateTitle.classList.add("date-title");
        dayCell.appendChild(dateTitle);

        TIME_SLOTS.forEach((slot) => {
            const slotButton = document.createElement("button");
            const slotStartTime = dayjs(`${date}T${slot.split("-")[0]}`).format("YYYY-MM-DDTHH:mm");

            // Prüfen, ob der Slot gebucht ist
            const booking = bookings.find(
                (b) => dayjs(b.start_time).format("YYYY-MM-DDTHH:mm") === slotStartTime
            );

            if (booking) {
                slotButton.textContent = `Gebucht von ${booking.user_kuerzel}`;
                slotButton.classList.add("slot-booked");
                slotButton.disabled = true;

                // Stornieren ermöglichen, wenn der aktuelle Benutzer die Buchung erstellt hat
                if (booking.user_kuerzel === userkuerzel) {
                    slotButton.textContent = "Stornieren (meine Buchung)";
                    slotButton.classList.add("my-booking");
                    slotButton.disabled = false;
                    slotButton.addEventListener("click", () => cancelBooking(booking.id));
                }
            } else {
                slotButton.textContent = slot;
                slotButton.classList.add("slot-free");
                slotButton.addEventListener("click", () => {
                    const isValid = validateBooking(machineId, "Trocknungsraum", date, slotStartTime);
                    if (isValid) bookSlot(machineId, slotStartTime);
                });
            }

            dayCell.appendChild(slotButton);
        });

        calendarElement.appendChild(dayCell);
    });
}

// Bestehender Code vor `bookSlot`
function bookSlot(machineId, startTime) {
    console.log("Slot wird gebucht für Maschine:", machineId, "Startzeit:", startTime);

    if (!userkuerzel) {
        alert("Bitte einloggen, um eine Buchung vorzunehmen.");
        return;
    }

    const machine = allMachines.find((m) => m.id === machineId);
    if (!machine) {
        alert("Fehler: Maschine nicht gefunden.");
        return;
    }

    const endTime = dayjs(startTime).add(5, "hour").format("YYYY-MM-DDTHH:mm:ss");
    const isDryer = machine.type.toLowerCase().includes("trocknungsraum");
    const isWasher = machine.type.toLowerCase().includes("waschmaschine");

    const bookingDate = dayjs(startTime);

    // **Sonntagsregel**
    if (isWasher && bookingDate.day() === 0) {
        alert("Buchungen sind am Sonntag nicht erlaubt.");
        return;
    }

    // **Waschmaschinenbuchung prüfen**
    if (isWasher) {
        const sameDayBookings = allBookings.filter(
            (b) =>
                b.user_kuerzel === userkuerzel &&
                dayjs(b.start_time).isSame(bookingDate, "day") &&
                b.machineType === "Waschmaschine"
        );

        if (sameDayBookings.length > 0) {
            alert("Du kannst nur einen Waschmaschinenslot pro Tag buchen.");
            return;
        }
    }

    // **Trocknungsraumvalidierung**
    if (isDryer) {
        const sameDayDryerBookings = allBookings.filter(
            (b) =>
                b.user_kuerzel === userkuerzel &&
                dayjs(b.start_time).isSame(bookingDate, "day") &&
                b.machineType === "Trocknungsraum"
        );

        if (sameDayDryerBookings.length > 0) {
            alert("Du kannst nur einen Trocknungsraum pro Tag buchen.");
            return;
        }

        const allowedSlots = calculateAllowedTRSlots(allBookings, bookingDate);
        if (!allowedSlots.includes(startTime)) {
            alert("Der gewählte Slot ist nicht erlaubt.");
            return;
        }

        if (sameDayDryerBookings.length >= 3) {
            alert("Maximal drei Slots pro Trocknungsraum erlaubt.");
            return;
        }
    }

    const payload = {
        userId: sessionStorage.getItem("userId"),
        machineId,
        machineType: machine.type,
        bookingDate: bookingDate.format("YYYY-MM-DD"),
        slot: startTime.split("T")[1],
    };

    console.log("Payload für API:", payload);

    fetch("/api/admin/addBooking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then((res) => {
            console.log("API-Antwortstatus:", res.status);
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
            console.error("Fehler bei der Buchung:", err.message);
            alert("Ein unbekannter Fehler ist aufgetreten.");
        });
}


// Die Funktion cancelBooking auf oberster Ebene definieren
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
                buildCalendars(); // Kalender neu laden
            }
        })
        .catch((err) => {
            console.error("Fehler beim Stornieren der Buchung:", err.message);
            alert("Ein unbekannter Fehler ist aufgetreten.");
        });
}

  console.log("Initialisiere Navigation und lade Maschinen...");
  loadMachines();
