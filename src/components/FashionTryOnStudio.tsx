// Virtual Try-On & Fashion AI Studio (Section XV, XVI, XVII)

import React, { useState } from "react";
import { AssetSchema } from "../types/asset";
import { aiClient } from "../ai/client";
import { urlToDataUrl } from "../utils/media";
import { Shirt, User, Sparkles, Check, RefreshCw, ShieldCheck, Layers } from "lucide-react";

interface FashionStudioProps { assets: AssetSchema[]; onApplyToCanvas: (imageUrl: string) => void; }

export const FashionTryOnStudio: React.FC<FashionStudioProps> = ({ assets, onApplyToCanvas }) => {
  const [selectedPersonAsset, setSelectedPersonAsset] = useState<AssetSchema | null>(null);
  const [selectedClothingAsset, setSelectedClothingAsset] = useState<AssetSchema | null>(null);
  const [preserveFace, setPreserveFace] = useState(true); const [preserveHair, setPreserveHair] = useState(true); const [preservePose, setPreservePose] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); const [generatedOutputUrl, setGeneratedOutputUrl] = useState<string | null>(null); const [customPrompt, setCustomPrompt] = useState("");
  const imageAssets = assets.filter((a) => a.type === "image");

  const handleGenerateTryOn = async () => {
    if (!selectedPersonAsset || !selectedClothingAsset) { alert("Please select both a Person reference and a Clothing reference."); return; }
    setIsProcessing(true);
    try {
      const prompt = `Virtual try-on fashion photo. Put the clothing garment from @clothing onto the model in @person.\nAdditional instructions: ${customPrompt || "Professional studio lighting, photorealistic fabric texture and drape."}`;
      const res = await aiClient.generateImage(prompt,{ preserveFace, preserveHair, preservePose },[
        { base64: await urlToDataUrl(selectedPersonAsset.url), mimeType: selectedPersonAsset.mimeType },
        { base64: await urlToDataUrl(selectedClothingAsset.url), mimeType: selectedClothingAsset.mimeType }
      ]);
      if (!res.imageUrl) throw new Error(res.textResponse || "The configured AI model did not return an image. No fake preview was created.");
      setGeneratedOutputUrl(res.imageUrl);
    } catch (e: any) { alert("Try-On Generation Error: " + (e.message || "Failed to process virtual try-on")); } finally { setIsProcessing(false); }
  };

  return <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 p-3 sm:p-6 overflow-y-auto select-none"><div className="max-w-4xl mx-auto w-full space-y-6">
    <div className="border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20"><Shirt className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-slate-100">Virtual Fashion & Try-On Studio</h2><p className="text-xs text-slate-400">AI Person + Clothing Fitting with strict Identity & Pose Preservation</p></div></div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-bold text-amber-400 flex items-center gap-1.5"><User className="w-4 h-4" /> 1. Select Model / Person</span>{selectedPersonAsset && <span className="text-[10px] text-emerald-400 font-mono">Selected</span>}</div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">{imageAssets.map((asset) => <div key={asset.id} onClick={() => setSelectedPersonAsset(asset)} className={`h-24 rounded-lg overflow-hidden border cursor-pointer transition-all ${selectedPersonAsset?.id === asset.id ? "border-amber-500 ring-2 ring-amber-500/30" : "border-slate-800 hover:border-slate-700"}`}><img src={asset.url} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>)}</div></div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-bold text-sky-400 flex items-center gap-1.5"><Shirt className="w-4 h-4" /> 2. Select Clothing Garment</span>{selectedClothingAsset && <span className="text-[10px] text-emerald-400 font-mono">Selected</span>}</div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">{imageAssets.map((asset) => <div key={asset.id} onClick={() => setSelectedClothingAsset(asset)} className={`h-24 rounded-lg overflow-hidden border cursor-pointer transition-all ${selectedClothingAsset?.id === asset.id ? "border-sky-500 ring-2 ring-sky-500/30" : "border-slate-800 hover:border-slate-700"}`}><img src={asset.url} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>)}</div></div>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Identity Preservation Guardrails</span><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">{[[preserveFace,setPreserveFace,"Preserve Face & Identity"],[preserveHair,setPreserveHair,"Preserve Hairstyle"],[preservePose,setPreservePose,"Preserve Body Pose"]].map(([checked,setter,label]:any)=><label key={label} className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-lg border border-slate-800"><input type="checkbox" checked={checked} onChange={(e)=>setter(e.target.checked)} className="accent-amber-400 rounded"/><span>{label}</span></label>)}</div><input type="text" placeholder="Refinement prompt: e.g. Áo sơ mi lụa trắng ôm vừa người, ánh sáng tự nhiên..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="w-full bg-slate-950 text-xs p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-slate-200"/><button onClick={handleGenerateTryOn} disabled={isProcessing || !selectedPersonAsset || !selectedClothingAsset} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20">{isProcessing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing Virtual Try-On...</> : <><Sparkles className="w-4 h-4" /> Generate Virtual Try-On</>}</button></div>
    {generatedOutputUrl && <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> Try-On Result Generated</span><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><span className="text-[10px] text-slate-500 uppercase block mb-1">Original Model</span><div className="h-64 bg-slate-950 rounded-lg overflow-hidden border border-slate-800"><img src={selectedPersonAsset?.url} alt="Original" className="w-full h-full object-contain" referrerPolicy="no-referrer" /></div></div><div><span className="text-[10px] text-amber-400 uppercase block mb-1">Virtual Try-On</span><div className="h-64 bg-slate-950 rounded-lg overflow-hidden border border-amber-500/40"><img src={generatedOutputUrl} alt="Generated Try-On" className="w-full h-full object-contain" referrerPolicy="no-referrer" /></div></div></div><button onClick={() => onApplyToCanvas(generatedOutputUrl)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"><Layers className="w-4 h-4 text-amber-400" /> Send Result to Canvas Layer</button></div>}
  </div></div>;
};
