/**
 * Stresstest für Waschmaschinen-App
 * Simuliert 20 Benutzer, die gleichzeitig die App nutzen
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;
const NUM_USERS = 20;
const NUM_ACTIONS_PER_USER = 10; // Anzahl Aktionen pro Benutzer

// Test-Ergebnisse
const results = {
  startTime: Date.now(),
  endTime: null,
  users: [],
  errors: [],
  stats: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    bookingsCreated: 0,
    bookingsDeleted: 0,
    bookingsQueried: 0,
    errors: []
  }
};

// Hilfsfunktion: HTTP Request
function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const fullPath = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
    const url = new URL(fullPath);
    
    const hostname = (url.hostname === 'localhost' || url.hostname === '::1') ? '127.0.0.1' : url.hostname;
    const port = url.port || (url.protocol === 'https:' ? 443 : 3000);
    
    const options = {
      hostname: hostname,
      port: port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Host': url.host
      }
    };
    
    if (cookies) {
      options.headers['Cookie'] = cookies;
    }
    
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            cookies: res.headers['set-cookie'] || [],
            responseTime: responseTime
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            cookies: res.headers['set-cookie'] || [],
            responseTime: responseTime
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({ error, responseTime });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject({ error: new Error('Request timeout'), responseTime: 30000 });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Cookie aus Response extrahieren
function extractCookie(response) {
  const setCookie = response.cookies || [];
  if (setCookie.length > 0) {
    return setCookie[0].split(';')[0];
  }
  return '';
}

// Zufälliges Datum generieren (heute bis +30 Tage)
function getRandomDate() {
  const today = new Date();
  const daysOffset = Math.floor(Math.random() * 30);
  const date = new Date(today);
  date.setDate(today.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// Zufälligen Slot auswählen (muss mit server.js übereinstimmen)
const TIME_SLOTS = [
  { start: '07:00', end: '12:00', label: '07:00-12:00' },
  { start: '12:00', end: '17:00', label: '12:00-17:00' },
  { start: '17:00', end: '21:00', label: '17:00-21:00' }
];

function getRandomSlot() {
  return TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)].label;
}

// Zufällige Maschinen-ID (1-8, basierend auf Seed-Daten)
function getRandomMachineId() {
  return Math.floor(Math.random() * 8) + 1;
}

// Simuliere einen Benutzer
async function simulateUser(userId) {
  const userName = `StressTestUser${userId}`;
  const userResults = {
    userId: userId,
    userName: userName,
    actions: [],
    errors: [],
    bookingsCreated: [],
    bookingsDeleted: [],
    startTime: Date.now(),
    endTime: null
  };
  
  try {
    // Aktion 1: Maschinen abrufen
    try {
      const machinesResponse = await makeRequest('GET', '/machines');
      results.stats.totalRequests++;
      if (machinesResponse.status === 200) {
        results.stats.successfulRequests++;
        userResults.actions.push({ type: 'get_machines', status: 'success', responseTime: machinesResponse.responseTime });
      } else {
        results.stats.failedRequests++;
        userResults.errors.push({ type: 'get_machines', status: machinesResponse.status, error: machinesResponse.data });
        userResults.actions.push({ type: 'get_machines', status: 'failed', responseTime: machinesResponse.responseTime });
      }
    } catch (error) {
      results.stats.totalRequests++;
      results.stats.failedRequests++;
      userResults.errors.push({ type: 'get_machines', error: error.error?.message || error.message });
      userResults.actions.push({ type: 'get_machines', status: 'error', error: error.error?.message || error.message });
    }
    
    // Aktion 2: Slots abrufen
    try {
      const slotsResponse = await makeRequest('GET', '/slots');
      results.stats.totalRequests++;
      if (slotsResponse.status === 200) {
        results.stats.successfulRequests++;
        results.stats.bookingsQueried++;
        userResults.actions.push({ type: 'get_slots', status: 'success', responseTime: slotsResponse.responseTime });
      } else {
        results.stats.failedRequests++;
        userResults.errors.push({ type: 'get_slots', status: slotsResponse.status, error: slotsResponse.data });
        userResults.actions.push({ type: 'get_slots', status: 'failed', responseTime: slotsResponse.responseTime });
      }
    } catch (error) {
      results.stats.totalRequests++;
      results.stats.failedRequests++;
      userResults.errors.push({ type: 'get_slots', error: error.error?.message || error.message });
      userResults.actions.push({ type: 'get_slots', status: 'error', error: error.error?.message || error.message });
    }
    
    // Aktion 3-8: Buchungen erstellen (verschiedene Maschinen und Daten)
    for (let i = 0; i < 6; i++) {
      const date = getRandomDate();
      const slot = getRandomSlot();
      const machineId = getRandomMachineId();
      
      try {
        const bookingResponse = await makeRequest('POST', '/bookings', {
          machine_id: machineId,
          date: date,
          slot: slot,
          user_name: userName
        });
        
        results.stats.totalRequests++;
        
        if (bookingResponse.status === 201) {
          results.stats.successfulRequests++;
          results.stats.bookingsCreated++;
          const bookingId = bookingResponse.data?.data?.id;
          if (bookingId) {
            userResults.bookingsCreated.push({ id: bookingId, machine_id: machineId, date: date, slot: slot });
          }
          userResults.actions.push({ 
            type: 'create_booking', 
            status: 'success', 
            responseTime: bookingResponse.responseTime,
            booking: { machine_id: machineId, date: date, slot: slot }
          });
        } else {
          results.stats.failedRequests++;
          userResults.errors.push({ 
            type: 'create_booking', 
            status: bookingResponse.status, 
            error: bookingResponse.data,
            booking: { machine_id: machineId, date: date, slot: slot }
          });
          userResults.actions.push({ 
            type: 'create_booking', 
            status: 'failed', 
            responseTime: bookingResponse.responseTime,
            error: bookingResponse.data
          });
        }
      } catch (error) {
        results.stats.totalRequests++;
        results.stats.failedRequests++;
        userResults.errors.push({ 
          type: 'create_booking', 
          error: error.error?.message || error.message,
          booking: { machine_id: machineId, date: date, slot: slot }
        });
        userResults.actions.push({ 
          type: 'create_booking', 
          status: 'error', 
          error: error.error?.message || error.message 
        });
      }
      
      // Kurze Pause zwischen Buchungen (0-500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    }
    
    // Aktion 9: Buchungen für ein Datum abrufen
    try {
      const date = getRandomDate();
      const bookingsResponse = await makeRequest('GET', `/bookings?date=${date}`);
      results.stats.totalRequests++;
      if (bookingsResponse.status === 200) {
        results.stats.successfulRequests++;
        results.stats.bookingsQueried++;
        userResults.actions.push({ type: 'get_bookings', status: 'success', responseTime: bookingsResponse.responseTime });
      } else {
        results.stats.failedRequests++;
        userResults.errors.push({ type: 'get_bookings', status: bookingsResponse.status, error: bookingsResponse.data });
        userResults.actions.push({ type: 'get_bookings', status: 'failed', responseTime: bookingsResponse.responseTime });
      }
    } catch (error) {
      results.stats.totalRequests++;
      results.stats.failedRequests++;
      userResults.errors.push({ type: 'get_bookings', error: error.error?.message || error.message });
      userResults.actions.push({ type: 'get_bookings', status: 'error', error: error.error?.message || error.message });
    }
    
    // Aktion 10: Einige Buchungen löschen
    for (const booking of userResults.bookingsCreated.slice(0, Math.min(2, userResults.bookingsCreated.length))) {
      try {
        const deleteResponse = await makeRequest('DELETE', `/bookings/${booking.id}?user_name=${userName}`);
        results.stats.totalRequests++;
        
        if (deleteResponse.status === 200 || deleteResponse.status === 204) {
          results.stats.successfulRequests++;
          results.stats.bookingsDeleted++;
          userResults.bookingsDeleted.push(booking.id);
          userResults.actions.push({ 
            type: 'delete_booking', 
            status: 'success', 
            responseTime: deleteResponse.responseTime,
            booking_id: booking.id
          });
        } else {
          results.stats.failedRequests++;
          userResults.errors.push({ 
            type: 'delete_booking', 
            status: deleteResponse.status, 
            error: deleteResponse.data,
            booking_id: booking.id
          });
          userResults.actions.push({ 
            type: 'delete_booking', 
            status: 'failed', 
            responseTime: deleteResponse.responseTime,
            error: deleteResponse.data
          });
        }
      } catch (error) {
        results.stats.totalRequests++;
        results.stats.failedRequests++;
        userResults.errors.push({ 
          type: 'delete_booking', 
          error: error.error?.message || error.message,
          booking_id: booking.id
        });
        userResults.actions.push({ 
          type: 'delete_booking', 
          status: 'error', 
          error: error.error?.message || error.message 
        });
      }
      
      // Kurze Pause zwischen Löschungen
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
    }
    
  } catch (error) {
    userResults.errors.push({ type: 'general', error: error.message });
  } finally {
    userResults.endTime = Date.now();
    userResults.duration = userResults.endTime - userResults.startTime;
  }
  
  return userResults;
}

// Hauptfunktion: Stresstest ausführen
async function runStressTest() {
  console.log('🚀 Starte Stresstest...\n');
  console.log(`📊 Konfiguration:`);
  console.log(`   - Benutzer: ${NUM_USERS}`);
  console.log(`   - Aktionen pro Benutzer: ~${NUM_ACTIONS_PER_USER}`);
  console.log(`   - API-Base: ${API_BASE}`);
  console.log(`   - Startzeit: ${new Date().toISOString()}\n`);
  
  // Alle Benutzer gleichzeitig starten
  const userPromises = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    userPromises.push(simulateUser(i));
  }
  
  console.log(`⏳ ${NUM_USERS} Benutzer werden gleichzeitig simuliert...\n`);
  
  // Warte auf alle Benutzer
  const userResults = await Promise.all(userPromises);
  
  results.users = userResults;
  results.endTime = Date.now();
  results.duration = results.endTime - results.startTime;
  
  // Statistiken berechnen
  const allErrors = userResults.flatMap(u => u.errors);
  results.stats.errors = allErrors;
  
  const allResponseTimes = userResults.flatMap(u => 
    u.actions.map(a => a.responseTime).filter(rt => rt !== undefined)
  );
  
  const avgResponseTime = allResponseTimes.length > 0
    ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
    : 0;
  
  const minResponseTime = allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0;
  const maxResponseTime = allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0;
  
  // Ergebnisse ausgeben
  console.log('\n' + '='.repeat(60));
  console.log('📊 STRESSTEST-ERGEBNISSE');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Dauer: ${(results.duration / 1000).toFixed(2)} Sekunden`);
  console.log(`📈 Gesamt-Requests: ${results.stats.totalRequests}`);
  console.log(`✅ Erfolgreich: ${results.stats.successfulRequests} (${((results.stats.successfulRequests / results.stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`❌ Fehlgeschlagen: ${results.stats.failedRequests} (${((results.stats.failedRequests / results.stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`\n📝 Aktionen:`);
  console.log(`   - Buchungen erstellt: ${results.stats.bookingsCreated}`);
  console.log(`   - Buchungen gelöscht: ${results.stats.bookingsDeleted}`);
  console.log(`   - Buchungen abgefragt: ${results.stats.bookingsQueried}`);
  console.log(`\n⚡ Performance:`);
  console.log(`   - Durchschnittliche Response-Zeit: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   - Minimale Response-Zeit: ${minResponseTime.toFixed(2)}ms`);
  console.log(`   - Maximale Response-Zeit: ${maxResponseTime.toFixed(2)}ms`);
  console.log(`\n👥 Benutzer-Statistiken:`);
  
  const userStats = userResults.map(u => ({
    userId: u.userId,
    userName: u.userName,
    duration: u.duration,
    actions: u.actions.length,
    errors: u.errors.length,
    bookingsCreated: u.bookingsCreated.length,
    bookingsDeleted: u.bookingsDeleted.length
  }));
  
  const avgUserDuration = userStats.reduce((a, b) => a + b.duration, 0) / userStats.length;
  const avgUserActions = userStats.reduce((a, b) => a + b.actions, 0) / userStats.length;
  const totalErrors = userStats.reduce((a, b) => a + b.errors, 0);
  
  console.log(`   - Durchschnittliche Benutzer-Dauer: ${avgUserDuration.toFixed(2)}ms`);
  console.log(`   - Durchschnittliche Aktionen pro Benutzer: ${avgUserActions.toFixed(2)}`);
  console.log(`   - Gesamt-Fehler: ${totalErrors}`);
  
  // Fehler nach Typ gruppieren
  const errorsByType = {};
  allErrors.forEach(e => {
    const type = e.type || 'unknown';
    errorsByType[type] = (errorsByType[type] || 0) + 1;
  });
  
  if (Object.keys(errorsByType).length > 0) {
    console.log(`\n❌ Fehler nach Typ:`);
    Object.entries(errorsByType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
  }
  
  // Ergebnisse in Datei speichern
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    configuration: {
      numUsers: NUM_USERS,
      numActionsPerUser: NUM_ACTIONS_PER_USER,
      apiBase: API_BASE
    },
    summary: {
      duration: results.duration,
      totalRequests: results.stats.totalRequests,
      successfulRequests: results.stats.successfulRequests,
      failedRequests: results.stats.failedRequests,
      successRate: ((results.stats.successfulRequests / results.stats.totalRequests) * 100).toFixed(2) + '%',
      bookingsCreated: results.stats.bookingsCreated,
      bookingsDeleted: results.stats.bookingsDeleted,
      bookingsQueried: results.stats.bookingsQueried,
      avgResponseTime: avgResponseTime.toFixed(2),
      minResponseTime: minResponseTime.toFixed(2),
      maxResponseTime: maxResponseTime.toFixed(2)
    },
    userStats: userStats,
    errorsByType: errorsByType,
    allErrors: allErrors.slice(0, 100) // Nur erste 100 Fehler speichern
  };
  
  fs.writeFileSync('STRESSTEST_REPORT.json', JSON.stringify(report, null, 2));
  console.log(`\n📄 Detaillierter Report gespeichert: STRESSTEST_REPORT.json`);
  
  console.log('\n' + '='.repeat(60));
  
  // Exit-Code basierend auf Fehlerrate
  const errorRate = (results.stats.failedRequests / results.stats.totalRequests) * 100;
  if (errorRate > 10) {
    console.log('⚠️  WARNUNG: Fehlerrate über 10%!');
    process.exit(1);
  } else if (errorRate > 5) {
    console.log('⚠️  WARNUNG: Fehlerrate über 5%!');
    process.exit(0);
  } else {
    console.log('✅ Stresstest erfolgreich abgeschlossen!');
    process.exit(0);
  }
}

// Stresstest ausführen
if (require.main === module) {
  runStressTest().catch(error => {
    console.error('💥 Kritischer Fehler beim Stresstest:', error);
    process.exit(1);
  });
}

module.exports = { runStressTest, simulateUser };

