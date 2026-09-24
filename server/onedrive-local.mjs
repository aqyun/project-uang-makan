import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.join(
  os.homedir(),
  'OneDrive - Kementerian PKP',
  'Documents',
  'GAJI DAN TUNJANGAN',
  '2026',
  'UANG MAKAN',
);
const rootDirectory = path.resolve(process.env.ONEDRIVE_MEAL_ROOT || defaultRoot);
const port = Number(process.env.MEAL_API_PORT || 8787);
const allowedExtensions = /\.(xlsx?|csv|pdf|docx?|txt|jpe?g|png|webp)$/i;

const json = (response, status, value) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  response.end(JSON.stringify(value));
};

const list = async (directory) => {
  try {
    return await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
};

const relativeFile = (filePath) => path.relative(rootDirectory, filePath).split(path.sep).join('/');
const toFileInfo = (filePath) => ({ name: path.basename(filePath), relativePath: relativeFile(filePath), url: `/api/onedrive/file?path=${encodeURIComponent(relativeFile(filePath))}` });

const readEmployeeFiles = async (directory) => {
  const entries = await list(directory);
  return entries
    .filter((entry) => entry.isFile() && allowedExtensions.test(entry.name))
    .map((entry) => toFileInfo(path.join(directory, entry.name)));
};

const readTree = async () => {
  const months = [];
  for (const monthEntry of await list(rootDirectory)) {
    if (!monthEntry.isDirectory() || !/^UM\s+/i.test(monthEntry.name)) continue;
    const monthDirectory = path.join(rootDirectory, monthEntry.name);
    const secretariat = (await list(monthDirectory)).find((entry) => entry.isDirectory() && /sekretariat\s+jenderal/i.test(entry.name));
    if (!secretariat) continue;
    const secretariatDirectory = path.join(monthDirectory, secretariat.name);
    const bureau = (await list(secretariatDirectory)).find((entry) => entry.isDirectory() && /biro\s+komunikasi\s+publik/i.test(entry.name));
    if (!bureau) continue;
    const bureauDirectory = path.join(secretariatDirectory, bureau.name);
    const types = [];
    for (const typeEntry of await list(bureauDirectory)) {
      if (!typeEntry.isDirectory()) continue;
      const employees = [];
      for (const employeeEntry of await list(path.join(bureauDirectory, typeEntry.name))) {
        if (!employeeEntry.isDirectory()) continue;
        const employeeDirectory = path.join(bureauDirectory, typeEntry.name, employeeEntry.name);
        employees.push({ name: employeeEntry.name, files: await readEmployeeFiles(employeeDirectory) });
      }
      types.push({ name: typeEntry.name, employees });
    }
    months.push({ name: monthEntry.name, types });
  }
  return { root: rootDirectory, months };
};

const isInsideRoot = (targetPath) => targetPath === rootDirectory || targetPath.startsWith(`${rootDirectory}${path.sep}`);

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (requestUrl.pathname === '/api/onedrive/health') {
    const entries = await list(rootDirectory);
    return json(response, 200, { ok: true, root: rootDirectory, exists: entries.length > 0 });
  }
  if (requestUrl.pathname === '/api/onedrive/tree') {
    return json(response, 200, await readTree());
  }
  if (requestUrl.pathname === '/api/onedrive/file') {
    const relativePath = requestUrl.searchParams.get('path') || '';
    const filePath = path.resolve(rootDirectory, relativePath);
    if (!isInsideRoot(filePath) || !allowedExtensions.test(filePath)) return json(response, 400, { error: 'File tidak diizinkan.' });
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) return json(response, 404, { error: 'File tidak ditemukan.' });
      const content = await fs.readFile(filePath);
      response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': content.length, 'Access-Control-Allow-Origin': '*' });
      return response.end(content);
    } catch {
      return json(response, 404, { error: 'File tidak ditemukan.' });
    }
  }
  return json(response, 404, { error: 'Endpoint tidak ditemukan.' });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`OneDrive local API: http://127.0.0.1:${port}`);
  console.log(`Root folder: ${rootDirectory}`);
});
