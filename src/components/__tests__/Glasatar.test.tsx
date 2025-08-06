import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Glasatar } from '../Glasatar';
import { GlastarJS } from '../../lib';

// Mock the core GlastarJS renderer
vi.mock('../../lib', () => ({
  GlastarJS: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    connectAudioStream: vi.fn(),
    updateConfig: vi.fn(),
    resize: vi.fn(),
  })),
}));

// Mock MediaStream
const mockStream = {
  getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
} as unknown as MediaStream;

describe('Glasatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock canvas element
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: vi.fn().mockReturnValue({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
      }),
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<Glasatar />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('creates renderer with config', () => {
    const config = {
      width: 800,
      height: 600,
      texture: 'arctic' as const,
      glassOpacity: 0.95,
    };

    const { container } = render(<Glasatar {...config} />);

    expect(GlastarJS).toHaveBeenCalledWith(container.firstChild, config);
  });

  it('connects audio stream when provided', () => {
    const mockConnectStream = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: mockConnectStream,
      updateConfig: vi.fn(),
      resize: vi.fn(),
    }));

    render(<Glasatar audioStream={mockStream} />);

    expect(mockConnectStream).toHaveBeenCalledWith(mockStream);
  });

  it('updates config when props change', async () => {
    const mockUpdateConfig = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: vi.fn(),
      updateConfig: mockUpdateConfig,
      resize: vi.fn(),
    }));

    const initialConfig = { width: 800, height: 600 };
    const updatedConfig = { width: 1200, height: 800 };

    const { rerender } = render(<Glasatar {...initialConfig} />);

    rerender(<Glasatar {...updatedConfig} />);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith(updatedConfig);
    });
  });

  it('handles audio stream changes', () => {
    const mockConnectStream = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: mockConnectStream,
      updateConfig: vi.fn(),
      resize: vi.fn(),
    }));

    const stream1 = mockStream;
    const stream2 = { ...mockStream } as MediaStream;

    const { rerender } = render(<Glasatar audioStream={stream1} />);
    rerender(<Glasatar audioStream={stream2} />);

    expect(mockConnectStream).toHaveBeenCalledWith(stream2);
  });

  it('cleans up on unmount', () => {
    const mockDispose = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: mockDispose,
      connectAudioStream: vi.fn(),
      updateConfig: vi.fn(),
      resize: vi.fn(),
    }));

    const { unmount } = render(<Glasatar />);
    unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  it('handles resize when dimensions change', () => {
    const mockResize = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: vi.fn(),
      updateConfig: vi.fn(),
      resize: mockResize,
    }));

    const { rerender } = render(<Glasatar width={800} height={600} />);
    rerender(<Glasatar width={1200} height={800} />);

    expect(mockResize).toHaveBeenCalledWith(1200, 800);
  });

  it('applies className and style props', () => {
    const { container } = render(<Glasatar />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveStyle({ display: 'block' });
  });

  it('handles audio stream without crashing', () => {
    render(<Glasatar audioStream={mockStream} />);
    // Should not throw
  });

  it('updates avatar color when prop changes', async () => {
    const mockUpdateConfig = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: vi.fn(),
      updateConfig: mockUpdateConfig,
      resize: vi.fn(),
    }));

    const { rerender } = render(<Glasatar avatarColor="#00ff00" />);
    rerender(<Glasatar avatarColor="#ff0000" />);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarColor: '#ff0000',
        })
      );
    });
  });

  it('disposes renderer on unmount', () => {
    const mockDispose = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: mockDispose,
      connectAudioStream: vi.fn(),
      updateConfig: vi.fn(),
      resize: vi.fn(),
    }));

    const { unmount } = render(<Glasatar />);
    unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  it('handles complex configuration updates', async () => {
    const mockUpdateConfig = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: vi.fn(),
      updateConfig: mockUpdateConfig,
      resize: vi.fn(),
    }));

    const complexConfig = {
      width: 800,
      height: 600,
      texture: 'cathedral' as const,
      glassOpacity: 0.9,
      refractionStrength: 1.5,
      blurAmount: 5.0,
      avatarColor: '#ff0000',
      avatarSize: 100,
      avatarSensitivity: 2.0,
      avatarExpansion: 3.0,
      avatarSmoothing: 0.3,
      avatarFadeWithAudio: true,
      backgroundColor: '#000000',
      backgroundType: 'radial-gradient' as const,
      backgroundGradient: {
        centerColor: '#ff0000',
        edgeColor: '#000000',
      },
    };

    const { rerender } = render(<Glasatar {...complexConfig} />);

    const updatedConfig = {
      ...complexConfig,
      texture: 'autumn' as const,
      avatarColor: '#00ff00',
    };

    rerender(<Glasatar {...updatedConfig} />);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith(updatedConfig);
    });
  });

  it('handles multiple rapid config changes', async () => {
    const mockUpdateConfig = vi.fn();
    (GlastarJS as any).mockImplementation(() => ({
      start: vi.fn(),
      dispose: vi.fn(),
      connectAudioStream: vi.fn(),
      updateConfig: mockUpdateConfig,
      resize: vi.fn(),
    }));

    const { rerender } = render(<Glasatar avatarColor="#000000" />);
    rerender(<Glasatar avatarColor="#ff0000" />);
    rerender(<Glasatar avatarColor="#00ff00" />);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarColor: '#00ff00',
        })
      );
    });
  });

  it('handles canvas ref properly', () => {
    const { container } = render(<Glasatar />);
    const canvas = container.firstChild as HTMLCanvasElement;
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('maintains renderer instance across re-renders', () => {
    const { rerender } = render(<Glasatar />);

    // Should only create one instance
    expect(GlastarJS).toHaveBeenCalledTimes(1);

    rerender(<Glasatar width={1200} />);

    // Should not create a new instance
    expect(GlastarJS).toHaveBeenCalledTimes(1);
  });
});
