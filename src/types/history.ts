// History & Undo/Redo Engine Schema

export interface HistoryAction {
  id: string;
  description: string;
  timestamp: number;
  undoState: any;
  redoState: any;
  category: "canvas" | "timeline" | "scene" | "text" | "layer" | "director_plan" | "brand";
}

export interface HistoryEngineState {
  past: HistoryAction[];
  future: HistoryAction[];
  maxStackSize: number;
  canUndo: boolean;
  canRedo: boolean;
}
