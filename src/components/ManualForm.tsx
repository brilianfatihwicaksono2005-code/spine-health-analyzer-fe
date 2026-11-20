import { useState, type FormEvent } from 'react';
import { LuCalculator, LuRotateCcw, LuChevronUp, LuChevronDown } from 'react-icons/lu';
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
  unit: string;
  min: number;
  max: number;
  step: number;
  normalRange: string;
}

const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  { key: 'pelvic_incidence', label: 'Pelvic incidence', shortLabel: 'PI', unit: '°', min: 0, max: 120, step: 0.1, normalRange: '40-65°' },
  { key: 'pelvic_tilt', label: 'Pelvic tilt', shortLabel: 'PT', unit: '°', min: 0, max: 60, step: 0.1, normalRange: '10-20°' },
  { key: 'lumbar_lordosis_angle', label: 'Lumbar lordosis angle', shortLabel: 'LLA', unit: '°', min: 0, max: 120, step: 0.1, normalRange: '40-60°' },
  { key: 'sacral_slope', label: 'Sacral slope', shortLabel: 'SS', unit: '°', min: 0, max: 90, step: 0.1, normalRange: '35-45°' },
  { key: 'pelvic_radius', label: 'Pelvic radius', shortLabel: 'PR', unit: 'mm', min: 50, max: 200, step: 0.1, normalRange: '110-140 mm' },
  { key: 'degree_spondylolisthesis', label: 'Degree of spondylolisthesis', shortLabel: 'DS', unit: 'mm', min: 0, max: 100, step: 0.1, normalRange: '<5 mm' },
];

const PRESETS: { name: PresetName; label: string }[] = [
  { name: 'normal', label: 'Normal Profile' },
  { name: 'hernia', label: 'Hernia Profile' },
  { name: 'spondylolisthesis', label: 'Spondylolisthesis Profile' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface CustomNumberInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function CustomNumberInput({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: CustomNumberInputProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [localText, setLocalText] = useState(String(value));

  if (prevValue !== value) {
    setPrevValue(value);
    setLocalText(String(value));
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setLocalText(raw);
    const parsed = Number(raw);
    if (raw !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
      onChange(Math.round(parsed * 10) / 10);
    }
  };

  const handleBlur = () => {
    const parsed = Number(localText);
    if (!Number.isFinite(parsed) || localText.trim() === '') {
      setLocalText(String(value));
      return;
    }
    const clamped = Math.round(clamp(parsed, min, max) * 10) / 10;
    setLocalText(String(clamped));
    onChange(clamped);
  };

  const handleStep = (delta: number) => {
    const parsed = Number(localText);
    const base = Number.isFinite(parsed) ? parsed : value;
    const next = Math.round(clamp(base + delta, min, max) * 10) / 10;
    setLocalText(String(next));
    onChange(next);
  };

  const isAtMin = value <= min;
  const isAtMax = value >= max;

  return (
    <div className="flex h-9 w-full items-stretch overflow-hidden rounded-[6px] border border-[#CBD5E1] bg-white transition focus-within:border-[#0F5C7A] focus-within:ring-1 focus-within:ring-[#0F5C7A] sm:w-[130px]">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={localText}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={`${label} numeric value`}
        className="w-full min-w-0 bg-transparent pl-2.5 pr-1.5 text-right font-mono-numbers text-xs font-semibold text-[#1E293B] outline-none"
      />
      <span className="flex select-none items-center pr-2 font-sans text-xs font-medium text-[#64748B]">
        {unit}
      </span>
      <div className="flex flex-col border-l border-[#E2E8F0] bg-[#F8FAFC]">
        <button
          type="button"
          onClick={() => handleStep(step)}
          disabled={isAtMax}
          className="flex flex-1 items-center justify-center px-1.5 text-[#64748B] transition hover:bg-[#F0F6F9] hover:text-[#0F5C7A] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#64748B]"
          aria-label={`Increase ${label}`}
          tabIndex={-1}
        >
          <LuChevronUp className="h-3 w-3 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => handleStep(-step)}
          disabled={isAtMin}
          className="flex flex-1 items-center justify-center border-t border-[#E2E8F0] px-1.5 text-[#64748B] transition hover:bg-[#F0F6F9] hover:text-[#0F5C7A] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#64748B]"
          aria-label={`Decrease ${label}`}
          tabIndex={-1}
        >
          <LuChevronDown className="h-3 w-3 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
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
      className="rounded-[8px] border border-[#E2E8F0] bg-white"
    >
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#1E293B]">
              Spinopelvic Parameters
            </h2>
            <p className="text-[11px] text-[#64748B]">
              Enter anatomical measurements or select a clinical baseline profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onPreset('normal')}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-medium text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#1E293B]"
          >
            <LuRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Clinical presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onPreset(preset.name)}
              className="rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#1E293B] transition hover:border-[#CBD5E1] hover:bg-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#F1F5F9] px-5">
        {FEATURE_DEFINITIONS.map((field) => {
          const value = features[field.key];

          return (
            <div key={field.key} className="py-3.5">
              <div className="grid items-center gap-3 sm:grid-cols-[1fr_130px]">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor={field.key} className="text-xs font-medium text-[#1E293B]">
                      {field.label}
                      <span className="ml-1 text-[11px] text-[#64748B]">({field.shortLabel})</span>
                    </label>
                    <span className="text-[11px] text-[#64748B]">
                      Normal: {field.normalRange}
                    </span>
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
                    className="mt-2 h-1 w-full cursor-pointer appearance-none bg-[#E2E8F0]"
                  />
                  <div className="mt-1 flex justify-between font-mono-numbers text-[10px] text-[#94A3B8]">
                    <span>{field.min.toFixed(1)} {field.unit}</span>
                    <span>{field.max.toFixed(1)} {field.unit}</span>
                  </div>
                </div>

                <div>
                  <CustomNumberInput
                    id={field.key}
                    label={field.label}
                    value={value}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    unit={field.unit}
                    onChange={(next) => onFeatureChange(field.key, next)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#E2E8F0] px-5 py-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1E293B]">
          <input
            type="checkbox"
            checked={instantPredict}
            onChange={(event) => onInstantPredictChange(event.target.checked)}
            className="h-4 w-4 rounded-[4px] border-[#CBD5E1] text-[#0F5C7A] focus:ring-[#0F5C7A]"
          />
          <span>Instant inference</span>
          <span className="text-[11px] text-[#64748B]">(updates 300ms after slider stops)</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-3.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[#0F5C7A] px-4 text-xs font-semibold text-white transition hover:bg-[#0C4A62] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
        >
          <LuCalculator aria-hidden="true" className="h-4 w-4" />
          {loading ? 'Evaluating...' : 'Run Prediction'}
        </button>
      </div>
    </form>
  );
}
