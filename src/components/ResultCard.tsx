import { Activity, AlertCircle, LoaderCircle } from 'lucide-react';
import type { PredictResponse } from '../types/spine';

interface ResultCardProps {
  data: PredictResponse | null;
  loading: boolean;
  error: string | null;
}

const clinicalFeatureLabels: Record<keyof PredictResponse['clinical_flags'], string> = {
  pelvic_incidence: 'Pelvic incidence',
  pelvic_tilt: 'Pelvic tilt',
  lumbar_lordosis_angle: 'Lumbar lordosis angle',
  sacral_slope: 'Sacral slope',
  pelvic_radius: 'Pelvic radius',
  degree_spondylolisthesis: 'Degree of spondylolisthesis',
};

function getFlagDot(feature: keyof PredictResponse['clinical_flags'], flag: string) {
  const normalized = flag.toLowerCase();
  if (
    (normalized.includes('abnormal') || normalized.includes('high')) &&
    feature === 'degree_spondylolisthesis'
  ) {
    return 'bg-[#B91C1C]';
  }
  if (normalized.includes('abnormal') || normalized.includes('high')) {
    return 'bg-[#D97706]';
  }
  if (normalized.includes('normal')) return 'bg-[#0F766E]';
  if (normalized.includes('hernia') || normalized.includes('borderline')) {
    return 'bg-[#D97706]';
  }
  return 'bg-[#64748B]';
}

function getDiagnosisStyles(prediction: string) {
  switch (prediction.toLowerCase()) {
    case 'normal':
      return {
        badge: 'border-[#E2E8F0] bg-white text-[#00183A]',
        icon: 'text-[#0F766E]',
        bar: 'bg-[#00183A]',
      };
    case 'hernia':
      return {
        badge: 'border-[#E2E8F0] bg-white text-[#00183A]',
        icon: 'text-[#D97706]',
        bar: 'bg-[#00183A]',
      };
    case 'spondylolisthesis':
      return {
        badge: 'border-[#E2E8F0] bg-white text-[#00183A]',
        icon: 'text-[#B91C1C]',
        bar: 'bg-[#00183A]',
      };
    default:
      return {
        badge: 'border-[#E2E8F0] bg-white text-[#00183A]',
        icon: 'text-[#64748B]',
        bar: 'bg-[#00183A]',
      };
  }
}

export default function ResultCard({
  data = null,
  loading = false,
  error = null,
}: Partial<ResultCardProps>) {
  if (loading) {
    return (
      <section
        aria-live="polite"
        aria-label="Prediction status"
        className="rounded-md border border-[#E2E8F0] bg-white p-6"
      >
        <div className="flex items-center gap-3 text-[#475569]" role="status">
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-[#00183A]" />
          <div>
            <h2 className="font-semibold">Calculating prediction</h2>
            <p className="mt-1 text-sm text-[#64748B]">Analyzing the clinical measurements...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-labelledby="prediction-error-title"
        className="rounded-md border border-[#E2E8F0] bg-white p-6"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C]" />
          <div>
            <h2 id="prediction-error-title" className="font-semibold text-[#00183A]">
              Prediction could not be completed
            </h2>
            <p className="mt-1 text-sm text-[#475569]">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-md border border-[#E2E8F0] bg-white p-6">
        <div className="flex items-start gap-3">
          <Activity aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" />
          <div>
            <h2 className="font-semibold text-[#00183A]">Prediction result</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Results will appear here after you run the calculation.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const diagnosisStyles = getDiagnosisStyles(data.prediction);
  const probabilities = Object.entries(data.probabilities).sort(([, first], [, second]) => second - first);

  return (
    <section
      aria-labelledby="prediction-result-title"
      className="rounded-md border border-[#E2E8F0] bg-white"
    >
      <div className="border-b border-[#E2E8F0] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]" data-eyebrow>
              Prediction result
            </p>
            <h2 id="prediction-result-title" className="mt-1 text-lg font-semibold text-[#00183A]">
              Primary diagnosis
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm font-semibold ${diagnosisStyles.badge}`}
          >
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${diagnosisStyles.icon.replace('text-', 'bg-')}`} />
            {data.prediction}
          </span>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-5">
        <div>
          <h3 className="text-sm font-semibold text-[#00183A]">Probability distribution</h3>
          <ul className="mt-4 space-y-4">
            {probabilities.map(([label, probability]) => {
              const percentage = Number.isFinite(probability)
                ? Math.min(100, Math.max(0, probability * 100))
                : 0;

              return (
                <li key={label}>
                  <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-[#475569]">{label}</span>
                    <span className="tabular-nums font-semibold text-[#00183A]">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    aria-label={`${label}: ${percentage.toFixed(1)}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percentage}
                    className="h-1.5 overflow-hidden rounded-sm bg-[#F2F2F2]"
                    role="progressbar"
                  >
                    <div
                      className={`h-full transition-[width] duration-300 ${probabilities.findIndex(([probLabel]) => probLabel === label) === 0 ? 'opacity-100' : probabilities.findIndex(([probLabel]) => probLabel === label) === 1 ? 'opacity-[0.55]' : 'opacity-[0.25]'} ${diagnosisStyles.bar}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#00183A]">Clinical flags</h3>
          <dl className="mt-3 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
            {(Object.entries(data.clinical_flags) as [keyof PredictResponse['clinical_flags'], string][]).map(
              ([feature, flag]) => (
                <div
                  className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  key={feature}
                >
                  <dt className="text-sm text-[#64748B]">{clinicalFeatureLabels[feature]}</dt>
                  <dd className="flex items-center gap-2 text-sm font-medium text-[#00183A] sm:text-right">
                    <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${getFlagDot(feature, flag)}`} />
                    <span>{flag}</span>
                  </dd>
                </div>
              ),
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
