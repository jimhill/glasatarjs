import { AudioData } from './types';

export class AudioAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer>;
  private frequencyData: Uint8Array<ArrayBuffer>;
  private smoothingFactor = 0.85;

  constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512; // Reduced from 2048 for lower latency
    this.analyser.smoothingTimeConstant = 0.1; // Reduced from 0.85 for faster response

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    this.frequencyData = new Uint8Array(new ArrayBuffer(bufferLength));
  }

  connectStream(stream: MediaStream): void {
    if (this.source) {
      this.source.disconnect();
    }

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  getAudioData(): AudioData {
    this.analyser.getByteTimeDomainData(this.dataArray);
    // Only get frequency data if we actually need it for visualization
    // this.analyser.getByteFrequencyData(this.frequencyData);

    // More efficient audio level calculation using RMS
    let sum = 0;
    const samples = Math.min(this.dataArray.length, 1024); // Limit processing for performance
    for (let i = 0; i < samples; i++) {
      const amplitude = (this.dataArray[i] - 128) / 128;
      sum += amplitude * amplitude;
    }
    const rms = Math.sqrt(sum / samples);
    const audioLevel = Math.min(rms * 2, 1); // Scale and clamp

    // Skip expensive frequency calculation since it's rarely used
    // Only calculate if specifically needed for effects
    return {
      level: audioLevel,
      frequency: 0, // Skip expensive calculation
      frequencyData: new Uint8Array(0), // Empty array to save memory
      timeDomainData: this.dataArray,
    };
  }

  disconnect(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
  }

  dispose(): void {
    this.disconnect();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
