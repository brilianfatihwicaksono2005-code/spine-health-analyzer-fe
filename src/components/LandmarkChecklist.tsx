import { Check } from 'lucide-react';
import { LANDMARK_LABELS, LANDMARK_ORDER, type Landmarks } from '../types/spine';

interface LandmarkChecklistProps {
  landmarks: Partial<Landmarks>;
  selected: keyof Landmarks | null;
  nextKey: keyof Landmarks | undefined;
  onSelect: (key: keyof Landmarks) => void;
}

export default function LandmarkChecklist({
  landmarks,
  selected,
  nextKey,
  onSelect,
}: LandmarkChecklistProps) {
  return (
    <section className="rounded-md border border-[#E2E8F0] bg-white" aria-labelledby="landmark-checklist-title">
      <div className="border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 id="landmark-checklist-title" className="text-sm font-semibold text-[#00183A]">Landmark checklist</h2>
          <span className="tabular-nums text-xs font-medium text-[#64748B]">
            {LANDMARK_ORDER.filter((key) => Boolean(landmarks[key])).length}/7
          </span>
        </div>
      </div>
      <ol className="divide-y divide-[#E2E8F0] px-2 py-1">
        {LANDMARK_ORDER.map((key, index) => {
          const complete = Boolean(landmarks[key]);
          const next = !complete && nextKey === key;
          const active = selected === key && (complete || next);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-current={next ? 'step' : undefined}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#00183A] focus:ring-offset-2 ${
                  active ? 'bg-[#F59659]/15 text-[#00183A]' : 'text-[#475569] hover:bg-[#F2F2F2]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-bold ${
                    complete
                      ? 'bg-[#00183A] text-white'
                      : active
                        ? 'border-2 border-[#F59659] bg-white text-[#00183A]'
                        : 'border border-[#CBD5E1] bg-white text-[#64748B]'
                  }`}
                >
                  {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold leading-4">{LANDMARK_LABELS[key]}</span>
                  <span className={`mt-0.5 block text-[11px] ${next ? 'text-[#00183A]' : 'text-[#64748B]'}`}>
                    {complete ? 'Placed · drag to adjust' : next ? 'Next to place' : 'Not placed'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
