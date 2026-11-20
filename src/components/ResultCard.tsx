import { LuActivity, LuCircleAlert, LuCircleCheck, LuLoaderCircle } from 'react-icons/lu';
import type { PredictResponse } from '../types/spine';

interface ResultCardProps {
  data: PredictResponse | null;
  loading: boolean;
  error: string | null;
}

const FEATURE_LABELS: Record<keyof PredictResponse['clinical_flags'], string> = {
  pelvic_incidence: 'Pelvic incidence',
  pelvic_tilt: 'Pelvic tilt',
  lumbar_lordosis_angle: 'Lumbar lordosis',
  sacral_slope: 'Sacral slope',
  pelvic_radius: 'Pelvic radius',
  degree_spondylolisthesis: 'Spondylolisthesis',
};

function getFlagIndicator(flag: string) {
  const normalized = flag.toLowerCase();
  if (normalized.includes('abnormal') || normalized.includes('elevated') || normalized.includes('hyper') || normalized.includes('hypo')) {
    return 'bg-[#B91C1C]';
  }
  if (normalized.includes('high') || normalized.includes('low')) {
    return 'bg-[#B45309]';
  }
  if (normalized.includes('normal')) {
    return 'bg-[#15803D]';
  }
  return 'bg-[#94A3B8]';
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
        className="rounded-[8px] border border-[#E2E8F0] bg-white p-5"
      >
        <div className="flex items-center gap-3 text-[#64748B]" role="status">
          <LuLoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-[#0F5C7A]" />
          <div>
            <h2 className="text-xs font-semibold text-[#1E293B]">Evaluating parameters</h2>
            <p className="text-[11px] text-[#64748B]">Running probabilistic ML classification model</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#991B1B]"
        role="alert"
      >
        <div className="flex items-start gap-2.5">
          <LuCircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]" />
          <div>
            <h2 className="text-xs font-semibold text-[#991B1B]">
              Inference failed
            </h2>
            <p className="mt-0.5 text-[11px] text-[#B91C1C]">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-[8px] border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-start gap-3">
          <LuActivity aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />
          <div>
            <h2 className="text-xs font-semibold text-[#1E293B]">Analysis Output</h2>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              Complete landmark placement or submit measurements to inspect model output.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const probabilities = Object.entries(data.probabilities).sort(([, a], [, b]) => b - a);

  return (
    <section className="rounded-[8px] border border-[#E2E8F0] bg-white">
      <div className="border-b border-[#E2E8F0] px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              Classification Output
            </p>
            <h2 className="text-sm font-semibold text-[#1E293B]">
              {data.prediction}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#1E293B]">
            <LuCircleCheck className="h-3.5 w-3.5 text-[#15803D]" />
            Evaluated
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Probability Distribution
          </h3>
          <ul className="mt-2.5 space-y-2.5">
            {probabilities.map(([label, probability], idx) => {
              const percentage = Number.isFinite(probability)
                ? Math.min(100, Math.max(0, probability * 100))
                : 0;

              return (
                <li key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1E293B]">{label}</span>
                    <span className="font-mono-numbers font-semibold text-[#1E293B]">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    aria-label={`${label}: ${percentage.toFixed(1)}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percentage}
                    className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]"
                    role="progressbar"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx === 0
                          ? 'bg-[#0F5C7A]'
                          : idx === 1
                          ? 'bg-[#4B829A]'
                          : 'bg-[#94A3B8]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Clinical Reference Comparison
          </h3>
          <dl className="mt-2 divide-y divide-[#F1F5F9] border-y border-[#E2E8F0] text-xs">
            {(Object.entries(data.clinical_flags) as [keyof PredictResponse['clinical_flags'], string][]).map(
              ([feature, flag]) => (
                <div
                  className="flex items-center justify-between py-2 text-xs"
                  key={feature}
                >
                  <dt className="text-[#64748B]">{FEATURE_LABELS[feature]}</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-[#1E293B]">
                    <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${getFlagIndicator(flag)}`} />
                    <span>{flag}</span>
                  </dd>
                </div>
              ),
            )}
          </dl>
        </div>

        <div className="border-t border-[#E2E8F0] pt-3">
          <p className="text-[10px] leading-relaxed text-[#94A3B8]">
            Clinical assistance tool. Output represents probabilistic modeling and should not substitute professional medical judgment.
          </p>
        </div>
      </div>
    </section>
  );
}
