import React, { useRef, useEffect } from 'react';
import { GlastarJS, GlasatarConfig, TextureType } from '../lib';

export interface GlasatarProps extends Partial<GlasatarConfig> {
  // The audio stream is essential for the component to work
  audioStream?: MediaStream | null;

  // Common optional props
  className?: string;
  style?: React.CSSProperties;
}

// Props that are commonly needed for a good experience
export interface GlasatarRecommendedProps extends GlasatarProps {
  width: number;
  height: number;
  texture: TextureType;
  avatarColor: string;
  backgroundType: 'color' | 'radial-gradient' | 'linear-gradient' | 'image';
}

export const Glasatar: React.FC<GlasatarProps> = ({
  audioStream,
  className,
  style,
  ...config
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GlastarJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    // Create renderer
    rendererRef.current = new GlastarJS(canvasRef.current, config);
    rendererRef.current.start();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  // Handle audio stream changes
  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }

    if (audioStream) {
      rendererRef.current.connectAudioStream(audioStream);
    }
  }, [audioStream]);

  // Handle config updates
  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }
    rendererRef.current.updateConfig(config);
  }, [JSON.stringify(config)]); // Use JSON stringification to avoid massive dependency array

  // Handle resize
  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }
    if (config.width !== undefined && config.height !== undefined) {
      rendererRef.current.resize(config.width, config.height);
    }
  }, [config.width, config.height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        ...style,
      }}
    />
  );
};
