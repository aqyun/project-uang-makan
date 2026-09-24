import { ArrowLeft, ArrowRight, Calculator, FileSpreadsheet, FileText, LoaderCircle, Search, Upload, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';

const DAILY_RATE = 35150;
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
const INDONESIAN_MONTHS = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

type Attendance = { date: string; status: string; note: string };
type AttendanceData = { records: Attendance[]; employeeName?: string; employeeNip?: string };
type SupportingEvent = { start: string; end: string; kind: 'cuti' | 'sakit' | 'dinas'; source: string; detail: string; description: string; employeeName?: string; employeeNip?: string };
type ResultRow = Attendance & { finalStatus: string; reason: string; amount: number };
type Employee = { name: string; nip: string };
type EmployeeUpload = Employee & { uploaded: boolean; total: number; paidDays: number; rows: ResultRow[] };

const EMPLOYEES: Employee[] = [
  ['Yenita Sari, S.H., M.H.', '197905172002122000'],
  ['Rendhi Mirad, S.Sos., M.S.E.', '198205212006041002'],
  ['Arif Fajar Alfalaqy, S.Sos., M.Sc.', '198305152008011009'],
  ['Erwin Alimudin, S.Ds.', '199305222019031006'],
  ['Ristyan Mega Putra, S.Sos, M.Si.', '198310142010121001'],
  ['Ahmad Jayadi, S.Hum, M.T.', '198702182010121003'],
  ['Ishaq Abdullah, S.Ars.', '199505122020121002'],
  ['Gita Nawangsari Estika Putri, S.Kom.I.', '199401042023212032'],
  ['Annisa Zetta Afiatni, S.I.Kom.', '199401312023212027'],
  ['Nur Rahma Aziza, S.I.Kom.', '199901012023212005'],
  ['Bambang Ismanto, A.Md.', '199505252024211005'],
  ['Wahyu Ady Sulistyo, S.T.', '198407022025211043'],
  ['Refly Saprilaturyandi, S.Kom.', '198504232025211049'],
  ['Fitrah Faizal, S.T.', '198802242025211047'],
  ['Rudiyana Haris, S.E.', '198912202025211044'],
  ['Lisa Rahmawati Dewi Syam, S.H., M.H.', '199009162025212062'],
  ['Aisyah Putri Robbani, S.Ars', '199706262025062015'],
  ['Akhdiyat Dewa Galenica, S.I.Kom.', '200212262025061003'],
  ['Ameta Dian Fachirah Tarigan, S.I.Kom', '199906202025062017'],
  ['Aqyun Rista Maulidin, S.Tr.Kom.', '200205302025062010'],
  ['Ardilamita Febrimasya, S.K.Pm.', '200203122025062008'],
  ['Atini Rahmatika Fauzi Murod, S.K.Pm.', '199903172025062014'],
  ['Avifah Setiyani, S.I.Kom.', '199909222025062015'],
  ['Deshinta Firstiana Sari, S.I.Kom.', '198912152025062003'],
  ['Digna Margareth Rismauli, S.I.Kom.', '199310142025062008'],
  ['Dimas Novel Calvindoro Damarjati, S.I.Kom.', '199906182025061012'],
  ['Emanuel Van Fernando Sibarani, S.I.Kom', '199611092025061011'],
  ['Fatmawati, S.T.', '200002182025062015'],
  ['Gayatri Puspita Sari, S.I.Kom', '200001172025062013'],
  ['Indar Amila Azizah, S.I.Kom', '200006052025062023'],
  ['Kinanti Juli Astuti, S.I.Kom.', '200107292025062013'],
  ['Leonardo Abet Zebe, S.Ars', '200206092025061006'],
  ['Madya Puspa Faradina, B.A.', '199711182025062011'],
  ['Maharani Bilqist Caroline, S.T.', '200009262025062013'],
  ['Melly Nur Fatimah, S.T.', '199805282025062014'],
  ['Michael Prilas Simanjuntak, S.T.', '200204112025061006'],
  ['Muhammad Ihsan Yudanto, S.T.', '199802252025061010'],
  ['Muhammad Ilham Bintang, S.K.Pm', '200010192025061007'],
  ['Nabela Aristya Fajrin, S.Akt.', '200003022025062014'],
  ['Novia Dwi Purwanti, S.K.Pm.', '200111112025062016'],
  ['Raden Bintang Agna Fadhila, S.I.Kom.', '200111022025061007'],
  ['Ratu Budhi Sejati, S.I.Kom.', '199610232025062013'],
  ['Ridho Halasan Sinaga, S.I.Kom.', '200108122025061008'],
  ['Rifky Aji Rahmandita, S.I.Kom', '199902242025061006'],
  ['Risyanti Ananti Putri, S.IP', '199906192025062020'],
  ['Sahrul Hari Nugroho, S.T', '199906032025061009'],
  ['Shafa Kamila, S.I.Kom.', '200111162025062019'],
  ['Utari Liani Narulita, S.I.Kom.', '200104142025062021'],
  ['Vania Adita Siagian, S.T.', '199910242025062017'],
  ['Vera Siringo Ringo, S.Ikom.', '199602052025062013'],
  ['Widya Cantika Sisnawar, S.I.Kom.', '200101192025062013'],
  ['Yogi Andre Yonatan Pakpahan, S.P.W.K', '199511272025061006'],
  ['Yovita Rimbawati, S.I.Kom.', '199107312025062006'],
  ['Zahra Puspa Noviandini, S.Ars.', '199711012025062009'],
  ['Zhafira Alya Miftach, S.I.Kom', '199910012025062019'],
].map(([name, nip]) => ({ name, nip }));
type OneDriveFile = { name: string; relativePath: string; url: string };
type OneDriveEmployee = { name: string; files: OneDriveFile[] };
type OneDriveType = { name: string; employees: OneDriveEmployee[] };
type OneDriveMonth = { name: string; types: OneDriveType[] };
type OneDriveTree = { months: OneDriveMonth[] };

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
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

const MealAllowance = ({ initialFiles = [], selectedEmployee, savedResult, onProcessed }: { initialFiles?: File[]; selectedEmployee?: Employee; savedResult?: { total: number; paidDays: number; rows: ResultRow[] }; onProcessed?: (result: { total: number; paidDays: number; rows: ResultRow[] }) => void }) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [rows, setRows] = useState<ResultRow[]>(savedResult?.rows || []);
  const [documentCount, setDocumentCount] = useState(0);
  const [employeeName, setEmployeeName] = useState(selectedEmployee?.name || 'Pegawai terpilih');
  const [employeeNip, setEmployeeNip] = useState(selectedEmployee?.nip || '');
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(Boolean(savedResult));
  const [isProcessing, setIsProcessing] = useState(false);
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => { setFiles((current) => [...current, ...Array.from(event.target.files ?? [])]); setError(''); };
  const processFiles = async () => {
    const spreadsheet = files.find((file) => /\.(xlsx|xls|csv)$/i.test(file.name));
    if (!spreadsheet) { setError('Upload minimal satu file Excel presensi (.xlsx, .xls, atau .csv).'); return; }
    setError('');
    setIsProcessing(true);
    const startedAt = Date.now();
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
      const calculatedRows = calculate(attendance, events);
      setRows(calculatedRows); setDocumentCount(events.length); setProcessed(true);
      onProcessed?.({ total: calculatedRows.reduce((sum, row) => sum + row.amount, 0), paidDays: calculatedRows.filter((row) => row.amount > 0).length, rows: calculatedRows });
      setError(attendance.length ? '' : 'Excel terbaca, tetapi baris presensi dengan tanggal belum ditemukan. Pastikan sheet pertama memiliki kolom Tanggal.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'format file tidak dikenali';
      setError(`Excel belum dapat dibaca: ${message}`);
    } finally {
      await wait(Math.max(0, 3000 - (Date.now() - startedAt)));
      setIsProcessing(false);
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

  if (isProcessing) return <CardBox className="mx-auto flex max-w-xl items-center justify-center gap-3 py-16 text-center"><LoaderCircle className="animate-spin text-primary" size={24} /><div><p className="font-semibold text-ld">Memproses data...</p><p className="mt-1 text-sm text-muted-foreground">Membaca Excel dan mencocokkan dokumen.</p></div></CardBox>;

  if (processed) return <div className="space-y-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Perhitungan uang makan</p><h1 className="text-2xl font-bold text-ld">Hasil Perhitungan</h1></div><Button variant="outline" onClick={reset}><ArrowLeft /> Upload ulang</Button></div><CardBox className="items-center bg-slate-50 py-10 text-center dark:bg-slate-900/40"><p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">{employeeName}</p><p className="mt-2 text-sm text-muted-foreground">{employeeNip || 'NIP belum diisi'}</p><p className="mt-6 text-sm font-semibold text-primary">TOTAL UANG MAKAN</p><p className="mt-1 text-5xl font-bold text-ld">{formatCurrency(total)}</p><p className="mt-3 text-sm text-muted-foreground">{rows.filter((row) => row.amount > 0).length} hari dibayarkan × {formatCurrency(DAILY_RATE)}</p></CardBox><CardBox><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-ld">Rincian per tanggal</h2><p className="text-sm text-muted-foreground">{documentCount} dokumen pendukung dicocokkan</p></div><Button variant="ghostprimary" onClick={() => setProcessed(false)}><ArrowRight /> Kembali ke data</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="px-3 py-3">Tanggal</th><th className="px-3 py-3">Presensi</th><th className="px-3 py-3">Status akhir</th><th className="px-3 py-3">Keterangan</th><th className="px-3 py-3 text-right">Nilai</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date} className="border-b last:border-0"><td className="px-3 py-3 font-medium text-ld">{row.date}</td><td className="px-3 py-3">{row.status}</td><td className="px-3 py-3"><span className={row.amount ? 'font-semibold text-success' : 'text-muted-foreground'}>{row.finalStatus}</span></td><td className="px-3 py-3 text-muted-foreground">{row.reason}</td><td className="px-3 py-3 text-right font-semibold text-ld">{formatCurrency(row.amount)}</td></tr>)}</tbody></table></div></CardBox></div>;

  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-medium text-primary">Satu pegawai</p><h1 className="mt-1 text-3xl font-bold text-ld">Hitung Uang Makan</h1><p className="mt-2 max-w-2xl text-muted-foreground">Upload presensi dan dokumen pendukung. Sistem akan membaca tanggal, mencocokkan data, lalu menghitung nilai akhir.</p></div><CardBox><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-ld">Nama pegawai<input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3 outline-none focus:border-primary" placeholder="Nama pegawai" /></label><label className="text-sm font-medium text-ld">NIP <input value={employeeNip} onChange={(event) => setEmployeeNip(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3 outline-none focus:border-primary" placeholder="NIP pegawai" /></label></div></CardBox><CardBox className="border-2 border-dashed"><label className="flex cursor-pointer flex-col items-center justify-center py-12 text-center"><div className="rounded-full bg-lightprimary p-4 text-primary"><Upload size={28} /></div><h2 className="mt-4 text-lg font-semibold text-ld">Upload dokumen</h2><p className="mt-1 text-sm text-muted-foreground">Excel presensi wajib, lalu tambahkan surat cuti, sakit, atau tugas</p><span className="mt-5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white">Pilih banyak file</span><input type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" /></label></CardBox>{files.length > 0 && <CardBox><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-ld">Dokumen dipilih ({files.length})</h2><button type="button" className="text-sm text-error" onClick={() => setFiles([])}>Hapus semua</button></div><div className="space-y-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-muted px-3 py-2"><div className="flex min-w-0 items-center gap-3"><span className="text-primary">{file.name.match(/\.(xlsx|xls|csv)$/i) ? <FileSpreadsheet size={18} /> : <FileText size={18} />}</span><span className="truncate text-sm text-ld">{file.name}</span></div><button type="button" className="text-muted-foreground hover:text-error" onClick={() => setFiles(files.filter((_, fileIndex) => fileIndex !== index))}><X size={17} /></button></div>)}</div></CardBox>}{error && <p className="rounded-md bg-lighterror px-4 py-3 text-sm text-error">{error}</p>}<Button type="button" size="lg" className="w-full" onClick={handleProcessClick}><Calculator /> Proses Perhitungan</Button><p className="text-center text-xs text-muted-foreground">Tarif aktif: {formatCurrency(DAILY_RATE)} per hari</p></div>;
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

const PeriodPicker = ({ month, year, onMonthChange, onYearChange }: { month: string; year: string; onMonthChange: (value: string) => void; onYearChange: (value: string) => void }) => <CardBox><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-ld">Bulan<select value={month} onChange={(event) => onMonthChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih bulan</option>{INDONESIAN_MONTHS.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label><label className="text-sm font-medium text-ld">Tahun<select value={year} onChange={(event) => onYearChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih tahun</option>{['2026', '2025', '2024'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div></CardBox>;

const PeriodPickerWithApply = ({ month, year, onMonthChange, onYearChange, onApply }: { month: string; year: string; onMonthChange: (value: string) => void; onYearChange: (value: string) => void; onApply: () => void }) => <CardBox><div className="grid items-end gap-4 md:grid-cols-3"><label className="text-sm font-medium text-ld">Bulan<select value={month} onChange={(event) => onMonthChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih bulan</option>{INDONESIAN_MONTHS.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label><label className="text-sm font-medium text-ld">Tahun<select value={year} onChange={(event) => onYearChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih tahun</option>{['2026', '2025', '2024'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><Button type="button" className="h-11" onClick={onApply} disabled={!month}>Filter Periode</Button></div></CardBox>;

const EmployeeSearchPanel = ({ employees, uploadedCount, onSelect }: { employees: EmployeeUpload[]; uploadedCount: number; onSelect: (nip: string) => void }) => {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const results = employees.filter((employee) => `${employee.name} ${employee.nip}`.toLowerCase().includes(activeQuery.toLowerCase()));
  return <div className="space-y-6"><CardBox><div className="mb-5"><p className="text-sm font-medium text-primary">Master pegawai</p><h1 className="mt-1 text-2xl font-bold text-ld">Data Uang Makan</h1><p className="mt-1 text-sm text-muted-foreground">{uploadedCount} dari {employees.length} pegawai sudah upload</p></div><form onSubmit={(event) => { event.preventDefault(); setActiveQuery(query.trim()); }}><label className="text-sm font-medium text-ld">Cari nama atau NIP pegawai<div className="mt-2 flex gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-md border border-ld bg-white px-3 outline-none focus:border-primary dark:bg-slate-900" placeholder="Ketik nama atau NIP..." /><Button type="submit"><Search size={17} /> Cari</Button></div></label></form></CardBox><CardBox><div className="mb-4"><h2 className="text-lg font-semibold text-ld">Daftar Nama Pegawai Biro Komunikasi Publik</h2><p className="mt-1 text-sm text-muted-foreground">Klik nama pegawai untuk membuka data uang makan.</p></div><div className="max-h-[28rem] overflow-y-auto rounded-md border border-ld bg-white dark:bg-slate-900"><div className="divide-y">{results.map((employee) => <button type="button" key={employee.nip} onClick={() => onSelect(employee.nip)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-lightprimary"><span><span className="block font-medium text-ld">{employee.name}</span><span className="text-sm text-muted-foreground">{employee.nip}</span></span><span className={employee.uploaded ? 'text-sm font-semibold text-success' : 'text-sm text-muted-foreground'}>{employee.uploaded ? 'Sudah upload' : 'Belum upload'}</span></button>)}</div>{results.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nama pegawai tidak ditemukan.</p>}</div></CardBox></div>;
};

const EmployeeSearchPanelWithPeriod = ({ employees, uploadedCount, onSelect, month, year, onMonthChange, onYearChange }: { employees: EmployeeUpload[]; uploadedCount: number; onSelect: (nip: string) => void; month: string; year: string; onMonthChange: (value: string) => void; onYearChange: (value: string) => void }) => {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const results = employees.filter((employee) => `${employee.name} ${employee.nip}`.toLowerCase().includes(activeQuery.toLowerCase()));
  return <div className="space-y-6"><CardBox><div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium text-ld">Bulan<select value={month} onChange={(event) => onMonthChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih bulan</option>{INDONESIAN_MONTHS.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label><label className="text-sm font-medium text-ld">Tahun<select value={year} onChange={(event) => onYearChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih tahun</option>{['2026', '2025', '2024'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><form onSubmit={(event) => { event.preventDefault(); setActiveQuery(query.trim()); }}><label className="text-sm font-medium text-ld">Cari nama atau NIP pegawai<div className="mt-2 flex gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-md border border-ld bg-white px-3 dark:bg-slate-900" placeholder="Ketik nama atau NIP..." /><Button type="submit"><Search size={17} /> Cari</Button></div></label></form></div><p className="mt-3 text-sm text-muted-foreground">{uploadedCount} dari {employees.length} pegawai sudah upload · Cari berdasarkan nama atau NIP.</p></CardBox><CardBox><div className="mb-4"><h2 className="text-lg font-semibold text-ld">Daftar Nama Pegawai Biro Komunikasi Publik</h2><p className="mt-1 text-sm text-muted-foreground">Klik nama pegawai untuk membuka data uang makan.</p></div><div className="max-h-[28rem] overflow-y-auto rounded-md border border-ld bg-white dark:bg-slate-900"><div className="divide-y">{results.map((employee) => <button type="button" key={employee.nip} onClick={() => onSelect(employee.nip)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-lightprimary"><span><span className="block font-medium text-ld">{employee.name}</span><span className="text-sm text-muted-foreground">{employee.nip}</span></span><span className={employee.uploaded ? 'text-sm font-semibold text-success' : 'text-sm text-muted-foreground'}>{employee.uploaded ? 'Sudah upload' : 'Belum upload'}</span></button>)}</div>{results.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nama pegawai tidak ditemukan.</p>}</div></CardBox></div>;
};

const EmployeeSearchPanelWithFilter = ({ employees, uploadedCount, onSelect, month, year, onMonthChange, onYearChange, onApply }: { employees: EmployeeUpload[]; uploadedCount: number; onSelect: (nip: string) => void; month: string; year: string; onMonthChange: (value: string) => void; onYearChange: (value: string) => void; onApply: () => void }) => {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const results = employees.filter((employee) => `${employee.name} ${employee.nip}`.toLowerCase().includes(activeQuery.toLowerCase()));
  return <div className="space-y-6"><CardBox><div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium text-ld">Bulan<select value={month} onChange={(event) => onMonthChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih bulan</option>{INDONESIAN_MONTHS.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label><label className="text-sm font-medium text-ld">Tahun<select value={year} onChange={(event) => onYearChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 dark:bg-slate-900"><option value="">Pilih tahun</option>{['2026', '2025', '2024'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><form onSubmit={(event) => { event.preventDefault(); onApply(); setActiveQuery(query.trim()); }}><label className="text-sm font-medium text-ld">Cari nama atau NIP pegawai<div className="mt-2 flex gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-md border border-ld bg-white px-3 dark:bg-slate-900" placeholder="Ketik nama atau NIP..." /><Button type="submit"><Search size={17} /> Cari</Button></div></label></form></div><p className="mt-3 text-sm text-muted-foreground">{uploadedCount} dari {employees.length} pegawai sudah upload.</p></CardBox><CardBox><div className="mb-4"><h2 className="text-lg font-semibold text-ld">Daftar Nama Pegawai Biro Komunikasi Publik</h2><p className="mt-1 text-sm text-muted-foreground">Klik nama pegawai untuk membuka data uang makan.</p></div><div className="max-h-[28rem] overflow-y-auto rounded-md border border-ld bg-white dark:bg-slate-900"><div className="divide-y">{results.map((employee) => <button type="button" key={employee.nip} onClick={() => onSelect(employee.nip)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-lightprimary"><span><span className="block font-medium text-ld">{employee.name}</span><span className="text-sm text-muted-foreground">{employee.nip}</span></span><span className={employee.uploaded ? 'text-sm font-semibold text-success' : 'text-sm text-muted-foreground'}>{employee.uploaded ? 'Sudah upload' : 'Belum upload'}</span></button>)}</div>{results.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nama pegawai tidak ditemukan.</p>}</div></CardBox></div>;
};

const EmployeeRegistry = () => {
  const [selectedNip, setSelectedNip] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [appliedMonth, setAppliedMonth] = useState('');
  const [appliedYear, setAppliedYear] = useState('2026');
  const [filterVersion, setFilterVersion] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [employees, setEmployees] = useState<EmployeeUpload[]>(() => EMPLOYEES.map((employee) => ({ ...employee, uploaded: false, total: 0, paidDays: 0, rows: [] })));
  const selectedEmployee = employees.find((employee) => employee.nip === selectedNip);
  const uploadedCount = employees.filter((employee) => employee.uploaded).length;
  const [searchTerm, setSearchTerm] = useState('');
  const filteredEmployees = employees.filter((employee) => `${employee.name} ${employee.nip}`.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    if (!appliedMonth) {
      setEmployees(EMPLOYEES.map((employee) => ({ ...employee, uploaded: false, total: 0, paidDays: 0, rows: [] })));
      setIsFiltering(false);
      return;
    }
    Promise.all([fetch(`/api/meal-allowance/uploads?month=${encodeURIComponent(appliedMonth)}&year=${appliedYear}`), wait(3000)]).then(([response]) => response.json() as Promise<Array<{ nip: string; total: number; paidDays: number; rows: ResultRow[] }>>)
      .then((uploads) => {
        const byNip = new Map(uploads.map((upload) => [upload.nip, upload]));
        setEmployees(EMPLOYEES.map((employee) => ({ ...employee, uploaded: byNip.has(employee.nip), total: byNip.get(employee.nip)?.total || 0, paidDays: byNip.get(employee.nip)?.paidDays || 0, rows: byNip.get(employee.nip)?.rows || [] })));
      })
        .catch(() => setEmployees(EMPLOYEES.map((employee) => ({ ...employee, uploaded: false, total: 0, paidDays: 0, rows: [] }))))
        .finally(() => setIsFiltering(false));
      }, [appliedMonth, appliedYear, filterVersion]);

  const saveResult = (result: { total: number; paidDays: number; rows: ResultRow[] }) => {
    if (!selectedEmployee) return;
    if (!appliedMonth) return;
    void fetch('/api/meal-allowance/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nip: selectedEmployee.nip, month: appliedMonth, year: appliedYear, total: result.total, paidDays: result.paidDays, rows: result.rows }) }).then(() => fetch(`/api/meal-allowance/uploads?month=${encodeURIComponent(appliedMonth)}&year=${appliedYear}`)).then((response) => response.json()).then((uploads: Array<{ nip: string; total: number; paidDays: number; rows: ResultRow[] }>) => {
      const byNip = new Map(uploads.map((upload) => [upload.nip, upload]));
      setEmployees(EMPLOYEES.map((employee) => ({ ...employee, uploaded: byNip.has(employee.nip), total: byNip.get(employee.nip)?.total || 0, paidDays: byNip.get(employee.nip)?.paidDays || 0, rows: byNip.get(employee.nip)?.rows || [] })));
    });
  };

  const applyPeriod = () => { if (!selectedMonth) return; setIsFiltering(true); setAppliedMonth(selectedMonth); setAppliedYear(selectedYear); setFilterVersion((version) => version + 1); };

  if (isFiltering) return <CardBox className="mx-auto flex max-w-xl items-center justify-center gap-3 py-16 text-center"><LoaderCircle className="animate-spin text-primary" size={24} /><div><p className="font-semibold text-ld">Memuat periode...</p><p className="mt-1 text-sm text-muted-foreground">Mengecek hasil perhitungan di database.</p></div></CardBox>;

  if (selectedEmployee) return <div className="space-y-5"><Button type="button" variant="outline" onClick={() => setSelectedNip('')}><ArrowLeft /> Kembali ke daftar pegawai</Button><PeriodPickerWithApply month={selectedMonth} year={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} onApply={applyPeriod} /><MealAllowance key={`${selectedEmployee.nip}-${appliedMonth}-${appliedYear}`} selectedEmployee={selectedEmployee} savedResult={selectedEmployee.uploaded && appliedMonth ? { total: selectedEmployee.total, paidDays: selectedEmployee.paidDays, rows: selectedEmployee.rows } : undefined} onProcessed={saveResult} /></div>;

  if (!selectedEmployee) return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Master pegawai</p><h1 className="mt-1 text-3xl font-bold text-ld">Data Uang Makan</h1><p className="mt-1 text-sm text-muted-foreground">{uploadedCount} dari {employees.length} pegawai sudah upload</p></div><EmployeeSearchPanelWithFilter employees={employees} uploadedCount={uploadedCount} onSelect={(nip) => { if (appliedMonth) setSelectedNip(nip); }} month={selectedMonth} year={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} onApply={applyPeriod} /></div>;

  return <div className="space-y-6"><CardBox><div className="mb-5"><p className="text-sm font-medium text-primary">Master pegawai</p><h1 className="mt-1 text-2xl font-bold text-ld">Data Uang Makan</h1><p className="mt-1 text-sm text-muted-foreground">{uploadedCount} dari {employees.length} pegawai sudah upload</p></div><label className="text-sm font-medium text-ld">Cari nama atau NIP pegawai<input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-white px-3 outline-none focus:border-primary dark:bg-slate-900" placeholder="Ketik nama atau NIP..." /></label><div className="mt-4 max-h-[28rem] overflow-y-auto rounded-md border border-ld bg-white dark:bg-slate-900"><div className="divide-y">{filteredEmployees.map((employee) => <button type="button" key={employee.nip} onClick={() => setSelectedNip(employee.nip)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-lightprimary"><span><span className="block font-medium text-ld">{employee.name}</span><span className="text-sm text-muted-foreground">{employee.nip}</span></span><span className={employee.uploaded ? 'text-sm font-semibold text-success' : 'text-sm text-muted-foreground'}>{employee.uploaded ? 'Sudah upload' : 'Belum upload'}</span></button>)}</div>{filteredEmployees.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nama pegawai tidak ditemukan.</p>}</div></CardBox></div>;

  // @ts-ignore
  if (selectedEmployee) return <div className="space-y-5"><PeriodPicker month={selectedMonth} year={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} /><Button type="button" variant="outline" onClick={() => setSelectedNip('')}><ArrowLeft /> Kembali ke daftar pegawai</Button><MealAllowance key={`${selectedEmployee.nip}-${selectedMonth}-${selectedYear}`} selectedEmployee={selectedEmployee} onProcessed={saveResult} /></div>;

  if (!selectedEmployee) return <div className="space-y-6"><PeriodPicker month={selectedMonth} year={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} /><EmployeeSearchPanel employees={employees} uploadedCount={uploadedCount} onSelect={setSelectedNip} /></div>;

  // @ts-ignore
  return <div className="space-y-6"><CardBox><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Master pegawai</p><h1 className="mt-1 text-2xl font-bold text-ld">Data Uang Makan</h1><p className="mt-1 text-sm text-muted-foreground">{uploadedCount} dari {employees.length} pegawai sudah upload</p></div><label className="w-full text-sm font-medium text-ld md:max-w-xl">Pilih nama pegawai<select value={selectedNip} onChange={(event) => setSelectedNip(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-ld bg-transparent px-3"><option value="">Pilih nama pegawai</option>{employees.map((employee) => <option key={employee.nip} value={employee.nip}>{employee.name}</option>)}</select></label></div><div className="max-h-80 overflow-auto rounded-md border border-ld"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-body text-muted-foreground"><tr className="border-b"><th className="px-3 py-3">Nama</th><th className="px-3 py-3">NIP</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Total</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.nip} className="cursor-pointer border-b last:border-0 hover:bg-lightprimary" onClick={() => setSelectedNip(employee.nip)}><td className="px-3 py-2 font-medium text-ld">{employee.name}</td><td className="px-3 py-2 text-muted-foreground">{employee.nip}</td><td className="px-3 py-2"><span className={employee.uploaded ? 'font-semibold text-success' : 'text-muted-foreground'}>{employee.uploaded ? 'Sudah upload' : 'Belum upload'}</span></td><td className="px-3 py-2 text-right">{employee.uploaded ? formatCurrency(employee.total) : '-'}</td></tr>)}</tbody></table></div></CardBox>{selectedEmployee && <MealAllowance key={selectedEmployee.nip} selectedEmployee={selectedEmployee} onProcessed={saveResult} />}</div>;
};

void OneDriveMealAllowance;
void EmployeeSearchPanelWithPeriod;
export default EmployeeRegistry;