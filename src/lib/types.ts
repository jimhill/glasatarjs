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
  width: number;
  height: number;
  texture: TextureType;
  glassOpacity: number;
  refractionStrength: number;
  blurAmount: number;
  fps: number;
  // Avatar configuration
  avatarColor: string;
  avatarSize: number;
  avatarSensitivity: number;
  avatarExpansion: number;
  avatarSmoothing: number;
  avatarFadeWithAudio: boolean;
  backgroundColor: string;
  backgroundType: 'color' | 'radial-gradient' | 'linear-gradient' | 'image';
  backgroundGradient?: {
    centerColor: string;
    edgeColor: string;
    angle?: number; // For linear gradients (degrees)
  };
  backgroundImage?: string;
  backgroundRotation?: boolean;
  backgroundRotationSpeed?: number;
  backgroundScale?: number;
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
