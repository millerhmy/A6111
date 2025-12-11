
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, TreeMode } from '../types';

interface CharacterProps {
    mode?: TreeMode; // Optional for backward compatibility, though we pass it now
}

export const Character: React.FC<CharacterProps> = ({ mode }) => {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Animation: Breathing & Head bob
  useFrame((state, delta) => {
    if (!group.current || !headRef.current || !rightArmRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Gentle breathing (Scale Y slightly)
    group.current.scale.y = 1 + Math.sin(t * 2) * 0.005;
    
    // Head bob
    headRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    headRef.current.rotation.z = Math.sin(t * 1) * 0.05;

    // Arm sway (holding phone)
    rightArmRef.current.rotation.z = -0.2 + Math.sin(t * 1.5) * 0.05;
    
    // Visibility/Scale transition for TEXT/POLAROID mode
    // We want the character to disappear in TEXT and POLAROID mode
    const isVisible = mode === TreeMode.FORMED || mode === TreeMode.CHAOS;
    const targetScale = isVisible ? 1.2 : 0;
    
    const currentScale = group.current.userData.scale || 1.2;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 3);
    group.current.userData.scale = nextScale;
    
    group.current.scale.setScalar(nextScale);
    // Re-apply breathing to Y on top of the base scale? 
    // Actually setScalar sets x,y,z. Breathing sets Y. 
    // To mix, we set X/Z to nextScale, and Y to nextScale * breathing.
    group.current.scale.set(nextScale, nextScale * (1 + Math.sin(t * 2) * 0.005), nextScale);
  });

  const skinColor = "#FFDFC4";
  const hairColor = "#FF9EB5"; // Pink hair
  const hoodieColor = "#D3D3D3"; // Light grey
  const jacketColor = "#2D3748"; // Dark blue/black denim
  const jeansColor = "#7F9CF5"; // Light blue denim
  const shoeColorMain = "#1A202C"; // Black
  const shoeColorSole = "#FFFFFF";

  return (
    <group ref={group} position={[3.5, 0.4, 2.0]} rotation={[0, -0.8, 0]}>
      
      {/* --- HEAD GROUP --- */}
      <group ref={headRef} position={[0, 1.4, 0]}>
        {/* Face */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Hair (Procedural Clumps) */}
        <group position={[0, 0.05, 0]}>
            {/* Main bulk */}
            <mesh position={[0, 0.15, -0.1]}>
                <sphereGeometry args={[0.36, 16, 16]} />
                <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
            {/* Bangs / Spikes */}
            {[...Array(8)].map((_, i) => (
                <mesh key={i} position={[
                    Math.sin(i) * 0.3, 
                    0.2 + Math.cos(i) * 0.1, 
                    0.25
                ]} rotation={[Math.random(), Math.random(), Math.random()]}>
                    <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
                    <meshStandardMaterial color={hairColor} roughness={0.6} />
                </mesh>
            ))}
        </group>

        {/* Eyes (Simple dots for stylized look) */}
        <mesh position={[-0.12, 0.05, 0.3]} scale={[1, 1.2, 1]}>
             <sphereGeometry args={[0.03, 8, 8]} />
             <meshBasicMaterial color="#333" />
        </mesh>
        <mesh position={[0.12, 0.05, 0.3]} scale={[1, 1.2, 1]}>
             <sphereGeometry args={[0.03, 8, 8]} />
             <meshBasicMaterial color="#333" />
        </mesh>
        {/* Blush */}
        <mesh position={[-0.18, -0.05, 0.28]}>
             <circleGeometry args={[0.04, 16]} />
             <meshBasicMaterial color="#FFB7C5" transparent opacity={0.5} depthWrite={false}/>
        </mesh>
        <mesh position={[0.18, -0.05, 0.28]}>
             <circleGeometry args={[0.04, 16]} />
             <meshBasicMaterial color="#FFB7C5" transparent opacity={0.5} depthWrite={false}/>
        </mesh>
      </group>

      {/* --- BODY GROUP --- */}
      <group position={[0, 0.7, 0]}>
        {/* Hoodie Inner */}
        <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.32, 0.7, 16]} />
            <meshStandardMaterial color={hoodieColor} roughness={0.8} />
        </mesh>
        {/* Jacket Outer (Open front) */}
        <group>
            <mesh position={[0, 0, -0.05]}>
                <boxGeometry args={[0.65, 0.72, 0.4]} />
                <meshStandardMaterial color={jacketColor} roughness={0.7} />
            </mesh>
            {/* Hood hanging back */}
            <mesh position={[0, 0.35, -0.25]} rotation={[0.5, 0, 0]}>
                <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
                <meshStandardMaterial color={hoodieColor} roughness={0.8} />
            </mesh>
        </group>
      </group>

      {/* --- LEGS (Sitting Pose) --- */}
      <group position={[0, 0.35, 0]}>
          {/* Left Leg: Extended slightly forward */}
          <group position={[-0.2, 0, 0.1]} rotation={[-1.4, 0.2, -0.1]}>
             {/* Thigh */}
             <mesh position={[0, 0.3, 0]}>
                <capsuleGeometry args={[0.13, 0.5, 4, 8]} />
                <meshStandardMaterial color={jeansColor} roughness={0.6} />
             </mesh>
             {/* Shin (Straightish) */}
             <mesh position={[0, -0.25, 0.05]} rotation={[0.2, 0, 0]}>
                <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
                <meshStandardMaterial color={jeansColor} roughness={0.6} />
             </mesh>
             {/* Shoe */}
             <group position={[0, -0.6, 0.1]} rotation={[1.5, 0, 0]}>
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[0.15, 0.1, 0.3]} />
                    <meshStandardMaterial color={shoeColorSole} />
                </mesh>
                <mesh position={[0, 0.12, -0.05]}>
                    <boxGeometry args={[0.14, 0.1, 0.2]} />
                    <meshStandardMaterial color={shoeColorMain} />
                </mesh>
             </group>
          </group>

          {/* Right Leg: Bent Knee */}
          <group position={[0.2, 0, 0.1]} rotation={[-1.0, -0.2, 0.1]}>
             {/* Thigh */}
             <mesh position={[0, 0.3, 0]}>
                <capsuleGeometry args={[0.13, 0.5, 4, 8]} />
                <meshStandardMaterial color={jeansColor} roughness={0.6} />
             </mesh>
             {/* Shin (Bent back) */}
             <mesh position={[0, -0.2, -0.2]} rotation={[-1.5, 0, 0]}>
                <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
                <meshStandardMaterial color={jeansColor} roughness={0.6} />
             </mesh>
             {/* Shoe */}
             <group position={[0, -0.55, -0.2]} rotation={[2.5, 0, 0]}>
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[0.15, 0.1, 0.3]} />
                    <meshStandardMaterial color={shoeColorSole} />
                </mesh>
                <mesh position={[0, 0.12, -0.05]}>
                    <boxGeometry args={[0.14, 0.1, 0.2]} />
                    <meshStandardMaterial color={shoeColorMain} />
                </mesh>
             </group>
          </group>
      </group>

      {/* --- ARMS --- */}
      <group position={[0, 1.0, 0]}>
          {/* Left Arm: Resting back/down */}
          <group position={[-0.35, -0.1, 0]} rotation={[0, 0, 0.2]}>
              <mesh position={[0, -0.25, 0]}>
                 <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
                 <meshStandardMaterial color={jacketColor} />
              </mesh>
              {/* Forearm */}
              <mesh position={[0, -0.6, 0.1]} rotation={[-0.5, 0, 0]}>
                 <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
                 <meshStandardMaterial color={jacketColor} />
              </mesh>
               {/* Hand */}
               <mesh position={[0, -0.85, 0.2]}>
                 <sphereGeometry args={[0.08]} />
                 <meshStandardMaterial color={skinColor} />
              </mesh>
          </group>

          {/* Right Arm: Holding Phone (Selfie/Peace mode) */}
          <group ref={rightArmRef} position={[0.35, -0.1, 0]} rotation={[0, 0, -0.2]}>
              <mesh position={[0, -0.2, 0.1]} rotation={[-0.5, 0, 0]}>
                 <capsuleGeometry args={[0.1, 0.45, 4, 8]} />
                 <meshStandardMaterial color={jacketColor} />
              </mesh>
              {/* Forearm (Up) */}
              <group position={[0, -0.45, 0.25]} rotation={[-2.5, 0.5, 0]}>
                  <mesh position={[0, 0.2, 0]}>
                     <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
                     <meshStandardMaterial color={jacketColor} />
                  </mesh>
                  {/* Hand */}
                  <mesh position={[0, 0.45, 0]}>
                     <sphereGeometry args={[0.08]} />
                     <meshStandardMaterial color={skinColor} />
                  </mesh>
                  {/* PHONE (Pink Case) */}
                  <mesh position={[0.02, 0.5, 0.05]} rotation={[0.2, 0, 0.2]}>
                     <boxGeometry args={[0.15, 0.25, 0.02]} />
                     <meshStandardMaterial color="#FFB7C5" />
                  </mesh>
                  {/* Peace Sign Fingers (Abstract) */}
                  <mesh position={[-0.02, 0.55, -0.02]} rotation={[0, 0, 0.2]}>
                     <capsuleGeometry args={[0.02, 0.1]} />
                     <meshStandardMaterial color={skinColor} />
                  </mesh>
                  <mesh position={[0.02, 0.55, -0.02]} rotation={[0, 0, -0.2]}>
                     <capsuleGeometry args={[0.02, 0.1]} />
                     <meshStandardMaterial color={skinColor} />
                  </mesh>
              </group>
          </group>
      </group>

    </group>
  );
};
