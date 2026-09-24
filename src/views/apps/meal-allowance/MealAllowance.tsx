import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ArrowLeft, ArrowRight, Calculator, FileSpreadsheet, FileText, Upload, X } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import CardBox from 'src/components/shared/CardBox';

const DAILY_RATE = 35150;
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
const INDONESIAN_MONTHS = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

type Attendance = { date: string; status: string; note: string };
type AttendanceData = { records: Attendance[]; employeeName?: string; employeeNip?: string };
type SupportingEvent = { start: string; end: string; kind: 'cuti' | 'sakit' | 'dinas'; source: string; detail: string; description: string; employeeName?: string; employeeNip?: string };
type ResultRow = Attendance & { finalStatus: string; reason: string; amount: number };
type OneDriveFile = { name: string; relativePath: string; url: string };
type OneDriveEmployee = { name: string; files: OneDriveFile[] };
type OneDriveType = { name: string; employees: OneDriveEmployee[] };
type OneDriveMonth = { name: string; types: OneDriveType[] };
type OneDriveTree = { months: OneDriveMonth[] };

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const formatDocumentReference = (source: string) => source.match(/\b\d{1,4}-st-[a-z]{2}\.\d{2}-\d{4}\b/i)?.[0].toUpperCase() ?? source;
const extractEmployeeIdentity = (text: string) => {
  const compactText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  const name = compactText.match(/kepada\s*[:\-]?\s*([a-z][a-z .'-]{2,60}?)(?=,|\/|\s+gol|\s+nip)/i)?.[1]?.trim().replace(/\s+/g, ' ');
  const nip = compactText.match(/nip\s*[:.\/-]?\s*(\d{8,20})/i)?.[1];
  return { name, nip };
};

const toIsoDate = (value: unknown): string | null => {
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  const direct = raw.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (direct) return `${direct[1]}-${direct[2].padStart(2, '0')}-${direct[3].padStart(2, '0')}`;
  const local = raw.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (local) {
    const month = INDONESIAN_MONTHS.indexOf(local[2]);
    if (month >= 0) return `${local[3]}-${String(month + 1).padStart(2, '0')}-${local[1].padStart(2, '0')}`;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const parseAttendance = async (file: File): Promise<AttendanceData> => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' });
  const headerIndex = rows.findIndex((row) => row.some((cell) => normalize(cell) === 'tanggal'));
  const header = rows[headerIndex >= 0 ? headerIndex : 0] ?? [];
  const dateIndex = header.findIndex((cell) => normalize(cell) === 'tanggal');
  const noteIndex = header.findIndex((cell) => normalize(cell).includes('keterangan'));
  const records: Attendance[] = [];
  rows.slice(headerIndex + 1).forEach((row) => {
    const date = toIsoDate(row[dateIndex]);
    if (!date) return;
    const note = String(row[noteIndex >= 0 ? noteIndex : row.length - 1] ?? '').trim();
    const status = /dinas/i.test(note) ? 'Dinas' : /wfa/i.test(note) ? 'WFA' : /wfo/i.test(note) ? 'WFO' : /cuti/i.test(note) ? 'Cuti' : /sakit/i.test(note) ? 'Sakit' : /libur/i.test(note) ? 'Libur' : note || 'Tidak ada status';
    records.push({ date, status, note });
  });
  const identityCell = rows.slice(0, Math.max(headerIndex, 1)).flatMap((row) => row.map((cell) => String(cell ?? ''))).find((cell) => /-\s*\d{8,20}\b/.test(cell));
  const identityMatch = identityCell?.match(/^\s*(?:\d+\s*)?(.+?)\s+-\s*(\d{8,20})\b/);
  return { records, employeeName: identityMatch?.[1]?.trim(), employeeNip: identityMatch?.[2] };
};

const extractAssignmentDates = (content: string): string[] => {
  const dates: string[] = [];
  const normalizedContent = content.replace(/[\u00a0\r\n]+/g, ' ').replace(/\s+/g, ' ');
  const addRange = (start: string, end: string, month: string, year: string) => {
    const first = toIsoDate(`${start} ${month} ${year}`);
    const last = toIsoDate(`${end} ${month} ${year}`);
    if (first && last) dates.push(first, last);
  };
  const rangeWithSharedMonth = /(?:tanggal|tgl)\s+(\d{1,2})\s*(?:-|–|—|sampai|s\.?d\.?|hingga)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/gi;
  for (const match of normalizedContent.matchAll(rangeWithSharedMonth)) addRange(match[1], match[2], match[3], match[4]);
  const genericRangeWithSharedMonth = /(\d{1,2})\s*(?:-|–|—)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/gi;
  for (const match of normalizedContent.matchAll(genericRangeWithSharedMonth)) addRange(match[1], match[2], match[3], match[4]);
  const flexibleRangeWithSharedMonth = /(?:tanggal|tgl)[^\d]{0,24}(\d{1,2})\s*(?:-|–|—|sampai|s\.?d\.?|hingga)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/gi;
  for (const match of normalizedContent.matchAll(flexibleRangeWithSharedMonth)) addRange(match[1], match[2], match[3], match[4]);
  const rangeWithRepeatedDates = /(?:mulai\s+tanggal|tanggal)\s+(\d{1,2}\s+[a-z]+\s+\d{4})\s+(?:sampai|s\.?d\.?|hingga)\s+(?:tanggal\s+)?(\d{1,2}\s+[a-z]+\s+\d{4})/gi;
  for (const match of normalizedContent.matchAll(rangeWithRepeatedDates)) {
    const first = toIsoDate(match[1]);
    const last = toIsoDate(match[2]);
    if (first && last) dates.push(first, last);
  }
  return dates;
};

const readPdfText = async (file: File): Promise<string> => {
  const document = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  const text = pages.join('\n');
  if (text.replace(/\s/g, '').length > 40 && extractAssignmentDates(text.toLowerCase()).length > 0) return text;

  const worker = await createWorker('ind');
  const scannedPages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = window.document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) continue;
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      scannedPages.push(result.data.text);
    }
  } finally {
    await worker.terminate();
  }
  return scannedPages.join('\n');
};

const parseSupportingDocument = async (file: File): Promise<SupportingEvent | null> => {
  const filename = file.name.toLowerCase();
  let text = /\.(txt|md|json|csv)$/i.test(filename) ? await file.text() : '';
  if (/\.pdf$/i.test(filename)) text = await readPdfText(file);
  if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    const worker = await createWorker('ind');
    const result = await worker.recognize(file);
    text = result.data.text;
    await worker.terminate();
  }
  const content = `${filename} ${text}`.toLowerCase();
  const isLeaveForm = /jenis\s+cuti|cuti\s+tahunan|mulai\s+tanggal/.test(content);
  const kind = isLeaveForm && /cuti/.test(content) ? 'cuti' : /sakit/.test(content) ? 'sakit' : /cuti/.test(content) ? 'cuti' : /tugas|dinas/.test(content) ? 'dinas' : null;
  if (!kind) return null;
  const filenameDateSource = filename.replace(/[_]+/g, ' ');
  const filenameRange = filenameDateSource.match(/(\d{1,2})\s*(?:-|–|sampai|s\.?d\.?|hingga)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  const filenameDateList = filenameDateSource.match(/(\d{1,2}(?:\s*,\s*\d{1,2})+)\s+([a-z]+)\s+(\d{4})/i);
  const filenameSingleDate = filenameDateSource.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  const filenameDates = filenameRange
    ? [toIsoDate(`${filenameRange[1]} ${filenameRange[3]} ${filenameRange[4]}`), toIsoDate(`${filenameRange[2]} ${filenameRange[3]} ${filenameRange[4]}`)]
    : filenameDateList ? filenameDateList[1].split(/\s*,\s*/).map((day) => toIsoDate(`${day} ${filenameDateList[2]} ${filenameDateList[3]}`))
    : filenameSingleDate ? [toIsoDate(`${filenameSingleDate[1]} ${filenameSingleDate[2]} ${filenameSingleDate[3]}`)] : [];
  const explicitDates = extractAssignmentDates(content);
  const dates = [...content.matchAll(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/g)].map((match) => toIsoDate(`${match[1]} ${match[2]} ${match[3]}`)).filter((date): date is string => Boolean(date));
  const isoDates = [...content.matchAll(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g)].map((match) => toIsoDate(match[0])).filter((date): date is string => Boolean(date));
  const allDates = [...new Set(filenameDates.some((date): date is string => Boolean(date)) ? filenameDates : explicitDates.length ? explicitDates : [...dates, ...isoDates])].filter((date): date is string => Boolean(date)).sort();
  if (!allDates.length) return null;
  const activityLocation = content.match(/(?:bertempat|berlokasi|dilaksanakan|pelaksanaan)\s+di\s+([a-z]+(?:\s+[a-z]+){0,3})/i)?.[1] ?? '';
  const outsideJakarta = /luar\s+(?:kota|jakarta)|luar\s+daerah|luar\s+wilayah/.test(content)
    || (activityLocation.length > 0 && !activityLocation.includes('jakarta'));
  const detail = kind === 'dinas'
    ? outsideJakarta ? 'Dinas Luar Kota' : content.includes('rapat') ? 'Dinas Dalam Kota Rapat' : 'Dinas Dalam Kota Biasa'
    : kind === 'cuti' ? 'Cuti' : 'Sakit';
  const activity = kind === 'dinas'
    ? (content.match(/(?:untuk|kegiatan|acara|dalam rangka)\s+([^.;\n]{3,100})/i)?.[1]?.trim() || detail)
    : detail;
  const identity = extractEmployeeIdentity(text);
  return { start: allDates[0], end: allDates[allDates.length - 1], kind, source: file.name, detail, description: activity, employeeName: identity.name, employeeNip: identity.nip };
};

const parseSupportingDocumentSafely = async (file: File): Promise<SupportingEvent | null> => {
  try {
    return await parseSupportingDocument(file);
  } catch {
    return null;
  }
};

const calculate = (attendance: Attendance[], events: SupportingEvent[]): ResultRow[] => {
  const fridayWfaByMonth = new Set<string>();
  return [...attendance].sort((a, b) => a.date.localeCompare(b.date)).map((record) => {
    const event = events.find((item) => record.date >= item.start && record.date <= item.end);
    const day = new Date(`${record.date}T00:00:00`).getDay();
    const month = record.date.slice(0, 7);
    if (day === 0 || day === 6) return { ...record, finalStatus: 'Weekend', reason: 'Sabtu/Minggu tidak dihitung', amount: 0 };
    if (/libur/i.test(record.note)) return { ...record, finalStatus: 'Libur', reason: 'Mengikuti status libur dari Excel', amount: 0 };
    if (event?.kind === 'cuti' || event?.kind === 'sakit') return { ...record, status: '-', finalStatus: event.detail, reason: `${event.description} dari ${formatDocumentReference(event.source)}`, amount: 0 };
    if (event?.kind === 'dinas') {
      const payable = event.detail === 'Dinas Dalam Kota Biasa';
      return { ...record, status: 'Dinas', finalStatus: event.detail, reason: formatDocumentReference(event.source), amount: payable ? DAILY_RATE : 0 };
    }
    if (record.status === 'WFA') {
      if (day !== 5) return { ...record, finalStatus: 'WFA', reason: 'WFA bukan hari Jumat', amount: 0 };
      if (fridayWfaByMonth.has(month)) return { ...record, finalStatus: 'WFA', reason: 'Kuota WFA Jumat bulan ini sudah digunakan', amount: 0 };
      fridayWfaByMonth.add(month);
      return { ...record, finalStatus: 'WFA Jumat', reason: 'WFA Jumat pertama pada bulan ini', amount: DAILY_RATE };
    }
    if (record.status === 'WFO') return { ...record, finalStatus: 'WFO', reason: 'Presensi WFO', amount: DAILY_RATE };
    return { ...record, finalStatus: record.note || record.status, reason: 'Tidak memenuhi aturan pembayaran', amount: 0 };
  });
};

const MealAllowance = ({ initialFiles = [] }: { initialFiles?: File[] }) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [employeeName, setEmployeeName] = useState('Pegawai terpilih');
  const [employeeNip, setEmployeeNip] = useState('');
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(false);
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => { setFiles((current) => [...current, ...Array.from(event.target.files ?? [])]); setError(''); };
  const processFiles = async () => {
    const spreadsheet = files.find((file) => /\.(xlsx|xls|csv)$/i.test(file.name));
    if (!spreadsheet) { setError('Upload minimal satu file Excel presensi (.xlsx, .xls, atau .csv).'); return; }
    setError('');
    try {
      const attendanceData = await parseAttendance(spreadsheet);
      const attendance = attendanceData.records;
      const supportingFiles = files.filter((file) => file !== spreadsheet);
      const parsedEvents = await Promise.all(supportingFiles.map(parseSupportingDocumentSafely));
      const events = parsedEvents.filter((event): event is SupportingEvent => Boolean(event));
      const documentIdentity = events.find((event) => event.employeeName || event.employeeNip);
      if (attendanceData.employeeName) setEmployeeName(attendanceData.employeeName);
      else if (documentIdentity?.employeeName) setEmployeeName(documentIdentity.employeeName);
      if (attendanceData.employeeNip) setEmployeeNip(attendanceData.employeeNip);
      else if (documentIdentity?.employeeNip) setEmployeeNip(documentIdentity.employeeNip);
      setRows(calculate(attendance, events)); setDocumentCount(events.length); setProcessed(true);
      setError(attendance.length ? '' : 'Excel terbaca, tetapi baris presensi dengan tanggal belum ditemukan. Pastikan sheet pertama memiliki kolom Tanggal.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'format file tidak dikenali';
      setError(`Excel belum dapat dibaca: ${message}`);
    }
  };
  const reset = () => { setFiles([]); setRows([]); setDocumentCount(0); setProcessed(false); setError(''); };
  const handleProcessClick = () => {
    if (files.length === 0) {
      setError('Upload minimal satu file Excel presensi (.xlsx, .xls, atau .csv).');
      return;
    }
    void processFiles();
  };

  if (processed) return <div className="space-y-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Perhitungan uang makan</p><h1 className="text-2xl font-bold text-ld">Hasil Perhitungan</h1></div><Button variant="outline" onClick={reset}><ArrowLeft /> Upload ulang</Button></div><CardBox className="items-center bg-slate-50 py-10 text-center dark:bg-slate-900/40"><p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">{employeeName}</p><p className="mt-2 text-sm text-muted-foreground">{employeeNip || 'NIP belum diisi'}</p><p className="mt-6 text-sm font-semibold text-primary">TOTAL UANG MAKAN</p><p className="mt-1 text-5xl font-bold text-ld">{formatCurrency(total)}</p><p className="mt-3 text-sm text-muted-foreground">{rows.filter((row) => row.amount > 0).length} hari dibayarkan × {formatCurrency(DAILY_RATE)}</p></CardBox><CardBox><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-ld">Rincian per tanggal</h2><p className="text-sm text-muted-foreground">{documentCount} dokumen pendukung dicocokkan</p></div><Button variant="ghostprimary" onClick={() => setProcessed(false)}><ArrowRight /> Kembali ke data</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="px-3 py-3">Tanggal</th><th className="px-3 py-3">Presensi</th><th className="px-3 py-3">Status akhir</th><th className="px-3 py-3">Keterangan</th><th className="px-3 py-3 text-right">Nilai</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date} className="border-b last:border-0"><td className="px-3 py-3 font-medium text-ld">{row.date}</td><td className="px-3 py-3">{row.status}</td><td className="px-3 py-3"><span className={row.amount ? 'font-semibold text-success' : 'text-muted-foreground'}>{row.finalStatus}</span></td><td className="px-3 py-3 text-muted-foreground">{row.reason}</td><td className="px-3 py-3 text-right font-semibold text-ld">{formatCurrency(row.amount)}</td></tr>)}</tbody></table></div></CardBox></div>;

  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-medium text-primary">Satu pegawai</p><h1 className="mt-1 text-3xl font-bold text-ld">Hitung Uang Makan</h1><p className="mt-2 max-w-2xl text-muted-foreground">Upload presensi dan dokumen pendukung. Sistem akan membaca tanggal, mencocokkan data, lalu menghitung nilai akhir.</p></div><CardBox><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-ld">Nama pegawai<input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3 outline-none focus:border-primary" placeholder="Nama pegawai" /></label><label className="text-sm font-medium text-ld">NIP (opsional)<input value={employeeNip} onChange={(event) => setEmployeeNip(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3 outline-none focus:border-primary" placeholder="NIP pegawai" /></label></div></CardBox><CardBox className="border-2 border-dashed"><label className="flex cursor-pointer flex-col items-center justify-center py-12 text-center"><div className="rounded-full bg-lightprimary p-4 text-primary"><Upload size={28} /></div><h2 className="mt-4 text-lg font-semibold text-ld">Upload dokumen</h2><p className="mt-1 text-sm text-muted-foreground">Excel presensi wajib, lalu tambahkan surat cuti, sakit, atau tugas</p><span className="mt-5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white">Pilih banyak file</span><input type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" /></label></CardBox>{files.length > 0 && <CardBox><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-ld">Dokumen dipilih ({files.length})</h2><button type="button" className="text-sm text-error" onClick={() => setFiles([])}>Hapus semua</button></div><div className="space-y-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-muted px-3 py-2"><div className="flex min-w-0 items-center gap-3"><span className="text-primary">{file.name.match(/\.(xlsx|xls|csv)$/i) ? <FileSpreadsheet size={18} /> : <FileText size={18} />}</span><span className="truncate text-sm text-ld">{file.name}</span></div><button type="button" className="text-muted-foreground hover:text-error" onClick={() => setFiles(files.filter((_, fileIndex) => fileIndex !== index))}><X size={17} /></button></div>)}</div></CardBox>}{error && <p className="rounded-md bg-lighterror px-4 py-3 text-sm text-error">{error}</p>}<Button type="button" size="lg" className="w-full" onClick={handleProcessClick}><Calculator /> Proses Perhitungan</Button><p className="text-center text-xs text-muted-foreground">Tarif aktif: {formatCurrency(DAILY_RATE)} per hari</p></div>;
};

const MealAllowanceUpload = MealAllowance;
const OneDriveMealAllowance = () => {
  const [tree, setTree] = useState<OneDriveTree>({ months: [] });
  const [monthName, setMonthName] = useState('');
  const [typeName, setTypeName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [loadedFiles, setLoadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const selectedMonth = tree.months.find((month) => month.name === monthName);
  const selectedType = selectedMonth?.types.find((type) => type.name === typeName);
  const selectedEmployee = selectedType?.employees.find((employee) => employee.name === employeeName);

  useEffect(() => {
    fetch('/api/onedrive/tree')
      .then(async (response) => {
        if (!response.ok) throw new Error('API OneDrive lokal belum berjalan.');
        return response.json() as Promise<OneDriveTree>;
      })
      .then((value) => setTree(value))
      .catch((cause: unknown) => setSourceError(cause instanceof Error ? cause.message : 'Folder OneDrive tidak dapat dibaca.'))
      .finally(() => setLoading(false));
  }, []);

  const loadEmployeeFiles = async () => {
    if (!selectedEmployee) return;
    setLoadingFiles(true);
    setSourceError('');
    try {
      const files = await Promise.all(selectedEmployee.files.map(async (file) => {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`File ${file.name} tidak dapat dibaca.`);
        const blob = await response.blob();
        return new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
      }));
      setLoadedFiles(files);
    } catch (cause) {
      setSourceError(cause instanceof Error ? cause.message : 'Dokumen pegawai tidak dapat dimuat.');
    } finally {
      setLoadingFiles(false);
    }
  };

  return <div className="space-y-4"><CardBox><div className="mb-4"><p className="text-sm font-medium text-primary">Sumber OneDrive lokal</p><h2 className="text-lg font-semibold text-ld">Pilih data pegawai</h2><p className="mt-1 text-sm text-muted-foreground">Bulan → jenis pegawai → nama pegawai</p></div><div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium text-ld">Bulan<select value={monthName} onChange={(event) => { setMonthName(event.target.value); setTypeName(''); setEmployeeName(''); setLoadedFiles([]); }} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3"><option value="">Pilih bulan</option>{tree.months.map((month) => <option key={month.name} value={month.name}>{month.name}</option>)}</select></label><label className="text-sm font-medium text-ld">Jenis pegawai<select value={typeName} onChange={(event) => { setTypeName(event.target.value); setEmployeeName(''); setLoadedFiles([]); }} disabled={!selectedMonth} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3"><option value="">Pilih jenis</option>{selectedMonth?.types.map((type) => <option key={type.name} value={type.name}>{type.name}</option>)}</select></label><label className="text-sm font-medium text-ld">Nama pegawai<select value={employeeName} onChange={(event) => { setEmployeeName(event.target.value); setLoadedFiles([]); }} disabled={!selectedType} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3"><option value="">Pilih nama</option>{selectedType?.employees.map((employee) => <option key={employee.name} value={employee.name}>{employee.name}</option>)}</select></label></div>{loading && <p className="mt-4 text-sm text-muted-foreground">Membaca folder OneDrive...</p>}{sourceError && <p className="mt-4 rounded-md bg-lighterror px-4 py-3 text-sm text-error">{sourceError}</p>}<div className="mt-5 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{selectedEmployee ? `${selectedEmployee.files.length} file ditemukan` : 'Pilih nama pegawai untuk melihat file'}</p><Button type="button" onClick={() => void loadEmployeeFiles()} disabled={!selectedEmployee || loadingFiles}>{loadingFiles ? 'Memuat file...' : 'Gunakan data pegawai'}</Button></div></CardBox>{loadedFiles.length > 0 && <MealAllowanceUpload key={`${monthName}-${typeName}-${employeeName}-${loadedFiles.length}`} initialFiles={loadedFiles} />}</div>;
};

void OneDriveMealAllowance;
export default MealAllowance;