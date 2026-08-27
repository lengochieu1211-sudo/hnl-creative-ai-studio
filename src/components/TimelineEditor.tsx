// Professional Multi-Track Timeline with real clip drag, cross-track move, trim handles, split and waveform display.

import React, { useEffect, useRef, useState } from "react";
import { TimelineSchema, ClipSchema, AssetSchema, TrackSchema } from "../types";
import { Play, Pause, Scissors, Trash2, Volume2, VolumeX, Lock, Unlock, Eye, EyeOff, ZoomIn, ZoomOut } from "lucide-react";

interface TimelineEditorProps {
  timeline: TimelineSchema;
  onTimelineChange: (timeline: TimelineSchema) => void;
  assets: AssetSchema[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
}

type DragMode = "move" | "trim-left" | "trim-right";
interface ClipDragState {
  clipId: string;
  sourceTrackId: string;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  originalClip: ClipSchema;
}

const compatibleTrack = (clip: ClipSchema, track: TrackSchema) => {
  if (clip.type === "audio") return track.type === "audio";
  if (clip.type === "text") return track.type === "text";
  if (clip.type === "caption") return track.type === "caption" || track.type === "text";
  return track.type === "video";
};

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ timeline, onTimelineChange, assets, isPlaying, onTogglePlay, onSeek }) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ClipDragState | null>(null);

  const formatTimecode = (seconds: number, fps = 30) => {
    const hrs = Math.floor(seconds / 3600), mins = Math.floor((seconds % 3600) / 60), secs = Math.floor(seconds % 60), frames = Math.floor((seconds % 1) * fps);
    return `${hrs.toString().padStart(2,"0")}:${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}:${frames.toString().padStart(2,"0")}`;
  };
  const snapTime = (value: number) => timeline.snapToGrid ? Math.round(value * 10) / 10 : value;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    onSeek(Math.max(0, Math.min(timeline.duration, x / timeline.zoom)));
  };

  const findClip = (clipId: string) => {
    for (const track of timeline.tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return { track, clip };
    }
    return null;
  };

  const startClipDrag = (e: React.PointerEvent, track: TrackSchema, clip: ClipSchema, mode: DragMode) => {
    if (track.isLocked) return;
    e.preventDefault(); e.stopPropagation();
    setSelectedClipId(clip.id);
    dragRef.current = { clipId: clip.id, sourceTrackId: track.id, mode, startClientX: e.clientX, startClientY: e.clientY, originalClip: { ...clip } };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dxSeconds = (e.clientX - drag.startClientX) / timeline.zoom;
      const sourceTrackIndex = timeline.tracks.findIndex((t) => t.id === drag.sourceTrackId);
      const rowDelta = Math.round((e.clientY - drag.startClientY) / 48);
      let targetTrackIndex = Math.max(0, Math.min(timeline.tracks.length - 1, sourceTrackIndex + rowDelta));
      let targetTrack = timeline.tracks[targetTrackIndex];
      if (!compatibleTrack(drag.originalClip, targetTrack) || targetTrack.isLocked) targetTrack = timeline.tracks[sourceTrackIndex];

      let updatedClip: ClipSchema = { ...drag.originalClip };
      if (drag.mode === "move") {
        updatedClip.start = Math.max(0, snapTime(drag.originalClip.start + dxSeconds));
        updatedClip.trackId = targetTrack.id;
      } else if (drag.mode === "trim-left") {
        const maxDelta = drag.originalClip.duration - 0.1;
        const delta = Math.max(-drag.originalClip.trimStart, Math.min(maxDelta, dxSeconds));
        updatedClip.start = Math.max(0, snapTime(drag.originalClip.start + delta));
        updatedClip.duration = Math.max(0.1, snapTime(drag.originalClip.duration - delta));
        updatedClip.trimStart = Math.max(0, snapTime(drag.originalClip.trimStart + delta * drag.originalClip.speed));
      } else {
        const sourceAvailable = Math.max(0.1, drag.originalClip.trimEnd - drag.originalClip.trimStart);
        const newDuration = Math.max(0.1, Math.min(sourceAvailable / Math.max(0.01, drag.originalClip.speed), drag.originalClip.duration + dxSeconds));
        updatedClip.duration = snapTime(newDuration);
        updatedClip.trimEnd = snapTime(drag.originalClip.trimStart + updatedClip.duration * drag.originalClip.speed);
      }

      const tracks = timeline.tracks.map((track) => ({ ...track, clips: track.clips.filter((c) => c.id !== drag.clipId) }));
      const targetIndex = tracks.findIndex((t) => t.id === updatedClip.trackId);
      trac{s[targetIndex].clips = [...tracks[targetIndex].clips, updatedClip].sort((a,b)=>a.start-b.start);
      const maxEnd = Math.max(1, ...tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)));
      onTimelineChange({ ...timeline, tracks, duration: Math.max(timeline.duration, maxEnd) });
    };
    const onPointerUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => { window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp); };
  }, [timeline, onTimelineChange]);

  const handleSplitClipAtPlayhead = () => {
    if (!selectedClipId) return;
    const found = findClip(selectedClipId);
    if (!found || found.track.isLocked) return;
    const clip = found.clip;
    if (timeline.currentTime <= clip.start || timeline.currentTime >= clip.start + clip.duration) return;
    const split = timeline.currentTime - clip.start;
    const sourceSplit = split * clip.speed;
    const first: ClipSchema = { ...clip, id: `clip-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, duration: split, trimEnd: clip.trimStart + sourceSplit };
    const second: ClipSchema = { ...clip, id: `clip-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, start: timeline.currentTime, duration: clip.duration - split, trimStart: clip.trimStart + sourceSplit };
    onTimelineChange({ ...timeline, tracks: timeline.tracks.map((t) => t.id === found.track.id ? { ...t, clips: t.clips.flatMap((c) => c.id === clip.id ? [first, second] : [c]) } : t) });
    setSelectedClipId(second.id);
  };

  const deleteSelected = () => {
    if (!selectedClipId) return;
    const tracks = timeline.tracks.map((t) => t.isLocked ? t : { ...t, clips: t.clips.filter((c) => c.id !== selectedClipId) });
    onTimelineChange({ ...timeline, tracks }); setSelectedClipId(null);
  };

  const setTrack = (id: string, updates: Partial<TrackSchema>) => onTimelineChange({ ...timeline, tracks: timeline.tracks.map((t) => t.id === id ? { ...t, ...updates } : t) });
  const handleZoom = (dir: "in"|"out") => onTimelineChange({ ...timeline, zoom: dir === "in" ? Math.min(200, timeline.zoom * 1.25) : Math.max(10, timeline.zoom / 1.25) });

  return (
    <div className="flex flex-col h-56 sm:h-72 bg-slate-950 border-t border-slate-800 text-slate-200 select-none shrink-0">
      <div className="min-h-10 border-b border-slate-800 bg-slate-900/90 px-2 sm:px-4 py-1 flex items-center justify-between gap-2 text-xs overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={onTogglePlay} className="w-7 h-7 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center">{isPlaying?<Pause className="w-4 h-4"/>:<Play className="w-4 h-4 ml-0.5"/>}</button>
          <button onClick={handleSplitClipAtPlayhead} disabled={!selectedClipId} className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"><Scissors className="w-3.5 h-3.5"/><span className="hidden sm:inline">Split</span></button>
          <button onClick={deleteSelected} disabled={!selectedClipId} className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 disabled:opacity-40"><Trash2 className="w-3.5 h-3.5"/></button>
          <span className="font-mono text-amber-400 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">{formatTimecode(timeline.currentTime,timeline.fps)}</span>
          <span className="hidden sm:inline text-slate-500">/ {formatTimecode(timeline.duration,timeline.fps)}</span>
          <span className="hidden md:inline text-[10px] text-slate-600">Drag clip • drag edges to trim • vertical drag moves compatible tracks</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={()=>handleZoom("out")} className="p-1 rounded hover:bg-slate-800"><ZoomOut className="w-4 h-4"/></button><span className="hidden sm:inline text-[10px] text-slate-500 font-mono">{Math.round(timeline.zoom)}px/s</span><button onClick={()=>handleZoom("in")} className="p-1 rounded hover:bg-slate-800"><ZoomIn className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-28 sm:w-48 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col overflow-y-auto pt-6">
          {timeline.tracks.map((track) => (
            <div key={track.id} className="h-12 border-b border-slate-800/80 px-1 sm:px-2 flex items-center gap-1 text-xs shrink-0">
              <span className={`w-2 h-2 rounded-full ${track.type==="video"?"bg-sky-400":track.type==="audio"?"bg-emerald-400":"bg-amber-400"}`}/>
              <span className="font-medium text-slate-300 text-[9px] sm:text-[10px] truncate flex-1">{track.label}</span>
              <button onClick={()=>setTrack(track.id,{isVisible:!track.isVisible})} className="p-0.5 text-slate-500">{track.isVisible?<Eye className="w-3 h-3"/>:<EyeOff className="w-3 h-3"/>}</button>
              <button onClick={()=>setTrack(track.id,{isLocked:!track.isLocked})} className="p-0.5 text-slate-500">{track.isLocked?<Lock className="w-3 h-3 text-amber-400"/>:<Unlock className="w-3 h-3"/>}</button>
              <button onClick={()=>setTrack(track.id,{isMuted:!track.isMuted})} className="p-0.5 text-slate-500">{track.isMuted?<VolumeX className="w-3 h-3 text-rose-400"/>:<Volume2 className="w-3 h-3"/>}</button>
            </div>
          ))}
        </div>

        <div ref={timelineRef} onClick={handleTimelineClick} className="flex-1 bg-slate-950 overflow-auto relative cursor-pointer">
          <div className="h-6 border-b border-slate-800 sticky top-0 bg-slate-950/95 z-30" style={{ minWidth: (timeline.duration+5)*timeline.zoom }}>
            {Array.from({length:Math.ceil(timeline.duration)+6}).map((_,sec)=><div key={sec} className="absolute text-[9px] font-mono text-slate-600 border-l border-slate-800 pl-1 h-4" style={{left:sec*timeline.zoom}}>{sec%5===0?`${sec}s`:""}</div>)}
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-40 pointer-events-none" style={{left:timeline.currentTime*timeline.zoom}}><div className="w-3 h-3 bg-rose-500 rotate-45 -ml-1.5 -mt-1.5 rounded-sm"/></div>
          <div className="relative" style={{width:(timeline.duration+5)*timeline.zoom,minWidth:"100%"}}>
            {timeline.tracks.map((track)=><div key={track.id} className={`h-12 border-b border-slate-900 relative ${!track.isVisible?"opacity-30":""}`}>
              {track.clips.map((clip)=>{
                const selected=selectedClipId===clip.id;
                const asset=clip.assetId?assets.find(a=>a.id===clip.assetId):undefined;
                return <div key={clip.id} onPointerDown={(e)=>startClipDrag(e,track,clip,"move")} onClick={(e)=>{e.stopPropagation();setSelectedClipId(clip.id);}} className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-xs overflow-hidden shadow-sm cursor-grab active:cursor-grabbing ${track.type==="video"?"bg-sky-950/80 border border-sky-600/60 text-sky-200":track.type==="audio"?"bg-emerald-950/80 border border-emerald-600/60 text-emerald-200":"bg-amber-950/80 border border-amber-600/60 text-amber-200"} ${selected?"ring-2 ring-amber-400 z-10":""}`} style={{left:clip.start*timeline.zoom,width:Math.max(8,clip.duration*timeline.zoom)}} title={`${clip.name}${asset?` • ${asset.filename}`:""}`}>
                  <button onPointerDown={(e)=>startClipDrag(e,track,clip,"trim-left")} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 hover:bg-amber-400/50" aria-label="Trim left"/>
                  <span className="truncate text-[10px] font-medium pl-1">{clip.name}</span><span className="text-[9px] opacity-70 font-mono pr-1">{clip.duration.toFixed(1)}s</span>
                  {track.type==="audio" && clip.cachedWaveform && <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-around">{clip.cachedWaveform.slice(0,40).map((peak,idx)=><div key={idx} className="w-px bg-emerald-300 rounded-full" style={{height:Math.max(3,peak*30)}}/>)}</div>}
                  <button onPointerDown={(e)=>startClipDrag(e,track,clip,"trim-right")} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 hover:bg-amber-400/50" aria-label="Trim right"/>
                </div>;
              })}
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
};
