// Interactive Canvas Editor: drag, multi-select, resize, rotate, snap, layers and non-destructive adjustments.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CanvasSchema, CanvasElement, FilterAdjustments } from "../types/canvas";
import { Type, Square, RotateCcw, Copy, Trash2, Lock, Unlock, Eye, EyeOff, FlipHorizontal, SlidersHorizontal, X } from "lucide-react";

interface CanvasEditorProps {
  canvas: CanvasSchema;
  onCanvasChange: (canvas: CanvasSchema) => void;
  onSelectElement?: (element: CanvasElement | null) => void;
}

type InteractionMode = "move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | "rotate";
interface InteractionState {
  mode: InteractionMode;
  startClientX: number;
  startClientY: number;
  primaryId: string;
  originals: Record<string, CanvasElement>;
}

const DEFAULT_FILTERS: FilterAdjustments = {
  brightness: 0, contrast: 0, saturation: 0, temperature: 0, exposure: 0,
  highlights: 0, shadows: 0, blur: 0, sharpen: 0, grayscale: 0, sepia: 0
};

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ canvas, onCanvasChange, onSelectElement }) => {
  const [activeTab, setActiveTab] = useState<"layers" | "properties" | "adjustments">("layers");
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 720, height: 520 });
  const interactionRef = useRef<InteractionState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const update = () => setViewportSize({ width: node.clientWidth || 720, height: node.clientHeight || 520 });
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(node);
    window.addEventListener("resize", update);
    return () => { observer?.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  const stageScale = useMemo(() => {
    const horizontalPadding = viewportSize.width < 640 ? 20 : 64;
    const verticalPadding = viewportSize.height < 420 ? 20 : 64;
    const fitWidth = Math.max(0.12, (viewportSize.width - horizontalPadding) / canvas.width);
    const fitHeight = Math.max(0.12, (viewportSize.height - verticalPadding) / canvas.height);
    return Math.min(1, fitWidth, fitHeight);
  }, [canvas.width, canvas.height, viewportSize]);
  const selectedIds = canvas.selectedElementIds || [];
  const primaryId = selectedIds[selectedIds.length - 1] || null;
  const selectedElement = canvas.elements.find((el) => el.id === primaryId) || null;

  const snap = (value: number) => canvas.snapToGrid ? Math.round(value / 10) * 10 : value;
  const updateCanvasElements = (elements: CanvasElement[], selected = selectedIds) =>
    onCanvasChange({ ...canvas, elements, selectedElementIds: selected });

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    updateCanvasElements(canvas.elements.map((el) => el.id === id ? { ...el, ...updates } : el));
  };

  const selectElement = (el: CanvasElement, additive = false) => {
    const next = additive
      ? selectedIds.includes(el.id) ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id]
      : [el.id];
    onCanvasChange({ ...canvas, selectedElementIds: next });
    onSelectElement?.(el);
  };

  const startInteraction = (e: React.PointerEvent, el: CanvasElement, mode: InteractionMode) => {
    if (el.isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    const ids = selectedIds.includes(el.id) ? selectedIds : [el.id];
    if (!selectedIds.includes(el.id)) onCanvasChange({ ...canvas, selectedElementIds: ids });
    const originals: Record<string, CanvasElement> = {};
    canvas.elements.forEach((item) => { if (ids.includes(item.id)) originals[item.id] = { ...item }; });
    interactionRef.current = { mode, startClientX: e.clientX, startClientY: e.clientY, primaryId: el.id, originals };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      const dx = (e.clientX - interaction.startClientX) / stageScale;
      const dy = (e.clientY - interaction.startClientY) / stageScale;
      const primary = interaction.originals[interaction.primaryId];
      if (!primary) return;

      const elements = canvas.elements.map((el) => {
        const original = interaction.originals[el.id];
        if (!original) return el;
        if (interaction.mode === "move") {
          return {
            ...el,
            x: Math.max(0, Math.min(canvas.width - original.width, snap(original.x + dx))),
            y: Math.max(0, Math.min(canvas.height - original.height, snap(original.y + dy)))
          };
        }
        if (el.id !== interaction.primaryId) return el;

        if (interaction.mode === "rotate") {
          const rect = stageRef.current?.getBoundingClientRect();
          if (!rect) return el;
          const centerX = rect.left + (original.x + original.width / 2) * stageScale;
          const centerY = rect.top + (original.y + original.height / 2) * stageScale;
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI + 90;
          return { ...el, rotation: Math.round(angle) };
        }

        let x = original.x, y = original.y, width = original.width, height = original.height;
        if (interaction.mode.includes("e")) width = Math.max(20, original.width + dx);
        if (interaction.mode.includes("s")) height = Math.max(20, original.height + dy);
        if (interaction.mode.includes("w")) {
          width = Math.max(20, original.width - dx);
          x = original.x + (original.width - width);
        }
        if (interaction.mode.includes("n")) {
          height = Math.max(20, original.height - dy);
          y = original.y + (original.height - height);
        }
        return { ...el, x: snap(Math.max(0, x)), y: snap(Math.max(0, y)), width: snap(width), height: snap(height) };
      });
      updateCanvasElements(elements, Object.keys(interaction.originals));
    };
    const onUp = () => { interactionRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [canvas, stageScale]);

  const addText = () => {
    const el: CanvasElement = {
      id: `el-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, type: "text", name: "New Text",
      x: 100, y: 100, width: 360, height: 70, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1,
      zIndex: canvas.elements.length + 1, isLocked: false, isVisible: true, content: "Nhập văn bản...",
      fontSize: 32, fontFamily: "sans-serif", fontWeight: "bold", color: "#ffffff", textAlign: "left"
    };
    updateCanvasElements([...canvas.elements, el], [el.id]);
  };

  const addShape = () => {
    const el: CanvasElement = {
      id: `el-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, type: "shape", name: "Rectangle",
      x: 150, y: 150, width: 260, height: 180, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1,
      zIndex: canvas.elements.length + 1, isLocked: false, isVisible: true, shapeType: "rectangle",
      fill: "#d97706", stroke: "#ffffff", strokeWidth: 2, borderRadius: 12
    };
    updateCanvasElements([...canvas.elements, el], [el.id]);
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const clone: CanvasElement = {
      ...selectedElement,
      id: `el-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
      name: `${selectedElement.name} Copy`, x: selectedElement.x + 20, y: selectedElement.y + 20,
      zIndex: Math.max(0, ...canvas.elements.map((e) => e.zIndex)) + 1
    };
    updateCanvasElements([...canvas.elements, clone], [clone.id]);
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    updateCanvasElements(canvas.elements.filter((el) => !selectedIds.includes(el.id)), []);
    onSelectElement?.(null);
  };

  const filterString = (el: CanvasElement) => {
    const f = el.filters;
    return f
      ? `brightness(${100 + (f.brightness || 0)}%) contrast(${100 + (f.contrast || 0)}%) saturate(${100 + (f.saturation || 0)}%) blur(${f.blur || 0}px) grayscale(${f.grayscale || 0}%) sepia(${f.sepia || 0}%)`
      : "none";
  };

  return (
    <div className="flex-1 flex bg-slate-950 text-slate-200 overflow-hidden relative">
      <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-12px)] bg-slate-900/95 border border-slate-800 rounded-xl px-2 sm:px-3 py-1.5 flex items-center gap-1 sm:gap-2 shadow-xl z-30 text-xs overflow-x-auto">
        <button onClick={addText} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"><Type className="w-3.5 h-3.5 text-amber-400"/>Text</button>
        <button onClick={addShape} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"><Square className="w-3.5 h-3.5 text-sky-400"/>Shape</button>
        <button onClick={duplicateSelected} disabled={!selectedElement} className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30" title="Duplicate"><Copy className="w-3.5 h-3.5"/></button>
        <button onClick={() => selectedElement && updateElement(selectedElement.id, { scaleX: selectedElement.scaleX * -1 })} disabled={!selectedElement} className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30" title="Flip Horizontal"><FlipHorizontal className="w-3.5 h-3.5"/></button>
        <button onClick={deleteSelected} disabled={!selectedIds.length} className="p-1.5 rounded hover:bg-rose-900/40 hover:text-rose-400 disabled:opacity-30" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
        <span className="hidden sm:inline text-[10px] text-slate-500 whitespace-nowrap">Shift+click multi-select • Grid {canvas.snapToGrid ? "ON" : "OFF"}</span>
        <button onClick={() => setMobileInspectorOpen(true)} className="lg:hidden p-1.5 rounded hover:bg-slate-800 text-amber-400" title="Layers & properties"><SlidersHorizontal className="w-3.5 h-3.5"/></button>
      </div>

      <div ref={viewportRef} className="flex-1 flex items-center justify-center p-2 sm:p-8 overflow-auto touch-pan-x touch-pan-y" onPointerDown={() => onCanvasChange({ ...canvas, selectedElementIds: [] })}>
        <div
          ref={stageRef}
          className="relative shadow-2xl border border-slate-800 overflow-hidden"
          style={{ width: canvas.width * stageScale, height: canvas.height * stageScale, backgroundColor: canvas.backgroundColor }}
        >
          {canvas.showGrid && (
            <div className="absolute inset-0 pointer-events-none opacity-15" style={{ backgroundImage: "linear-gradient(to right,#64748b 1px,transparent 1px),linear-gradient(to bottom,#64748b 1px,transparent 1px)", backgroundSize: `${10 * stageScale}px ${10 * stageScale}px` }} />
          )}
          {canvas.elements.slice().sort((a,b)=>a.zIndex-b.zIndex).map((el) => {
            if (!el.isVisible) return null;
            const selected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onPointerDown={(e) => { selectElement(el, e.shiftKey); startInteraction(e, el, "move"); }}
                className={`absolute select-none ${el.isLocked ? "cursor-not-allowed" : "cursor-move"} ${selected ? "ring-2 ring-amber-400" : ""}`}
                style={{
                  left: el.x * stageScale, top: el.y * stageScale, width: el.width * stageScale, height: el.height * stageScale,
                  opacity: el.opacity, transform: `rotate(${el.rotation}deg) scale(${el.scaleX},${el.scaleY})`, transformOrigin: "center", zIndex: el.zIndex
                }}
              >
                {el.type === "text" && <div className="w-full h-full overflow-hidden" style={{ fontSize: (el.fontSize || 24) * stageScale, fontFamily: el.fontFamily, fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign, lineHeight: el.lineHeight || 1.25 }}>{el.content}</div>}
                {el.type === "shape" && <div className="w-full h-full" style={{ backgroundColor: el.fill, border: `${(el.strokeWidth || 0) * stageScale}px solid ${el.stroke || "transparent"}`, borderRadius: (el.borderRadius || 0) * stageScale, filter: filterString(el) }} />}
                {(el.type === "image" || el.type === "logo") && el.imageUrl && <img src={el.imageUrl} alt={el.name} draggable={false} className="w-full h-full object-contain pointer-events-none" style={{ filter: filterString(el) }} />}

                {selected && !el.isLocked && el.id === primaryId && (
                  <>
                    {(["nw","ne","sw","se"] as const).map((corner) => (
                      <button key={corner} onPointerDown={(e) => startInteraction(e, el, `resize-${corner}` as InteractionMode)} className="absolute w-3 h-3 bg-white border border-amber-500 rounded-sm z-40" style={{ left: corner.includes("w") ? -6 : undefined, right: corner.includes("e") ? -6 : undefined, top: corner.includes("n") ? -6 : undefined, bottom: corner.includes("s") ? -6 : undefined }} aria-label={`Resize ${corner}`} />
                    ))}
                    <button onPointerDown={(e) => startInteraction(e, el, "rotate")} className="absolute left-1/2 -translate-x-1/2 -top-8 w-3 h-3 rounded-full bg-amber-400 border border-white z-40" aria-label="Rotate" />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-5 h-5 w-px bg-amber-400" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${mobileInspectorOpen ? "flex" : "hidden"} lg:flex absolute lg:static inset-x-2 bottom-2 lg:inset-auto h-[48%] lg:h-auto lg:w-80 bg-slate-900 border border-slate-700 lg:border-y-0 lg:border-r-0 lg:border-l lg:border-slate-800 flex-col text-xs z-50 rounded-xl lg:rounded-none shadow-2xl lg:shadow-none overflow-hidden`}>
        <div className="flex items-center border-b border-slate-800 p-1 bg-slate-950">
          <button onClick={() => setMobileInspectorOpen(false)} className="lg:hidden p-1.5 mr-1 rounded hover:bg-slate-800 text-slate-400" aria-label="Close inspector"><X className="w-3.5 h-3.5"/></button>
          {(["layers","properties","adjustments"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 rounded capitalize ${activeTab===tab ? "bg-slate-800 text-amber-400" : "text-slate-400"}`}>{tab}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {activeTab === "layers" && canvas.elements.slice().sort((a,b)=>b.zIndex-a.zIndex).map((el) => (
            <div key={el.id} onClick={() => selectElement(el)} className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer ${selectedIds.includes(el.id) ? "bg-slate-950 border-amber-500 text-amber-400" : "bg-slate-950/60 border-slate-800"}`}>
              <span className="truncate flex-1">{el.name}</span>
              <button onClick={(e)=>{e.stopPropagation();updateElement(el.id,{isLocked:!el.isLocked});}} className="p-1 text-slate-500">{el.isLocked?<Lock className="w-3.5 h-3.5"/>:<Unlock className="w-3.5 h-3.5"/>}</button>
              <button onClick={(e)=>{e.stopPropagation();updateElement(el.id,{isVisible:!el.isVisible});}} className="p-1 text-slate-500">{el.isVisible?<Eye className="w-3.5 h-3.5"/>:<EyeOff className="w-3.5 h-3.5"/>}</button>
            </div>
          ))}

          {activeTab === "properties" && selectedElement && (
            <div className="space-y-3">
              <div className="font-bold text-slate-200">{selectedElement.name}</div>
              <div className="grid grid-cols-2 gap-2">
                {([['X','x'],['Y','y'],['W','width'],['H','height'],['Rotate','rotation']] as const).map(([label,key]) => (
                  <label key={key} className="space-y-1"><span className="text-slate-500">{label}</span><input type="number" value={Math.round(selectedElement[key] as number)} onChange={(e)=>updateElement(selectedElement.id,{[key]:Number(e.target.value)} as any)} className="w-full bg-slate-950 border border-slate-800 rounded p-2"/></label>
                ))}
              </div>
              <label className="block space-y-1"><span className="text-slate-500">Opacity {Math.round(selectedElement.opacity*100)}%</span><input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity} onChange={(e)=>updateElement(selectedElement.id,{opacity:Number(e.target.value)})} className="w-full accent-amber-400"/></label>
              {selectedElement.type === "text" && <><label className="block space-y-1"><span className="text-slate-500">Text</span><textarea value={selectedElement.content || ""} onChange={(e)=>updateElement(selectedElement.id,{content:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 min-h-20"/></label><label className="block space-y-1"><span className="text-slate-500">Font Size</span><input type="number" value={selectedElement.fontSize || 24} onChange={(e)=>updateElement(selectedElement.id,{fontSize:Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded p-2"/></label></>}
            </div>
          )}

          {activeTab === "adjustments" && selectedElement && (
            <div className="space-y-3">
              <button onClick={()=>updateElement(selectedElement.id,{filters:{...DEFAULT_FILTERS}, imageUrl:selectedElement.originalImageUrl || selectedElement.imageUrl})} className="flex items-center gap-1 text-slate-400 hover:text-amber-400"><RotateCcw className="w-3.5 h-3.5"/>Reset</button>
              {([['Brightness','brightness',-100,100],['Contrast','contrast',-100,100],['Saturation','saturation',-100,100],['Blur','blur',0,30],['Grayscale','grayscale',0,100],['Sepia','sepia',0,100]] as const).map(([label,key,min,max]) => {
                const filters = { ...DEFAULT_FILTERS, ...(selectedElement.filters || {}) };
                return <label key={key} className="block space-y-1"><span className="flex justify-between text-slate-400"><span>{label}</span><span>{filters[key]}</span></span><input type="range" min={min} max={max} value={filters[key]} onChange={(e)=>updateElement(selectedElement.id,{filters:{...filters,[key]:Number(e.target.value)}})} className="w-full accent-amber-400"/></label>;
              })}
            </div>
          )}

          {!selectedElement && activeTab !== "layers" && <div className="text-slate-500 text-center py-12">Select an element to edit properties.</div>}
        </div>
      </div>
    </div>
  );
};
