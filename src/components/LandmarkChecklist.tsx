import { LuCheck } from 'react-icons/lu';
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
  const completedCount = LANDMARK_ORDER.filter((key) => Boolean(landmarks[key])).length;

  return (
    <section className="rounded-[8px] border border-[#E2E8F0] bg-white" aria-labelledby="landmark-checklist-title">
      <div className="border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 id="landmark-checklist-title" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Landmarks
          </h2>
          <span className="font-mono-numbers text-xs font-semibold text-[#1E293B]">
            {completedCount} / 7
          </span>
        </div>
      </div>
      <ol className="divide-y divide-[#F1F5F9] p-2">
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
                className={`flex w-full items-center gap-2.5 rounded-[6px] p-2 text-left text-xs transition-colors ${
                  active
                    ? 'bg-[#F0F6F9] font-medium text-[#0F5C7A]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-mono-numbers text-[11px] font-semibold ${
                    complete
                      ? 'bg-[#0F5C7A] text-white'
                      : active
                      ? 'border border-[#0F5C7A] bg-white text-[#0F5C7A]'
                      : 'border border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]'
                  }`}
                >
                  {complete ? <LuCheck className="h-3 w-3 stroke-[2.5]" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-[#1E293B]">
                    {LANDMARK_LABELS[key]}
                  </span>
                  <span className="block text-[10px] text-[#64748B]">
                    {complete ? 'Positioned' : next ? 'Next landmark' : 'Pending'}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
