/**
 * Monitoring-Dashboard JavaScript
 * Lädt und aktualisiert Metriken automatisch
 */

const API_BASE = '/api/monitoring';
let refreshInterval = null;
let autoRefreshEnabled = true;
let refreshIntervalMs = 10000; // 10 Sekunden

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadMetrics();
  startAutoRefresh();
});

/**
 * Event-Listener einrichten
 */
function setupEventListeners() {
  // Refresh-Button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadMetrics();
    });
  }
  
  // Auto-Refresh Toggle
  const autoRefresh = document.getElementById('auto-refresh');
  if (autoRefresh) {
    autoRefresh.addEventListener('change', (e) => {
      autoRefreshEnabled = e.target.checked;
      if (autoRefreshEnabled) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });
  }
  
  // Refresh-Interval ändern
  const refreshInterval = document.getElementById('refresh-interval');
  if (refreshInterval) {
    refreshInterval.addEventListener('change', (e) => {
      refreshIntervalMs = parseInt(e.target.value);
      if (autoRefreshEnabled) {
        stopAutoRefresh();
        startAutoRefresh();
      }
    });
  }
}

/**
 * Metriken laden
 */
async function loadMetrics() {
  try {
    const response = await fetch(`${API_BASE}/metrics`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      updateDashboard(data.data);
      const loading = document.getElementById('loading');
      const dashboardContent = document.getElementById('dashboard-content');
      const errorContainer = document.getElementById('error-container');
      if (loading) loading.style.display = 'none';
      if (dashboardContent) dashboardContent.style.display = 'block';
      if (errorContainer) errorContainer.innerHTML = '';
      updateLastUpdateTime();
    } else {
      throw new Error(data.error || 'Unbekannter Fehler');
    }
  } catch (error) {
    console.error('Fehler beim Laden der Metriken:', error);
    const loading = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');
    if (loading) loading.style.display = 'none';
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <strong>Fehler beim Laden der Metriken:</strong> ${error.message}
        </div>
      `;
    }
  }
}

/**
 * Dashboard aktualisieren
 */
function updateDashboard(metrics) {
  // System-Status
  updateSystemStatus(metrics);
  
  // Uptime
  document.getElementById('uptime-value').textContent = metrics.uptime?.formatted || '-';
  
  // Request-Statistiken
  updateRequestStats(metrics);
  
  // Top Endpoints
  updateTopEndpoints(metrics);
  
  // Datenbank-Metriken
  updateDatabaseMetrics(metrics);
  
  // API-Statistiken
  updateApiStats(metrics);
  
  // Letzte Stunde
  updateLastHour(metrics);
  
  // Langsame Requests
  updateSlowRequests(metrics);
}

/**
 * System-Status aktualisieren
 */
function updateSystemStatus(metrics) {
  const statusCard = document.getElementById('status-card');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const statusSubtitle = document.getElementById('status-subtitle');
  
  // Status basierend auf Metriken bestimmen
  let status = 'healthy';
  let statusClass = 'success';
  
  const errorRate = parseFloat(metrics.requests?.errorRate || '0');
  const avgResponseTime = metrics.performance?.responseTime?.avg || 0;
  const memoryUsage = parseFloat(metrics.system?.memory?.usage || '0');
  
  if (errorRate > 5 || avgResponseTime > 1000 || memoryUsage > 80) {
    status = 'degraded';
    statusClass = 'warning';
  }
  
  if (errorRate > 10 || avgResponseTime > 2000 || memoryUsage > 90) {
    status = 'error';
    statusClass = 'error';
  }
  
  statusCard.className = `metric-card ${statusClass}`;
  statusIndicator.className = `status-indicator status-${status}`;
  statusText.textContent = status === 'healthy' ? 'Gesund' : status === 'degraded' ? 'Beeinträchtigt' : 'Fehler';
  statusSubtitle.textContent = `Fehlerrate: ${errorRate}% | Antwortzeit: ${avgResponseTime}ms | Speicher: ${memoryUsage}%`;
}

/**
 * Request-Statistiken aktualisieren
 */
function updateRequestStats(metrics) {
  const requests = metrics.requests || {};
  
  // Gesamt Requests
  document.getElementById('total-requests').textContent = formatNumber(requests.total || 0);
  
  // Fehlerrate
  const errorRate = parseFloat(requests.errorRate || '0');
  const errorCount = requests.errors || 0;
  document.getElementById('error-rate').textContent = `${errorRate}%`;
  document.getElementById('error-count').textContent = `${errorCount} Fehler`;
  
  const errorProgress = document.getElementById('error-progress');
  errorProgress.style.width = `${Math.min(errorRate, 100)}%`;
  errorProgress.className = 'progress-fill';
  if (errorRate > 10) {
    errorProgress.classList.add('error');
  } else if (errorRate > 5) {
    errorProgress.classList.add('warning');
  }
  
  // Antwortzeiten
  const responseTime = metrics.performance?.responseTime || {};
  document.getElementById('avg-response-time').textContent = `${responseTime.avg || 0}ms`;
  document.getElementById('p50-time').textContent = `${responseTime.percentiles?.p50 || 0}ms`;
  document.getElementById('p95-time').textContent = `${responseTime.percentiles?.p95 || 0}ms`;
  document.getElementById('p99-time').textContent = `${responseTime.percentiles?.p99 || 0}ms`;
  
  // Speicher
  const memory = metrics.system?.memory || {};
  document.getElementById('memory-usage').textContent = `${memory.current || 0} MB`;
  document.getElementById('memory-peak').textContent = `${memory.peak || 0} MB`;
  document.getElementById('memory-usage-percent').textContent = memory.usage || '0%';
  
  const memoryUsage = parseFloat(memory.usage || '0');
  const memoryProgress = document.getElementById('memory-progress');
  memoryProgress.style.width = `${Math.min(memoryUsage, 100)}%`;
  memoryProgress.className = 'progress-fill';
  if (memoryUsage > 80) {
    memoryProgress.classList.add('error');
  } else if (memoryUsage > 60) {
    memoryProgress.classList.add('warning');
  }
  
  // Nach Methode
  const methodsStats = document.getElementById('methods-stats');
  const byMethod = requests.byMethod || {};
  methodsStats.innerHTML = Object.entries(byMethod)
    .map(([method, count]) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>${method}</span>
        <strong>${formatNumber(count)}</strong>
      </div>
    `).join('');
  
  // Nach Status
  const statusStats = document.getElementById('status-stats');
  const byStatus = requests.byStatus || {};
  statusStats.innerHTML = Object.entries(byStatus)
    .map(([status, count]) => {
      const statusLabel = status === '200' ? '2xx' : status === '300' ? '3xx' : status === '400' ? '4xx' : '5xx';
      const badgeClass = status === '200' ? 'badge-success' : status === '400' ? 'badge-warning' : 'badge-error';
      return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>${statusLabel}</span>
          <span class="badge ${badgeClass}">${formatNumber(count)}</span>
        </div>
      `;
    }).join('');
}

/**
 * Top Endpoints aktualisieren
 */
function updateTopEndpoints(metrics) {
  const topEndpoints = document.getElementById('top-endpoints');
  const endpoints = metrics.requests?.topEndpoints || [];
  
  if (endpoints.length === 0) {
    topEndpoints.innerHTML = '<li style="padding: 20px; text-align: center; color: #666;">Keine Endpoint-Daten verfügbar</li>';
    return;
  }
  
  topEndpoints.innerHTML = endpoints.map(endpoint => `
    <li class="endpoint-item">
      <div class="endpoint-name">${escapeHtml(endpoint.endpoint)}</div>
      <div class="endpoint-stats">
        <div class="stat-item">
          <div class="stat-label">Requests</div>
          <div class="stat-value">${formatNumber(endpoint.count)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Ø Zeit</div>
          <div class="stat-value">${endpoint.avgTime}ms</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Fehler</div>
          <div class="stat-value ${endpoint.errors > 0 ? 'badge-error' : ''}">${endpoint.errors}</div>
        </div>
      </div>
    </li>
  `).join('');
}

/**
 * Datenbank-Metriken aktualisieren
 */
function updateDatabaseMetrics(metrics) {
  const db = metrics.database || {};
  const queries = db.queries || {};
  
  document.getElementById('db-total-queries').textContent = formatNumber(queries.total || 0);
  document.getElementById('db-error-rate').textContent = db.errorRate || '0%';
  document.getElementById('db-error-count').textContent = `${queries.errors || 0} Fehler`;
  document.getElementById('db-slow-queries').textContent = formatNumber(queries.slow || 0);
  document.getElementById('db-slow-rate').textContent = db.slowQueryRate || '0%';
  
  const dbTime = metrics.performance?.dbQueryTime || {};
  document.getElementById('db-avg-time').textContent = `${dbTime.avg || 0}ms`;
  document.getElementById('db-p50').textContent = `${dbTime.percentiles?.p50 || 0}ms`;
  document.getElementById('db-p95').textContent = `${dbTime.percentiles?.p95 || 0}ms`;
}

/**
 * API-Statistiken aktualisieren
 */
function updateApiStats(metrics) {
  const api = metrics.api || {};
  const bookings = api.bookings || {};
  const auth = api.auth || {};
  
  document.getElementById('api-bookings-created').textContent = formatNumber(bookings.created || 0);
  document.getElementById('api-bookings-deleted').textContent = formatNumber(bookings.deleted || 0);
  document.getElementById('api-bookings-errors').textContent = formatNumber(bookings.errors || 0);
  document.getElementById('api-auth-logins').textContent = formatNumber(auth.logins || 0);
  document.getElementById('api-auth-logouts').textContent = formatNumber(auth.logouts || 0);
  document.getElementById('api-auth-failures').textContent = formatNumber(auth.failures || 0);
}

/**
 * Letzte Stunde aktualisieren
 */
function updateLastHour(metrics) {
  const lastHour = metrics.lastHour || {};
  
  document.getElementById('last-hour-requests').textContent = formatNumber(lastHour.requests || 0);
  document.getElementById('last-hour-errors').textContent = formatNumber(lastHour.errors || 0);
  document.getElementById('last-hour-error-rate').textContent = lastHour.errorRate || '0%';
  document.getElementById('last-hour-avg-time').textContent = `${lastHour.avgResponseTime || 0}ms`;
}

/**
 * Langsame Requests aktualisieren
 */
function updateSlowRequests(metrics) {
  const slowRequests = metrics.performance?.slowRequests || [];
  const container = document.getElementById('slow-requests-container');
  
  if (slowRequests.length === 0) {
    container.innerHTML = '<p style="color: #666;">Keine langsame Requests</p>';
    return;
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Zeitpunkt</th>
          <th>Methode</th>
          <th>Endpoint</th>
          <th>Status</th>
          <th>Dauer</th>
        </tr>
      </thead>
      <tbody>
        ${slowRequests.map(req => `
          <tr>
            <td>${new Date(req.timestamp).toLocaleString('de-DE')}</td>
            <td>${req.method}</td>
            <td><code>${escapeHtml(req.endpoint)}</code></td>
            <td><span class="badge ${req.status >= 400 ? 'badge-error' : 'badge-warning'}">${req.status}</span></td>
            <td><strong>${req.responseTime}ms</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Auto-Refresh starten
 */
function startAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    if (autoRefreshEnabled) {
      loadMetrics();
    }
  }, refreshIntervalMs);
}

/**
 * Auto-Refresh stoppen
 */
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Letzte Aktualisierung aktualisieren
 */
function updateLastUpdateTime() {
  const now = new Date();
  document.getElementById('last-update').textContent = 
    `Letzte Aktualisierung: ${now.toLocaleTimeString('de-DE')}`;
}

/**
 * Zahl formatieren (mit Tausender-Trennzeichen)
 */
function formatNumber(num) {
  return new Intl.NumberFormat('de-DE').format(num);
}

/**
 * HTML escapen
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

