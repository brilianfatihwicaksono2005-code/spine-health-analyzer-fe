import { AlertTriangle, Crosshair, Info, Ruler } from 'lucide-react';

const PARAMETERS = [
  {
    name: 'Pelvic incidence',
    key: 'pelvic_incidence',
    range: '40–65°',
    definition: 'The angle between the line perpendicular to the superior S1 endplate and the line from the S1 midpoint to the femoral-head center.',
    interpretation: 'Higher or lower values can reflect different pelvic morphology and should be read with the other parameters.',
  },
  {
    name: 'Pelvic tilt',
    key: 'pelvic_tilt',
    range: '10–20°',
    definition: 'The angle between the vertical reference and the line connecting the femoral head midpoint to the S1 midpoint.',
    interpretation: 'Tilt indicates pelvic rotation in the sagittal plane and can change with posture or compensation.',
  },
  {
    name: 'Lumbar lordosis angle',
    key: 'lumbar_lordosis_angle',
    range: '40–60°',
    definition: 'The angle describing the sagittal curvature of the lumbar spine, commonly referenced by the L1 and S1 endplates.',
    interpretation: 'Variation may indicate flattening or increased curvature; compare against pelvic alignment.',
  },
  {
    name: 'Sacral slope',
    key: 'sacral_slope',
    range: '35–45°',
    definition: 'The angle between the superior S1 endplate and a horizontal reference line.',
    interpretation: 'Changes may be associated with pelvic orientation and lumbar compensation.',
  },
  {
    name: 'Pelvic radius',
    key: 'pelvic_radius',
    range: '110–140 mm',
    definition: 'The measured distance from the femoral head center to the posterior endpoint of S1.',
    interpretation: 'Use consistent landmark scale and units; this parameter is best interpreted with the angular measurements.',
  },
  {
    name: 'Degree spondylolisthesis',
    key: 'degree_spondylolisthesis',
    range: '<5 mm',
    definition: 'The L5 posterior-to-S1 posterior displacement projected along the S1 endplate/reference geometry used by this app.',
    interpretation: 'Values at or above the reference threshold warrant careful clinical review rather than automatic diagnosis.',
  },
] as const;

const LANDMARKS = [
  { code: 'fh', name: 'Femoral head', instruction: 'Place at the visible center of the femoral head.' },
  { code: 's1_ant', name: 'S1 anterior', instruction: 'Place on the anterior end of the superior S1 endplate.' },
  { code: 's1_post', name: 'S1 posterior', instruction: 'Place on the posterior end of the superior S1 endplate.' },
  { code: 'l1_ant', name: 'L1 anterior', instruction: 'Place on the anterior end of the selected L1 endplate.' },
  { code: 'l1_post', name: 'L1 posterior', instruction: 'Place on the posterior end of the selected L1 endplate.' },
  { code: 'l5_ant', name: 'L5 anterior', instruction: 'Place on the anterior end of the selected L5 endplate.' },
  { code: 'l5_post', name: 'L5 posterior', instruction: 'Place on the posterior end of the selected L5 endplate.' },
] as const;

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]" data-eyebrow>Clinical reference</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#00183A]">Anatomy &amp; Landmark Guide</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
            Interpret the six spinopelvic parameters and place landmarks consistently on the X-Ray canvas.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-sm border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#475569]">
          <AlertTriangle className="h-4 w-4 text-[#D97706]" />
          Reference ranges are not a standalone diagnosis
        </div>
      </header>

      <section aria-labelledby="parameters-heading">
        <div className="mb-3 flex items-center gap-2">
          <Ruler className="h-4 w-4 text-[#00183A]" strokeWidth={1.5} />
          <h3 id="parameters-heading" className="text-sm font-semibold text-[#00183A]">Six spinopelvic parameters</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PARAMETERS.map((parameter, index) => (
            <article
              key={parameter.key}
              className="relative overflow-hidden rounded-md border border-[#E2E8F0] bg-white p-4"
            >
              <div className="absolute left-0 top-0 h-full w-0.5 bg-[#00183A]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tabular-nums text-[#64748B]">0{index + 1}</p>
                  <h4 className="mt-1 font-semibold text-[#00183A]">{parameter.name}</h4>
                </div>
                <span className="shrink-0 rounded-sm border border-[#CBD5E1] bg-[#F2F2F2] px-2 py-1 text-sm font-semibold tabular-nums text-[#00183A]">
                  {parameter.range}
                </span>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]">Definition</dt>
                  <dd className="mt-1 leading-6 text-[#475569]">{parameter.definition}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]">Clinical interpretation</dt>
                  <dd className="mt-1 leading-6 text-[#64748B]">{parameter.interpretation}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]" aria-labelledby="landmarks-heading">
        <div className="rounded-md border border-[#E2E8F0] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-[#00183A]" strokeWidth={1.5} />
            <h3 id="landmarks-heading" className="text-sm font-semibold text-[#00183A]">Landmark placement order</h3>
          </div>
          <ol className="space-y-2">
            {LANDMARKS.map((landmark, index) => (
              <li key={landmark.code} className="flex gap-3 rounded-sm border border-[#E2E8F0] bg-[#F2F2F2] px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#CBD5E1] bg-white text-xs font-semibold tabular-nums text-[#00183A]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#00183A]">
                    <code className="mr-2 rounded-sm border border-[#E2E8F0] bg-white px-1.5 py-0.5 font-mono text-xs text-[#475569]">{landmark.code}</code>
                    {landmark.name}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#64748B]">{landmark.instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="h-fit rounded-md border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#00183A]" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-[#00183A]">X-Ray canvas instructions</h3>
          </div>
          <div className="mt-4 space-y-4 text-sm leading-6 text-[#475569]">
            <div>
              <h4 className="font-semibold text-[#00183A]">Endplate pair lines</h4>
              <p className="mt-1 text-[#64748B]">
                Place the anterior and posterior points together along each visible endplate. Keep the pair aligned to the bone surface rather than an estimate through soft tissue.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#00183A]">FH / S1 vertical reference</h4>
              <p className="mt-1 text-[#64748B]">
                Use the femoral head midpoint and the S1 midpoint to establish the vertical and pelvic reference line. Inspect the image and verify that both anatomical points are placed correctly.
              </p>
            </div>
            <div className="border-t border-[#E2E8F0] pt-4">
              <p className="text-xs leading-5 text-[#475569]">
                Confirm image scale and point placement before analysis. The displayed ranges are educational reference information, not sufficient for an individual diagnosis.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
