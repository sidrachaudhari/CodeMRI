/**
 * Client library to interact with Neon Postgres backend API
 */

export async function fetchNeonHealth() {
  try {
    const res = await fetch('/api/neon/health');
    if (!res.ok) {
      throw new Error(`Neon health check returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn('Neon health check failed:', error);
    return {
      status: 'offline',
      provider: 'Neon Lakebase Postgres',
      error: error.message
    };
  }
}

export async function persistScanToNeon(scanResult) {
  try {
    const res = await fetch('/api/scans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scanResult)
    });
    if (!res.ok) {
      throw new Error(`Failed to persist scan to Neon: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn('Could not persist scan to Neon:', error);
    return null;
  }
}

export async function fetchSavedScans() {
  try {
    const res = await fetch('/api/scans');
    if (!res.ok) {
      throw new Error(`Failed to fetch scans: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn('Could not fetch scans from Neon:', error);
    return [];
  }
}
