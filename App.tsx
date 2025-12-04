import React, { useState, useRef, useCallback } from 'react';
import { Scene } from './components/Scene';
import { ControlPanel } from './components/ControlPanel';
import { useHandTracking } from './hooks/useHandTracking';
import { AppState, Mode, ShapeType, HandData } from './types';
import { Play, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>('CHAOS');
  const [shape, setShape] = useState<ShapeType>(ShapeType.TREE);
  const [handData, setHandData] = useState<HandData>({
    present: false,
    gesture: 'NONE',
    position: { x: 0, y: 0, z: 0 }
  });
  const [debug, setDebug] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
    
    // Gesture Logic
    if (data.present) {
      if (data.gesture === 'PINCH' || data.gesture === 'FIST') {
        setMode('FORMED');
      } else if (data.gesture === 'OPEN') {
        setMode('CHAOS');
      }
    }
  }, []);

  const { isReady, error } = useHandTracking(videoRef, canvasRef, handleHandUpdate, started);

  const appState: AppState = {
    mode,
    shape,
    handData,
    debug,
    setMode,
    setShape,
    setHandData,
    toggleDebug: () => setDebug(!debug)
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      {/* Background Camera Feed (Semi-transparent) - Only render when started */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none transform scale-x-[-1]">
        {started && (
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            playsInline 
            muted
          />
        )}
      </div>
      
      {/* Hand Skeleton Overlay */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-20 pointer-events-none w-full h-full transform scale-x-[-1]"
      />

      {/* Main 3D Scene */}
      <div className="absolute inset-0 z-10">
        <Scene {...appState} />
      </div>

      {/* HUD - Only show when started */}
      {started && <ControlPanel {...appState} />}
      
      {/* Start Screen */}
      {!started && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-[#FFD700] font-mono">
          <div className="text-center p-8 border border-[#FFD700] rounded-lg shadow-[0_0_20px_#FFD700]">
            <h1 className="text-5xl mb-4 font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#F40009]">
              HOLIDAY HOLODECK
            </h1>
            <p className="mb-8 text-sm opacity-90 max-w-md mx-auto text-[#FFD700]">
              Enter the festive dimension. 
              Use hand gestures to sculpt holiday forms in real-time.
            </p>
            <button 
              onClick={() => setStarted(true)}
              className="group relative px-8 py-3 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700] font-bold tracking-widest transition-all hover:shadow-[0_0_15px_#FFD700] flex items-center gap-3 mx-auto"
            >
              <Play className="w-4 h-4 fill-current" />
              START EXPERIENCE
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay (after start, before ready) */}
      {started && !isReady && !error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-[#FFD700] font-mono backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-2xl mb-4 animate-pulse">INITIALIZING SENSORS...</h1>
            <p className="text-sm">Please allow camera access for gesture control</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-red-500 font-mono">
          <div className="text-center p-8 border border-red-500 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-xl mb-2 font-bold">SYSTEM ERROR</h1>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500 rounded"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;