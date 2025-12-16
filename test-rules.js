/**
 * Test-Script für alle Buchungsregeln
 * Führt systematische Tests aller implementierten Regeln durch
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/v1';

function testRequest(method, endpoint, body = null) {
  return new Promise((resolve) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: '127.0.0.1', // IPv4 explizit verwenden
      port: 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            success: false,
            error: 'JSON Parse Error: ' + e.message,
            rawData: data,
            status: res.statusCode
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST: Regel 1 - Zeitliche Struktur (Feste Slots) ===\n');
  const slotsResult = await testRequest('GET', '/slots');
  if (slotsResult.success && slotsResult.data.data) {
    const slots = slotsResult.data.data;
    console.log('Verfügbare Slots:');
    slots.forEach(s => console.log(`  - ${s.label} (${s.start} - ${s.end})`));
    if (slots.length === 3) {
      console.log('✓ Korrekt: 3 Slots gefunden\n');
    } else {
      console.log(`✗ Fehler: Erwartet 3 Slots, gefunden ${slots.length}\n`);
    }
  } else {
    console.log('✗ Fehler: Slots konnten nicht abgerufen werden\n');
  }

  console.log('=== TEST: Regel 2 - Maschinenstruktur ===\n');
  const machinesResult = await testRequest('GET', '/machines');
  let washers = [];
  let dryers = [];
  if (machinesResult.success && machinesResult.data.data) {
    const machines = machinesResult.data.data;
    washers = machines.filter(m => m.type === 'washer');
    dryers = machines.filter(m => m.type === 'dryer');
    console.log(`Waschmaschinen: ${washers.length}`);
    console.log(`Trocknungsräume: ${dryers.length}`);
    if (washers.length >= 3 && dryers.length >= 1) {
      console.log('✓ Korrekt: Mindestens 3 Waschmaschinen und mindestens 1 Trocknungsraum\n');
    } else {
      console.log('⚠ Warnung: Erwartet mindestens 3 Waschmaschinen und mindestens 1 Trocknungsraum\n');
    }
  } else {
    console.log('✗ Fehler: Maschinen konnten nicht abgerufen werden\n');
    return;
  }
  
  // Verwende erste verfügbare Maschinen
  const firstWasher = washers[0]?.id || 1;
  const secondWasher = washers[1]?.id || 2;
  const thirdWasher = washers[2]?.id || 3;
  const firstDryer = dryers[0]?.id || 4;

  console.log('=== TEST: Regel 3 - Tageslimiten pro Person (Waschmaschinen) ===\n');
  const today = new Date().toISOString().split('T')[0];
  const user = `TestUserLimit_${Date.now()}`;
  
  // Erste Buchung
  const booking1 = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: today,
    slot: '08:00-12:00',
    user_name: user
  });
  
  if (booking1.success) {
    console.log('✓ Buchung 1 erstellt');
    
    // Zweite Buchung
    const booking2 = await testRequest('POST', '/bookings', {
      machine_id: secondWasher,
      date: today,
      slot: '12:00-16:00',
      user_name: user
    });
    
    if (booking2.success) {
      console.log('✓ Buchung 2 erstellt');
      
      // Dritte Buchung (sollte blockiert werden)
      const booking3 = await testRequest('POST', '/bookings', {
        machine_id: thirdWasher,
        date: today,
        slot: '16:00-20:00',
        user_name: user
      });
      
      if (!booking3.success && booking3.data.error) {
        if (booking3.data.error.includes('Tageslimit') || booking3.data.error.includes('Maximum')) {
          console.log(`✓ Korrekt: 3. Buchung blockiert - ${booking3.data.error}\n`);
        } else {
          console.log(`✗ Unerwartete Fehlermeldung: ${booking3.data.error}\n`);
        }
      } else {
        console.log('✗ Fehler: 3. Buchung sollte blockiert werden\n');
      }
    } else {
      console.log(`✗ Fehler bei Buchung 2: ${booking2.data?.error || booking2.error}\n`);
    }
  } else {
    console.log(`✗ Fehler bei Buchung 1: ${booking1.data?.error || booking1.error}\n`);
  }

  console.log('=== TEST: Regel 6 - Wochenend- und Sperrtage (Sonntag) ===\n');
  // Finde nächsten Sonntag
  const nextSunday = new Date();
  const daysUntilSunday = (7 - nextSunday.getDay()) % 7;
  if (daysUntilSunday === 0) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  } else {
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
  }
  const sunday = nextSunday.toISOString().split('T')[0];
  const userSunday = `TestUserSunday_${Date.now()}`;
  
  // Waschmaschine am Sonntag (sollte blockiert werden)
  const washerSunday = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: sunday,
    slot: '08:00-12:00',
    user_name: userSunday
  });
  
  if (!washerSunday.success && washerSunday.data && washerSunday.data.error) {
    if (washerSunday.data.error.includes('Sonntag') || washerSunday.data.error.includes('Waschmaschine')) {
      console.log(`✓ Korrekt: Waschmaschine blockiert - ${washerSunday.data.error}`);
    } else {
      console.log(`✗ Unerwartete Fehlermeldung: ${washerSunday.data.error}`);
    }
  } else {
    console.log(`✗ Fehler: Waschmaschine sollte am Sonntag blockiert sein (Status: ${washerSunday.status}, Error: ${washerSunday.error || 'none'})`);
  }
  
  // Trocknungsraum am Sonntag (sollte erlaubt sein)
  const dryerSunday = await testRequest('POST', '/bookings', {
    machine_id: firstDryer,
    date: sunday,
    slot: '08:00-12:00',
    user_name: userSunday
  });
  
  if (dryerSunday.success) {
    console.log(`✓ Korrekt: Trocknungsraum am Sonntag erlaubt (ID: ${dryerSunday.data.data.id})\n`);
  } else {
    console.log(`✗ Fehler: Trocknungsraum sollte am Sonntag erlaubt sein: ${dryerSunday.data?.error || dryerSunday.error}\n`);
  }

  console.log('=== TEST: Regel 7 - Doppelbuchungen ===\n');
  const userDouble = `TestUserDouble_${Date.now()}`;
  
  // Erste Buchung
  const double1 = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: today,
    slot: '08:00-12:00',
    user_name: userDouble
  });
  
  if (double1.success) {
    console.log('✓ Buchung 1 erstellt (Waschmaschine)');
    
    // Zweite Buchung im gleichen Slot (sollte blockiert werden)
    const double2 = await testRequest('POST', '/bookings', {
      machine_id: firstDryer,
      date: today,
      slot: '08:00-12:00',
      user_name: userDouble
    });
    
    if (!double2.success && double2.data.error) {
      if (double2.data.error.includes('bereits') || double2.data.error.includes('gleichen Slot')) {
        console.log(`✓ Korrekt: Doppelbuchung blockiert - ${double2.data.error}\n`);
      } else {
        console.log(`✗ Unerwartete Fehlermeldung: ${double2.data.error}\n`);
      }
    } else {
      console.log('✗ Fehler: Doppelbuchung sollte blockiert werden\n');
    }
  } else {
    console.log(`✗ Fehler bei Buchung 1: ${double1.data?.error || double1.error}\n`);
  }

  console.log('=== TEST: Regel 4 - Vorausbuchungsregel ===\n');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const userFuture = `TestUserFuture_${Date.now()}`;
  
  // Erste zukünftige Buchung
  const future1 = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: tomorrowStr,
    slot: '08:00-12:00',
    user_name: userFuture
  });
  
  if (future1.success) {
    console.log('✓ Zukünftige Buchung 1 erstellt');
    
    // Zweite zukünftige Buchung (sollte blockiert werden)
    const future2 = await testRequest('POST', '/bookings', {
      machine_id: secondWasher,
      date: tomorrowStr,
      slot: '12:00-16:00',
      user_name: userFuture
    });
    
    if (!future2.success && future2.data.error) {
      if (future2.data.error.includes('zukünftige Buchung')) {
        console.log(`✓ Korrekt: 2. zukünftige Buchung blockiert - ${future2.data.error}\n`);
      } else {
        console.log(`✗ Unerwartete Fehlermeldung: ${future2.data.error}\n`);
      }
    } else {
      console.log('✗ Fehler: 2. zukünftige Buchung sollte blockiert werden\n');
    }
  } else {
    console.log(`✗ Fehler bei zukünftiger Buchung 1: ${future1.data?.error || future1.error}\n`);
  }

  console.log('=== TEST: Trocknungsraum - Wasch-Voraussetzung (NICHT Sonntag) ===\n');
  const userDryerWasher = `TestUserDryerWasher_${Date.now()}`;
  
  // Trocknungsraum ohne Waschmaschinen-Buchung (sollte blockiert werden)
  const dryerNoWasher = await testRequest('POST', '/bookings', {
    machine_id: firstDryer,
    date: today,
    slot: '08:00-12:00',
    user_name: userDryerWasher
  });
  
  if (!dryerNoWasher.success && dryerNoWasher.data && dryerNoWasher.data.error) {
    if (dryerNoWasher.data.error.includes('Waschmaschinen-Buchung')) {
      console.log(`✓ Korrekt: Trocknungsraum blockiert ohne Waschmaschinen-Buchung - ${dryerNoWasher.data.error}`);
    } else {
      console.log(`✗ Unerwartete Fehlermeldung: ${dryerNoWasher.data.error}`);
    }
  } else if (dryerNoWasher.error) {
    console.log(`✗ Verbindungsfehler: ${dryerNoWasher.error}`);
  } else {
    console.log('✗ Fehler: Trocknungsraum sollte ohne Waschmaschinen-Buchung blockiert sein');
  }
  
  // Waschmaschinen-Buchung erstellen
  const washerForDryer = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: today,
    slot: '08:00-12:00',
    user_name: userDryerWasher
  });
  
  if (washerForDryer.success) {
    console.log('✓ Waschmaschinen-Buchung erstellt');
    
    // Trocknungsraum MIT Waschmaschinen-Buchung (sollte erlaubt sein)
    const dryerWithWasher = await testRequest('POST', '/bookings', {
      machine_id: firstDryer,
      date: today,
      slot: '12:00-16:00',
      user_name: userDryerWasher
    });
    
    if (dryerWithWasher.success) {
      console.log(`✓ Korrekt: Trocknungsraum erlaubt mit Waschmaschinen-Buchung (ID: ${dryerWithWasher.data.data.id})\n`);
    } else {
      console.log(`✗ Fehler: Trocknungsraum sollte mit Waschmaschinen-Buchung erlaubt sein: ${dryerWithWasher.data?.error || dryerWithWasher.error}\n`);
    }
  } else {
    console.log(`✗ Fehler bei Waschmaschinen-Buchung: ${washerForDryer.data?.error || washerForDryer.error}\n`);
  }

  console.log('=== TEST: Trocknungsraum - Zeitliche Kopplung ===\n');
  const userDryerTime = `TestUserDryerTime_${Date.now()}`;
  
  // Waschmaschinen-Buchung erstellen
  const washerTime = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: today,
    slot: '12:00-16:00',
    user_name: userDryerTime
  });
  
  if (washerTime.success) {
    console.log('✓ Waschmaschinen-Buchung erstellt (12:00-16:00)');
    
    // Trocknungsraum VOR Waschmaschinen-Slot (sollte blockiert werden)
    const dryerBefore = await testRequest('POST', '/bookings', {
      machine_id: firstDryer,
      date: today,
      slot: '08:00-12:00',
      user_name: userDryerTime
    });
    
    if (!dryerBefore.success && dryerBefore.data.error) {
      if (dryerBefore.data.error.includes('nach einem Waschmaschinen-Slot')) {
        console.log(`✓ Korrekt: Trocknungsraum blockiert vor Waschmaschinen-Slot - ${dryerBefore.data.error}\n`);
      } else {
        console.log(`✗ Unerwartete Fehlermeldung: ${dryerBefore.data.error}\n`);
      }
    } else {
      console.log('✗ Fehler: Trocknungsraum sollte VOR Waschmaschinen-Slot blockiert sein\n');
    }
  } else {
    console.log(`✗ Fehler bei Waschmaschinen-Buchung: ${washerTime.data?.error || washerTime.error}\n`);
  }

  console.log('=== TEST: Trocknungsraum - Slot-Serien (3 aufeinanderfolgende) ===\n');
  const userSeries = `TestUserSeries_${Date.now()}`;
  // Verwende nächsten Sonntag für Serie
  const seriesSunday = new Date();
  const daysUntilSeriesSunday = (7 - seriesSunday.getDay()) % 7;
  if (daysUntilSeriesSunday === 0) {
    seriesSunday.setDate(seriesSunday.getDate() + 7);
  } else {
    seriesSunday.setDate(seriesSunday.getDate() + daysUntilSeriesSunday);
  }
  const seriesSundayStr = seriesSunday.toISOString().split('T')[0];
  
  // Slot 1
  const series1 = await testRequest('POST', '/bookings', {
    machine_id: firstDryer,
    date: seriesSundayStr,
    slot: '08:00-12:00',
    user_name: userSeries
  });
  
  if (series1.success) {
    console.log('✓ Slot 1 erstellt');
    
    // Slot 2
    const series2 = await testRequest('POST', '/bookings', {
      machine_id: firstDryer,
      date: seriesSundayStr,
      slot: '12:00-16:00',
      user_name: userSeries
    });
    
    if (series2.success) {
      console.log('✓ Slot 2 erstellt');
      
      // Slot 3
      const series3 = await testRequest('POST', '/bookings', {
        machine_id: firstDryer,
        date: seriesSundayStr,
        slot: '16:00-20:00',
        user_name: userSeries
      });
      
      if (series3.success) {
        console.log('✓ Slot 3 erstellt');
        console.log('✓ Korrekt: 3 aufeinanderfolgende Slots erlaubt\n');
      } else {
        console.log(`✗ Fehler bei Slot 3: ${series3.data?.error || series3.error}\n`);
      }
    } else {
      console.log(`✗ Fehler bei Slot 2: ${series2.data?.error || series2.error}\n`);
    }
  } else {
    console.log(`✗ Fehler bei Slot 1: ${series1.data?.error || series1.error}\n`);
  }

  console.log('=== TEST: Trocknungsraum - Sonntag-Ausnahme (keine Wasch-Voraussetzung) ===\n');
  const userSundayDryer = `TestUserSundayDryer_${Date.now()}`;
  // Finde nächsten Sonntag für diesen Test
  const sundayForDryer = new Date();
  const daysUntilSundayDryer = (7 - sundayForDryer.getDay()) % 7;
  if (daysUntilSundayDryer === 0) {
    sundayForDryer.setDate(sundayForDryer.getDate() + 7);
  } else {
    sundayForDryer.setDate(sundayForDryer.getDate() + daysUntilSundayDryer);
  }
  const sundayForDryerStr = sundayForDryer.toISOString().split('T')[0];
  
  // Trocknungsraum am Sonntag OHNE Waschmaschinen-Buchung (sollte erlaubt sein)
  const dryerSundayNoWasher = await testRequest('POST', '/bookings', {
    machine_id: firstDryer,
    date: sundayForDryerStr,
    slot: '08:00-12:00',
    user_name: userSundayDryer
  });
  
  if (dryerSundayNoWasher.success) {
    console.log(`✓ Korrekt: Trocknungsraum am Sonntag ohne Waschmaschinen-Buchung erlaubt (ID: ${dryerSundayNoWasher.data.data.id})\n`);
  } else {
    console.log(`✗ Fehler: Trocknungsraum sollte am Sonntag ohne Waschmaschinen-Buchung erlaubt sein: ${dryerSundayNoWasher.data?.error || dryerSundayNoWasher.error}\n`);
  }

  console.log('=== TEST: Ungültiger Slot ===\n');
  const invalidSlot = await testRequest('POST', '/bookings', {
    machine_id: firstWasher,
    date: today,
    slot: '08:00-10:00', // Alter Slot
    user_name: `TestUserInvalid_${Date.now()}`
  });
  
  if (!invalidSlot.success && invalidSlot.data.error) {
    if (invalidSlot.data.error.includes('Ungültiger Slot') || invalidSlot.data.error.includes('gültige Slots')) {
      console.log(`✓ Korrekt: Alter Slot blockiert - ${invalidSlot.data.error}\n`);
    } else {
      console.log(`✗ Unerwartete Fehlermeldung: ${invalidSlot.data.error}\n`);
    }
  } else {
    console.log('✗ Fehler: Alter Slot sollte blockiert werden\n');
  }

  console.log('=== TEST ZUSAMMENFASSUNG ===\n');
  console.log('Alle Tests abgeschlossen. Bitte prüfen Sie die Ergebnisse oben.');
}

// Führe Tests aus
runTests().catch(console.error);

