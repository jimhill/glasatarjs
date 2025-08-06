import { describe, it, expect } from 'vitest';
import type { GlasatarConfig } from '../types';

// Helper function to create a valid default config
const createDefaultConfig = (): GlasatarConfig => ({
  width: 800,
  height: 600,
  texture: 'reeded',
  avatarColor: '#0096ff',
  backgroundColor: '#1a1a1a',
  blurAmount: 8,
  backgroundType: 'solid',
  backgroundImage: undefined,
});

// Helper function to validate config structure
const validateConfigStructure = (config: Partial<GlasatarConfig>): boolean => {
  const validTextures = ['reeded', 'frosted', 'rain', 'forest'] as const;
  const validBackgroundTypes = [
    'solid',
    'linear-gradient',
    'radial-gradient',
    'image',
  ] as const;

  // Check texture validity
  if (config.texture !== undefined && !validTextures.includes(config.texture)) {
    return false;
  }

  // Check backgroundType validity
  if (
    config.backgroundType !== undefined &&
    !validBackgroundTypes.includes(config.backgroundType)
  ) {
    return false;
  }

  // Check numeric ranges
  if (
    config.width !== undefined &&
    (config.width <= 0 || config.width > 4096)
  ) {
    return false;
  }

  if (
    config.height !== undefined &&
    (config.height <= 0 || config.height > 4096)
  ) {
    return false;
  }

  if (
    config.blurAmount !== undefined &&
    (config.blurAmount < 0 ||
      config.blurAmount > 50 ||
      !isFinite(config.blurAmount))
  ) {
    return false;
  }

  // Check color format (basic hex validation)
  if (
    config.avatarColor !== undefined &&
    !/^#[0-9a-fA-F]{6}$/.test(config.avatarColor)
  ) {
    return false;
  }

  if (
    config.backgroundColor !== undefined &&
    !/^#[0-9a-fA-F]{6}$/.test(config.backgroundColor)
  ) {
    return false;
  }

  // Check background image URL format (if provided)
  if (
    config.backgroundImage !== undefined &&
    config.backgroundImage !== null &&
    config.backgroundImage !== ''
  ) {
    try {
      const url = new URL(config.backgroundImage);
      // Only allow http/https protocols for security
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
};

describe('PrivacyGlass Configuration Validation', () => {
  describe('default configuration', () => {
    it('should have valid default values', () => {
      const config = createDefaultConfig();

      expect(config.width).toBeGreaterThan(0);
      expect(config.height).toBeGreaterThan(0);
      expect(config.texture).toBeDefined();
      expect(config.avatarColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.blurAmount).toBeGreaterThanOrEqual(0);
      expect(config.backgroundType).toBeDefined();
      expect(validateConfigStructure(config)).toBe(true);
    });

    it('should have reasonable default dimensions', () => {
      const config = createDefaultConfig();

      expect(config.width).toBeGreaterThanOrEqual(100);
      expect(config.width).toBeLessThanOrEqual(4096);
      expect(config.height).toBeGreaterThanOrEqual(100);
      expect(config.height).toBeLessThanOrEqual(4096);
    });
  });

  describe('texture validation', () => {
    it('should accept valid texture types', () => {
      const validTextures: GlasatarConfig['texture'][] = [
        'reeded',
        'frosted',
        'rain',
        'forest',
      ];

      validTextures.forEach(texture => {
        const config = { texture };
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should reject invalid texture types', () => {
      const invalidTextures = ['invalid', 'unknown', '', null, undefined];

      invalidTextures.forEach(texture => {
        const config = { texture: texture as any };
        if (texture !== undefined) {
          expect(validateConfigStructure(config)).toBe(false);
        }
      });
    });
  });

  describe('dimension validation', () => {
    it('should accept valid dimensions', () => {
      const validDimensions = [
        { width: 100, height: 100 },
        { width: 800, height: 600 },
        { width: 1920, height: 1080 },
        { width: 4096, height: 4096 },
      ];

      validDimensions.forEach(config => {
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should reject invalid dimensions', () => {
      const invalidDimensions = [
        { width: 0, height: 600 },
        { width: 800, height: 0 },
        { width: -100, height: 600 },
        { width: 800, height: -100 },
        { width: 5000, height: 600 },
        { width: 800, height: 5000 },
      ];

      invalidDimensions.forEach(config => {
        expect(validateConfigStructure(config)).toBe(false);
      });
    });

    it('should handle edge case dimensions', () => {
      const edgeCases = [
        { width: 1, height: 1 },
        { width: 4096, height: 4096 },
      ];

      edgeCases.forEach(config => {
        expect(validateConfigStructure(config)).toBe(true);
      });
    });
  });

  describe('color validation', () => {
    it('should accept valid hex colors', () => {
      const validColors = [
        '#000000',
        '#ffffff',
        '#123456',
        '#ABCDEF',
        '#ff0000',
        '#00FF00',
        '#0000ff',
      ];

      validColors.forEach(color => {
        const config = { avatarColor: color };
        expect(validateConfigStructure(config)).toBe(true);

        const bgConfig = { backgroundColor: color };
        expect(validateConfigStructure(bgConfig)).toBe(true);
      });
    });

    it('should reject invalid color formats', () => {
      const invalidColors = [
        '#12345', // Too short
        '#1234567', // Too long
        'ffffff', // Missing #
        '#gggggg', // Invalid hex characters
        'red', // Named color
        'rgb(255,0,0)', // RGB format
        '', // Empty string
        null,
        undefined,
      ];

      invalidColors.forEach(color => {
        const config = { avatarColor: color as any };
        if (color !== undefined) {
          expect(validateConfigStructure(config)).toBe(false);
        }

        const bgConfig = { backgroundColor: color as any };
        if (color !== undefined) {
          expect(validateConfigStructure(bgConfig)).toBe(false);
        }
      });
    });
  });

  describe('blur amount validation', () => {
    it('should accept valid blur amounts', () => {
      const validBlurAmounts = [0, 1, 8, 15, 25, 50];

      validBlurAmounts.forEach(blurAmount => {
        const config = { blurAmount };
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should reject invalid blur amounts', () => {
      const invalidBlurAmounts = [-1, -10, 51, 100, Infinity, NaN];

      invalidBlurAmounts.forEach(blurAmount => {
        const config = { blurAmount };
        expect(validateConfigStructure(config)).toBe(false);
      });
    });
  });

  describe('background type validation', () => {
    it('should accept valid background types', () => {
      const validTypes: GlasatarConfig['backgroundType'][] = [
        'solid',
        'linear-gradient',
        'radial-gradient',
        'image',
      ];

      validTypes.forEach(backgroundType => {
        const config = { backgroundType };
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should reject invalid background types', () => {
      const invalidTypes = ['gradient', 'invalid', 'unknown', '', null];

      invalidTypes.forEach(backgroundType => {
        const config = { backgroundType: backgroundType as any };
        expect(validateConfigStructure(config)).toBe(false);
      });
    });
  });

  describe('background image validation', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'https://example.com/path/to/image.png',
        'http://localhost:3000/image.gif',
        'https://cdn.example.com/assets/bg.webp',
      ];

      validUrls.forEach(backgroundImage => {
        const config = { backgroundImage };
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should accept undefined/null background image', () => {
      expect(validateConfigStructure({ backgroundImage: undefined })).toBe(
        true
      );
      expect(validateConfigStructure({ backgroundImage: null })).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com/image.jpg', // FTP not allowed
        'javascript:alert("xss")', // XSS attempt
      ];

      invalidUrls.forEach(backgroundImage => {
        const config = { backgroundImage };
        expect(validateConfigStructure(config)).toBe(false);
      });

      // Empty string should be allowed (treated as no image)
      expect(validateConfigStructure({ backgroundImage: '' })).toBe(true);
    });
  });

  describe('complete configuration validation', () => {
    it('should validate complete valid configurations', () => {
      const validConfigs: Partial<GlasatarConfig>[] = [
        createDefaultConfig(),
        {
          width: 1920,
          height: 1080,
          texture: 'frosted',
          avatarColor: '#ff0000',
          backgroundColor: '#000000',
          blurAmount: 12,
          backgroundType: 'radial-gradient',
        },
        {
          width: 400,
          height: 300,
          texture: 'rain',
          avatarColor: '#00ff00',
          backgroundColor: '#ffffff',
          blurAmount: 0,
          backgroundType: 'image',
          backgroundImage: 'https://example.com/bg.jpg',
        },
      ];

      validConfigs.forEach(config => {
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should reject configurations with multiple invalid properties', () => {
      const invalidConfigs = [
        {
          width: -100,
          height: 0,
          texture: 'invalid',
          avatarColor: 'not-a-color',
          blurAmount: -5,
        },
        {
          width: 5000,
          texture: 'unknown',
          backgroundType: 'invalid-type',
          backgroundImage: 'not-a-url',
        },
      ];

      invalidConfigs.forEach(config => {
        expect(validateConfigStructure(config)).toBe(false);
      });
    });
  });

  describe('partial configuration updates', () => {
    it('should validate partial config objects', () => {
      const partialConfigs = [
        { width: 1200 },
        { avatarColor: '#123456' },
        { texture: 'forest' },
        { blurAmount: 15 },
        { backgroundType: 'linear-gradient' },
      ];

      partialConfigs.forEach(config => {
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should reject invalid partial config objects', () => {
      const invalidPartialConfigs = [
        { width: -1 },
        { avatarColor: 'red' },
        { texture: 'invalid' as any },
        { blurAmount: -5 },
        { backgroundType: 'invalid' as any },
      ];

      invalidPartialConfigs.forEach(config => {
        expect(validateConfigStructure(config)).toBe(false);
      });
    });
  });

  describe('configuration consistency', () => {
    it('should be consistent when backgroundType is image', () => {
      const imageConfigs = [
        {
          backgroundType: 'image' as const,
          backgroundImage: 'https://example.com/image.jpg',
        },
        {
          backgroundType: 'image' as const,
          backgroundImage: null, // Should be valid - renderer should handle gracefully
        },
      ];

      imageConfigs.forEach(config => {
        expect(validateConfigStructure(config)).toBe(true);
      });
    });

    it('should handle aspect ratio considerations', () => {
      const aspectRatioConfigs = [
        { width: 1920, height: 1080 }, // 16:9
        { width: 1600, height: 900 }, // 16:9
        { width: 800, height: 600 }, // 4:3
        { width: 1000, height: 1000 }, // 1:1
        { width: 320, height: 568 }, // Mobile portrait
      ];

      aspectRatioConfigs.forEach(config => {
        expect(validateConfigStructure(config)).toBe(true);
      });
    });
  });
});
