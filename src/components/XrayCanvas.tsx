import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ImagePlus, RotateCcw, Undo2, Upload } from 'lucide-react';
import { LANDMARK_ORDER, type Landmarks, type Point } from '../types/spine';

interface XrayCanvasProps {
  imageBase64: string | null;
  width: number;
  height: number;
  landmarks: Partial<Landmarks>;
  selected: keyof Landmarks | null;
  processing: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onPlace: (key: keyof Landmarks, point: Point) => void;
  onDrag: (key: keyof Landmarks, point: Point) => void;
  onSelect: (key: keyof Landmarks) => void;
  onUndo: () => void;
  onReset: () => void;
}

const COLORS: Record<keyof Landmarks, string> = {
  fh:'#F59659', s1_ant:'#F59659', s1_post:'#38BDF8', l1_ant:'#FFFFFF',
  l1_post:'#38BDF8', l5_ant:'#FFFFFF', l5_post:'#38BDF8',
};

interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function XrayCanvas(p: XrayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef(p.landmarks);
  const dragRef = useRef<keyof Landmarks | null>(null);
  const frameRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  landmarksRef.current = p.landmarks;

  const imageRect = (containerWidth: number, containerHeight: number): ImageRect => {
    const scale = Math.min(containerWidth / p.width, containerHeight / p.height);
    const width = p.width * scale;
    const height = p.height * scale;
    return { x: (containerWidth - width) / 2, y: (containerHeight - height) / 2, width, height };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || p.width <= 0 || p.height <= 0) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.round(rect.width * dpr), ch = Math.round(rect.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#00183A'; ctx.fillRect(0, 0, rect.width, rect.height);
    const fittedImage = imageRect(rect.width, rect.height);
    if (imageRef.current) ctx.drawImage(imageRef.current, fittedImage.x, fittedImage.y, fittedImage.width, fittedImage.height);
    const pos = (point: Point) => ({
      x: fittedImage.x + (point.x / p.width) * fittedImage.width,
      y: fittedImage.y + (point.y / p.height) * fittedImage.height,
    });
    ctx.save(); ctx.lineWidth = 2; ctx.setLineDash([7,5]);
    for (const pair of [['s1_ant','s1_post'],['l1_ant','l1_post'],['l5_ant','l5_post']] as (keyof Landmarks)[][]) {
      const a = landmarksRef.current[pair[0]], b = landmarksRef.current[pair[1]];
      if (a && b) {
        const ap=pos(a), bp=pos(b);
        ctx.strokeStyle='#38BDF8'; ctx.beginPath(); ctx.moveTo(ap.x,ap.y); ctx.lineTo(bp.x,bp.y); ctx.stroke();
      }
    }
    ctx.restore();
    const fh = landmarksRef.current.fh;
    const s1Ant = landmarksRef.current.s1_ant;
    const s1Post = landmarksRef.current.s1_post;
    if (fh && s1Ant && s1Post) {
      const fhPosition = pos(fh);
      const s1AntPosition = pos(s1Ant);
      const s1PostPosition = pos(s1Post);
      const s1MidpointY = (s1AntPosition.y + s1PostPosition.y) / 2;
      ctx.save();
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#00183A';
      ctx.beginPath();
      ctx.moveTo(fhPosition.x, fhPosition.y);
      ctx.lineTo(fhPosition.x, s1MidpointY);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();
    }
    for (const key of LANDMARK_ORDER) {
      const point=landmarksRef.current[key]; if (!point) continue;
      const q=pos(point);
      ctx.beginPath(); ctx.arc(q.x,q.y,p.selected===key?10:8,0,Math.PI*2); ctx.fillStyle=p.selected===key?'#F59659':COLORS[key]; ctx.fill();
      ctx.lineWidth=p.selected===key?3:2; ctx.strokeStyle='#FFFFFF'; ctx.stroke();
      ctx.save(); ctx.font='700 11px Geist,Inter,system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.lineWidth=3; ctx.strokeStyle='#00183A'; ctx.fillStyle='#FFFFFF';
      const label=String(LANDMARK_ORDER.indexOf(key)+1); ctx.strokeText(label,q.x,q.y-18); ctx.fillText(label,q.x,q.y-18); ctx.restore();
    }
  };

  useEffect(() => {
    if (!p.imageBase64) { imageRef.current=null; return; }
    const image=new Image(); image.onload=()=>{imageRef.current=image;draw();}; image.src=p.imageBase64;
  }, [p.imageBase64]);
  useEffect(()=>{draw();},[p.landmarks,p.selected,p.width,p.height,p.imageBase64]);
  useEffect(()=>{const resize=()=>draw();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[p.width,p.height]);

  const canvasPoint=(event:ReactPointerEvent<HTMLCanvasElement>,clampToImage=false):{point:Point;x:number;y:number}|null=>{
    const r=event.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height || p.width <= 0 || p.height <= 0) return null;
    const fittedImage = imageRect(r.width, r.height);
    let x = event.clientX - r.left;
    let y = event.clientY - r.top;
    if (clampToImage) {
      x = Math.min(Math.max(x, fittedImage.x), fittedImage.x + fittedImage.width);
      y = Math.min(Math.max(y, fittedImage.y), fittedImage.y + fittedImage.height);
    } else if (x < fittedImage.x || x > fittedImage.x + fittedImage.width ||
        y < fittedImage.y || y > fittedImage.y + fittedImage.height) return null;
    return {
      point: {
        x: ((x - fittedImage.x) / fittedImage.width) * p.width,
        y: ((y - fittedImage.y) / fittedImage.height) * p.height,
      },
      x,
      y,
    };
  };
  const findHit=(x:number,y:number):keyof Landmarks|null=>{
    const canvas=canvasRef.current;if(!canvas)return null;
    const r=canvas.getBoundingClientRect(),fittedImage=imageRect(r.width,r.height);
    for(let i=LANDMARK_ORDER.length-1;i>=0;i--){
      const key=LANDMARK_ORDER[i],q=landmarksRef.current[key];if(!q)continue;
      const ex=fittedImage.x+(q.x/p.width)*fittedImage.width;
      const ey=fittedImage.y+(q.y/p.height)*fittedImage.height;
      if(Math.hypot(x-ex,y-ey)<=14)return key;
    } return null;
  };
  const down=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(!p.imageBase64)return;
    const mapped=canvasPoint(event);if(!mapped)return;
    const hit=findHit(mapped.x,mapped.y);
    if(hit){dragRef.current=hit;p.onSelect(hit);event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);}
    else {const next=LANDMARK_ORDER.find(key=>!landmarksRef.current[key]);if(next)p.onPlace(next,mapped.point);}
  };
  const move=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    const mapped=canvasPoint(event,dragRef.current!==null);
    if(!mapped){if(!dragRef.current)event.currentTarget.style.cursor='crosshair';return;}
    if(!dragRef.current){event.currentTarget.style.cursor=findHit(mapped.x,mapped.y)?'grab':'crosshair';return;}
    event.currentTarget.style.cursor='grabbing';const key=dragRef.current;
    landmarksRef.current={...landmarksRef.current,[key]:mapped.point};
    if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);
    frameRef.current=requestAnimationFrame(()=>{frameRef.current=null;draw();p.onDrag(key,mapped.point);});
  };
  const up=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(dragRef.current){if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);dragRef.current=null;setDragging(false);event.currentTarget.style.cursor='crosshair';}
  };
  const upload=(file?:File)=>{if(file){p.onUpload(file);if(fileRef.current)fileRef.current.value='';}};
  return (
    <section className="overflow-hidden rounded-md border border-[#00183A] bg-[#00183A]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 px-3 py-2">
        <button type="button" onClick={()=>fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-sm bg-[#F59659] px-3 py-2 text-sm font-semibold text-[#00183A] hover:bg-[#E28346] focus:outline-none focus:ring-2 focus:ring-white"><Upload aria-hidden="true" className="h-4 w-4"/>Upload X-Ray</button>
        <input ref={fileRef} className="hidden" type="file" accept=".dcm,.png,.jpg,.jpeg,image/png,image/jpeg" onChange={e=>upload(e.target.files?.[0])}/>
        <div className="flex items-center gap-1">
          <button type="button" onClick={p.onUndo} disabled={!LANDMARK_ORDER.some(k=>p.landmarks[k])} className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-2 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"><Undo2 aria-hidden="true" className="h-4 w-4"/>Undo</button>
          <button type="button" onClick={p.onReset} disabled={!LANDMARK_ORDER.some(k=>p.landmarks[k])} className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-2 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw aria-hidden="true" className="h-4 w-4"/>Reset</button>
        </div>
      </div>
      {p.error&&<div className="border-b border-[#B91C1C] bg-[#00183A] px-4 py-3 text-sm font-medium text-white" role="alert">{p.error}</div>}
      {p.imageBase64?<div className="relative bg-[#00183A] p-3">
        {p.processing&&<div className="absolute inset-3 z-10 flex items-center justify-center bg-[#00183A]/80 text-sm font-semibold text-white">Processing image...</div>}
        <canvas ref={canvasRef} role="img" aria-label="Interactive X-Ray landmark canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          className="block max-h-[680px] w-full touch-none rounded-md" style={{aspectRatio:`${p.width} / ${p.height}`,cursor:dragging?'grabbing':'crosshair'}}/>
      </div>:<button type="button" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();upload(e.dataTransfer.files?.[0]);}}
        className="flex min-h-[420px] w-full flex-col items-center justify-center px-6 text-center text-[#CBD5E1] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#F59659]">
        {p.processing?<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64748B] border-t-[#F59659]"/>:<ImagePlus aria-hidden="true" className="h-12 w-12 text-[#64748B]"/>}
        <span className="mt-4 text-base font-semibold text-white">{p.processing?'Processing X-Ray...':'Upload a lateral X-Ray'}</span>
        <span className="mt-1 text-sm text-[#CBD5E1]">DICOM, PNG, JPG or JPEG</span>
      </button>}
    </section>
  );
}
