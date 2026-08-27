// AI integration layer with two modes:
// 1) secure backend proxy (VITE_AI_API_BASE or local /api), 2) GitHub Pages BYOK direct Gemini REST.

import { SmartAssetAnalysis } from "../types/asset";
import { StoryboardSchema } from "../types/scene";
import { BrandKitSchema } from "../types/project";

const STORAGE_KEY="hnl-ai-api-key";
const API_ROOT="https://generativelanguage.googleapis.com/v1beta";
const stripDataPrefix=(data:string)=>data.replace(/^data:[^;]+;base64/,"").replace(/^,/,"");

export class AIStudioClient {
  private apiBase=(import.meta.env.VITE_AI_API_BASE || (typeof window!=="undefined" && ["localhost","127.0.0.1"].includes(window.location.hostname) && window.location.port==="3000" ? window.location.origin : "")).replace(/\/$/,"");
  private memoryKey:string|null=null;

  setApiKey(key:string,remember=true){this.memoryKey=key.trim()||null;if(remember&&key.trim())localStorage.setItem(STORAGE_KEY,key.trim());else localStorage.removeItem(STORAGE_KEY);}
  getApiKey(){return this.memoryKey || (typeof localStorage!=="undefined"?localStorage.getItem(STORAGE_KEY):null);}
  clearApiKey(){this.memoryKey=null;if(typeof localStorage!=="undefined")localStorage.removeItem(STORAGE_KEY);}
  getMode(){return this.apiBase?"BACKEND_PROXY":this.getApiKey()?"BYOK_DIRECT":"LOCAL_ONLY";}

  private async backend(path:string,body:any){
    const response=await fetch(`${this.apiBase}/api/ai/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const contentType=response.headers.get("content-type")||""; if(!contentType.includes("application/json"))throw new Error("AI backend is unavailable on this static host.");
    const data=await response.json(); if(!response.ok||data.success===false)throw new Error(data.error||`AI backend error ${response.status}`); return data;
  }

  private async directModel(model:string,payload:any){
    const key=this.getApiKey(); if(!key)throw new Error("AI API key is not configured. Open AI Settings and enter your Gemini API key.");
    const response=await fetch(`${API_ROOT}/models/${model}:generateContent?key=${encodeURIComponent(key)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await response.json(); if(!response.ok)throw new Error(data?.error?.message||`Gemini API error ${response.status}`); return data;
  }

  private async directJson(prompt:string):Promise<any>{
    const data=await this.directModel("gemini-3.7-flash",{contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json"}});
    const text=data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("")||"{}"; return JSON.parse(text);
  }

  async testConnection():Promise<{ok:boolean;mode:string;message:string}>{
    const key=this.getApiKey(); if(!key&& !this.apiBase)return{ok:false,mode:this.getMode(),message:"No API key configured."};
    try{
      if(this.apiBase){
        const response=await fetch(`${this.apiBase}/api/health`); const health=await response.json();
        if(!response.ok)throw new Error(health?.error||"Backend health check failed");
        if(!health.hasApiKey)return{ok:false,mode:this.getMode(),message:"Backend is reachable but GEMINI_API_KEY is not configured."};
        return{ok:true,mode:this.getMode(),message:"Secure backend proxy and Gemini key are ready."};
      }
      const response=await fetch(`${API_ROOT}/models?key=${encodeURIComponent(key!)}`); if(!response.ok)throw new Error((await response.json())?.error?.message||"Connection failed"); return{ok:true,mode:this.getMode(),message:"Gemini BYOK connection successful."};
    }catch(e:any){return{ok:false,mode:this.getMode(),message:e.message||"Connection failed"};}
  }

  async analyzeAsset(filename:string,assetType:string,mimeType:string,base64Data?:string):Promise<SmartAssetAnalysis>{
    const fallback:SmartAssetAnalysis={description:`${filename} ready for local multimodal editing.`,tags:[assetType,"local"],detectedElements:{objects:["media"],peopleCount:0}};
    try{
      if(this.apiBase){const d=await this.backend("analyze-asset",{filename,assetType,mimeType,base64Data});return d.analysis||fallback;}
      if(!this.getApiKey())return fallback;
      const parts:any[]=[{text:`Analyze ${filename}. Return JSON with description,tags,detectedElements{objects,peopleCount,clothing,scene,dominantColors,ocrText},suggestedRoles.`}];
      if(base64Data)parts.push({inlineData:{mimeType,data:stripDataPrefix(base64Data)}});
      const d=await this.directModel("gemini-3.7-flash",{contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json"}});
      const text=d?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("")||"{}";return JSON.parse(text);
    }catch(e){console.warn("Asset analysis fallback",e);return fallback;}
  }

  private localDirector(prompt:string,assets:any[],brandKit:BrandKitSchema,duration:number,aspectRatio:string){
    const selected=assets.slice(0,3); const baseDuration=Math.max(3,Math.floor(duration/Math.max(1,selected.length||3)));
    return {concept:prompt||"Multimodal Creative Draft",totalDuration:duration,aspectRatio,scenes:(selected.length?selected:[null,null,null]).map((a:any,i:number)=>({id:`scene-${i+1}`,title:i===0?"Hook":i===2?"CTA":`Scene ${i+1}`,duration:i===2?Math.min(5,baseDuration):baseDuration,script:i===2?(brandKit.phone||brandKit.website?`Liên hệ ${brandKit.phone||brandKit.website}`:"Call to action"):prompt||"Draft scene",visualPrompt:a?`Use uploaded asset ${a.name}`:"User review required: missing visual",sourceAssetId:a?.id||null,cameraMovement:i===0?"Zoom In":"Static",transition:"fade",shotType:i===0?"Wide":"Medium"})),proposedChanges:[],missingMedia:selected.length?[]:[{sceneNumber:1,description:"No uploaded media selected",suggestedType:"video"}]};
  }

  async runCreativeDirector(prompt:string,assets:any[],brandKit:BrandKitSchema,duration=30,aspectRatio="16:9"):Promise<{plan:StoryboardSchema}>{
    let rawPlan:any;
    try{
      if(this.apiBase) rawPlan=(await this.backend("creative-director",{prompt,assets,brandKit,duration,aspectRatio})).plan;
      else if(this.getApiKey()) rawPlan=await this.directJson(`You are HNL Creative Director. Return strict JSON {concept,totalDuration,aspectRatio,scenes:[{id,title,duration,script,visualPrompt,sourceAssetId,cameraMovement,transition,shotType}],proposedChanges:[],missingMedia:[]}. Prefer uploaded media. User request: ${prompt}. Assets: ${JSON.stringify(assets.map(a=>({id:a.id,name:a.name,type:a.type,tags:a.tags})))}. Brand: ${JSON.stringify(brandKit)}. Duration ${duration}, aspect ${aspectRatio}.`);
      else rawPlan=this.localDirector(prompt,assets,brandKit,duration,aspectRatio);
    }catch(e){console.warn("Director fallback",e);rawPlan=this.localDirector(prompt,assets,brandKit,duration,aspectRatio);}
    const storyboard:StoryboardSchema={id:`sb-${Math.random().toString(36).slice(2,9)}`,title:rawPlan.concept||"Multimodal Video",conceptSummary:rawPlan.concept||prompt,totalDuration:rawPlan.totalDuration||duration,aspectRatio:(rawPlan.aspectRatio||aspectRatio) as any,scenes:(rawPlan.scenes||[]).map((sc:any,idx:number)=>({id:sc.id||`scene-${idx+1}`,sceneNumber:idx+1,title:sc.title||`Scene ${idx+1}`,duration:sc.duration||5,script:sc.script||"",visualPrompt:sc.visualPrompt||"",shots:[{id:`shot-${idx+1}-a`,shotName:`Shot A - ${sc.shotType||"Medium"}`,shotType:sc.shotType||"Medium",cameraMovement:sc.cameraMovement||"Static",cameraIntensity:"Medium",duration:sc.duration||5,visualPrompt:sc.visualPrompt||"",sourceType:sc.sourceAssetId?"USER_MEDIA":"AI_GENERATED"}],assignedAssetId:sc.sourceAssetId||undefined,transition:sc.transition||"fade",cameraMotion:sc.cameraMovement||"Static",status:"draft"})),proposedChanges:[],missingMediaRequirements:rawPlan.missingMedia||[],userApproved:false};
    return{plan:storyboard};
  }

  async generateImage(prompt:string,preserveOptions?:any,referenceImages?:Array<{base64:string;mimeType:string}>):Promise<{imageUrl?:string;textResponse?:string;promptUsed:string}>{
    if(this.apiBase)return this.backend("generate-image",{prompt,preserveOptions,referenceImages});
    const constraints=[] as string[]; if(preserveOptions?.preserveFace)constraints.push("preserve exact face/identity");if(preserveOptions?.preserveHair)constraints.push("preserve hair");if(preserveOptions?.preservePose)constraints.push("preserve pose");if(preserveOptions?.preserveProduct)constraints.push("preserve product geometry/logo/text");
    const fullPrompt=`${prompt}${constraints.length?`\nStrict constraints: ${constraints.join(", ")}.`:""}`;
    const parts:any[]=[{text:fullPrompt},...(referenceImages||[]).map(img=>({inlineData:{mimeType:img.mimeType,data:stripDataPrefix(img.base64)}}))];
    const data=await this.directModel("gemini-3.1-flash-image",{contents:[{role:"user",parts}]});
    for(const part of data?.candidates?.[0]?.content?.parts||[]){if(part.inlineData?.data)return{imageUrl:`data:${part.inlineData.mimeType||"image/png"};base64,${part.inlineData.data}`,promptUsed:fullPrompt};}
    return{textResponse:data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("")||"Model returned no image.",promptUsed:fullPrompt};
  }

  async generateVideo(params:{prompt:string;aspectRatio?:"16:9"|"9:16";references?:Array<{type:"image"|"video";base64:string;mimeType:string}>;model?:string}):Promise<{videoUrl:string;mimeType:string;interactionId?:string;model:string}>{
    if(this.apiBase)return this.backend("generate-video",params);
    const key=this.getApiKey();if(!key)throw new Error("Configure a Gemini API key before AI video generation.");
    const refs=params.references||[];
    const content:any[]=refs.map(r=>({type:r.type,mime_type:r.mimeType,data:stripDataPrefix(r.base64)})); content.push({type:"text",text:params.prompt});
    const hasVideo=refs.some(r=>r.type==="video");
    const imageCount=refs.filter(r=>r.type==="image").length;
    const input=refs.length===0?params.prompt:hasVideo?[{type:"user_input",content}]:content;
    const task=hasVideo?"edit":imageCount>1?"reference_to_video":imageCount===1?"image_to_video":"text_to_video";
    const body:any={model:params.model||"gemini-omni-flash-preview",input,response_format:{type:"video",aspect_ratio:params.aspectRatio||"16:9"},generation_config:{video_config:{task}}};
    const response=await fetch(`${API_ROOT}/interactions?key=${encodeURIComponent(key)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||`Video API error ${response.status}`);
    const output=(data.steps||[]).flatMap((step:any)=>step.content||[]).find((item:any)=>item.type==="video"&&item.data);
    if(!output?.data)throw new Error("Video model returned no video payload in REST interaction steps."); const mime=output.mime_type||output.mimeType||"video/mp4";
    return{videoUrl:`data:${mime};base64,${output.data}`,mimeType:mime,interactionId:data.id,model:body.model};
  }

  async enhancePrompt(originalPrompt:string,targetMedium="video"):Promise<any>{
    if(this.apiBase)return this.backend("enhance-prompt",{originalPrompt,targetMedium});
    if(!this.getApiKey())return{success:true,enhancedPrompt:originalPrompt,source:"local"};
    const out=await this.directJson(`Return JSON {enhancedPrompt}. Improve this ${targetMedium} prompt without changing intent: ${originalPrompt}`);return{success:true,...out};
  }

  async extractDocumentStory(documentText:string,filename:string,targetDuration=30):Promise<any>{
    if(this.apiBase)return this.backend("extract-document-story",{documentText,filename,targetDuration});
    if(this.getApiKey())return{success:true,...await this.directJson(`Create a ${targetDuration}s storyboard from ${filename}. Return JSON {summary,scenes:[{sceneNumber,title,sourcePageOrSection,sourceExcerpt,script,duration,visualIdeas}]}. Preserve exact facts and page markers. Content:\n${documentText.slice(0,30000)}`)};
    const chunks=documentText.split(/\n{2,}/).filter(Boolean).slice(0,6);return{success:true,source:"local-parser",summary:`Local draft from ${filename}`,scenes:chunks.map((p,i)=>({sceneNumber:i+1,title:`Section ${i+1}`,sourcePageOrSection:p.match(/^--- (Page|Slide) \d+/)?.[0]||`Section ${i+1}`,sourceExcerpt:p.slice(0,180),script:p.replace(/^---.*---/m,"").slice(0,260),duration:Math.max(3,Math.round(targetDuration/Math.max(1,chunks.length))),visualIdeas:"Use source media or user-approved generated visual"}))};
  }
}

export const aiClient=new AIStudioClient();
