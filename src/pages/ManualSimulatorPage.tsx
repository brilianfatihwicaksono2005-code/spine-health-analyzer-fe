import { useCallback, useEffect, useRef, useState } from 'react';
import ManualForm, { type PresetName } from '../components/ManualForm';
import ResultCard from '../components/ResultCard';
import { predictSingle } from '../services/api';
import type { PredictResponse, SpinopelvicFeatures } from '../types/spine';

const DEFAULT_FEATURES: SpinopelvicFeatures = {
  pelvic_incidence: 52.4,
  pelvic_tilt: 14.2,
  lumbar_lordosis_angle: 48.1,
  sacral_slope: 38.2,
  pelvic_radius: 118.5,
  degree_spondylolisthesis: 4.3,
};

const PRESET_FEATURES: Record<PresetName, SpinopelvicFeatures> = {
  normal: DEFAULT_FEATURES,
  hernia: {
    pelvic_incidence: 63.0,
    pelvic_tilt: 25.0,
    lumbar_lordosis_angle: 35.0,
    sacral_slope: 38.0,
    pelvic_radius: 115.0,
    degree_spondylolisthesis: 3.0,
  },
  spondylolisthesis: {
    pelvic_incidence: 58.0,
    pelvic_tilt: 18.0,
    lumbar_lordosis_angle: 52.0,
    sacral_slope: 40.0,
    pelvic_radius: 120.0,
    degree_spondylolisthesis: 28.0,
  },
};

export default function ManualSimulatorPage() {
  const [features, setFeatures] = useState<SpinopelvicFeatures>(DEFAULT_FEATURES);
  const [instantPredict, setInstantPredict] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const requestSequence = useRef(0);

  const runPrediction = useCallback(async (values: SpinopelvicFeatures) => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);

    try {
      const response = await predictSingle(values);
      if (sequence === requestSequence.current) {
        setResult(response);
      }
    } catch (caughtError) {
      if (sequence === requestSequence.current) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to complete prediction.');
        setResult(null);
      }
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!instantPredict) return;

    const timeoutId = window.setTimeout(() => {
      void runPrediction(features);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [features, instantPredict, runPrediction]);

  const handleFeatureChange = (key: keyof SpinopelvicFeatures, value: number) => {
    setFeatures((current) => ({ ...current, [key]: value }));
  };

  const handlePreset = (preset: PresetName) => {
    setFeatures({ ...PRESET_FEATURES[preset] });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]" data-eyebrow>
          Biomechanical analysis
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#00183A]">Manual Input &amp; What-If Simulator</h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Adjust spinopelvic measurements and compare the predicted clinical outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.62fr)_minmax(340px,1fr)]">
        <ManualForm
          features={features}
          instantPredict={instantPredict}
          loading={loading}
          onFeatureChange={handleFeatureChange}
          onInstantPredictChange={setInstantPredict}
          onPreset={handlePreset}
          onCalculate={() => void runPrediction(features)}
        />
        <div className="lg:sticky lg:top-24">
          <ResultCard data={result} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
