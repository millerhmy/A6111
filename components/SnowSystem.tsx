
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface SnowSystemProps {
  mode: TreeMode;
}

// --- GROUND SNOW DRIFTS ---
export const SnowDrifts: React.FC<{ mode: TreeMode }> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 128, 64, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const bump = 
            Math.sin(v.x * 5.0) * 0.08 + 
            Math.cos(v.z * 4.5) * 0.08 + 
            Math.sin(v.x * 10 + v.z * 8) * 0.03;
        v.y += bump;
        pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = mode === TreeMode.FORMED ? 1 : 0;
    const lerpSpeed = mode === TreeMode.FORMED ? 1.5 : 3.0;
    const currentScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * lerpSpeed);
    groupRef.current.scale.setScalar(nextScale);
    groupRef.current.visible = nextScale > 0.01;
  });

  return (
    <group ref={groupRef}>
        <mesh position={[0, -0.6, 0]} scale={[6.0, 0.75, 6.0]} geometry={geometry}>
            <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.0} />
        </mesh>
    </group>
  );
};

// --- FALLING SNOW PARTICLES ---
const FallingSnow: React.FC<{ mode: TreeMode }> = ({ mode }) => {
  const count = 400; 
  const mesh = useRef<THREE.Points>(null);
  
  const snowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ffffff') },
      uSize: { value: 120.0 }, // Increased size significantly
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      attribute float aScale;
      attribute vec3 aVelocity;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        
        // Fall animation loop
        float fallSpeed = aVelocity.y; 
        float fallOffset = uTime * fallSpeed;
        
        // Range: y goes from +20 down to -5, then wraps
        float heightRange = 25.0;
        float yStart = 20.0;
        
        // Modulo arithmetic for wrapping
        // pos.y starts random. 
        // We want (pos.y - offset) wrapping within [yStart - heightRange, yStart]
        
        float currentY = pos.y - fallOffset;
        // Map to 0..heightRange
        float wrappedY = mod(currentY, heightRange);
        // Map back to relative coords, but we want it to span properly
        pos.y = wrappedY - 5.0; 
        
        // Drift
        pos.x += sin(uTime * aVelocity.x + pos.y) * 0.5;
        pos.z += cos(uTime * aVelocity.z + pos.y) * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = uSize * aScale * (10.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        // Fade out near bottom
        float heightNorm = smoothstep(-5.0, -2.0, pos.y);
        // Fade in near top
        float topNorm = smoothstep(20.0, 15.0, pos.y); // Actually our wrap logic makes it pop at top, need to be careful
        
        // Simplified fade: just fade at bottom
        vAlpha = heightNorm;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if(dist > 0.5) discard;
        
        // Soft fluffy snow
        float strength = smoothstep(0.5, 0.0, dist);
        
        gl_FragColor = vec4(uColor, strength * vAlpha * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const { positions, scales, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;     // X
      pos[i * 3 + 1] = Math.random() * 25 - 5;     // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50; // Z
      
      sc[i] = Math.random() * 0.5 + 0.5; 

      vel[i * 3] = Math.random() * 0.5 + 0.2; // Drift freq X
      vel[i * 3 + 1] = Math.random() * 1.5 + 1.0; // Fall speed Y
      vel[i * 3 + 2] = Math.random() * 0.5 + 0.2; // Drift freq Z
    }
    
    return { positions: pos, scales: sc, velocities: vel };
  }, []);

  useFrame((state) => {
    if (mesh.current) {
        (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScale" count={count} array={scales} itemSize={1} />
        <bufferAttribute attach="attributes-aVelocity" count={count} array={velocities} itemSize={3} />
      </bufferGeometry>
      <primitive object={snowMaterial} attach="material" />
    </points>
  );
};

const SnowSystem: React.FC<SnowSystemProps> = ({ mode }) => {
  return (
    <>
      <SnowDrifts mode={mode} />
      <FallingSnow mode={mode} />
    </>
  );
};

export default SnowSystem;
