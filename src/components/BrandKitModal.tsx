// Brand Kit Editor & Management (Section XXVII)

import React, { useState } from "react";
import { BrandKitSchema } from "../types/project";
import { storage } from "../storage/db";
import { Palette, Sparkles, Check, Phone, Globe, MapPin } from "lucide-react";

interface BrandKitProps {
  brandKit: BrandKitSchema;
  onBrandKitChange: (bk: BrandKitSchema) => void;
}

export const BrandKitModal: React.FC<BrandKitProps> = ({ brandKit, onBrandKitChange }) => {
  const [formData, setFormData] = useState<BrandKitSchema>(brandKit);
  const [saved, setSaved] = useState(false);
  const handleChange = (key: keyof BrandKitSchema, val: any) => { setFormData((prev) => ({ ...prev, [key]: val })); setSaved(false); };
  const handleSave = async () => { await storage.saveBrandKit(formData); onBrandKitChange(formData); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 p-3 sm:p-6 overflow-y-auto select-none"><div className="max-w-4xl mx-auto w-full space-y-6">
    <div className="border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20"><Palette className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-slate-100">Universal Brand Kit</h2><p className="text-xs text-slate-400">Configure brand identity, colors, typography & contact details to apply across all assets & videos</p></div></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><span className="text-xs font-bold text-amber-400 block">Brand Identity</span><div className="space-y-1"><label className="text-[10px] text-slate-400 block">Brand / Business Name</label><input type="text" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full bg-slate-950 text-xs p-2 rounded border border-slate-800 focus:outline-none focus:border-amber-500 text-slate-200" /></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">{([['primaryColor','Primary Color'],['secondaryColor','Secondary'],['accentColor','Accent']] as const).map(([key,label])=><div key={key}><label className="text-[10px] text-slate-400 block mb-1">{label}</label><div className="flex items-center gap-2"><input type="color" value={formData[key]} onChange={(e) => handleChange(key,e.target.value)} className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"/><span className="text-[10px] font-mono text-slate-400">{formData[key]}</span></div></div>)}</div></div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"><span className="text-xs font-bold text-sky-400 block">Contact & Digital Footprint</span><div className="space-y-1"><label className="text-[10px] text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Hotline / Phone</label><input type="text" value={formData.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} placeholder="0901 234 567" className="w-full bg-slate-950 text-xs p-2 rounded border border-slate-800 text-slate-200" /></div><div className="space-y-1"><label className="text-[10px] text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3" /> Official Website</label><input type="text" value={formData.website || ""} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://hnlstudio.ai" className="w-full bg-slate-950 text-xs p-2 rounded border border-slate-800 text-slate-200" /></div><div className="space-y-1"><label className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Store / Office Address</label><input type="text" value={formData.address || ""} onChange={(e) => handleChange("address", e.target.value)} placeholder="TP. Hồ Chí Minh, Việt Nam" className="w-full bg-slate-950 text-xs p-2 rounded border border-slate-800 text-slate-200" /></div></div></div>
    <button onClick={handleSave} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20">{saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}<span>{saved ? "Brand Kit Saved Successfully!" : "Save & Apply Brand Kit to Project"}</span></button>
  </div></div>;
};
