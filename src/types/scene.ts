// Scene & Storyboard Schema for Multimodal Video Studio

export type ShotType = "Wide" | "Medium" | "Close-up" | "Product Detail" | "Establishing" | "Aerial";

export type CameraMovement =
  | "Static"
  | "Pan Left"
  | "Pan Right"
  | "Tilt Up"
  | "Tilt Down"
  | "Zoom In"
  | "Zoom Out"
  | "Dolly In"
  | "Dolly Out"
  | "Orbit"
  | "Tracking"
  | "Handheld"
  | "Crane";

export interface ShotSchema {
  id: string;
  shotName: string;
  shotType: ShotType;
  cameraMovement: CameraMovement;
  cameraIntensity: "Subtle" | "Medium" | "Strong";
  duration: number;
  visualPrompt: string;
  referenceAssetIds?: string[];
  generatedMediaUrl?: string;
  sourceType: "USER_MEDIA" | "AI_GENERATED" | "DOCUMENT_EXTRACTED" | "PLACEHOLDER";
}

export interface SceneSchema {
  id: string;
  sceneNumber: number;
  title: string;
  duration: number;
  script: string;
  voiceoverText?: string;
  voiceoverAudioUrl?: string;
  visualPrompt: string;
  shots: ShotSchema[];
  assignedAssetId?: string;
  assignedAssetUrl?: string;
  assignedAssetThumbnail?: string;
  transition: string;
  musicMood?: string;
  cameraMotion: CameraMovement;
  sourceDocTrace?: {
    documentName: string;
    pageNumber?: number;
    sectionTitle?: string;
    rawTextExcerpt?: string;
  };
  status: "draft" | "approved" | "generating" | "completed" | "error";
  generationError?: string;
}

export interface AIProposedChange {
  id: string;
  actionType: "trim_clip" | "reorder_scenes" | "adjust_duration" | "add_title" | "remove_scene" | "add_closeup" | "audio_ducking" | "apply_brand_logo" | "generate_missing_scene";
  description: string;
  targetId?: string;
  payload?: any;
  status: "pending" | "applied" | "rejected";
}

export interface StoryboardSchema {
  id: string;
  title: string;
  conceptSummary: string;
  totalDuration: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "4:3";
  scenes: SceneSchema[];
  proposedChanges: AIProposedChange[];
  missingMediaRequirements: Array<{
    sceneNumber: number;
    description: string;
    suggestedType: "image" | "video";
  }>;
  userApproved: boolean;
  approvedAt?: number;
}
