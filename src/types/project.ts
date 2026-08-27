// Project Schema & Core Types for HNL Creative AI Studio

import { CanvasSchema } from "./canvas";
import { TimelineSchema } from "./timeline";
import { StoryboardSchema } from "./scene";

export type ProjectType =
  | "design"
  | "image"
  | "video"
  | "document_video"
  | "fashion"
  | "menu"
  | "catalogue"
  | "invitation"
  | "shorts";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "4:3" | "21:9" | "custom";

export interface BrandKitSchema {
  id: string;
  name: string;
  logoAssetId?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  qrCodeUrl?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    zalo?: string;
  };
}

export interface CharacterReference {
  id: string;
  name: string;
  description?: string;
  frontAssetId?: string;
  sideAssetId?: string;
  fullBodyAssetId?: string;
  customThumbnails?: string[];
  referenceTag: string;
}

export interface ProductReference {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price?: number;
  salePrice?: number;
  specification?: string;
  frontAssetId?: string;
  backAssetId?: string;
  packagingAssetId?: string;
  qrCode?: string;
  referenceTag: string;
}

export interface PageSchema {
  id: string;
  pageNumber: number;
  title: string;
  canvas: CanvasSchema;
  duration?: number;
  notes?: string;
}

export interface ExportSettings {
  format: "png" | "jpg" | "webp" | "pdf" | "mp4" | "webm";
  resolution: { width: number; height: number };
  fps: 24 | 30 | 60;
  quality: "low" | "medium" | "high" | "maximum";
  includeAudio: boolean;
  bitrate?: number;
}

export interface ProjectSchema {
  id: string;
  name: string;
  description?: string;
  version: string;
  type: ProjectType;
  aspectRatio: AspectRatio;
  dimensions: { width: number; height: number };
  createdAt: number;
  updatedAt: number;
  currentPageIndex: number;
  pages: PageSchema[];
  timeline: TimelineSchema;
  storyboard: StoryboardSchema;
  brandKit: BrandKitSchema;
  characters: CharacterReference[];
  products: ProductReference[];
  exportSettings: ExportSettings;
  preferMyMedia: boolean;
  useOnlyMyFiles: boolean;
  activeSceneId?: string;
}
