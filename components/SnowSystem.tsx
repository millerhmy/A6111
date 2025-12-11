
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

const SnowSystem: React.FC<SnowSystemProps> = ({ mode }) => {
  return (
    <>
      <SnowDrifts mode={mode} />
    </>
  );
};

export default SnowSystem;
