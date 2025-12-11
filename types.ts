import * as React from 'react';

export enum TreeMode {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED',
  TEXT = 'TEXT',
  GIFT = 'GIFT'
}

export interface DualPosition {
  chaosPos: [number, number, number];
  treePos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number; // For physics weight simulation (lerp speed)
  color: string;
}

export type OrnamentType = 'GIFT' | 'BALL' | 'LIGHT' | 'CAR';

// Palette
export const COLORS = {
  skyBlue: '#87CEEB',
  deepBlue: '#4169E1',
  sakuraPink: '#FFB7C5',
  hotPink: '#FF69B4',
  white: '#FFFFFF',
  gold: '#FFD700',
  foliageBlue: '#5F9EA0',
  foliagePink: '#DB7093',
};

// Augment Global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      primitive: any;
      group: any;
      mesh: any;
      instancedMesh: any;
      points: any;
      // line: any; // Removed to avoid conflict with SVG line element
      lineLoop: any;
      lineSegments: any;
      
      // Geometry
      bufferGeometry: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      capsuleGeometry: any;
      circleGeometry: any;
      planeGeometry: any;
      extrudeGeometry: any;
      coneGeometry: any;
      
      // Attributes
      bufferAttribute: any;
      instancedBufferAttribute: any;
      
      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      shaderMaterial: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      shadowMaterial: any;

      // Lights & Others
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
      hemisphereLight: any;
      fog: any;
      color: any;

      // Catch-all for others
      [elemName: string]: any;
    }
  }
}

// Augment React Module JSX namespace (critical for React 18+ where JSX is locally scoped)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      primitive: any;
      group: any;
      mesh: any;
      instancedMesh: any;
      points: any;
      // line: any; // Removed to avoid conflict with SVG line element
      lineLoop: any;
      lineSegments: any;
      
      // Geometry
      bufferGeometry: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      capsuleGeometry: any;
      circleGeometry: any;
      planeGeometry: any;
      extrudeGeometry: any;
      coneGeometry: any;
      
      // Attributes
      bufferAttribute: any;
      instancedBufferAttribute: any;
      
      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      shaderMaterial: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      shadowMaterial: any;

      // Lights & Others
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
      hemisphereLight: any;
      fog: any;
      color: any;

      // Catch-all for others
      [elemName: string]: any;
    }
  }
}