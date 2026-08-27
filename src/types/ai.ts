// AI Provider, Capabilities & Job Queue Schemas

export interface VideoCapabilities {
  textToVideo: boolean;
  imageToVideo: boolean;
  videoToVideo: boolean;
  firstFrame: boolean;
  lastFrame: boolean;
  imageReference: boolean;
  videoReference: boolean;
  motionReference: boolean;
  characterReference: boolean;
  audioReference: boolean;
  nativeAudio: boolean;
  maxDurationSeconds: number;
  supportedAspectRatios: string[];
}

export interface ImageCapabilities {
  textToImage: boolean;
  imageToImage: boolean;
  inPainting: boolean;
  outPainting: boolean;
  facePreservation: boolean;
  posePreservation: boolean;
  styleReference: boolean;
  resolutionOptions: string[];
}

export type AIJobStatus =
  | "QUEUED"
  | "UPLOADING"
  | "PROCESSING"
  | "COMPLETE"
  | "FAILED"
  | "CANCELLED";

export interface AIJob {
  id: string;
  type: "image_gen" | "video_gen" | "video_to_video" | "try_on" | "transcription" | "tts" | "director_plan";
  providerId: string;
  modelName: string;
  status: AIJobStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  estimatedCostCredits?: number;
  inputPayload: any;
  resultOutput?: any;
}

export interface ModelRouterConfig {
  mode: "AUTO" | "MANUAL";
  selectedTextModel: string;
  selectedImageModel: string;
  selectedVideoModel: string;
  selectedAudioModel: string;
  byokApiKey?: string;
  allowPaidModels: boolean;
}

export interface PromptBuilderAdvanced {
  subject: string;
  action: string;
  environment: string;
  cameraMovement: string;
  lighting: string;
  style: string;
  motionIntensity: "Subtle" | "Balanced" | "Strong" | "Reimagine";
  preserveItems: string[];
  avoidItems: string[];
  referenceTags: string[];
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  aspectRatio: string;
  durationSeconds: number;
  nativeAudio: boolean;
}

export interface AIProviderInterface {
  id: string;
  name: string;
  description: string;
  isConfigured: boolean;
  videoCapabilities: VideoCapabilities;
  imageCapabilities: ImageCapabilities;
  generateText(prompt: string, context?: any): Promise<string>;
  analyzeMedia(mediaUrl: string, mimeType: string, prompt?: string): Promise<any>;
  generateImage(params: any): Promise<string>;
  generateVideo(params: any): Promise<string>;
  transcribeAudio(audioBlob: Blob): Promise<any>;
}
