import { useMemo, useRef, useState } from 'react';
import { Activity, ImageOff, LoaderCircle } from 'lucide-react';
import XrayCanvas from '../components/XrayCanvas';
import LandmarkChecklist from '../components/LandmarkChecklist';
import ResultCard from '../components/ResultCard';
import type { Landmarks, Point, PredictResponse, SpinopelvicFeatures, XrayProcessResponse } from '../types/spine';
import { LANDMARK_ORDER } from '../types/spine';
import { processXray, predictSingle } from '../services/api';
import { computeSpinopelvicFeatures } from '../utils/geometry';

const FEATURES: {key:keyof SpinopelvicFeatures;label:string;unit:string}[]=[
  {key:'pelvic_incidence',label:'Pelvic incidence',unit:'°'},
  {key:'pelvic_tilt',label:'Pelvic tilt',unit:'°'},
  {key:'lumbar_lordosis_angle',label:'Lumbar lordosis',unit:'°'},
  {key:'sacral_slope',label:'Sacral slope',unit:'°'},
  {key:'pelvic_radius',label:'Pelvic radius',unit:' mm'},
  {key:'degree_spondylolisthesis',label:'Spondylolisthesis',unit:' mm'},
];

function isCompleteLandmarks(value: Partial<Landmarks>): value is Landmarks {
  return LANDMARK_ORDER.every((key) => {
    const point = value[key];
    return point !== undefined &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y);
  });
}

export default function XrayAnalyzerPage(){
  const [processed,setProcessed]=useState<XrayProcessResponse|null>(null);
  const [landmarks,setLandmarks]=useState<Partial<Landmarks>>({});
  const [selected,setSelected]=useState<keyof Landmarks|null>('fh');
  const [processing,setProcessing]=useState(false);
  const [uploadError,setUploadError]=useState<string|null>(null);
  const [prediction,setPrediction]=useState<PredictResponse|null>(null);
  const [predictionLoading,setPredictionLoading]=useState(false);
  const [predictionError,setPredictionError]=useState<string|null>(null);
  const predictionRequestRef=useRef(0);
  const nextKey=LANDMARK_ORDER.find(key=>!landmarks[key]);
  const features=useMemo<SpinopelvicFeatures|null>(()=>{
    if(!processed||!isCompleteLandmarks(landmarks))return null;
    return computeSpinopelvicFeatures(landmarks,processed.pixel_spacing_mm);
  },[processed,landmarks]);
  const clearResult=()=>{
    predictionRequestRef.current+=1;
    setPrediction(null);
    setPredictionError(null);
    setPredictionLoading(false);
  };
  const handleUpload=async(file:File)=>{
    setProcessing(true);setUploadError(null);clearResult();
    try{const result=await processXray(file);setProcessed(result);setLandmarks({});setSelected('fh');}
    catch(error){setUploadError(error instanceof Error?error.message:'Failed to process the uploaded X-Ray');}
    finally{setProcessing(false);}
  };
  const place=(key:keyof Landmarks,point:Point)=>{
    setLandmarks(current=>({...current,[key]:point}));clearResult();
    const index=LANDMARK_ORDER.indexOf(key);setSelected(LANDMARK_ORDER[index+1]??key);
  };
  const drag=(key:keyof Landmarks,point:Point)=>{
    setLandmarks(current=>({...current,[key]:point}));
    clearResult();
  };
  const undo=()=>{
    const key=[...LANDMARK_ORDER].reverse().find(item=>landmarks[item]);if(!key)return;
    setLandmarks(current=>{const next={...current};delete next[key];return next;});setSelected(key);clearResult();
  };
  const reset=()=>{setLandmarks({});setSelected('fh');clearResult();};
  const selectLandmark=(key:keyof Landmarks)=>{
    setSelected(landmarks[key]?key:nextKey??key);
  };
  const predict=async()=>{
    if(!features)return;
    const requestId=++predictionRequestRef.current;
    setPredictionLoading(true);setPredictionError(null);setPrediction(null);
    try{
      const result=await predictSingle(features);
      if(requestId===predictionRequestRef.current)setPrediction(result);
    }
    catch(error){
      if(requestId===predictionRequestRef.current)setPredictionError(error instanceof Error?error.message:'Prediction request failed');
    }
    finally{
      if(requestId===predictionRequestRef.current)setPredictionLoading(false);
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Clinical imaging</p><div className="mt-1 flex items-center gap-2"><Activity aria-hidden="true" className="h-5 w-5 text-[#00183A]" strokeWidth={1.5}/><h2 className="text-2xl font-semibold text-[#00183A]">X-Ray Analyzer</h2></div>
          <p className="mt-1 text-sm text-[#64748B]">Place seven landmarks to calculate spinopelvic measurements.</p></div>
        <div className="inline-flex items-center gap-2 self-start rounded-sm border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#64748B] sm:self-auto"><ImageOff aria-hidden="true" className="h-4 w-4"/><span><strong className="text-[#00183A]">Samples:</strong> no bundled samples yet</span></div>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <XrayCanvas imageBase64={processed?.image_base64??null} width={processed?.width??1} height={processed?.height??1}
            landmarks={landmarks} selected={selected} processing={processing} error={uploadError}
            onUpload={handleUpload} onPlace={place} onDrag={drag} onSelect={setSelected} onUndo={undo} onReset={reset}/>
          {features&&<section className="rounded-md border border-[#E2E8F0] bg-white" aria-labelledby="measurements-title">
            <div className="border-b border-[#E2E8F0] px-4 py-3"><h2 id="measurements-title" className="text-sm font-semibold text-[#00183A]">Calculated measurements</h2></div>
            <dl className="grid grid-cols-2 divide-x divide-y divide-[#E2E8F0] md:grid-cols-3 md:divide-y-0">
              {FEATURES.map(feature=><div key={feature.key} className="px-4 py-3"><dt className="text-xs font-medium text-[#64748B]">{feature.label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[#00183A]">{features[feature.key].toFixed(2)}<span className="ml-1 text-sm font-medium text-[#64748B]">{feature.unit}</span></dd></div>)}
            </dl>
          </section>}
        </div>
        <aside className="space-y-4">
          <LandmarkChecklist landmarks={landmarks} selected={selected} nextKey={nextKey} onSelect={selectLandmark}/>
          <button type="button" onClick={predict} disabled={!features||predictionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#F59659] px-4 py-3 text-sm font-semibold text-[#00183A] hover:bg-[#E28346] focus:outline-none focus:ring-2 focus:ring-[#00183A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B]">
            {predictionLoading?<><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin"/>Predicting...</>:'Predict Spine Health'}
          </button>
          <ResultCard data={prediction} loading={predictionLoading} error={predictionError}/>
        </aside>
      </div>
    </div>
  );
}
