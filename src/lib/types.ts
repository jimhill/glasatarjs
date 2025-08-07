export type TextureType =
  | 'arctic'
  | 'cathedral'
  | 'autumn'
  | 'flemish'
  | 'ripple'
  | 'reeded'
  | 'vintage'
  | 'forest';

export type AvatarState = 'speaking' | 'listening' | 'thinking';
export type AvatarShape = 'square' | 'circle';

export interface GlasatarConfig {
  // Canvas dimensions
  width?: number; // defaults to 800 - when avatarShape is set, this acts as size for both dimensions
  height?: number; // defaults to 600 - ignored when avatarShape is 'circle' or 'square'

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
  avatarState?: AvatarState; // defaults to 'speaking'
  avatarShape?: AvatarShape; // defaults to 'square'

  // Listening state animation settings
  listeningPulseBase?: number; // defaults to 50 - base width of the inner glow
  listeningPulseAmplitude?: number; // defaults to 35 - how much the glow pulses
  listeningPulseSpeed?: number; // defaults to 0.002 - speed of pulsing

  // Thinking state animation settings
  thinkingBorderWidth?: number; // defaults to 6 - width of the rotating border
  thinkingBorderSpeed?: number; // defaults to 0.8 - speed of border rotation (pixels per frame)
  thinkingBorderLength?: number; // defaults to 0.15 - length of the rotating segment (0-1 proportion)
  thinkingBorderTrailSegments?: number; // defaults to 10 - number of trailing segments

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
