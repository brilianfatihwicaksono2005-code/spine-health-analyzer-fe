import { LuRuler, LuCrosshair, LuInfo, LuCircleAlert } from 'react-icons/lu';

const PARAMETERS = [
  {
    name: 'Pelvic incidence',
    key: 'pelvic_incidence',
    range: '40-65°',
    definition: 'Angle between the line perpendicular to S1 superior endplate and the line connecting S1 midpoint to femoral head center.',
  },
  {
    name: 'Pelvic tilt',
    key: 'pelvic_tilt',
    range: '10-20°',
    definition: 'Angle between the vertical reference axis and the line connecting femoral head center to S1 midpoint.',
  },
  {
    name: 'Lumbar lordosis angle',
    key: 'lumbar_lordosis_angle',
    range: '40-60°',
    definition: 'Sagittal curvature angle of the lumbar lordosis between L1 superior and S1 superior endplates.',
  },
  {
    name: 'Sacral slope',
    key: 'sacral_slope',
    range: '35-45°',
    definition: 'Angle between S1 superior endplate plane and the horizontal reference plane.',
  },
  {
    name: 'Pelvic radius',
    key: 'pelvic_radius',
    range: '110-140 mm',
    definition: 'Direct linear distance from the femoral head center to the posterior superior point of S1.',
  },
  {
    name: 'Degree spondylolisthesis',
    key: 'degree_spondylolisthesis',
    range: '<5 mm',
    definition: 'Anterior displacement distance of L5 inferior posterior relative to S1 superior posterior.',
  },
] as const;

const LANDMARKS = [
  { code: 'fh', name: 'Femoral head center', instruction: 'Center of visible femoral head sphere.' },
  { code: 's1_ant', name: 'S1 anterior corner', instruction: 'Anterior margin of superior S1 sacral endplate.' },
  { code: 's1_post', name: 'S1 posterior corner', instruction: 'Posterior margin of superior S1 sacral endplate.' },
  { code: 'l1_ant', name: 'L1 anterior corner', instruction: 'Anterior margin of superior L1 vertebral endplate.' },
  { code: 'l1_post', name: 'L1 posterior corner', instruction: 'Posterior margin of superior L1 vertebral endplate.' },
  { code: 'l5_ant', name: 'L5 anterior corner', instruction: 'Anterior margin of inferior L5 vertebral endplate.' },
  { code: 'l5_post', name: 'L5 posterior corner', instruction: 'Posterior margin of inferior L5 vertebral endplate.' },
] as const;

export default function GuidePage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#1E293B]">
            Clinical Reference
          </h1>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Normative physiological ranges, landmark definitions, and spinopelvic measurement principles.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs text-[#64748B]">
          <LuCircleAlert className="h-3.5 w-3.5 text-[#B45309]" />
          <span>Educational reference</span>
        </div>
      </div>

      <section aria-labelledby="parameters-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <LuRuler className="h-4 w-4 text-[#0F5C7A]" />
          <h2 id="parameters-heading" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Spinopelvic Parameters
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PARAMETERS.map((param) => (
            <article
              key={param.key}
              className="rounded-[8px] border border-[#E2E8F0] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-[#1E293B]">{param.name}</h3>
                <span className="rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono-numbers text-xs font-semibold text-[#0F5C7A]">
                  {param.range}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
                {param.definition}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="landmarks-heading" className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <LuCrosshair className="h-4 w-4 text-[#0F5C7A]" />
            <h2 id="landmarks-heading" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Landmark Sequence
            </h2>
          </div>
          <ol className="divide-y divide-[#F1F5F9]">
            {LANDMARKS.map((landmark, index) => (
              <li key={landmark.code} className="flex items-start gap-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] font-mono-numbers text-[11px] font-semibold text-[#64748B]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] px-1 py-0.5 font-mono text-[10px] text-[#64748B]">
                      {landmark.code}
                    </code>
                    <span className="text-xs font-semibold text-[#1E293B]">
                      {landmark.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {landmark.instruction}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="h-fit rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center gap-2">
            <LuInfo className="h-4 w-4 text-[#0F5C7A]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Placement Principles
            </h2>
          </div>
          <div className="mt-3 space-y-3 text-xs leading-relaxed text-[#64748B]">
            <div>
              <p className="font-semibold text-[#1E293B]">Endplate Margin Lines</p>
              <p className="mt-0.5">
                Mark anterior and posterior points along the cortical bone edge of each visible endplate plane.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#1E293B]">Pelvic Axis Reference</p>
              <p className="mt-0.5">
                The vertical axis runs through the midpoint of the superior S1 endplate to establish tilt and slope angles.
              </p>
            </div>
            <div className="border-t border-[#E2E8F0] pt-3">
              <p className="text-[11px] text-[#94A3B8]">
                Geometric identity: Pelvic Incidence = Pelvic Tilt + Sacral Slope.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
