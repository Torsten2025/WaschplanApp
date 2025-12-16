/**
 * Jest Setup-Datei
 * Wird vor allen Tests ausgeführt
 */

// Test-Umgebungsvariablen setzen
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Anderer Port für Tests

// Console-Logging für Tests reduzieren
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Timeout für Tests erhöhen
jest.setTimeout(10000);

