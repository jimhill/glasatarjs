import {
  GlasatarConfig,
  AudioData,
  ShaderUniforms,
  TextureType,
  AvatarState,
  AvatarShape,
} from './types';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import { AudioAnalyzer } from './audio-analyzer';

export class GlastarJS {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private uniforms: ShaderUniforms;
  private config: {
    width: number;
    height: number;
    texture: TextureType;
    glassOpacity: number;
    refractionStrength: number;
    blurAmount: number;
    fps: number;
    avatarColor: string;
    avatarSize: number;
    avatarSensitivity: number;
    avatarExpansion: number;
    avatarSmoothing: number;
    avatarFadeWithAudio: boolean;
    avatarState: AvatarState;
    avatarShape: AvatarShape;
    backgroundColor: string;
    backgroundType: 'color' | 'radial-gradient' | 'linear-gradient' | 'image';
    backgroundGradient: {
      centerColor: string;
      edgeColor: string;
      angle: number;
    };
    backgroundImage?: string;
    backgroundRotation: boolean;
    backgroundRotationSpeed: number;
    backgroundScale: number;
  };
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
  private thinkingAnimationTime: number = 0;
  private currentState: AvatarState = 'speaking';
  private targetState: AvatarState = 'speaking';
  private stateTransitionProgress: number = 1; // 0 to 1, 1 means fully transitioned
  private stateTransitionDuration: number = 500; // milliseconds
  private stateTransitionStartTime: number = 0;

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

    // When avatarShape is defined, enforce square dimensions using width
    const width = config.width || 800;
    const height =
      config.avatarShape === 'circle' || config.avatarShape === 'square'
        ? width
        : config.height || 600;

    this.config = {
      width,
      height,
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
      avatarState: config.avatarState || 'speaking',
      avatarShape: config.avatarShape || 'square',
      backgroundColor: config.backgroundColor || '#000000',
      backgroundType: config.backgroundType || 'color',
      backgroundGradient: {
        centerColor: config.backgroundGradient?.centerColor || '#4A90E2',
        edgeColor: config.backgroundGradient?.edgeColor || '#1a1a2e',
        angle: config.backgroundGradient?.angle ?? 45,
      },
      backgroundImage: config.backgroundImage,
      backgroundRotation: config.backgroundRotation ?? true,
      // If backgroundRotation is false, we set the rotation speed to 0 regardless of the backgroundRotationSpeed
      backgroundRotationSpeed:
        config.backgroundRotation === false
          ? 0
          : (config.backgroundRotationSpeed ?? 10),
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

    // Update thinking animation time
    this.thinkingAnimationTime += 16; // Approximate frame time in ms

    // Handle state transitions
    this.updateStateTransition();

    // Handle audio level - make audio response immediate when target is speaking
    let effectiveAudioLevel = audioLevel;
    if (this.targetState === 'speaking') {
      // If transitioning TO speaking or already speaking, use full audio response immediately
      effectiveAudioLevel = audioLevel;
    } else if (
      this.currentState === 'speaking' &&
      this.stateTransitionProgress < 1
    ) {
      // If transitioning FROM speaking, gradually fade out audio response
      effectiveAudioLevel *= 1 - this.stateTransitionProgress;
    } else {
      // Neither current nor target state uses audio
      effectiveAudioLevel = 0;
    }

    // Apply smoothing to audio level using exponential moving average
    const targetLevel = effectiveAudioLevel * this.config.avatarSensitivity;
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
      state: this.config.avatarState, // Include state in background config for proper dirty tracking
    });

    if (
      this.backgroundDirty ||
      this.lastBackgroundConfig !== currentBackgroundConfig ||
      this.config.backgroundRotation ||
      this.config.avatarState === 'thinking' // Always redraw for thinking animation
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
    const baseSize = this.config.avatarSize;

    // Handle different avatar states with transitions
    if (this.stateTransitionProgress === 1) {
      // Fully transitioned to target state
      this.drawAvatarState(
        ctx,
        centerX,
        centerY,
        baseSize,
        width,
        height,
        this.targetState,
        1.0
      );
    } else {
      // In transition - blend between states
      ctx.save();

      // Draw current state fading out
      if (this.currentState !== this.targetState) {
        const currentOpacity = 1 - this.stateTransitionProgress;
        ctx.globalAlpha = currentOpacity;
        this.drawAvatarState(
          ctx,
          centerX,
          centerY,
          baseSize,
          width,
          height,
          this.currentState,
          currentOpacity
        );
      }

      // Draw target state fading in
      ctx.globalAlpha = this.stateTransitionProgress;
      this.drawAvatarState(
        ctx,
        centerX,
        centerY,
        baseSize,
        width,
        height,
        this.targetState,
        this.stateTransitionProgress
      );

      ctx.restore();
    }
  }

  private drawAvatarState(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    baseSize: number,
    width: number,
    height: number,
    state: AvatarState,
    opacity: number
  ): void {
    switch (state) {
      case 'speaking':
        this.drawSpeakingAvatar(ctx, centerX, centerY, baseSize, opacity);
        break;
      case 'listening':
        this.drawListeningAvatar(ctx, centerX, centerY, baseSize, opacity);
        break;
      case 'thinking':
        this.drawThinkingAvatar(
          ctx,
          centerX,
          centerY,
          baseSize,
          width,
          height,
          opacity
        );
        break;
    }
  }

  private drawSpeakingAvatar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    baseSize: number,
    transitionOpacity: number = 1
  ): void {
    // Calculate avatar size based on smoothed audio level
    const maxExpansionSize = baseSize * this.config.avatarExpansion;
    const expandedSize =
      baseSize + this.smoothedAudioLevel * (maxExpansionSize - baseSize);

    // Calculate opacity based on audio level if fade is enabled
    let avatarOpacity = 1.0;
    if (this.config.avatarFadeWithAudio) {
      const scaledLevel = this.smoothedAudioLevel * 8.0;
      avatarOpacity = Math.max(0.0, Math.min(1.0, Math.pow(scaledLevel, 0.3)));
    }

    this.drawAvatarCircle(
      ctx,
      centerX,
      centerY,
      expandedSize,
      avatarOpacity * transitionOpacity
    );

    // Update texture if avatar changed significantly
    if (
      Math.abs(expandedSize - this.lastAvatarSize) > 0.5 ||
      Math.abs(avatarOpacity - 1.0) > 0.01
    ) {
      this.textureNeedsUpdate = true;
    }
    this.lastAvatarSize = expandedSize;
  }

  /* eslint-disable no-unused-vars */
  private drawListeningAvatar(
    _ctx: CanvasRenderingContext2D,
    _centerX: number,
    _centerY: number,
    _baseSize: number
  ): void {
    // No avatar circle in listening state - just the glass effect
    // Mark as needing update to keep the glass effect animating
    this.textureNeedsUpdate = true;
  }
  /* eslint-enable no-unused-vars */

  private drawThinkingAvatar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    baseSize: number,
    width: number,
    height: number,
    transitionOpacity: number = 1
  ): void {
    // No avatar circle in thinking state - just the rotating border
    // Draw rotating border animation (like snake game)
    this.drawThinkingBorder(
      ctx,
      centerX,
      centerY,
      baseSize,
      width,
      height,
      transitionOpacity
    );

    // Always mark as needing update for the border animation
    this.textureNeedsUpdate = true;
  }

  private drawAvatarCircle(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    opacity: number
  ): void {
    // Create radial gradient for soft edges with dynamic opacity
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      size
    );

    // Parse the avatar color and apply opacity
    const color = this.config.avatarColor;
    const centerOpacity = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    const edgeOpacity = Math.round(opacity * 128)
      .toString(16)
      .padStart(2, '0');

    gradient.addColorStop(0, color + centerOpacity);
    gradient.addColorStop(0.7, color + edgeOpacity);
    gradient.addColorStop(1, color + '00');

    // Draw the avatar circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawThinkingBorder(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    _baseSize: number,
    width: number,
    height: number,
    transitionOpacity: number = 1
  ): void {
    // Draw different animation based on avatar shape
    if (this.config.avatarShape === 'circle') {
      this.drawThinkingBorderCircle(
        ctx,
        centerX,
        centerY,
        width,
        height,
        transitionOpacity
      );
    } else {
      this.drawThinkingBorderSquare(ctx, width, height, transitionOpacity);
    }
  }

  private drawThinkingBorderCircle(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    transitionOpacity: number = 1
  ): void {
    const borderRadius = Math.min(width, height) * 0.48; // Close to the edge
    const borderWidth = 6; // Thick border
    const arcLength = Math.PI * 0.3; // Length of the arc
    const rotationSpeed = 0.0015; // Rotation speed

    // Calculate current rotation
    const rotation =
      (this.thinkingAnimationTime * rotationSpeed) % (Math.PI * 2);

    // Set up the traveling arc
    const startAngle = rotation;
    const endAngle = rotation + arcLength;

    // Draw a trailing fade effect
    const trailSegments = 8;
    for (let i = trailSegments; i >= 1; i--) {
      const trailOpacity = 0.8 - i * 0.08;
      const trailStart = startAngle - i * 0.08;
      const trailEnd = startAngle - (i - 1) * 0.08;

      ctx.strokeStyle =
        this.config.avatarColor +
        Math.round(trailOpacity * transitionOpacity * 255)
          .toString(16)
          .padStart(2, '0');
      ctx.lineWidth = borderWidth;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(centerX, centerY, borderRadius, trailStart, trailEnd);
      ctx.stroke();
    }

    // Draw the main bright arc
    ctx.strokeStyle =
      this.config.avatarColor +
      Math.round(transitionOpacity * 255)
        .toString(16)
        .padStart(2, '0');
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(centerX, centerY, borderRadius, startAngle, endAngle);
    ctx.stroke();

    // Draw a bright leading edge
    ctx.strokeStyle =
      this.config.avatarColor +
      Math.round(transitionOpacity * 255)
        .toString(16)
        .padStart(2, '0');
    ctx.lineWidth = borderWidth * 1.5;

    ctx.beginPath();
    ctx.arc(centerX, centerY, borderRadius, endAngle - 0.1, endAngle);
    ctx.stroke();
  }

  private drawThinkingBorderSquare(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transitionOpacity: number = 1
  ): void {
    const borderWidth = 6; // Thick border
    const padding = 10; // Padding from edge

    // Calculate the perimeter for animation
    const rectWidth = width - padding * 2;
    const rectHeight = height - padding * 2;
    const perimeter = (rectWidth + rectHeight) * 2;
    const segmentLength = perimeter * 0.15; // Length of the moving segment
    const speed = 0.8; // Pixels per frame

    // Update position along perimeter
    const currentPosition = (this.thinkingAnimationTime * speed) % perimeter;

    // Helper function to get x,y coordinates from perimeter position
    const getPositionOnRect = (pos: number) => {
      let p = pos % perimeter;
      if (p < 0) {
        p += perimeter;
      }

      const left = padding;
      const right = width - padding;
      const top = padding;
      const bottom = height - padding;

      // Top edge (left to right)
      if (p < rectWidth) {
        return { x: left + p, y: top };
      }
      p -= rectWidth;

      // Right edge (top to bottom)
      if (p < rectHeight) {
        return { x: right, y: top + p };
      }
      p -= rectHeight;

      // Bottom edge (right to left)
      if (p < rectWidth) {
        return { x: right - p, y: bottom };
      }
      p -= rectWidth;

      // Left edge (bottom to top)
      return { x: left, y: bottom - p };
    };

    // Draw trailing segments with fade
    const trailSegments = 10;
    const segmentStep = segmentLength / trailSegments;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = trailSegments; i >= 0; i--) {
      const segmentStart = currentPosition - i * segmentStep;
      const segmentEnd = currentPosition - (i - 1) * segmentStep;
      const opacity = 1.0 - (i / trailSegments) * 0.7;

      ctx.strokeStyle =
        this.config.avatarColor +
        Math.round(opacity * transitionOpacity * 255)
          .toString(16)
          .padStart(2, '0');
      ctx.lineWidth = borderWidth * (1 + (1 - i / trailSegments) * 0.3); // Slightly thicker at the head

      ctx.beginPath();
      const start = getPositionOnRect(segmentStart);
      ctx.moveTo(start.x, start.y);

      // Draw small segments to follow the rectangle path
      const steps = 5;
      for (let j = 1; j <= steps; j++) {
        const pos = segmentStart + (segmentEnd - segmentStart) * (j / steps);
        const point = getPositionOnRect(pos);
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
    }

    // Add a bright glow at the leading edge
    const headPos = getPositionOnRect(currentPosition);
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.config.avatarColor;
    ctx.fillStyle = this.config.avatarColor;
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y, borderWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private updateStateTransition(): void {
    // Check if we need to start a new transition
    if (this.config.avatarState !== this.targetState) {
      // Start new transition
      this.currentState = this.targetState;
      this.targetState = this.config.avatarState;
      this.stateTransitionProgress = 0;
      this.stateTransitionStartTime = Date.now();
    }

    // Update transition progress
    if (this.stateTransitionProgress < 1) {
      const elapsed = Date.now() - this.stateTransitionStartTime;
      this.stateTransitionProgress = Math.min(
        1,
        elapsed / this.stateTransitionDuration
      );

      // Use easing function for smoother transition
      this.stateTransitionProgress = this.easeInOutCubic(
        this.stateTransitionProgress
      );

      // Mark as needing update during transition
      this.textureNeedsUpdate = true;

      // Complete transition
      if (this.stateTransitionProgress === 1) {
        this.currentState = this.targetState;
      }
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    this.config = {
      ...this.config,
      ...config,
      // Handle nested backgroundGradient properly
      backgroundGradient: config.backgroundGradient
        ? {
            centerColor:
              config.backgroundGradient.centerColor ||
              this.config.backgroundGradient.centerColor,
            edgeColor:
              config.backgroundGradient.edgeColor ||
              this.config.backgroundGradient.edgeColor,
            angle:
              config.backgroundGradient.angle ??
              this.config.backgroundGradient.angle,
          }
        : this.config.backgroundGradient,
    };

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

  resize(width: number, height?: number): void {
    // When avatarShape is defined, enforce square dimensions
    const effectiveHeight =
      this.config.avatarShape === 'circle' ||
      this.config.avatarShape === 'square'
        ? width
        : height || width;

    this.canvas.width = width;
    this.canvas.height = effectiveHeight;
    this.backgroundCanvas.width = width;
    this.backgroundCanvas.height = effectiveHeight;
    this.gl.viewport(0, 0, width, effectiveHeight);
    this.config.width = width;
    this.config.height = effectiveHeight;
    this.backgroundDirty = true;
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
