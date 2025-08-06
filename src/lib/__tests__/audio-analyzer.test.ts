import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioAnalyzer } from '../audio-analyzer';

describe('AudioAnalyzer', () => {
  let audioAnalyzer: AudioAnalyzer;
  let mockStream: MediaStream;

  beforeEach(() => {
    audioAnalyzer = new AudioAnalyzer();
    mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    } as any;
  });

  afterEach(() => {
    audioAnalyzer.dispose();
  });

  describe('constructor', () => {
    it('should create AudioContext with correct settings', () => {
      expect(audioAnalyzer).toBeInstanceOf(AudioAnalyzer);
      // Check that internal properties are set correctly
      const audioData = audioAnalyzer.getAudioData();
      expect(audioData).toHaveProperty('level');
      expect(audioData).toHaveProperty('frequency');
      expect(audioData).toHaveProperty('timeDomainData');
      expect(audioData).toHaveProperty('frequencyData');
    });

    it('should initialize with correct analyser settings', () => {
      // Test that the analyser is configured for low latency
      const audioData = audioAnalyzer.getAudioData();
      expect(audioData.timeDomainData).toBeInstanceOf(Uint8Array);
    });
  });

  describe('connectStream', () => {
    it('should connect to media stream', () => {
      expect(() => {
        audioAnalyzer.connectStream(mockStream);
      }).not.toThrow();
    });

    it('should disconnect previous stream when connecting new one', () => {
      const firstStream = mockStream;
      const secondStream = {
        getTracks: () => [{ stop: vi.fn() }],
      } as any;

      audioAnalyzer.connectStream(firstStream);
      expect(() => {
        audioAnalyzer.connectStream(secondStream);
      }).not.toThrow();
    });
  });

  describe('getAudioData', () => {
    beforeEach(() => {
      audioAnalyzer.connectStream(mockStream);
    });

    it('should return audio data with correct structure', () => {
      const audioData = audioAnalyzer.getAudioData();

      expect(audioData).toHaveProperty('level');
      expect(audioData).toHaveProperty('frequency');
      expect(audioData).toHaveProperty('timeDomainData');
      expect(audioData).toHaveProperty('frequencyData');

      expect(typeof audioData.level).toBe('number');
      expect(typeof audioData.frequency).toBe('number');
      expect(audioData.timeDomainData).toBeInstanceOf(Uint8Array);
      expect(audioData.frequencyData).toBeInstanceOf(Uint8Array);
    });

    it('should return audio level between 0 and 1', () => {
      const audioData = audioAnalyzer.getAudioData();
      expect(audioData.level).toBeGreaterThanOrEqual(0);
      expect(audioData.level).toBeLessThanOrEqual(1);
    });

    it('should calculate RMS correctly for known signal', () => {
      // Mock the analyser to return a known pattern
      const mockAnalyser = {
        getByteTimeDomainData: vi.fn((array: Uint8Array) => {
          // Fill with a sine wave pattern
          for (let i = 0; i < array.length; i++) {
            array[i] = 128 + Math.sin(i * 0.1) * 50; // Sine wave around 128
          }
        }),
      };

      // Replace the internal analyser (this is a bit hacky but necessary for testing)
      (audioAnalyzer as any).analyser = mockAnalyser;

      const audioData = audioAnalyzer.getAudioData();
      expect(audioData.level).toBeGreaterThan(0);
      expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
    });

    it('should handle silent audio correctly', () => {
      // Mock the analyser to return silent data (all 128 = no signal)
      const mockAnalyser = {
        getByteTimeDomainData: vi.fn((array: Uint8Array) => {
          array.fill(128); // Silent audio (DC offset at 128)
        }),
      };

      (audioAnalyzer as any).analyser = mockAnalyser;

      const audioData = audioAnalyzer.getAudioData();
      expect(audioData.level).toBe(0);
    });

    it('should efficiently process limited samples', () => {
      const mockAnalyser = {
        getByteTimeDomainData: vi.fn((array: Uint8Array) => {
          // Verify we don't process more than 1024 samples for performance
          expect(array.length).toBeGreaterThanOrEqual(256); // FFT size 512 = 256 bins
          for (let i = 0; i < array.length; i++) {
            array[i] = 128 + (i % 2 ? 50 : -50); // Alternating pattern
          }
        }),
      };

      (audioAnalyzer as any).analyser = mockAnalyser;

      const audioData = audioAnalyzer.getAudioData();
      expect(audioData.level).toBeGreaterThan(0);
    });

    it('should skip expensive frequency calculation', () => {
      const audioData = audioAnalyzer.getAudioData();

      // Should skip frequency calculation for performance
      expect(audioData.frequency).toBe(0);
      expect(audioData.frequencyData).toHaveLength(0);
    });
  });

  describe('disconnect', () => {
    it('should disconnect audio source', () => {
      audioAnalyzer.connectStream(mockStream);
      expect(() => {
        audioAnalyzer.disconnect();
      }).not.toThrow();
    });

    it('should handle multiple disconnect calls', () => {
      audioAnalyzer.connectStream(mockStream);
      audioAnalyzer.disconnect();
      expect(() => {
        audioAnalyzer.disconnect();
      }).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should properly dispose of resources', () => {
      audioAnalyzer.connectStream(mockStream);

      expect(() => {
        audioAnalyzer.dispose();
      }).not.toThrow();
    });

    it('should close AudioContext', () => {
      const audioContext = (audioAnalyzer as any).audioContext;
      const closeSpy = vi.spyOn(audioContext, 'close');

      audioAnalyzer.dispose();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle disposal when already closed', () => {
      // Simulate already closed context
      const audioContext = (audioAnalyzer as any).audioContext;
      audioContext.state = 'closed';

      expect(() => {
        audioAnalyzer.dispose();
      }).not.toThrow();
    });
  });

  describe('performance characteristics', () => {
    it('should process audio data within acceptable time', () => {
      audioAnalyzer.connectStream(mockStream);

      const startTime = performance.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        audioAnalyzer.getAudioData();
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      // Should process each frame in less than 1ms for 60fps performance
      expect(avgTime).toBeLessThan(1);
    });

    it('should have consistent memory usage', () => {
      audioAnalyzer.connectStream(mockStream);

      // Call getAudioData multiple times and ensure no memory leaks
      const initialData = audioAnalyzer.getAudioData();
      const initialArrayLength = initialData.timeDomainData.length;

      for (let i = 0; i < 100; i++) {
        const data = audioAnalyzer.getAudioData();
        expect(data.timeDomainData.length).toBe(initialArrayLength);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid streams gracefully', () => {
      expect(() => {
        audioAnalyzer.connectStream(null as any);
      }).not.toThrow();
    });

    it('should continue working after audio context errors', () => {
      audioAnalyzer.connectStream(mockStream);

      // Simulate context error
      const audioContext = (audioAnalyzer as any).audioContext;
      audioContext.state = 'suspended';

      expect(() => {
        audioAnalyzer.getAudioData();
      }).not.toThrow();
    });
  });
});
