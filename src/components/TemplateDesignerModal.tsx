// Multi-Page Template Engine, Menu, Catalogue & Invitation Studio

import React, { useState } from "react";
import { DESIGN_TEMPLATES, TemplateDefinition, TemplateEngine } from "../templates/templateEngine";
import { CanvasSchema } from "../types/canvas";
import { BrandKitSchema } from "../types/project";
import { BookOpen, Utensils, Mail, Layout, Sparkles } from "lucide-react";

interface TemplateStudioProps {
  brandKit: BrandKitSchema;
  onApplyTemplate: (canvas: CanvasSchema) => void;
}

export const TemplateDesignerModal: React.FC<TemplateStudioProps> = ({ brandKit, onApplyTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("menu");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(DESIGN_TEMPLATES[0]);

  const categories = [
    { id: "menu", label: "Restaurant Menu", icon: Utensils },
    { id: "catalogue", label: "Product Catalogue", icon: BookOpen },
    { id: "invitation", label: "VIP Invitation", icon: Mail },
    { id: "poster", label: "Poster & Social", icon: Layout }
  ];

  const filteredTemplates = DESIGN_TEMPLATES.filter((t) => selectedCategory === "all" || t.category === selectedCategory || (selectedCategory === "poster" && t.category === "social"));

  const handleApply = () => {
    const rawCanvas: CanvasSchema = {
      id: "canvas-" + Math.random().toString(36).substring(2, 7),
      width: selectedTemplate.width,
      height: selectedTemplate.height,
      backgroundColor: "#0f172a",
      elements: (selectedTemplate.elements as any[]).map((el, i) => ({ ...el, id: "el-" + i + "-" + Math.random().toString(36).substring(2, 5) })),
      selectedElementIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
      showGrid: true,
      snapToGrid: true
    };
    const boundCanvas = TemplateEngine.applyDataBindings(rawCanvas, { brand: brandKit });
    onApplyTemplate(boundCanvas);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 p-3 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20"><Layout className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-slate-100">Multi-Page Design & Template Studio</h2><p className="text-xs text-slate-400">Menu, Catalogue, Invitation and Poster templates with Brand Kit Data-Binding</p></div></div></div>
        <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">{categories.map((c) => { const Icon = c.icon; const isAct = selectedCategory === c.id; return <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${isAct ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"}`}><Icon className="w-4 h-4" /><span>{c.label}</span></button>; })}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filteredTemplates.map((t) => <div key={t.id} onClick={() => setSelectedTemplate(t)} className={`p-3 rounded-xl border cursor-pointer transition-all bg-slate-900 ${selectedTemplate.id === t.id ? "border-amber-500 ring-2 ring-amber-500/30" : "border-slate-800 hover:border-slate-700"}`}><div className="h-44 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center p-3 text-center mb-3"><span className="text-xs font-bold text-amber-400">{t.name}</span></div><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-300 truncate">{t.name}</span><span className="text-[10px] text-slate-500 font-mono">{t.width}x{t.height}</span></div></div>)}</div>
        <div className="pt-2"><button onClick={handleApply} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"><Sparkles className="w-4 h-4" /> Load Template & Apply Brand Kit Data</button></div>
      </div>
    </div>
  );
};
