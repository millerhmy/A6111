
import React, { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Foliage from './Foliage';
import { OrnamentsSystem } from './Ornaments';
import TopStar from './TopStar';
import SnowSystem from './SnowSystem';
import TextRibbon from './TextRibbon';
import PolaroidSystem from './PolaroidSystem';
import { TreeMode, COLORS } from '../types';

interface ExperienceProps {
  mode: TreeMode;
}

const Experience: React.FC<ExperienceProps> = ({ mode }) => {
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    // Smoothly transition camera to frontal position in CHAOS mode
    if (mode === TreeMode.CHAOS) {
      const targetPos = new THREE.Vector3(0, 8, 28);
      const targetLook = new THREE.Vector3(0, 2, 0);
      
      state.camera.position.lerp(targetPos, delta * 1.5);
      if (controlsRef.current) {
          controlsRef.current.target.lerp(targetLook, delta * 1.5);
          controlsRef.current.update();
      }
    }
  });

  return (
    <>
      <color attach="background" args={[COLORS.sakuraPink]} />
      <fog attach="fog" args={[COLORS.sakuraPink, 15, 50]} />

      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={40}
        target={[0, 2, 0]} 
      />

      <ambientLight intensity={0.5} color={COLORS.skyBlue} />
      <pointLight position={[10, 10, 10]} intensity={1} color={COLORS.white} />
      <spotLight position={[0, 20, 0]} intensity={2} angle={0.5} penumbra={1} color={COLORS.hotPink} />
      
      <Environment preset="lobby" blur={0.8} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group position={[0, -5, 0]}>
        <Suspense fallback={null}>
            <Foliage mode={mode} />
            <OrnamentsSystem mode={mode} />
            <TopStar mode={mode} />
            <SnowSystem mode={mode} />
            <TextRibbon mode={mode} />
            <PolaroidSystem mode={mode} />
        </Suspense>
      </group>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.2} radius={0.4} color={COLORS.hotPink} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

export default Experience;
