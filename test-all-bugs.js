/**
 * Umfassendes Test-Skript für alle Bugs
 * Testet: Admin-Login, User-Login, Senior-Login, Buchungen, Session
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test-Ergebnisse
const results = {
  passed: [],
  failed: [],
  errors: []
};

// Hilfsfunktion: HTTP Request
function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (cookies) {
      options.headers['Cookie'] = cookies;
    }
    
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            cookies: res.headers['set-cookie'] || []
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            cookies: res.headers['set-cookie'] || []
          });
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

// Test-Funktion
async function test(name, testFn) {
  try {
    console.log(`\n🧪 Test: ${name}`);
    const result = await testFn();
    if (result.success) {
      console.log(`✅ PASSED: ${name}`);
      results.passed.push({ name, details: result.details });
      return true;
    } else {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Grund: ${result.reason}`);
      results.failed.push({ name, reason: result.reason, details: result.details });
      return false;
    }
  } catch (error) {
    console.log(`💥 ERROR: ${name}`);
    console.log(`   Fehler: ${error.message}`);
    results.errors.push({ name, error: error.message, stack: error.stack });
    return false;
  }
}

// Cookie aus Response extrahieren
function extractCookie(response) {
  const setCookie = response.cookies || [];
  if (setCookie.length > 0) {
    return setCookie[0].split(';')[0];
  }
  return '';
}

// Tests
async function runTests() {
  console.log('🚀 Starte umfassende Tests...\n');
  console.log(`Testing gegen: ${API_BASE}\n`);
  
  let adminCookies = '';
  let userCookies = '';
  let seniorCookies = '';
  
  // Test 1: Admin-Login
  await test('Admin-Login', async () => {
    const response = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.status === 200 || response.status === 201) {
      if (response.data.success && response.data.data) {
        adminCookies = extractCookie(response);
        return {
          success: true,
          details: { status: response.status, user: response.data.data }
        };
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 2: Admin-Session prüfen
  await test('Admin-Session prüfen', async () => {
    if (!adminCookies) {
      return { success: false, reason: 'Keine Admin-Cookies vorhanden' };
    }
    
    const response = await makeRequest('GET', '/auth/session', null, adminCookies);
    
    if (response.status === 200) {
      if (response.data.success && response.data.data && response.data.data.role === 'admin') {
        return {
          success: true,
          details: { status: response.status, user: response.data.data }
        };
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 3: Admin-Endpoints prüfen
  await test('Admin-Endpoints zugänglich', async () => {
    if (!adminCookies) {
      return { success: false, reason: 'Keine Admin-Cookies vorhanden' };
    }
    
    const response = await makeRequest('GET', '/admin/bookings', null, adminCookies);
    
    if (response.status === 200) {
      return {
        success: true,
        details: { status: response.status }
      };
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 4: Einfaches Login (normale User)
  await test('Einfaches Login (normale User)', async () => {
    const response = await makeRequest('POST', '/auth/login-simple', {
      name: 'TestUser'
    });
    
    if (response.status === 200 || response.status === 201) {
      if (response.data.success && response.data.data) {
        userCookies = extractCookie(response);
        return {
          success: true,
          details: { status: response.status, user: response.data.data }
        };
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 5: User-Session prüfen
  await test('User-Session prüfen', async () => {
    if (!userCookies) {
      return { success: false, reason: 'Keine User-Cookies vorhanden' };
    }
    
    const response = await makeRequest('GET', '/auth/session', null, userCookies);
    
    if (response.status === 200) {
      if (response.data.success && response.data.data) {
        return {
          success: true,
          details: { status: response.status, user: response.data.data }
        };
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 6: Buchung erstellen
  await test('Buchung erstellen', async () => {
    if (!userCookies) {
      return { success: false, reason: 'Keine User-Cookies vorhanden' };
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const response = await makeRequest('POST', '/bookings', {
      machine_id: 1,
      date: dateStr,
      slot: '07:00-12:00',
      user_name: 'TestUser'
    }, userCookies);
    
    if (response.status === 201) {
      if (response.data.success && response.data.data) {
        return {
          success: true,
          details: { status: response.status, booking: response.data.data }
        };
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 7: Senior-Login
  await test('Senior-Login', async () => {
    const response = await makeRequest('POST', '/auth/login-senior', {
      name: 'SeniorUser'
    });
    
    if (response.status === 200 || response.status === 201) {
      if (response.data.success && response.data.data) {
        seniorCookies = extractCookie(response);
        if (response.data.data.role === 'senior') {
          return {
            success: true,
            details: { status: response.status, user: response.data.data }
          };
        }
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Test 8: Senior-Session prüfen
  await test('Senior-Session prüfen', async () => {
    if (!seniorCookies) {
      return { success: false, reason: 'Keine Senior-Cookies vorhanden' };
    }
    
    const response = await makeRequest('GET', '/auth/session', null, seniorCookies);
    
    if (response.status === 200) {
      if (response.data.success && response.data.data && response.data.data.role === 'senior') {
        return {
          success: true,
          details: { status: response.status, user: response.data.data }
        };
      }
    }
    return {
      success: false,
      reason: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`,
      details: response
    };
  });
  
  // Zusammenfassung
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST-ZUSAMMENFASSUNG');
  console.log('='.repeat(60));
  console.log(`✅ Bestanden: ${results.passed.length}`);
  console.log(`❌ Fehlgeschlagen: ${results.failed.length}`);
  console.log(`💥 Fehler: ${results.errors.length}`);
  console.log('='.repeat(60));
  
  if (results.failed.length > 0) {
    console.log('\n❌ FEHLGESCHLAGENE TESTS:');
    results.failed.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.name}`);
      console.log(`   Grund: ${f.reason}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n💥 FEHLER:');
    results.errors.forEach((e, i) => {
      console.log(`\n${i + 1}. ${e.name}`);
      console.log(`   Fehler: ${e.error}`);
    });
  }
  
  // Fehler-Dokumentation erstellen
  if (results.failed.length > 0 || results.errors.length > 0) {
    const fs = require('fs');
    const errorReport = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: results.passed.length,
        failed: results.failed.length,
        errors: results.errors.length
      },
      failed: results.failed,
      errors: results.errors
    };
    
    fs.writeFileSync('TEST_FEHLER_REPORT.json', JSON.stringify(errorReport, null, 2));
    console.log('\n📝 Fehler-Report gespeichert: TEST_FEHLER_REPORT.json');
  }
  
  return {
    passed: results.passed.length,
    failed: results.failed.length,
    errors: results.errors.length,
    results
  };
}

// Tests ausführen
if (require.main === module) {
  runTests()
    .then((summary) => {
      process.exit(summary.failed > 0 || summary.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Kritischer Fehler beim Testen:', error);
      process.exit(1);
    });
}

module.exports = { runTests, test, makeRequest };

