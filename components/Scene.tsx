import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AppState } from '../types';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { TreeTopper } from './TreeTopper';

const SceneContent: React.FC<AppState> = (props) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Hand Control interaction
    const { present, position } = props.handData;
    
    // Target position logic
    const tx = present ? position.x * 5 : 0;
    const ty = present ? position.y * 5 : 0;
    
    // Smooth damp
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, tx, 0.1);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, ty, 0.1);
    
    // Auto rotate if formed and no hand
    if (props.mode === 'FORMED' && !present) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 25]} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        maxPolarAngle={Math.PI / 1.5}
        autoRotate={props.mode === 'FORMED' && !props.handData.present} 
        autoRotateSpeed={2.0}
      />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} intensity={500} castShadow />
      <pointLight position={[-10, 0, -10]} intensity={200} color="#ff0000" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <group ref={groupRef}>
        <Foliage shape={props.shape} formed={props.mode === 'FORMED'} />
        <Ornaments shape={props.shape} formed={props.mode === 'FORMED'} />
        <TreeTopper shape={props.shape} formed={props.mode === 'FORMED'} />
        
        {/* Floor Grid (Decoration) */}
        <gridHelper args={[50, 50, 0x444444, 0x222222]} position={[0, -8, 0]} />
      </group>

      <EffectComposer>
        <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export const Scene: React.FC<AppState> = (props) => {
  return (
    <div className="w-full h-screen bg-[#050505]">
      <Canvas 
        shadows 
        gl={{ 
          antialias: false, 
          toneMapping: THREE.ReinhardToneMapping,
          toneMappingExposure: 1.5 
        }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
};
