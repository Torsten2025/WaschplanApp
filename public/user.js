// Liste der Variablen und Konstanten (Schreibweisenübersicht):
// - TIME_SLOTS
// - calendarContainer
// - navigationContainer
// - logoutButton
// - API-Endpunkte: 
//   1. /api/machines (GET)
//   2. /api/bookings (GET)
//   3. /api/admin/addBooking (POST)
//   4. /api/user/deleteBooking/:id (DELETE)

// Liste der Funktionen:
// - getNextTwoWeeks: Gibt die nächsten 14 Tage zurück.
// - createNavigation: Erstellt die Monatsnavigation.
// - changeMonth: Wechselt zwischen Monaten.
// - loadMachines: Lädt Maschinen aus der API.
// - buildCalendars: Baut die Kalenderstruktur auf.
// - loadBookings: Lädt Buchungen aus der API.
// - renderCalendar: Rendert den Kalender für eine Maschine.
// - bookSlot: Erstellt eine neue Buchung.
// - cancelBooking: Storniert eine bestehende Buchung.

document.addEventListener("DOMContentLoaded", () => {
    console.log("1. JavaScript geladen und DOMContentLoaded ausgeführt.");

    // 1. Variablen initialisieren
    const TIME_SLOTS = ["07:00-12:00", "12:00-17:00", "17:00-21:00"];
    const calendarContainer = document.getElementById("machineCalendars");
    const navigationContainer = document.getElementById("navigationContainer");
    const logoutButton = document.getElementById("logoutButton");

    if (!calendarContainer || !navigationContainer || !logoutButton) {
        console.error("Ein oder mehrere notwendige DOM-Elemente fehlen.");
        return;
    }

    logoutButton.addEventListener("click", () => {
        console.log("2. Logout-Button geklickt...");
        sessionStorage.clear();
        alert("Du wurdest erfolgreich ausgeloggt.");
        window.location.href = "/login.html";
    });

    const userKuerzel = sessionStorage.getItem("kuerzel");
    if (!userKuerzel) {
        alert("Bitte erneut einloggen!");
        window.location.href = "/login.html";
        return;
    }

    const userGreeting = document.createElement("h2");
    userGreeting.textContent = `Willkommen, ${userKuerzel}!`;
    document.body.prepend(userGreeting);

    // 2. Funktionen definieren

    // Funktion 1: Gibt die nächsten 14 Tage zurück
    function getNextTwoWeeks() {
        console.log("3. Nächste zwei Wochen berechnen...");
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

    // Funktion 2: Erstellt die Monatsnavigation
    function createNavigation() {
        console.log("4. Navigation wird erstellt...");
        navigationContainer.innerHTML = `
            <button id="prevMonth" class="nav-button">&larr; Vorheriger Monat</button>
            <h2 id="currentMonthYear">${dayjs().format("MMMM YYYY")}</h2>
            <button id="nextMonth" class="nav-button">Nächster Monat &rarr;</button>
        `;
        document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
        document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
        console.log("5. Navigation erstellt.");
    }

    // Funktion 3: Ändert den aktuellen Monat
    function changeMonth(direction) {
        console.log("6. Monat wechseln, Richtung:", direction);
        currentMonth += direction;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        buildCalendars();
    }

    // Funktion 4: Lädt Maschinen aus der API
    function loadMachines() {
        console.log("7. Maschinen werden geladen...");
        fetch("/api/machines") // API: 1
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Maschinen: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                allMachines = data.map((machine) => ({
                    id: machine.id,
                    name: machine.name,
                    type: machine.type,
                }));
                buildCalendars();
            })
            .catch((err) => console.error("Fehler beim Laden der Maschinen:", err.message));
    }

    // Funktion 5: Baut die Kalenderstruktur auf
    function buildCalendars() {
        console.log("8. Kalender wird erstellt...");
        calendarContainer.innerHTML = "";
        document.getElementById("currentMonthYear").textContent = dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY");

        const washerGroup = document.createElement("div");
        washerGroup.classList.add("washer-group");

        const dryerGroup = document.createElement("div");
        dryerGroup.classList.add("dryer-group");

        allMachines.forEach((machine) => {
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

            loadBookings(machine);
        });

        calendarContainer.appendChild(washerGroup);
        calendarContainer.appendChild(dryerGroup);
    }

    // Funktion 6: Lädt Buchungen aus der API
    function loadBookings(machine) {
        console.log("9. Buchungen werden geladen für Maschine:", machine.name);
        fetch("/api/bookings") // API: 2
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler beim Laden der Buchungen: ${res.status}`);
                return res.json();
            })
            .then((bookings) => {
                const filteredBookings = bookings.filter(
                    (b) => b.machine_name === machine.name && dayjs(b.start_time).month() === currentMonth
                );
                renderCalendar(machine.id, filteredBookings);
            })
            .catch((err) => console.error("Fehler beim Laden der Buchungen:", err.message));
    }

// Funktion 7: Rendert den Kalender für eine Maschine
    function renderCalendar(machineId, bookings) {
        console.log("10. Kalender wird gerendert für Maschine:", machineId);
        const calendarElement = document.getElementById(`calendar-${machineId}`);
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
                const slotStartTime = `${date}T${slot.split("-")[0]}`;

                const isBooked = bookings.some(
                    (b) => dayjs(b.start_time).format("YYYY-MM-DDTHH:mm") === slotStartTime
                );

                slotButton.classList.add("slot-button", isBooked ? "slot-booked" : "slot-free");

                if (isBooked) {
                    const booking = bookings.find(
                        (b) => dayjs(b.start_time).format("YYYY-MM-DDTHH:mm") === slotStartTime
                    );

                    if (booking.user_kuerzel === userKuerzel) {
                        slotButton.textContent = "Stornieren (Meine)";
                        slotButton.classList.add("my-booking");
                        slotButton.addEventListener("click", () => cancelBooking(booking.id));
                    } else {
                        slotButton.textContent = `Gebucht von ${booking.user_kuerzel}`;
                        slotButton.disabled = true;
                    }
                } else {
                    slotButton.textContent = slot;
                    slotButton.addEventListener("click", () => bookSlot(machineId, slotStartTime));
                }

                dayCell.appendChild(slotButton);
            });

            calendarElement.appendChild(dayCell);
        });
    }

    // Funktion 8: Erstellt eine neue Buchung
    function bookSlot(machineId, startTime) {
        console.log("11. Slot wird gebucht für Maschine:", machineId, "Startzeit:", startTime);
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
            .then(() => {
                alert("Buchung erfolgreich!");
                buildCalendars();
            })
            .catch((err) => console.error("Fehler bei der Buchung:", err));
    }

    // Funktion 9: Storniert eine bestehende Buchung
    function cancelBooking(bookingId) {
        console.log("12. Buchung wird storniert:", bookingId);

        fetch(`/api/user/deleteBooking/${bookingId}`, { method: "DELETE" })
            .then((res) => {
                if (!res.ok) throw new Error(`Fehler: ${res.status}`);
                return res.json();
            })
            .then(() => {
                alert("Buchung erfolgreich storniert!");
                buildCalendars();
            })
            .catch((err) => console.error("Fehler beim Stornieren der Buchung:", err));
    }

    // 3. Initialisierung
    console.log("13. Initialisiere Navigation und lade Maschinen...");
    createNavigation();
    loadMachines();
});
