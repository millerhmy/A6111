
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import Cursor from './components/Cursor';
import { TreeMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<TreeMode>(TreeMode.GIFT);

  return (
    <div className="w-full h-screen bg-pink-100 relative overflow-hidden">
      <Cursor />
      <Overlay mode={mode} setMode={setMode} />
      
      <Canvas
        shadows
        camera={{ position: [0, 8, 28], fov: 45 }}
        dpr={[1, 2]} // Handle pixel ratio for sharp rendering on mobile
        gl={{ antialias: false, alpha: true, stencil: false, depth: true }}
      >
        <Experience mode={mode} />
      </Canvas>
    </div>
  );
};

export default App;
    