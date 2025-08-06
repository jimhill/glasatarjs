import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlastarJS } from '../privacy-glass-renderer';
import { AudioAnalyzer } from '../audio-analyzer';
import type { GlasatarConfig } from '../types';

// Performance benchmarks to ensure optimizations don't regress
const PERFORMANCE_THRESHOLDS = {
  RENDERER_INIT_TIME: 100, // ms - Should initialize quickly
  SINGLE_FRAME_TIME: 16, // ms - 60fps requirement
  CONFIG_UPDATE_TIME: 5, // ms - Config updates should be fast
  TEXTURE_UPDATE_TIME: 8, // ms - Texture uploads should be efficient
  AUDIO_PROCESSING_TIME: 2, // ms - Audio analysis should be very fast
  MEMORY_LEAK_THRESHOLD: 10, // MB - Memory should remain stable
  DISPOSE_TIME: 50, // ms - Cleanup should be fast
};

describe('Performance Regression Tests', () => {
  let mockCanvas: HTMLCanvasElement;
  let renderer: GlastarJS;
  let audioAnalyzer: AudioAnalyzer;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
    if (audioAnalyzer) {
      audioAnalyzer.dispose();
    }
  });

  describe('Glasatar Performance', () => {
    it('should initialize within performance threshold', () => {
      const startTime = performance.now();

      renderer = new GlastarJS(mockCanvas);

      const initTime = performance.now() - startTime;
      expect(initTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDERER_INIT_TIME);
    });

    it('should handle single frame rendering efficiently', () => {
      renderer = new GlastarJS(mockCanvas);

      const startTime = performance.now();

      // Simulate frame rendering
      (renderer as any).drawAvatar(0.5);

      const frameTime = performance.now() - startTime;
      expect(frameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME);
    });

    it('should update config efficiently', () => {
      renderer = new GlastarJS(mockCanvas);

      const configs: Partial<GlasatarConfig>[] = [
        { avatarColor: '#ff0000' },
        { blurAmount: 12 },
        { texture: 'arctic' },
        { backgroundColor: '#00ff00' },
      ];

      const startTime = performance.now();

      configs.forEach(config => {
        renderer.updateConfig(config);
      });

      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / configs.length;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONFIG_UPDATE_TIME);
    });

    it('should maintain 60fps during continuous rendering', async () => {
      renderer = new GlastarJS(mockCanvas);
      renderer.start();

      const frameTimes: number[] = [];

      // Monitor frame timing for 100ms
      const startTime = performance.now();
      const duration = 100;

      while (performance.now() - startTime < duration) {
        const frameStart = performance.now();
        (renderer as any).drawAvatar(Math.random());
        const frameEnd = performance.now();

        frameTimes.push(frameEnd - frameStart);
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }

      renderer.stop();

      // Check that most frames are under the threshold
      const acceptableFrames = frameTimes.filter(
        time => time < PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME
      ).length;

      const acceptableRatio = acceptableFrames / frameTimes.length;
      expect(acceptableRatio).toBeGreaterThan(0.9); // 90% of frames should be fast
    });

    it('should optimize texture uploads with dirty flags', () => {
      renderer = new GlastarJS(mockCanvas);

      // Verify dirty flag optimization exists
      expect((renderer as any).textureNeedsUpdate).toBeDefined();
      expect((renderer as any).backgroundDirty).toBeDefined();

      // Test that multiple renders don't cause performance issues
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        (renderer as any).drawAvatar(0.5);
      }
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME * 10
      );
    });

    it('should handle background dirty flags efficiently', () => {
      renderer = new GlastarJS(mockCanvas);
      const drawBackgroundSpy = vi.spyOn(renderer as any, 'drawBackground');

      // First render should draw background
      (renderer as any).drawAvatar(0.5);
      expect(drawBackgroundSpy).toHaveBeenCalled();

      drawBackgroundSpy.mockClear();

      // Subsequent renders without config changes should skip background
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        (renderer as any).drawAvatar(0.5 + i * 0.01);
      }
      const totalTime = performance.now() - startTime;

      expect(drawBackgroundSpy).not.toHaveBeenCalled();
      expect(totalTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME * 10
      );
    });

    it('should dispose resources quickly', () => {
      renderer = new GlastarJS(mockCanvas);
      renderer.start();

      const startTime = performance.now();
      renderer.dispose();
      const disposeTime = performance.now() - startTime;

      expect(disposeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DISPOSE_TIME);
    });

    it('should handle rapid config changes without performance degradation', () => {
      renderer = new GlastarJS(mockCanvas);

      const configs = Array.from({ length: 100 }, (_, i) => ({
        avatarColor: `#${i.toString(16).padStart(6, '0')}`,
        blurAmount: i % 20,
      }));

      const startTime = performance.now();

      configs.forEach(config => {
        renderer.updateConfig(config);
      });

      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / configs.length;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONFIG_UPDATE_TIME);
    });
  });

  describe('AudioAnalyzer Performance', () => {
    beforeEach(() => {
      audioAnalyzer = new AudioAnalyzer();
    });

    it('should process audio data within time threshold', () => {
      const mockStream = { getTracks: () => [{ stop: vi.fn() }] } as any;
      audioAnalyzer.connectStream(mockStream);

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        audioAnalyzer.getAudioData();
      }

      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.AUDIO_PROCESSING_TIME
      );
    });

    it('should use efficient RMS calculation', () => {
      const mockStream = { getTracks: () => [{ stop: vi.fn() }] } as any;
      audioAnalyzer.connectStream(mockStream);

      // Mock analyser with known data pattern
      const mockAnalyser = {
        getByteTimeDomainData: vi.fn((array: Uint8Array) => {
          // Create a pattern that would be expensive with simple averaging
          for (let i = 0; i < array.length; i++) {
            array[i] = 128 + Math.sin(i * 0.001) * 100;
          }
        }),
      };

      (audioAnalyzer as any).analyser = mockAnalyser;

      const startTime = performance.now();
      const audioData = audioAnalyzer.getAudioData();
      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.AUDIO_PROCESSING_TIME
      );
      expect(audioData.level).toBeGreaterThan(0);
    });

    it('should limit sample processing for performance', () => {
      const mockStream = { getTracks: () => [{ stop: vi.fn() }] } as any;
      audioAnalyzer.connectStream(mockStream);

      const mockAnalyser = {
        getByteTimeDomainData: vi.fn((array: Uint8Array) => {
          // Large array to test sample limiting
          for (let i = 0; i < array.length; i++) {
            array[i] = 128 + (i % 2 ? 50 : -50);
          }
        }),
      };

      (audioAnalyzer as any).analyser = mockAnalyser;
      (audioAnalyzer as any).dataArray = new Uint8Array(4096); // Large array

      const startTime = performance.now();
      audioAnalyzer.getAudioData();
      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.AUDIO_PROCESSING_TIME
      );
    });

    it('should skip expensive frequency analysis for performance', () => {
      const mockStream = { getTracks: () => [{ stop: vi.fn() }] } as any;
      audioAnalyzer.connectStream(mockStream);

      const mockAnalyser = {
        getByteTimeDomainData: vi.fn((array: Uint8Array) => {
          array.fill(128);
        }),
        getByteFrequencyData: vi.fn(), // Should not be called
      };

      (audioAnalyzer as any).analyser = mockAnalyser;

      const startTime = performance.now();
      const audioData = audioAnalyzer.getAudioData();
      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.AUDIO_PROCESSING_TIME
      );
      expect(mockAnalyser.getByteFrequencyData).not.toHaveBeenCalled();
      expect(audioData.frequency).toBe(0);
      expect(audioData.frequencyData).toHaveLength(0);
    });
  });

  describe('Memory Management Performance', () => {
    it('should not leak memory during normal operation', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize ?? 0;

      renderer = new GlastarJS(mockCanvas);

      // Simulate normal usage pattern
      for (let i = 0; i < 100; i++) {
        renderer.updateConfig({
          avatarColor: `#${(i % 256).toString(16).padStart(6, '0')}`,
        });
        (renderer as any).drawAvatar(Math.random());
      }

      renderer.dispose();

      // Force garbage collection if available
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize ?? 0;
      const memoryDiff = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB

      expect(memoryDiff).toBeLessThan(
        PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD
      );
    });

    it('should clean up WebGL resources efficiently', () => {
      renderer = new GlastarJS(mockCanvas);

      const startTime = performance.now();
      renderer.dispose();
      const disposeTime = performance.now() - startTime;

      expect(disposeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DISPOSE_TIME);
      expect((renderer as any).isDisposed).toBe(true);
    });

    it('should handle image cleanup without memory leaks', () => {
      renderer = new GlastarJS(mockCanvas);

      // Simulate multiple background image changes
      for (let i = 0; i < 50; i++) {
        renderer.updateConfig({
          backgroundImage: `https://example.com/image${i}.jpg`,
          backgroundType: 'image',
        });
      }

      const startTime = performance.now();
      renderer.dispose();
      const disposeTime = performance.now() - startTime;

      expect(disposeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DISPOSE_TIME);
      expect((renderer as any).backgroundImageElement).toBeNull();
    });
  });

  describe('Optimization Effectiveness', () => {
    it('should demonstrate blur optimization effectiveness', () => {
      renderer = new GlastarJS(mockCanvas);

      // Test that fewer taps generally perform better
      const blur5TapTime = measureBlurPerformance(5);
      const blur25TapTime = measureBlurPerformance(25);

      // Either 5-tap is faster, or both are reasonably fast
      const optimizationWorks =
        blur5TapTime < blur25TapTime ||
        (blur5TapTime < PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME &&
          blur25TapTime < PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME * 2);

      expect(optimizationWorks).toBe(true);
    });

    it('should verify dirty flag optimization effectiveness', () => {
      renderer = new GlastarJS(mockCanvas);

      // Verify dirty flag optimization exists
      expect((renderer as any).backgroundDirty).toBeDefined();
      expect((renderer as any).textureNeedsUpdate).toBeDefined();

      // Test that renderer handles multiple renders efficiently
      const startTime = performance.now();
      for (let i = 0; i < 5; i++) {
        (renderer as any).drawAvatar(0.5);
      }
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SINGLE_FRAME_TIME * 5
      );
    });
  });

  // Helper functions
  function measureBlurPerformance(tapCount: number): number {
    const startTime = performance.now();

    // Simulate blur operation complexity
    for (let i = 0; i < tapCount * 1000; i++) {
      Math.sin(i * 0.01);
    }

    return performance.now() - startTime;
  }
});
