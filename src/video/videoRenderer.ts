// Browser media compositor for HNL Creative AI Studio.
// Renders real image/video/audio/text timeline clips to WebM using Canvas + WebAudio + MediaRecorder.

import { AssetSchema, CanvasSchema, ClipSchema, TimelineSchema } from "../types";

export interface RenderProgressCallback { (progress: number, status: string): void; }

const waitForMedia = (el: HTMLMediaElement) => new Promise<void>((resolve, reject) => {
  if (el.readyState >= 2) { resolve(); return; }
  const ok = () => { cleanup(); resolve(); };
  const fail = () => { cleanup(); reject(new Error(`Unable to load media: ${el.src}`)); };
  const cleanup = () => { el.removeEventListener("canplay", ok); el.removeEventListener("loadeddata", ok); el.removeEventListener("error", fail); };
  el.addEventListener("canplay", ok, { once: true });
  el.addEventListener("loadeddata", ok, { once: true });
  el.addEventListener("error", fail, { once: true });
  el.load();
});

const waitForImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error(`Unable to load image: ${src}`));
  img.src = src;
});

const drawContainRect = (ctx: CanvasRenderingContext2D, media: CanvasImageSource, sourceW: number, sourceH: number, x: number, y: number, width: number, height: number) => {
  if (!sourceW || !sourceH) return;
  const ratio = Math.min(width / sourceW, height / sourceH);
  const dw = sourceW * ratio, dh = sourceH * ratio;
  ctx.drawImage(media, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
};

const canvasFilterString = (filters: any) => {
  if (!filters) return "none";
  const brightness = Math.max(0, 100 + (filters.brightness || 0));
  const contrast = Math.max(0, 100 + (filters.contrast || 0));
  const saturation = Math.max(0, 100 + (filters.saturation || 0));
  const blur = Math.max(0, filters.blur || 0);
  const grayscale = Math.max(0, filters.grayscale || 0);
  const sepia = Math.max(0, filters.sepia || 0);
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%)`;
};

const drawCover = (ctx: CanvasRenderingContext2D, media: CanvasImageSource, sourceW: number, sourceH: number, width: number, height: number, opacity = 1) => {
  if (!sourceW || !sourceH) return;
  const ratio = Math.max(width / sourceW, height / sourceH);
  const dw = sourceW * ratio, dh = sourceH * ratio;
  ctx.save(); ctx.globalAlpha = opacity;
  ctx.drawImage(media, (width - dw) / 2, (height - dh) / 2, dw, dh);
  ctx.restore();
};

export class VideoRenderer {
  static getSupportedVideoMimeType(): string | null {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    return candidates.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) || null;
  }

  static async renderCanvasImage(canvasSchema: CanvasSchema, options: { width?: number; height?: number; mimeType?: "image/png" | "image/jpeg" | "image/webp"; quality?: number }): Promise<Blob> {
    const width = options.width || canvasSchema.width, height = options.height || canvasSchema.height;
    const out = document.createElement("canvas"); out.width = width; out.height = height;
    const ctx = out.getContext("2d"); if (!ctx) throw new Error("Canvas 2D is unavailable");
    const scaleX = width / canvasSchema.width, scaleY = height / canvasSchema.height;
    ctx.fillStyle = canvasSchema.backgroundColor || "#0f172a"; ctx.fillRect(0,0,width,height);
    const imageCache = new Map<string, HTMLImageElement>();
    if (canvasSchema.backgroundImageUrl) {
      const background = await waitForImage(canvasSchema.backgroundImageUrl);
      drawCover(ctx, background, background.naturalWidth, background.naturalHeight, width, height);
    }
    for (const el of canvasSchema.elements.slice().sort((a,b)=>a.zIndex-b.zIndex)) {
      if (!el.isVisible) continue;
      ctx.save();
      const cx = (el.x + el.width/2)*scaleX, cy=(el.y+el.height/2)*scaleY;
      ctx.translate(cx,cy); ctx.rotate(el.rotation*Math.PI/180); ctx.scale(el.scaleX,el.scaleY); ctx.globalAlpha=el.opacity;
      const x=-el.width*scaleX/2, y=-el.height*scaleY/2, w=el.width*scaleX, h=el.height*scaleY;
      if ((el.type === "image" || el.type === "logo") && el.imageUrl) {
        let img=imageCache.get(el.imageUrl);
        if(!img){img=await waitForImage(el.imageUrl);imageCache.set(el.imageUrl,img);}
        ctx.filter = canvasFilterString(el.filters);
        drawContainRect(ctx,img,img.naturalWidth,img.naturalHeight,x,y,w,h);
        ctx.filter = "none";
      } else if (el.type === "shape") {
        ctx.fillStyle=el.fill||"#d97706"; ctx.fillRect(x,y,w,h);
      } else if (el.type === "text") {
        ctx.fillStyle=el.color||"#fff"; ctx.font=`${el.fontWeight||"normal"} ${Math.max(8,(el.fontSize||24)*scaleY)}px ${el.fontFamily||"sans-serif"}`;
        ctx.textAlign=el.textAlign === "center" ? "center" : el.textAlign === "right" ? "right" : "left"; ctx.textBaseline="top";
        const tx=el.textAlign==="center"?0:el.textAlign==="right"?w/2:x; ctx.fillText(el.content||"",tx,y,w);
      }
      ctx.restore();
    }
    return new Promise((resolve,reject)=>out.toBlob((blob)=>blob?resolve(blob):reject(new Error("Image export failed")),options.mimeType||"image/png",options.quality??0.95));
  }

  static async renderTimeline(
    timeline: TimelineSchema,
    assets: AssetSchema[],
    options: { width: number; height: number; fps?: number; backgroundColor?: string },
    onProgress?: RenderProgressCallback
  ): Promise<Blob> {
    const mimeType=this.getSupportedVideoMimeType();
    if(!mimeType) throw new Error("This browser does not support MediaRecorder WebM export.");
    const width=options.width,height=options.height,fps=options.fps||30;
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas 2D is unavailable");
    const assetMap=new Map(assets.map(a=>[a.id,a]));
    const imageCache=new Map<string,HTMLImageElement>();
    const mediaByClip=new Map<string,HTMLMediaElement>();
    const audioCtx=new AudioContext(); await audioCtx.resume();
    const audioDestination=audioCtx.createMediaStreamDestination();

    onProgress?.(3,"Loading timeline media...");
    for(const track of timeline.tracks){
      for(const clip of track.clips){
        const asset=clip.assetId?assetMap.get(clip.assetId):undefined;
        if(!asset?.url)continue;
        if(asset.type==="image" && !imageCache.has(asset.id)){
          try{imageCache.set(asset.id,await waitForImage(asset.url));}catch(e){console.warn(e);}
        }
        if(asset.type==="video"||asset.type==="audio"){
          const el=document.createElement(asset.type==="video"?"video":"audio") as HTMLMediaElement;
          el.src=asset.url;el.preload="auto";if(el instanceof HTMLVideoElement)el.playsInline=true;el.muted=false;
          try{await waitForMedia(el);}catch(e){console.warn(e);continue;}
          try{
            const source=audioCtx.createMediaElementSource(el); const gain=audioCtx.createGain();
            gain.gain.value=(track.isMuted||clip.isMuted)?0:Math.max(0,clip.volume*track.volume); source.connect(gain).connect(audioDestination);
          }catch(e){console.warn("Audio graph:",e);}
          mediaByClip.set(clip.id,el);
        }
      }
    }

    const canvasStream=canvas.captureStream(fps);
    const outputStream=new MediaStream([...canvasStream.getVideoTracks(),...audioDestination.stream.getAudioTracks()]);
    const recorder=new MediaRecorder(outputStream,{mimeType,videoBitsPerSecond:6_000_000});
    const chunks:Blob[]=[]; recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};

    const activeClipsAt=(time:number)=>timeline.tracks.filter(t=>t.isVisible!==false).flatMap((track)=>track.clips.filter(c=>time>=c.start&&time<c.start+c.duration).map(c=>({track,clip:c}))).sort((a,b)=>a.clip.zIndex-b.clip.zIndex);
    const syncMedia=(clip:ClipSchema,el:HTMLMediaElement,time:number,shouldPlay:boolean)=>{
      const sourceTime=clip.trimStart+(time-clip.start)*clip.speed;
      if(Number.isFinite(el.duration)){const safe=Math.max(0,Math.min(Math.max(0,el.duration-0.03),sourceTime));if(Math.abs(el.currentTime-safe)>.18)el.currentTime=safe;}
      el.playbackRate=Math.max(.25,Math.min(4,clip.speed));
      if(shouldPlay&&el.paused)el.play().catch(()=>{}); else if(!shouldPlay&&!el.paused)el.pause();
    };

    return new Promise<Blob>((resolve,reject)=>{
      recorder.onerror=()=>reject(new Error("MediaRecorder failed"));
      recorder.onstop=async()=>{
        mediaByClip.forEach(el=>el.pause()); canvasStream.getTracks().forEach(t=>t.stop()); outputStream.getTracks().forEach(t=>t.stop());
        await audioCtx.close(); onProgress?.(100,"WebM export complete"); resolve(new Blob(chunks,{type:mimeType}));
      };
      recorder.start(1000); const start=performance.now(); const duration=Math.max(.1,timeline.duration);
      const render=()=>{
        const time=(performance.now()-start)/1000;
        if(time>=duration){recorder.stop();return;}
        ctx.fillStyle=options.backgroundColor||"#0f172a";ctx.fillRect(0,0,width,height);
        const active=activeClipsAt(time);
        mediaByClip.forEach((el,id)=>{const found=active.find(x=>x.clip.id===id);if(found)syncMedia(found.clip,el,time,true);else if(!el.paused)el.pause();});
        for(const {clip} of active){
          const asset=clip.assetId?assetMap.get(clip.assetId):undefined;
          const elapsed=time-clip.start; const remaining=clip.start+clip.duration-time;
          const fadeInFactor=clip.fadeIn>0?Math.min(1,Math.max(0,elapsed/clip.fadeIn)):1;
          const fadeOutFactor=clip.fadeOut>0?Math.min(1,Math.max(0,remaining/clip.fadeOut)):1;
          const visualOpacity=clip.opacity*Math.min(fadeInFactor,fadeOutFactor);
          ctx.save();ctx.globalAlpha=visualOpacity;
          if(asset?.type==="image") { const img=imageCache.get(asset.id); if(img)drawCover(ctx,img,img.naturalWidth,img.naturalHeight,width,height,visualOpacity); }
          else if(asset?.type==="video") { const video=mediaByClip.get(clip.id) as HTMLVideoElement|undefined; if(video&&video.readyState>=2)drawCover(ctx,video,video.videoWidth,video.videoHeight,width,height,visualOpacity); }
          else if(clip.type==="color") {ctx.fillStyle="#111827";ctx.fillRect(0,0,width,height);}
          if(clip.type==="text"||clip.type==="caption"){
            const style=clip.textStyle||{};ctx.fillStyle=style.color||"#fff";ctx.font=`bold ${style.fontSize||42}px ${style.fontFamily||"sans-serif"}`;ctx.textAlign="center";ctx.textBaseline="middle";
            if(style.backgroundColor){ctx.fillStyle=style.backgroundColor;ctx.fillRect(width*.08,height*.75,width*.84,80);ctx.fillStyle=style.color||"#fff";}
            ctx.fillText(clip.textContent||clip.name,width/2,style.positionPreset==="top"?height*.15:style.positionPreset==="center"?height*.5:height*.82,width*.88);
          }
          ctx.restore();
        }
        const p=Math.min(99,Math.round(time/duration*96)+3);onProgress?.(p,`Rendering ${time.toFixed(1)} / ${duration.toFixed(1)} sec`);
        requestAnimationFrame(render);
      };
      render();
    });
  }

  static async renderSlideshow(items:Array<{url:string;duration:number;caption?:string}>,options:{width:number;height:number;fps?:number},onProgress?:RenderProgressCallback):Promise<Blob>{
    const assets:AssetSchema[]=items.map((item,i)=>({id:`slide-${i}`,name:item.caption||`Slide ${i+1}`,filename:`slide-${i}.png`,type:"image",mimeType:"image/png",size:0,createdAt:Date.now(),origin:"USER_UPLOAD",url:item.url,tags:[]}));
    let t=0; const clips:ClipSchema[]=items.map((item,i)=>{const c:ClipSchema={id:`clip-${i}`,name:item.caption||`Slide ${i+1}`,trackId:"v1",assetId:`slide-${i}`,type:"image",start:t,duration:item.duration,trimStart:0,trimEnd:item.duration,speed:1,volume:1,isMuted:false,fadeIn:0,fadeOut:0,autoDucking:false,duckingAmount:0,opacity:1,x:0,y:0,scale:1,rotation:0,zIndex:1};t+=item.duration;return c;});
    const timeline:TimelineSchema={currentTime:0,duration:t,zoom:40,fps:options.fps||30,snapToGrid:true,rippleEdit:false,tracks:[{id:"v1",label:"Video",type:"video",order:1,isLocked:false,isMuted:false,isSolo:false,isVisible:true,volume:1,clips}],markers:[],captions:[]};
    return this.renderTimeline(timeline,assets,options,onProgress);
  }
}
