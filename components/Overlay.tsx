
import React, { useState, useRef, useEffect } from 'react';
import { TreeMode, COLORS } from '../types';

interface OverlayProps {
  mode: TreeMode;
  setMode: (mode: TreeMode) => void;
}

// 2D Snow Effect Component for the Overlay
const SnowOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Create snowflakes
    const snowflakes: { x: number; y: number; r: number; s: number; o: number }[] = [];
    const count = width < 600 ? 50 : 100; // Less snow on mobile

    for (let i = 0; i < count; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1, // Radius
        s: Math.random() * 1 + 0.5, // Speed
        o: Math.random() * 0.5 + 0.3 // Opacity
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < count; i++) {
        const f = snowflakes[i];
        
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.o})`;
        ctx.fill();

        // Update position
        f.y += f.s;
        f.x += Math.sin(f.y * 0.01) * 0.5; // Sway

        // Reset if out of bounds
        if (f.y > height) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width) {
            f.x = 0;
        } else if (f.x < 0) {
            f.x = width;
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />;
};

const Overlay: React.FC<OverlayProps> = ({ mode, setMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Animation States for Gift Opening
  const [isOpening, setIsOpening] = useState(false);
  const [isFading, setIsFading] = useState(false);
  
  // Hover state for blur effect
  const [isHovering, setIsHovering] = useState(false);

  // Eason Chan - Lonely Christmas (圣诞结)
  const musicUrl = "https://music.163.com/song/media/outer/url?id=65766.mp3";

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleModeToggle = () => {
      // If currently in GIFT mode, trigger open instead of normal toggle
      if (mode === TreeMode.GIFT) {
          triggerOpen();
          return;
      }

      if (mode === TreeMode.CHAOS) {
          setMode(TreeMode.FORMED);
      } else if (mode === TreeMode.FORMED) {
          setMode(TreeMode.TEXT);
      } else {
          // Loop back to Chaos from Text
          setMode(TreeMode.CHAOS);
      }
  };
  
  useEffect(() => {
    window.addEventListener('dblclick', handleModeToggle);
    return () => window.removeEventListener('dblclick', handleModeToggle);
  }, [mode]);

  const triggerOpen = () => {
      if (isOpening) return;
      setIsOpening(true);

      // 1. Play Music immediately
      if (audioRef.current && !isPlaying) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }

      // 2. Fade out background cover
      setTimeout(() => {
          setIsFading(true);
      }, 800);

      // 3. Switch Scene Mode
      setTimeout(() => {
          setMode(TreeMode.CHAOS);
          setTimeout(() => {
             setIsOpening(false);
             setIsFading(false);
          }, 100);
      }, 1500);
  };

  const shouldHideTitle = mode === TreeMode.CHAOS || mode === TreeMode.TEXT || mode === TreeMode.GIFT;

  // --- RIBBON STYLES (Solid Blue, Thin White Edge) ---
  
  const mainBlue = '#38bdf8'; // Sky Blue (Tailwind sky-400) - Solid
  const darkBlue = '#0284c7'; // For knot shadow
  const white = '#ffffff';
  const edgeSize = '1.5px'; // Thinner edge

  // Pattern: Solid color with white edges
  const ribbonVerticalBg = `linear-gradient(90deg, 
      ${white} 0px, ${white} ${edgeSize}, 
      ${mainBlue} ${edgeSize}, ${mainBlue} calc(100% - ${edgeSize}), 
      ${white} calc(100% - ${edgeSize}), ${white} 100%
  )`;

  const ribbonHorizontalBg = `linear-gradient(0deg, 
      ${white} 0px, ${white} ${edgeSize}, 
      ${mainBlue} ${edgeSize}, ${mainBlue} calc(100% - ${edgeSize}), 
      ${white} calc(100% - ${edgeSize}), ${white} 100%
  )`;

  const vStyle = { 
      background: ribbonVerticalBg,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  };

  const hStyle = { 
      background: ribbonHorizontalBg,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  };

  const butterflyStyle = {
      background: ribbonVerticalBg,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  return (
    <div className={`absolute top-0 left-0 w-full h-full flex flex-col items-center justify-between z-10 transition-colors duration-1000 ${mode === TreeMode.GIFT ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      
      {/* Keyframes for Bow Swaying */}
      <style>{`
        @keyframes sway-loop-left {
            0%, 100% { transform: translate(-50%, 0%) rotate(-60deg) scale(1); }
            50% { transform: translate(-50%, 0%) rotate(-65deg) scale(1.05); }
        }
        @keyframes sway-loop-right {
            0%, 100% { transform: translate(-50%, 0%) rotate(60deg) scale(1); }
            50% { transform: translate(-50%, 0%) rotate(65deg) scale(1.05); }
        }
        @keyframes sway-tail-left {
            0%, 100% { transform: translate(-50%, 0%) rotate(-150deg); }
            50% { transform: translate(-50%, 0%) rotate(-145deg); }
        }
        @keyframes sway-tail-right {
            0%, 100% { transform: translate(-50%, 0%) rotate(150deg); }
            50% { transform: translate(-50%, 0%) rotate(145deg); }
        }
      `}</style>
      
      <audio ref={audioRef} src={musicUrl} loop />

      {/* --- COVER SCENE --- */}
      {mode === TreeMode.GIFT && (
        <div 
            className={`absolute inset-0 z-50 overflow-hidden cursor-pointer transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0 scale-110 blur-2xl' : 'opacity-100 scale-100'}`}
            onClick={triggerOpen}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => setIsHovering(false)}
        >
            {/* 1. Background: Sakura Pink */}
            <div className="absolute inset-0" style={{ backgroundColor: COLORS.sakuraPink }}></div>
            
            {/* ADDED: Snow Overlay */}
            <SnowOverlay />

            {/* 2. Text: Merry Christmas (Behind Ribbons) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                 <h1 className="text-[15vw] sm:text-[18vw] leading-[0.85] font-black text-white tracking-tighter opacity-100 select-none" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
                    Merry
                </h1>
                <h1 className="text-[15vw] sm:text-[18vw] leading-[0.85] font-black text-white tracking-tighter opacity-100 select-none -mt-[2vw]" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
                    Christmas
                </h1>
            </div>

            {/* 3. Ribbons (Sky Blue with Single Edge Stripe) */}
            {/* Width: w-5 (20px) / w-8 (32px) */}
            
            {/* Vertical Main */}
            <div className="absolute top-0 bottom-0 left-1/2 w-5 sm:w-8 -translate-x-1/2 z-10" style={vStyle}></div>
            {/* Horizontal Main */}
            <div className="absolute left-0 right-0 top-1/2 h-5 sm:h-8 -translate-y-1/2 z-10" style={hStyle}></div>

            {/* 4. Center Butterfly Knot Assembly */}
            {/* Rotate entire knot assembly 230 degrees (215 + 15) */}
            <div 
                className="absolute top-1/2 left-1/2 z-20 pointer-events-none"
                style={{ transform: 'translate(-50%, -50%) rotate(230deg)' }}
            >
                
                {/* -- TAILS (Bottom) -- */}
                {/* Longer: h-48 (192px) sm:h-64 (256px) */}
                
                {/* Tail Left (Pointing down-left) */}
                <div className="absolute top-0 left-0 w-5 sm:w-8 h-48 sm:h-64 origin-top rounded-b-sm z-15"
                     style={{ 
                         ...butterflyStyle, 
                         animation: 'sway-tail-left 3s ease-in-out infinite' 
                     }}>
                </div>

                {/* Tail Right (Pointing down-right) */}
                 <div className="absolute top-0 left-0 w-5 sm:w-8 h-48 sm:h-64 origin-top rounded-b-sm z-15"
                     style={{ 
                         ...butterflyStyle, 
                         animation: 'sway-tail-right 3.5s ease-in-out infinite' 
                     }}>
                </div>

                {/* -- LOOPS (Top) -- */}
                {/* Larger Loops: h-32 sm:h-44 (Was h-20 sm:h-28) */}
                
                {/* Loop Left (Pointing up-left) */}
                <div className="absolute bottom-0 left-0 w-5 sm:w-8 h-32 sm:h-44 origin-bottom rounded-t-full z-15"
                     style={{ 
                         ...butterflyStyle, 
                         animation: 'sway-loop-left 4s ease-in-out infinite' 
                     }}>
                </div>
                
                {/* Loop Right (Pointing up-right) */}
                <div className="absolute bottom-0 left-0 w-5 sm:w-8 h-32 sm:h-44 origin-bottom rounded-t-full z-15"
                     style={{ 
                         ...butterflyStyle, 
                         animation: 'sway-loop-right 4.5s ease-in-out infinite' 
                     }}>
                </div>

                {/* -- KNOT (Center Cap) -- */}
                <div className="absolute w-6 h-6 sm:w-9 sm:h-9 rounded-full shadow-2xl z-30"
                     style={{ 
                         background: ribbonHorizontalBg, // Added white edge via gradient
                         transform: 'translate(-50%, -50%)' 
                     }}>
                     {/* Glossy Highlight */}
                     <div className="absolute inset-0 bg-white opacity-20 rounded-full"></div>
                </div>
            </div>

            {/* 5. The Tag */}
            <div 
                className="absolute top-1/2 left-1/2 origin-top-left"
                style={{
                    transform: 'rotate(15deg)',
                    zIndex: 12
                }}
            >
                {/* Inner Card - origin top-left to swing from string */}
                {/* CHANGED: Background to Pale Blue (#bae6fd) */}
                <div className="bg-[#bae6fd] border-[6px] border-white p-5 sm:p-7 rounded-xl shadow-2xl w-[250px] sm:w-[350px] relative transition-transform duration-500 hover:rotate-6 hover:scale-110 origin-top-left">
                    
                    {/* Larger Hole & Corner */}
                    {/* CHANGED: Darker blue hole accent */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#0ea5e9] rounded-full z-10 opacity-80"></div>
                    {/* CHANGED: Light blue accent corner */}
                    <div className="absolute -top-6 -left-6 w-8 h-8 border-b-2 border-l-2 border-[#e0f2fe] rounded-bl-full rotate-45 opacity-80"></div>

                    <div className="flex flex-col gap-2 pt-2 pl-2 items-end text-right pr-2">
                        {/* Font: NSimSun */}
                        {/* CHANGED: Text Color to Pink (text-pink-600) */}
                        <h3 className="text-pink-600 font-bold text-3xl sm:text-5xl tracking-wide leading-none" style={{ fontFamily: '"NSimSun", serif' }}>
                            打开盒子
                        </h3>
                        <div className="w-full h-[1px] bg-pink-400 opacity-40 my-1"></div>
                        <p className="text-pink-500 text-xs sm:text-base font-bold leading-relaxed tracking-wider opacity-90" style={{ fontFamily: '"NSimSun", serif' }}>
                            A6的圣诞盒子
                        </p>
                    </div>
                </div>
            </div>
            
        </div>
      )}


      {/* Music Toggle Button */}
      <div className={`fixed top-8 right-8 pointer-events-auto transition-opacity duration-500 z-[60] ${mode === TreeMode.GIFT && !isOpening ? 'opacity-0' : 'opacity-100'}`}>
        <button
          onClick={toggleMusic}
          className="bg-white/20 backdrop-blur-md border border-white/30 text-sky-600 hover:text-pink-500 font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {isPlaying ? (
            <>
              <span className="animate-pulse">🎵</span> Playing
            </>
          ) : (
            <>
              <span>🔇</span> Play Music
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-8 min-h-[160px] pointer-events-none z-40">
        {!shouldHideTitle && (
          <div className="transition-opacity duration-1000">
            <h1 
              className="text-6xl sm:text-7xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] tracking-widest uppercase" 
              style={{ fontFamily: '"Cinzel Decorative", serif' }}
            >
              A6’s Christmas Tree
            </h1>
          </div>
        )}
      </div>

      <div className="pointer-events-auto pb-10">
      </div>

      <div className={`absolute bottom-4 right-4 text-white/60 text-xs font-sans text-right transition-opacity duration-500 ${mode === TreeMode.GIFT ? 'opacity-0' : 'opacity-100'}`}>
        Double-click to switch scenes ✨<br/>
        R3F • Tailwind • Gemini Design
      </div>
    </div>
  );
};

export default Overlay;
