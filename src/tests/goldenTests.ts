// Browser-side integration diagnostics. No hard-coded PASS values: every PASS is backed by a real assertion.
import * as XLSX from "xlsx";
import { ProjectSchema, AssetSchema } from "../types";
import { storage } from "../storage/db";
import { VideoRenderer } from "../video/videoRenderer";
import { DocumentParser } from "../documents/parser";
import { checkVideoCapability } from "../ai/capabilities";

export interface GoldenTestResult { id:string; name:string; category:string; status:"PASS"|"FAIL"|"RUNNING"|"SKIPPED"; durationMs:number; details:string; assertions:Array<{name:string;passed:boolean;message?:string}>; }
interface Context { project:ProjectSchema; assets:AssetSchema[]; }

const result=(id:string,name:string,category:string,start:number,assertions:GoldenTestResult["assertions"],details:string,skipped=false):GoldenTestResult=>({id,name,category,status:skipped?"SKIPPED":assertions.every(a=>a.passed)?"PASS":"FAIL",durationMs:Math.round(performance.now()-start),details,assertions});

export class GoldenTestRunner {
  static async runAllTests(ctx:Context):Promise<GoldenTestResult[]>{
    return [await this.assetPersistence(ctx),await this.projectRoundTrip(ctx),await this.canvasExport(ctx),await this.timelineIntegrity(ctx),await this.xlsxIntegrity(),await this.realDocumentParser(ctx),await this.capabilityRouter(),await this.webmCapability(ctx)];
  }

  private static async assetPersistence({assets}:Context){
    const start=performance.now();const uploads=assets.filter(a=>a.origin==="USER_UPLOAD"||a.origin==="AI_GENERATED");
    if(!uploads.length)return result("GT-01","Persistent Asset Blob Round-Trip","Storage",start,[],"Upload or generate at least one asset to run this integration test.",true);
    const checks=await Promise.all(uploads.slice(0,10).map(async a=>({name:`${a.filename} binary persisted`,passed:Boolean(await storage.getAssetBlob(a.id))})));
    return result("GT-01","Persistent Asset Blob Round-Trip","Storage",start,checks,"Checks IndexedDB binary records instead of trusting temporary blob: URLs.");
  }

  private static async projectRoundTrip({project}:Context){
    const start=performance.now();await storage.saveProject(project);const restored=await storage.getProject(project.id);const assertions=[{name:"Project record restored",passed:Boolean(restored)},{name:"Timeline track count preserved",passed:restored?.timeline.tracks.length===project.timeline.tracks.length},{name:"Canvas element count preserved",passed:restored?.pages[0]?.canvas.elements.length===project.pages[0]?.canvas.elements.length}];
    return result("GT-02","Project Autosave/Recovery Round-Trip","Storage",start,assertions,"Writes the current project to IndexedDB and reads it back.");
  }

  private static async canvasExport({project}:Context){
    const start=performance.now();try{const blob=await VideoRenderer.renderCanvasImage(project.pages[project.currentPageIndex]?.canvas||project.pages[0].canvas,{mimeType:"image/png"});return result("GT-03","Canvas PNG Export","Canvas/Export",start,[{name:"PNG blob produced",passed:blob.type==="image/png"&&blob.size>0}],`Produced ${blob.size} bytes from the actual current canvas.`);}catch(e:any){return result("GT-03","Canvas PNG Export","Canvas/Export",start,[{name:"PNG blob produced",passed:false,message:e.message}],e.message);}
  }

  private static async timelineIntegrity({project,assets}:Context){
    const start=performance.now();const assetIds=new Set(assets.map(a=>a.id));const clips=project.timeline.tracks.flatMap(t=>t.clips);const referenced=clips.filter(c=>c.assetId);if(!referenced.length)return result("GT-04","Timeline Media Reference Integrity","Timeline",start,[],"Add at least one uploaded media clip to the timeline to run reference integrity checks.",true);
    const assertions=[{name:"All referenced asset IDs exist",passed:referenced.every(c=>assetIds.has(c.assetId!))},{name:"All clips have positive duration",passed:clips.every(c=>c.duration>0)},{name:"Trim ranges are valid",passed:clips.every(c=>c.trimEnd>=c.trimStart)}];
    return result("GT-04","Timeline Media Reference Integrity","Timeline",start,assertions,`Validated ${clips.length} current timeline clips against ${assets.length} assets.`);
  }

  private static async xlsxIntegrity(){
    const start=performance.now();const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([["SKU","Name","Price","ImageFile"],["HNL-001","Test Product","850000","product.jpg"]]);XLSX.utils.book_append_sheet(wb,ws,"Products");const bytes=XLSX.write(wb,{type:"array",bookType:"xlsx"});const file=new File([bytes],"golden-products.xlsx",{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});const data=await DocumentParser.parseSpreadsheet(file);const table=data.tables?.[0];const assertions=[{name:"SKU preserved exactly",passed:table?.rows?.[0]?.[0]==="HNL-001"},{name:"Price preserved exactly",passed:String(table?.rows?.[0]?.[2])==="850000"},{name:"Image filename preserved",passed:table?.rows?.[0]?.[3]==="product.jpg"}];return result("GT-05","XLSX Data Integrity","Document",start,assertions,"Creates a real XLSX fixture in-browser and parses it through the production parser.");
  }

  private static async realDocumentParser({assets}:Context){
    const start=performance.now();const doc=assets.find(a=>a.type==="document"&&["pdf","docx","pptx"].some(ext=>a.filename.toLowerCase().endsWith(`.${ext}`)));
    if(!doc)return result("GT-06","PDF/DOCX/PPTX Real Parser","Document",start,[],"Upload a PDF, DOCX or PPTX to run the real parser against user media.",true);
    const blob=await storage.getAssetBlob(doc.id);if(!blob)return result("GT-06","PDF/DOCX/PPTX Real Parser","Document",start,[{name:"Source binary available",passed:false}],"Document metadata exists but binary blob is missing.");
    try{const file=new File([blob],doc.filename,{type:doc.mimeType});const parsed=await DocumentParser.parseDocument(file);return result("GT-06","PDF/DOCX/PPTX Real Parser","Document",start,[{name:"Parser returned source format",passed:Boolean(parsed.sourceFormat)},{name:"Extracted text is non-empty",passed:Boolean(parsed.rawText?.trim())},{name:"Page/section structure exists",passed:Boolean(parsed.pageCount||parsed.headings?.length)}],`Parsed real uploaded ${parsed.sourceFormat?.toUpperCase()} content.`);}catch(e:any){return result("GT-06","PDF/DOCX/PPTX Real Parser","Document",start,[{name:"Parser completed",passed:false,message:e.message}],e.message);}
  }

  private static async capabilityRouter(){
    const start=performance.now();const veo=checkVideoCapability("veo-3.1-generate-preview","videoToVideo"),omni=checkVideoCapability("gemini-omni-flash-preview","videoToVideo");return result("GT-07","Verified AI Video Capability Routing","AI Router",start,[{name:"Veo is not falsely advertised as arbitrary video-to-video edit",passed:!veo.supported},{name:"Gemini Omni routes video-to-video",passed:omni.supported}],"Prevents capability labels from becoming fake UI promises.");
  }

  private static async webmCapability({project}:Context){
    const start=performance.now();const mime=VideoRenderer.getSupportedVideoMimeType();if(!mime)return result("GT-08","Browser Video Export Capability","Video Renderer",start,[{name:"MediaRecorder WebM supported",passed:false}],"This browser cannot perform local WebM export.");
    const mediaClips=project.timeline.tracks.flatMap(t=>t.clips).filter(c=>c.assetId);return result("GT-08","Browser Video Export Capability","Video Renderer",start,[{name:"Supported MediaRecorder codec detected",passed:Boolean(mime)},{name:"Timeline has media clips for end-to-end render",passed:mediaClips.length>0}],`Codec: ${mime}. Add actual media clips before treating end-to-end render as release-certified.`,mediaClips.length===0);
  }
}
