export type TextureType =
  | 'arctic'
  | 'cathedral'
  | 'autumn'
  | 'flemish'
  | 'ripple'
  | 'reeded'
  | 'vintage'
  | 'forest';

export interface GlasatarConfig {
  // Canvas dimensions - should typically be specified
  width?: number; // defaults to 800
  height?: number; // defaults to 600

  // Glass effect settings (optional with sensible defaults)
  texture?: TextureType; // defaults to 'arctic'
  glassOpacity?: number; // defaults to 0.95
  refractionStrength?: number; // defaults to 1.0
  blurAmount?: number; // defaults to 3.0
  fps?: number; // defaults to 60

  // Avatar configuration (optional with sensible defaults)
  avatarColor?: string; // defaults to '#4A90E2'
  avatarSize?: number; // defaults to 80
  avatarSensitivity?: number; // defaults to 1.0
  avatarExpansion?: number; // defaults to 2.0
  avatarSmoothing?: number; // defaults to 0.25
  avatarFadeWithAudio?: boolean; // defaults to false

  // Background configuration (optional with sensible defaults)
  backgroundColor?: string; // defaults to '#000000'
  backgroundType?: 'color' | 'radial-gradient' | 'linear-gradient' | 'image'; // defaults to 'color'
  backgroundGradient?: {
    centerColor: string;
    edgeColor: string;
    angle?: number; // For linear gradients (degrees)
  };
  backgroundImage?: string | undefined;
  backgroundRotation?: boolean; // defaults to true
  backgroundRotationSpeed?: number; // defaults to 0
  backgroundScale?: number; // defaults to 1.0
}

export interface AudioData {
  level: number;
  frequency: number;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}

export interface ShaderUniforms {
  backgroundTexture: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
  refraction: WebGLUniformLocation | null;
  texture: WebGLUniformLocation | null;
  blurAmount: WebGLUniformLocation | null;
}
