// Timeline Schema for Multimodal Video Studio

export type TrackType = "video" | "text" | "audio" | "caption" | "marker";

export interface ClipTransition {
  type: "none" | "fade" | "dissolve" | "wipe_left" | "wipe_right" | "slide_up" | "zoom_in" | "ai_bridge";
  duration: number;
}

export interface SmartReframeTracking {
  target: "face" | "active_speaker" | "person" | "product" | "center";
  focalPointX: number;
  focalPointY: number;
  zoom: number;
}

export interface ClipSchema {
  id: string;
  name: string;
  trackId: string;
  assetId?: string;
  type: "video" | "image" | "audio" | "text" | "caption" | "color" | "shape";
  start: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
  isMuted: boolean;
  fadeIn: number;
  fadeOut: number;
  autoDucking: boolean;
  duckingAmount: number;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  transitionIn?: ClipTransition;
  transitionOut?: ClipTransition;
  reframe?: SmartReframeTracking;
  textContent?: string;
  textStyle?: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    positionPreset?: "top" | "center" | "bottom" | "tiktok";
    karaokeHighlight?: boolean;
  };
  cachedWaveform?: number[];
  sourceDocumentExcerpt?: string;
  sourceDocumentPage?: number;
}

export interface TrackSchema {
  id: string;
  label: string;
  type: TrackType;
  order: number;
  isLocked: boolean;
  isMuted: boolean;
  isSolo: boolean;
  isVisible: boolean;
  volume: number;
  clips: ClipSchema[];
}

export interface MarkerSchema {
  id: string;
  time: number;
  label: string;
  color?: string;
  type: "scene" | "beat" | "hook" | "cta" | "custom";
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    isFiller?: boolean;
  }>;
  speakerId?: string;
  isHighlighted?: boolean;
}

export interface TimelineSchema {
  currentTime: number;
  duration: number;
  zoom: number;
  fps: number;
  snapToGrid: boolean;
  rippleEdit: boolean;
  tracks: TrackSchema[];
  markers: MarkerSchema[];
  captions: CaptionSegment[];
}
