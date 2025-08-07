import {
  GlasatarConfig,
  AudioData,
  ShaderUniforms,
  TextureType,
} from './types';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import { AudioAnalyzer } from './audio-analyzer';

export class GlastarJS {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private uniforms: ShaderUniforms;
  private config: GlasatarConfig;
  private audioAnalyzer: AudioAnalyzer | null = null;
  private animationId: number | null = null;
  private isDisposed: boolean = false;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private backgroundTexture: WebGLTexture | null = null;
  private backgroundCanvas: HTMLCanvasElement;
  private backgroundCtx: CanvasRenderingContext2D;
  private smoothedAudioLevel: number = 0;
  private backgroundImageElement: HTMLImageElement | null = null;
  private startTime: number = Date.now();
  private backgroundDirty: boolean = true;
  private lastBackgroundConfig: string = '';
  private textureNeedsUpdate: boolean = true;
  private lastAvatarSize: number = 0;

  private static readonly TEXTURE_MAP: Record<TextureType, number> = {
    arctic: 0,
    cathedral: 1,
    autumn: 2,
    flemish: 3,
    ripple: 4,
    reeded: 5,
    vintage: 6,
    forest: 7,
  };

  constructor(canvas: HTMLCanvasElement, config: Partial<GlasatarConfig> = {}) {
    this.canvas = canvas;
    this.config = {
      width: config.width || 800,
      height: config.height || 600,
      texture: config.texture || 'arctic',
      glassOpacity: config.glassOpacity || 0.95,
      refractionStrength: config.refractionStrength || 1.0,
      blurAmount: config.blurAmount || 3.0,
      fps: config.fps || 60,
      avatarColor: config.avatarColor || '#4A90E2',
      avatarSize: config.avatarSize || 80,
      avatarSensitivity: config.avatarSensitivity || 1.0,
      avatarExpansion: config.avatarExpansion || 2.0,
      avatarSmoothing: config.avatarSmoothing || 0.25,
      avatarFadeWithAudio: config.avatarFadeWithAudio || false,
      backgroundColor: config.backgroundColor || '#000000',
      backgroundType: config.backgroundType || 'color',
      backgroundGradient: config.backgroundGradient || {
        centerColor: '#4A90E2',
        edgeColor: '#1a1a2e',
        angle: 45,
      },
      backgroundImage: config.backgroundImage,
      backgroundRotation: config.backgroundRotation || false,
      backgroundRotationSpeed: config.backgroundRotationSpeed || 10,
      backgroundScale: config.backgroundScale || 1.0,
    };

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    this.uniforms = {
      backgroundTexture: null,
      resolution: null,
      opacity: null,
      refraction: null,
      texture: null,
      blurAmount: null,
    };

    // Create background canvas for avatar
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width = this.config.width;
    this.backgroundCanvas.height = this.config.height;
    this.backgroundCtx = this.backgroundCanvas.getContext('2d')!;

    this.setupWebGL();
    this.createBackgroundTexture();
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(
        'Shader compilation error:',
        this.gl.getShaderInfoLog(shader)
      );
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private setupWebGL(): void {
    // Create shaders
    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    // Create program
    this.program = this.gl.createProgram();
    if (!this.program) {
      throw new Error('Failed to create WebGL program');
    }

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error(
        'Program linking error: ' + this.gl.getProgramInfoLog(this.program)
      );
    }

    // Clean up shaders after linking (they're no longer needed)
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    // Set up geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    // Create buffers
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

    // Get uniform locations
    this.uniforms = {
      backgroundTexture: this.gl.getUniformLocation(
        this.program,
        'u_backgroundTexture'
      ),
      resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      opacity: this.gl.getUniformLocation(this.program, 'u_opacity'),
      refraction: this.gl.getUniformLocation(this.program, 'u_refraction'),
      texture: this.gl.getUniformLocation(this.program, 'u_texture'),
      blurAmount: this.gl.getUniformLocation(this.program, 'u_blurAmount'),
    };

    // Set canvas size
    this.resize(this.config.width, this.config.height);
  }

  private createBackgroundTexture(): void {
    this.backgroundTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);

    // Set texture parameters
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
  }

  private drawAvatar(audioLevel: number): void {
    const ctx = this.backgroundCtx;
    const width = this.backgroundCanvas.width;
    const height = this.backgroundCanvas.height;

    // Apply smoothing to audio level using exponential moving average
    const targetLevel = audioLevel * this.config.avatarSensitivity;
    this.smoothedAudioLevel +=
      (targetLevel - this.smoothedAudioLevel) * this.config.avatarSmoothing;

    // Check if background needs redraw
    const currentBackgroundConfig = JSON.stringify({
      type: this.config.backgroundType,
      color: this.config.backgroundColor,
      gradient: this.config.backgroundGradient,
      image: this.config.backgroundImage,
      rotation: this.config.backgroundRotation,
      speed: this.config.backgroundRotationSpeed,
      scale: this.config.backgroundScale,
    });

    if (
      this.backgroundDirty ||
      this.lastBackgroundConfig !== currentBackgroundConfig ||
      this.config.backgroundRotation
    ) {
      // Draw background based on type (only when needed)
      this.drawBackground(ctx, width, height);
      this.backgroundDirty = false;
      this.lastBackgroundConfig = currentBackgroundConfig;
      this.textureNeedsUpdate = true;
    }

    // Avatar position (center)
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate avatar size based on smoothed audio level
    const baseSize = this.config.avatarSize;
    const maxExpansionSize = baseSize * this.config.avatarExpansion;
    const expandedSize =
      baseSize + this.smoothedAudioLevel * (maxExpansionSize - baseSize);

    // Calculate opacity based on audio level if fade is enabled
    let avatarOpacity = 1.0;
    if (this.config.avatarFadeWithAudio) {
      // Very aggressive fade scaling - reaches full opacity very quickly
      // Use steep power curve to make even quiet speech reach high opacity
      const scaledLevel = this.smoothedAudioLevel * 8.0; // Much higher multiplier
      avatarOpacity = Math.max(0.0, Math.min(1.0, Math.pow(scaledLevel, 0.3))); // Much steeper curve
    }

    // Create radial gradient for soft edges with dynamic opacity
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      expandedSize
    );

    // Parse the avatar color (assuming hex format) and apply opacity
    const color = this.config.avatarColor;
    const centerOpacity = Math.round(avatarOpacity * 255)
      .toString(16)
      .padStart(2, '0');
    const edgeOpacity = Math.round(avatarOpacity * 128)
      .toString(16)
      .padStart(2, '0'); // 50% of center opacity

    gradient.addColorStop(0, color + centerOpacity);
    gradient.addColorStop(0.7, color + edgeOpacity);
    gradient.addColorStop(1, color + '00'); // Always fully transparent at edge

    // Draw the avatar circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, expandedSize, 0, Math.PI * 2);
    ctx.fill();

    // Only mark texture for update if avatar actually changed significantly
    // This reduces GPU texture uploads for minor audio level changes
    if (
      Math.abs(expandedSize - this.lastAvatarSize) > 0.5 ||
      Math.abs(avatarOpacity - 1.0) > 0.01
    ) {
      this.textureNeedsUpdate = true;
    }
    this.lastAvatarSize = expandedSize;
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate rotation angle if enabled
    let rotationAngle = 0;
    if (this.config.backgroundRotation) {
      const elapsed = (Date.now() - this.startTime) / 1000; // seconds
      rotationAngle =
        (elapsed * this.config.backgroundRotationSpeed! * Math.PI) / 180; // degrees to radians
    }

    ctx.save();

    // Apply transformations: translate to center, scale, rotate, translate back
    ctx.translate(centerX, centerY);
    if (this.config.backgroundScale! !== 1.0) {
      ctx.scale(this.config.backgroundScale!, this.config.backgroundScale!);
    }
    if (rotationAngle !== 0) {
      ctx.rotate(rotationAngle);
    }
    ctx.translate(-centerX, -centerY);

    switch (this.config.backgroundType) {
      case 'color':
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        break;

      case 'radial-gradient': {
        const radialGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          (Math.max(width, height) / 2) * this.config.backgroundScale!
        );
        radialGradient.addColorStop(
          0,
          this.config.backgroundGradient!.centerColor
        );
        radialGradient.addColorStop(
          1,
          this.config.backgroundGradient!.edgeColor
        );
        ctx.fillStyle = radialGradient;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'linear-gradient': {
        const angle =
          ((this.config.backgroundGradient!.angle || 0) * Math.PI) / 180;
        const diagonal =
          (Math.sqrt(width * width + height * height) *
            this.config.backgroundScale!) /
          2;

        // Calculate start and end points for the linear gradient
        const startX = centerX - Math.cos(angle) * diagonal;
        const startY = centerY - Math.sin(angle) * diagonal;
        const endX = centerX + Math.cos(angle) * diagonal;
        const endY = centerY + Math.sin(angle) * diagonal;

        const linearGradient = ctx.createLinearGradient(
          startX,
          startY,
          endX,
          endY
        );
        linearGradient.addColorStop(
          0,
          this.config.backgroundGradient!.centerColor
        );
        linearGradient.addColorStop(
          1,
          this.config.backgroundGradient!.edgeColor
        );
        ctx.fillStyle = linearGradient;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'image':
        if (
          this.backgroundImageElement &&
          this.backgroundImageElement.complete
        ) {
          // Draw image to fill the canvas while maintaining aspect ratio
          const imgAspect =
            this.backgroundImageElement.width /
            this.backgroundImageElement.height;
          const canvasAspect = width / height;

          let drawWidth, drawHeight, drawX, drawY;

          if (imgAspect > canvasAspect) {
            // Image is wider, fit to height
            drawHeight = height;
            drawWidth = height * imgAspect;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
          } else {
            // Image is taller, fit to width
            drawWidth = width;
            drawHeight = width / imgAspect;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
          }

          ctx.drawImage(
            this.backgroundImageElement,
            drawX,
            drawY,
            drawWidth,
            drawHeight
          );
        } else {
          // Fallback to color if image not loaded
          ctx.fillStyle = this.config.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }
        break;
    }

    ctx.restore();
  }

  private loadBackgroundImage(): void {
    if (!this.config.backgroundImage) {
      // Clean up existing image if no image is set
      if (this.backgroundImageElement) {
        this.backgroundImageElement.onload = null;
        this.backgroundImageElement.onerror = null;
        this.backgroundImageElement.src = '';
        this.backgroundImageElement = null;
      }
      return;
    }

    // Clean up existing image before loading new one
    if (this.backgroundImageElement) {
      this.backgroundImageElement.onload = null;
      this.backgroundImageElement.onerror = null;
      this.backgroundImageElement.src = '';
    }

    this.backgroundImageElement = new Image();
    this.backgroundImageElement.crossOrigin = 'anonymous';
    this.backgroundImageElement.onload = () => {
      // Image loaded, will be used in next render
    };
    this.backgroundImageElement.onerror = () => {
      console.warn(
        'Failed to load background image:',
        this.config.backgroundImage
      );
      if (this.backgroundImageElement) {
        this.backgroundImageElement.onload = null;
        this.backgroundImageElement.onerror = null;
        this.backgroundImageElement = null;
      }
    };
    this.backgroundImageElement.src = this.config.backgroundImage;
  }

  connectAudioStream(stream: MediaStream): void {
    if (!this.audioAnalyzer) {
      this.audioAnalyzer = new AudioAnalyzer();
    }
    this.audioAnalyzer.connectStream(stream);
  }

  updateConfig(config: Partial<GlasatarConfig>): void {
    this.config = { ...this.config, ...config };

    // Mark background as dirty if any background-related config changed
    const backgroundKeys = [
      'backgroundColor',
      'backgroundType',
      'backgroundGradient',
      'backgroundImage',
      'backgroundRotation',
      'backgroundRotationSpeed',
      'backgroundScale',
    ];
    if (
      backgroundKeys.some(key =>
        Object.prototype.hasOwnProperty.call(config, key)
      )
    ) {
      this.backgroundDirty = true;
    }

    if (config.width !== undefined || config.height !== undefined) {
      this.resize(this.config.width, this.config.height);
      this.backgroundDirty = true;
    }
    if (config.backgroundImage !== undefined) {
      this.loadBackgroundImage();
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.backgroundCanvas.width = width;
    this.backgroundCanvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  private render = (): void => {
    if (!this.program || this.isDisposed) {
      return;
    }

    // Get audio data
    let audioData: AudioData = {
      level: 0,
      frequency: 0,
      frequencyData: new Uint8Array(0),
      timeDomainData: new Uint8Array(0),
    };

    if (this.audioAnalyzer) {
      audioData = this.audioAnalyzer.getAudioData();
    }

    // Draw avatar based on audio level
    this.drawAvatar(audioData.level);

    // Update background texture with avatar (only when changed)
    if (this.textureNeedsUpdate) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.backgroundCanvas
      );
      this.textureNeedsUpdate = false;
    }

    // Clear and render glass effect
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.useProgram(this.program);

    // Set uniforms (static glass texture)
    this.gl.uniform1i(this.uniforms.backgroundTexture, 0);
    this.gl.uniform2f(
      this.uniforms.resolution,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform1f(this.uniforms.opacity, this.config.glassOpacity);
    this.gl.uniform1f(this.uniforms.refraction, this.config.refractionStrength);
    this.gl.uniform1i(
      this.uniforms.texture,
      GlastarJS.TEXTURE_MAP[this.config.texture]
    );
    this.gl.uniform1f(this.uniforms.blurAmount, this.config.blurAmount);

    // Bind texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);

    // Bind attributes
    const positionLocation = this.gl.getAttribLocation(
      this.program,
      'a_position'
    );
    const texCoordLocation = this.gl.getAttribLocation(
      this.program,
      'a_texCoord'
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(
      texCoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // Only schedule next frame if not disposed
    if (!this.isDisposed) {
      this.animationId = requestAnimationFrame(this.render);
    }
  };

  start(): void {
    if (!this.animationId) {
      this.render();
    }
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose(): void {
    this.isDisposed = true;
    this.stop();

    if (this.audioAnalyzer) {
      this.audioAnalyzer.dispose();
      this.audioAnalyzer = null;
    }

    // Clean up WebGL resources
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }

    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }

    if (this.texCoordBuffer) {
      this.gl.deleteBuffer(this.texCoordBuffer);
      this.texCoordBuffer = null;
    }

    if (this.backgroundTexture) {
      this.gl.deleteTexture(this.backgroundTexture);
      this.backgroundTexture = null;
    }

    // Clean up image resources
    if (this.backgroundImageElement) {
      this.backgroundImageElement.onload = null;
      this.backgroundImageElement.onerror = null;
      this.backgroundImageElement.src = '';
      this.backgroundImageElement = null;
    }

    // Clean up canvas resources
    if (this.backgroundCanvas) {
      this.backgroundCanvas.width = 0;
      this.backgroundCanvas.height = 0;
    }
  }
}
