import React, { useState, useEffect } from 'react';
import { AppState, ShapeType } from '../types';
import { Hand, Zap, Lock, Activity, Camera } from 'lucide-react';
import clsx from 'clsx';

interface ControlPanelProps extends AppState {}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  mode, shape, handData, setShape, setMode 
}) => {
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(55 + Math.random() * 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const nextShape = () => {
    const shapes = Object.values(ShapeType);
    const currIdx = shapes.indexOf(shape);
    const nextIdx = (currIdx + 1) % shapes.length;
    setShape(shapes[nextIdx]);
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex justify-between items-start z-10 text-[#FFD700]">
      
      {/* LEFT HUD */}
      <div className="flex flex-col gap-4 w-64">
        <div className="border border-[#FFD700]/30 bg-black/50 p-4 rounded backdrop-blur-sm">
          <h1 className="text-2xl font-bold tracking-widest mb-2 border-b border-[#FFD700]/30 pb-1 text-[#FFD700] shadow-[0_0_10px_#FFD700]">
            HOLIDAY HOLODECK
          </h1>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={clsx("w-2 h-2 rounded-full", mode === 'FORMED' ? "bg-green-500 shadow-[0_0_8px_#00FF00]" : "bg-red-500 shadow-[0_0_8px_#FF0000]")} />
            <span className="text-sm font-bold text-white">SYS_MODE: {mode}</span>
          </div>

          <div className="flex items-center gap-2 text-xs opacity-80 text-[#FFD700]">
            <Activity size={14} />
            <span>PARTICLES: 4500</span>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-80 text-[#FFD700]">
            <Zap size={14} />
            <span>FPS: {fps}</span>
          </div>
        </div>

        {/* Hand Status */}
        <div className="border border-[#FFD700]/30 bg-black/50 p-4 rounded backdrop-blur-sm">
           <h2 className="text-sm font-bold mb-2 flex items-center gap-2 text-[#FFD700]">
             <Hand size={16} /> SENSOR STATUS
           </h2>
           <div className="grid grid-cols-2 gap-2 text-xs">
             <div className={clsx("flex items-center gap-1", handData.present ? "text-green-400" : "text-red-400")}>
               <Camera size={12} /> TRACKING
             </div>
             <div className={clsx("flex items-center gap-1", handData.gesture === 'PINCH' ? "text-yellow-400" : "text-gray-500")}>
               <Lock size={12} /> PINCH_LOCK
             </div>
           </div>
           <div className="mt-2 text-xs font-mono border-t border-[#FFD700]/10 pt-2">
             GESTURE: <span className="text-white">{handData.gesture}</span>
           </div>
        </div>
      </div>

      {/* RIGHT CONTROLS */}
      <div className="flex flex-col gap-4 pointer-events-auto">
        <div className="border border-[#FFD700]/30 bg-black/50 p-4 rounded backdrop-blur-sm">
          <h2 className="text-sm font-bold mb-3 border-b border-[#FFD700]/30 pb-1 text-[#FFD700]">
            FORM CONTROL
          </h2>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={nextShape}
              className="bg-[#FFD700]/10 hover:bg-[#FFD700]/30 text-[#FFD700] border border-[#FFD700] px-4 py-2 rounded text-xs font-bold transition-all hover:shadow-[0_0_15px_#FFD700]"
            >
              NEXT FORM_TYPE :: {shape}
            </button>
            
            <button 
              onClick={() => setMode(mode === 'CHAOS' ? 'FORMED' : 'CHAOS')}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/20 px-4 py-2 rounded text-xs transition-colors"
            >
              TOGGLE ENTROPY
            </button>
          </div>
        </div>

        <div className="border border-[#FFD700]/30 bg-black/50 p-4 rounded backdrop-blur-sm">
           <div className="text-[10px] leading-tight opacity-50 font-mono text-[#FFD700]">
             POS_X: {handData.position.x.toFixed(3)}<br/>
             POS_Y: {handData.position.y.toFixed(3)}<br/>
             THEME: {shape}_V2.0
           </div>
        </div>
      </div>
    </div>
  );
};