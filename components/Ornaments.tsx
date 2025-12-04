import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';
import { ORNAMENT_COUNTS } from '../constants';

// Helper to get position on surface based on shape
const getShapePosition = (shape: ShapeType, idx: number, total: number): THREE.Vector3 => {
  const p = new THREE.Vector3();
  const ratio = idx / total;
  const h = (ratio * 16) - 8; // Height -8 to 8
  const angle = idx * 137.5; // Golden angle for distribution

  if (shape === ShapeType.TREE) {
    const r = (1 - (h + 8) / 16) * 5.5; 
    p.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
  } else if (shape === ShapeType.COKE) {
    // Precise Coke Bottle Contour (Synced with Foliage.tsx)
    let r = 1.0;
    
    // 1. Base & Lower Body (-8 to -1)
    if (h < -1) {
       const t = (h - (-8)) / 7.0; 
       r = (1-t)*(1-t)*2.6 + 2*(1-t)*t*3.6 + t*t*2.4;
    } 
    // 2. Waist & Label Area (-1 to 2.5)
    else if (h < 2.5) {
       const t = (h - (-1)) / 3.5; 
       r = (1-t)*(1-t)*2.4 + 2*(1-t)*t*1.7 + t*t*3.0;
    } 
    // 3. Shoulder (2.5 to 4.5)
    else if (h < 4.5) {
       const t = (h - 2.5) / 2.0;
       r = (1-t)*(1-t)*3.0 + 2*(1-t)*t*2.8 + t*t*1.0;
    } 
    // 4. Neck & Cap (4.5 to 8)
    else {
       r = 1.0 - (h - 4.5) * 0.05;
       if (h > 7.7) r = 1.1;
    }
    
    p.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
  } else if (shape === ShapeType.SNOW) {
    const arm = idx % 6;
    const dist = (idx / total) * 8;
    const armAngle = (arm / 6) * Math.PI * 2;
    p.set(Math.cos(armAngle) * dist, (Math.random()-0.5), Math.sin(armAngle) * dist);
  }
  return p;
};

interface OrnamentGroupProps {
  count: number;
  shape: ShapeType;
  formed: boolean;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  type: 'static' | 'pulse' | 'rotate' | 'swing';
  colorVariance?: string[];
  scale?: number;
}

const OrnamentGroup: React.FC<OrnamentGroupProps> = ({ 
  count, shape, formed, geometry, material, type, colorVariance, scale = 1 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Ref to store current interpolation factor (0 = chaos, 1 = formed)
  const lerpFactor = useRef(0);

  // Store target positions
  const targets = useMemo(() => {
    const t = [];
    for (let i = 0; i < count; i++) {
      t.push(getShapePosition(shape, i, count));
    }
    return t;
  }, [shape, count]);

  // Store random starting positions
  const randoms = useMemo(() => {
    const r = [];
    for (let i = 0; i < count; i++) {
      r.push(new THREE.Vector3((Math.random()-0.5)*30, (Math.random()-0.5)*30, (Math.random()-0.5)*30));
    }
    return r;
  }, [count]);

  const colors = useMemo(() => {
    if (!colorVariance) return null;
    const c = new Float32Array(count * 3);
    for (let i=0; i<count; i++) {
      const col = new THREE.Color(colorVariance[Math.floor(Math.random() * colorVariance.length)]);
      c[i*3] = col.r;
      c[i*3+1] = col.g;
      c[i*3+2] = col.b;
    }
    return c;
  }, [colorVariance, count]);

  useLayoutEffect(() => {
    if (meshRef.current && colors) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    }
  }, [colors]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Smoothly interpolate the 'formed' state
    const targetLerp = formed ? 1.0 : 0.0;
    lerpFactor.current = THREE.MathUtils.lerp(lerpFactor.current, targetLerp, delta * 3.0);
    
    const t = lerpFactor.current;
    
    for (let i = 0; i < count; i++) {
      const targetPos = targets[i];
      const chaosPos = randoms[i];
      
      // Calculate Chaos Position
      const cx = chaosPos.x + Math.sin(time + i) * 2;
      const cy = chaosPos.y + Math.cos(time * 0.5 + i) * 2;
      const cz = chaosPos.z;

      // Calculate Target Position
      let tx = targetPos.x;
      let ty = targetPos.y;
      let tz = targetPos.z;
      
      if (type === 'swing') {
        tx += Math.sin(time * 3 + i) * 0.1;
      }

      // Interpolate
      const x = THREE.MathUtils.lerp(cx, tx, t);
      const y = THREE.MathUtils.lerp(cy, ty, t);
      const z = THREE.MathUtils.lerp(cz, tz, t);

      dummy.position.set(x, y, z);
      
      const s = scale * (type === 'pulse' ? (1 + Math.sin(time * 5 + i)*0.2) : 1);
      
      // Scale up slightly when forming
      const finalScale = s * (0.8 + 0.2 * t);
      dummy.scale.set(finalScale, finalScale, finalScale);
      
      if (type === 'rotate') {
        dummy.rotation.x = time + i;
        dummy.rotation.y = time * 0.5 + i;
      } else {
        dummy.rotation.set(0,0,0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export const Ornaments: React.FC<{ shape: ShapeType; formed: boolean }> = (props) => {
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.2, 16, 16), []);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.3, 0.3, 0.3), []);
  const octaGeo = useMemo(() => new THREE.OctahedronGeometry(0.2), []);

  const metallicMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    metalness: 0.9, roughness: 0.1, envMapIntensity: 1 
  }), []);
  
  const lightMat = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xffffff, toneMapped: false 
  }), []);

  const gemMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    transmission: 0.9, roughness: 0, thickness: 1, color: 0xff00ff
  }), []);

  return (
    <group>
      {/* Balls */}
      <OrnamentGroup 
        {...props} 
        count={ORNAMENT_COUNTS.BALLS} 
        geometry={sphereGeo} 
        material={metallicMat} 
        type="static"
        colorVariance={['#D4AF37', '#C41E3A', '#228B22', '#FFFFFF']}
      />
      {/* Lights */}
      <OrnamentGroup 
        {...props} 
        count={ORNAMENT_COUNTS.LIGHTS} 
        geometry={sphereGeo} 
        material={lightMat} 
        type="pulse"
        scale={0.5}
      />
      {/* Gifts (Boxes) */}
      <OrnamentGroup 
        {...props} 
        count={ORNAMENT_COUNTS.GIFTS} 
        geometry={boxGeo} 
        material={metallicMat} 
        type="static"
        colorVariance={['#F40009', '#00FF00', '#FFD700']}
      />
       {/* Gems */}
       <OrnamentGroup 
        {...props} 
        count={ORNAMENT_COUNTS.GEMS} 
        geometry={octaGeo} 
        material={gemMat} 
        type="rotate"
      />
    </group>
  );
};