
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode, COLORS } from '../types';
import { getConePoint, getRandomSpherePoint, getRandomTextPoint } from './MathUtils';

interface FoliageProps {
  mode: TreeMode;
}

const COUNT = 65000;
const TREE_HEIGHT = 15;
const TREE_BASE = 5.5;

// --- SHADER DEFINITIONS ---

const vertexShader = `
  uniform float uTime;
  uniform float uScale;
  uniform float uIsTextMode; // 0.0 -> 1.0
  
  attribute vec3 color;
  
  varying vec3 vColor;
  varying vec3 vWorldPos;
  varying float vRandom;

  // Simple pseudo-random
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vWorldPos = position; 
    vRandom = random(vec2(float(gl_VertexID), 1.0));

    vColor = color;

    vec3 pos = position;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Scale particles: 
    // Text Mode: Larger (1.1x)
    float sizeModeMult = mix(1.0, 1.1, uIsTextMode);
    
    gl_PointSize = uScale * sizeModeMult * (300.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uIsTextMode;
  
  varying vec3 vColor;
  varying vec3 vWorldPos;
  varying float vRandom;

  void main() {
    // 1. CIRCLE SHAPE (Soft)
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    // Soften edge
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 1.5);

    vec3 finalColor = vColor;

    // 2. TEXT MODE EFFECTS (Cyberpunk Blue)
    if (uIsTextMode > 0.01) {
       // Map vertical position to 0..1 range for gradient
       float gradientT = smoothstep(5.0, 13.0, vWorldPos.y);

       // Vibrant Blue Gradient
       vec3 colBottom = vec3(0.1, 0.2, 0.9);
       vec3 colTop = vec3(0.2, 0.9, 1.0);
       
       vec3 cyberBody = mix(colBottom, colTop, gradientT);
       
       // Scanline
       float scanY = fract(uTime * 0.3); 
       float normY = (vWorldPos.y - 4.0) / 14.0; 
       float scan = smoothstep(0.15, 0.0, abs(normY - scanY));
       
       cyberBody += scan * vec3(0.5, 0.9, 1.0) * 0.5;
       
       finalColor = mix(finalColor, cyberBody, uIsTextMode);
    }
    
    // Text solidity boost
    if (uIsTextMode > 0.01) {
       strength = mix(strength, smoothstep(0.5, 0.3, dist), uIsTextMode);
    }

    gl_FragColor = vec4(finalColor, strength);
  }
`;

const Foliage: React.FC<FoliageProps> = ({ mode }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Transition state for shader mixing
  const textTransitionRef = useRef(0);

  // Precompute positions and initial colors
  const { positions, chaosPositions, textPositions, initialColors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const chaosPos = new Float32Array(COUNT * 3);
    const textPos = new Float32Array(COUNT * 3);
    const initCols = new Float32Array(COUNT * 3);
    
    const cBlue = new THREE.Color(COLORS.foliageBlue);
    const cPink = new THREE.Color(COLORS.foliagePink);

    for (let i = 0; i < COUNT; i++) {
      // Tree Shape
      const [tx, ty, tz] = getConePoint(TREE_HEIGHT, TREE_BASE, i, COUNT, 1.0);
      pos[i * 3] = tx;
      pos[i * 3 + 1] = ty;
      pos[i * 3 + 2] = tz;

      // Chaos Shape
      const [cx, cy, cz] = getRandomSpherePoint(20);
      chaosPos[i * 3] = cx;
      chaosPos[i * 3 + 1] = cy;
      chaosPos[i * 3 + 2] = cz;
      
      // Text Shape
      const [texX, texY, texZ] = getRandomTextPoint();
      textPos[i * 3] = texX;
      textPos[i * 3 + 1] = texY;
      textPos[i * 3 + 2] = texZ;

      // Initial Color Mixing (Tree)
      const mix1 = cBlue.clone().lerp(cPink, Math.random());
      initCols[i * 3] = mix1.r;
      initCols[i * 3 + 1] = mix1.g;
      initCols[i * 3 + 2] = mix1.b;
    }
    
    return { 
        positions: pos, 
        chaosPositions: chaosPos, 
        textPositions: textPos, 
        initialColors: initCols
    };
  }, []);

  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame((state, delta) => {
    if (!geometryRef.current || !materialRef.current) return;

    const currentPositions = geometryRef.current.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // Update Uniforms
    materialRef.current.uniforms.uTime.value = time;
    
    // Smooth transition for Text Mode uniform
    const targetText = mode === TreeMode.TEXT ? 1.0 : 0.0;
    textTransitionRef.current = THREE.MathUtils.lerp(textTransitionRef.current, targetText, delta * 2.0);
    materialRef.current.uniforms.uIsTextMode.value = textTransitionRef.current;
    
    // Movement Lerp
    const lerpFactor = THREE.MathUtils.clamp(delta * 1.5, 0, 1);

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      let targetX = 0, targetY = 0, targetZ = 0;

      if (mode === TreeMode.FORMED) {
          targetX = positions[idx];
          targetY = positions[idx+1];
          targetZ = positions[idx+2];
      } else if (mode === TreeMode.TEXT) {
          targetX = textPositions[idx];
          targetY = textPositions[idx+1];
          targetZ = textPositions[idx+2];
      } else {
          // Chaos
          targetX = chaosPositions[idx];
          targetY = chaosPositions[idx+1];
          targetZ = chaosPositions[idx+2];
      }

      currentPositions[idx] = THREE.MathUtils.lerp(currentPositions[idx], targetX, lerpFactor);
      currentPositions[idx + 1] = THREE.MathUtils.lerp(currentPositions[idx + 1], targetY, lerpFactor);
      currentPositions[idx + 2] = THREE.MathUtils.lerp(currentPositions[idx + 2], targetZ, lerpFactor);
    }
    
    geometryRef.current.attributes.position.needsUpdate = true;
    
    // Rotation logic
    if(pointsRef.current) {
        if (mode === TreeMode.FORMED) {
            pointsRef.current.rotation.y += delta * 0.05;
        } else if (mode === TreeMode.TEXT) {
             pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, delta);
        } else {
             pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, delta * 2);
        }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={chaosPositions.slice()} 
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={COUNT}
          array={initialColors} 
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
            uTime: { value: 0 },
            uScale: { value: 0.15 }, // Base particle size
            uIsTextMode: { value: 0 }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;
