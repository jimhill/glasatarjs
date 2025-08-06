import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  createAnalyser() {
    return new MockAnalyserNode();
  }
  createMediaStreamSource() {
    return new MockMediaStreamAudioSourceNode();
  }
  close() {
    return Promise.resolve();
  }
}

class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.8;

  getByteTimeDomainData(array: Uint8Array) {
    // Fill with mock audio data (sine wave pattern)
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.sin(i * 0.1) * 50;
    }
  }

  getByteFrequencyData(array: Uint8Array) {
    // Fill with mock frequency data
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.random() * 255;
    }
  }
}

class MockMediaStreamAudioSourceNode {
  connect() {}
  disconnect() {}
}

// Mock WebGL Context
class MockWebGLRenderingContext {
  canvas = {
    width: 800,
    height: 600,
  };

  // WebGL constants
  VERTEX_SHADER = 35633;
  FRAGMENT_SHADER = 35632;
  COMPILE_STATUS = 35713;
  LINK_STATUS = 35714;
  ARRAY_BUFFER = 34962;
  STATIC_DRAW = 35044;
  TEXTURE_2D = 3553;
  RGBA = 6408;
  UNSIGNED_BYTE = 5121;
  LINEAR = 9729;
  CLAMP_TO_EDGE = 33071;
  TEXTURE_WRAP_S = 10242;
  TEXTURE_WRAP_T = 10243;
  TEXTURE_MIN_FILTER = 10241;
  TEXTURE_MAG_FILTER = 10240;
  COLOR_BUFFER_BIT = 16384;
  BLEND = 3042;
  SRC_ALPHA = 770;
  ONE_MINUS_SRC_ALPHA = 771;
  TRIANGLE_STRIP = 5;
  FLOAT = 5126;
  TEXTURE0 = 33984;

  createShader() {
    return {};
  }

  shaderSource() {}
  compileShader() {}

  getShaderParameter(shader: any, pname: number) {
    return pname === this.COMPILE_STATUS;
  }

  getShaderInfoLog() {
    return '';
  }

  deleteShader() {}

  createProgram() {
    return {};
  }

  attachShader() {}
  linkProgram() {}

  getProgramParameter(program: any, pname: number) {
    return pname === this.LINK_STATUS;
  }

  getProgramInfoLog() {
    return '';
  }

  createBuffer() {
    return {};
  }

  bindBuffer() {}
  bufferData() {}

  getUniformLocation() {
    return {};
  }

  getAttribLocation() {
    return 0;
  }

  createTexture() {
    return {};
  }

  bindTexture() {}
  texParameteri() {}
  texImage2D() {}
  viewport() {}
  clearColor() {}
  clear() {}
  enable() {}
  blendFunc() {}
  useProgram() {}
  uniform1i() {}
  uniform2f() {}
  uniform1f() {}
  activeTexture() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  drawArrays() {}
  deleteProgram() {}
  deleteBuffer() {}
  deleteTexture() {}
}

// Mock Canvas 2D Context
class MockCanvas2DRenderingContext {
  canvas = {
    width: 800,
    height: 600,
  };

  fillStyle = '';

  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}
  fillRect() {}
  beginPath() {}
  arc() {}
  fill() {}

  createRadialGradient() {
    return {
      addColorStop: vi.fn(),
    };
  }

  createLinearGradient() {
    return {
      addColorStop: vi.fn(),
    };
  }

  drawImage() {}
}

// Setup global mocks
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: MockAudioContext,
});

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn((contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return new MockWebGLRenderingContext();
    }
    if (contextType === '2d') {
      return new MockCanvas2DRenderingContext();
    }
    return null;
  }),
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((callback: (time: number) => void) => {
    return setTimeout(() => callback(Date.now()), 16);
  }),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn((id: number) => {
    clearTimeout(id);
  }),
});

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }],
      })
    ),
  },
});

// Mock Image
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin: string | null = null;
  src: string = '';
  complete: boolean = false;
  width: number = 100;
  height: number = 100;
}

Object.defineProperty(window, 'Image', {
  writable: true,
  value: MockImage,
});
