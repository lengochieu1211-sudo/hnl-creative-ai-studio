// Truthful Export Engine: PNG/JPG, multi-page PDF, real timeline WebM, and full ZIP backup with binary assets.

import React, { useEffect, useState } from "react";
import { ProjectSchema, AssetSchema } from "../types";
import { VideoRenderer } from "../video/videoRenderer";
import { storage, sanitizeProjectForPersistence } from "../storage/db";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { Download, Film, Image as ImageIcon, FileText, Archive, CheckCircle2, AlertCircle } from "lucide-react";

interface ExportModalProps { project: ProjectSchema; assets: AssetSchema[]; }
type ExportType = "image" | "pdf" | "video" | "zip";

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});

export const ExportModal: React.FC<ExportModalProps> = ({ project, assets }) => {
  const [exportType,setExportType]=useState<ExportType>("video");
  const [imageFormat,setImageFormat]=useState<"png"|"jpg">("png");
  const [isExporting,setIsExporting]=useState(false); const [progress,setProgress]=useState(0); const [statusMessage,setStatusMessage]=useState("");
  const [downloadUrl,setDownloadUrl]=useState<string|null>(null); const [downloadExt,setDownloadExt]=useState("webm");
  const supportedWebM=Boolean(VideoRenderer.getSupportedVideoMimeType());

  useEffect(()=>()=>{if(downloadUrl)URL.revokeObjectURL(downloadUrl);},[downloadUrl]);
  const publishBlob=(blob:Blob,ext:string,msg:string)=>{if(downloadUrl)URL.revokeObjectURL(downloadUrl);setDownloadUrl(URL.createObjectURL(blob));setDownloadExt(ext);setProgress(100);setStatusMessage(msg);};

  const exportVideo=async()=>{
    if(!supportedWebM)throw new Error("Browser này không hỗ trợ WebM MediaRecorder. MP4 cần backend renderer/codec riêng.");
    const blob=await VideoRenderer.renderTimeline(project.timeline,assets,{width:project.dimensions.width,height:project.dimensions.height,fps:project.timeline.fps,backgroundColor:project.pages[0]?.canvas.backgroundColor},(p,m)=>{setProgress(p);setStatusMessage(m);});
    publishBlob(blob,"webm","Video WebM đã render từ timeline thật (ảnh/video/audio/text). MP4 chưa được giả lập.");
  };

  const exportImage=async()=>{
    const page=project.pages[project.currentPageIndex]||project.pages[0]; if(!page)throw new Error("Project không có canvas page.");
    setStatusMessage("Rendering canvas at project resolution...");
    const mime=imageFormat==="jpg"?"image/jpeg":"image/png";
    const blob=await VideoRenderer.renderCanvasImage(page.canvas,{width:project.dimensions.width,height:project.dimensions.height,mimeType:mime,quality:.95});
    publishBlob(blob,imageFormat,"Ảnh canvas đã xuất ở độ phân giải project.");
  };

  const exportPdf=async()=>{
    if(!project.pages.length)throw new Error("Project không có page để xuất PDF.");
    setStatusMessage("Rendering pages to PDF...");
    const first=project.pages[0].canvas; const pdf=new jsPDF({unit:"px",format:[first.width,first.height],orientation:first.width>=first.height?"landscape":"portrait",hotfixes:["px_scaling"]});
    for(let i=0;i<project.pages.length;i++){
      const page=project.pages[i]; if(i>0)pdf.addPage([page.canvas.width,page.canvas.height],page.canvas.width>=page.canvas.height?"landscape":"portrait");
      const blob=await VideoRenderer.renderCanvasImage(page.canvas,{mimeType:"image/png"}); const data=await blobToDataUrl(blob); pdf.addImage(data,"PNG",0,0,page.canvas.width,page.canvas.height);
      setProgress(Math.round((i+1)/project.pages.length*95));
    }
    publishBlob(pdf.output("blob"),"pdf","PDF nhiều trang đã tạo từ canvas thật.");
  };

  const exportZip=async()=>{
    setStatusMessage("Packing project metadata and original binary assets..."); const zip=new JSZip();
    zip.file("project.json",JSON.stringify(sanitizeProjectForPersistence(project),null,2));
    const manifest=[] as any[]; const folder=zip.folder("assets")!;
    for(let i=0;i<assets.length;i++){
      const asset=assets[i]; const blob=await storage.getAssetBlob(asset.id); manifest.push({id:asset.id,filename:asset.filename,type:asset.type,size:asset.size,mimeType:asset.mimeType,origin:asset.origin,hasBinary:Boolean(blob)});
      if(blob)folder.file(`${asset.id}__${asset.filename}`,blob); setProgress(Math.round((i+1)/Math.max(1,assets.length)*60));
    }
    zip.file("manifest.json",JSON.stringify(manifest,null,2));
    zip.file("README.txt","HNL Creative AI Studio backup. project.json stores editable metadata; assets/ stores original uploaded binary files. API keys are intentionally excluded.");
    const blob=await zip.generateAsync({type:"blob"},m=>{setProgress(60+Math.round(m.percent*.4));setStatusMessage(`Compressing backup ${m.percent.toFixed(0)}%...`);}); publishBlob(blob,"zip","Full project backup đã chứa metadata + binary assets gốc.");
  };

  const runExport=async()=>{setIsExporting(true);setDownloadUrl(null);setProgress(2);try{if(exportType==="video")await exportVideo();else if(exportType==="image")await exportImage();else if(exportType==="pdf")await exportPdf();else await exportZip();}catch(e:any){setStatusMessage(e.message||"Export failed");setProgress(0);}finally{setIsExporting(false);}};
  const options:[ExportType,string,React.ReactNode,string][]=[
    ["video","Video",<Film className="w-5 h-5"/>,"Timeline → WebM"],
    ["image","Image",<ImageIcon className="w-5 h-5"/>,"Canvas → PNG/JPG"],
    ["pdf","PDF",<FileText className="w-5 h-5"/>,"Multi-page design PDF"],
    ["zip","Backup",<Archive className="w-5 h-5"/>,"Project + original assets"]
  ];

  return <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 p-3 sm:p-6 overflow-y-auto select-none"><div className="max-w-3xl mx-auto w-full space-y-6">
    <div className="border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950"><Download className="w-5 h-5"/></div><div><h2 className="font-bold">Export & Project Delivery</h2><p className="text-xs text-slate-400">Chỉ hiển thị định dạng engine hiện tại thực sự tạo được. MP4 cần backend/codec riêng, không giả lập.</p></div></div></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{options.map(([id,label,icon,desc])=><button key={id} onClick={()=>{setExportType(id);setDownloadUrl(null);}} className={`p-4 rounded-xl border text-left ${exportType===id?"bg-slate-900 border-amber-500 text-amber-400":"bg-slate-900/60 border-slate-800 text-slate-400"}`}>{icon}<p className="font-bold text-xs mt-2">{label}</p><p className="text-[10px] text-slate-500 mt-1">{desc}</p></button>)}</div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"><div className="flex items-center justify-between text-xs"><span className="text-slate-400">Output</span><span className="font-mono">{project.dimensions.width} × {project.dimensions.height} • {project.aspectRatio}</span></div>{exportType==="image"&&<div className="flex gap-2"><button onClick={()=>setImageFormat("png")} className={`px-3 py-2 rounded border ${imageFormat==="png"?"border-amber-500":"border-slate-700"}`}>PNG</button><button onClick={()=>setImageFormat("jpg")} className={`px-3 py-2 rounded border ${imageFormat==="jpg"?"border-amber-500":"border-slate-700"}`}>JPG</button></div>}{exportType==="video"&&!supportedWebM&&<div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex gap-2"><AlertCircle className="w-4 h-4"/>WebM export is unavailable in this browser.</div>}{(isExporting||progress>0)&&!downloadUrl&&<div><div className="flex justify-between text-xs text-slate-400"><span>{statusMessage}</span><span>{progress}%</span></div><div className="h-2 bg-slate-950 rounded mt-2 overflow-hidden"><div className="h-full bg-amber-500" style={{width:`${progress}%`}}/></div></div>}{downloadUrl?<><div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="w-4 h-4"/>{statusMessage}</div><a href={downloadUrl} download={`${project.name.toLowerCase().replace(/[^a-z0-9]+/gi,"_")||"hnl_export"}.${downloadExt}`} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2"><Download className="w-4 h-4"/>Download .{downloadExt}</a></>:<button onClick={runExport} disabled={isExporting||(exportType==="video"&&!supportedWebM)} className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl">{isExporting?"Exporting...":"Start Export"}</button>}</div>
  </div></div>;
};
