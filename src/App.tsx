// Main Application: HNL Creative AI Studio

import React, { useState, useEffect, useRef } from "react";
import { ProjectSchema, AssetSchema, BrandKitSchema, TimelineSchema, StoryboardSchema, CanvasSchema } from "./types";
import { storage } from "./storage/db";
import { historyEngine } from "./core/history";
import { HeaderNav } from "./components/HeaderNav";
import { AssetLibraryPanel } from "./components/AssetLibraryPanel";
import { CanvasEditor } from "./components/CanvasEditor";
import { TimelineEditor } from "./components/TimelineEditor";
import { CreativeDirectorPanel } from "./components/CreativeDirectorPanel";
import { FashionTryOnStudio } from "./components/FashionTryOnStudio";
import { ProductStudioModal } from "./components/ProductStudioModal";
import { TemplateDesignerModal } from "./components/TemplateDesignerModal";
import { DocumentImportModal } from "./components/DocumentImportModal";
import { GoldenTestModal } from "./components/GoldenTestModal";
import { BrandKitModal } from "./components/BrandKitModal";
import { ExportModal } from "./components/ExportModal";
import { VideoAIStudio } from "./components/VideoAIStudio";
import { AISettingsModal } from "./components/AISettingsModal";
import { dataUrlToBlob } from "./utils/media";

const DEFAULT_BRAND_KIT: BrandKitSchema = {
  id: "default-brand", name: "HNL Creative Studio", primaryColor: "#f59e0b", secondaryColor: "#0284c7", accentColor: "#10b981",
  backgroundColor: "#0f172a", textColor: "#ffffff", headingFont: "sans-serif", bodyFont: "sans-serif", socialLinks: {}
};

const DEFAULT_TIMELINE: TimelineSchema = {
  currentTime: 0, duration: 30, zoom: 40, fps: 30, snapToGrid: true, rippleEdit: true,
  tracks: [
    { id: "track-v1", label: "VIDEO 1 (Main)", type: "video", order: 1, isLocked: false, isMuted: false, isSolo: false, isVisible: true, volume: 1, clips: [] },
    { id: "track-t1", label: "TEXT 1 (Titles)", type: "text", order: 2, isLocked: false, isMuted: false, isSolo: false, isVisible: true, volume: 1, clips: [] },
    { id: "track-a1", label: "AUDIO 1 (Music)", type: "audio", order: 3, isLocked: false, isMuted: false, isSolo: false, isVisible: true, volume: .8, clips: [] }
  ], markers: [], captions: []
};

const DEFAULT_CANVAS: CanvasSchema = {
  id: "canvas-main", width: 1280, height: 720, backgroundColor: "#0f172a",
  elements: [
    { id: "el-header", type: "text", name: "Header Title", x: 140, y: 180, width: 1000, height: 90, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 1, isLocked: false, isVisible: true, content: "HNL CREATIVE AI STUDIO", fontSize: 56, fontWeight: "bold", color: "#fbbf24", textAlign: "center" },
    { id: "el-subtitle", type: "text", name: "Subtitle", x: 190, y: 290, width: 900, height: 60, rotation: 0, scaleX: 1, scaleY: 1, opacity: .9, zIndex: 2, isLocked: false, isVisible: true, content: "Multimodal AI + Professional Creative Timeline Engine", fontSize: 26, color: "#e2e8f0", textAlign: "center" }
  ], selectedElementIds: [], zoom: 1, panX: 0, panY: 0, showGrid: true, snapToGrid: true
};

const createInitialProject = (): ProjectSchema => ({
  id: "proj-default", name: "New Multimodal Production", version: "1.1.0", type: "video", aspectRatio: "16:9",
  dimensions: { width: 1280, height: 720 }, createdAt: Date.now(), updatedAt: Date.now(), currentPageIndex: 0,
  pages: [{ id: "p1", pageNumber: 1, title: "Main Page", canvas: DEFAULT_CANVAS }], timeline: DEFAULT_TIMELINE,
  storyboard: { id: "sb-1", title: "Commercial Concept", conceptSummary: "Multimodal video commercial", totalDuration: 30, aspectRatio: "16:9", scenes: [], proposedChanges: [], missingMediaRequirements: [], userApproved: false },
  brandKit: DEFAULT_BRAND_KIT, characters: [], products: [],
  exportSettings: { format: "mp4", resolution: { width: 1280, height: 720 }, fps: 30, quality: "high", includeAudio: true },
  preferMyMedia: true, useOnlyMyFiles: false
});

export function App() {
  const [project, setProject] = useState<ProjectSchema>(createInitialProject);
  const [assets, setAssets] = useState<AssetSchema[]>([]);
  const [activeView, setActiveView] = useState("editor");
  const [isPlaying, setIsPlaying] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [mobileRail, setMobileRail] = useState<"assets" | "director" | null>(null);
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedAssets, storedProjects, storedBrand] = await Promise.all([storage.getAllAssetsHydrated(), storage.getAllProjects(), storage.getBrandKit()]);
        if (!mounted) return;
        setAssets(storedAssets);
        if (storedProjects.length) {
          const latest = storedProjects[0];
          const assetMap = new Map(storedAssets.map((a) => [a.id, a]));
          const pages = latest.pages.map((page) => ({ ...page, canvas: { ...page.canvas, elements: page.canvas.elements.map((el) => {
            const asset = el.assetId ? assetMap.get(el.assetId) : undefined;
            return asset ? { ...el, imageUrl: asset.url, originalImageUrl: asset.url } : el;
          }) } }));
          setProject({ ...latest, pages, brandKit: storedBrand || latest.brandKit });
        } else if (storedBrand) setProject((prev) => ({ ...prev, brandKit: storedBrand }));
      } catch (error) { console.error("Project restore failed:", error); }
      finally { if (mounted) setPersistenceReady(true); }
    })();
    const unsub = historyEngine.subscribe((state) => { setCanUndo(state.canUndo); setCanRedo(state.canRedo); });
    return () => { mounted = false; unsub(); storage.disposeObjectUrls(); };
  }, []);

  useEffect(() => {
    if (!persistenceReady) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => storage.saveProject({ ...project, updatedAt: Date.now() }).catch((e) => console.error("Autosave failed:", e)), 500);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [project, persistenceReady]);

  const currentCanvas = project.pages[project.currentPageIndex]?.canvas || project.pages[0].canvas;
  const handleCanvasChange = (next: CanvasSchema) => {
    historyEngine.record("Modify Canvas Layer", "canvas", currentCanvas, next);
    setProject((prev) => { const pages = [...prev.pages]; const i = Math.min(prev.currentPageIndex, Math.max(0, pages.length - 1)); pages[i] = { ...pages[i], canvas: next }; return { ...prev, pages }; });
  };
  const handleTimelineChange = (next: TimelineSchema) => { historyEngine.record("Modify Timeline Clip", "timeline", project.timeline, next); setProject((prev) => ({ ...prev, timeline: next })); };
  const applyHistory = (direction: "undo" | "redo") => {
    const action = direction === "undo" ? historyEngine.undo() : historyEngine.redo(); if (!action) return;
    const state = direction === "undo" ? action.undoState : action.redoState;
    if (action.category === "timeline") setProject((prev) => ({ ...prev, timeline: state }));
    if (action.category === "canvas") setProject((prev) => { const pages = [...prev.pages]; const i = Math.min(prev.currentPageIndex, Math.max(0, pages.length - 1)); pages[i] = { ...pages[i], canvas: state }; return { ...prev, pages }; });
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => setProject((prev) => {
      const next = prev.timeline.currentTime + .1;
      if (next >= prev.timeline.duration) { setIsPlaying(false); return { ...prev, timeline: { ...prev.timeline, currentTime: 0 } }; }
      return { ...prev, timeline: { ...prev.timeline, currentTime: next } };
    }), 100);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const syncStoryboard = (sb: StoryboardSchema) => {
    let time = 0;
    const clips = sb.scenes.map((scene, index) => {
      const asset = scene.assignedAssetId ? assets.find((a) => a.id === scene.assignedAssetId) : undefined;
      const duration = scene.duration || 5;
      const clip = { id: `clip-sc-${index + 1}`, name: asset ? scene.title : `${scene.title} [Missing media]`, trackId: "track-v1", assetId: asset?.id,
        type: (asset?.type === "image" || asset?.type === "video" ? asset.type : "color") as "image" | "video" | "color", start: time, duration, trimStart: 0,
        trimEnd: asset?.duration ? Math.min(asset.duration, duration) : duration, speed: 1, volume: 1, isMuted: false, fadeIn: .5, fadeOut: .5, autoDucking: true,
        duckingAmount: .3, opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, zIndex: 1, sourceDocumentExcerpt: scene.sourceDocTrace?.rawTextExcerpt, sourceDocumentPage: scene.sourceDocTrace?.pageNumber };
      time += duration; return clip;
    });
    setProject((prev) => ({ ...prev, storyboard: sb, timeline: { ...prev.timeline, duration: Math.max(30, time), tracks: prev.timeline.tracks.map((t) => t.id === "track-v1" ? { ...t, clips } : t) } }));
  };

  const executeCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();
    if (lower.includes("9:16") || lower.includes("shorts")) setProject((p) => ({ ...p, aspectRatio: "9:16", dimensions: { width: 720, height: 1280 } }));
    else if (lower.includes("16:9")) setProject((p) => ({ ...p, aspectRatio: "16:9", dimensions: { width: 1280, height: 720 } }));
    else if (lower.includes("ducking") || lower.includes("nhạc")) setProject((p) => ({ ...p, timeline: { ...p.timeline, tracks: p.timeline.tracks.map((t) => t.type === "audio" ? { ...t, clips: t.clips.map((c) => ({ ...c, autoDucking: true, duckingAmount: .25 })) } : t) } }));
  };

  const addAssetToProject = (asset: AssetSchema, closeMobile = false) => {
    if (asset.type === "image" || asset.type === "logo") {
      handleCanvasChange({ ...currentCanvas, elements: [...currentCanvas.elements, { id: `img-${Math.random().toString(36).slice(2, 9)}`, type: "image", name: asset.name, x: 80, y: 80, width: 320, height: 240, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: currentCanvas.elements.length + 1, isLocked: false, isVisible: true, assetId: asset.id, imageUrl: asset.url, originalImageUrl: asset.url }] });
      if (closeMobile) setMobileRail(null); return;
    }
    if (asset.type !== "video" && asset.type !== "audio") return;
    const target = project.timeline.tracks.find((t) => t.type === asset.type); if (!target) return;
    const duration = Math.max(.1, asset.duration || (asset.type === "audio" ? 10 : 5));
    const start = target.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    const clip = { id: `clip-${Math.random().toString(36).slice(2, 9)}`, name: asset.name, trackId: target.id, assetId: asset.id, type: asset.type as "video" | "audio", start, duration, trimStart: 0, trimEnd: duration, speed: 1, volume: 1, isMuted: false, fadeIn: 0, fadeOut: 0, autoDucking: false, duckingAmount: .3, opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, zIndex: 1, cachedWaveform: asset.waveform };
    handleTimelineChange({ ...project.timeline, duration: Math.max(project.timeline.duration, start + duration), tracks: project.timeline.tracks.map((t) => t.id === target.id ? { ...t, clips: [...t.clips, clip] } : t) });
    if (closeMobile) setMobileRail(null);
  };

  const applyGeneratedImage = async (imgUrl: string, name: string, width: number, height: number) => {
    try {
      const blob = await dataUrlToBlob(imgUrl), runtimeUrl = URL.createObjectURL(blob);
      const asset: AssetSchema = { id: `asset-ai-image-${Math.random().toString(36).slice(2, 9)}`, name, filename: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.png`, type: "image", mimeType: blob.type || "image/png", size: blob.size, createdAt: Date.now(), origin: "AI_GENERATED", url: runtimeUrl, thumbnailUrl: runtimeUrl, tags: ["image", "ai", "generated"] };
      await storage.saveAsset(asset, blob); setAssets((p) => [asset, ...p]);
      handleCanvasChange({ ...currentCanvas, elements: [...currentCanvas.elements, { id: `img-${Math.random().toString(36).slice(2, 9)}`, type: "image", name, x: 100, y: 80, width, height, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: currentCanvas.elements.length + 1, isLocked: false, isVisible: true, assetId: asset.id, imageUrl: runtimeUrl, originalImageUrl: runtimeUrl }] }); setActiveView("editor");
    } catch (e) { console.error("Failed to persist generated image", e); }
  };

  const handleAssetsChange = (nextAssets: AssetSchema[]) => {
    const nextIds = new Set(nextAssets.map((a) => a.id)), removed = new Set(assets.filter((a) => !nextIds.has(a.id)).map((a) => a.id)); setAssets(nextAssets); if (!removed.size) return;
    setProject((prev) => ({ ...prev,
      brandKit: prev.brandKit.logoAssetId && removed.has(prev.brandKit.logoAssetId) ? { ...prev.brandKit, logoAssetId: undefined, logoUrl: undefined } : prev.brandKit,
      pages: prev.pages.map((page) => ({ ...page, canvas: { ...page.canvas, elements: page.canvas.elements.filter((e) => !e.assetId || !removed.has(e.assetId)) } })),
      timeline: { ...prev.timeline, tracks: prev.timeline.tracks.map((track) => ({ ...track, clips: track.clips.filter((c) => !c.assetId || !removed.has(c.assetId)) })) },
      storyboard: { ...prev.storyboard, scenes: prev.storyboard.scenes.map((s) => s.assignedAssetId && removed.has(s.assignedAssetId) ? { ...s, assignedAssetId: undefined, assignedAssetUrl: undefined, assignedAssetThumbnail: undefined, status: "draft" as const } : s) }
    }));
  };

  const editorAssetPanel = <AssetLibraryPanel assets={assets} onAssetsChange={handleAssetsChange} onSelectAsset={(asset) => addAssetToProject(asset)} />;

  return <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
    <HeaderNav project={project} onProjectChange={setProject} activeView={activeView} onViewChange={setActiveView} canUndo={canUndo} canRedo={canRedo} onUndo={() => applyHistory("undo")} onRedo={() => applyHistory("redo")} onExecuteCommand={executeCommand} />
    <div className="flex-1 flex overflow-hidden relative">
      {activeView === "editor" && <div className="hidden lg:block h-full shrink-0">{editorAssetPanel}</div>}
      {activeView === "editor" && <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="lg:hidden h-10 shrink-0 border-b border-slate-800 bg-slate-900/95 px-2 flex items-center gap-2 text-[11px]">
          <button onClick={() => setMobileRail("assets")} className="flex-1 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">Assets / Upload</button>
          <button onClick={() => setMobileRail("director")} className="flex-1 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">AI Director</button>
        </div>
        <CanvasEditor canvas={currentCanvas} onCanvasChange={handleCanvasChange} />
        <TimelineEditor timeline={project.timeline} onTimelineChange={handleTimelineChange} assets={assets} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} onSeek={(time) => setProject((p) => ({ ...p, timeline: { ...p.timeline, currentTime: time } }))} />
      </div>}
      {activeView === "editor" && <div className="hidden lg:block h-full shrink-0"><CreativeDirectorPanel storyboard={project.storyboard} onStoryboardChange={(sb) => setProject((p) => ({ ...p, storyboard: sb }))} assets={assets} brandKit={project.brandKit} preferMyMedia={project.preferMyMedia} onSyncToTimeline={syncStoryboard} /></div>}
      {activeView === "editor" && mobileRail && <div className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden" onClick={() => setMobileRail(null)}><div className={`absolute inset-y-0 ${mobileRail === "assets" ? "left-0" : "right-0"} w-[min(92vw,380px)] bg-slate-900 shadow-2xl`} onClick={(e) => e.stopPropagation()}><button onClick={() => setMobileRail(null)} className="absolute top-2 right-2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300">Close</button>{mobileRail === "assets" ? <AssetLibraryPanel assets={assets} onAssetsChange={handleAssetsChange} onSelectAsset={(a) => addAssetToProject(a, true)} /> : <CreativeDirectorPanel storyboard={project.storyboard} onStoryboardChange={(sb) => setProject((p) => ({ ...p, storyboard: sb }))} assets={assets} brandKit={project.brandKit} preferMyMedia={project.preferMyMedia} onSyncToTimeline={(sb) => { syncStoryboard(sb); setMobileRail(null); }} />}</div></div>}
      {activeView === "video_ai" && <VideoAIStudio assets={assets} onGeneratedAsset={(asset) => { setAssets((p) => [asset, ...p.filter((a) => a.id !== asset.id)]); addAssetToProject(asset); setActiveView("editor"); }} />}
      {activeView === "ai_settings" && <AISettingsModal />}
      {activeView === "fashion" && <FashionTryOnStudio assets={assets} onApplyToCanvas={(url) => void applyGeneratedImage(url, "Virtual Try-On", 360, 480)} />}
      {activeView === "product" && <ProductStudioModal assets={assets} onApplyToCanvas={(url) => void applyGeneratedImage(url, "Product Commercial", 400, 400)} />}
      {activeView === "templates" && <TemplateDesignerModal brandKit={project.brandKit} onApplyTemplate={(canvas) => { handleCanvasChange(canvas); setActiveView("editor"); }} />}
      {activeView === "doc_video" && <DocumentImportModal onAssetImported={(asset) => setAssets((p) => [asset, ...p.filter((a) => a.id !== asset.id)])} onStoryboardGenerated={(sb) => { syncStoryboard(sb); setActiveView("editor"); }} />}
      {activeView === "brand" && <BrandKitModal brandKit={project.brandKit} onBrandKitChange={(bk) => setProject((p) => ({ ...p, brandKit: bk }))} />}
      {activeView === "golden_tests" && <GoldenTestModal project={project} assets={assets} />}
      {activeView === "export" && <ExportModal project={project} assets={assets} />}
    </div>
  </div>;
}

export default App;
