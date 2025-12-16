# Dependency-Audit-Report

## Durchführung

```bash
npm audit
npm audit fix
```

## Empfehlungen

### Regelmäßige Audits
- Wöchentlich: `npm audit`
- Bei Updates: `npm audit fix`
- Vor Deployment: Vollständiger Audit

### Automatisierung
- CI/CD-Pipeline führt automatisch `npm audit` aus
- Bei kritischen Vulnerabilities wird Pipeline gestoppt

## Aktuelle Dependencies

### Production
- `cors`: ^2.8.5
- `express`: ^5.2.1
- `sqlite3`: ^5.1.7

### Development
- `eslint`: ^8.57.0
- `jest`: ^29.7.0
- `supertest`: ^6.3.3

## Update-Strategie

### Minor/Patch Updates
- Automatisch mit `npm audit fix`
- Regelmäßig prüfen: `npm outdated`

### Major Updates
- Manuell testen
- Breaking Changes prüfen
- Changelog lesen

## Monitoring

### Tools
- `npm audit` - Lokale Prüfung
- GitHub Dependabot (empfohlen)
- Snyk (optional)

### CI/CD Integration
- Automatischer Audit bei jedem Push
- Warnung bei moderaten Vulnerabilities
- Fehler bei kritischen Vulnerabilities

