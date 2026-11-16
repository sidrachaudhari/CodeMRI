import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Helper to resolve DATABASE_URL from process.env or .env.local / .env
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  for (const file of ['.env.local', '.env']) {
    try {
      const p = path.resolve(process.cwd(), file);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const match = content.match(/^DATABASE_URL=(.*)$/m);
        if (match) {
          return match[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
      }
    } catch {}
  }
  return null;
}

let sqlInstance = null;

export function getSqlClient() {
  if (!sqlInstance) {
    const url = getDatabaseUrl();
    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment or .env.local / .env');
    }
    sqlInstance = neon(url);
  }
  return sqlInstance;
}

/**
 * Initializes the Neon Postgres database schema if not present, and applies migrations.
 */
export async function initDatabase() {
  const sql = getSqlClient();
  await sql`
    CREATE TABLE IF NOT EXISTS codemri_scans (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      language VARCHAR(50),
      build_tool VARCHAR(50),
      files_analyzed INTEGER,
      loc INTEGER,
      health_score INTEGER,
      tech_debt_hours INTEGER,
      critical_issues INTEGER,
      summary JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`ALTER TABLE codemri_scans ADD COLUMN IF NOT EXISTS build_tool VARCHAR(50);`;
  await sql`ALTER TABLE codemri_scans ADD COLUMN IF NOT EXISTS files_analyzed INTEGER;`;
  await sql`ALTER TABLE codemri_scans ADD COLUMN IF NOT EXISTS loc INTEGER;`;
}

/**
 * Returns database health and diagnostics.
 */
export async function getDbHealth() {
  const sql = getSqlClient();
  const startTime = Date.now();
  const rows = await sql`
    SELECT 
      NOW() as current_time,
      current_database() as database,
      current_user as "user",
      version() as pg_version
  `;
  const latencyMs = Date.now() - startTime;

  // Ensure table exists and count scans
  await initDatabase();
  const countRow = await sql`SELECT COUNT(*)::int as total_scans FROM codemri_scans`;

  return {
    status: 'connected',
    provider: 'Neon Lakebase Postgres',
    branch: process.env.NEON_BRANCH || 'production',
    branchId: process.env.NEON_BRANCH_ID || 'br-long-mud-aouez3f7',
    database: rows[0]?.database || 'neondb',
    user: rows[0]?.user || 'neondb_owner',
    pgVersion: rows[0]?.pg_version || 'PostgreSQL 18.x',
    latencyMs,
    totalScans: countRow[0]?.total_scans || 0,
    timestamp: rows[0]?.current_time || new Date().toISOString()
  };
}

/**
 * Saves a scan diagnostic to Neon Postgres.
 */
export async function saveScan(scanData) {
  const sql = getSqlClient();
  await initDatabase();

  const projectName = scanData.projectName || scanData.name || 'Unknown Project';
  const language = scanData.language || 'Java';
  const buildTool = scanData.buildTool || 'Maven';
  const filesAnalyzed = scanData.filesAnalyzed || 0;
  const loc = scanData.loc || 0;
  const healthScore = typeof scanData.healthScore === 'object' ? scanData.healthScore.overall : (scanData.healthScore || 0);
  const techDebtHours = scanData.techDebtHours || 0;
  const criticalIssues = scanData.issuesDetected || (scanData.findings ? scanData.findings.length : 0);
  const summary = JSON.stringify(scanData);

  const inserted = await sql`
    INSERT INTO codemri_scans (
      project_name, language, build_tool, files_analyzed, loc,
      health_score, tech_debt_hours, critical_issues, summary
    ) VALUES (
      ${projectName}, ${language}, ${buildTool}, ${filesAnalyzed}, ${loc},
      ${healthScore}, ${techDebtHours}, ${criticalIssues}, ${summary}::jsonb
    )
    RETURNING id, project_name, health_score, tech_debt_hours, created_at;
  `;

  return inserted[0];
}

/**
 * Gets recent scans from Neon Postgres.
 */
export async function getScans(limit = 10) {
  const sql = getSqlClient();
  await initDatabase();
  const rows = await sql`
    SELECT 
      id, project_name, language, build_tool, files_analyzed, loc,
      health_score, tech_debt_hours, critical_issues, summary, created_at
    FROM codemri_scans
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;
  return rows;
}
