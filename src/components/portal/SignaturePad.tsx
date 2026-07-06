import { useRef, useEffect, useCallback, useState } from "react";
import { PenLine, RefreshCw, Info } from "lucide-react";
import { NAVY } from "@/lib/constants";
import { Button } from "./Button";

interface SignaturePadProps {
  value: string;
  onChange: (v: string) => void;
  onSave?: () => void;
}

export function SignaturePad({ value, onChange, onSave }: SignaturePadProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  const pos = (e: MouseEvent | TouchEvent, r: DOMRect) =>
    "touches" in e
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };

  const start = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault(); drawing.current = true;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = pos(e, ref.current!.getBoundingClientRect());
    ctx.beginPath(); ctx.moveTo(x, y); setEmpty(false);
  }, []);

  const move = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault(); if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const { x, y } = pos(e, ref.current!.getBoundingClientRect());
    ctx.lineTo(x, y); ctx.stroke();
  }, []);

  const end = useCallback(() => {
    drawing.current = false;
    onChange(ref.current!.toDataURL());
  }, [onChange]);

  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true); onChange("");
  };

  useEffect(() => {
    const c = ref.current!;
    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); c.addEventListener("mouseup", end);
    c.addEventListener("touchstart", start, { passive: false }); c.addEventListener("touchmove", move, { passive: false }); c.addEventListener("touchend", end);
    return () => {
      c.removeEventListener("mousedown", start); c.removeEventListener("mousemove", move); c.removeEventListener("mouseup", end);
      c.removeEventListener("touchstart", start); c.removeEventListener("touchmove", move); c.removeEventListener("touchend", end);
    };
  }, [start, move, end]);

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-[#F7931E]/30 bg-white hover:border-[#F7931E]/50 transition-colors">
        <div className="absolute bottom-10 left-8 right-8 h-px bg-[#0B1F3A]/8" />
        <canvas ref={ref} width={700} height={180} className="w-full cursor-crosshair touch-none relative z-10" />
        {empty && !value && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
            <PenLine className="w-8 h-8 text-[#F7931E]/30 mb-2" />
            <p className="text-[#94A3B8] text-sm">Draw your signature above</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 px-1 flex-wrap gap-2">
        <p className="text-[#94A3B8] text-xs flex items-center gap-1.5"><Info className="w-3 h-3" />Use mouse or touchscreen</p>
        <div className="flex gap-2">
          <button onClick={clear} className="text-xs text-[#64748B] hover:text-[#0B1F3A] flex items-center gap-1 font-medium">
            <RefreshCw className="w-3 h-3" /> Clear
          </button>
          {onSave && <Button variant="outline" onClick={onSave} className="!py-1.5 !px-3 text-xs">Save</Button>}
        </div>
      </div>
      {value && (
        <div className="mt-3 p-3 bg-[#F8F9FC] rounded-xl border border-[#0B1F3A]/8">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Signature Preview</p>
          <img src={value} alt="Signature" className="h-12 object-contain" />
        </div>
      )}
    </div>
  );
}
