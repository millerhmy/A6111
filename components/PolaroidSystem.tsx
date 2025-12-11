
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
    
    // CHAOS = Scattered
    // FORMED = Tree Cone
    if (mode === TreeMode.FORMED) {
        targetPos = new THREE.Vector3(...treePos);
        targetRot = new THREE.Euler(...treeRot);
    } else {
        // Default to Chaos position for CHAOS, TEXT, GIFT (though visibility handles TEXT/GIFT)
        targetPos = new THREE.Vector3(...chaosPos);
        targetRot = new THREE.Euler(...chaosRot);
    }

    // 1. Floating Animation
    // Add floating to Y for aliveness
    const floatY = Math.sin(t * floatSpeed.current + floatOffset.current) * 0.1;
    targetPos.y += floatY;

    // 2. Interpolate Position
    // Use a smooth lerp factor
    const lerpFactor = delta * 2.0;
    groupRef.current.position.lerp(targetPos, lerpFactor);

    // 3. Interpolate Rotation
    // Create Quaternions for smooth rotation transition
    const currentQ = groupRef.current.quaternion;
    const targetQ = new THREE.Quaternion().setFromEuler(targetRot);
    
    // Add a gentle sway to the target rotation if formed
    if (mode === TreeMode.FORMED && !hovered) {
         const sway = Math.sin(t * 0.5 + floatOffset.current) * 0.05;
         const swayQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, sway));
         targetQ.multiply(swayQ);
    } else if (mode === TreeMode.CHAOS) {
         // Tumble slowly in chaos
         const tumble = t * 0.1;
         const tumbleQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(tumble, tumble, 0));
         targetQ.multiply(tumbleQ);
    }
    
    groupRef.current.quaternion.slerp(targetQ, lerpFactor);

    // 4. Scale/Visibility Logic
    // Show in CHAOS and FORMED. Hide in TEXT and GIFT.
    const isVisible = (mode === TreeMode.CHAOS || mode === TreeMode.FORMED);
    
    // Base scale logic
    let targetScale = isVisible ? 1 : 0;
    
    // Hover effect
    if (isVisible && hovered) targetScale *= 1.3;

    // Smooth transition for scale
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group 
        ref={groupRef} 
        // Initial placement
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
      
      {/* Photo Image - Position adjusted downwards (0.15 -> 0.08) for better framing */}
      <Image 
        url={url} 
        position={[0, 0.08, 0.02]}
        scale={[1, 1]}
        transparent
      />
      
      {/* Handwritten Text Placeholder (Line) */}
      <mesh position={[0, -0.55, 0.02]}>
          <planeGeometry args={[0.8, 0.02]} />
          <meshBasicMaterial color="#ccc" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const PolaroidSystem: React.FC<PolaroidSystemProps> = ({ mode }) => {
  // Generate random positions around the tree
  const polaroids = useMemo(() => {
    // const count = IMAGES.length; // Not needed for random distribution
    const treeHeight = 15;
    const treeBase = 5.5;
    
    return IMAGES.map((url, i) => {
      // 1. TREE STATE (Cone Surface)
      // Random Distribution instead of Spiral
      
      // Random height between bottom and top of foliage area
      const yMin = 1.5;
      const yMax = 12.5;
      const yRange = yMax - yMin;
      const y = yMin + Math.random() * yRange;
      
      // Calculate Cone Radius at this height
      // Formula: r = base * (1 - y/h)
      // Add slight offset (1.5) so photos hover *above* the leaves
      const radiusAtHeight = (treeBase + 1.2) * (1 - (y / treeHeight));
      
      // Random Angle around the cone
      const angle = Math.random() * Math.PI * 2;
      
      const tx = Math.cos(angle) * radiusAtHeight;
      const tz = Math.sin(angle) * radiusAtHeight;
      
      // ROTATION:
      // 1. Face Outward: Y rotation = -angle + PI/2
      // Add random Y jitter so they aren't perfectly aligned to center
      const rotY = -angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      
      // 2. Tilt Back: X rotation to match cone slope
      const coneTilt = -Math.atan(treeBase / treeHeight);
      // Add significant randomness to X/Z tilt to make them look tossed/stuck
      const rotX = coneTilt + (Math.random() - 0.5) * 0.6; // +/- 0.3 rad tilt variation
      const rotZ = (Math.random() - 0.5) * 0.6; // +/- 0.3 rad swing variation
      
      const treePos: [number, number, number] = [tx, y, tz];
      const treeRot: [number, number, number] = [rotX, rotY, rotZ];

      // 2. CHAOS STATE (Scattered in Space)
      // Use helper to get a point in a large sphere
      const chaosPos = getRandomSpherePoint(20); 
      // Ensure they aren't underground
      chaosPos[1] = Math.max(chaosPos[1], 1); 
      const chaosRot = getRandomRotation();

      return {
        url,
        chaosPos,
        chaosRot,
        treePos,
        treeRot,
        scaleOffset: Math.random()
      };
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
