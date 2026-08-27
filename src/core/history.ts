// History & State Time Travel Engine (Undo/Redo)

import { HistoryAction, HistoryEngineState } from "../types/history";

export class HistoryManager {
  private state: HistoryEngineState = {
    past: [],
    future: [],
    maxStackSize: 40,
    canUndo: false,
    canRedo: false
  };

  private listeners: Array<(state: HistoryEngineState) => void> = [];

  constructor(maxStack: number = 40) {
    this.state.maxStackSize = maxStack;
  }

  subscribe(listener: (state: HistoryEngineState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.state.canUndo = this.state.past.length > 0;
    this.state.canRedo = this.state.future.length > 0;
    for (const listener of this.listeners) listener(this.getState());
  }

  getState(): HistoryEngineState {
    return {
      ...this.state,
      canUndo: this.state.past.length > 0,
      canRedo: this.state.future.length > 0
    };
  }

  record(description: string, category: HistoryAction["category"], undoState: any, redoState: any) {
    const now = Date.now();
    const last = this.state.past[this.state.past.length - 1];
    if (last && last.category === category && last.description === description && now - last.timestamp < 450) {
      last.redoState = JSON.parse(JSON.stringify(redoState));
      last.timestamp = now;
      this.state.future = [];
      this.notify();
      return;
    }

    const action: HistoryAction = {
      id: "hist-" + Math.random().toString(36).substring(2, 9),
      description,
      category,
      timestamp: now,
      undoState: JSON.parse(JSON.stringify(undoState)),
      redoState: JSON.parse(JSON.stringify(redoState))
    };

    this.state.past.push(action);
    if (this.state.past.length > this.state.maxStackSize) this.state.past.shift();
    this.state.future = [];
    this.notify();
  }

  undo(): HistoryAction | null {
    if (this.state.past.length === 0) return null;
    const action = this.state.past.pop()!;
    this.state.future.unshift(action);
    this.notify();
    return action;
  }

  redo(): HistoryAction | null {
    if (this.state.future.length === 0) return null;
    const action = this.state.future.shift()!;
    this.state.past.push(action);
    this.notify();
    return action;
  }

  clear() {
    this.state.past = [];
    this.state.future = [];
    this.notify();
  }
}

export const historyEngine = new HistoryManager();
