import { useRef, useEffect, useCallback, useState } from "react";
import { Eraser, PenLine, Undo2 } from "lucide-react";
import { GOLD, NAVY } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value: string;
  onChange: (v: string) => void;
  onSave?: () => void;
}

interface Point {
  x: number;
  y: number;
  t: number;
}

const PAD_HEIGHT = 200;

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const points = useRef<Point[]>([]);
  const strokes = useRef<ImageData[]>([]);
  const hasInk = useRef(Boolean(value));
  const [empty, setEmpty] = useState(!value);
  const [canUndo, setCanUndo] = useState(false);
  const [active, setActive] = useState(false);

  const cssSize = () => ({
    width: Math.max(wrapRef.current?.clientWidth ?? 1, 1),
    height: PAD_HEIGHT,
  });

  const configureContext = (canvas: HTMLCanvasElement) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = cssSize();
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = NAVY;
    ctx.fillStyle = NAVY;
    return ctx;
  };

  const drawImageFit = (ctx: CanvasRenderingContext2D, src: string) => {
    const { width, height } = cssSize();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = src;
  };

  const resizeCanvas = useCallback((preserve: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = preserve && hasInk.current ? canvas.toDataURL("image/png") : null;
    const ctx = configureContext(canvas);
    if (!ctx) return;
    const { width, height } = cssSize();
    ctx.clearRect(0, 0, width, height);
    if (snapshot?.startsWith("data:image")) {
      drawImageFit(ctx, snapshot);
    }
    strokes.current = [];
    setCanUndo(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = configureContext(canvas);
    if (!ctx) return;
    if (value) {
      drawImageFit(ctx, value);
      hasInk.current = true;
      setEmpty(false);
    }

    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resizeCanvas(true));
    });
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [resizeCanvas]);

  const getPoint = (e: PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: e.timeStamp,
    };
  };

  const pushSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    try {
      strokes.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (strokes.current.length > 30) strokes.current.shift();
      setCanUndo(true);
    } catch {
      /* ignore */
    }
  };

  const drawSegment = (a: Point, b: Point, c: Point) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const dist = Math.hypot(c.x - b.x, c.y - b.y);
    const dt = Math.max(c.t - b.t, 1);
    const velocity = dist / dt;
    const width = Math.max(1.1, Math.min(3.6, 3.4 - velocity * 1.5));

    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = NAVY;
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(b.x, b.y, c.x, c.y);
    ctx.stroke();
  };

  const onPointerDown = useCallback((e: PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    setActive(true);
    pushSnapshot();

    const point = getPoint(e);
    points.current = [point];

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.fillStyle = NAVY;
    ctx.arc(point.x, point.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
    hasInk.current = true;
    setEmpty(false);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const point = getPoint(e);
    const pts = points.current;
    pts.push(point);
    if (pts.length < 3) return;

    const p0 = pts[pts.length - 3];
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];
    const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2, t: p0.t };
    const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, t: p2.t };
    drawSegment(mid1, p1, mid2);
  }, []);

  const finishStroke = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    setActive(false);

    const pts = points.current;
    if (pts.length === 2) {
      drawSegment(pts[0], pts[0], pts[1]);
    }
    points.current = [];

    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", finishStroke);
    canvas.addEventListener("pointercancel", finishStroke);
    canvas.addEventListener("lostpointercapture", finishStroke);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", finishStroke);
      canvas.removeEventListener("pointercancel", finishStroke);
      canvas.removeEventListener("lostpointercapture", finishStroke);
    };
  }, [onPointerDown, onPointerMove, finishStroke]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height } = cssSize();
    ctx.clearRect(0, 0, width, height);
    strokes.current = [];
    hasInk.current = false;
    setCanUndo(false);
    setEmpty(true);
    onChange("");
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const snapshot = strokes.current.pop();
    if (!canvas || !ctx || !snapshot) return;
    ctx.putImageData(snapshot, 0, 0);
    setCanUndo(strokes.current.length > 0);

    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    const isBlank = canvas.toDataURL() === blank.toDataURL();
    hasInk.current = !isBlank;
    setEmpty(isBlank);
    onChange(isBlank ? "" : canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2.5">
      <div
        ref={wrapRef}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-[#FFFEFB] transition-all duration-200",
          active
            ? "border-[#F7931E] shadow-[0_0_0_3px_rgba(247,147,30,0.12)]"
            : "border-[#0B1F3A]/12 hover:border-[#F7931E]/40",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #0B1F3A 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="pointer-events-none absolute inset-x-6 bottom-[52px] flex items-end gap-2">
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F7931E]/70">
            Sign
          </span>
          <div className="mb-0.5 h-px flex-1 bg-gradient-to-r from-[#0B1F3A]/25 via-[#0B1F3A]/15 to-transparent" />
        </div>

      

        <canvas
          ref={canvasRef}
          className="relative z-10 block w-full touch-none cursor-crosshair"
          style={{ height: PAD_HEIGHT }}
          aria-label="Signature drawing area"
        />

        {empty && !value && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E]/10 ring-1 ring-[#F7931E]/20">
              <PenLine className="h-5 w-5 text-[#F7931E]" strokeWidth={1.75} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#0B1F3A]/70">Sign here</p>
              <p className="mt-0.5 text-xs text-[#94A3B8]">Draw with mouse, trackpad, or finger</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] text-[#94A3B8]">
          Precise pointer tracking · smooth ink strokes
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-[#0B1F3A]/5 hover:text-[#0B1F3A] disabled:pointer-events-none disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={empty && !value}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-35"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </button>
          {!empty && value ? (
            <span className="ml-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
              Captured
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
