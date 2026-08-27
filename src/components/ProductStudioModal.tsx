// Product AI Studio & Environment Rendering (Section XIX, XX)

import React, { useState } from "react";
import { AssetSchema } from "../types/asset";
import { aiClient } from "../ai/client";
import { urlToDataUrl } from "../utils/media";
import { Package, Sparkles, Check, RefreshCw, Layers, ShieldCheck } from "lucide-react";

interface ProductStudioProps { assets: AssetSchema[]; onApplyToCanvas: (imageUrl: string) => void; }

export const ProductStudioModal: React.FC<ProductStudioProps> = ({ assets, onApplyToCanvas }) => {
  const [selectedProductAsset, setSelectedProductAsset] = useState<AssetSchema | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("Luxury Studio");
  const [preserveLogo, setPreserveLogo] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutputUrl, setGeneratedOutputUrl] = useState<string | null>(null);
  const presets = [
    { id: "White Studio", label: "Clean White Studio", desc: "Pure white backdrop with soft studio rim lighting" },
    { id: "Luxury Studio", label: "Luxury Dark Marble", desc: "Dark marble platform with golden ambient accents" },
    { id: "Cafe", label: "Cozy Cafe Table", desc: "Warm wooden table with coffee shop background bokeh" },
    { id: "Restaurant", label: "Fine Dining Restaurant", desc: "Elegant candlelit restaurant setting" },
    { id: "Outdoor", label: "Nature & Sunlight", desc: "Lush botanical garden with golden hour sunlight" },
    { id: "Technology", label: "Futuristic Tech Lab", desc: "Cyberpunk neon and sleek metal podium" }
  ];

  const handleGenerateProductShot = async () => {
    if (!selectedProductAsset) { alert("Please select a product image first."); return; }
    setIsProcessing(true);
    try {
      const prompt = `Professional commercial product photography of the product in @product.\nSetting: ${selectedPreset}.\nStrictly preserve product geometry, label, colors and typography. High-end commercial advertising photo at the best resolution supported by the configured model.`;
      const res = await aiClient.generateImage(prompt,{ preserveProduct: preserveLogo },[{ base64: await urlToDataUrl(selectedProductAsset.url), mimeType: selectedProductAsset.mimeType }]);
      if (!res.imageUrl) throw new Error(res.textResponse || "The configured AI model did not return an image. No fake product preview was created.");
      setGeneratedOutputUrl(res.imageUrl);
    } catch (e: any) { alert("Product Studio Error: " + (e.message || "Failed to generate product photo")); } finally { setIsProcessing(false); }
  };

  const imageAssets = assets.filter((a) => a.type === "image" || a.type === "product");
  return <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 p-3 sm:p-6 overflow-y-auto select-none"><div className="max-w-4xl mx-auto w-full space-y-6">
    <div className="border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20"><Package className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-slate-100">Product AI Commercial Studio</h2><p className="text-xs text-slate-400">Transform plain product shots into commercial ads across studio lighting setups</p></div></div></div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-bold text-amber-400 flex items-center gap-1.5"><Package className="w-4 h-4" /> 1. Select Product</span>{selectedProductAsset && <span className="text-[10px] text-emerald-400 font-mono">Selected</span>}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">{imageAssets.map((asset) => <div key={asset.id} onClick={() => setSelectedProductAsset(asset)} className={`h-20 rounded-lg overflow-hidden border cursor-pointer transition-all ${selectedProductAsset?.id === asset.id ? "border-amber-500 ring-2 ring-amber-500/30" : "border-slate-800 hover:border-slate-700"}`}><img src={asset.url} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>)}</div></div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><span className="text-xs font-bold text-sky-400 block">2. Choose Studio Atmosphere & Lighting Preset</span><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{presets.map((preset) => <div key={preset.id} onClick={() => setSelectedPreset(preset.id)} className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${selectedPreset === preset.id ? "bg-slate-950 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10" : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"}`}><p className="font-bold">{preset.label}</p><p className="text-[10px] text-slate-400 mt-1">{preset.desc}</p></div>)}</div><label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs"><input type="checkbox" checked={preserveLogo} onChange={(e) => setPreserveLogo(e.target.checked)} className="accent-amber-400 rounded"/><span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" />Preserve Product Branding, Labels & Original Geometry</span></label><button onClick={handleGenerateProductShot} disabled={isProcessing || !selectedProductAsset} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20">{isProcessing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Rendering Product Commercial...</> : <><Sparkles className="w-4 h-4" /> Render Commercial Studio Shot</>}</button></div>
    {generatedOutputUrl && <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> Product Shot Ready</span><div className="h-72 bg-slate-950 rounded-lg overflow-hidden border border-amber-500/40"><img src={generatedOutputUrl} alt="Product Commercial Result" className="w-full h-full object-contain" referrerPolicy="no-referrer" /></div><button onClick={() => onApplyToCanvas(generatedOutputUrl)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"><Layers className="w-4 h-4 text-amber-400" /> Apply to Canvas</button></div>}
  </div></div>;
};
