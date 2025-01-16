// Übersicht aller IDs, Konstanten und Variablen
const ProjectReferences = {
    // HTML-IDs
    htmlIds: {
        navigationContainer: "navigationContainer", // Container für Monatsnavigation
        prevMonth: "prevMonth", // Button für vorherigen Monat
        nextMonth: "nextMonth", // Button für nächsten Monat
        machineCalendars: "machineCalendars", // Container für Maschinenkalender
        logForm: "logForm", // Formular zur Fehlererfassung
        logoutButton: "logoutButton", // Button für Logout
        addUserForm: "addUserForm", // Formular zum Hinzufügen von Nutzern (admin.html)
        addMachineForm: "addMachineForm", // Formular zum Hinzufügen von Maschinen
        userTable: "userTable", // Tabelle zur Anzeige von Nutzern
        machinesTable: "machinesTable", // Tabelle zur Anzeige von Maschinen
        logoutBtn: "logoutBtn", // Button für Logout im Adminbereich
    },

    // JavaScript-Variablen
    jsVariables: {
        TIME_SLOTS: ["07:00-12:00", "12:00-17:00", "17:00-21:00"], // Zeitslots für Buchungen
        userKuerzel: "userKuerzel", // Kürzel des angemeldeten Nutzers
    },
};

export default ProjectReferences;
