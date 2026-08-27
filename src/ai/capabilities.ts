// Model capability registry. Keep conservative: only advertise features explicitly implemented/documented.
import { VideoCapabilities, ImageCapabilities } from "../types/ai";

type ModelEntry = { name:string; provider:string; type:"text"|"image"|"video"|"audio"; tier:"free"|"paid"; capabilities:Partial<VideoCapabilities & ImageCapabilities>; notes?:string };

export const MODEL_REGISTRY: Record<string, ModelEntry> = {
  "gemini-3.7-flash": { name:"Gemini 3.7 Flash", provider:"Google Gemini", type:"text", tier:"paid", capabilities:{}, notes:"Text/multimodal reasoning and Creative Director." },
  "gemini-3.1-flash-image": { name:"Gemini 3.1 Flash Image", provider:"Google Gemini", type:"image", tier:"paid", capabilities:{ textToImage:true,imageToImage:true,inPainting:true,outPainting:true,facePreservation:true,posePreservation:true,styleReference:true,resolutionOptions:["0.5K","1K","2K","4K"] } },
  "gemini-3.1-flash-lite-image": { name:"Gemini 3.1 Flash Lite Image", provider:"Google Gemini", type:"image", tier:"paid", capabilities:{ textToImage:true,imageToImage:true,inPainting:true,outPainting:false,facePreservation:true,posePreservation:true,styleReference:true,resolutionOptions:["1K"] } },
  "veo-3.1-lite-generate-preview": { name:"Veo 3.1 Lite", provider:"Google Veo", type:"video", tier:"paid", capabilities:{ textToVideo:true,imageToVideo:true,videoToVideo:false,firstFrame:true,lastFrame:true,imageReference:false,videoReference:false,motionReference:false,characterReference:false,audioReference:false,nativeAudio:true,maxDurationSeconds:8,supportedAspectRatios:["16:9","9:16"] }, notes:"Generation model. Do not advertise arbitrary existing-video editing." },
  "veo-3.1-generate-preview": { name:"Veo 3.1", provider:"Google Veo", type:"video", tier:"paid", capabilities:{ textToVideo:true,imageToVideo:true,videoToVideo:false,firstFrame:true,lastFrame:true,imageReference:true,videoReference:false,motionReference:false,characterReference:true,audioReference:false,nativeAudio:true,maxDurationSeconds:8,supportedAspectRatios:["16:9","9:16"] }, notes:"Supports advanced generation controls/reference images; existing-video natural-language editing is routed to Omni." },
  "gemini-omni-flash-preview": { name:"Gemini Omni Flash", provider:"Google Gemini", type:"video", tier:"paid", capabilities:{ textToVideo:true,imageToVideo:true,videoToVideo:true,firstFrame:false,lastFrame:false,imageReference:true,videoReference:true,motionReference:false,characterReference:true,audioReference:false,nativeAudio:true,maxDurationSeconds:8,supportedAspectRatios:["16:9","9:16"] }, notes:"Conversational video generation/editing; supports inline video data for smaller requests." }
};

export function checkVideoCapability(modelId:string, feature:keyof VideoCapabilities):{supported:boolean;reason?:string}{
  const model=MODEL_REGISTRY[modelId]; if(!model)return{supported:false,reason:`Model "${modelId}" is not registered.`};
  const value=(model.capabilities as Partial<VideoCapabilities>)[feature];
  if(typeof value==="boolean"&&value)return{supported:true};
  return{supported:false,reason:`${model.name} does not advertise ${String(feature)} in HNL's verified capability registry.`};
}
