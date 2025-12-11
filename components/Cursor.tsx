
import React, { useEffect, useRef, useState } from 'react';

const Cursor: React.FC = () => {
  const mainCursor = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Track mouse and smooth position
  const mouse = useRef({ x: -100, y: -100 });
  const cursorSmooth = useRef({ x: -100, y: -100 });
  
  // Physics for the main cursor (lerp factor)
  const speed = 0.15;
  
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    
    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Initial position to prevent jump
    cursorSmooth.current = { ...mouse.current };

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    // Trail history for the tail effect
    // We store positions to have the dots follow the path
    const trailHistory: { x: number; y: number }[] = Array(12).fill({ x: -100, y: -100 });

    const loop = () => {
      // 1. Smooth Main Cursor Movement
      const distX = mouse.current.x - cursorSmooth.current.x;
      const distY = mouse.current.y - cursorSmooth.current.y;
      
      cursorSmooth.current.x += distX * speed;
      cursorSmooth.current.y += distY * speed;

      if (mainCursor.current) {
        mainCursor.current.style.transform = `translate3d(${cursorSmooth.current.x}px, ${cursorSmooth.current.y}px, 0) translate(-50%, -50%) scale(${isClicking ? 1.3 : 1})`;
        
        // Dynamic Glow on Click
        if (isClicking) {
            mainCursor.current.style.boxShadow = `
                0 0 20px rgba(255, 255, 255, 0.6),
                inset 0 0 15px rgba(255, 255, 255, 0.4)
            `;
            mainCursor.current.style.border = '1px solid rgba(255, 255, 255, 0.8)';
        } else {
            mainCursor.current.style.boxShadow = `
                0 4px 10px rgba(0, 0, 0, 0.1),
                inset 0 0 8px rgba(255, 255, 255, 0.3)
            `;
            mainCursor.current.style.border = '1px solid rgba(255, 255, 255, 0.4)';
        }
      }

      // 2. Update Trail History (Shift values)
      // We push the current smooth position to the start of the history
      trailHistory.pop();
      trailHistory.unshift({ ...cursorSmooth.current });

      // 3. Render Trail Dots
      trailRefs.current.forEach((el, index) => {
        if (!el) return;
        const pos = trailHistory[index];
        
        // Scale down towards the end of the tail
        const scale = 1 - (index / trailHistory.length);
        const opacity = 0.6 * scale;

        el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        el.style.opacity = opacity.toString();
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isClicking]);

  return (
    <>
      {/* Main Glass Lens Cursor */}
      <div
        ref={mainCursor}
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999] backdrop-blur-sm transition-transform duration-100 ease-out will-change-transform"
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          // Default styles overridden by JS for dynamic updates, but kept here for initial render
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1), inset 0 0 8px rgba(255, 255, 255, 0.3)',
        }}
      />

      {/* Trailing Light Tail */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] will-change-transform"
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#87CEEB', // SkyBlue glow
            boxShadow: '0 0 8px #87CEEB',
          }}
        />
      ))}
    </>
  );
};

export default Cursor;
