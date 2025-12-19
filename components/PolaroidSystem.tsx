
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { getRandomSpherePoint } from './MathUtils';

interface PolaroidSystemProps {
  mode: TreeMode;
}

// User provided Polaroid Image
const PHOTO_URL = "https://i.imgur.com/SlozniS.jpg";

// Reduce count to 12
const IMAGES = Array(12).fill(PHOTO_URL);

// Helper to get random Euler rotation
const getRandomRotation = (): [number, number, number] => {
    return [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
};

const Polaroid: React.FC<{ 
  url: string; 
  chaosPos: [number, number, number];
  chaosRot: [number, number, number];
  treePos: [number, number, number];
  treeRot: [number, number, number];
  scaleOffset: number;
  mode: TreeMode;
}> = ({ url, chaosPos, chaosRot, treePos, treeRot, scaleOffset, mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  
  // Random floating parameters
  const floatSpeed = useRef(Math.random() * 0.5 + 0.2);
  const floatOffset = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Determine Target Position and Rotation based on Mode
    let targetPos: THREE.Vector3;
    let targetRot: THREE.Euler;
    
    if (mode === TreeMode.FORMED) {
        targetPos = new THREE.Vector3(...treePos);
        targetRot = new THREE.Euler(...treeRot);
    } else {
        // Default to Chaos position
        targetPos = new THREE.Vector3(...chaosPos);
        targetRot = new THREE.Euler(...chaosRot);
    }

    // 1. Floating Animation
    const floatY = Math.sin(t * floatSpeed.current + floatOffset.current) * 0.1;
    targetPos.y += floatY;

    // 2. Interpolate Position
    const lerpFactor = delta * 2.0;
    groupRef.current.position.lerp(targetPos, lerpFactor);

    // 3. Interpolate Rotation
    const currentQ = groupRef.current.quaternion;
    let targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(...targetRot));
    
    if (mode === TreeMode.CHAOS) {
         // "Position the Polaroid camera directly facing the scene"
         // Make the photo face the center (0, 5, 0)
         const center = new THREE.Vector3(0, 5, 0);
         const lookMat = new THREE.Matrix4();
         lookMat.lookAt(groupRef.current.position, center, new THREE.Vector3(0, 1, 0));
         targetQ.setFromRotationMatrix(lookMat);
         
         // Add a very slight organic wobble
         const wobble = new THREE.Quaternion().setFromEuler(new THREE.Euler(
             Math.sin(t * 0.3) * 0.1,
             Math.cos(t * 0.4) * 0.1,
             0
         ));
         targetQ.multiply(wobble);
    } else if (mode === TreeMode.FORMED && !hovered) {
         const sway = Math.sin(t * 0.5 + floatOffset.current) * 0.05;
         const swayQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, sway));
         targetQ.multiply(swayQ);
    }
    
    groupRef.current.quaternion.slerp(targetQ, lerpFactor);

    // 4. Scale/Visibility Logic
    const isVisible = (mode === TreeMode.CHAOS || mode === TreeMode.FORMED);
    let targetScale = isVisible ? 1 : 0;
    if (isVisible && hovered) targetScale *= 1.3;

    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group 
        ref={groupRef} 
        position={chaosPos} 
        rotation={chaosRot}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
    >
      {/* White Frame */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      
      {/* Photo Image */}
      <Image 
        url={url} 
        position={[0, 0.08, 0.02]}
        scale={[1, 1]}
        transparent
      />
      
      {/* Handwritten Text Placeholder */}
      <mesh position={[0, -0.55, 0.02]}>
          <planeGeometry args={[0.8, 0.02]} />
          <meshBasicMaterial color="#ccc" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const PolaroidSystem: React.FC<PolaroidSystemProps> = ({ mode }) => {
  const polaroids = useMemo(() => {
    const treeHeight = 15;
    const treeBase = 5.5;
    
    return IMAGES.map((url, i) => {
      const yMin = 1.5;
      const yMax = 12.5;
      const y = yMin + Math.random() * (yMax - yMin);
      const radiusAtHeight = (treeBase + 1.2) * (1 - (y / treeHeight));
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * radiusAtHeight;
      const tz = Math.sin(angle) * radiusAtHeight;
      const rotY = -angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const coneTilt = -Math.atan(treeBase / treeHeight);
      const rotX = coneTilt + (Math.random() - 0.5) * 0.6;
      const rotZ = (Math.random() - 0.5) * 0.6;
      
      const treePos: [number, number, number] = [tx, y, tz];
      const treeRot: [number, number, number] = [rotX, rotY, rotZ];

      const chaosPos = getRandomSpherePoint(20); 
      chaosPos[1] = Math.max(chaosPos[1], 1); 
      const chaosRot = getRandomRotation();

      return { url, chaosPos, chaosRot, treePos, treeRot, scaleOffset: Math.random() };
    });
  }, []);

  return (
    <group>
      {polaroids.map((data, i) => (
        <Polaroid 
          key={i}
          mode={mode}
          url={data.url}
          chaosPos={data.chaosPos}
          chaosRot={data.chaosRot}
          treePos={data.treePos}
          treeRot={data.treeRot}
          scaleOffset={data.scaleOffset}
        />
      ))}
    </group>
  );
};

export default PolaroidSystem;
