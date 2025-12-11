
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode, COLORS } from '../types';

const TopStar: React.FC<{ mode: TreeMode }> = ({ mode }) => {
  const ref = useRef<THREE.Group>(null);
  // Moved up to 15.0 to sit on top of the tree tip (height 15)
  const targetY = 15.0;
  const chaosY = 25; // Start high up
  const textY = 25; // Keep it high for text mode

  // Create 5-Pointed Star Shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.5;
    const innerRadius = 0.7;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2;
      
      // Rotate angle to make sure top point is straight up (-Math.PI / 2 offset typically, but depends on UV)
      // Standard: 0 is right. We want top. PI/2.
      const x = Math.cos(angle + Math.PI / 2) * r;
      const y = Math.sin(angle + Math.PI / 2) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center(); // Center the geometry so rotation is clean
    return geom;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Movement
    let target = chaosY;
    if (mode === TreeMode.FORMED) target = targetY;
    if (mode === TreeMode.TEXT) target = textY;

    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, target, delta * 2);

    // Rotation
    ref.current.rotation.y += delta * 1.5;
    // Gentle floating tilt
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    
    // Scale pulse and Hide logic
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    // Hide in TEXT mode
    const finalScale = (mode === TreeMode.TEXT) ? 0 : pulse;
    
    ref.current.scale.setScalar(finalScale);
  });

  return (
    <group ref={ref} position={[0, chaosY, 0]}>
      {/* Core Star */}
      <mesh geometry={starGeometry}>
        <meshStandardMaterial color={COLORS.gold} roughness={0.2} metalness={0.8} emissive={COLORS.gold} emissiveIntensity={0.2} />
      </mesh>
      
      {/* Halo removed as requested */}
    </group>
  );
};

export default TopStar;
