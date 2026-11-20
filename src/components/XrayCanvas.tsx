import { useEffect, useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { LuUpload, LuRotateCcw, LuUndo2, LuImage, LuLoaderCircle } from 'react-icons/lu';
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
  fh: '#0F5C7A',
  s1_ant: '#0F5C7A',
  s1_post: '#38BDF8',
  l1_ant: '#F8FAFC',
  l1_post: '#38BDF8',
  l5_ant: '#F8FAFC',
  l5_post: '#38BDF8',
};

interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getImageRect(containerWidth: number, containerHeight: number, imgWidth: number, imgHeight: number): ImageRect {
  const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;
  return { x: (containerWidth - width) / 2, y: (containerHeight - height) / 2, width, height };
}

export default function XrayCanvas(p: XrayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef(p.landmarks);
  const dragRef = useRef<keyof Landmarks | null>(null);
  const frameRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    landmarksRef.current = p.landmarks;
  }, [p.landmarks]);

  const draw = useCallback(() => {
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
    ctx.fillStyle = '#090B0E'; ctx.fillRect(0, 0, rect.width, rect.height);
    const fittedImage = getImageRect(rect.width, rect.height, p.width, p.height);
    if (imageRef.current) ctx.drawImage(imageRef.current, fittedImage.x, fittedImage.y, fittedImage.width, fittedImage.height);
    const pos = (point: Point) => ({
      x: fittedImage.x + (point.x / p.width) * fittedImage.width,
      y: fittedImage.y + (point.y / p.height) * fittedImage.height,
    });
    ctx.save(); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    for (const pair of [['s1_ant','s1_post'],['l1_ant','l1_post'],['l5_ant','l5_post']] as (keyof Landmarks)[][]) {
      const a = landmarksRef.current[pair[0]], b = landmarksRef.current[pair[1]];
      if (a && b) {
        const ap = pos(a), bp = pos(b);
        ctx.strokeStyle = '#38BDF8'; ctx.beginPath(); ctx.moveTo(ap.x, ap.y); ctx.lineTo(bp.x, bp.y); ctx.stroke();
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
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#090B0E';
      ctx.beginPath();
      ctx.moveTo(fhPosition.x, fhPosition.y);
      ctx.lineTo(fhPosition.x, s1MidpointY);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();
    }
    for (const key of LANDMARK_ORDER) {
      const point = landmarksRef.current[key]; if (!point) continue;
      const q = pos(point);
      ctx.beginPath(); ctx.arc(q.x, q.y, p.selected === key ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = p.selected === key ? '#0F5C7A' : COLORS[key]; ctx.fill();
      ctx.lineWidth = p.selected === key ? 2.5 : 1.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      ctx.save(); ctx.font = '600 10px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#090B0E'; ctx.fillStyle = '#FFFFFF';
      const label = String(LANDMARK_ORDER.indexOf(key) + 1);
      ctx.strokeText(label, q.x, q.y - 14); ctx.fillText(label, q.x, q.y - 14); ctx.restore();
    }
  }, [p.width, p.height, p.selected]);

  useEffect(() => {
    if (!p.imageBase64) { imageRef.current = null; draw(); return; }
    const image = new Image(); image.onload = () => { imageRef.current = image; draw(); }; image.src = p.imageBase64;
  }, [p.imageBase64, draw]);

  useEffect(() => { draw(); }, [p.landmarks, draw]);
  useEffect(() => { const resize = () => draw(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, [draw]);

  const canvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>, clampToImage = false): { point: Point; x: number; y: number } | null => {
    const r = event.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height || p.width <= 0 || p.height <= 0) return null;
    const fittedImage = getImageRect(r.width, r.height, p.width, p.height);
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

  const findHit = (x: number, y: number): keyof Landmarks | null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const fittedImage = getImageRect(r.width, r.height, p.width, p.height);
    for (let i = LANDMARK_ORDER.length - 1; i >= 0; i--) {
      const key = LANDMARK_ORDER[i], q = landmarksRef.current[key]; if (!q) continue;
      const ex = fittedImage.x + (q.x / p.width) * fittedImage.width;
      const ey = fittedImage.y + (q.y / p.height) * fittedImage.height;
      if (Math.hypot(x - ex, y - ey) <= 12) return key;
    } return null;
  };

  const down = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!p.imageBase64) return;
    const mapped = canvasPoint(event); if (!mapped) return;
    const hit = findHit(mapped.x, mapped.y);
    if (hit) {
      dragRef.current = hit; p.onSelect(hit); event.currentTarget.setPointerCapture(event.pointerId); setDragging(true);
    } else {
      const next = LANDMARK_ORDER.find(key => !landmarksRef.current[key]);
      if (next) p.onPlace(next, mapped.point);
    }
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const mapped = canvasPoint(event, dragRef.current !== null);
    if (!mapped) { if (!dragRef.current) event.currentTarget.style.cursor = 'crosshair'; return; }
    if (!dragRef.current) { event.currentTarget.style.cursor = findHit(mapped.x, mapped.y) ? 'grab' : 'crosshair'; return; }
    event.currentTarget.style.cursor = 'grabbing';
    const key = dragRef.current;
    landmarksRef.current = { ...landmarksRef.current, [key]: mapped.point };
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => { frameRef.current = null; draw(); p.onDrag(key, mapped.point); });
  };

  const up = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null; setDragging(false); event.currentTarget.style.cursor = 'crosshair';
    }
  };

  const upload = (file?: File) => {
    if (file) { p.onUpload(file); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <section className="overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#0F5C7A] px-3 text-xs font-semibold text-white transition hover:bg-[#0C4A62]"
          >
            <LuUpload className="h-3.5 w-3.5" />
            Upload X-Ray
          </button>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept=".dcm,.png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={p.onUndo}
            disabled={!LANDMARK_ORDER.some((k) => p.landmarks[k])}
            className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LuUndo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={p.onReset}
            disabled={!LANDMARK_ORDER.some((k) => p.landmarks[k])}
            className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LuRotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {p.error && (
        <div className="border-b border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-xs font-medium text-[#B91C1C]" role="alert">
          {p.error}
        </div>
      )}

      {p.imageBase64 ? (
        <div className="relative bg-[#090B0E] p-2">
          {p.processing && (
            <div className="absolute inset-2 z-10 flex items-center justify-center bg-[#090B0E]/80 text-xs font-medium text-[#F8FAFC]">
              <LuLoaderCircle className="mr-2 h-4 w-4 animate-spin text-[#0F5C7A]" />
              Processing image...
            </div>
          )}
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Lateral X-Ray landmark placement canvas"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className="block max-h-[640px] w-full touch-none rounded-[4px]"
            style={{ aspectRatio: `${p.width} / ${p.height}`, cursor: dragging ? 'grabbing' : 'crosshair' }}
          />
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files?.[0]); }}
          className="flex min-h-[360px] w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center transition hover:border-[#94A3B8] hover:bg-white"
        >
          {p.processing ? (
            <LuLoaderCircle className="h-7 w-7 animate-spin text-[#0F5C7A]" />
          ) : (
            <LuImage className="h-8 w-8 text-[#94A3B8]" />
          )}
          <span className="mt-3 text-xs font-semibold text-[#1E293B]">
            {p.processing ? 'Processing image...' : 'Select or drag lateral X-Ray file'}
          </span>
          <span className="mt-1 text-[11px] text-[#64748B]">
            Supports DICOM (.dcm), PNG, JPG
          </span>
        </div>
      )}
    </section>
  );
}
