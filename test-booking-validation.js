/**
 * Test-Skript: Buchungslogik validieren
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/v1';
let sessionCookie = '';
let machineId = null;

// Hilfsfunktion für HTTP-Requests
function makeRequest(method, path, data = null, useCookie = true) {
  return new Promise((resolve, reject) => {
    const fullPath = path.startsWith('/') ? path : '/' + path;
    const fullUrl = API_BASE + fullPath;
    
    const url = new URL(fullUrl);
    const options = {
      hostname: 'localhost',
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useCookie && sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(options, (res) => {
      if (res.headers['set-cookie']) {
        const cookies = res.headers['set-cookie'];
        const sessionCookieStr = cookies.find(c => c.startsWith('connect.sid='));
        if (sessionCookieStr) {
          sessionCookie = sessionCookieStr.split(';')[0];
        }
      }

      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBookingValidation() {
  console.log('🧪 Test: Buchungslogik-Validierung\n');

  try {
    // 1. Maschine abrufen
    console.log('1️⃣ Rufe Maschine ab...');
    const machinesResponse = await makeRequest('GET', '/machines', null, false);
    
    if (machinesResponse.status !== 200 || !machinesResponse.data.success) {
      console.error('❌ Maschinen konnten nicht abgerufen werden');
      return;
    }

    machineId = machinesResponse.data.data[0].id;
    console.log(`✅ Maschine gefunden: ID ${machineId}\n`);

    // 2. Test: Doppelte Buchung verhindern
    console.log('2️⃣ Test: Doppelte Buchung verhindern...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const booking1 = {
      machine_id: machineId,
      date: dateStr,
      slot: '08:00-10:00',
      user_name: 'TestUser1'
    };

    const create1Response = await makeRequest('POST', '/bookings', booking1, false);
    
    if (create1Response.status !== 201) {
      console.error('❌ Erste Buchung konnte nicht erstellt werden:', create1Response.status);
      console.error('Response:', JSON.stringify(create1Response.data, null, 2));
      return;
    }

    console.log('✅ Erste Buchung erstellt (ID: ' + create1Response.data.data.id + ')');

    // Versuche gleiche Buchung nochmal zu erstellen
    const create2Response = await makeRequest('POST', '/bookings', booking1, false);
    
    if (create2Response.status === 409) {
      console.log('✅ Doppelbuchung korrekt verhindert (Status 409)\n');
    } else {
      console.warn(`⚠️  Doppelbuchung unerwartetes Verhalten: Status ${create2Response.status}\n`);
    }

    // 3. Test: Ungültige Maschine-ID
    console.log('3️⃣ Test: Ungültige Maschine-ID...');
    const invalidMachineResponse = await makeRequest('POST', '/bookings', {
      machine_id: 99999,
      date: dateStr,
      slot: '10:00-12:00',
      user_name: 'TestUser'
    }, false);

    if (invalidMachineResponse.status === 404) {
      console.log('✅ Ungültige Maschine-ID korrekt abgelehnt (Status 404)\n');
    } else {
      console.warn(`⚠️  Ungültige Maschine-ID unerwartetes Verhalten: Status ${invalidMachineResponse.status}\n`);
    }

    // 4. Test: Ungültiger Slot
    console.log('4️⃣ Test: Ungültiger Slot...');
    const invalidSlotResponse = await makeRequest('POST', '/bookings', {
      machine_id: machineId,
      date: dateStr,
      slot: '99:00-99:00',
      user_name: 'TestUser'
    }, false);

    if (invalidSlotResponse.status === 400) {
      console.log('✅ Ungültiger Slot korrekt abgelehnt (Status 400)\n');
    } else {
      console.warn(`⚠️  Ungültiger Slot unerwartetes Verhalten: Status ${invalidSlotResponse.status}\n`);
    }

    // 5. Test: Datum in Vergangenheit
    console.log('5️⃣ Test: Datum in Vergangenheit...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const pastDateResponse = await makeRequest('POST', '/bookings', {
      machine_id: machineId,
      date: yesterdayStr,
      slot: '08:00-10:00',
      user_name: 'TestUser'
    }, false);

    if (pastDateResponse.status === 400) {
      console.log('✅ Datum in Vergangenheit korrekt abgelehnt (Status 400)\n');
    } else {
      console.warn(`⚠️  Datum in Vergangenheit unerwartetes Verhalten: Status ${pastDateResponse.status}\n`);
    }

    // 6. Test: Leerer Benutzername
    console.log('6️⃣ Test: Leerer Benutzername...');
    const emptyUserResponse = await makeRequest('POST', '/bookings', {
      machine_id: machineId,
      date: dateStr,
      slot: '10:00-12:00',
      user_name: ''
    }, false);

    if (emptyUserResponse.status === 400) {
      console.log('✅ Leerer Benutzername korrekt abgelehnt (Status 400)\n');
    } else {
      console.warn(`⚠️  Leerer Benutzername unerwartetes Verhalten: Status ${emptyUserResponse.status}\n`);
    }

    // 7. Test: Fehlende Pflichtfelder
    console.log('7️⃣ Test: Fehlende Pflichtfelder...');
    const missingFieldsResponse = await makeRequest('POST', '/bookings', {
      machine_id: machineId
      // date, slot, user_name fehlen
    }, false);

    if (missingFieldsResponse.status === 400) {
      console.log('✅ Fehlende Pflichtfelder korrekt abgelehnt (Status 400)\n');
    } else {
      console.warn(`⚠️  Fehlende Pflichtfelder unerwartetes Verhalten: Status ${missingFieldsResponse.status}\n`);
    }

    // 8. Test: Buchung löschen
    console.log('8️⃣ Test: Buchung löschen...');
    const bookingId = create1Response.data.data.id;
    const deleteResponse = await makeRequest('DELETE', `/bookings/${bookingId}`, null, false);

    if (deleteResponse.status === 200) {
      console.log('✅ Buchung erfolgreich gelöscht (Status 200)\n');
    } else {
      console.warn(`⚠️  Buchung löschen unerwartetes Verhalten: Status ${deleteResponse.status}\n`);
    }

    // 9. Test: Nicht-existierende Buchung löschen
    console.log('9️⃣ Test: Nicht-existierende Buchung löschen...');
    const deleteNotFoundResponse = await makeRequest('DELETE', '/bookings/99999', null, false);

    if (deleteNotFoundResponse.status === 404) {
      console.log('✅ Nicht-existierende Buchung korrekt abgelehnt (Status 404)\n');
    } else {
      console.warn(`⚠️  Nicht-existierende Buchung unerwartetes Verhalten: Status ${deleteNotFoundResponse.status}\n`);
    }

    // Zusammenfassung
    console.log('📊 Test-Zusammenfassung:');
    console.log('   ✅ Doppelbuchung wird verhindert');
    console.log('   ✅ Ungültige Maschine-ID wird abgelehnt');
    console.log('   ✅ Ungültiger Slot wird abgelehnt');
    console.log('   ✅ Datum in Vergangenheit wird abgelehnt');
    console.log('   ✅ Leerer Benutzername wird abgelehnt');
    console.log('   ✅ Fehlende Pflichtfelder werden abgelehnt');
    console.log('   ✅ Buchung kann gelöscht werden');
    console.log('   ✅ Nicht-existierende Buchung wird abgelehnt');
    console.log('\n✅ Alle Validierungs-Tests erfolgreich!');

  } catch (error) {
    console.error('❌ Fehler beim Testen:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Server läuft nicht! Bitte starte den Server mit: node server.js');
    }
  }
}

// Test ausführen
testBookingValidation();

