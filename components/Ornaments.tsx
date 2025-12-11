
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode, COLORS } from '../types';
import { generateInstanceData, InstanceData } from './MathUtils';

// --- GEOMETRY UTILS ---

// Simplified merge function
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]) {
  let vertexCount = 0;
  let indexCount = 0;
  geometries.forEach(g => {
    vertexCount += g.attributes.position.count;
    if(g.index) indexCount += g.index.count;
  });

  const positionArray = new Float32Array(vertexCount * 3);
  const normalArray = new Float32Array(vertexCount * 3);
  
  let indexArray: Uint16Array | Uint32Array | null = null;
  if(indexCount > 0) {
      indexArray = new (vertexCount > 65535 ? Uint32Array : Uint16Array)(indexCount);
  }

  let offset = 0;
  let indexOffset = 0;
  let indexBase = 0;

  geometries.forEach(g => {
    const pos = g.attributes.position.array;
    positionArray.set(pos, offset * 3);
    
    const norm = g.attributes.normal?.array;
    if(norm) normalArray.set(norm, offset * 3);
    
    if(g.index && indexArray) {
        for(let i=0; i<g.index.count; i++) {
            indexArray[indexOffset + i] = g.index.array[i] + indexBase;
        }
        indexOffset += g.index.count;
    }
    
    const count = g.attributes.position.count;
    indexBase += count;
    offset += count;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normalArray, 3));
  if(indexArray) geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
  
  return geometry;
}

// --- HOOKS ---

// Hook to animate multiple instanced meshes with the same physics data
const useSyncedAnimation = (
    mode: TreeMode, 
    data: InstanceData[], 
    refs: React.MutableRefObject<THREE.InstancedMesh | null>[],
    scaleMultiplier: number = 1,
    isUpright: boolean = false
) => {
    const tempObject = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!refs[0]?.current) return;
        const count = data.length;
        const isScatterMode = mode === TreeMode.TEXT;

        for (let i = 0; i < count; i++) {
            const item = data[i];
            const { chaosPos, treePos, textPos, rotation, scale, speed, spinSpeed } = item;
            
            // Physics / Lerp
            let target = chaosPos;
            if (mode === TreeMode.FORMED) target = treePos;
            if (isScatterMode) target = textPos; // Scattered randomly in Text Mode
            
            if (!item.currentPos) {
                item.currentPos = new THREE.Vector3(...chaosPos);
            }
            
            const current = item.currentPos;
            const targetVec = new THREE.Vector3(...target);
            
            // Variable speed based on "weight"
            const alpha = Math.min(delta * speed * 1.5, 1);
            current.lerp(targetVec, alpha);

            // Animated Rotation
            const time = state.clock.elapsedTime;
            tempObject.position.copy(current);
            
            if (isUpright && mode === TreeMode.FORMED) {
               // Spin around Y axis only for cars on tree
               tempObject.rotation.set(
                 rotation[0],
                 rotation[1] + time * spinSpeed[1],
                 rotation[2]
               );
            } else {
               tempObject.rotation.set(
                 rotation[0] + time * spinSpeed[0], 
                 rotation[1] + time * spinSpeed[1], 
                 rotation[2] + time * spinSpeed[2]
               );
            }
            
            // Scale pulse on formed/text
            const pulse = (mode === TreeMode.FORMED || isScatterMode) ? (1 + Math.sin(time * 2 + i) * 0.05) : 1;
            
            // Show ornaments in TEXT mode (scattered)
            const textScaleReduction = 1.0; 

            tempObject.scale.setScalar(scale * scaleMultiplier * pulse * textScaleReduction);
            
            tempObject.updateMatrix();

            // Apply to all synced layers
            refs.forEach(ref => {
                if(ref.current) ref.current.setMatrixAt(i, tempObject.matrix);
            });
        }
        
        refs.forEach(ref => {
            if(ref.current) ref.current.instanceMatrix.needsUpdate = true;
        });
    });
};

// --- COMPONENTS ---

// 1. COMPLEX GIFT SYSTEM (Box + Ribbons)
const GiftSystem: React.FC<{ mode: TreeMode }> = ({ mode }) => {
    // Increased count to 120 for a dense circular pile
    const count = 120;
    const bodyRef = useRef<THREE.InstancedMesh>(null);
    const ribbonRef = useRef<THREE.InstancedMesh>(null);
    const data = useMemo(() => generateInstanceData(count, 'heavy'), []);

    // Construct Geometry
    const { boxGeo, ribbonGeo } = useMemo(() => {
        const box = new THREE.BoxGeometry(1, 1, 1);
        
        // Create Ribbon Cross
        const vBand = new THREE.BoxGeometry(1.02, 1.02, 0.2);
        const hBand = new THREE.BoxGeometry(0.2, 1.02, 1.02);
        const knot = new THREE.BoxGeometry(0.4, 0.2, 0.4);
        knot.translate(0, 0.55, 0); // Move knot to top
        
        const ribbon = mergeBufferGeometries([vBand, hBand, knot]);
        
        return { boxGeo: box, ribbonGeo: ribbon };
    }, []);

    // Materials
    const boxMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1 }), []);
    const ribbonMat = useMemo(() => new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.2, metalness: 0.8 }), []);

    // Initialize Colors
    useLayoutEffect(() => {
        if (bodyRef.current) {
            const palette = [COLORS.sakuraPink, COLORS.skyBlue, COLORS.deepBlue, COLORS.white, COLORS.foliagePink];
            for(let i=0; i<count; i++) {
                const col = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
                bodyRef.current.setColorAt(i, col);
            }
            bodyRef.current.instanceColor!.needsUpdate = true;
        }
    }, []);

    useSyncedAnimation(mode, data, [bodyRef, ribbonRef], 0.8);

    return (
        <group>
            <instancedMesh ref={bodyRef} args={[boxGeo, boxMat, count]} />
            <instancedMesh ref={ribbonRef} args={[ribbonGeo, ribbonMat, count]} />
        </group>
    );
};

// 2. RETRO CAR SYSTEM (Chassis + Wheels + Glass/Details)
const CarSystem: React.FC<{ mode: TreeMode }> = ({ mode }) => {
    const count = 30; // "Lots of toy cars"
    const chassisRef = useRef<THREE.InstancedMesh>(null);
    const wheelsRef = useRef<THREE.InstancedMesh>(null);
    const glassRef = useRef<THREE.InstancedMesh>(null);
    const data = useMemo(() => generateInstanceData(count, 'upright'), []);

    // Construct Geometry
    const { chassisGeo, wheelsGeo, glassGeo } = useMemo(() => {
        // --- CHASSIS (Painted Body) ---
        // Main Body
        const body = new THREE.BoxGeometry(1.4, 0.5, 0.7);
        body.translate(0, 0.25, 0); 
        
        // Cabin
        const cabin = new THREE.BoxGeometry(0.8, 0.45, 0.6);
        cabin.translate(-0.1, 0.725, 0); 

        const chassis = mergeBufferGeometries([body, cabin]);

        // --- WHEELS (Rubber) ---
        const wGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16);
        wGeo.rotateX(Math.PI / 2); // Face out
        
        const fl = wGeo.clone(); fl.translate(0.45, 0.2, 0.35);
        const fr = wGeo.clone(); fr.translate(0.45, 0.2, -0.35);
        const bl = wGeo.clone(); bl.translate(-0.45, 0.2, 0.35);
        const br = wGeo.clone(); br.translate(-0.45, 0.2, -0.35);
        
        const wheels = mergeBufferGeometries([fl, fr, bl, br]);

        // --- DETAILS (Glass & Lights) ---
        // Windshield (Front)
        const windshield = new THREE.BoxGeometry(0.1, 0.35, 0.5);
        windshield.rotateZ(-0.1); // Slight rake
        windshield.translate(0.31, 0.725, 0);

        // Rear Window
        const rearWindow = new THREE.BoxGeometry(0.1, 0.35, 0.5);
        rearWindow.rotateZ(0.1);
        rearWindow.translate(-0.51, 0.725, 0);

        // Side Windows (Left/Right)
        const sideW = new THREE.BoxGeometry(0.6, 0.35, 0.05);
        const sideL = sideW.clone(); sideL.translate(-0.1, 0.725, 0.31);
        const sideR = sideW.clone(); sideR.translate(-0.1, 0.725, -0.31);

        // Headlights (Cylinders)
        const hLeft = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
        hLeft.rotateZ(Math.PI / 2);
        hLeft.translate(0.7, 0.25, 0.2);
        
        const hRight = hLeft.clone();
        hRight.translate(0, 0, -0.4);

        const glass = mergeBufferGeometries([windshield, rearWindow, sideL, sideR, hLeft, hRight]);

        return { chassisGeo: chassis, wheelsGeo: wheels, glassGeo: glass };
    }, []);

    // Materials
    // Body: Base Color + Metalness (Moderate)
    const chassisMat = useMemo(() => new THREE.MeshStandardMaterial({ 
        roughness: 0.3, 
        metalness: 0.5 
    }), []);

    // Wheels: High Roughness, No Reflection (Rubber)
    const wheelsMat = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: '#1a1a1a', 
        roughness: 0.9, 
        metalness: 0.0 
    }), []);

    // Glass: Transparency + Slight Reflectivity
    const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ 
        color: '#e0f7fa', // Very light blue tint
        roughness: 0.1, 
        metalness: 0.1,
        transmission: 0.6, // Glassy
        thickness: 0.5,
        transparent: true,
        opacity: 0.8
    }), []);

    // Initialize Colors for Chassis
    useLayoutEffect(() => {
        if (chassisRef.current) {
            const palette = [COLORS.hotPink, COLORS.deepBlue, COLORS.foliageBlue, '#FF6B6B', '#4ECDC4'];
            for(let i=0; i<count; i++) {
                const col = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
                chassisRef.current.setColorAt(i, col);
            }
            chassisRef.current.instanceColor!.needsUpdate = true;
        }
    }, []);

    useSyncedAnimation(mode, data, [chassisRef, wheelsRef, glassRef], 1.2, true);

    return (
        <group>
            <instancedMesh ref={chassisRef} args={[chassisGeo, chassisMat, count]} />
            <instancedMesh ref={wheelsRef} args={[wheelsGeo, wheelsMat, count]} />
            <instancedMesh ref={glassRef} args={[glassGeo, glassMat, count]} />
        </group>
    );
};

// 3. GENERIC ORNAMENTS (Balls, Lights)
const GenericOrnaments: React.FC<{ mode: TreeMode, type: 'light' | 'floating', geometry: THREE.BufferGeometry, material: THREE.Material, count: number, scale: number }> = 
({ mode, type, geometry, material, count, scale }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const data = useMemo(() => generateInstanceData(count, type), [count, type]);
    
    useLayoutEffect(() => {
        if (meshRef.current && type !== 'light') {
             // Random colors for balls only, lights are uniform gold/warm
             for(let i=0; i<count; i++) {
                const color = new THREE.Color().setHex(Math.random() > 0.5 ? 0xFFB7C5 : 0x87CEEB);
                meshRef.current.setColorAt(i, color);
             }
             meshRef.current.instanceColor!.needsUpdate = true;
        }
    }, []);

    useSyncedAnimation(mode, data, [meshRef], scale);

    return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
};

// --- MAIN EXPORT ---

export const OrnamentsSystem: React.FC<{ mode: TreeMode }> = ({ mode }) => {
  // Shared Geometries
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  
  // Materials
  const ballMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: COLORS.white, roughness: 0.1, metalness: 0.6, clearcoat: 1 }), []);
  const lightMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFFACD' }), []);

  return (
    <group>
      <GiftSystem mode={mode} />
      <CarSystem mode={mode} />
      
      {/* Balls */}
      <GenericOrnaments mode={mode} count={60} geometry={sphereGeo} material={ballMat} type="light" scale={0.5} />
      
      {/* Lights (High count, small size) */}
      <GenericOrnaments mode={mode} count={200} geometry={sphereGeo} material={lightMat} type="light" scale={0.1} />
    </group>
  );
};
