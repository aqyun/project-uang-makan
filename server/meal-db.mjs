import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(projectRoot, 'data');
await mkdir(dataDirectory, { recursive: true });
const database = new DatabaseSync(path.join(dataDirectory, 'meal-allowance.sqlite'));
database.exec(`
  CREATE TABLE IF NOT EXISTS employee_uploads (
    nip TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    paid_days INTEGER NOT NULL DEFAULT 0,
    details TEXT NOT NULL DEFAULT '[]',
    uploaded_at TEXT NOT NULL,
    PRIMARY KEY (nip, month, year)
  )
`);
try {
  database.exec("ALTER TABLE employee_uploads ADD COLUMN details TEXT NOT NULL DEFAULT '[]'");
} catch {
  // Existing databases already contain the details column.
}

const port = Number(process.env.MEAL_DB_PORT || 8787);
const json = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
};
const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};
const validPeriod = (month, year) => typeof month === 'string' && month.length > 0 && /^\d{4}$/.test(String(year));

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (url.pathname === '/api/meal-allowance/uploads' && request.method === 'GET') {
    const month = url.searchParams.get('month') || '';
    const year = url.searchParams.get('year') || '';
    if (!validPeriod(month, year)) return json(response, 400, { error: 'Bulan dan tahun wajib dipilih.' });
    const rows = database.prepare('SELECT nip, month, year, total, paid_days AS paidDays, details, uploaded_at AS uploadedAt FROM employee_uploads WHERE month = ? AND year = ?').all(month, Number(year));
    return json(response, 200, rows.map((row) => ({ ...row, rows: JSON.parse(row.details || '[]') })));
  }
  if (url.pathname === '/api/meal-allowance/uploads' && request.method === 'POST') {
    try {
      const body = await readBody(request);
      if (!body.nip || !validPeriod(body.month, body.year)) return json(response, 400, { error: 'NIP, bulan, dan tahun wajib diisi.' });
      database.prepare(`
        INSERT INTO employee_uploads (nip, month, year, total, paid_days, details, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(nip, month, year) DO UPDATE SET total = excluded.total, paid_days = excluded.paid_days, details = excluded.details, uploaded_at = excluded.uploaded_at
      `).run(String(body.nip), body.month, Number(body.year), Number(body.total) || 0, Number(body.paidDays) || 0, JSON.stringify(body.rows || []), new Date().toISOString());
      return json(response, 200, { ok: true });
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : 'Data upload tidak dapat disimpan.' });
    }
  }
  return json(response, 404, { error: 'Endpoint tidak ditemukan.' });
}).listen(port, '127.0.0.1', () => {
  console.log(`Meal allowance database API: http://127.0.0.1:${port}`);
});
