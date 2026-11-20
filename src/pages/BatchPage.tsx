import { useMemo, useRef, useState } from 'react';
import {
  LuFileSpreadsheet,
  LuUpload,
  LuDownload,
  LuSearch,
  LuX,
  LuTriangleAlert,
  LuLoaderCircle,
} from 'react-icons/lu';
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
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-';
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
      setError('Invalid file format. Select a valid .csv file.');
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
      setError(caught instanceof Error ? caught.message : 'Batch analysis failed unexpectedly.');
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
    anchor.download = 'spine-batch-predictions.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[#1E293B]">
          Cohort Analysis
        </h1>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Batch processing of multi-subject CSV datasets for automated spinopelvic classification.
        </p>
      </div>

      <section
        className={`rounded-[8px] border border-dashed p-6 transition-colors ${
          dragActive
            ? 'border-[#0F5C7A] bg-[#F0F6F9]'
            : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
        }`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          if (file) void processFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            e.target.value = '';
          }}
        />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F5C7A]">
              <LuFileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1E293B]">
                {selectedFile ? selectedFile.name : 'Select or drag CSV file'}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Requires 6 spinopelvic feature columns'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedFile && (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
              >
                <LuX className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#0F5C7A] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0C4A62] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
            >
              {loading ? <LuLoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LuUpload className="h-3.5 w-3.5" />}
              {loading ? 'Evaluating...' : 'Choose File'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
          <LuTriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]" />
          <div>
            <p className="font-semibold text-[#991B1B]">Batch evaluation failed</p>
            <p className="mt-0.5 text-[#B91C1C]">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 rounded-[8px] border border-[#E2E8F0] bg-white p-5 text-xs text-[#64748B]">
          <LuLoaderCircle className="h-4 w-4 animate-spin text-[#0F5C7A]" />
          Processing vectorized CSV dataset...
        </div>
      )}

      {response && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Batch summary">
            <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Total Rows</p>
              <p className="mt-1 font-mono-numbers text-xl font-bold text-[#1E293B]">{response.total_rows}</p>
            </div>
            {Object.entries(response.summary).sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => (
              <div key={label} className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
                <p className="mt-1 font-mono-numbers text-xl font-bold text-[#1E293B]">{count}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <LuSearch className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search rows..."
                    className="h-8 rounded-[6px] border border-[#CBD5E1] bg-white pl-8 pr-2.5 text-xs text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#0F5C7A] focus:outline-none focus:ring-1 focus:ring-[#0F5C7A]"
                  />
                </div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="h-8 rounded-[6px] border border-[#CBD5E1] bg-white px-2.5 text-xs text-[#1E293B] focus:border-[#0F5C7A] focus:outline-none focus:ring-1 focus:ring-[#0F5C7A]"
                >
                  <option value="all">All diagnoses</option>
                  {classes.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="font-mono-numbers text-[11px] text-[#64748B]">
                  {filteredRows.length} of {response.results.length} rows
                </span>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filteredRows.length === 0}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-[#1E293B] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <LuDownload className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label="Batch predictions table"
              className="max-h-[500px] overflow-auto"
            >
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <tr>
                    <th className="px-3.5 py-2.5">Row</th>
                    {FEATURE_COLUMNS.map(({ key, label }) => (
                      <th key={key} className="px-3.5 py-2.5">{label}</th>
                    ))}
                    <th className="px-3.5 py-2.5">Prediction</th>
                    <th className="px-3.5 py-2.5">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredRows.map((row) => (
                    <tr key={row.row_index} className="hover:bg-[#F8FAFC]">
                      <td className="px-3.5 py-2.5 font-mono-numbers text-[#64748B]">{row.row_index + 1}</td>
                      {FEATURE_COLUMNS.map(({ key }) => (
                        <td key={key} className="px-3.5 py-2.5 font-mono-numbers text-[#1E293B]">
                          {formatNumber(row[key])}
                        </td>
                      ))}
                      <td className="px-3.5 py-2.5 font-medium text-[#1E293B]">{row.prediction}</td>
                      <td className="px-3.5 py-2.5 font-mono-numbers font-medium text-[#1E293B]">
                        {formatNumber(row.confidence * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
