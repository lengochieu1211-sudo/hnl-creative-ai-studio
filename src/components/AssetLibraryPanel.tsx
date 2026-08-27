// Universal Asset Library Panel & Multi-File Drag-Drop Uploader

import React, { useState, useRef } from "react";
import { AssetSchema, AssetCategory, AssetType } from "../types";
import { storage } from "../storage/db";
import { AudioEngine } from "../audio/audioEngine";
import { DocumentParser } from "../documents/parser";
import { 
  Upload, Image as ImageIcon, Video, Music, FileText, 
  Sparkles, Star, Trash2, Search, Tag, Eye, Layers
} from "lucide-react";

interface AssetLibraryProps {
  assets: AssetSchema[];
  onAssetsChange: (assets: AssetSchema[]) => void;
  onSelectAsset?: (asset: AssetSchema) => void;
  selectedAssetId?: string;
}

export const AssetLibraryPanel: React.FC<AssetLibraryProps> = ({
  assets,
  onAssetsChange,
  onSelectAsset,
  selectedAssetId
}) => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("images");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);


  type MediaMeta = { width?: number; height?: number; duration?: number; hasAudio?: boolean };

  const probeMediaMetadata = async (_file: File, url: string, assetType: AssetType): Promise<MediaMeta> => {
    if (assetType === "image") {
      return new Promise<{ width?: number; height?: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({});
        img.src = url;
      });
    }
    if (assetType === "video") {
      return new Promise<{ width?: number; height?: number; duration?: number; hasAudio?: boolean }>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Number.isFinite(video.duration) ? video.duration : undefined
        });
        video.onerror = () => resolve({});
        video.src = url;
      });
    }
    if (assetType === "audio") {
      return new Promise<{ duration?: number }>((resolve) => {
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        audio.onloadedmetadata = () => resolve({ duration: Number.isFinite(audio.duration) ? audio.duration : undefined });
        audio.onerror = () => resolve({});
        audio.src = url;
      });
    }
    return {};
  };

  const categories: Array<{ id: AssetCategory; label: string; icon: any }> = [
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "videos", label: "Videos", icon: Video },
    { id: "audio", label: "Audio", icon: Music },
    { id: "documents", label: "Docs/Excel", icon: FileText },
    { id: "generated", label: "AI Generated", icon: Sparkles },
    { id: "favorites", label: "Favorites", icon: Star }
  ];

  // Multi-file drag and drop handler (Accepts 20 JPG, 8 MP4, PDF, XLSX all at once)
  const handleFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    const files = Array.from(fileList);
    const newAssets: AssetSchema[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Processing ${i + 1}/${files.length}: ${file.name}`);

      let assetType: AssetType = "other";
      const mime = file.type.toLowerCase();
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "heic", "heif"].includes(ext)) {
        assetType = "image";
      } else if (mime.startsWith("video/") || ["mp4", "webm", "mov", "m4v", "mkv", "avi"].includes(ext)) {
        assetType = "video";
      } else if (mime.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(ext)) {
        assetType = "audio";
      } else if (["pdf", "xlsx", "xls", "csv", "doc", "docx", "ppt", "pptx", "txt", "md", "json"].includes(ext)) {
        assetType = "document";
      }

      const fileUrl = URL.createObjectURL(file);
      let waveform: number[] | undefined;
      let documentData: any;
      const mediaMeta = await probeMediaMetadata(file, fileUrl, assetType);

      // Real audio waveform extraction
      if (assetType === "audio" || assetType === "video") {
        try {
          waveform = await AudioEngine.extractWaveform(fileUrl, 60);
        } catch {
          // Audio buffer fallback
        }
      }

      // Real document parsing
      if (assetType === "document") {
        try {
          documentData = await DocumentParser.parseDocument(file);
        } catch (e) {
          console.warn("Document parse note:", e);
        }
      }

      const newAsset: AssetSchema = {
        id: "asset-" + Math.random().toString(36).substring(2, 9),
        name: file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        type: assetType,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        width: mediaMeta.width,
        height: mediaMeta.height,
        duration: mediaMeta.duration,
        hasAudio: mediaMeta.hasAudio,
        createdAt: Date.now(),
        origin: "USER_UPLOAD",
        url: fileUrl,
        thumbnailUrl: assetType === "image" ? fileUrl : undefined,
        tags: [assetType, ext],
        referenceTag: `@${file.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 8)}`,
        waveform,
        documentData
      };

      await storage.saveAsset(newAsset, file);
      newAssets.push(newAsset);
    }

    const updated = [...newAssets, ...assets];
    onAssetsChange(updated);
    setIsUploading(false);
    setUploadProgress("");
  };

  const filteredAssets = assets.filter((asset) => {
    // Category match
    if (activeCategory === "images" && asset.type !== "image" && asset.type !== "logo") return false;
    if (activeCategory === "videos" && asset.type !== "video") return false;
    if (activeCategory === "audio" && asset.type !== "audio") return false;
    if (activeCategory === "documents" && asset.type !== "document") return false;
    if (activeCategory === "generated" && asset.origin !== "AI_GENERATED" && asset.origin !== "AI_MODIFIED") return false;
    if (activeCategory === "favorites" && !asset.isFavorite) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = asset.name.toLowerCase().includes(q);
      const inTags = asset.tags.some((t) => t.toLowerCase().includes(q));
      const inDesc = asset.analysis?.description?.toLowerCase().includes(q);
      const inOcr = asset.analysis?.detectedElements?.ocrText?.toLowerCase().includes(q);
      return inName || inTags || inDesc || inOcr;
    }

    return true;
  });

  const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this asset from the project and local storage?")) return;
    await storage.deleteAsset(id);
    onAssetsChange(assets.filter((a) => a.id !== id));
  };

  const handleToggleFavorite = async (asset: AssetSchema, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...asset, isFavorite: !asset.isFavorite };
    await storage.saveAsset(updated);
    onAssetsChange(assets.map((a) => (a.id === asset.id ? updated : a)));
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 w-full lg:w-80 select-none"
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => { e.preventDefault(); handleFilesUpload(e.dataTransfer.files); }}
    >
      {/* Search and Upload Header */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Universal Asset Library
          </span>
          <span className="text-xs text-slate-500 font-mono">{assets.length} items</span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets, tags, text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-200 pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Dropzone Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => { handleFilesUpload(e.target.files); e.currentTarget.value = ""; }}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-all"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? uploadProgress : "Upload Media & Documents"}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto py-1 px-1 gap-1 text-xs">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-slate-800 text-amber-400 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredAssets.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            <Layers className="w-8 h-8 mb-2 opacity-30" />
            <p>No assets in this category.</p>
            <p className="mt-1 text-slate-600">Drag and drop files here to upload.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAssetId === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset?.(asset)}
                  className={`group relative bg-slate-950 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500 shadow-md shadow-amber-500/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-full h-24 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                    {asset.type === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : asset.type === "video" ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <Video className="w-6 h-6 mb-1 text-sky-400" />
                        <span className="text-[10px] uppercase font-mono">Video</span>
                      </div>
                    ) : asset.type === "audio" ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <Music className="w-6 h-6 mb-1 text-emerald-400" />
                        <span className="text-[10px] uppercase font-mono">Audio</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <FileText className="w-6 h-6 mb-1 text-amber-400" />
                        <span className="text-[10px] uppercase font-mono">Doc/Sheet</span>
                      </div>
                    )}

                    {/* Tag badge */}
                    {asset.referenceTag && (
                      <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300">
                        {asset.referenceTag}
                      </div>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleToggleFavorite(asset, e)}
                        className="p-1 rounded bg-black/70 text-slate-300 hover:text-amber-400"
                      >
                        <Star className={`w-3 h-3 ${asset.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteAsset(asset.id, e)}
                        className="p-1 rounded bg-black/70 text-slate-300 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Caption & Metadata */}
                  <div className="p-1.5">
                    <p className="text-[11px] font-medium text-slate-200 truncate">{asset.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase">{asset.type} • {(asset.size / 1024).toFixed(0)}KB</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
