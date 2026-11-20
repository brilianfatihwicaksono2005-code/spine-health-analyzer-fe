// src/services/api.ts - API service
import type {
  HealthResponse,
  XrayProcessResponse,
  PredictRequest,
  PredictResponse,
  BatchPredictResponse,
  BatchPredictRow,
  ClinicalFlags,
  SpinopelvicFeatures,
} from '../types/spine';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Helpers
function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Clinical flag helpers (mock mode fallback)
interface Range {
  low: number;
  high: number;
  label: string;
  unit: string;
}

const CLINICAL_RANGES: Record<keyof SpinopelvicFeatures, Range> = {
  pelvic_incidence:         { low: 40, high: 65, label: 'Normal', unit: '°' },
  pelvic_tilt:              { low: 10, high: 20, label: 'Normal', unit: '°' },
  lumbar_lordosis_angle:    { low: 40, high: 60, label: 'Normal', unit: '°' },
  sacral_slope:             { low: 35, high: 45, label: 'Normal', unit: '°' },
  pelvic_radius:            { low: 110, high: 140, label: 'Normal', unit: ' mm' },
  degree_spondylolisthesis: { low: 0, high: 5, label: 'Normal', unit: ' mm' },
};

function buildClinicalFlags(features: PredictRequest): ClinicalFlags {
  const flags = {} as ClinicalFlags;
  for (const key of Object.keys(CLINICAL_RANGES) as (keyof SpinopelvicFeatures)[]) {
    const r = CLINICAL_RANGES[key];
    const v = features[key];
    if (key === 'degree_spondylolisthesis') {
      flags[key] = v < r.high ? `Normal (<${r.high}${r.unit})` : `Elevated (≥${r.high}${r.unit})`;
    } else if (v < r.low) {
      flags[key] = `Low (<${r.low}${r.unit})`;
    } else if (v > r.high) {
      flags[key] = `High (>${r.high}${r.unit})`;
    } else {
      flags[key] = `${r.label} (${r.low}-${r.high}${r.unit})`;
    }
  }
  return flags;
}

function mockClassify(f: PredictRequest): { prediction: string; probabilities: Record<string, number> } {
  const spondy = f.degree_spondylolisthesis >= 20;
  const hernia =
    f.pelvic_tilt > 20 &&
    f.lumbar_lordosis_angle < 40 &&
    f.degree_spondylolisthesis < 20;

  if (spondy) {
    return {
      prediction: 'Spondylolisthesis',
      probabilities: { Normal: 0.05, Hernia: 0.1, Spondylolisthesis: 0.85 },
    };
  }
  if (hernia) {
    return {
      prediction: 'Hernia',
      probabilities: { Normal: 0.1, Hernia: 0.8, Spondylolisthesis: 0.1 },
    };
  }
  return {
    prediction: 'Normal',
    probabilities: { Normal: 0.85, Hernia: 0.1, Spondylolisthesis: 0.05 },
  };
}

const REQUIRED_COLUMNS: (keyof SpinopelvicFeatures)[] = [
  'pelvic_incidence',
  'pelvic_tilt',
  'lumbar_lordosis_angle',
  'sacral_slope',
  'pelvic_radius',
  'degree_spondylolisthesis',
];

export async function checkHealth(): Promise<HealthResponse> {
  if (USE_MOCK) {
    await delay(200);
    return { status: 'ok', model_loaded: true };
  }
  const res = await fetch(`${API_BASE}/api/health`);
  return handleResponse<HealthResponse>(res);
}

export async function processXray(file: File): Promise<XrayProcessResponse> {
  if (USE_MOCK) {
    await delay(400);
    return new Promise<XrayProcessResponse>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          resolve({
            image_base64: reader.result as string,
            width: img.naturalWidth,
            height: img.naturalHeight,
            pixel_spacing_mm: 0.5,
            is_dicom: false,
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/xray/process`, {
    method: 'POST',
    body: form,
  });
  return handleResponse<XrayProcessResponse>(res);
}

export async function predictSingle(
  features: PredictRequest,
): Promise<PredictResponse> {
  if (USE_MOCK) {
    await delay(400);
    const { prediction, probabilities } = mockClassify(features);
    return {
      prediction,
      probabilities,
      clinical_flags: buildClinicalFlags(features),
    };
  }

  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  });
  return handleResponse<PredictResponse>(res);
}

export async function predictBatch(file: File): Promise<BatchPredictResponse> {
  if (USE_MOCK) {
    await delay(600);
    const text = await file.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    for (const col of REQUIRED_COLUMNS) {
      if (!headers.includes(col)) {
        throw new Error(`Missing required column: ${col}`);
      }
    }

    const colIndices = REQUIRED_COLUMNS.map((col) => headers.indexOf(col));
    const results: BatchPredictRow[] = [];
    const summary: Record<string, number> = {};

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map((c) => c.trim());
      const values = colIndices.map((idx) => {
        const v = parseFloat(cells[idx]);
        if (isNaN(v)) {
          throw new Error(
            `Non-numeric value at row ${i}, column "${REQUIRED_COLUMNS[colIndices.indexOf(idx)]}"`,
          );
        }
        return v;
      });

      const features: PredictRequest = {
        pelvic_incidence: values[0],
        pelvic_tilt: values[1],
        lumbar_lordosis_angle: values[2],
        sacral_slope: values[3],
        pelvic_radius: values[4],
        degree_spondylolisthesis: values[5],
      };

      const { prediction, probabilities } = mockClassify(features);
      const confidence = probabilities[prediction] ?? 0;

      results.push({
        row_index: i - 1,
        ...features,
        prediction,
        confidence,
      });

      summary[prediction] = (summary[prediction] ?? 0) + 1;
    }

    return {
      total_rows: results.length,
      summary,
      results,
    };
  }

  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/predict/batch`, {
    method: 'POST',
    body: form,
  });
  return handleResponse<BatchPredictResponse>(res);
}
