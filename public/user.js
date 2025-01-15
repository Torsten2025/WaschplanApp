// Globale Variablen
let allMachines = []; // Maschinen-Array
let navigationContainer = null; // Globale Variable für die Navigation
let currentYear = dayjs().year();
let currentMonth = dayjs().month();
let calendarContainer = null; // Globale Variable für den Kalender
let userkuerzel = null; // Globale Variable für Benutzer-Kürzel
let allBookings = []; // Globale Variable für alle Buchungen
const TIME_SLOTS = ["07:00-12:00", "12:00-17:00", "17:00-21:00"];

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

function validateBooking(machineId, machineType, bookingDate, slot) {
    const isWasher = machineType.toLowerCase().includes("waschmaschine");

    // **Sonntagsregel bleibt aktiv**
    if (isWasher && dayjs(bookingDate).day() === 0) {
        alert("Waschmaschinen können sonntags nicht gebucht werden.");
        return false;
    }

    return true; // Immer valide für alle anderen Fälle
}

function loadMachines() {
    console.log("Maschinen werden geladen...");

    fetch("/api/machines")
        .then((res) => {
            console.log("API Antwort Status (Maschinen):", res.status);
            if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
            return res.json();
        })
        .then((data) => {
            console.log("Rohdaten der Maschinen (von API):", data);
            allMachines = data.map((machine) => ({
                id: machine.id,
                name: machine.name,
                type: machine.type,
            }));

            buildCalendars();
        })
        .catch((err) => console.error("Fehler beim Laden der Maschinen:", err.message));
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

function buildCalendars() {
    console.log("Kalender wird erstellt...");

    calendarContainer.innerHTML = "";

    document.getElementById("currentMonthYear").textContent =
        dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY");

    const washerGroup = document.createElement("div");
    washerGroup.classList.add("washer-group");

    const dryerGroup = document.createElement("div");
    dryerGroup.classList.add("dryer-group");

    allMachines.forEach((machine) => {
        console.log("Kalender für Maschine:", machine);

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

        try {
            loadBookings(machine);
        } catch (err) {
            console.error("Fehler beim Aufrufen von loadBookings:", err);
        }
    });

    calendarContainer.appendChild(washerGroup);
    calendarContainer.appendChild(dryerGroup);
    console.log("Kalender erfolgreich erstellt.");
}

function loadBookings(machine) {
    console.log("Lade Buchungen für Maschine:", machine);

    fetch("/api/bookings")
        .then((res) => {
            if (!res.ok) throw new Error(`Fehler beim Laden der Buchungen: ${res.status}`);
            return res.json();
        })
        .then((bookings) => {
            console.log("Buchungsdaten:", bookings);
            renderCalendar(machine.id, bookings);
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

    calendarElement.innerHTML = "";

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

            const booking = bookings.find(
                (b) => dayjs(b.start_time).format("YYYY-MM-DDTHH:mm") === slotStartTime
            );

            if (booking) {
                slotButton.textContent = `Gebucht von ${booking.user_kuerzel}`;
                slotButton.classList.add("slot-booked");
                slotButton.disabled = true;
            } else {
                slotButton.textContent = slot;
                slotButton.classList.add("slot-free");
                slotButton.addEventListener("click", () => {
                    const isValid = validateBooking(machineId, "", date, slotStartTime);
                    if (isValid) bookSlot(machineId, slotStartTime);
                });
            }

            dayCell.appendChild(slotButton);
        });

        calendarElement.appendChild(dayCell);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript geladen.");

    userkuerzel = sessionStorage.getItem("kuerzel");
    if (!userkuerzel) {
        alert("Bitte erneut einloggen!");
        window.location.href = "/login.html";
        return;
    }

    navigationContainer = document.getElementById("navigationContainer");
    calendarContainer = document.getElementById("machineCalendars");

    if (!navigationContainer || !calendarContainer) {
        console.error("Wichtige Elemente fehlen.");
        return;
    }

    createNavigation();
    loadMachines();
});

function bookSlot(machineId, startTime) {
    console.log("Slot wird gebucht:", machineId, startTime);

    const payload = {
        userId: sessionStorage.getItem("userId"),
        machineId,
        startTime,
    };

    fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Fehler beim Buchen: ${res.status}`);
            return res.json();
        })
        .then(() => {
            alert("Buchung erfolgreich!");
            buildCalendars();
        })
        .catch((err) => {
            console.error("Fehler beim Buchen:", err.message);
            alert("Ein Fehler ist aufgetreten.");
        });
}
