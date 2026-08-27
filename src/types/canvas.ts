// Canvas & Layer Schema for HNL Creative AI Studio

export type CanvasElementType =
  | "image"
  | "text"
  | "shape"
  | "logo"
  | "qr"
  | "barcode"
  | "group"
  | "video_preview"
  | "chart";

export interface FilterAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  exposure: number;
  highlights: number;
  shadows: number;
  blur: number;
  sharpen: number;
  grayscale: number;
  sepia: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  dataBindingKey?: string;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right" | "justify";
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  assetId?: string;
  imageUrl?: string;
  originalImageUrl?: string;
  crop?: CropRect;
  filters?: FilterAdjustments;
  maskDataUrl?: string;
  shapeType?: "rectangle" | "circle" | "line" | "arrow" | "star" | "badge";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  animation?: {
    type: "none" | "fade" | "slide_left" | "slide_right" | "zoom_in" | "bounce" | "typewriter";
    duration: number;
    delay: number;
  };
}

export interface CanvasSchema {
  id: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImageUrl?: string;
  elements: CanvasElement[];
  selectedElementIds: string[];
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
}
