// AI Creative Director Panel & Storyboard First Approval Gate

import React, { useState } from "react";
import { StoryboardSchema, SceneSchema, AIProposedChange, AssetSchema, BrandKitSchema } from "../types";
import { aiClient } from "../ai/client";
import { 
  Sparkles, CheckCircle2, Play, Wand2, RefreshCw, 
  Film, Camera, Clock, ArrowRight, ShieldCheck, AlertCircle
} from "lucide-react";

interface CreativeDirectorProps {
  storyboard: StoryboardSchema;
  onStoryboardChange: (sb: StoryboardSchema) => void;
  assets: AssetSchema[];
  brandKit: BrandKitSchema;
  preferMyMedia: boolean;
  onApplyProposedChanges?: (changes: AIProposedChange[]) => void;
  onSyncToTimeline?: (storyboard: StoryboardSchema) => void;
}

export const CreativeDirectorPanel: React.FC<CreativeDirectorProps> = ({
  storyboard,
  onStoryboardChange,
  assets,
  brandKit,
  preferMyMedia,
  onSyncToTimeline
}) => {
  const [promptInput, setPromptInput] = useState("");
  const [targetDuration, setTargetDuration] = useState(30);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const handleGenerateDirectorPlan = async () => {
    if (!promptInput.trim()) return;
    setIsLoading(true);
    try {
      const { plan } = await aiClient.runCreativeDirector(
        promptInput,
        assets,
        brandKit,
        targetDuration,
        aspectRatio
      );
      onStoryboardChange(plan);
    } catch (e: any) {
      alert("AI Director Error: " + (e.message || "Failed to generate plan"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveStoryboard = () => {
    const updated = {
      ...storyboard,
      userApproved: true,
      approvedAt: Date.now()
    };
    onStoryboardChange(updated);
    onSyncToTimeline?.(updated);
  };

  const handleApplyProposedChange = (changeId: string) => {
    const updatedChanges = storyboard.proposedChanges.map((c) =>
      c.id === changeId ? { ...c, status: "applied" as const } : c
    );
    onStoryboardChange({ ...storyboard, proposedChanges: updatedChanges });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-l border-slate-800 w-full lg:w-96 select-none overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold"><Sparkles className="w-4 h-4" /></div>
          <div><h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">AI Creative Director</h3><p className="text-[10px] text-slate-400">Storyboard-First Multimodal Agent</p></div>
        </div>
        {storyboard.userApproved && <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Approved</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300 block">Creative Vision & Directorial Prompt</label>
          <textarea value={promptInput} onChange={(e) => setPromptInput(e.target.value)} placeholder="e.g., Tạo video quảng cáo 45s giới thiệu bộ sưu tập thời trang hè. Dùng ảnh @shirt và video người mẫu có sẵn..." className="w-full h-20 bg-slate-900 text-xs text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors resize-none" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div><span className="text-[10px] text-slate-400 block mb-1">Target Duration</span><select value={targetDuration} onChange={(e) => setTargetDuration(Number(e.target.value))} className="w-full bg-slate-900 text-xs text-slate-200 p-1.5 rounded border border-slate-800"><option value={15}>15s (Shorts/TikTok)</option><option value={30}>30s (Social Ad)</option><option value={45}>45s (Story)</option><option value={60}>60s (Commercial)</option></select></div>
            <div><span className="text-[10px] text-slate-400 block mb-1">Aspect Ratio</span><select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-slate-900 text-xs text-slate-200 p-1.5 rounded border border-slate-800"><option value="16:9">16:9 Landscape</option><option value="9:16">9:16 Vertical Shorts</option><option value="1:1">1:1 Square</option></select></div>
          </div>
          <button onClick={handleGenerateDirectorPlan} disabled={isLoading || !promptInput.trim()} className="w-full mt-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50">{isLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing Assets & Storyboard...</> : <><Wand2 className="w-3.5 h-3.5" /> Plan Storyboard & Scenes</>}</button>
        </div>

        {storyboard.proposedChanges?.length > 0 && <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Director Proposed Changes</span></div><div className="space-y-1.5">{storyboard.proposedChanges.map((change) => <div key={change.id} className="flex items-start justify-between gap-2 p-2 rounded bg-slate-900 border border-slate-800 text-xs"><p className="text-[11px] text-slate-300 flex-1">{change.description}</p>{change.status === "applied" ? <span className="text-[10px] text-emerald-400 font-medium">Applied</span> : <button onClick={() => handleApplyProposedChange(change.id)} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded text-[10px] font-medium">Apply</button>}</div>)}</div></div>}

        {storyboard.scenes?.length > 0 && <div className="space-y-2.5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-200">Storyboard ({storyboard.scenes.length} Scenes)</span><span className="text-xs text-slate-400 font-mono">Total: {storyboard.scenes.reduce((a, b) => a + (b.duration || 5), 0)}s</span></div>{storyboard.scenes.map((scene) => { const isSelected = selectedSceneId === scene.id; return <div key={scene.id} onClick={() => setSelectedSceneId(scene.id)} className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-slate-950 border-amber-500" : "bg-slate-950/70 border-slate-800 hover:border-slate-700"}`}><div className="flex items-center justify-between mb-1.5"><span className="text-xs font-bold text-amber-400">SCENE 0{scene.sceneNumber}: {scene.title}</span><span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-mono">{scene.duration}s</span></div><p className="text-[11px] text-slate-300 italic mb-2">"{scene.script}"</p><div className="flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2"><span className="flex items-center gap-1"><Camera className="w-3 h-3 text-sky-400" /> {scene.cameraMotion}</span><span className="flex items-center gap-1"><Film className="w-3 h-3 text-emerald-400" /> {scene.transition}</span>{scene.assignedAssetId ? <span className="text-amber-400 bg-amber-500/10 px-1.5 rounded">User Asset</span> : <span className="text-slate-500">AI Prompt</span>}</div></div>; })}</div>}

        {storyboard.scenes?.length > 0 && !storyboard.userApproved && <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2"><div className="flex items-center gap-2 text-xs text-amber-400 font-semibold"><AlertCircle className="w-4 h-4" />User Review & Approval Gate</div><p className="text-[11px] text-slate-300">Please review the storyboard draft before generating the final timeline.</p><button onClick={handleApproveStoryboard} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/30"><CheckCircle2 className="w-4 h-4" /> Approve & Build Timeline</button></div>}
      </div>
    </div>
  );
};
