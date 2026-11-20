// ============================================================
// src/types/spine.ts - TypeScript interfaces matching Backend API Contract
// ============================================================

/** Coordinate point in pixel space */
export interface Point {
  x: number;
  y: number;
}

/** The 7 ordered anatomical landmarks (pixel coordinates) */
export interface Landmarks {
  /** Center of Femoral Head */
  fh: Point;
  /** S1 Superior Anterior corner */
  s1_ant: Point;
  /** S1 Superior Posterior corner */
  s1_post: Point;
  /** L1 Superior Anterior corner */
  l1_ant: Point;
  /** L1 Superior Posterior corner */
  l1_post: Point;
  /** L5 Inferior Anterior corner */
  l5_ant: Point;
  /** L5 Inferior Posterior corner */
  l5_post: Point;
}

/** Landmark key names in placement order */
export const LANDMARK_ORDER: (keyof Landmarks)[] = [
  'fh',
  's1_ant',
  's1_post',
  'l1_ant',
  'l1_post',
  'l5_ant',
  'l5_post',
];

/** Human-readable labels for each landmark */
export const LANDMARK_LABELS: Record<keyof Landmarks, string> = {
  fh: 'Femoral Head Center',
  s1_ant: 'S1 Superior Anterior',
  s1_post: 'S1 Superior Posterior',
  l1_ant: 'L1 Superior Anterior',
  l1_post: 'L1 Superior Posterior',
  l5_ant: 'L5 Inferior Anterior',
  l5_post: 'L5 Inferior Posterior',
};

// ── GET /api/health ──────────────────────────────────────────

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
}

// ── POST /api/xray/process ───────────────────────────────────

export interface XrayProcessResponse {
  image_base64: string;
  width: number;
  height: number;
  pixel_spacing_mm: number;
  is_dicom: boolean;
}

// ── POST /api/predict ────────────────────────────────────────

/** The 6 spinopelvic features - also the predict request payload */
export interface SpinopelvicFeatures {
  pelvic_incidence: number;
  pelvic_tilt: number;
  lumbar_lordosis_angle: number;
  sacral_slope: number;
  pelvic_radius: number;
  degree_spondylolisthesis: number;
}

/** Alias: request body for POST /api/predict */
export type PredictRequest = SpinopelvicFeatures;

/** Clinical flag string per feature */
export type ClinicalFlags = Record<keyof SpinopelvicFeatures, string>;

/** Response from POST /api/predict */
export interface PredictResponse {
  prediction: string;
  probabilities: Record<string, number>;
  clinical_flags: ClinicalFlags;
}

// ── POST /api/predict/batch ──────────────────────────────────

export interface BatchPredictRow {
  row_index: number;
  pelvic_incidence: number;
  pelvic_tilt: number;
  lumbar_lordosis_angle: number;
  sacral_slope: number;
  pelvic_radius: number;
  degree_spondylolisthesis: number;
  prediction: string;
  confidence: number;
}

export interface BatchPredictResponse {
  total_rows: number;
  summary: Record<string, number>;
  results: BatchPredictRow[];
}

// ── Error shape returned by FastAPI ──────────────────────────

export interface ApiError {
  detail: string;
}

// ── Page / tab identifiers ───────────────────────────────────

export type PageId = 'xray' | 'manual' | 'batch' | 'guide';
