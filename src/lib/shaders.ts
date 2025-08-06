export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const fragmentShaderSource = `
  precision highp float;
  
  uniform sampler2D u_backgroundTexture;
  uniform vec2 u_resolution;
  uniform float u_opacity;
  uniform float u_refraction;
  uniform int u_texture;
  uniform float u_blurAmount;
  
  varying vec2 v_texCoord;
  
  // Improved noise for glass patterns
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
           
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Optimized arctic glass - simplified crystalline pattern
  vec2 arcticGlass(vec2 uv) {
    float scale = 60.0;  // Reduced scale for performance
    vec2 distortion = vec2(0.0);
    
    // Reduced to 2 layers for better performance
    vec3 noiseCoord1 = vec3(uv * scale, 0.0);
    float noise1 = abs(snoise(noiseCoord1));
    
    vec3 noiseCoord2 = vec3(uv * scale * 0.5, 0.5);
    float noise2 = abs(snoise(noiseCoord2));
    
    // Combine layers more efficiently
    float combined = noise1 * 0.7 + noise2 * 0.3;
    distortion = vec2(
      combined * cos(noise1 * 6.28),
      combined * sin(noise1 * 6.28)
    ) * 0.006;
    
    return distortion;
  }
  
  // Static cathedral glass - flowing organic patterns
  vec2 cathedralGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Large flowing patterns
    float flow1 = snoise(vec3(uv * 4.0, 0.0));
    float flow2 = snoise(vec3(uv * 6.0 + 100.0, 0.0));
    
    // Combine flows
    float combined = flow1 * 0.6 + flow2 * 0.4;
    
    distortion.x = combined * 0.02;
    distortion.y = snoise(vec3(uv * 5.0 + 50.0, 0.0)) * 0.02;
    
    return distortion;
  }
  
  // Optimized autumn glass - simplified organic patterns  
  vec2 autumnGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Simplified organic structures (remove loop)
    vec3 p1 = vec3(uv * 8.0, 0.0);
    float n1 = snoise(p1);
    
    vec3 p2 = vec3(uv * 12.0 + vec2(37.0, 73.0), 0.0);
    float n2 = snoise(p2);
    
    // Create organic shapes more efficiently
    float organic = smoothstep(-0.2, 0.2, n1 * 0.7 + n2 * 0.3);
    distortion = vec2(
      organic * cos(n1 * 3.14),
      organic * sin(n1 * 3.14)
    ) * 0.012;
    
    return distortion;
  }
  
  // Static flemish glass - hammered texture
  vec2 flemishGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Hammered dimples pattern
    vec2 cellSize = vec2(0.03, 0.03);
    vec2 cell = floor(uv / cellSize);
    vec2 localUV = fract(uv / cellSize) - 0.5;
    
    // Random offset per cell
    float cellHash = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 cellOffset = vec2(
      sin(cellHash * 6.28) * 0.1,
      cos(cellHash * 6.28) * 0.1
    );
    
    // Dimple shape
    float dimple = 1.0 - smoothstep(0.0, 0.4, length(localUV + cellOffset));
    
    // Calculate normal-like distortion
    vec2 dimpleGrad = normalize(localUV + cellOffset) * dimple;
    distortion = dimpleGrad * 0.015;
    
    return distortion;
  }
  
  // Static ripple glass - water ripple pattern
  vec2 rippleGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Concentric ripples from multiple centers
    vec2 center1 = vec2(0.3, 0.7);
    vec2 center2 = vec2(0.7, 0.2);
    vec2 center3 = vec2(0.1, 0.1);
    
    float ripple1 = sin(distance(uv, center1) * 40.0) * 0.5 + 0.5;
    float ripple2 = sin(distance(uv, center2) * 35.0) * 0.3 + 0.7;
    float ripple3 = sin(distance(uv, center3) * 60.0) * 0.2 + 0.8;
    
    float combined = ripple1 * ripple2 * ripple3;
    
    // Create gradient for distortion
    vec2 grad1 = normalize(uv - center1) * ripple1;
    vec2 grad2 = normalize(uv - center2) * ripple2;
    vec2 grad3 = normalize(uv - center3) * ripple3;
    
    distortion = (grad1 + grad2 + grad3) * 0.008 * combined;
    
    return distortion;
  }
  
  // Static reeded glass - vertical ridged pattern like in image
  vec2 reededGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Vertical ridges with organic variation
    float ridgeSpacing = 0.08; // Distance between ridges
    float ridgePos = uv.x / ridgeSpacing;
    float ridgeIndex = floor(ridgePos);
    float ridgeLocal = fract(ridgePos) - 0.5;
    
    // Add organic variation to ridge position
    float ridgeVariation = snoise(vec3(ridgeIndex * 0.1, uv.y * 2.0, 0.0)) * 0.3;
    ridgeLocal += ridgeVariation;
    
    // Create curved ridge profile (cylindrical lens effect)
    float ridgeShape = 1.0 - abs(ridgeLocal * 2.0);
    ridgeShape = smoothstep(0.0, 1.0, ridgeShape);
    
    // Vertical flow variation
    float verticalFlow = snoise(vec3(uv.x * 8.0, uv.y * 3.0, 0.0)) * 0.2;
    
    // Primary horizontal distortion from ridges
    distortion.x = ridgeLocal * ridgeShape * 0.02;
    // Subtle vertical flow
    distortion.y = verticalFlow * ridgeShape * 0.008;
    
    return distortion;
  }
  
  // Static vintage glass - aged wavy pattern
  vec2 vintageGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Vintage glass has characteristic waves and imperfections
    float wave1 = sin(uv.y * 15.0 + sin(uv.x * 8.0) * 2.0);
    float wave2 = sin(uv.x * 12.0 + sin(uv.y * 6.0) * 1.5);
    
    // Add some organic noise for imperfections
    float imperfection = snoise(vec3(uv * 20.0, 0.0));
    
    // Combine waves with slight randomness
    distortion.x = (wave1 * 0.4 + wave2 * 0.3 + imperfection * 0.3) * 0.01;
    distortion.y = (sin(uv.x * 18.0) * 0.5 + cos(uv.y * 14.0) * 0.5) * 0.008;
    
    return distortion;
  }
  
  // Optimized forest glass - simplified branching pattern
  vec2 forestGlass(vec2 uv) {
    vec2 distortion = vec2(0.0);
    
    // Create branching tree-like patterns
    vec2 center = uv - 0.5;
    float radius = length(center);
    
    // Simplified to 2 main branches for performance
    // Branch 1
    float branchAngle1 = snoise(vec3(uv * 4.0, 0.0)) * 0.5;
    vec2 branchDir1 = vec2(cos(branchAngle1), sin(branchAngle1));
    float branchDist1 = abs(dot(center, vec2(-branchDir1.y, branchDir1.x)));
    float thickness1 = 0.02 + radius * 0.03;
    float branch1 = (1.0 - smoothstep(0.0, thickness1, branchDist1)) * 
                    smoothstep(0.0, 0.1, radius) * (1.0 - smoothstep(0.3, 0.5, radius));
    
    // Branch 2  
    float branchAngle2 = 2.094 + snoise(vec3(uv * 4.0, 1.0)) * 0.5;
    vec2 branchDir2 = vec2(cos(branchAngle2), sin(branchAngle2));
    float branchDist2 = abs(dot(center, vec2(-branchDir2.y, branchDir2.x)));
    float branch2 = (1.0 - smoothstep(0.0, thickness1, branchDist2)) * 
                    smoothstep(0.0, 0.1, radius) * (1.0 - smoothstep(0.3, 0.5, radius));
    
    // Combine branches
    distortion = normalize(vec2(-branchDir1.y, branchDir1.x)) * branch1 * 0.012 +
                 normalize(vec2(-branchDir2.y, branchDir2.x)) * branch2 * 0.012;
    
    // Add subtle overall organic flow
    float globalFlow = snoise(vec3(uv * 8.0, 0.0));
    distortion += vec2(
      cos(globalFlow * 3.14159),
      sin(globalFlow * 3.14159)
    ) * 0.004;
    
    return distortion;
  }
  
  // Optimized 5-tap blur for better performance
  vec4 blur(sampler2D tex, vec2 uv, vec2 resolution, float blurSize) {
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    // 5-tap cross blur (much faster than 25-tap)
    vec2 texelSize = blurSize / resolution;
    
    // Center
    float weight = 0.4;
    color += texture2D(tex, uv) * weight;
    total += weight;
    
    // Cross pattern
    weight = 0.15;
    color += texture2D(tex, uv + vec2(texelSize.x, 0.0)) * weight;
    color += texture2D(tex, uv - vec2(texelSize.x, 0.0)) * weight;
    color += texture2D(tex, uv + vec2(0.0, texelSize.y)) * weight;
    color += texture2D(tex, uv - vec2(0.0, texelSize.y)) * weight;
    total += weight * 4.0;
    
    return color / total;
  }
  
  void main() {
    vec2 uv = v_texCoord;
    
    // Get static glass distortion based on pattern
    // Use more efficient branching pattern
    vec2 glassDistortion = vec2(0.0);
    
    // Group similar patterns together to reduce branching
    if (u_texture < 4) {
      if (u_texture < 2) {
        glassDistortion = (u_texture == 0) ? arcticGlass(uv) : cathedralGlass(uv);
      } else {
        glassDistortion = (u_texture == 2) ? autumnGlass(uv) : flemishGlass(uv);
      }
    } else {
      if (u_texture < 6) {
        glassDistortion = (u_texture == 4) ? rippleGlass(uv) : reededGlass(uv);
      } else {
        glassDistortion = (u_texture == 6) ? vintageGlass(uv) : forestGlass(uv);
      }
    }
    
    // Apply refraction
    vec2 refractedUV = uv + glassDistortion * u_refraction;
    
    // Sample background with distortion and blur
    vec4 backgroundColor = blur(u_backgroundTexture, refractedUV, u_resolution, u_blurAmount);
    
    // Add subtle glass tint and highlights
    vec3 glassTint = vec3(0.95, 0.97, 1.0); // Slight blue-white tint
    vec3 finalColor = backgroundColor.rgb * glassTint;
    
    // Add surface highlights based on distortion
    float highlight = length(glassDistortion) * 10.0;
    highlight = smoothstep(0.0, 1.0, highlight) * 0.1;
    finalColor += vec3(highlight);
    
    // Apply opacity
    float finalAlpha = u_opacity;
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;
