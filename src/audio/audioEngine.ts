// Web Audio Engine: Real Waveform Extraction, Audio Ducking & Beat Detection

export class AudioEngine {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    return this.audioCtx;
  }

  static async extractWaveform(audioUrl: string, samplePoints: number = 80): Promise<number[]> {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / samplePoints);
      const peaks: number[] = [];
      for (let i = 0; i < samplePoints; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) sum += Math.abs(channelData[start + j] || 0);
        const avg = sum / blockSize;
        peaks.push(Math.min(1.0, avg * 3.5));
      }
      return peaks;
    } catch (e) {
      console.warn("Audio waveform generation error:", e);
      return [];
    }
  }

  static async detectBeats(audioUrl: string): Promise<number[]> {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const beatTimes: number[] = [];
      const step = Math.floor(sampleRate * 0.25);
      let prevEnergy = 0;
      for (let i = 0; i < channelData.length; i += step) {
        let energy = 0;
        for (let j = 0; j < Math.min(step, channelData.length - i); j++) energy += Math.abs(channelData[i + j]);
        energy = energy / step;
        if (energy > prevEnergy * 1.4 && energy > 0.08) beatTimes.push(parseFloat((i / sampleRate).toFixed(2)));
        prevEnergy = energy;
      }
      return beatTimes.slice(0, 30);
    } catch (e) {
      console.warn("Beat detection error:", e);
      return [];
    }
  }
}
