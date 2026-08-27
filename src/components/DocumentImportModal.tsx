// Document & Spreadsheet to Video Pipeline Importer

import React, { useState } from "react";
import { DocumentParser } from "../documents/parser";
import { aiClient } from "../ai/client";
import { StoryboardSchema } from "../types/scene";
import { AssetSchema } from "../types/asset";
import { storage } from "../storage/db";
import { FileSpreadsheet, Sparkles, RefreshCw, Upload, Table } from "lucide-react";

interface DocImportProps { onStoryboardGenerated: (storyboard: StoryboardSchema) => void; onAssetImported?: (asset: AssetSchema) => void; }

export const DocumentImportModal: React.FC<DocImportProps> = ({ onStoryboardGenerated, onAssetImported }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSelectedFile(file); setParsedData(null); setIsProcessing(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    try {
      const data = await DocumentParser.parseDocument(file); setParsedData(data);
      const asset: AssetSchema = { id: `asset-doc-${Math.random().toString(36).slice(2, 9)}`, name: file.name.replace(/\.[^/.]+$/, ""), filename: file.name, type: "document", mimeType: file.type || "application/octet-stream", size: file.size, createdAt: Date.now(), origin: "USER_UPLOAD", url: URL.createObjectURL(file), tags: ["document", ext], referenceTag: `@doc${Date.now().toString().slice(-5)}`, documentData: data };
      await storage.saveAsset(asset, file); onAssetImported?.(asset);
    } catch (err: any) { alert("Parsing error: " + err.message); } finally { setIsProcessing(false); }
  };

  const handleCreateStoryboard = async () => {
    if (!parsedData || !selectedFile) return; setIsProcessing(true);
    try {
      const res = await aiClient.extractDocumentStory(parsedData.rawText || "", selectedFile.name, 45);
      const generatedStoryboard: StoryboardSchema = {
        id: "sb-doc-" + Math.random().toString(36).substring(2, 7), title: `Story from ${selectedFile.name}`, conceptSummary: res.summary || `Multimodal video summary of ${selectedFile.name}`, totalDuration: 45, aspectRatio: "16:9",
        scenes: (res.data?.scenes || res.scenes || []).map((sc: any, idx: number) => { const sourceLabel = String(sc.sourcePageOrSection || sc.title || ""); const pageMatch = sourceLabel.match(/(?:Page|Trang)\s*(\d+)/i); return ({ id: `sc-${idx + 1}`, sceneNumber: idx + 1, title: sc.title || `Scene ${idx + 1}`, duration: sc.duration || 10, script: sc.script || "", visualPrompt: sc.visualIdeas || "", shots: [{ id: `sh-${idx + 1}`, shotName: "Main Shot", shotType: "Medium", cameraMovement: "Zoom In", cameraIntensity: "Medium", duration: sc.duration || 10, visualPrompt: sc.visualIdeas || "", sourceType: "DOCUMENT_EXTRACTED" }], transition: "slide", cameraMotion: "Zoom In", sourceDocTrace: { documentName: selectedFile.name, pageNumber: pageMatch ? Number(pageMatch[1]) : undefined, sectionTitle: sc.sourcePageOrSection || sc.title, rawTextExcerpt: sc.sourceExcerpt }, status: "draft" }); }), proposedChanges: [], missingMediaRequirements: [], userApproved: false
      };
      onStoryboardGenerated(generatedStoryboard);
    } catch (e: any) { alert("Storyboard extraction error: " + e.message); } finally { setIsProcessing(false); }
  };

  return <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 p-3 sm:p-6 overflow-y-auto select-none"><div className="max-w-4xl mx-auto w-full space-y-6">
    <div className="border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-sky-500/20"><FileSpreadsheet className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-slate-100">Document & Excel to Video Engine</h2><p className="text-xs text-slate-400">Parse PDF, DOCX, PPTX, Excel & CSV files into structured video storyboards with retained source traceability</p></div></div></div>
    <div className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-8 text-center space-y-3 transition-colors"><input type="file" id="doc-upload" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.json"/><label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center"><Upload className="w-8 h-8 text-sky-400 mb-2"/><span className="text-sm font-semibold text-slate-200">{selectedFile ? selectedFile.name : "Select Excel Spreadsheet or PDF Document"}</span><span className="text-xs text-slate-500 mt-1">Supports XLSX, CSV, PDF, DOCX, PPTX, JSON</span></label></div>
    {parsedData && <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-sky-400 flex items-center gap-1.5"><Table className="w-4 h-4" /> Parsed Document Structure</span><span className="text-xs text-slate-500 font-mono">{parsedData.tables?.length ? `${parsedData.tables[0].rows.length} rows` : `${parsedData.headings?.length || 0} sections`}</span></div>{parsedData.tables && parsedData.tables.length > 0 ? <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-lg"><table className="w-full text-xs text-left"><thead className="bg-slate-950 text-slate-400 border-b border-slate-800"><tr>{parsedData.tables[0].headers.map((h: string, i: number) => <th key={i} className="p-2 font-mono font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 font-mono text-[11px] text-slate-300">{parsedData.tables[0].rows.slice(0, 5).map((row: any[], rIdx: number) => <tr key={rIdx} className="hover:bg-slate-800/40">{row.map((cell: any, cIdx: number) => <td key={cIdx} className="p-2">{String(cell || "")}</td>)}</tr>)}</tbody></table></div> : <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">{parsedData.headings?.map((h: string, i: number) => <p key={i} className="font-semibold text-slate-200">{h}</p>)}</div>}<button onClick={handleCreateStoryboard} disabled={isProcessing} className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20">{isProcessing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Structuring Storyboard with Traceability...</> : <><Sparkles className="w-4 h-4" /> Convert Document into Video Storyboard</>}</button></div>}
  </div></div>;
};
