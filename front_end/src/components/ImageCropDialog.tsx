import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  onCropped: (file: File) => void;
  title?: string;
  outputSize?: number; // final square size in pixels
};

export default function ImageCropDialog({ open, onOpenChange, src, onCropped, title = "Crop Profile Photo", outputSize = 512 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [imgBounds, setImgBounds] = useState<{ x: number; y: number; w: number; h: number; nw: number; nh: number } | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number; size: number } | null>(null); // square selection
  const actionRef = useRef<null | { type: "move" | "resize"; corner?: "tl" | "tr" | "bl" | "br"; startX: number; startY: number; startCrop: { x: number; y: number; size: number }; bounds: { x: number; y: number; w: number; h: number } }>(null);

  // Reset when src changes
  useEffect(() => {
    setImgLoaded(false);
    setImgBounds(null);
    setCrop(null);
  }, [src]);

  function computeBounds() {
    const img = imgRef.current;
    const cont = containerRef.current;
    if (!img || !cont) return;
    const ib = img.getBoundingClientRect();
    const cb = cont.getBoundingClientRect();
    const x = ib.left - cb.left;
    const y = ib.top - cb.top;
    const w = ib.width;
    const h = ib.height;
    const nw = img.naturalWidth || w;
    const nh = img.naturalHeight || h;
    const b = { x, y, w, h, nw, nh };
    setImgBounds(b);
    // Initialize to full-size square (based on smaller visible dimension)
    const side = Math.min(w, h);
    setCrop({ x: x + (w - side) / 2, y: y + (h - side) / 2, size: side });
  }

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  function startMove(e: React.PointerEvent) {
    if (!crop || !imgBounds) return;
    actionRef.current = {
      type: "move",
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
      bounds: { x: imgBounds.x, y: imgBounds.y, w: imgBounds.w, h: imgBounds.h },
    };
    (e.target as HTMLElement).setPointerCapture?.((e as any).pointerId);
  }

  function startResize(corner: "tl" | "tr" | "bl" | "br") {
    return (e: React.PointerEvent) => {
      if (!crop || !imgBounds) return;
      e.preventDefault();
      e.stopPropagation();
      actionRef.current = {
        type: "resize",
        corner,
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...crop },
        bounds: { x: imgBounds.x, y: imgBounds.y, w: imgBounds.w, h: imgBounds.h },
      };
      (e.target as HTMLElement).setPointerCapture?.((e as any).pointerId);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const act = actionRef.current;
    if (!act) return;
    e.preventDefault();
    const dx = e.clientX - act.startX;
    const dy = e.clientY - act.startY;
    const minSize = 40;
    if (act.type === "move") {
      const nx = clamp(act.startCrop.x + dx, act.bounds.x, act.bounds.x + act.bounds.w - act.startCrop.size);
      const ny = clamp(act.startCrop.y + dy, act.bounds.y, act.bounds.y + act.bounds.h - act.startCrop.size);
      setCrop({ x: nx, y: ny, size: act.startCrop.size });
      return;
    }
    // Resize square from corners by anchoring the opposite corner
    const c = act.corner!;
    const b = act.bounds;
    const sc = act.startCrop;
    let pointerX = clamp(e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), b.x, b.x + b.w);
    let pointerY = clamp(e.clientY - (containerRef.current?.getBoundingClientRect().top || 0), b.y, b.y + b.h);
    let newSize = sc.size;
    let newX = sc.x;
    let newY = sc.y;
    if (c === "tl") {
      const ax = sc.x + sc.size;
      const ay = sc.y + sc.size;
      const maxSize = Math.min(ax - b.x, ay - b.y);
      newSize = clamp(Math.min(ax - pointerX, ay - pointerY), minSize, maxSize);
      newX = ax - newSize;
      newY = ay - newSize;
    } else if (c === "tr") {
      const ax = sc.x;
      const ay = sc.y + sc.size;
      const maxSize = Math.min(b.x + b.w - ax, ay - b.y);
      newSize = clamp(Math.min(pointerX - ax, ay - pointerY), minSize, maxSize);
      newX = ax;
      newY = ay - newSize;
    } else if (c === "bl") {
      const ax = sc.x + sc.size;
      const ay = sc.y;
      const maxSize = Math.min(ax - b.x, b.y + b.h - ay);
      newSize = clamp(Math.min(ax - pointerX, pointerY - ay), minSize, maxSize);
      newX = ax - newSize;
      newY = ay;
    } else {
      // br
      const ax = sc.x;
      const ay = sc.y;
      const maxSize = Math.min(b.x + b.w - ax, b.y + b.h - ay);
      newSize = clamp(Math.min(pointerX - ax, pointerY - ay), minSize, maxSize);
      newX = ax;
      newY = ay;
    }
    setCrop({ x: newX, y: newY, size: newSize });
  }

  function onPointerUp() {
    actionRef.current = null;
  }

  // Ensure bounds are computed when dialog opens and layout settles
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => computeBounds());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Recompute on container resize to avoid cases where the crop box doesn't appear
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => computeBounds());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, imgLoaded]);

  async function handleCrop() {
    try {
      const el = imgRef.current;
      const b = imgBounds;
      const c = crop;
      if (!el || !b || !c) return;
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaleX = b.nw / b.w;
      const scaleY = b.nh / b.h;
      const sx = (c.x - b.x) * scaleX;
      const sy = (c.y - b.y) * scaleY;
      const sSide = c.size * scaleX; // assume square; use X scale

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(el, sx, sy, sSide, sSide, 0, 0, outputSize, outputSize);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) return;
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      onCropped(file);
      onOpenChange(false);
    } catch (_) {
      // ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {!src ? (
          <div className="text-sm text-muted-foreground">No image selected.</div>
        ) : (
          <div className="space-y-4">
            <div
              ref={containerRef}
              className="relative mx-auto w-full max-w-[640px] min-h-[320px] max-h-[60vh] bg-muted rounded-lg overflow-hidden flex items-center justify-center"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <img
                ref={imgRef}
                src={src}
                alt="Selected"
                className="select-none"
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  objectFit: "contain",
                  display: "block",
                }}
                onLoad={() => {
                  setImgLoaded(true);
                  computeBounds();
                }}
              />

              {imgLoaded && imgBounds && crop && (
                <>
                  {/* Shaded overlays around selection */}
                  <div className="absolute bg-black/40 pointer-events-none" style={{ left: 0, top: 0, width: "100%", height: crop.y }} />
                  <div className="absolute bg-black/40 pointer-events-none" style={{ left: 0, top: crop.y, width: crop.x, height: crop.size }} />
                  <div className="absolute bg-black/40 pointer-events-none" style={{ left: crop.x + crop.size, top: crop.y, width: `calc(100% - ${crop.x + crop.size}px)`, height: crop.size }} />
                  <div className="absolute bg-black/40 pointer-events-none" style={{ left: 0, top: crop.y + crop.size, width: "100%", height: `calc(100% - ${crop.y + crop.size}px)` }} />

                  {/* Selection box */}
                  <div
                    className="absolute border-2 border-primary cursor-move z-[2]"
                    style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size }}
                    onPointerDown={startMove}
                  >
                    {/* Corner handles */}
                    <div className="absolute w-5 h-5 bg-primary rounded-sm -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize z-[3] ring-2 ring-background" style={{ left: 0, top: 0 }} onPointerDown={startResize("tl")} />
                    <div className="absolute w-5 h-5 bg-primary rounded-sm translate-x-1/2 -translate-y-1/2 cursor-nesw-resize z-[3] ring-2 ring-background" style={{ left: "100%", top: 0 }} onPointerDown={startResize("tr")} />
                    <div className="absolute w-5 h-5 bg-primary rounded-sm -translate-x-1/2 translate-y-1/2 cursor-nesw-resize z-[3] ring-2 ring-background" style={{ left: 0, top: "100%" }} onPointerDown={startResize("bl")} />
                    <div className="absolute w-5 h-5 bg-primary rounded-sm translate-x-1/2 translate-y-1/2 cursor-nwse-resize z-[3] ring-2 ring-background" style={{ left: "100%", top: "100%" }} onPointerDown={startResize("br")} />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCrop} disabled={!imgLoaded || !crop}>Crop & Save</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
