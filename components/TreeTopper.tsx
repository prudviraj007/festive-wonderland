import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';

export const TreeTopper: React.FC<{ shape: ShapeType; formed: boolean }> = ({ shape, formed }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Memoize sparkle positions to avoid recreating array every frame
  const sparklePositions = useMemo(() => {
    const arr = new Float32Array(80 * 3);
    for (let i = 0; i < 80 * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 3;
    }
    return arr;
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Heartbeat scale
    const time = state.clock.elapsedTime;
    const beat = 1 + Math.sin(time * 8) * 0.1 + Math.sin(time * 2) * 0.05;
    
    if (formed) {
      // Lerp to top position
      let targetY = 8.5;
      if (shape === ShapeType.COKE) targetY = 8.5; // Bottle cap
      if (shape === ShapeType.SNOW) targetY = 0; // Center of flake (adjusted)
      
      // Force position to center X/Z when formed
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
      groupRef.current.scale.setScalar(beat);
    } else {
      // Float around
      groupRef.current.position.x = Math.sin(time) * 5;
      groupRef.current.position.y = Math.cos(time * 0.7) * 5;
      groupRef.current.position.z = Math.sin(time * 0.5) * 5;
      groupRef.current.scale.setScalar(1);
    }
    
    // Rotation
    groupRef.current.rotation.y += 0.01;
  });

  if (shape === ShapeType.COKE) {
    // Coke Cap style topper
    return (
      <group ref={groupRef}>
        <mesh>
          <cylinderGeometry args={[0.6, 0.6, 0.2, 32]} />
          <meshStandardMaterial color="#F40009" metalness={0.8} roughness={0.2} />
        </mesh>
        <pointLight intensity={2} distance={5} color="#ffffff" />
      </group>
    );
  }

  // Classic Star
  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh>
        <dodecahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={2} />
      </mesh>
      
      {/* Gyro Rings */}
      <GyroRing speed={1} radius={1} />
      <GyroRing speed={-0.8} radius={1.4} axis="x" />
      
      {/* Light */}
      <pointLight intensity={3} distance={10} color="#FFD700" />
      
      {/* Sparkles (simple implementation) */}
      <points>
        <bufferGeometry>
           <bufferAttribute 
             attach="attributes-position" 
             count={80} 
             array={sparklePositions} 
             itemSize={3} 
           />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#FFFF00" transparent opacity={0.6} />
      </points>
    </group>
  );
};

const GyroRing: React.FC<{ speed: number; radius: number; axis?: 'x'|'y'|'z' }> = ({ speed, radius, axis = 'y' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
       meshRef.current.rotation[axis === 'x' ? 'y' : 'x'] += speed * 0.02;
       meshRef.current.rotation.z += speed * 0.01;
    }
  });
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.05, 16, 100]} />
      <meshStandardMaterial color="#FFD700" metalness={1} roughness={0} />
    </mesh>
  );
}