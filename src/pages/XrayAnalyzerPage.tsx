import { useMemo, useRef, useState } from 'react';
import { LuLoaderCircle, LuSparkles } from 'react-icons/lu';
import XrayCanvas from '../components/XrayCanvas';
import LandmarkChecklist from '../components/LandmarkChecklist';
import ResultCard from '../components/ResultCard';
import type { Landmarks, Point, PredictResponse, SpinopelvicFeatures, XrayProcessResponse } from '../types/spine';
import { LANDMARK_ORDER } from '../types/spine';
import { processXray, predictSingle } from '../services/api';
import { computeSpinopelvicFeatures } from '../utils/geometry';

const FEATURES: { key: keyof SpinopelvicFeatures; label: string; unit: string }[] = [
  { key: 'pelvic_incidence', label: 'Pelvic incidence', unit: '°' },
  { key: 'pelvic_tilt', label: 'Pelvic tilt', unit: '°' },
  { key: 'lumbar_lordosis_angle', label: 'Lumbar lordosis', unit: '°' },
  { key: 'sacral_slope', label: 'Sacral slope', unit: '°' },
  { key: 'pelvic_radius', label: 'Pelvic radius', unit: ' mm' },
  { key: 'degree_spondylolisthesis', label: 'Spondylolisthesis', unit: ' mm' },
];

function isCompleteLandmarks(value: Partial<Landmarks>): value is Landmarks {
  return LANDMARK_ORDER.every((key) => {
    const point = value[key];
    return point !== undefined && Number.isFinite(point.x) && Number.isFinite(point.y);
  });
}

export default function XrayAnalyzerPage() {
  const [processed, setProcessed] = useState<XrayProcessResponse | null>(null);
  const [landmarks, setLandmarks] = useState<Partial<Landmarks>>({});
  const [selected, setSelected] = useState<keyof Landmarks | null>('fh');
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const predictionRequestRef = useRef(0);

  const nextKey = LANDMARK_ORDER.find((key) => !landmarks[key]);
  const features = useMemo<SpinopelvicFeatures | null>(() => {
    if (!processed || !isCompleteLandmarks(landmarks)) return null;
    return computeSpinopelvicFeatures(landmarks, processed.pixel_spacing_mm);
  }, [processed, landmarks]);

  const clearResult = () => {
    predictionRequestRef.current += 1;
    setPrediction(null);
    setPredictionError(null);
    setPredictionLoading(false);
  };

  const handleUpload = async (file: File) => {
    setProcessing(true);
    setUploadError(null);
    clearResult();
    try {
      const result = await processXray(file);
      setProcessed(result);
      setLandmarks({});
      setSelected('fh');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process uploaded file');
    } finally {
      setProcessing(false);
    }
  };

  const place = (key: keyof Landmarks, point: Point) => {
    setLandmarks((current) => ({ ...current, [key]: point }));
    clearResult();
    const index = LANDMARK_ORDER.indexOf(key);
    setSelected(LANDMARK_ORDER[index + 1] ?? key);
  };

  const drag = (key: keyof Landmarks, point: Point) => {
    setLandmarks((current) => ({ ...current, [key]: point }));
    clearResult();
  };

  const undo = () => {
    const key = [...LANDMARK_ORDER].reverse().find((item) => landmarks[item]);
    if (!key) return;
    setLandmarks((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSelected(key);
    clearResult();
  };

  const reset = () => {
    setLandmarks({});
    setSelected('fh');
    clearResult();
  };

  const selectLandmark = (key: keyof Landmarks) => {
    setSelected(landmarks[key] ? key : nextKey ?? key);
  };

  const predict = async () => {
    if (!features) return;
    const requestId = ++predictionRequestRef.current;
    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);
    try {
      const result = await predictSingle(features);
      if (requestId === predictionRequestRef.current) setPrediction(result);
    } catch (error) {
      if (requestId === predictionRequestRef.current) {
        setPredictionError(error instanceof Error ? error.message : 'Prediction request failed');
      }
    } finally {
      if (requestId === predictionRequestRef.current) setPredictionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[#1E293B]">
          Radiographic Analysis
        </h1>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Digital anatomical landmark placement and spinopelvic parameter derivation on lateral radiographs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <XrayCanvas
            imageBase64={processed?.image_base64 ?? null}
            width={processed?.width ?? 1}
            height={processed?.height ?? 1}
            landmarks={landmarks}
            selected={selected}
            processing={processing}
            error={uploadError}
            onUpload={handleUpload}
            onPlace={place}
            onDrag={drag}
            onSelect={setSelected}
            onUndo={undo}
            onReset={reset}
          />

          {features && (
            <section className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Calculated Parameters
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.key}
                    className="rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
                  >
                    <dt className="text-[11px] text-[#64748B]">{feature.label}</dt>
                    <dd className="mt-0.5 font-mono-numbers text-base font-semibold text-[#1E293B]">
                      {features[feature.key].toFixed(2)}
                      <span className="ml-1 text-xs font-normal text-[#64748B]">
                        {feature.unit}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <LandmarkChecklist
            landmarks={landmarks}
            selected={selected}
            nextKey={nextKey}
            onSelect={selectLandmark}
          />

          <button
            type="button"
            onClick={predict}
            disabled={!features || predictionLoading}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[#0F5C7A] text-xs font-semibold text-white transition hover:bg-[#0C4A62] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
          >
            {predictionLoading ? (
              <>
                <LuLoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <LuSparkles aria-hidden="true" className="h-4 w-4" />
                Run Prediction
              </>
            )}
          </button>

          <ResultCard data={prediction} loading={predictionLoading} error={predictionError} />
        </aside>
      </div>
    </div>
  );
}
