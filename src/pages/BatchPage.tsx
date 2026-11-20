import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { predictBatch } from '../services/api';
import type { BatchPredictResponse, SpinopelvicFeatures } from '../types/spine';

const FEATURE_COLUMNS: Array<{ key: keyof SpinopelvicFeatures; label: string }> = [
  { key: 'pelvic_incidence', label: 'Pelvic incidence' },
  { key: 'pelvic_tilt', label: 'Pelvic tilt' },
  { key: 'lumbar_lordosis_angle', label: 'Lumbar lordosis' },
  { key: 'sacral_slope', label: 'Sacral slope' },
  { key: 'pelvic_radius', label: 'Pelvic radius' },
  { key: 'degree_spondylolisthesis', label: 'Spondylolisthesis' },
];

function escapeCsv(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—';
}

export default function BatchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [response, setResponse] = useState<BatchPredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const classes = useMemo(
    () => (response ? Object.keys(response.summary).sort() : []),
    [response],
  );

  const filteredRows = useMemo(() => {
    if (!response) return [];
    const query = search.trim().toLowerCase();
    return response.results.filter((row) => {
      if (classFilter !== 'all' && row.prediction !== classFilter) return false;
      if (!query) return true;
      return [
        row.row_index,
        row.prediction,
        row.confidence,
        ...FEATURE_COLUMNS.map(({ key }) => row[key]),
      ].some((value) => String(value).toLowerCase().includes(query));
    });
  }, [response, search, classFilter]);

  async function processFile(file: File) {
    requestRef.current += 1;
    setLoading(false);
    setSelectedFile(file);
    setResponse(null);
    setError(null);
    setSearch('');
    setClassFilter('all');

    if (!/\.csv$/i.test(file.name)) {
      setError('Invalid file format. Select a file with a .csv extension.');
      return;
    }
    if (file.size === 0) {
      setError('The selected CSV file is empty.');
      return;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const result = await predictBatch(file);
      if (requestRef.current !== requestId) return;
      setResponse(result);
    } catch (caught) {
      if (requestRef.current !== requestId) return;
      setError(caught instanceof Error ? caught.message : 'The batch request failed unexpectedly.');
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }

  function clearSelection() {
    requestRef.current += 1;
    setSelectedFile(null);
    setResponse(null);
    setError(null);
    setLoading(false);
    setSearch('');
    setClassFilter('all');
    if (inputRef.current) inputRef.current.value = '';
  }

  function exportCsv() {
    if (!filteredRows.length) return;
    const headers = [
      'row_index',
      'pelvic_incidence',
      'pelvic_tilt',
      'lumbar_lordosis_angle',
      'sacral_slope',
      'pelvic_radius',
      'degree_spondylolisthesis',
      'prediction',
      'confidence',
    ];
    const lines = [
      headers.map(escapeCsv).join(','),
      ...filteredRows.map((row) =>
        [
          row.row_index,
          row.pelvic_incidence,
          row.pelvic_tilt,
          row.lumbar_lordosis_angle,
          row.sacral_slope,
          row.pelvic_radius,
          row.degree_spondylolisthesis,
          row.prediction,
          row.confidence,
        ].map(escapeCsv).join(','),
      ),
    ];
    const blob = new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'batch-predictions-filtered.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]" data-eyebrow>Clinical dataset</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#00183A]">Batch CSV Analysis</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
          Upload a CSV containing the six spinopelvic features for batch prediction.
        </p>
      </header>

      <section
        className={`rounded-md border border-dashed p-5 transition-colors ${
          dragActive
            ? 'border-[#00183A] bg-[#F2F2F2]'
            : 'border-[#CBD5E1] bg-white hover:border-[#64748B]'
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
          const file = event.dataTransfer.files[0];
          if (file) void processFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void processFile(file);
            event.target.value = '';
          }}
        />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[#E2E8F0] bg-[#F2F2F2] text-[#00183A]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#00183A]">
                {selectedFile ? selectedFile.name : 'Drop a CSV file here'}
              </p>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Required: 6 feature columns · .csv only'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {selectedFile && (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-[#CBD5E1] px-3 text-sm text-[#00183A] hover:bg-[#F2F2F2]"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-[#F59659] px-3.5 text-sm font-semibold text-[#00183A] hover:bg-[#E28346] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {loading ? 'Analyzing…' : 'Choose CSV'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#475569]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]" />
          <div>
            <p className="font-semibold">Batch analysis failed</p>
            <p className="mt-0.5 text-[#64748B]">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-4 py-5 text-sm text-[#475569]">
          <Loader2 className="h-5 w-5 animate-spin text-[#00183A]" />
          Processing CSV and generating predictions…
        </div>
      )}

      {response && (
        <>
          <section className="grid grid-cols-2 divide-x divide-y divide-[#E2E8F0] overflow-hidden rounded-md border border-[#E2E8F0] bg-white lg:grid-cols-4 lg:divide-y-0" aria-label="Batch summary">
            <div className="px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]">Total rows</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#00183A]">{response.total_rows}</p>
            </div>
            {Object.entries(response.summary).sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => (
              <div key={label} className="px-4 py-4">
                <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]" title={label}>{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[#00183A]">{count}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-md border border-[#E2E8F0] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#E2E8F0] bg-[#F2F2F2] p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <span className="sr-only">Search predictions</span>
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search rows"
                    className="h-9 w-full rounded-sm border border-[#CBD5E1] bg-white pl-9 pr-3 text-sm text-[#00183A] placeholder:text-[#64748B] focus:border-[#00183A] focus:outline-none focus:ring-1 focus:ring-[#00183A] sm:w-56"
                  />
                </label>
                <label>
                  <span className="sr-only">Filter by prediction class</span>
                  <select
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    className="h-9 w-full rounded-sm border border-[#CBD5E1] bg-white px-3 text-sm text-[#00183A] focus:border-[#00183A] focus:outline-none focus:ring-1 focus:ring-[#00183A] sm:w-44"
                  >
                    <option value="all">All classes</option>
                    {classes.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs tabular-nums text-[#64748B]">
                  {filteredRows.length} of {response.results.length} rows
                </span>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filteredRows.length === 0}
                  className="inline-flex h-9 items-center gap-2 rounded-sm bg-[#F59659] px-3 text-sm font-semibold text-[#00183A] hover:bg-[#E28346] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {response.results.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-medium text-[#00183A]">No prediction rows returned</p>
                <p className="mt-1 text-sm text-[#64748B]">The uploaded CSV produced a zero-row response.</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-medium text-[#00183A]">No rows match this filter</p>
                <p className="mt-1 text-sm text-[#64748B]">Try another search or prediction class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F2F2F2] text-[11px] uppercase tracking-[0.08em] text-[#64748B]">
                      <th className="px-4 py-3 font-semibold">Row</th>
                      {FEATURE_COLUMNS.map(({ key, label }) => (
                        <th key={key} className="px-3 py-3 font-semibold">{label}</th>
                      ))}
                      <th className="px-4 py-3 font-semibold">Prediction</th>
                      <th className="px-4 py-3 font-semibold">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.row_index} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F2F2F2]/70">
                        <td className="px-4 py-3 tabular-nums text-[#64748B]">{row.row_index}</td>
                        {FEATURE_COLUMNS.map(({ key }) => (
                          <td key={key} className="px-3 py-3 tabular-nums text-[#475569]">
                            {formatNumber(row[key])}
                          </td>
                        ))}
                        <td className="px-4 py-3 font-medium text-[#00183A]">{row.prediction}</td>
                        <td className="px-4 py-3 tabular-nums text-[#00183A]">
                          {formatNumber(row.confidence * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
