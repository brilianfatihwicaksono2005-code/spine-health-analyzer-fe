import { Calculator, RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';
import type { SpinopelvicFeatures } from '../types/spine';

interface ManualFormProps {
  features: SpinopelvicFeatures;
  instantPredict: boolean;
  loading: boolean;
  onFeatureChange: (key: keyof SpinopelvicFeatures, value: number) => void;
  onInstantPredictChange: (enabled: boolean) => void;
  onPreset: (preset: PresetName) => void;
  onCalculate: () => void;
}

export type PresetName = 'normal' | 'hernia' | 'spondylolisthesis';

interface FeatureDefinition {
  key: keyof SpinopelvicFeatures;
  label: string;
  shortLabel: string;
  unit: '°' | ' mm';
  min: number;
  max: number;
  step: number;
}

const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  { key: 'pelvic_incidence', label: 'Pelvic incidence', shortLabel: 'PI', unit: '°', min: 0, max: 120, step: 0.1 },
  { key: 'pelvic_tilt', label: 'Pelvic tilt', shortLabel: 'PT', unit: '°', min: 0, max: 60, step: 0.1 },
  { key: 'lumbar_lordosis_angle', label: 'Lumbar lordosis angle', shortLabel: 'LLA', unit: '°', min: 0, max: 120, step: 0.1 },
  { key: 'sacral_slope', label: 'Sacral slope', shortLabel: 'SS', unit: '°', min: 0, max: 90, step: 0.1 },
  { key: 'pelvic_radius', label: 'Pelvic radius', shortLabel: 'PR', unit: ' mm', min: 50, max: 200, step: 0.1 },
  { key: 'degree_spondylolisthesis', label: 'Degree of spondylolisthesis', shortLabel: 'DS', unit: ' mm', min: 0, max: 100, step: 0.1 },
];

const PRESETS: { name: PresetName; label: string }[] = [
  { name: 'normal', label: 'Default Normal' },
  { name: 'hernia', label: 'Hernia Case' },
  { name: 'spondylolisthesis', label: 'Spondylolisthesis Case' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ManualForm({
  features,
  instantPredict,
  loading,
  onFeatureChange,
  onInstantPredictChange,
  onPreset,
  onCalculate,
}: ManualFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCalculate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-[#E2E8F0] bg-white"
    >
      <div className="border-b border-[#E2E8F0] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]" data-eyebrow>Clinical inputs</p>
            <h2 className="mt-1 font-semibold text-[#00183A]">Spinopelvic measurements</h2>
          </div>
          <button
            type="button"
            onClick={() => onPreset('normal')}
            className="inline-flex items-center gap-1.5 rounded-sm border border-[#CBD5E1] px-2.5 py-1.5 text-xs font-semibold text-[#00183A] transition hover:bg-[#F2F2F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00183A] focus-visible:ring-offset-2"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Clinical presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onPreset(preset.name)}
              className="rounded-sm border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#00183A] transition hover:bg-[#F2F2F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00183A] focus-visible:ring-offset-2"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#E2E8F0] px-5 sm:px-6">
        {FEATURE_DEFINITIONS.map((field) => {
          const value = features[field.key];

          return (
            <fieldset key={field.key} className="py-4">
              <div className="grid items-center gap-3 sm:grid-cols-[minmax(150px,1fr)_112px]">
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={field.key} className="text-sm font-semibold text-[#00183A]">
                      {field.label}
                    </label>
                    <span className="text-xs font-semibold text-[#64748B]">{field.shortLabel}</span>
                  </div>
                  <input
                    id={`${field.key}-range`}
                    aria-label={`${field.label} slider`}
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(event) =>
                      onFeatureChange(field.key, clamp(Number(event.target.value), field.min, field.max))
                    }
                    className="mt-3 h-1 w-full cursor-pointer appearance-none bg-[#E2E8F0]"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[#64748B]">
                    <span>{field.min.toFixed(1)}{field.unit}</span>
                    <span>{field.max.toFixed(1)}{field.unit}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor={field.key} className="sr-only">
                    {field.label} numeric value
                  </label>
                  <div className="relative">
                    <input
                      id={field.key}
                      type="number"
                      inputMode="decimal"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        if (Number.isFinite(nextValue)) {
                          onFeatureChange(field.key, clamp(nextValue, field.min, field.max));
                        }
                      }}
                      onBlur={(event) => {
                        const nextValue = Number(event.target.value);
                        if (!Number.isFinite(nextValue)) return;
                        onFeatureChange(field.key, clamp(nextValue, field.min, field.max));
                      }}
                      className="w-full rounded-sm border border-[#CBD5E1] bg-white px-3 py-2 pr-9 text-right text-sm font-semibold tabular-nums text-[#00183A] outline-none transition focus:border-[#00183A] focus:ring-2 focus:ring-[#00183A]/20"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#64748B]">
                      {field.unit.trim()}
                    </span>
                  </div>
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="border-t border-[#E2E8F0] px-5 py-5 sm:px-6">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#475569]">
          <input
            type="checkbox"
            checked={instantPredict}
            onChange={(event) => onInstantPredictChange(event.target.checked)}
            className="h-4 w-4 rounded-sm border-[#CBD5E1] text-[#00183A] focus:ring-[#00183A]"
          />
          Instant predict
          <span className="text-xs font-normal text-[#64748B]">Updates 300 ms after a change</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#F59659] px-4 py-2.5 text-sm font-semibold text-[#00183A] transition hover:bg-[#E28346] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00183A] focus-visible:ring-offset-2"
        >
          <Calculator aria-hidden="true" className="h-4 w-4" />
          {loading ? 'Calculating…' : 'Calculate Prediction'}
        </button>
      </div>
    </form>
  );
}
