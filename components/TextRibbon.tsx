
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface TextRibbonProps {
  mode: TreeMode;
}

// Common GLSL functions for path calculation
const GLSL_COMMON = `
  #define PI 3.14159265

  // Calculate position on a "Figure-8" (Lissajous) path
  // angle: Driving parameter (0 to 2PI loops)
  // rx: X radius (Width bounds)
  // rz: Z radius (Depth bounds)
  // heightProgress: 0.0 (Top) to 1.0 (Bottom)
  // tiltDir: Modifier for mirrored variation (-1.0 or 1.0)
  vec3 getPath(float angle, float rx, float rz, float heightProgress, float tiltDir) {
      // 1. Vertical Height Guide
      // Flow from Top (16.0) to Bottom (2.0) - Lowered by 2 units
      float yBase = mix(16.0, 2.0, heightProgress);

      // 2. Figure-8 Motion (Lissajous Knot)
      // x = cos(t), z = sin(2t) creates the '8' shape in top-down view (or front view depending on axis)
      // We want the 8 to wrap around the text width.
      
      float x = rx * cos(angle);
      float z = rz * sin(angle * 2.0); // Frequency 2x for Z creates the cross-over

      // 3. Organic Vertical Sway
      // Add sine waves to Y to make it float/dance
      // Use tiltDir to invert the wave for the second ribbon so they oppose each other
      float yOffset = sin(angle * 1.5 + heightProgress * 3.0) * 1.5 * tiltDir;
      
      // 4. Subtle Diagonal Tilt (Top-Left to Bottom-Right bias)
      float yTilt = x * -0.2; 

      float y = yBase + yOffset + yTilt;

      return vec3(x, y, z);
  }
`;

const RIBBON_VERTEX = `
  attribute float aTiltDir;     // -1 or 1
  attribute float aPhaseOffset; // 0 or PI

  uniform float uTime;
  
  varying vec2 vUv;
  varying float vAlpha;
  varying float vDepth; // For occlusion dimming

  ${GLSL_COMMON}

  void main() {
    vUv = uv;

    // PlaneGeometry x is -0.5 to 0.5. Remap to 0.0 to 1.0
    float t = position.x + 0.5; 
    float w = position.y; // Width strip (-0.5 to 0.5)

    // --- ANIMATION PARAMS ---
    float speed = uTime * 0.8; // Smooth flow speed
    
    // Density: How many Figure-8 loops fit in the vertical span?
    // 1.5 ensures a complex enough shape without being messy
    float spiralDensity = 1.5; 
    
    // Driving angle
    float angle = (t * PI * 2.0 * spiralDensity) - speed + aPhaseOffset;

    // Dimensions (A6 Text is roughly 16 wide, 10 high)
    float rx = 9.5; 
    float rz = 3.0; // Deep enough to weave in and out

    // --- POSITION CALCULATION ---
    vec3 center = getPath(angle, rx, rz, t, aTiltDir);

    // Look-ahead for orientation
    float delta = 0.01;
    float nextAngle = ((t + delta) * PI * 2.0 * spiralDensity) - speed + aPhaseOffset;
    vec3 next = getPath(nextAngle, rx, rz, t + delta, aTiltDir);
    
    vec3 forward = normalize(next - center);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 binormal = normalize(cross(forward, up));
    
    // Ribbon Width Pulse
    float widthPulse = 1.0 + 0.2 * sin(t * 10.0 - uTime * 3.0);
    
    vec3 pos = center + binormal * w * 0.7 * widthPulse; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    
    // Soft taper at ends
    vAlpha = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.9, 1.0, t));
    
    vDepth = center.z;
  }
`;

const RIBBON_FRAGMENT = `
  uniform float uTime;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying float vAlpha;
  varying float vDepth;

  void main() {
    // Distance from center of ribbon (0.0 to 1.0 at edge)
    float d = abs(vUv.y - 0.5) * 2.0;
    
    // 1. Edge Shimmer / Glow
    // Bright edges
    float edgeGlow = smoothstep(0.6, 1.0, d);
    
    // 2. Core Gradient
    // Deep Blue center -> Cyan edges
    vec3 cDeep = vec3(0.0, 0.1, 0.8);
    vec3 cCyan = vec3(0.0, 0.8, 1.0);
    vec3 cWhite = vec3(1.0);

    vec3 col = mix(cDeep, cCyan, d * 0.8 + 0.2);
    
    // 3. Flowing Energy Highlights
    float energyFlow = sin(vUv.x * 15.0 - uTime * 2.5);
    // Sharp electric streaks
    float streak = smoothstep(0.9, 1.0, energyFlow);
    
    // Add streaks to color (mostly on edges)
    col += cWhite * streak * edgeGlow * 1.5;
    
    // Add general edge rim light
    col += cCyan * edgeGlow * 0.5;

    // 4. Depth Occlusion Simulation
    // Dim slightly when 'behind' (negative Z)
    float depthFactor = smoothstep(-5.0, 5.0, vDepth) * 0.5 + 0.5; 
    
    // Final Alpha
    float finalAlpha = vAlpha * uOpacity * depthFactor;
    
    gl_FragColor = vec4(col, finalAlpha);
  }
`;

// --- STARDUST SHADERS ---

const STARDUST_VERTEX = `
  attribute float aOffset;   // 0..1 along ribbon
  attribute float aTiltDir;  // -1 or 1
  attribute float aPhaseOffset; // 0 or PI
  
  uniform float uTime;
  uniform float uOpacity;
  
  varying float vAlpha;

  ${GLSL_COMMON}

  void main() {
    float t = aOffset; 
    
    float speed = uTime * 0.8;
    float spiralDensity = 1.5;
    float angle = (t * PI * 2.0 * spiralDensity) - speed + aPhaseOffset;
    
    float rx = 9.5;
    float rz = 3.0;
    
    vec3 center = getPath(angle, rx, rz, t, aTiltDir);
    
    // Random jitter around ribbon
    vec3 jitter = vec3(
       sin(t * 100.0 + uTime),
       cos(t * 50.0 + uTime),
       sin(t * 25.0)
    ) * 0.5; 

    vec3 pos = center + jitter;
    
    float depthFactor = smoothstep(-5.0, 5.0, center.z) * 0.5 + 0.5;
    
    vAlpha = uOpacity * depthFactor * (0.5 + 0.5 * sin(uTime * 10.0 + t * 40.0));
    vAlpha *= smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.9, 1.0, t));
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (100.0 * (0.6 + 0.4 * sin(t * 20.0))) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STARDUST_FRAGMENT = `
  varying float vAlpha;
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 2.0);
    
    // Sparkle Color
    vec3 col = vec3(0.7, 0.9, 1.0);
    
    gl_FragColor = vec4(col, strength * vAlpha);
  }
`;

const TextRibbon: React.FC<TextRibbonProps> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // 1. Ribbon Geometry (Instanced)
  const ribbonGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1, 600, 1);
    
    // Two Instances:
    const tiltDirs = new Float32Array([-1.0, 1.0]);
    const phaseOffsets = new Float32Array([0.0, Math.PI]); // 180 deg out of phase

    geo.setAttribute('aTiltDir', new THREE.InstancedBufferAttribute(tiltDirs, 1));
    geo.setAttribute('aPhaseOffset', new THREE.InstancedBufferAttribute(phaseOffsets, 1));
    
    return geo;
  }, []);
  
  const ribbonMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: RIBBON_VERTEX,
    fragmentShader: RIBBON_FRAGMENT,
    uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  // 2. Stardust Geometry (Particles)
  const stardustCount = 2000;
  const stardustGeo = useMemo(() => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(stardustCount * 3);
      const offsets = new Float32Array(stardustCount);
      const tiltDirs = new Float32Array(stardustCount);
      const phaseOffsets = new Float32Array(stardustCount);
      
      for(let i=0; i<stardustCount; i++) {
          offsets[i] = Math.random(); 
          
          // Split particles between ribbon 1 and 2
          const isRibbon2 = i % 2 === 0;
          tiltDirs[i] = isRibbon2 ? 1.0 : -1.0;
          phaseOffsets[i] = isRibbon2 ? Math.PI : 0.0;
      }
      
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
      geo.setAttribute('aTiltDir', new THREE.BufferAttribute(tiltDirs, 1));
      geo.setAttribute('aPhaseOffset', new THREE.BufferAttribute(phaseOffsets, 1));
      
      return geo;
  }, []);

  const stardustMat = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: STARDUST_VERTEX,
      fragmentShader: STARDUST_FRAGMENT,
      uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
  }), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Visibility Transition
    // Visible only in TEXT MODE
    const targetOpacity = mode === TreeMode.TEXT ? 1.0 : 0.0;
    const currentOpacity = ribbonMat.uniforms.uOpacity.value;
    const nextOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, delta * 2.0);
    
    ribbonMat.uniforms.uOpacity.value = nextOpacity;
    stardustMat.uniforms.uOpacity.value = nextOpacity;
    
    groupRef.current.visible = nextOpacity > 0.01;

    // Time Update
    const t = state.clock.elapsedTime;
    ribbonMat.uniforms.uTime.value = t;
    stardustMat.uniforms.uTime.value = t;
  });

  return (
    <group ref={groupRef}>
        <instancedMesh args={[ribbonGeo, ribbonMat, 2]} frustumCulled={false} />
        <points geometry={stardustGeo} material={stardustMat} frustumCulled={false} />
    </group>
  );
};

export default TextRibbon;
