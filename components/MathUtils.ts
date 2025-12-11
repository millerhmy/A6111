
import * as THREE from 'three';

// Helper to generate a random point inside a sphere
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta) + 5; // Offset Y slightly up
  const z = r * Math.cos(phi);
  return [x, y, z];
};

// Helper to generate a point on a cone surface (Tree shape)
// yRatio: 0 (bottom) to 1 (top)
export const getConePoint = (
  height: number,
  baseRadius: number,
  i: number,
  total: number,
  randomness: number = 0
): [number, number, number] => {
  const ratio = i / total;
  
  // Spiral distribution
  const theta = i * 2.5 + Math.random() * randomness; 
  
  // Height from bottom to top
  const y = ratio * height;
  
  // Radius decreases as we go up
  const currentRadius = baseRadius * (1 - ratio);
  
  const x = currentRadius * Math.cos(theta);
  const z = currentRadius * Math.sin(theta);
  
  return [x, y, z];
};

// --- TEXT GENERATION UTILS ---
let cachedTextPoints: [number, number, number][] | null = null;

export const generateTextPoints = () => {
  if (typeof document === 'undefined') return [];
  if (cachedTextPoints) return cachedTextPoints;

  // INCREASED CANVAS SIZE to prevent text clipping
  const width = 2048;
  const height = 2048; 
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return [];

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // White Text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 1. Draw "A6" 
  // Changed to Cinzel Decorative for a magical/special Christmas serif look
  ctx.font = '900 450px "Cinzel Decorative", serif';
  ctx.fillText('A6', width / 2, height / 2 - 180);
  
  // 2. Draw "Merry Christmas"
  // Adjusted font size to fit within the scene width better
  ctx.font = '700 180px "Cinzel Decorative", serif';
  ctx.fillText('MERRY CHRISTMAS', width / 2, height / 2 + 200);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const points: [number, number, number][] = [];

  // Scan pixels
  // Step 2 for VERY high density sampling (more particles for smaller text)
  const step = 2;
  
  // REDUCED SCALE FACTOR to ensure text stays within camera frustum on mobile
  // Was 0.015, now 0.01 to tighten the text layout in 3D space.
  const scale = 0.01;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      // If pixel is bright enough
      if (data[i] > 128) {
        // Map to 3D space
        const posX = (x - width / 2) * scale; 
        // Center around Y=7.0
        const posY = -(y - height / 2) * scale + 7.0;
        
        points.push([posX, posY, 0]);
      }
    }
  }

  // Shuffle points to prevent patterns when assigning
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  cachedTextPoints = points;
  return points;
};

// Accessor for components
export const getRandomTextPoint = (): [number, number, number] => {
  const points = generateTextPoints();
  if (points.length === 0) return [0, 10, 0];
  const pt = points[Math.floor(Math.random() * points.length)];
  // Reduced Z jitter for tighter text volume
  return [pt[0], pt[1], pt[2] + (Math.random() - 0.5) * 1.0];
};

export interface InstanceData {
  chaosPos: [number, number, number];
  treePos: [number, number, number];
  textPos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  spinSpeed: [number, number, number];
  currentPos?: THREE.Vector3; // Runtime cache
}

// Generate data for instances
export const generateInstanceData = (count: number, type: 'foliage' | 'heavy' | 'light' | 'floating' | 'upright') => {
  const data: InstanceData[] = [];
  const treeHeight = 14;
  const treeBase = 5.5; // Synced with Foliage width

  for (let i = 0; i < count; i++) {
    const chaos = getRandomSpherePoint(15);
    let tree = getConePoint(treeHeight, treeBase, i, count, 0.5);
    
    // SCATTER LOGIC FOR TEXT MODE
    // Updated: "Shrink safe zone" -> Bring ornaments closer and tighter behind text.
    // Text Width ~16, Height ~10, Y Center ~7.
    
    // 1. Tighter Horizontal Spread (Was 80, now 45)
    const tx = (Math.random() - 0.5) * 45; 
    
    // 2. Tighter Vertical Spread (Was 50, now 35), centered on Y=7
    const ty = (Math.random() - 0.5) * 35 + 7; 
    
    // 3. Z Depth: Closer behind the text.
    // Text is at Z=0. Ribbon back loop is Z ~ -3.
    // Range: -4 to -16 (Was -10 to -40)
    const tz = -4 - Math.random() * 12; 
    
    const text: [number, number, number] = [tx, ty, tz];


    // CLUSTERING LOGIC:
    // Gifts ('heavy') should cluster at the bottom to form a circular pile.
    if (type === 'heavy') {
        // 85% Chance to be part of the base pile
        if (Math.random() < 0.85) {
            // Circular Pile Logic:
            const maxR = treeBase + 0.5; 
            const r = Math.sqrt(Math.random()) * maxR; 
            const angle = Math.random() * Math.PI * 2;
            
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            
            // Pile Height Logic:
            const heightEnvelope = 3.5 * (1 - (r / maxR)); 
            const y = (Math.random() * Math.max(0.5, heightEnvelope)) + 0.1; 
            
            tree = [x, y, z];
        } else {
            // The rest are distributed on the tree, but biased towards the lower half
            const randomI = Math.floor(Math.random() * count * 0.6); // Top 40% empty of heavy gifts
            tree = getConePoint(treeHeight, treeBase, randomI, count, 0.5);
        }
    }
    
    // Adjust physics/lerp speed based on weight
    let speed = 2.0;
    if (type === 'heavy' || type === 'upright') speed = 0.8; // Slow (Gifts, Cars)
    if (type === 'light') speed = 3.0; // Fast (Lights)
    if (type === 'floating') speed = 1.2; // (Floating elements)

    // Rotation logic
    let rotation: [number, number, number] = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
    let spinSpeed: [number, number, number] = [Math.random() * 0.5, Math.random() * 0.5, 0];

    // Constrain cars to be mostly upright
    if (type === 'upright') {
        rotation = [0, Math.random() * Math.PI * 2, 0];
        spinSpeed = [0, 0.5 + Math.random() * 0.5, 0];
        
        // Push cars to the outer ring of the floor if they are low
        if (tree[1] < 2) {
             const r = treeBase + 1 + Math.random() * 2;
             const angle = Math.atan2(tree[2], tree[0]); // Keep angle
             tree[0] = Math.cos(angle) * r;
             tree[2] = Math.sin(angle) * r;
             tree[1] = 0.25; // Sit on top of reduced snow (approx 0.25 height)
        }
    } else if (type === 'heavy') {
        // Gifts can tumble slowly
        spinSpeed = [Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2];
        // Gifts at the bottom should be mostly upright-ish
        if (tree[1] < 3) {
             rotation = [0, Math.random() * Math.PI * 2, 0];
        }
    }

    data.push({
      chaosPos: chaos,
      treePos: tree,
      textPos: text, // Scattered strictly in background but closer
      rotation,
      scale: Math.random() * 0.5 + 0.5,
      speed,
      spinSpeed
    });
  }
  return data;
};
